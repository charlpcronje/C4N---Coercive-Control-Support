
import React, { useState, useEffect, useRef } from 'react';
import { BehaviorItem, Note } from '../types';
import { audioService } from '../services/audio';
import { dbService } from '../services/storage';
import { progressService } from '../services/progress';

interface BehaviorCardProps {
  item: BehaviorItem;
  sectionKey: string;
  type: 'offender' | 'victim';
  onToggle: () => void;
}

export const BehaviorCard: React.FC<BehaviorCardProps> = ({ item, sectionKey, type, onToggle }) => {
  const [audioState, setAudioState] = useState({ isPlaying: false, currentId: null as string | null, isLoading: false });
  const [justCopied, setJustCopied] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [isDone, setIsDone] = useState(false);

  // Hover tracking refs
  const hoverStartTime = useRef<number | null>(null);
  const totalHoverTime = useRef<number>(0);
  const hoverCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // TTS completion tracking
  const wasPlayingThisItem = useRef<boolean>(false);

  // Generate a consistent unique ID for this item
  const itemId = `${sectionKey}-${item.ref}`;

  // Check if item is done on mount and subscribe to progress changes
  useEffect(() => {
    setIsDone(progressService.isDone(item.ref));

    const unsubscribe = progressService.subscribe(() => {
      setIsDone(progressService.isDone(item.ref));
    });

    return unsubscribe;
  }, [item.ref]);

  // Audio service subscription - track TTS completion
  useEffect(() => {
    const unsubscribe = audioService.subscribe((state) => {
      setAudioState(state);

      // Track if this item is currently playing
      const isThisItemPlaying = state.currentId === itemId && state.isPlaying;

      // Detect TTS completion: was playing this item, now it's not
      if (wasPlayingThisItem.current && !isThisItemPlaying && !state.isLoading) {
        // TTS finished for this item
        if (!progressService.isDone(item.ref)) {
          progressService.markDone(item.ref);
        }
      }

      wasPlayingThisItem.current = isThisItemPlaying;
    });
    return unsubscribe;
  }, [itemId, item.ref]);

  useEffect(() => {
    loadNotes();
  }, [item.ref]);

  // Cleanup hover interval on unmount
  useEffect(() => {
    return () => {
      if (hoverCheckInterval.current) {
        clearInterval(hoverCheckInterval.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    // Start tracking hover time
    hoverStartTime.current = Date.now();

    // Check hover time every second
    hoverCheckInterval.current = setInterval(() => {
      if (hoverStartTime.current !== null) {
        const currentHoverDuration = Date.now() - hoverStartTime.current;
        const cumulativeTime = totalHoverTime.current + currentHoverDuration;

        // Check if total hover time exceeds 30 seconds (30000ms)
        if (cumulativeTime >= 30000 && !progressService.isDone(item.ref)) {
          progressService.markDone(item.ref);
          if (hoverCheckInterval.current) {
            clearInterval(hoverCheckInterval.current);
            hoverCheckInterval.current = null;
          }
        }
      }
    }, 1000);
  };

  const handleMouseLeave = () => {
    // Accumulate hover time
    if (hoverStartTime.current !== null) {
      const currentHoverDuration = Date.now() - hoverStartTime.current;
      totalHoverTime.current += currentHoverDuration;
      hoverStartTime.current = null;
    }

    // Clear interval
    if (hoverCheckInterval.current) {
      clearInterval(hoverCheckInterval.current);
      hoverCheckInterval.current = null;
    }
  };

  const loadNotes = async () => {
    try {
      const itemNotes = await dbService.getNotesByItem(item.ref);
      setNotes(itemNotes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch (error) {
      console.error('Failed to load notes', error);
    }
  };

  const handleAddNote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!newNoteText.trim()) return;

    try {
      await dbService.addNote({
        sectionKey,
        itemRef: item.ref,
        text: newNoteText.trim(),
        timestamp: new Date().toISOString()
      });
      setNewNoteText('');
      await loadNotes();
    } catch (error) {
      console.error('Failed to add note', error);
    }
  };

  const handleDeleteNote = async (noteId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await dbService.deleteNote(noteId);
      await loadNotes();
    } catch (error) {
      console.error('Failed to delete note', error);
    }
  };

  const handleToggleNotes = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNotesOpen(!notesOpen);
  };

  const isCurrentItem = audioState.currentId === itemId;
  const isPlaying = isCurrentItem && audioState.isPlaying;
  const isLoading = isCurrentItem && audioState.isLoading;

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    let text = item.text;
    if (item.description) text += '. ' + item.description;
    if (item.example) text += '. Example: ' + item.example;
    
    audioService.toggle(itemId, text);
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const prompt = `Please analyze this ${type} behavior: "${item.text}". Context: ${item.description || ''}. Example: ${item.example || ''}`;
    try {
      await navigator.clipboard.writeText(prompt);
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group relative rounded-xl border transition-all duration-300 select-none overflow-hidden
        ${item.checked
          ? 'bg-zinc-900/80 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.05)]'
          : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/60'}`}
    >
      {/* Active Audio Indicator Background */}
      {isCurrentItem && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500/20 animate-pulse">
          <div className={`h-full bg-emerald-500/50 transition-all duration-500 ${isPlaying ? 'w-full' : 'w-1/2 opacity-50'}`}></div>
        </div>
      )}

      {/* Main Content Area */}
      <div onClick={onToggle} className="p-6 cursor-pointer">
        <div className="flex items-start gap-5">
          {/* Checkbox and Star Container */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            {/* Checkbox */}
            <div className={`mt-1 w-6 h-6 rounded flex items-center justify-center transition-all duration-300 border
              ${item.checked
                ? 'bg-emerald-500 border-emerald-500 text-zinc-950 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                : 'border-zinc-700 group-hover:border-zinc-500 bg-transparent'}`}
            >
              {item.checked && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </div>

            {/* Star when done */}
            {isDone && (
              <div className="flex flex-col items-center animate-in zoom-in-50 duration-500">
                <span className="text-yellow-400 text-lg">⭐</span>
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider">done</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className={`text-[15px] leading-snug font-medium mb-2 transition-colors ${item.checked ? 'text-emerald-50' : 'text-zinc-200'}`}>
              {item.text}
            </h4>

            {item.description && (
              <p className="text-sm text-zinc-400 leading-relaxed mb-3 font-light tracking-wide">
                {item.description}
              </p>
            )}

            {item.example && (
              <div className={`mt-3 text-sm p-3 rounded-lg border-l-2 transition-colors ${item.checked ? 'bg-zinc-900/50 border-emerald-500/30' : 'bg-zinc-950/50 border-zinc-700'}`}>
                <span className="text-[11px] font-bold uppercase tracking-widest opacity-60 block mb-1.5 text-zinc-500">Example</span>
                <span className="text-zinc-300 italic leading-relaxed">"{item.example}"</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer with Actions */}
      <div className="border-t border-zinc-800/50 px-2 sm:px-4 py-2 sm:py-3 bg-zinc-950/30 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200">
        <div className="flex items-center justify-start gap-0.5 sm:gap-1.5">
            <button
              onClick={handleCopy}
              className="flex-1 h-8 px-1 sm:px-2 rounded-md flex items-center justify-center gap-1 sm:gap-1.5 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-colors text-[10px] sm:text-xs font-medium uppercase tracking-wider"
              title="Copy Prompt"
            >
              {justCopied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500 flex-shrink-0 w-3 h-3 sm:w-3.5 sm:h-3.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span className="text-emerald-500 truncate">Copied</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 w-3 h-3 sm:w-3.5 sm:h-3.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  <span className="truncate">Copy</span>
                </>
              )}
            </button>

            <button
              onClick={handleSpeak}
              className={`flex-1 h-8 px-1 sm:px-2 rounded-md flex items-center justify-center gap-1 sm:gap-1.5 transition-colors text-[10px] sm:text-xs font-medium uppercase tracking-wider
                ${isCurrentItem
                  ? 'bg-zinc-800 text-emerald-400 shadow-inner'
                  : 'hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200'}`}
              title={isPlaying ? "Pause" : "Listen"}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin flex-shrink-0 w-3 h-3 sm:w-3.5 sm:h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="truncate">Load...</span>
                </>
              ) : isPlaying ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0 w-3 h-3 sm:w-3.5 sm:h-3.5"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                  <span className="truncate">Pause</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0 w-3 h-3 sm:w-3.5 sm:h-3.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                  <span className="truncate">{isCurrentItem ? "Resume" : "Listen"}</span>
                </>
              )}
            </button>

            <button
              onClick={handleToggleNotes}
              className={`relative flex-1 h-8 px-1 sm:px-2 rounded-md flex items-center justify-center gap-1 sm:gap-1.5 transition-colors text-[10px] sm:text-xs font-medium uppercase tracking-wider
                ${notesOpen
                  ? 'bg-zinc-800 text-emerald-400 shadow-inner'
                  : 'hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200'}`}
              title="Notes"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 w-3 h-3 sm:w-3.5 sm:h-3.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <span className="truncate">Notes</span>
              {notes.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-500 text-zinc-950 text-[10px] font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                  {notes.length}
                </span>
              )}
            </button>
        </div>
      </div>

      {/* Notes Section */}
      {notesOpen && (
        <div className="border-t border-zinc-800/50 p-6 bg-zinc-950/50" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-col gap-3">
            <textarea
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Add a note..."
              className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-200 text-sm placeholder-zinc-500 focus:outline-none focus:border-emerald-500 resize-none"
              rows={3}
            />
            <button
              onClick={handleAddNote}
              disabled={!newNoteText.trim()}
              className="self-end px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-xs font-medium uppercase tracking-wider rounded-md transition-colors"
            >
              Save Note
            </button>

            {notes.length > 0 && (
              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                <div className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Previous Notes</div>
                {notes.map(note => (
                  <div key={note.id} className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 group/note">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-zinc-300 flex-1 whitespace-pre-wrap">{note.text}</p>
                      <button
                        onClick={(e) => handleDeleteNote(note.id!, e)}
                        className="opacity-0 group-hover/note:opacity-100 text-zinc-500 hover:text-red-400 transition-all"
                        title="Delete note"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                    <div className="text-[10px] text-zinc-600 mt-1">
                      {new Date(note.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
