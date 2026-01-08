
import { SVGAVideoItem } from '../types';

export const loadSvgaFile = (buffer: ArrayBuffer): Promise<SVGAVideoItem> => {
  return new Promise((resolve, reject) => {
    if (!window.SVGA) {
      reject(new Error("SVGA Player library not detected in window"));
      return;
    }
    const parser = new window.SVGA.Parser();
    const url = URL.createObjectURL(new Blob([buffer]));
    
    parser.load(url, (item) => {
      URL.revokeObjectURL(url);
      resolve(item);
    }, (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    });
  });
};
