
// Types for the SVGA Player Web library
export interface SVGAVideoItem {
  videoSize?: { width: number; height: number };
  FPS?: number;
  frames?: number;
  images?: Record<string, string>; // base64 images
  movie?: {
    viewBox?: { width: number; height: number };
    fps?: number;
    frames?: number;
    version?: string;
  };
  sprites?: any[];
  audios?: any[];
}

export interface SVGAInstance {
  Parser: new () => {
    load: (url: string | ArrayBuffer, success: (videoItem: SVGAVideoItem) => void, failure: (error: Error) => void) => void;
  };
  Player: new (container: string | HTMLElement) => {
    setVideoItem: (videoItem: SVGAVideoItem) => void;
    setImage: (url: string | null, key: string) => void;
    startAnimation: () => void;
    stopAnimation: () => void;
    pauseAnimation: () => void;
    clear: () => void;
    loops: number;
    fillMode: 'Forward' | 'Backward';
  };
}

// Global window extension
declare global {
  interface Window {
    SVGA: SVGAInstance;
    JSZip: any;
    pako: any;
    protobuf: any;
  }
}

export interface LayerReplacement {
  key: string;           // Original key
  displayName: string;   // User renamed label
  originalData: string;  // Base64
  replacedData?: string; // New Base64
  fileName?: string;
  width: number;
  height: number;
  isDeleted: boolean;
}

export interface SpriteDebugInfo {
  index: number;
  imageKey: string;
  matteKey: string;
  blendMode: string;
  maskPath: string; // Summarized from frames
  hasTrimPath: boolean; // Indicates if TrimPath logic is used (stroke animation)
}
