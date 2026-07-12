// OpenCV.js is deliberately NOT bundled: it is a ~2 MB wasm artifact served
// from public/opencv/ and loaded via script tag on first scan.
export type CV = any;

let cvPromise: Promise<CV> | null = null;

export const loadOpenCV = (): Promise<CV> => {
  cvPromise ??= new Promise<CV>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/opencv/opencv.js';
    script.async = true;
    script.onload = () => {
      const cv = (window as unknown as { cv: CV }).cv;
      if (!cv) {
        reject(new Error('OpenCV script loaded but window.cv is missing'));
        return;
      }
      if (typeof cv.then === 'function') cv.then(resolve, reject);
      else if (cv.Mat) resolve(cv);
      else cv.onRuntimeInitialized = () => resolve(cv);
    };
    script.onerror = () => reject(new Error('Failed to load OpenCV'));
    document.head.appendChild(script);
  });
  return cvPromise;
};
