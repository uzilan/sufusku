import { createRequire } from 'node:module';

let cvPromise: Promise<any> | null = null;

// opencv.js is a UMD build; in Node it exports the emscripten Module.
export const loadOpenCVNode = (): Promise<any> => {
  cvPromise ??= (async () => {
    const require = createRequire(import.meta.url);
    const cv = require('../../public/opencv/opencv.js');
    if (typeof cv.then === 'function') return await cv; // 4.x: module is a thenable
    if (cv.Mat) return cv;
    return new Promise((resolve) => {
      cv.onRuntimeInitialized = () => resolve(cv);
    });
  })();
  return cvPromise;
};
