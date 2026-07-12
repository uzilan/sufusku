import { getCellCoords } from './coords';

export type Board = Array<number | null>;

// Find all cells that are currently in conflict (duplicate values in same row, col, or box)
export const getConflictingCells = (board: Board): Set<number> => {
  const conflicting = new Set<number>();
  for (let i = 0; i < 81; i++) {
    const val = board[i];
    if (val === null) continue;
    const coords = getCellCoords(i);
    for (let j = i + 1; j < 81; j++) {
      if (board[j] === val) {
        const otherCoords = getCellCoords(j);
        if (
          coords.row === otherCoords.row ||
          coords.col === otherCoords.col ||
          coords.box === otherCoords.box
        ) {
          conflicting.add(i);
          conflicting.add(j);
        }
      }
    }
  }
  return conflicting;
};

// Dynamically calculate candidates (possible values 1-9) for a cell
export const getCandidates = (board: Board, currentIndex: number): Set<number> => {
  if (board[currentIndex] !== null) return new Set();
  const candidates = new Set<number>([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const { row: tr, col: tc, box: tb } = getCellCoords(currentIndex);
  for (let i = 0; i < 81; i++) {
    const val = board[i];
    if (val === null || i === currentIndex) continue;
    const { row, col, box } = getCellCoords(i);
    if (row === tr || col === tc || box === tb) candidates.delete(val);
  }
  return candidates;
};
