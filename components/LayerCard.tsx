
import React, { useState, useRef, useEffect } from 'react';
import { EyeOff, Eye, Edit2, Square, CheckSquare } from 'lucide-react';
import { LayerReplacement } from '../types';
import { TRANSPARENT_PIXEL } from '../constants';

interface LayerCardProps {
  layer: LayerReplacement;
  onReplace: (key: string, file: File) => void;
  onRename: (key: string, newName: string) => void;
  onToggleHide: (key: string) => void;
  onReset: (key: string) => void;
  isSelected: boolean;
  onSelect: () => void;
}

export const LayerCard: React.FC<LayerCardProps> = ({ 
    layer, onReplace, onRename, onToggleHide, onReset, isSelected, onSelect 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(layer.displayName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleNameSubmit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== layer.displayName) {
      onRename(layer.key, trimmed);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleNameSubmit();
    if (e.key === 'Escape') {
      setEditValue(layer.displayName);
      setIsEditing(false);
    }
  };

  const formatImg = (data: string | undefined) => {
    if (!data) return TRANSPARENT_PIXEL;
    return data.startsWith('data:') ? data : `data:image/png;base64,${data}`;
  };

  return (
    <div className={`p-4 flex flex-col gap-4 group transition-all relative ${layer.isDeleted ? 'opacity-30' : ''}`}>
      
      {/* Top Row */}
      <div className="flex gap-4 items-center">
        {/* Selection Checkbox */}
        <div 
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            className="cursor-pointer text-zinc-600 hover:text-zinc-400 transition-colors"
        >
            {isSelected ? (
                <CheckSquare size={16} className="text-indigo-400" />
            ) : (
                <Square size={16} />
            )}
        </div>

        {/* Thumbnail */}
        <div 
          className="w-14 h-14 rounded-xl checkerboard-pattern-sm border border-white/5 flex items-center justify-center overflow-hidden cursor-pointer relative shadow-inner group-hover:border-white/10 transition-all shrink-0"
          onClick={() => !layer.isDeleted && document.getElementById(`f-${layer.key}`)?.click()}
        >
          <img src={formatImg(layer.replacedData || layer.originalData)} className="max-w-[75%] max-h-[75%] object-contain drop-shadow-lg" />
        </div>
        <input 
          id={`f-${layer.key}`} 
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={(e) => e.target.files?.[0] && onReplace(layer.key, e.target.files[0])} 
        />
        
        {/* Name & Size */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={handleKeyDown}
              className="w-full bg-white/10 border border-indigo-500/50 rounded px-1.5 py-0.5 text-[13px] font-black text-zinc-100 outline-none mb-1"
            />
          ) : (
            <h3 
              onClick={() => !layer.isDeleted && setIsEditing(true)}
              className="text-[13px] font-black text-zinc-100 truncate mb-1 cursor-text hover:text-white flex items-center gap-1.5 group/name"
            >
              <span className="truncate">{layer.displayName}</span>
              {!layer.isDeleted && (
                <Edit2 size={10} className="opacity-0 group-hover/name:opacity-40 transition-opacity shrink-0" />
              )}
            </h3>
          )}
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-tight">
            {layer.width}x{layer.height} PX
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button 
            onClick={() => onToggleHide(layer.key)} 
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black tracking-widest flex items-center justify-center gap-2 transition-all ${
            layer.isDeleted 
            ? 'bg-zinc-100 text-zinc-900 shadow-lg' 
            : 'bg-white/5 text-zinc-500 hover:text-zinc-200 hover:bg-white/10'
            }`}
        >
            {layer.isDeleted ? <Eye size={14} /> : <EyeOff size={14} />}
            {layer.isDeleted ? 'RESTORE' : 'HIDE'}
        </button>
      </div>
    </div>
  );
};
