import React, { useEffect, useState } from 'react';

interface CelebrationModalProps {
  isOpen: boolean;
  message: string;
  starsEarned: number;
  onClose: () => void;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({ isOpen, message, starsEarned, onClose }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md transition-opacity duration-300 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      <div
        className={`relative max-w-md w-full bg-gradient-to-br from-emerald-900/90 to-zinc-900/90 rounded-2xl p-8 border-2 border-emerald-500/50 shadow-2xl transform transition-all duration-500 ${
          isAnimating ? 'scale-100 rotate-0' : 'scale-0 rotate-180'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Star animation */}
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
        }`}>
          <svg
            className="w-32 h-32 text-yellow-400 animate-pulse"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center space-y-6">
          <div className="text-6xl font-bold text-yellow-400 animate-bounce">
            ⭐
          </div>

          <h2 className="text-3xl font-bold text-white">
            Star #{starsEarned}!
          </h2>

          <p className="text-lg text-emerald-100 leading-relaxed">
            {message}
          </p>

          <button
            onClick={handleClose}
            className="mt-6 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};
