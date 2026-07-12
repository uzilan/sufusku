import fs from 'node:fs';
import { PNG } from 'pngjs';
import type { RawImage } from '../../src/scan/classify';

export const makeImage = (width: number, height: number, gray = 255): RawImage => {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = gray;
    data[i * 4 + 1] = gray;
    data[i * 4 + 2] = gray;
    data[i * 4 + 3] = 255;
  }
  return { data, width, height };
};

export const fillRect = (
  img: RawImage,
  x0: number,
  y0: number,
  w: number,
  h: number,
  gray: number,
): void => {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      const i = (y * img.width + x) * 4;
      img.data[i] = gray;
      img.data[i + 1] = gray;
      img.data[i + 2] = gray;
    }
  }
};

// Hollow rectangle outline of given line thickness
export const strokeRect = (
  img: RawImage,
  x0: number,
  y0: number,
  w: number,
  h: number,
  thickness: number,
  gray: number,
): void => {
  fillRect(img, x0, y0, w, thickness, gray);
  fillRect(img, x0, y0 + h - thickness, w, thickness, gray);
  fillRect(img, x0, y0, thickness, h, gray);
  fillRect(img, x0 + w - thickness, y0, thickness, h, gray);
};

export const loadPng = (path: string): RawImage => {
  const png = PNG.sync.read(fs.readFileSync(path));
  return { data: new Uint8ClampedArray(png.data), width: png.width, height: png.height };
};
