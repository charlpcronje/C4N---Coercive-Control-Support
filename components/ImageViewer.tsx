import React, { useState, useEffect } from 'react';
import { Media } from '../types';
import { analyticsService } from '../services/analytics';

interface ImageViewerProps {
  media: Media;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ media }) => {
  const [isEnlarged, setIsEnlarged] = useState(false);

  useEffect(() => {
    // Track view when component mounts
    analyticsService.trackView(media.id);
  }, [media.id]);

  const handleThumbnailClick = () => {
    setIsEnlarged(true);
    analyticsService.trackImageEnlargement(media.id);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEnlarged(false);
  };

  return (
    <>
      {/* Thumbnail */}
      <div
        onClick={handleThumbnailClick}
        className="w-full bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 cursor-pointer group hover:border-emerald-500/50 transition-all"
      >
        <div className="relative">
          <img
            src={media.thumbnail || media.url}
            alt={media.caption || 'Image'}
            className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Overlay with zoom icon */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/0 group-hover:bg-emerald-500/90 flex items-center justify-center transition-all">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="M21 21l-4.35-4.35"></path>
                <line x1="11" y1="8" x2="11" y2="14"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
              </svg>
            </div>
          </div>
        </div>

        {/* Caption */}
        {media.caption && (
          <div
            className="px-4 py-3 text-sm text-zinc-400 bg-zinc-950 [&_h5]:text-base [&_h5]:font-semibold [&_h5]:text-zinc-200 [&_h5]:mb-2 [&_p]:text-sm [&_p]:text-zinc-400 [&_p]:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: media.caption }}
          />
        )}
      </div>

      {/* Enlarged Modal */}
      {isEnlarged && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={handleClose}
        >
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-3 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 hover:border-emerald-500 transition-all z-10"
            title="Close"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <div className="max-w-7xl max-h-full flex flex-col items-center gap-4">
            <img
              src={media.url}
              alt={media.caption || 'Enlarged image'}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            {media.caption && (
              <div
                className="text-white text-center text-lg max-w-3xl px-4 [&_h5]:text-xl [&_h5]:font-semibold [&_h5]:text-white [&_h5]:mb-2 [&_p]:text-base [&_p]:text-zinc-200 [&_p]:leading-relaxed"
                dangerouslySetInnerHTML={{ __html: media.caption }}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};
