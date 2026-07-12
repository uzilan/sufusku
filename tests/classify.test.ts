import { describe, expect, it } from 'vitest';
import { DIGIT_SIZE, GRID_SIZE, isEmptyCell, prepareDigit } from '../src/scan/classify';
import { fillRect, makeImage } from './helpers/image';

describe('isEmptyCell', () => {
  it('treats a blank cell as empty', () => {
    expect(isEmptyCell(makeImage(GRID_SIZE, GRID_SIZE), 40)).toBe(true);
  });

  it('treats a cell with a digit-sized ink blob as non-empty', () => {
    const grid = makeImage(GRID_SIZE, GRID_SIZE);
    fillRect(grid, 218, 214, 14, 22, 20); // digit-sized dark blob in cell 40
    expect(isEmptyCell(grid, 40)).toBe(false);
  });

  it('detects a digit shifted to the cell edge (imperfect warp)', () => {
    const grid = makeImage(GRID_SIZE, GRID_SIZE);
    fillRect(grid, 201, 230, 14, 20, 20); // blob hugging cell 40's left edge
    expect(isEmptyCell(grid, 40)).toBe(false);
  });

  it('ignores grid lines around the cell', () => {
    const grid = makeImage(GRID_SIZE, GRID_SIZE);
    fillRect(grid, 200, 150, 3, 150, 20); // vertical line through cell 40's left edge
    fillRect(grid, 150, 200, 150, 3, 20); // horizontal line through its top edge
    expect(isEmptyCell(grid, 40)).toBe(true);
  });

  it('ignores faint low-contrast smudges (page bleed-through)', () => {
    const grid = makeImage(GRID_SIZE, GRID_SIZE, 230);
    fillRect(grid, 218, 214, 14, 22, 195); // smudge only 35 gray levels darker
    expect(isEmptyCell(grid, 40)).toBe(true);
  });
});

describe('prepareDigit', () => {
  // center of mass of the 28x28 output, for centering assertions
  const centerOfMass = (out: Float32Array): { x: number; y: number } => {
    let sx = 0;
    let sy = 0;
    let total = 0;
    for (let y = 0; y < DIGIT_SIZE; y++) {
      for (let x = 0; x < DIGIT_SIZE; x++) {
        const v = out[y * DIGIT_SIZE + x];
        sx += x * v;
        sy += y * v;
        total += v;
      }
    }
    return { x: sx / total, y: sy / total };
  };

  it('returns 784 values, ~0 for blank cells', () => {
    const out = prepareDigit(makeImage(GRID_SIZE, GRID_SIZE), 40);
    expect(out).toHaveLength(DIGIT_SIZE * DIGIT_SIZE);
    expect(Math.max(...out)).toBeLessThan(0.05);
  });

  it('maps ink to values near 1', () => {
    const grid = makeImage(GRID_SIZE, GRID_SIZE);
    // digit-sized blob centered in cell 40 (row 4, col 4: x 200-250, y 200-250)
    fillRect(grid, 215, 212, 20, 26, 0);
    const out = prepareDigit(grid, 40);
    expect(Math.max(...out)).toBeGreaterThan(0.9);
  });

  it('re-centers a digit that sits off-center in its cell', () => {
    const grid = makeImage(GRID_SIZE, GRID_SIZE);
    // blob pushed into the bottom-right corner of cell 40, up to the cell edge
    fillRect(grid, 235, 232, 14, 18, 0);
    const out = prepareDigit(grid, 40);
    const { x, y } = centerOfMass(out);
    expect(Math.abs(x - (DIGIT_SIZE - 1) / 2)).toBeLessThan(3);
    expect(Math.abs(y - (DIGIT_SIZE - 1) / 2)).toBeLessThan(3);
  });

  it('ignores grid-line bands when locating the digit', () => {
    const grid = makeImage(GRID_SIZE, GRID_SIZE);
    fillRect(grid, 200, 200, 3, GRID_SIZE - 200, 0); // vertical line at cell 40's left edge
    fillRect(grid, 218, 214, 14, 20, 0); // the digit
    const out = prepareDigit(grid, 40);
    const { x } = centerOfMass(out);
    // if the line were counted as ink, the window would be dragged far left
    expect(Math.abs(x - (DIGIT_SIZE - 1) / 2)).toBeLessThan(4);
  });
});
