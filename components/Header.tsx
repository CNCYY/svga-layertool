
import React, { useState, useRef, useEffect } from 'react';
import { Palette, DownloadCloud, Box, Film, Database, HardDrive, FileUp, Image as ImageIcon, Trash2 } from 'lucide-react';
import { SVGAVideoItem } from '../types';

interface HeaderProps {
  videoItem: SVGAVideoItem | null;
  fileName: string;
  fileSize: number;
  exporting: boolean;
  exportSuccess: boolean;
  onExport: () => void;
  onNewUpload: () => void;
  onClear: () => void;
  onSeekFrame: (frame: number) => void;
  onExtractThumbnail: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  videoItem, fileName, fileSize, exporting, exportSuccess, onExport, onNewUpload, onClear, onSeekFrame, onExtractThumbnail
}) => {
  const [showThumbPanel, setShowThumbPanel] = useState(false);
  const [currentThumbFrame, setCurrentThumbFrame] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setShowThumbPanel(false);
      }
    };
    if (showThumbPanel) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showThumbPanel]);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const estimateMemory = () => {
    if (!videoItem?.images) return '0 B';
    const totalChars: number = (Object.values(videoItem.images) as string[]).reduce((acc: number, cur: string) => acc + (cur?.length || 0), 0);
    return formatSize(Math.floor(totalChars / 1.37));
  };

  const totalFrames = videoItem?.frames || videoItem?.movie?.frames || 0;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const frame = parseInt(e.target.value, 10);
    setCurrentThumbFrame(frame);
    onSeekFrame(frame);
  };

  return (
    <header className="h-24 flex items-center justify-between px-10 z-50 shrink-0 bg-transparent border-b border-white/5">
      <div className="flex items-center gap-4 group">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 border border-white/20 rounded-xl flex items-center justify-center bg-white/5 shadow-inner">
            <Palette className="w-5 h-5 text-zinc-100" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-black tracking-widest uppercase text-zinc-100">
              Edit Svga Layer
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
            <button 
            onClick={onNewUpload}
            className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white"
            >
            <FileUp size={14} />
            <span>Import New</span>
            </button>

            {videoItem && (
                <button 
                onClick={onClear}
                className="flex items-center gap-2 px-4 py-2 border border-rose-500/20 rounded-lg bg-rose-500/5 hover:bg-rose-500/10 transition-all text-[10px] font-black uppercase tracking-widest text-rose-500/60 hover:text-rose-400"
                >
                <Trash2 size={14} />
                <span>Clear</span>
                </button>
            )}
        </div>
      </div>

      <div className="flex items-center gap-6">
        {videoItem && (
          <>
            <div className="flex items-center gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl shadow-inner">
              <div className="flex flex-col px-4 border-r border-white/5">
                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-0.5">Active Asset</span>
                <span className="text-[11px] font-bold text-zinc-300 max-w-[140px] truncate">{fileName}</span>
              </div>
              
              <div className="flex items-center gap-5 px-4">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Box size={10} className="text-indigo-400" />
                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Dimension</span>
                  </div>
                  <p className="text-[11px] font-black text-zinc-100">{videoItem.videoSize?.width}x{videoItem.videoSize?.height}</p>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Film size={10} className="text-emerald-400" />
                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Playback</span>
                  </div>
                  <p className="text-[11px] font-black text-zinc-100">{videoItem.FPS} FPS <span className="text-[9px] text-zinc-500 font-bold ml-1">({videoItem.frames} FR)</span></p>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <HardDrive size={10} className="text-amber-400" />
                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">File Size</span>
                  </div>
                  <p className="text-[11px] font-black text-zinc-100">{formatSize(fileSize)}</p>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Database size={10} className="text-rose-400" />
                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Resource</span>
                  </div>
                  <p className="text-[11px] font-black text-zinc-100">{estimateMemory()}</p>
                </div>
              </div>
            </div>
            
            <div className="h-10 w-[1px] bg-white/10"></div>

            <div className="flex items-center gap-3 relative" ref={panelRef}>
                <button 
                    onClick={() => setShowThumbPanel(!showThumbPanel)}
                    className={`h-[42px] w-[42px] flex items-center justify-center rounded-xl border transition-all ${showThumbPanel ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-white/5 border-white/20 text-zinc-400 hover:text-white hover:bg-white/10'}`}
                    title="Extract Thumbnail"
                >
                    <ImageIcon size={18} />
                </button>

                {showThumbPanel && (
                    <div className="absolute top-14 right-0 w-72 bg-[#16191f] border border-white/10 rounded-2xl shadow-2xl p-4 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 z-50">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Select Frame</span>
                            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">{currentThumbFrame} / {totalFrames}</span>
                        </div>
                        
                        <input 
                            type="range" 
                            min="0" 
                            max={totalFrames} 
                            step="1"
                            value={currentThumbFrame}
                            onChange={handleSliderChange}
                            className="w-full accent-indigo-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        />

                        <button 
                            onClick={onExtractThumbnail}
                            className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                        >
                            <DownloadCloud size={14} />
                            Save as PNG
                        </button>
                    </div>
                )}

                <button 
                onClick={onExport} 
                disabled={exporting}
                className={`flex items-center gap-3 px-6 py-3 border border-white/20 rounded-xl bg-white/5 hover:bg-white/10 transition-all group/btn disabled:opacity-50 active:scale-95 ${exportSuccess ? 'border-emerald-500/50 bg-emerald-500/10' : ''}`}
                >
                <DownloadCloud className={`w-4 h-4 transition-transform ${exportSuccess ? 'text-emerald-500 scale-110' : 'text-zinc-100 group-hover/btn:scale-110'}`} />
                <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${exportSuccess ? 'text-emerald-500' : 'text-zinc-100'}`}>
                    {exporting ? 'Packing...' : exportSuccess ? 'Done' : 'Download SVGA'}
                </span>
                </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
};
