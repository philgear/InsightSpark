import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class KleePaletteService {
  /**
   * Blends two hex colors based on a ratio (0 to 1).
   * Formula: blended = base * (1 - r) + accent * r
   */
  blend(base: string, accent: string, ratio: number): string {
    const toRgb = (c: string) => {
      // Handle short hex (e.g. #fff)
      const hex = c.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (m, r, g, b) => r + r + g + g + b + b);
      const num = parseInt(hex.startsWith('#') ? hex.slice(1) : hex, 16);
      return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255
      };
    };

    const { r: br, g: bg, b: bb } = toRgb(base);
    const { r: ar, g: ag, b: ab } = toRgb(accent);
    
    const blendChannel = (c1: number, c2: number) => Math.round(c1 * (1 - ratio) + c2 * ratio);
    
    const r = blendChannel(br, ar);
    const g = blendChannel(bg, ag);
    const b = blendChannel(bb, ab);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
}