
import React, { useState, useRef, useEffect } from 'react';
import { SVGAVideoItem, LayerReplacement, SpriteDebugInfo } from './types';
import { TRANSPARENT_PIXEL } from './constants';
import { loadSvgaFile } from './services/svgaParser';
import { exportModifiedSvga, extractDebugInfo } from './services/svgaService';

// Modular Components
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { PreviewStage } from './components/PreviewStage';
import { ErrorToast } from './components/ErrorToast';
import { DebugPanel } from './components/DebugPanel';
import { Bug } from 'lucide-react';

const App: React.FC = () => {
  // Global States
  const [videoItem, setVideoItem] = useState<SVGAVideoItem | null>(null);
  const [layers, setLayers] = useState<LayerReplacement[]>([]);
  const [selectedLayerKeys, setSelectedLayerKeys] = useState<Set<string>>(new Set());
  const [isPlaying, setIsPlaying] = useState(true);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [canvasBg, setCanvasBg] = useState<'transparent' | 'white' | 'black' | 'green'>('transparent');
  const [searchQuery, setSearchQuery] = useState('');

  // Debug States
  const [showDebug, setShowDebug] = useState(false);
  const [importLog, setImportLog] = useState<SpriteDebugInfo[]>([]);
  const [exportLog, setExportLog] = useState<SpriteDebugInfo[]>([]);
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  // Sync Player with Video Item
  useEffect(() => {
    // Only initialize if we have a video item, a container, and we're not currently parsing a new file
    if (videoItem && containerRef.current && window.SVGA && !loading) {
      // To prevent issues with container re-mounting, we always create a fresh player instance for the new video item
      if (playerRef.current) {
        playerRef.current.stopAnimation();
        playerRef.current.clear();
      }

      const player = new window.SVGA.Player(containerRef.current);
      player.loops = 0;
      player.setVideoItem(videoItem);
      player.startAnimation();
      
      playerRef.current = player;
      setIsPlaying(true);

      // Cleanup on unmount or dependency change
      return () => {
        if (player) {
          player.stopAnimation();
          player.clear();
        }
      };
    }
  }, [videoItem, loading]);

  // Global Drag & Drop Listeners
  useEffect(() => {
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer?.files?.[0];
      if (file && file.name.toLowerCase().endsWith('.svga')) onFileProcess(file);
    };
    const handleDragOver = (e: DragEvent) => e.preventDefault();
    const handleDragEnter = () => setIsDragging(true);
    const handleDragLeave = (e: DragEvent) => { if (!e.relatedTarget) setIsDragging(false); };

    window.addEventListener('drop', handleDrop);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    return () => {
      window.removeEventListener('drop', handleDrop);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
    };
  }, []);

  // Handlers
  const onFileProcess = async (file: File) => {
    setLoading(true);
    setError(null);
    setFileName(file.name);
    setFileSize(file.size);
    setExportSuccess(false);
    setExportLog([]); // Clear previous export log on new file
    setSelectedLayerKeys(new Set()); // Reset selection
    
    // Reset player ref immediately
    if (playerRef.current) {
      playerRef.current.stopAnimation();
      playerRef.current.clear();
      playerRef.current = null;
    }

    try {
      const buffer = await file.arrayBuffer();
      const item = await loadSvgaFile(buffer);
      
      // DEBUG: Extract info from imported file
      setImportLog(extractDebugInfo(item));

      const images = item.images || {};
      const layersList: LayerReplacement[] = await Promise.all(
        Object.entries(images).map(async ([key, value]) => {
          const img = new Image();
          const src = (value as string).startsWith('data:') ? (value as string) : `data:image/png;base64,${value}`;
          img.src = src;
          await new Promise((r) => (img.onload = r));
          return { 
             key, 
             displayName: key, 
             originalData: value as string, 
             width: img.naturalWidth, 
             height: img.naturalHeight, 
             isDeleted: false
          };
        })
      );
      setLayers(layersList);
      setVideoItem(item);
    } catch (e: any) {
      setError("Load Failed: " + (e.message || "Invalid SVGA"));
    } finally {
      setLoading(false);
    }
  };

  const triggerFileUpload = () => {
    const input = document.getElementById('main-up') as HTMLInputElement;
    if (input) {
      input.value = '';
      input.click();
    }
  };

  const resizeImage = (file: File, targetWidth: number, targetHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error("Failed to get canvas context"));
            return;
          }
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => reject(new Error("Failed to load image for resizing"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  // --- Selection Handlers ---

  const onSelectLayer = (key: string) => {
    setSelectedLayerKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const onSelectAll = (filteredKeys: string[]) => {
    // If all filtered keys are already selected, deselect them. Otherwise, select them all.
    const allSelected = filteredKeys.every(k => selectedLayerKeys.has(k));
    
    setSelectedLayerKeys(prev => {
      const next = new Set(prev);
      if (allSelected) {
        filteredKeys.forEach(k => next.delete(k));
      } else {
        filteredKeys.forEach(k => next.add(k));
      }
      return next;
    });
  };

  // --- Layer Operation Handlers (with Batch Logic) ---

  const onLayerReplace = async (key: string, file: File) => {
    const layer = layers.find(l => l.key === key);
    if (!layer) return;

    try {
      const processedBase64 = await resizeImage(file, layer.width, layer.height);
      setLayers(prev => prev.map(l => l.key === key ? { ...l, replacedData: processedBase64, isDeleted: false } : l));
      if (playerRef.current) playerRef.current.setImage(processedBase64, key);
    } catch (err: any) {
      setError(`Image Processing Error: ${err.message}`);
    }
  };

  const onLayerRename = (key: string, newName: string) => {
    setLayers(prev => prev.map(l => l.key === key ? { ...l, displayName: newName } : l));
  };
  
  const onToggleLayerHide = (key: string) => {
    setLayers(prev => {
      const targetLayer = prev.find(p => p.key === key);
      if (!targetLayer) return prev;
      
      // The intended state is the opposite of the clicked layer's current state
      const nextState = !targetLayer.isDeleted;
      const isBatch = selectedLayerKeys.has(key);

      return prev.map(l => {
        // Apply if this is the target layer OR (batch mode is active AND this layer is selected)
        if (l.key === key || (isBatch && selectedLayerKeys.has(l.key))) {
          // Side Effect: Update Player Visuals
          const data = nextState ? TRANSPARENT_PIXEL : (l.replacedData || l.originalData);
          playerRef.current?.setImage(data.startsWith('data:') ? data : `data:image/png;base64,${data}`, l.key);
          
          return { ...l, isDeleted: nextState };
        }
        return l;
      });
    });
  };

  const onLayerReset = (key: string) => {
    const isBatch = selectedLayerKeys.has(key);

    setLayers(prev => prev.map(l => {
      if (l.key === key || (isBatch && selectedLayerKeys.has(l.key))) {
        // Side Effect: Update Player
        const original = l.originalData.startsWith('data:') ? l.originalData : `data:image/png;base64,${l.originalData}`;
        playerRef.current?.setImage(original, l.key);

        return { ...l, replacedData: undefined, isDeleted: false };
      }
      return l;
    }));
  };

  const handleRenderPreview = async (download: boolean) => {
    if (!videoItem) return;
    setExporting(true);
    setError(null);
    try {
      const data = await exportModifiedSvga(videoItem, layers);
      const blob = new Blob([data], { type: "application/octet-stream" });
      const arrayBuffer = await blob.arrayBuffer();
      
      const newItem = await loadSvgaFile(arrayBuffer);
      setExportLog(extractDebugInfo(newItem));

      if (download) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName.replace(/\.svga$/i, '')}_edited.svga`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 3000);
        URL.revokeObjectURL(url);
      } else {
        setVideoItem(newItem);
      }
    } catch (err: any) {
      setError(`Process Error: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  // --- Thumbnail Handlers ---

  const handleSeekFrame = (frame: number) => {
    if (playerRef.current) {
        setIsPlaying(false);
        playerRef.current.pauseAnimation();
        playerRef.current.stepToFrame(frame, false);
    }
  };

  const handleDownloadThumbnail = () => {
    if (!containerRef.current) return;
    const canvas = containerRef.current.querySelector('canvas');
    if (!canvas) {
        setError("Could not capture frame. Canvas not found.");
        return;
    }
    
    try {
        const dataUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `${fileName.replace(/\.svga$/i, '')}_thumb.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } catch (e) {
        setError("Failed to export thumbnail.");
    }
  };

  const toggleAnimation = () => {
    if (!playerRef.current) return;
    if (isPlaying) playerRef.current.pauseAnimation();
    else playerRef.current.startAnimation();
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#07080a] text-zinc-100 font-sans relative">
      <Header 
        videoItem={videoItem} 
        fileName={fileName} 
        fileSize={fileSize}
        exporting={exporting} 
        exportSuccess={exportSuccess} 
        onExport={() => handleRenderPreview(true)}
        onNewUpload={triggerFileUpload}
        onSeekFrame={handleSeekFrame}
        onExtractThumbnail={handleDownloadThumbnail}
      />

      <main className="flex-1 flex min-h-0">
        <Sidebar 
          layers={layers} 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          loading={loading}
          onReplace={onLayerReplace}
          onRename={onLayerRename}
          onToggleHide={onToggleLayerHide}
          onReset={onLayerReset}
          // Selection Props
          selectedLayerKeys={selectedLayerKeys}
          onSelectLayer={onSelectLayer}
          onSelectAll={onSelectAll}
        />

        <PreviewStage 
          videoItem={videoItem}
          loading={loading}
          isDragging={isDragging}
          canvasBg={canvasBg}
          setCanvasBg={setCanvasBg}
          isPlaying={isPlaying}
          toggleAnimation={toggleAnimation}
          onUploadClick={triggerFileUpload}
          containerRef={containerRef}
        />

        {videoItem && (
          <button 
            onClick={() => setShowDebug(!showDebug)}
            className="fixed top-28 right-6 z-30 p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all text-zinc-500 hover:text-indigo-400"
            title="Open Debug Log"
          >
            <Bug size={18} />
          </button>
        )}

        <DebugPanel 
          visible={showDebug}
          onClose={() => setShowDebug(false)}
          importLog={importLog}
          exportLog={exportLog}
          onRefreshExport={() => handleRenderPreview(false)}
          exportLoading={exporting}
        />

        <input 
          id="main-up" 
          type="file" 
          accept=".svga" 
          className="hidden" 
          onChange={(e) => e.target.files?.[0] && onFileProcess(e.target.files[0])} 
        />

        <ErrorToast error={error} onClose={() => setError(null)} />
      </main>
    </div>
  );
};

export default App;
