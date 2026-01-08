
import { SVGAVideoItem, LayerReplacement, SpriteDebugInfo } from '../types';
import { SVGA_PROTO_JSON, TRANSPARENT_PIXEL } from '../constants';

const base64ToUint8 = (base64Str: string): Uint8Array => {
  const b64 = base64Str.split(',')[1] || base64Str;
  const bin = window.atob(b64);
  const uint8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    uint8[i] = bin.charCodeAt(i);
  }
  return uint8;
};

// --- DATA NORMALIZATION HELPERS ---

/**
 * Robustly extracts a path string (d command) from various possible parser outputs.
 * svgaplayerweb often parses strings into BezierPath objects with _d or d properties.
 */
const getPathString = (val: any): string => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  // Check common object properties where the path string might be hidden
  return val._d || val.d || val.path || '';
};

const normColor = (c: any) => {
  if (!c) return undefined;

  let r = 0, g = 0, b = 0, a = 1;

  if (typeof c === 'string' && c.startsWith('#')) {
    const hex = c.substring(1);
    r = parseInt(hex.substring(0, 2), 16) / 255;
    g = parseInt(hex.substring(2, 4), 16) / 255;
    b = parseInt(hex.substring(4, 6), 16) / 255;
    if (hex.length > 6) {
      a = parseInt(hex.substring(6, 8), 16) / 255;
    }
  } else if (Array.isArray(c)) {
    r = (c[0] ?? 0);
    g = (c[1] ?? 0);
    b = (c[2] ?? 0);
    a = (c[3] ?? 1);
    if (r > 1) r /= 255;
    if (g > 1) g /= 255;
    if (b > 1) b /= 255;
  } else {
    r = c.r ?? 0;
    g = c.g ?? 0;
    b = c.b ?? 0;
    a = c.a ?? 1;
    if (r > 1) r /= 255;
    if (g > 1) g /= 255;
    if (b > 1) b /= 255;
  }

  return { r, g, b, a };
};

const fixTransform = (t: any) => {
  if (!t) return undefined;
  if (Array.isArray(t) && t.length >= 6) {
    return { a: t[0], b: t[1], c: t[2], d: t[3], tx: t[4], ty: t[5] };
  }
  return {
    a: t.a ?? 1, 
    b: t.b ?? 0, 
    c: t.c ?? 0, 
    d: t.d ?? 1,
    tx: t.tx ?? t.e ?? 0,
    ty: t.ty ?? t.f ?? 0
  };
};

const fixGradient = (g: any) => {
  if (!g) return undefined;
  return {
    startPoint: g.sp || g.startPoint || { x: 0, y: 0 },
    endPoint: g.ep || g.endPoint || { x: 0, y: 0 },
    matrix: fixTransform(g.m || g.matrix),
    colors: (g.c || g.colors || []).map((c: any) => ({
      ...normColor(c),
      offset: c.o ?? c.offset ?? 0 
    }))
  };
};

const mapLineCap = (cap: any): number => {
  if (typeof cap === 'number') return cap;
  const s = String(cap || '').toLowerCase();
  if (s === 'butt') return 0;
  if (s === 'round') return 1;
  if (s === 'square') return 2;
  return 0;
};

const mapLineJoin = (join: any): number => {
  if (typeof join === 'number') return join;
  const s = String(join || '').toLowerCase();
  if (s === 'miter') return 0;
  if (s === 'round') return 1;
  if (s === 'bevel') return 2;
  return 0;
};

/**
 * Comprehensive Style Fixer
 * Captures all stroke, fill, and trim-path attributes.
 */
const fixStyles = (st: any) => {
  if (!st) return undefined;
  return {
    fill: normColor(st.fill || st.f),
    stroke: normColor(st.stroke || st.s),
    strokeWidth: st.strokeWidth ?? st.w ?? 0,
    lineCap: mapLineCap(st.lineCap ?? st.cap),
    lineJoin: mapLineJoin(st.lineJoin ?? st.join),
    miterLimit: st.miterLimit ?? st.ml ?? 0,
    lineDash: st.lineDash ?? st.ls ?? [],
    lineDashOffset: st.lineDashOffset ?? st.ldo ?? st.lo ?? 0,
    fillGradient: fixGradient(st.fillGradient || st.fg),
    strokeGradient: fixGradient(st.strokeGradient || st.sg),
    // TrimPath Support (Critical for Stroke Animation)
    trimPathStart: st.trimPathStart ?? st.ts ?? 0,
    trimPathEnd: st.trimPathEnd ?? st.te ?? 0,
    trimPathOffset: st.trimPathOffset ?? st.to ?? 0
  };
};

const getShapeType = (sh: any): number => {
  const t = sh.type ?? sh.ty;
  if (typeof t === 'string') {
    const lower = t.toLowerCase();
    if (lower === 'shape') return 0;
    if (lower === 'rect') return 1;
    if (lower === 'ellipse') return 2;
    if (lower === 'keep') return 3;
  }
  return typeof t === 'number' ? t : 0;
};

// --- MAIN EXPORT & DEBUG LOGIC ---

/**
 * Extracts debug information.
 * Uses the exact same extraction logic as the exporter to ensure "What You See Is What You Export".
 */
export const extractDebugInfo = (videoItem: SVGAVideoItem): SpriteDebugInfo[] => {
  if (!videoItem.sprites) return [];

  return videoItem.sprites.map((sprite: any, index: number) => {
    // 1. Matte Key
    const matteKey = sprite.matteKey || sprite.mk || sprite._matteKey || sprite.matte_key || '';
    
    // 2. Blend Mode
    const blendMode = sprite.blendMode || sprite.bm || '';

    let maskPath = '';
    let hasTrimPath = false;

    if (sprite.frames && Array.isArray(sprite.frames)) {
      for (const f of sprite.frames) {
        // 3. Mask/Clip Path
        // Check both 'clipPath' and 'maskPath' fields
        const rawClip = f.clipPath || f.cl;
        const rawMask = f.maskPath || f.mP;
        
        // Prioritize explicit clipPath, fall back to maskPath
        const foundPath = getPathString(rawClip) || getPathString(rawMask);
        
        if (foundPath && !maskPath) {
          maskPath = foundPath.length > 20 ? foundPath.substring(0, 20) + '...' : foundPath;
        }

        // 4. TrimPath
        if (!hasTrimPath && (f.shapes || f.sh)) {
          const shapes = f.shapes || f.sh || [];
          for (const s of shapes) {
            const st = s.styles || s.st;
            if (st) {
              const ts = st.trimPathStart ?? st.ts ?? 0;
              const te = st.trimPathEnd ?? st.te ?? 0;
              const to = st.trimPathOffset ?? st.to ?? 0;
              if (ts !== 0 || te !== 0 || to !== 0) {
                hasTrimPath = true;
                break;
              }
            }
          }
        }
        
        if (maskPath && hasTrimPath) break;
      }
    }

    return {
      index,
      imageKey: sprite.imageKey || '',
      matteKey: String(matteKey),
      blendMode: String(blendMode),
      maskPath,
      hasTrimPath
    };
  });
};

export const exportModifiedSvga = async (
  videoItem: any,
  layers: LayerReplacement[]
): Promise<Uint8Array> => {
  const protobuf = window.protobuf;
  const pako = window.pako;
  
  if (!protobuf || !pako) throw new Error("Protobuf/Pako libraries missing");

  const root = protobuf.Root.fromJSON(SVGA_PROTO_JSON);
  const MovieEntity = root.lookupType("MovieEntity");

  // 1. Prepare Key Mapping (Original Key -> New Display Name)
  const keyMap: Record<string, string> = {};
  layers.forEach(l => {
    keyMap[l.key] = l.displayName;
  });

  const movieData: any = {
    version: videoItem.movie?.version || "2.0",
    params: {
      viewBoxWidth: videoItem.movie?.viewBox?.width || videoItem.videoSize?.width || 0,
      viewBoxHeight: videoItem.movie?.viewBox?.height || videoItem.videoSize?.height || 0,
      fps: videoItem.movie?.fps || videoItem.FPS || 24,
      frames: videoItem.movie?.frames || videoItem.frames || 0
    },
    audios: videoItem.audios || [],
    sprites: (videoItem.sprites || []).map((sprite: any) => {
      const originalKey = sprite.imageKey || '';
      // Apply renaming if key exists in mapping, otherwise keep original
      const finalKey = keyMap[originalKey] || originalKey;

      return {
        imageKey: finalKey,
        // Ensure we capture matteKey and blendMode, even if parser hid them in aliases
        matteKey: sprite.matteKey || sprite.mk || sprite._matteKey || sprite.matte_key || '',
        blendMode: sprite.blendMode || sprite.bm || 'NORMAL',
        frames: (sprite.frames || []).map((frame: any) => {
          
          // CLIP PATH EXTRACTION
          const rawClip = frame.clipPath || frame.cl;
          const rawMask = frame.maskPath || frame.mP;
          const finalClipPath = getPathString(rawClip) || getPathString(rawMask);

          return {
            alpha: frame.alpha ?? frame.al ?? 1,
            clipPath: finalClipPath,
            transform: fixTransform(frame.transform || frame.tr),
            layout: (frame.la || frame.layout) ? {
              x: (frame.la || frame.layout).x || 0,
              y: (frame.la || frame.layout).y || 0,
              width: (frame.la || frame.layout).w || (frame.la || frame.layout).width || 0,
              height: (frame.la || frame.layout).h || (frame.la || frame.layout).height || 0
            } : undefined,
            shapes: (frame.shapes || frame.sh || []).map((sh: any) => {
              const type = getShapeType(sh);
              const resShape: any = {
                type,
                transform: fixTransform(sh.transform || sh.tr),
                styles: fixStyles(sh.styles || sh.st)
              };

              // Reconstruct Shape Data
              if (type === 0) { // SHAPE
                const d = getPathString(sh.d) || 
                          getPathString(sh.args?.d) || 
                          getPathString(sh.shape?.d) || 
                          getPathString(sh.shape) || 
                          getPathString(sh.sh) || 
                          getPathString(sh.p);
                
                resShape.shape = { d };
              } else if (type === 1) { // RECT
                const r = sh.rect || sh.re || (sh.args) || sh; 
                if (r) resShape.rect = { 
                  x: r.x || 0, 
                  y: r.y || 0, 
                  width: r.w || r.width || 0, 
                  height: r.h || r.height || 0, 
                  cornerRadius: r.cr || r.cornerRadius || 0 
                };
              } else if (type === 2) { // ELLIPSE
                const e = sh.ellipse || sh.el || (sh.args) || sh;
                if (e) resShape.ellipse = { 
                  x: e.x || 0, 
                  y: e.y || 0, 
                  radiusX: e.rx || e.radiusX || 0, 
                  radiusY: e.ry || e.radiusY || 0 
                };
              }

              return resShape;
            })
          };
        })
      };
    })
  };

  // 2. Construct Image Pool
  // We prioritize the layers array as it contains the up-to-date data, rename status, and replacement data.
  const finalImages: Record<string, Uint8Array> = {};
  const processedKeys = new Set<string>();

  layers.forEach(l => {
    // Use displayName as the new key
    const data = l.isDeleted ? TRANSPARENT_PIXEL : (l.replacedData || l.originalData);
    finalImages[l.displayName] = base64ToUint8(data);
    processedKeys.add(l.key);
  });

  // Defensive: Carry over any images from original that weren't in layers (unlikely but safe)
  if (videoItem.images) {
    Object.entries(videoItem.images).forEach(([key, val]) => {
      if (!processedKeys.has(key)) {
        if (typeof val === 'string') {
          finalImages[key] = base64ToUint8(val);
        }
      }
    });
  }

  movieData.images = finalImages;

  try {
    const message = MovieEntity.create(movieData);
    const buffer = MovieEntity.encode(message).finish();
    const uint8Arr = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    return pako.deflate(uint8Arr, { windowBits: 15 });
  } catch (err) {
    console.error("[SVGA Export Critical]", err);
    throw new Error("Export failed: Structure validation error. Please check console for details.");
  }
};
