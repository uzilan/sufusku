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
  it('returns 784 values, ~0 for blank cells', () => {
    const out = prepareDigit(makeImage(CELL_SIZE, CELL_SIZE));
    expect(out).toHaveLength(DIGIT_SIZE * DIGIT_SIZE);
    expect(Math.max(...out)).toBeLessThan(0.05);
  });

  it('maps ink to values near 1', () => {
    const cell = makeImage(CELL_SIZE, CELL_SIZE);
    fillRect(cell, 15, 12, 20, 26, 0); // solid black blob
    const out = prepareDigit(cell);
    expect(Math.max(...out)).toBeGreaterThan(0.9);
  });
});
