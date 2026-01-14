
import React from 'react';
import { Search, CheckSquare, Square, Grid } from 'lucide-react';
import { LayerReplacement } from '../types';
import { LayerCard } from './LayerCard';

interface SidebarProps {
  layers: LayerReplacement[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  loading: boolean;
  layerThumbBg: 'transparent' | 'black';
  setLayerThumbBg: (bg: 'transparent' | 'black') => void;
  onReplace: (key: string, file: File) => void;
  onRename: (key: string, newName: string) => void;
  onToggleHide: (key: string) => void;
  onReset: (key: string) => void;
  selectedLayerKeys: Set<string>;
  onSelectLayer: (key: string) => void;
  onSelectAll: (filteredKeys: string[]) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  layers, searchQuery, setSearchQuery, loading, layerThumbBg, setLayerThumbBg, onReplace, onRename, onToggleHide, onReset, 
  selectedLayerKeys, onSelectLayer, onSelectAll
}) => {
  const filteredLayers = layers.filter(l => l.displayName.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredKeys = filteredLayers.map(l => l.key);

  const isAllSelected = filteredLayers.length > 0 && filteredLayers.every(l => selectedLayerKeys.has(l.key));

  return (
    <aside className="w-[360px] border-r border-white/5 flex flex-col shrink-0 bg-transparent">
      <div className="p-6 pb-2">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-zinc-200 transition-colors" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:bg-white/10 focus:border-white/10 transition-all text-zinc-200"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 px-1">
            <div 
                className="flex items-center gap-2 cursor-pointer group"
                onClick={() => onSelectAll(filteredKeys)}
            >
                {isAllSelected ? (
                    <CheckSquare size={14} className="text-indigo-400" />
                ) : (
                    <Square size={14} className="text-zinc-600 group-hover:text-zinc-400" />
                )}
                <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-300 uppercase tracking-wider select-none">
                    Select All
                </span>
            </div>

            <div className="flex items-center gap-3">
                {/* Background Toggle for Layer Thumbs */}
                <div className="flex items-center bg-white/5 border border-white/5 rounded-lg p-0.5">
                    <button 
                        onClick={() => setLayerThumbBg('transparent')}
                        className={`p-1 rounded transition-all ${layerThumbBg === 'transparent' ? 'bg-white/10 text-indigo-400' : 'text-zinc-600 hover:text-zinc-400'}`}
                        title="Transparent Background"
                    >
                        <Grid size={12} />
                    </button>
                    <button 
                        onClick={() => setLayerThumbBg('black')}
                        className={`p-1 rounded transition-all ${layerThumbBg === 'black' ? 'bg-white/10 text-indigo-400' : 'text-zinc-600 hover:text-zinc-400'}`}
                        title="Black Background"
                    >
                        <Square size={12} fill={layerThumbBg === 'black' ? 'currentColor' : 'none'} />
                    </button>
                </div>

                <div className="shrink-0 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black px-3 py-1.5 rounded-lg tracking-tighter">
                    {selectedLayerKeys.size > 0 ? `${selectedLayerKeys.size} SELECTED` : `${layers.length} ASSETS`}
                </div>
            </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
        {filteredLayers.map((layer) => (
          <div 
            key={layer.key} 
            className={`
                border rounded-2xl overflow-hidden transition-all
                ${selectedLayerKeys.has(layer.key) 
                    ? 'bg-indigo-500/[0.05] border-indigo-500/30' 
                    : 'bg-white/[0.03] border-white/5 hover:border-white/10'
                }
            `}
          >
            <LayerCard 
              layer={layer} 
              thumbBg={layerThumbBg}
              onReplace={onReplace} 
              onRename={onRename}
              onToggleHide={onToggleHide} 
              // Fixed: Using the destructured prop name 'onReset' instead of undefined 'onLayerReset'
              onReset={onReset} 
              isSelected={selectedLayerKeys.has(layer.key)}
              onSelect={() => onSelectLayer(layer.key)}
            />
          </div>
        ))}
        {filteredLayers.length === 0 && !loading && layers.length > 0 && (
          <div className="py-20 text-center opacity-20 grayscale">
            <Search className="w-10 h-10 mx-auto mb-4" />
            <p className="text-[10px] font-bold uppercase tracking-widest">No matching layers</p>
          </div>
        )}
      </div>
    </aside>
  );
};
