
import React, { useState, useEffect } from 'react';
import { AppData } from '../types';
import { progressService } from '../services/progress';

interface LayoutProps {
  children: React.ReactNode;
  appData: AppData | null;
  currentPage: string;
  onNavigate: (page: string) => void;
  onExport: () => void;
  onOpenCrisis: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  appData,
  currentPage,
  onNavigate,
  onExport,
  onOpenCrisis
}) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [starsEarned, setStarsEarned] = useState(0);

  // Subscribe to progress updates
  useEffect(() => {
    const unsubscribe = progressService.subscribe((data) => {
      setStarsEarned(data.starsEarned);
    });
    return unsubscribe;
  }, []);

  // Close sidebar on route change for mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [currentPage]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-900 selection:text-emerald-50">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-900 z-50 flex items-center justify-between px-4">
        <button
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="p-2 text-zinc-400 hover:text-white transition-colors rounded-md hover:bg-zinc-900"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18"/>
          </svg>
        </button>
        <div className="flex flex-col items-center">
          <span className="font-bold text-sm tracking-widest text-zinc-100 uppercase">C4N</span>
          {/* Star Collection Display */}
          <div className="flex items-center gap-0.5 mt-0.5">
            {Array.from({ length: 10 }, (_, i) => (
              <span
                key={i}
                className={`text-[10px] transition-all ${
                  i < starsEarned ? 'text-yellow-400' : 'text-zinc-700'
                }`}
              >
                {i < starsEarned ? '⭐' : '☆'}
              </span>
            ))}
          </div>
        </div>
        <div className="w-8"></div> {/* Spacer */}
      </header>

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-zinc-950 border-r border-zinc-900 transform transition-transform duration-300 ease-out flex flex-col
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 shadow-2xl lg:shadow-none`}
      >
        <div className="h-32 flex items-center px-8">
          <span className="text-3xl mr-3 filter drop-shadow-md">🤍</span>
          <div className="flex-1">
            <span className="font-bold text-2xl tracking-tight text-white block">For N from C</span>
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold">How and Why?</span>
            {/* Star Collection Display */}
            <div className="flex items-center justify-center gap-1 mt-2">
              {Array.from({ length: 10 }, (_, i) => (
                <span
                  key={i}
                  className={`text-sm transition-all ${
                    i < starsEarned ? 'text-yellow-400' : 'text-zinc-700'
                  }`}
                >
                  {i < starsEarned ? '⭐' : '☆'}
                </span>
              ))}
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-4 space-y-1 custom-scrollbar">
          <button
            onClick={() => onNavigate('home')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 group
              ${currentPage === 'home'
                ? 'bg-zinc-900 text-white shadow-inner ring-1 ring-inset ring-zinc-800'
                : 'text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-200'}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={currentPage === 'home' ? 'text-emerald-500' : 'group-hover:text-zinc-300'}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            </svg>
            Home
          </button>

          <button
            onClick={() => onNavigate('notes')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 group
              ${currentPage === 'notes'
                ? 'bg-zinc-900 text-white shadow-inner ring-1 ring-inset ring-zinc-800'
                : 'text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-200'}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={currentPage === 'notes' ? 'text-emerald-500' : 'group-hover:text-zinc-300'}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            My Notes
          </button>

          <div className="my-4 pt-4 border-t border-zinc-900/50">
            <h3 className="px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-700 mb-2">Modules</h3>
            {appData && Object.entries(appData).map(([key, section]) => {
              // Calculate section progress
              const sectionItems = [
                ...(section.offender_behavior?.map(item => item.ref) || []),
                ...(section.victim_behavior?.map(item => item.ref) || [])
              ];
              const { done, total } = progressService.getSectionProgress(sectionItems);
              const isComplete = done === total && total > 0;

              return (
                <button
                  key={key}
                  onClick={() => onNavigate(key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group mb-1
                    ${currentPage === key
                      ? 'bg-zinc-900 text-white shadow-inner ring-1 ring-inset ring-zinc-800'
                      : 'text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-200'}`}
                >
                  <svg className={`flex-shrink-0 transition-colors ${currentPage === key ? 'text-emerald-500' : 'group-hover:text-zinc-300'}`} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                  <span className="truncate text-left flex-1">{section.title}</span>
                  {total > 0 && (
                    <span className="text-xs font-semibold ml-auto">
                      {isComplete ? (
                        <span className="text-yellow-400">⭐</span>
                      ) : (
                        <span className="text-zinc-600">{done}/{total}</span>
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="p-4 bg-zinc-950 border-t border-zinc-900 space-y-3">
          <a
            href="/privacy.html"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-800 hover:border-zinc-700"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Privacy & Security
          </a>
          <button
            onClick={onExport}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-800 hover:border-zinc-700"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m14-7l-5-5m0 0L7 8m5-5v12"/>
            </svg>
            Export Data
          </button>
          <button
            onClick={onOpenCrisis}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-all shadow-lg shadow-rose-900/30 hover:shadow-rose-900/50"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Crisis Support
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="lg:ml-72 pt-16 lg:pt-0 min-h-screen transition-all duration-300 bg-zinc-950">
        <div className="max-w-6xl mx-auto p-6 lg:p-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
};
