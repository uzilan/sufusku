import { useEffect, useState } from 'react';
import { getCellCoords } from '../sudoku/coords';
import type { Board } from '../sudoku/logic';
import type { HintResult } from '../sudoku/hint';

const STORAGE_KEY = 'sufusku-board';
const GIVEN_CELLS_KEY = 'sufusku-given-cells';

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

const isValidGivenCells = (value: unknown): value is number[] =>
  Array.isArray(value) && value.every((n) => typeof n === 'number' && n >= 0 && n < 81);

const loadGivenCells = (): Set<number> => {
  try {
    const parsed = JSON.parse(localStorage.getItem(GIVEN_CELLS_KEY) ?? 'null');
    if (isValidGivenCells(parsed)) return new Set(parsed);
  } catch {
    // ignore malformed storage, fall through to empty set
  }
  return new Set();
};

export const useSudokuBoard = () => {
  const [board, setBoard] = useState<Board>(loadBoard);
  const [selectedCell, setSelectedCell] = useState<number | null>(0);
  const [history, setHistory] = useState<Board[]>([]);
  const [future, setFuture] = useState<Board[]>([]);
  const [pendingHint, setPendingHint] = useState<HintResult | null>(null);
  // Cells filled by the last accepted scan — read-only until cleared or replaced by a new scan.
  const [givenCells, setGivenCells] = useState<Set<number>>(loadGivenCells);

  // Persist board to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
  }, [board]);

  useEffect(() => {
    localStorage.setItem(GIVEN_CELLS_KEY, JSON.stringify([...givenCells]));
  }, [givenCells]);

  // Apply a new board, recording the previous one for undo and clearing redo history
  const applyBoard = (newBoard: Board) => {
    setHistory([...history, board]);
    setFuture([]);
    setBoard(newBoard);
    setPendingHint(null);
  };

  // Set number in the selected cell
  const setCellValue = (value: number | null) => {
    if (selectedCell === null || givenCells.has(selectedCell)) return;
    const newBoard = [...board];
    newBoard[selectedCell] = value;
    applyBoard(newBoard);
  };

  // Set a specific cell's value directly, independent of `selectedCell` — used by
  // the Hint reveal step, where the target cell may no longer be selected.
  const setCellValueAt = (index: number, value: number) => {
    const newBoard = [...board];
    newBoard[index] = value;
    applyBoard(newBoard);
  };

  // Reset the board to its initial blank state
  const clearBoard = () => {
    applyBoard(Array(81).fill(null));
    setGivenCells(new Set());
    setSelectedCell(0);
  };

  // Accept a freshly scanned board as the new baseline: its filled cells become
  // read-only givens, and the scan is a hard undo boundary (can't undo past it).
  const acceptScan = (newBoard: Board) => {
    setHistory([]);
    setFuture([]);
    setBoard(newBoard);
    setPendingHint(null);
    setGivenCells(new Set(newBoard.flatMap((v, i) => (v !== null ? [i] : []))));
  };

  const undo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setFuture([...future, board]);
    setBoard(prev);
    setPendingHint(null);
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[future.length - 1];
    setFuture(future.slice(0, -1));
    setHistory([...history, board]);
    setBoard(next);
    setPendingHint(null);
  };

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      if (isCtrlOrCmd && e.key.toLowerCase() === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
        return;
      }
      if (isCtrlOrCmd && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
        return;
      }
      if (isCtrlOrCmd && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
        return;
      }

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
  }, [selectedCell, board, history, future]);

  return {
    board,
    selectedCell,
    setSelectedCell,
    setCellValue,
    setCellValueAt,
    setBoard: applyBoard,
    acceptScan,
    clearBoard,
    undo,
    redo,
    canUndo: history.length > 0,
    canRedo: future.length > 0,
    pendingHint,
    setPendingHint,
    givenCells,
  };
};
