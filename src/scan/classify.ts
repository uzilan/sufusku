// Pure pixel pipeline over RawImage — no DOM, no OpenCV, testable in Node.
// RawImage is a structural subset of ImageData so canvas results pass directly.
export interface RawImage {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export const GRID_SIZE = 450;
export const CELL_SIZE = 50; // GRID_SIZE / 9
export const DIGIT_SIZE = 28; // CNN input size

const EMPTY_CELL_MARGIN = 10; // px skipped on each side — grid lines live here
const EMPTY_INK_THRESHOLD_OFFSET = 60; // ink = darker than cell mean by this much
const EMPTY_MAX_INK_FRACTION = 0.02;
const DIGIT_CROP_MARGIN = 6; // px trimmed before downsampling to 28x28

export const grayAt = (img: RawImage, x: number, y: number): number => {
  const i = (y * img.width + x) * 4;
  return 0.299 * img.data[i] + 0.587 * img.data[i + 1] + 0.114 * img.data[i + 2];
};

// Split the warped 450x450 grid into 81 row-major 50x50 cells
export const sliceCells = (grid: RawImage): RawImage[] => {
  const cells: RawImage[] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const data = new Uint8ClampedArray(CELL_SIZE * CELL_SIZE * 4);
      for (let y = 0; y < CELL_SIZE; y++) {
        const srcStart = ((r * CELL_SIZE + y) * grid.width + c * CELL_SIZE) * 4;
        data.set(grid.data.subarray(srcStart, srcStart + CELL_SIZE * 4), y * CELL_SIZE * 4);
      }
      cells.push({ data, width: CELL_SIZE, height: CELL_SIZE });
    }
  }
  return cells;
};

// A cell is empty when its central region has almost no pixels darker than the cell mean
export const isEmptyCell = (cell: RawImage): boolean => {
  let sum = 0;
  for (let y = 0; y < cell.height; y++) {
    for (let x = 0; x < cell.width; x++) sum += grayAt(cell, x, y);
  }
  const mean = sum / (cell.width * cell.height);
  const threshold = mean - EMPTY_INK_THRESHOLD_OFFSET;

  let dark = 0;
  const side = CELL_SIZE - 2 * EMPTY_CELL_MARGIN;
  for (let y = EMPTY_CELL_MARGIN; y < cell.height - EMPTY_CELL_MARGIN; y++) {
    for (let x = EMPTY_CELL_MARGIN; x < cell.width - EMPTY_CELL_MARGIN; x++) {
      if (grayAt(cell, x, y) < threshold) dark++;
    }
  }
  return dark / (side * side) < EMPTY_MAX_INK_FRACTION;
};

// Crop borders, box-downsample to 28x28, normalize (255 - gray) / 255.
// MUST match the normalization in tools/train-digits/train.py.
export const prepareDigit = (cell: RawImage): Float32Array => {
  const cropSize = CELL_SIZE - 2 * DIGIT_CROP_MARGIN;
  const out = new Float32Array(DIGIT_SIZE * DIGIT_SIZE);
  for (let oy = 0; oy < DIGIT_SIZE; oy++) {
    const sy0 = DIGIT_CROP_MARGIN + Math.floor((oy * cropSize) / DIGIT_SIZE);
    const sy1 = DIGIT_CROP_MARGIN + Math.max(sy0 - DIGIT_CROP_MARGIN + 1, Math.floor(((oy + 1) * cropSize) / DIGIT_SIZE));
    for (let ox = 0; ox < DIGIT_SIZE; ox++) {
      const sx0 = DIGIT_CROP_MARGIN + Math.floor((ox * cropSize) / DIGIT_SIZE);
      const sx1 = DIGIT_CROP_MARGIN + Math.max(sx0 - DIGIT_CROP_MARGIN + 1, Math.floor(((ox + 1) * cropSize) / DIGIT_SIZE));
      let sum = 0;
      let count = 0;
      for (let sy = sy0; sy < sy1; sy++) {
        for (let sx = sx0; sx < sx1; sx++) {
          sum += grayAt(cell, sx, sy);
          count++;
        }
      }
      out[oy * DIGIT_SIZE + ox] = (255 - sum / count) / 255;
    }
  }
  return out;
};
