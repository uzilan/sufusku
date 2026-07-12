export interface CellCoords {
  row: number;
  col: number;
  box: number;
}

// Get current row, column, and box block index for a cell index
export const getCellCoords = (index: number): CellCoords => ({
  row: Math.floor(index / 9),
  col: index % 9,
  box: Math.floor(Math.floor(index / 9) / 3) * 3 + Math.floor((index % 9) / 3),
});
