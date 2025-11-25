import React from 'react';

interface CrisisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CrisisModal: React.FC<CrisisModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden animate-in slide-in-from-bottom-8 duration-300 max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🆘</span> Crisis Resources
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-8">
          <section>
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-500 mb-4">Immediate Help</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <ResourceCard 
                title="Emergency Services" 
                phone="10111" 
                desc="Call immediately if you are in danger." 
                altPhone=""
              />
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-4">International Support</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <ResourceCard 
                title="GBV Command Centre" 
                phone="0800 428 428" 
                desc="South Africa (Toll-free)" 
              />
              <ResourceCard 
                title="Someone who cares" 
                phone="+27 68 009 7995" 
                desc="🤍 I will always be here 🤍" 
              />
            </div>
          </section>

          <div className="p-4 rounded-lg bg-amber-900/20 border border-amber-900/50 text-amber-200 text-sm">
            <strong>⚠️ Safety Warning:</strong> If you suspect your device is being monitored, please use a safer computer or phone. Consider clearing your browser history after visiting this site.
          </div>
        </div>
        
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const ResourceCard = ({ title, phone, desc, altPhone }: { title: string, phone: string, desc: string, altPhone?: string }) => (
  <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 hover:border-zinc-600 transition-colors">
    <h4 className="font-semibold text-white mb-1">{title}</h4>
    <a href={`tel:${phone.replace(/\D/g,'')}`} className="text-xl font-bold text-emerald-400 hover:underline block mb-1">{phone}</a>
    {altPhone && <div className="text-sm text-zinc-400 mb-1">{altPhone}</div>}
    <p className="text-sm text-zinc-500">{desc}</p>
  </div>
);