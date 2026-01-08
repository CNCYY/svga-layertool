
import React, { useState } from 'react';
import { SpriteDebugInfo } from '../types';
import { Bug, RefreshCw, X, Scissors } from 'lucide-react';

interface DebugPanelProps {
  importLog: SpriteDebugInfo[];
  exportLog: SpriteDebugInfo[];
  visible: boolean;
  onClose: () => void;
  onRefreshExport: () => void;
  exportLoading: boolean;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ 
  importLog, exportLog, visible, onClose, onRefreshExport, exportLoading 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!visible) return null;

  // Max rows to display to prevent performance issues
  const MAX_ROWS = 200;
  const rowsToRender = Math.min(Math.max(importLog.length, exportLog.length), MAX_ROWS);
  const isTruncated = importLog.length > MAX_ROWS || exportLog.length > MAX_ROWS;

  const renderCell = (val: string) => {
    if (!val) return <span className="text-zinc-700 italic text-[10px]">-</span>;
    return <span className="text-[10px] font-mono text-zinc-300 truncate block" title={val}>{val}</span>;
  };

  const renderTrim = (hasTrim: boolean) => {
    if (!hasTrim) return <span className="text-zinc-700 italic text-[10px]">-</span>;
    return (
        <div className="flex items-center gap-1 text-neon-primary" title="Has TrimPath (Stroke Animation)">
             <Scissors size={10} className="text-emerald-400" />
             <span className="text-[9px] font-bold text-emerald-400">Yes</span>
        </div>
    );
  };

  return (
    <div className={`fixed top-24 right-4 z-40 flex flex-col transition-all duration-300 ease-in-out ${isExpanded ? 'w-[900px] h-[600px]' : 'w-auto h-auto'}`}>
      
      {/* Header / Toggle */}
      <div className="bg-[#16191f] border border-white/10 rounded-t-xl p-3 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="bg-indigo-500/20 p-1.5 rounded-lg text-indigo-400">
            <Bug size={16} />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-zinc-200">
            Structure Diff Log {isExpanded ? '' : `(${importLog.length} Sprites)`}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {isExpanded && (
            <button 
              onClick={onRefreshExport} 
              disabled={exportLoading}
              className="p-1.5 hover:bg-white/5 rounded text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
              title="Re-compare Export"
            >
              <RefreshCw size={14} className={exportLoading ? 'animate-spin' : ''} />
            </button>
          )}
          <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded text-zinc-400 hover:text-rose-400 transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="flex-1 bg-[#0f1115]/95 backdrop-blur-md border-x border-b border-white/10 rounded-b-xl overflow-hidden flex flex-col shadow-2xl">
          
          {/* Table Header */}
          <div className="flex border-b border-white/5 bg-white/5 text-[9px] font-black text-zinc-500 uppercase tracking-widest text-center">
            <div className="flex-1 flex">
              <div className="w-10 py-2 border-r border-white/5">#</div>
              <div className="w-20 py-2 border-r border-white/5">Key</div>
              <div className="w-20 py-2 border-r border-white/5">Matte</div>
              <div className="w-20 py-2 border-r border-white/5">Mask</div>
              <div className="w-12 py-2 border-r border-white/5">Trim</div>
              <div className="flex-1 py-2">Blend</div>
            </div>
            <div className="w-[1px] bg-white/10"></div>
            <div className="flex-1 flex">
               {/* Export Headers same structure */}
               <div className="w-10 py-2 border-r border-white/5">#</div>
              <div className="w-20 py-2 border-r border-white/5">Key</div>
              <div className="w-20 py-2 border-r border-white/5">Matte</div>
              <div className="w-20 py-2 border-r border-white/5">Mask</div>
               <div className="w-12 py-2 border-r border-white/5">Trim</div>
              <div className="flex-1 py-2">Blend</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="flex flex-col relative">
              {/* Rows */}
              {Array.from({ length: rowsToRender }).map((_, i) => {
                const imp = importLog[i];
                const exp = exportLog[i];
                
                // Diff Logic
                const isMissingRow = imp && !exp; // Existed in import, gone in export
                // Check for data loss: Import had value, Export is empty
                const lostMatte = imp?.matteKey && !exp?.matteKey;
                const lostMask = imp?.maskPath && !exp?.maskPath;
                const lostTrim = imp?.hasTrimPath && !exp?.hasTrimPath;
                const lostBlend = imp?.blendMode && (!exp?.blendMode || exp.blendMode === 'NORMAL') && imp.blendMode !== 'NORMAL';
                
                // Color coding
                const rowBg = isMissingRow ? 'bg-rose-900/20' : i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]';
                
                const getCellClass = (isLost: boolean) => 
                  `border-r border-white/5 px-2 py-1.5 flex items-center overflow-hidden ${isLost ? 'bg-amber-500/20 text-amber-200' : ''}`;

                return (
                  <div key={i} className={`flex text-xs border-b border-white/5 hover:bg-white/5 transition-colors ${rowBg}`}>
                    
                    {/* LEFT: IMPORT */}
                    <div className="flex-1 flex min-w-0">
                      <div className="w-10 text-center py-1.5 border-r border-white/5 text-zinc-600 font-mono">{i}</div>
                      <div className="w-20 border-r border-white/5 px-2 py-1.5 flex items-center overflow-hidden">
                         {renderCell(imp?.imageKey)}
                      </div>
                      <div className="w-20 border-r border-white/5 px-2 py-1.5 flex items-center overflow-hidden">
                         {renderCell(imp?.matteKey)}
                      </div>
                      <div className="w-20 border-r border-white/5 px-2 py-1.5 flex items-center overflow-hidden">
                         {renderCell(imp?.maskPath)}
                      </div>
                      <div className="w-12 border-r border-white/5 px-2 py-1.5 flex items-center justify-center overflow-hidden">
                         {renderTrim(imp?.hasTrimPath)}
                      </div>
                      <div className="flex-1 px-2 py-1.5 flex items-center overflow-hidden">
                         {renderCell(imp?.blendMode)}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="w-[1px] bg-white/10 shrink-0"></div>

                    {/* RIGHT: EXPORT */}
                    <div className="flex-1 flex min-w-0">
                       <div className="w-10 text-center py-1.5 border-r border-white/5 text-zinc-600 font-mono">{exp ? i : '-'}</div>
                       <div className="w-20 border-r border-white/5 px-2 py-1.5 flex items-center overflow-hidden">
                         {renderCell(exp?.imageKey)}
                      </div>
                      <div className={getCellClass(!!lostMatte)}>
                         {renderCell(exp?.matteKey)}
                      </div>
                      <div className={getCellClass(!!lostMask)}>
                         {renderCell(exp?.maskPath)}
                      </div>
                      <div className={getCellClass(!!lostTrim).replace('flex', 'flex justify-center')}>
                         {renderTrim(exp?.hasTrimPath)}
                      </div>
                      <div className={getCellClass(!!lostBlend) + " flex-1"}>
                         {renderCell(exp?.blendMode)}
                      </div>
                    </div>

                  </div>
                );
              })}
              
              {isTruncated && (
                 <div className="p-4 text-center text-[10px] font-bold text-zinc-500 bg-white/5">
                    Rows truncated for performance (Max {MAX_ROWS})
                 </div>
              )}
              
              {!importLog.length && (
                 <div className="p-8 text-center text-zinc-600 text-xs italic">
                    Waiting for SVGA import...
                 </div>
              )}
            </div>
          </div>
          
          {/* Legend */}
          <div className="bg-black/20 p-2 border-t border-white/5 flex gap-4 text-[9px] font-bold text-zinc-500 uppercase tracking-wide justify-end px-4">
             <div className="flex items-center gap-1.5">
               <div className="w-2 h-2 rounded-full bg-rose-900/50 border border-rose-500/30"></div>
               <span>Missing Sprite</span>
             </div>
             <div className="flex items-center gap-1.5">
               <div className="w-2 h-2 rounded-full bg-amber-500/20 border border-amber-500/30"></div>
               <span>Property Lost</span>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
