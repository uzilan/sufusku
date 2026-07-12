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

const DIGIT_CROP_MARGIN = 6; // px trimmed in the no-ink fallback crop
const CELL_SEARCH_SLACK = 8; // px searched past the cell on each side for shifted digits
const DIGIT_WINDOW_PADDING = 1.6; // window side vs blob size — digit fills ~1/1.6 of frame like training
const MIN_DIGIT_WINDOW = 24; // px, don't zoom tiny noise blobs to full frame
const MIN_DIGIT_INK = 12; // px, components smaller than this are speckle noise
const MAX_DIGIT_ASPECT = 4; // components longer/thinner than this are line fragments
const MERGE_GAP = 3; // px, digit parts split by thresholding get re-merged within this gap
const MIN_CELL_CONTRAST = 50; // gray levels; below this the cell is uniform paper — empty
const MIN_DIGIT_HEIGHT = 12; // px; shorter blobs are smudges/bleed-through, not digits

export const grayAt = (img: RawImage, x: number, y: number): number => {
  const i = (y * img.width + x) * 4;
  return 0.299 * img.data[i] + 0.587 * img.data[i + 1] + 0.114 * img.data[i + 2];
};

// A cell is empty when no digit-shaped ink blob is found near it — the same
// blob search prepareDigit uses, so gate and classifier can never disagree
// about where the digit is
export const isEmptyCell = (grid: RawImage, index: number): boolean => findDigitBlob(grid, index) === null;

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

// Locate the digit ink blob of cell `index` in the whole warped grid,
// searching with slack past the 50px slice since imperfect warps shift digits
// off-center and even across cell boundaries. Returns the blob bounding box
// in absolute grid coordinates, or null when the cell holds no digit.
const findDigitBlob = (
  grid: RawImage,
  index: number,
): { x0: number; x1: number; y0: number; y1: number } | null => {
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
  // Empty cells are near-uniform paper — noise and page bleed-through don't
  // produce the contrast a printed digit does
  if (hi - lo < MIN_CELL_CONTRAST) return null;
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

  if (!best) return null;

  // Merge other digit parts that sit within a few px of the chosen blob
  // (thresholding can split a digit into pieces)
  let bx0 = best.x0;
  let bx1 = best.x1;
  let by0 = best.y0;
  let by1 = best.y1;
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

  // Digits are taller than speckle or bleed-through smudges
  if (by1 - by0 + 1 < MIN_DIGIT_HEIGHT) return null;

  return { x0: rx0 + bx0, x1: rx0 + bx1, y0: ry0 + by0, y1: ry0 + by1 };
};

// Downsample the digit of cell `index` for the CNN: a square window centered
// on the located blob, padded like the training renders (digit fills ~60-80%
// of the frame). The CNN was trained on centered digits, so centering here is
// what makes real photos (where the warp is never pixel-perfect) classify
// like synthetic input.
export const prepareDigit = (grid: RawImage, index: number): Float32Array => {
  const blob = findDigitBlob(grid, index);

  // No blob (shouldn't happen — isEmptyCell gates on the same search): fall
  // back to the plain center crop of the cell
  if (!blob) {
    const row = Math.floor(index / 9);
    const col = index % 9;
    return downsampleWindow(
      grid,
      col * CELL_SIZE + DIGIT_CROP_MARGIN,
      row * CELL_SIZE + DIGIT_CROP_MARGIN,
      CELL_SIZE - 2 * DIGIT_CROP_MARGIN,
    );
  }

  const bw = blob.x1 - blob.x0 + 1;
  const bh = blob.y1 - blob.y0 + 1;
  const side = Math.min(
    Math.max(Math.round(Math.max(bw, bh) * DIGIT_WINDOW_PADDING), MIN_DIGIT_WINDOW),
    Math.min(grid.width, grid.height),
  );
  const cx = (blob.x0 + blob.x1 + 1) / 2;
  const cy = (blob.y0 + blob.y1 + 1) / 2;
  const wx0 = Math.round(Math.min(Math.max(cx - side / 2, 0), grid.width - side));
  const wy0 = Math.round(Math.min(Math.max(cy - side / 2, 0), grid.height - side));
  return downsampleWindow(grid, wx0, wy0, side);
};

export interface ScanResult {
  board: Board;
  confidence: number[]; // per cell; 1 for empty cells
}

// Gate empties, batch-classify the rest
export const classifyGrid = async (model: DigitModel, grid: RawImage): Promise<ScanResult> => {
  const board: Board = Array(81).fill(null);
  const confidence: number[] = Array(81).fill(1);
  const digitIndices: number[] = [];
  for (let i = 0; i < 81; i++) {
    if (!isEmptyCell(grid, i)) digitIndices.push(i);
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
