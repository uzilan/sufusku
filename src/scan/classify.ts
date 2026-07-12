import type { Board } from '../sudoku/logic';
import type { DigitModel } from './model';

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
const DIGIT_CROP_MARGIN = 6; // px trimmed in the no-ink fallback crop
const CELL_SEARCH_SLACK = 8; // px searched past the cell on each side for shifted digits
const DIGIT_WINDOW_PADDING = 1.6; // window side vs blob size — digit fills ~1/1.6 of frame like training
const MIN_DIGIT_WINDOW = 24; // px, don't zoom tiny noise blobs to full frame
const MIN_DIGIT_INK = 12; // px, components smaller than this are speckle noise
const MAX_DIGIT_ASPECT = 4; // components longer/thinner than this are line fragments
const MERGE_GAP = 3; // px, digit parts split by thresholding get re-merged within this gap

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

// Box-downsample an arbitrary window of the grid to 28x28, normalized
// (255 - gray) / 255. MUST match the normalization in tools/train-digits/train.py.
const downsampleWindow = (grid: RawImage, wx0: number, wy0: number, side: number): Float32Array => {
  const out = new Float32Array(DIGIT_SIZE * DIGIT_SIZE);
  for (let oy = 0; oy < DIGIT_SIZE; oy++) {
    const sy0 = wy0 + Math.floor((oy * side) / DIGIT_SIZE);
    const sy1 = wy0 + Math.max(sy0 - wy0 + 1, Math.floor(((oy + 1) * side) / DIGIT_SIZE));
    for (let ox = 0; ox < DIGIT_SIZE; ox++) {
      const sx0 = wx0 + Math.floor((ox * side) / DIGIT_SIZE);
      const sx1 = wx0 + Math.max(sx0 - wx0 + 1, Math.floor(((ox + 1) * side) / DIGIT_SIZE));
      let sum = 0;
      let count = 0;
      for (let sy = sy0; sy < sy1; sy++) {
        for (let sx = sx0; sx < sx1; sx++) {
          sum += grayAt(grid, sx, sy);
          count++;
        }
      }
      out[oy * DIGIT_SIZE + ox] = (255 - sum / count) / 255;
    }
  }
  return out;
};

// Extract the digit of cell `index` from the whole warped grid: locate the ink
// blob around the cell (with slack past the 50px slice, since imperfect warps
// shift digits off-center and even across cell boundaries), ignore grid-line
// rows/columns, and center the sampling window on the blob. The CNN was
// trained on centered digits, so centering here is what makes real photos
// (where the warp is never pixel-perfect) classify like synthetic input.
export const prepareDigit = (grid: RawImage, index: number): Float32Array => {
  const row = Math.floor(index / 9);
  const col = index % 9;
  const rx0 = Math.max(0, col * CELL_SIZE - CELL_SEARCH_SLACK);
  const ry0 = Math.max(0, row * CELL_SIZE - CELL_SEARCH_SLACK);
  const rx1 = Math.min(grid.width, (col + 1) * CELL_SIZE + CELL_SEARCH_SLACK);
  const ry1 = Math.min(grid.height, (row + 1) * CELL_SIZE + CELL_SEARCH_SLACK);
  const rw = rx1 - rx0;
  const rh = ry1 - ry0;

  // Ink threshold from the region's gray range (5th..95th percentile midpoint)
  const grays: number[] = [];
  for (let y = ry0; y < ry1; y++) {
    for (let x = rx0; x < rx1; x++) grays.push(grayAt(grid, x, y));
  }
  grays.sort((a, b) => a - b);
  const lo = grays[Math.floor(grays.length * 0.05)];
  const hi = grays[Math.floor(grays.length * 0.95)];
  const threshold = lo + 0.5 * (hi - lo);

  // Connected components over the dark mask. Grid lines survive naive
  // row/column heuristics when the warp leaves them slightly tilted, so
  // instead pick the digit-shaped component nearest the cell center and
  // reject long/thin (line-like) components.
  const dark = new Uint8Array(rw * rh);
  for (let y = 0; y < rh; y++) {
    for (let x = 0; x < rw; x++) {
      if (grayAt(grid, rx0 + x, ry0 + y) < threshold) dark[y * rw + x] = 1;
    }
  }
  const labels = new Int32Array(rw * rh).fill(-1);
  const queue = new Int32Array(rw * rh);
  interface Component { x0: number; x1: number; y0: number; y1: number; count: number }
  const components: Component[] = [];
  for (let start = 0; start < rw * rh; start++) {
    if (!dark[start] || labels[start] !== -1) continue;
    const label = components.length;
    const comp: Component = { x0: rw, x1: -1, y0: rh, y1: -1, count: 0 };
    let head = 0;
    let tail = 0;
    queue[tail++] = start;
    labels[start] = label;
    while (head < tail) {
      const p = queue[head++];
      const px = p % rw;
      const py = (p / rw) | 0;
      comp.count++;
      if (px < comp.x0) comp.x0 = px;
      if (px > comp.x1) comp.x1 = px;
      if (py < comp.y0) comp.y0 = py;
      if (py > comp.y1) comp.y1 = py;
      if (px > 0 && dark[p - 1] && labels[p - 1] === -1) { labels[p - 1] = label; queue[tail++] = p - 1; }
      if (px < rw - 1 && dark[p + 1] && labels[p + 1] === -1) { labels[p + 1] = label; queue[tail++] = p + 1; }
      if (py > 0 && dark[p - rw] && labels[p - rw] === -1) { labels[p - rw] = label; queue[tail++] = p - rw; }
      if (py < rh - 1 && dark[p + rw] && labels[p + rw] === -1) { labels[p + rw] = label; queue[tail++] = p + rw; }
    }
    components.push(comp);
  }

  // Score components: digit-shaped (not line-like), sized like a digit,
  // close to the cell center
  const cellCx = col * CELL_SIZE + CELL_SIZE / 2 - rx0;
  const cellCy = row * CELL_SIZE + CELL_SIZE / 2 - ry0;
  let best: Component | null = null;
  let bestScore = 0;
  for (const c of components) {
    const w = c.x1 - c.x0 + 1;
    const h = c.y1 - c.y0 + 1;
    if (c.count < MIN_DIGIT_INK) continue; // speckle noise
    if (w > CELL_SIZE || h > CELL_SIZE) continue; // spans more than a cell: a line
    if (Math.max(w, h) / Math.min(w, h) > MAX_DIGIT_ASPECT) continue; // long thin: a line fragment
    const dx = (c.x0 + c.x1 + 1) / 2 - cellCx;
    const dy = (c.y0 + c.y1 + 1) / 2 - cellCy;
    const score = c.count / (1 + Math.hypot(dx, dy));
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }

  let bx0 = -1;
  let bx1 = -1;
  let by0 = -1;
  let by1 = -1;
  if (best) {
    // Merge other digit parts that sit within a few px of the chosen blob
    // (thresholding can split a digit into pieces)
    bx0 = best.x0;
    bx1 = best.x1;
    by0 = best.y0;
    by1 = best.y1;
    for (const c of components) {
      if (c === best || c.count < MIN_DIGIT_INK) continue;
      const w = c.x1 - c.x0 + 1;
      const h = c.y1 - c.y0 + 1;
      if (w > CELL_SIZE || h > CELL_SIZE || Math.max(w, h) / Math.min(w, h) > MAX_DIGIT_ASPECT) continue;
      if (
        c.x0 <= bx1 + MERGE_GAP && c.x1 >= bx0 - MERGE_GAP &&
        c.y0 <= by1 + MERGE_GAP && c.y1 >= by0 - MERGE_GAP
      ) {
        bx0 = Math.min(bx0, c.x0);
        bx1 = Math.max(bx1, c.x1);
        by0 = Math.min(by0, c.y0);
        by1 = Math.max(by1, c.y1);
      }
    }
  }

  // No ink found (shouldn't happen — isEmptyCell gates first): fall back to
  // the plain center crop of the cell
  if (bx1 < 0) {
    return downsampleWindow(
      grid,
      col * CELL_SIZE + DIGIT_CROP_MARGIN,
      row * CELL_SIZE + DIGIT_CROP_MARGIN,
      CELL_SIZE - 2 * DIGIT_CROP_MARGIN,
    );
  }

  // Square window centered on the blob, padded like the training renders
  // (digit fills ~60-80% of the frame), clamped to the grid
  const bw = bx1 - bx0 + 1;
  const bh = by1 - by0 + 1;
  const side = Math.min(
    Math.max(Math.round(Math.max(bw, bh) * DIGIT_WINDOW_PADDING), MIN_DIGIT_WINDOW),
    Math.min(grid.width, grid.height),
  );
  const cxAbs = rx0 + (bx0 + bx1 + 1) / 2;
  const cyAbs = ry0 + (by0 + by1 + 1) / 2;
  const wx0 = Math.round(Math.min(Math.max(cxAbs - side / 2, 0), grid.width - side));
  const wy0 = Math.round(Math.min(Math.max(cyAbs - side / 2, 0), grid.height - side));
  return downsampleWindow(grid, wx0, wy0, side);
};

export interface ScanResult {
  board: Board;
  confidence: number[]; // per cell; 1 for empty cells
}

// Slice the warped grid, gate empties, batch-classify the rest
export const classifyGrid = async (model: DigitModel, grid: RawImage): Promise<ScanResult> => {
  const cells = sliceCells(grid);
  const board: Board = Array(81).fill(null);
  const confidence: number[] = Array(81).fill(1);
  const digitIndices: number[] = [];
  for (let i = 0; i < 81; i++) {
    if (!isEmptyCell(cells[i])) digitIndices.push(i);
  }
  const batch = new Float32Array(digitIndices.length * DIGIT_SIZE * DIGIT_SIZE);
  digitIndices.forEach((cellIndex, n) => {
    batch.set(prepareDigit(grid, cellIndex), n * DIGIT_SIZE * DIGIT_SIZE);
  });
  const predictions = await model.predict(batch, digitIndices.length);
  digitIndices.forEach((cellIndex, n) => {
    board[cellIndex] = predictions[n].digit;
    confidence[cellIndex] = predictions[n].confidence;
  });
  return { board, confidence };
};
