import { useEffect, useState } from 'react';
import { getCellCoords } from '../sudoku/coords';
import type { Board } from '../sudoku/logic';

const STORAGE_KEY = 'sufusku-board';

const isValidBoard = (value: unknown): value is Board =>
  Array.isArray(value) &&
  value.length === 81 &&
  value.every((cell) => cell === null || (typeof cell === 'number' && cell >= 1 && cell <= 9));

const loadBoard = (): Board => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (isValidBoard(parsed)) return parsed;
  } catch {
    // ignore malformed storage, fall through to blank board
  }
  return Array(81).fill(null);
};

export const useSudokuBoard = () => {
  const [board, setBoard] = useState<Board>(loadBoard);
  const [selectedCell, setSelectedCell] = useState<number | null>(0);

  // Persist board to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
  }, [board]);

  // Set number in the selected cell
  const setCellValue = (value: number | null) => {
    if (selectedCell === null) return;
    const newBoard = [...board];
    newBoard[selectedCell] = value;
    setBoard(newBoard);
  };

  // Reset the board to its initial blank state
  const clearBoard = () => {
    setBoard(Array(81).fill(null));
    setSelectedCell(0);
  };

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedCell === null) return;
      if (e.key >= '1' && e.key <= '9') setCellValue(parseInt(e.key));
      else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') setCellValue(null);
      else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const { row, col } = getCellCoords(selectedCell);
        let newRow = row;
        let newCol = col;
        if (e.key === 'ArrowUp') newRow = Math.max(0, row - 1);
        else if (e.key === 'ArrowDown') newRow = Math.min(8, row + 1);
        else if (e.key === 'ArrowLeft') newCol = Math.max(0, col - 1);
        else if (e.key === 'ArrowRight') newCol = Math.min(8, col + 1);
        setSelectedCell(newRow * 9 + newCol);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, board]);

  return { board, selectedCell, setSelectedCell, setCellValue, clearBoard };
};
