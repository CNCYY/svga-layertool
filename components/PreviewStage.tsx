
import React from 'react';
import { UploadCloud, Play, Pause, Loader2 } from 'lucide-react';
import { LayerReplacement } from '../types';

interface PreviewStageProps {
  videoItem: any;
  loading: boolean;
  isDragging: boolean;
  canvasBg: 'transparent' | 'white' | 'black' | 'green';
  setCanvasBg: (bg: 'transparent' | 'white' | 'black' | 'green') => void;
  isPlaying: boolean;
  toggleAnimation: () => void;
  onUploadClick: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export const PreviewStage: React.FC<PreviewStageProps> = ({
  videoItem, loading, isDragging, canvasBg, setCanvasBg, isPlaying, toggleAnimation, onUploadClick, containerRef
}) => {
  return (
    <section className="flex-1 relative flex flex-col items-center justify-center p-10 transition-all duration-500 bg-[#07080a]">
      {/* Empty State */}
      {!videoItem && !loading && (
        <div className="flex flex-col items-center gap-8 cursor-pointer group" onClick={onUploadClick}>
          <div className="w-32 h-32 rounded-3xl border border-white/5 bg-white/5 flex items-center justify-center transition-all group-hover:scale-105 group-hover:bg-white/10 group-hover:border-white/10 shadow-2xl">
            <UploadCloud className="w-12 h-12 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-600 group-hover:text-zinc-400 transition-colors">Initialize Asset</p>
        </div>
      )}

      {/* Loading Overlay for already initialized items */}
      {loading && videoItem && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#07080a]/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Processing File...</p>
          </div>
        </div>
      )}

      {/* Actual loading spinner for first time load */}
      {loading && !videoItem && (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Loading Animation...</p>
        </div>
      )}

      {/* Preview Area - Keep visible even during loading if videoItem exists to maintain DOM stability */}
      {videoItem && (
        <div className={`relative w-full h-full flex items-center justify-center transition-opacity duration-300 ${loading ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
          {/* Swatches - Top Left */}
          <div className="absolute top-0 left-0 flex gap-4 p-2 z-10">
            {(['transparent', 'white', 'black', 'green'] as const).map(bg => (
              <button 
                key={bg} 
                onClick={() => setCanvasBg(bg)} 
                className={`w-8 h-8 rounded-full border-2 transition-all shadow-lg overflow-hidden ${canvasBg === bg ? 'border-indigo-500 scale-110' : 'border-zinc-800 hover:border-zinc-700'}`}
                style={{ 
                  backgroundColor: bg === 'transparent' ? '#ffffff' : bg,
                  backgroundImage: bg === 'transparent' ? 'conic-gradient(#f0f0f0 0.25turn, transparent 0.25turn 0.5turn, #f0f0f0 0.5turn 0.75turn, transparent 0.75turn)' : 'none',
                  backgroundSize: '8px 8px'
                }}
              />
            ))}
          </div>

          {/* Small Playback Control - Top Right as requested */}
          <div className="absolute top-0 right-0 p-2 z-10">
            <button 
              onClick={toggleAnimation} 
              className="w-12 h-12 bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-400 hover:text-white rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-95 group/play"
            >
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
            </button>
          </div>

          {/* Main Stage Container */}
          <div 
            className={`relative rounded-[40px] transition-all duration-700 overflow-hidden ${canvasBg === 'transparent' ? 'checkerboard-pattern-lg' : ''}`}
            style={canvasBg !== 'transparent' ? { backgroundColor: canvasBg } : {}}
          >
            <div ref={containerRef} className="max-w-[80vw] max-h-[60vh]" />
          </div>
        </div>
      )}
    </section>
  );
};
