import { describe, expect, it } from 'vitest';
import { loadOpenCVNode } from './helpers/opencvNode';

describe('trimmed opencv.js', () => {
  it('loads and exposes the whitelisted imgproc ops', async () => {
    const cv = await loadOpenCVNode();
    for (const fn of [
      'adaptiveThreshold',
      'approxPolyDP',
      'arcLength',
      'contourArea',
      'cvtColor',
      'findContours',
      'GaussianBlur',
      'getPerspectiveTransform',
      'isContourConvex',
      'warpPerspective',
    ]) {
      expect(typeof cv[fn], fn).toBe('function');
    }
  }, 60000);

  it('runs cvtColor on a Mat', async () => {
    const cv = await loadOpenCVNode();
    const mat = new cv.Mat(10, 10, cv.CV_8UC4, new cv.Scalar(255, 255, 255, 255));
    const gray = new cv.Mat();
    cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY);
    expect(gray.rows).toBe(10);
    expect(gray.cols).toBe(10);
    mat.delete();
    gray.delete();
  }, 60000);
});
