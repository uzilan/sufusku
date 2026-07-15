import { describe, expect, it } from 'vitest';
import { generatePuzzle, generateSolvedBoard, type Difficulty } from '../src/sudoku/generate';
import { getConflictingCells } from '../src/sudoku/logic';
import { hasSolution, DEFAULT_SOLVE_BUDGET } from '../src/sudoku/solver';

describe('generateSolvedBoard', () => {
  it('produces a full, conflict-free grid', () => {
    const board = generateSolvedBoard();
    expect(board).toHaveLength(81);
    expect(board.every((v) => typeof v === 'number' && v >= 1 && v <= 9)).toBe(true);
    expect(getConflictingCells(board).size).toBe(0);
  });

  it('is randomized across calls', () => {
    const a = generateSolvedBoard();
    const b = generateSolvedBoard();
    expect(a).not.toEqual(b);
  });
});

describe('generatePuzzle', () => {
  const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

  it.each(difficulties)('%s puzzle is conflict-free and solvable', (difficulty) => {
    const puzzle = generatePuzzle(difficulty);
    expect(puzzle).toHaveLength(81);
    expect(getConflictingCells(puzzle).size).toBe(0);
    expect(hasSolution(puzzle, { remaining: DEFAULT_SOLVE_BUDGET })).toBe('solvable');
  });

  it.each(difficulties)('%s puzzle removes cells from a full grid', (difficulty) => {
    const puzzle = generatePuzzle(difficulty);
    const clues = puzzle.filter((v) => v !== null).length;
    expect(clues).toBeLessThan(81);
    expect(clues).toBeGreaterThan(0);
  });

  it('harder difficulties end up with fewer or equal clues than easier ones', () => {
    const clueCount = (difficulty: Difficulty) =>
      generatePuzzle(difficulty).filter((v) => v !== null).length;
    // Run a few times since digging is randomized and can stop early on any given attempt.
    const trials = 3;
    let easyLE = 0;
    for (let i = 0; i < trials; i++) {
      if (clueCount('hard') <= clueCount('easy')) easyLE++;
    }
    expect(easyLE).toBe(trials);
  });
});
