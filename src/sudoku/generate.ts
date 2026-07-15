import { getCandidates, type Board } from './logic';

export type Difficulty = 'easy' | 'medium' | 'hard';

// Target clue (filled-cell) counts. Digging stops early if further removal would
// break uniqueness, so the actual count can end up somewhat higher than this.
const CLUE_TARGETS: Record<Difficulty, number> = {
  easy: 40,
  medium: 32,
  hard: 26,
};

const UNIQUENESS_BUDGET = 20000;

const shuffled = <T>(values: T[]): T[] => {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

// Minimum-remaining-values cell pick, mirroring solver.ts's heuristic but operating
// on a mutable board in place (avoids an array copy per node during generation).
const pickMRVCell = (board: Board): { index: number; candidates: number[] } | null => {
  let best: { index: number; candidates: number[] } | null = null;
  for (let i = 0; i < 81; i++) {
    if (board[i] !== null) continue;
    const candidates = [...getCandidates(board, i)];
    if (best === null || candidates.length < best.candidates.length) {
      best = { index: i, candidates };
      if (candidates.length <= 1) break;
    }
  }
  return best;
};

// Randomized backtracking fill, mutating `board` in place — produces a complete,
// valid, randomly-shuffled solved grid.
const fillSolvedBoard = (board: Board): boolean => {
  const cell = pickMRVCell(board);
  if (cell === null) return true; // no empty cells left: solved
  if (cell.candidates.length === 0) return false;

  for (const value of shuffled(cell.candidates)) {
    board[cell.index] = value;
    if (fillSolvedBoard(board)) return true;
  }
  board[cell.index] = null;
  return false;
};

export const generateSolvedBoard = (): Board => {
  const board: Board = Array(81).fill(null);
  fillSolvedBoard(board);
  return board;
};

interface SolutionSearch {
  remaining: number;
  found: number;
}

// Counts solutions up to `search.found === cap`, mutating `board` in place and
// backtracking after each branch. Stops as soon as a second solution is found,
// so proving non-uniqueness is cheap even though proving uniqueness is not.
const countSolutions = (board: Board, search: SolutionSearch, cap: number): void => {
  if (search.found >= cap || search.remaining <= 0) return;
  search.remaining -= 1;

  const cell = pickMRVCell(board);
  if (cell === null) {
    search.found += 1;
    return;
  }
  if (cell.candidates.length === 0) return;

  for (const value of cell.candidates) {
    if (search.found >= cap || search.remaining <= 0) return;
    board[cell.index] = value;
    countSolutions(board, search, cap);
    board[cell.index] = null;
  }
};

// Conservative: only confirms uniqueness if the search resolves within budget.
// A budget exhaustion is treated as "not confirmed" so digging never risks
// producing a puzzle with more than one solution.
const hasUniqueSolution = (board: Board): boolean => {
  const search: SolutionSearch = { remaining: UNIQUENESS_BUDGET, found: 0 };
  countSolutions(board, search, 2);
  return search.found === 1;
};

// Generates a puzzle by digging holes out of a randomly-filled solved grid, only
// keeping a removal when the resulting board still has exactly one solution.
export const generatePuzzle = (difficulty: Difficulty): Board => {
  const puzzle = generateSolvedBoard();
  const targetClues = CLUE_TARGETS[difficulty];
  let clues = 81;

  for (const index of shuffled(Array.from({ length: 81 }, (_, i) => i))) {
    if (clues <= targetClues) break;
    const removedValue = puzzle[index];
    puzzle[index] = null;
    if (hasUniqueSolution(puzzle)) {
      clues -= 1;
    } else {
      puzzle[index] = removedValue;
    }
  }
  return puzzle;
};
