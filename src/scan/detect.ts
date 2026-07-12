import type { CV } from './opencv';
import { GRID_SIZE, type RawImage } from './classify';

export type Point = { x: number; y: number };
// Ordered: top-left, top-right, bottom-right, bottom-left
export type Quad = [Point, Point, Point, Point];

const MIN_GRID_AREA_FRACTION = 0.3;

const orderCorners = (pts: Point[]): Quad => {
  const bySum = [...pts].sort((a, b) => a.x + a.y - (b.x + b.y));
  const byDiff = [...pts].sort((a, b) => a.y - a.x - (b.y - b.x));
  return [bySum[0], byDiff[0], bySum[3], byDiff[3]];
};

// Largest convex quadrilateral contour covering >30% of the frame
export const findGridQuad = (cv: CV, image: RawImage): Quad | null => {
  const src = cv.matFromImageData(image);
  const gray = new cv.Mat();
  const bin = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0);
    cv.adaptiveThreshold(gray, bin, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 11, 2);
    cv.findContours(bin, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let best: Quad | null = null;
    let bestArea = image.width * image.height * MIN_GRID_AREA_FRACTION;
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      if (area > bestArea) {
        const approx = new cv.Mat();
        cv.approxPolyDP(contour, approx, 0.02 * cv.arcLength(contour, true), true);
        if (approx.rows === 4 && cv.isContourConvex(approx)) {
          const pts: Point[] = [];
          for (let p = 0; p < 4; p++) {
            pts.push({ x: approx.data32S[p * 2], y: approx.data32S[p * 2 + 1] });
          }
          best = orderCorners(pts);
          bestArea = area;
        }
        approx.delete();
      }
      contour.delete();
    }
    return best;
  } finally {
    src.delete();
    gray.delete();
    bin.delete();
    contours.delete();
    hierarchy.delete();
  }
};

// Perspective-correct the quad into a square RGBA image
export const warpGrid = (cv: CV, image: RawImage, quad: Quad, size = GRID_SIZE): RawImage => {
  const src = cv.matFromImageData(image);
  const dst = new cv.Mat();
  const srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, quad.flatMap((p) => [p.x, p.y]));
  const dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, size, 0, size, size, 0, size]);
  const transform = cv.getPerspectiveTransform(srcPts, dstPts);
  try {
    cv.warpPerspective(src, dst, transform, new cv.Size(size, size));
    return { data: new Uint8ClampedArray(dst.data), width: size, height: size };
  } finally {
    src.delete();
    dst.delete();
    srcPts.delete();
    dstPts.delete();
    transform.delete();
  }
};
