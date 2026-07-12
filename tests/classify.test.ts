import { describe, expect, it } from 'vitest';
import {
  CELL_SIZE,
  DIGIT_SIZE,
  GRID_SIZE,
  isEmptyCell,
  prepareDigit,
  sliceCells,
} from '../src/scan/classify';
import { fillRect, makeImage } from './helpers/image';

describe('sliceCells', () => {
  it('returns 81 cells of CELL_SIZE, row-major', () => {
    const grid = makeImage(GRID_SIZE, GRID_SIZE);
    // Mark top-left pixel of cell (row 2, col 5) — flat index 23
    fillRect(grid, 5 * CELL_SIZE, 2 * CELL_SIZE, 1, 1, 0);
    const cells = sliceCells(grid);
    expect(cells).toHaveLength(81);
    expect(cells[0].width).toBe(CELL_SIZE);
    expect(cells[0].height).toBe(CELL_SIZE);
    expect(cells[23].data[0]).toBe(0); // marked pixel landed in cell 23
    expect(cells[22].data[0]).toBe(255);
  });
});

describe('isEmptyCell', () => {
  it('treats a blank cell as empty', () => {
    expect(isEmptyCell(makeImage(CELL_SIZE, CELL_SIZE))).toBe(true);
  });

  it('treats a cell with a central ink blob as non-empty', () => {
    const cell = makeImage(CELL_SIZE, CELL_SIZE);
    fillRect(cell, 18, 14, 14, 22, 20); // digit-sized dark blob
    expect(isEmptyCell(cell)).toBe(false);
  });

  it('ignores grid lines at the cell borders', () => {
    const cell = makeImage(CELL_SIZE, CELL_SIZE);
    fillRect(cell, 0, 0, CELL_SIZE, 3, 20); // top grid line
    fillRect(cell, 0, 0, 3, CELL_SIZE, 20); // left grid line
    expect(isEmptyCell(cell)).toBe(true);
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
