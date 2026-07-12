// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useSudokuBoard } from '../src/hooks/useSudokuBoard';
import type { Board } from '../src/sudoku/logic';

describe('useSudokuBoard.setBoard', () => {
  beforeEach(() => localStorage.clear());

  it('replaces the whole board', () => {
    const { result } = renderHook(() => useSudokuBoard());
    const scanned: Board = Array(81).fill(null);
    scanned[0] = 5;
    scanned[80] = 9;
    act(() => result.current.setBoard(scanned));
    expect(result.current.board[0]).toBe(5);
    expect(result.current.board[80]).toBe(9);
  });

  it('is one undoable action', () => {
    const { result } = renderHook(() => useSudokuBoard());
    act(() => result.current.setCellValue(3)); // cell 0 = 3 (selectedCell starts at 0)
    const scanned: Board = Array(81).fill(null);
    scanned[10] = 7;
    act(() => result.current.setBoard(scanned));
    expect(result.current.canUndo).toBe(true);
    act(() => result.current.undo());
    expect(result.current.board[0]).toBe(3);
    expect(result.current.board[10]).toBe(null);
  });

  it('clears redo history', () => {
    const { result } = renderHook(() => useSudokuBoard());
    act(() => result.current.setCellValue(3));
    act(() => result.current.undo());
    expect(result.current.canRedo).toBe(true);
    act(() => result.current.setBoard(Array(81).fill(null)));
    expect(result.current.canRedo).toBe(false);
  });
});
