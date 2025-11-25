
import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { NotesPage } from './pages/Notes';
import { BehaviorCard } from './components/BehaviorCard';
import { CrisisModal } from './components/CrisisModal';
import { CelebrationModal } from './components/CelebrationModal';
import { MediaPlayer } from './components/MediaPlayer';
import { ImageViewer } from './components/ImageViewer';
import { dbService } from './services/storage';
import { AppData, Media } from './types';
import { audioService } from './services/audio';
import { analyticsService } from './services/analytics';
import { progressService } from './services/progress';

export default function App() {
  const [appData, setAppData] = useState<AppData | null>(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [loading, setLoading] = useState(true);
  const [crisisOpen, setCrisisOpen] = useState(false);
  const [audioState, setAudioState] = useState({ isPlaying: false, currentId: null as string | null, isLoading: false });
  const [randomVideo, setRandomVideo] = useState<Media | null>(null);
  const [celebrationData, setCelebrationData] = useState<{show: boolean; message: string; starsEarned: number} | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await dbService.init();

        // Check server hash first
        const hashRes = await fetch('/data-hash.php');
        const { hash: serverHash } = await hashRes.json();

        // Get stored hash and data
        const storedHash = await dbService.getDataHash();
        let data = await dbService.getAppData();

        // Only fetch new data if hash changed or no data exists
        if (!data || storedHash !== serverHash) {
          console.log('Data updated on server, fetching new version...');
          const oldData = data; // Keep old data to preserve checkbox states
          const res = await fetch('/data.json');
          if (res.ok) {
            const newData = await res.json();

            // Merge: preserve user's checkbox states from old data
            if (oldData && newData) {
              Object.keys(newData).forEach(sectionKey => {
                const newSection = newData[sectionKey];
                const oldSection = oldData[sectionKey];

                if (oldSection && newSection) {
                  // Preserve checked state for offender_behavior
                  if (newSection.offender_behavior && oldSection.offender_behavior) {
                    newSection.offender_behavior.forEach((item: any) => {
                      const oldItem = oldSection.offender_behavior.find((o: any) => o.ref === item.ref);
                      if (oldItem?.checked) item.checked = true;
                    });
                  }

                  // Preserve checked state for victim_behavior
                  if (newSection.victim_behavior && oldSection.victim_behavior) {
                    newSection.victim_behavior.forEach((item: any) => {
                      const oldItem = oldSection.victim_behavior.find((v: any) => v.ref === item.ref);
                      if (oldItem?.checked) item.checked = true;
                    });
                  }
                }
              });
            }

            data = newData;
            if (data) {
              await dbService.saveAppData(data);
              await dbService.saveDataHash(serverHash);
            }
          }
        } else {
          console.log('Using cached data (hash match)');
        }

        if (data) setAppData(data);
      } catch (error) {
        console.error("Failed to load data", error);
        // Fallback: try to use cached data if hash check fails
        try {
          const data = await dbService.getAppData();
          if (data) setAppData(data);
        } catch (e) {
          console.error("Failed to load cached data", e);
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const unsubscribe = audioService.subscribe((state) => {
      setAudioState(state);
    });
    return unsubscribe;
  }, []);

  // Helper function to calculate total items
  const getTotalItems = () => {
    if (!appData) return 0;
    return Object.values(appData).reduce((total, section) => {
      return total + (section.offender_behavior?.length || 0) + (section.victim_behavior?.length || 0);
    }, 0);
  };

  // Subscribe to progress service and check for milestones
  useEffect(() => {
    if (!appData) return; // Don't check milestones until data is loaded

    const unsubscribe = progressService.subscribe(() => {
      const totalItems = getTotalItems();
      if (totalItems > 0) {
        const milestone = progressService.checkMilestone(totalItems);

        if (milestone) {
          setCelebrationData({
            show: true,
            message: milestone.message,
            starsEarned: milestone.starsEarned
          });
        }
      }
    });

    return unsubscribe;
  }, [appData]);

  // Fetch random video and track view when section changes
  useEffect(() => {
    const fetchRandomVideo = async () => {
      if (currentPage === 'home' || currentPage === 'notes') {
        setRandomVideo(null);
        return;
      }

      // Track section view
      analyticsService.trackView(currentPage);

      try {
        const response = await fetch('/random-video.php');
        if (response.ok) {
          const video = await response.json();
          console.log('Fetched random video:', video);
          setRandomVideo(video);
        } else {
          console.error('Failed to fetch random video', response.status);
          setRandomVideo(null);
        }
      } catch (error) {
        console.error('Error fetching random video:', error);
        setRandomVideo(null);
      }
    };

    fetchRandomVideo();
  }, [currentPage]);

  const handleToggleItem = useCallback(async (sectionKey: string, type: 'offender_behavior' | 'victim_behavior', ref: string) => {
    if (!appData) return;
    
    const newData = { ...appData };
    const section = newData[sectionKey];
    if (!section) return;
    
    const list = section[type];
    if (!list) return;

    const itemIndex = list.findIndex(i => i.ref === ref);
    if (itemIndex === -1) return;

    list[itemIndex].checked = !list[itemIndex].checked;
    
    setAppData(newData);
    await dbService.saveAppData(newData);
  }, [appData]);

  const handleExport = async () => {
    const json = await dbService.exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nade-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-zinc-800 border-t-emerald-500 rounded-full animate-spin"></div>
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-zinc-600">Initializing Secure Environment</span>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (currentPage === 'home') {
      return <Home onStart={() => {
        if (appData) {
          const firstKey = Object.keys(appData)[0];
          if (firstKey) setCurrentPage(firstKey);
        }
      }} />;
    }

    if (currentPage === 'notes') {
      return <NotesPage appData={appData} />;
    }

    const section = appData?.[currentPage];
    if (!section) return <div>Section not found</div>;

    const sectionAudioId = `section-${currentPage}-header`;
    const isCurrentSection = audioState.currentId === sectionAudioId;
    const isSectionPlaying = isCurrentSection && audioState.isPlaying;
    const isSectionLoading = isCurrentSection && audioState.isLoading;

    const scrollToSection = (sectionId: string) => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    return (
      <div className="space-y-12 pb-32">
        <header className="space-y-6 border-b border-zinc-800 pb-10">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-4xl font-bold text-white leading-tight">{section.title}</h2>
            <button
              onClick={() => audioService.toggle(sectionAudioId, `${section.title}. ${section.intro || ''}. ${section.description || ''}`)}
              className={`flex-shrink-0 p-3 rounded-full border transition-all duration-300 ${
                isCurrentSection
                  ? 'bg-emerald-900/40 border-emerald-500/40 text-emerald-400'
                  : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-emerald-400'
              }`}
              title={isSectionPlaying ? "Pause" : "Listen to section overview"}
            >
              {isSectionLoading ? (
                <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : isSectionPlaying ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1"></rect>
                  <rect x="14" y="4" width="4" height="16" rx="1"></rect>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              )}
            </button>
          </div>
          {section.intro && <p className="text-xl text-emerald-400/90 font-medium italic leading-relaxed">{section.intro}</p>}
          {section.description && <p className="text-lg text-zinc-400 leading-relaxed max-w-4xl">{section.description}</p>}

          {/* Quick Navigation Buttons */}
          <div className="flex items-center gap-3 pt-4">
            {section.offender_behavior && section.offender_behavior.length > 0 && (
              <button
                onClick={() => scrollToSection('offender-section')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-rose-500/40 text-zinc-400 hover:text-rose-400 transition-all text-sm font-medium"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                Offender's Behavior
              </button>
            )}
            {section.victim_behavior && section.victim_behavior.length > 0 && (
              <button
                onClick={() => scrollToSection('victim-section')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-500/40 text-zinc-400 hover:text-emerald-400 transition-all text-sm font-medium"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Victim's Response
              </button>
            )}
          </div>
        </header>

        {/* Media Section */}
        {randomVideo && (
          <div className="mb-12">
            {(randomVideo.type === 'video' || randomVideo.type === 'audio') && (
              <MediaPlayer key={randomVideo.id} media={randomVideo} />
            )}
            {randomVideo.type === 'image' && (
              <ImageViewer key={randomVideo.id} media={randomVideo} />
            )}
          </div>
        )}

        {section.offender_behavior && section.offender_behavior.length > 0 && (
          <section id="offender-section" className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 scroll-mt-24">
            <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-4 uppercase tracking-wider">
              <span className="w-1.5 h-8 bg-rose-500 rounded-full"></span>
              Offender's Behavior
            </h3>
            <div className="grid gap-5 md:grid-cols-1 xl:grid-cols-2">
              {section.offender_behavior.map(item => (
                <BehaviorCard 
                  key={item.ref} 
                  item={item} 
                  sectionKey={currentPage}
                  type="offender"
                  onToggle={() => handleToggleItem(currentPage, 'offender_behavior', item.ref)}
                />
              ))}
            </div>
          </section>
        )}

        {section.victim_behavior && section.victim_behavior.length > 0 && (
          <section id="victim-section" className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 scroll-mt-24">
            <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-4 uppercase tracking-wider">
              <span className="w-1.5 h-8 bg-emerald-500 rounded-full"></span>
              Victim's Response
            </h3>
            <div className="grid gap-5 md:grid-cols-1 xl:grid-cols-2">
              {section.victim_behavior.map(item => (
                <BehaviorCard 
                  key={item.ref} 
                  item={item} 
                  sectionKey={currentPage}
                  type="victim"
                  onToggle={() => handleToggleItem(currentPage, 'victim_behavior', item.ref)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    );
  };

  return (
    <Layout
      appData={appData}
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      onExport={handleExport}
      onOpenCrisis={() => setCrisisOpen(true)}
    >
      {renderContent()}
      <CrisisModal isOpen={crisisOpen} onClose={() => setCrisisOpen(false)} />
      {celebrationData && (
        <CelebrationModal
          isOpen={celebrationData.show}
          message={celebrationData.message}
          starsEarned={celebrationData.starsEarned}
          onClose={() => setCelebrationData(null)}
        />
      )}
    </Layout>
  );
}
