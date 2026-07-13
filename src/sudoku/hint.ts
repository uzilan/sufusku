import { getCandidates, type Board } from './logic';
import { hasSolution, DEFAULT_SOLVE_BUDGET, type SolveResult } from './solver';

export interface HintResult {
  index: number;
  value: number;
}

// Step 1: first empty cell with exactly one locally valid candidate (a "naked single") —
// the same cells the board already highlights green.
export const findNakedSingle = (board: Board): HintResult | null => {
  for (let i = 0; i < 81; i++) {
    if (board[i] !== null) continue;
    const candidates = getCandidates(board, i);
    if (candidates.size === 1) return { index: i, value: [...candidates][0] };
  }
  return null;
};

// Step 2: scan empty cells for the first one whose true (full-board-solvable) candidate
// count is 1, even if its local candidate set is larger — a "hidden single" that row/col/box
// filtering alone can't see. Stops at the first match; a shared budget bounds total
// backtracking work across the whole scan, matching how HeaderMenu's "Solve cell" already
// shares one budget across a single cell's candidates.
export const findFullScanHint = (
  board: Board,
  budget: { remaining: number } = { remaining: DEFAULT_SOLVE_BUDGET },
): HintResult | null => {
  for (let i = 0; i < 81; i++) {
    if (board[i] !== null) continue;
    const candidates = [...getCandidates(board, i)];
    let validCount = 0;
    let validValue: number | null = null;
    for (const value of candidates) {
      const tentative = [...board];
      tentative[i] = value;
      const result: SolveResult = hasSolution(tentative, budget);
      if (result === 'unknown') return null;
      if (result === 'solvable') {
        validCount++;
        validValue = value;
      }
      if (validCount > 1) break;
    }
    if (validCount === 1 && validValue !== null) return { index: i, value: validValue };
  }
  return null;
};

// Entry point for the "Hint" feature: prefer a naked single (cheap), otherwise fall back to
// a full-board scan for a hidden single.
export const findHintCell = (board: Board): HintResult | null =>
  findNakedSingle(board) ?? findFullScanHint(board);
