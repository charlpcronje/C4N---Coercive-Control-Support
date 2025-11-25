import React, { useState, useEffect } from 'react';
import { Note, AppData } from '../types';
import { dbService } from '../services/storage';

interface NotesPageProps {
  appData: AppData | null;
}

export const NotesPage: React.FC<NotesPageProps> = ({ appData }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllNotes();
  }, []);

  const loadAllNotes = async () => {
    try {
      const allNotes = await dbService.getAllNotes();
      setNotes(allNotes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch (error) {
      console.error('Failed to load notes', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    try {
      await dbService.deleteNote(noteId);
      await loadAllNotes();
    } catch (error) {
      console.error('Failed to delete note', error);
    }
  };

  const getItemDetails = (note: Note) => {
    if (!appData) return null;

    const section = appData[note.sectionKey];
    if (!section) return null;

    // Search in both offender and victim behavior
    const allItems = [
      ...(section.offender_behavior || []),
      ...(section.victim_behavior || [])
    ];

    const item = allItems.find(i => i.ref === note.itemRef);
    return item ? { item, sectionTitle: section.title } : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-zinc-800 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-6 text-zinc-700">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
        </svg>
        <h2 className="text-2xl font-bold text-zinc-400 mb-3">No Notes Yet</h2>
        <p className="text-zinc-600">Start adding notes to behavior items to see them here.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-32">
      <header className="mb-12">
        <h1 className="text-4xl font-bold text-white mb-3">My Notes</h1>
        <p className="text-zinc-400">All your personal notes in one place. {notes.length} note{notes.length !== 1 ? 's' : ''} total.</p>
      </header>

      <div className="space-y-4">
        {notes.map(note => {
          const details = getItemDetails(note);

          return (
            <div key={note.id} className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-all group">
              {details && (
                <div className="mb-4 pb-4 border-b border-zinc-800">
                  <div className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-2">
                    {details.sectionTitle}
                  </div>
                  <h3 className="text-lg font-medium text-zinc-200 mb-2">
                    {details.item.text}
                  </h3>
                  {details.item.description && (
                    <p className="text-sm text-zinc-500 leading-relaxed">
                      {details.item.description}
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
                    {note.text}
                  </p>
                  <div className="text-xs text-zinc-600 mt-3">
                    {new Date(note.timestamp).toLocaleString()}
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteNote(note.id!)}
                  className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-md transition-all"
                  title="Delete note"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
