import { describe, expect, it } from 'vitest';
import { findNakedSingle, findFullScanHint, findHintCell } from '../src/sudoku/hint';
import type { Board } from '../src/sudoku/logic';

const SOLVED: Board = [
  5, 3, 4, 6, 7, 8, 9, 1, 2,
  6, 7, 2, 1, 9, 5, 3, 4, 8,
  1, 9, 8, 3, 4, 2, 5, 6, 7,
  8, 5, 9, 7, 6, 1, 4, 2, 3,
  4, 2, 6, 8, 5, 3, 7, 9, 1,
  7, 1, 3, 9, 2, 4, 8, 5, 6,
  9, 6, 1, 5, 3, 7, 2, 8, 4,
  2, 8, 7, 4, 1, 9, 6, 3, 5,
  3, 4, 5, 2, 8, 6, 1, 7, 9,
];

// SOLVED with cells 0, 3, 9 cleared. Cell 0's local candidates are {5, 6} (not a naked
// single — box0 is missing {5, 3, 6} for its 3 empty cells, row0 narrows cell 0 to {5, 6}),
// but only 5 keeps the board solvable: cell 9 (row1,col0) is a naked single that can only
// be 6, so setting cell 0 to 6 leaves cell 9 with zero candidates.
const HIDDEN_SINGLE_BOARD: Board = (() => {
  const board = [...SOLVED];
  board[0] = null;
  board[3] = null;
  board[9] = null;
  return board;
})();

// A near-blank board: every empty cell has many valid candidates, so no cell resolves to
// a true single anywhere.
const NO_SINGLE_BOARD: Board = (() => {
  const board: Board = Array(81).fill(null);
  board[2] = 1;
  return board;
})();

describe('findNakedSingle', () => {
  it('returns the first empty cell with exactly one local candidate', () => {
    const board = [...SOLVED];
    board[3] = null; // row 0 is missing only 6 once this cell is cleared
    expect(findNakedSingle(board)).toEqual({ index: 3, value: 6 });
  });

  it('returns null when no cell has exactly one local candidate', () => {
    expect(findNakedSingle(NO_SINGLE_BOARD)).toBeNull();
  });
});

describe('findFullScanHint', () => {
  it('finds a hidden single that local candidates alone cannot see', () => {
    expect(findFullScanHint(HIDDEN_SINGLE_BOARD)).toEqual({ index: 0, value: 5 });
  });

  it('returns null when no cell has a true single value', () => {
    expect(findFullScanHint(NO_SINGLE_BOARD)).toBeNull();
  });

  it('returns null when the budget is exhausted before resolving', () => {
    expect(findFullScanHint(HIDDEN_SINGLE_BOARD, { remaining: 1 })).toBeNull();
  });
});

describe('findHintCell', () => {
  it('prefers a naked single over the full scan', () => {
    const board = [...SOLVED];
    board[3] = null;
    expect(findHintCell(board)).toEqual({ index: 3, value: 6 });
  });

  it('returns null when neither a naked single nor a full-scan hint exists', () => {
    expect(findHintCell(NO_SINGLE_BOARD)).toBeNull();
  });
});
