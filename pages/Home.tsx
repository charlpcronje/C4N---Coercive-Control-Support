
import React from 'react';

export const Home: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  return (
    <div className="max-w-4xl mx-auto pt-8">
      <div className="mb-16 text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-emerald-500 mb-6 uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Secure • Private • Offline-Ready
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight tracking-tight">
          Understanding <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-600">Relationship Patterns</span>
        </h1>
        <p className="text-xl text-zinc-400 leading-relaxed mb-10 max-w-2xl">
          A world-class, private tool designed to help you recognize behavioral patterns, track your experiences, and find clarity in complex relationship dynamics.
        </p>
        <button 
          onClick={onStart}
          className="group relative px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-emerald-50 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.1)] overflow-hidden"
        >
          <span className="relative z-10 flex items-center gap-2">
            Start Exploring
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:translate-x-1 transition-transform"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </span>
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <FeatureCard 
          icon="🛡️" 
          title="Private & Secure" 
          desc="All data lives strictly on your device. No accounts, no cloud, no tracking cookies."
        />
        <FeatureCard 
          icon="👁️" 
          title="Recognize Patterns" 
          desc="Browse categorized behaviors to identify manipulation or coercion with clarity."
        />
        <FeatureCard 
          icon="📝" 
          title="Track Reality" 
          desc="Mark what you've experienced to combat gaslighting and regain your narrative."
        />
        <FeatureCard 
          icon="🔊" 
          title="High-Fidelity Audio" 
          desc="Listen to descriptions safely with integrated text-to-speech controls."
        />
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: { icon: string, title: string, desc: string }) => (
  <div className="p-6 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60 transition-all duration-300 group">
    <div className="text-3xl mb-4 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 origin-left">{icon}</div>
    <h3 className="text-lg font-bold text-zinc-100 mb-2 group-hover:text-emerald-400 transition-colors">{title}</h3>
    <p className="text-sm text-zinc-500 leading-relaxed group-hover:text-zinc-400 transition-colors">{desc}</p>
  </div>
);
