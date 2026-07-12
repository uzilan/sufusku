import { getCandidates, type Board } from './logic';

export type SolveResult = 'solvable' | 'unsolvable' | 'unknown';

export const DEFAULT_SOLVE_BUDGET = 50000;

interface Budget {
  remaining: number;
}

// Minimum-remaining-values heuristic: branch on the empty cell with the fewest candidates
const findMRVCell = (board: Board): { index: number; candidates: number[] } | null => {
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

// Backtracking search for whether board has any valid completion.
// budget.remaining bounds total nodes visited; returns 'unknown' if exhausted before resolving.
export const hasSolution = (board: Board, budget: Budget): SolveResult => {
  if (budget.remaining <= 0) return 'unknown';
  budget.remaining -= 1;

  const cell = findMRVCell(board);
  if (cell === null) return 'solvable';
  if (cell.candidates.length === 0) return 'unsolvable';

  for (const value of cell.candidates) {
    const next = [...board];
    next[cell.index] = value;
    const result = hasSolution(next, budget);
    if (result === 'solvable') return 'solvable';
    if (result === 'unknown') return 'unknown';
  }
  return 'unsolvable';
};
