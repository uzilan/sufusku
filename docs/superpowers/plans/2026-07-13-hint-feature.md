# Hint Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a two-tap "Hint" feature to `HeaderMenu` that finds and highlights a solvable empty cell, then reveals its value on a second tap.

**Architecture:** A new pure-function module (`src/sudoku/hint.ts`) does the solving work in two tiers — a cheap "naked single" scan, then a full-board-backtracking scan via the existing `hasSolution` — and is composed into one `findHintCell` entry point. `useSudokuBoard` gains a `pendingHint` state slot that's cleared automatically on every board mutation (reusing `applyBoard`/`undo`/`redo`), which doubles as the "reveal completed" cleanup and the "user edited elsewhere, hint is stale" invalidation. `Board.tsx` and `HeaderMenu.tsx` are threaded with this state to render the highlight and drive the two-tap UI.

**Tech Stack:** React 19 + TypeScript, MUI 9, Vitest.

## Global Constraints

- No changes to `HeaderMenu`'s existing "Solve cell" behavior, `hasSolution`, or `DEFAULT_SOLVE_BUDGET`.
- No background/precomputed scanning — the hint scan runs on-demand at tap time only.
- Highlight styling priority in `Board.tsx`: conflict > hint > single > selection > share-tint > related-tint.
- New palette tokens are amber: dark `hintBg: 'rgba(245, 158, 11, 0.25)'`, `hintBorder: '#f59e0b'`; light `hintBg: 'rgba(245, 158, 11, 0.3)'`, `hintBorder: '#f59e0b'`.
- Snackbar copy when no hint is available: exactly `'No hint available right now.'`
- The "Hint" menu item is disabled when the board has no empty cells (`!board.includes(null)`).

---

### Task 1: `findHintCell` pure functions

**Files:**
- Create: `src/sudoku/hint.ts`
- Test: `tests/hint.test.ts`

**Interfaces:**
- Consumes: `getCandidates(board, index): Set<number>` and `type Board` from `src/sudoku/logic.ts`; `hasSolution(board, budget): SolveResult` and `DEFAULT_SOLVE_BUDGET: number` from `src/sudoku/solver.ts`.
- Produces: `export interface HintResult { index: number; value: number }`; `export const findNakedSingle(board: Board): HintResult | null`; `export const findFullScanHint(board: Board, budget?: { remaining: number }): HintResult | null`; `export const findHintCell(board: Board): HintResult | null`. Task 2 and Task 4 both import `findHintCell` and `HintResult` from this file.

- [ ] **Step 1: Write the failing tests**

Create `tests/hint.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/hint.test.ts`
Expected: FAIL — `Cannot find module '../src/sudoku/hint'`

- [ ] **Step 3: Write the implementation**

Create `src/sudoku/hint.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/hint.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add src/sudoku/hint.ts tests/hint.test.ts
git commit -m "feat: add hint cell finder (naked single + full-board scan)"
```

---

### Task 2: `pendingHint` state in `useSudokuBoard`

**Files:**
- Modify: `src/hooks/useSudokuBoard.ts`
- Test: `tests/useSudokuBoard.test.ts`

**Interfaces:**
- Consumes: `HintResult` from `src/sudoku/hint.ts` (Task 1).
- Produces: hook return value gains `pendingHint: HintResult | null` and `setPendingHint: (hint: HintResult | null) => void`. Task 4 reads/calls both.

- [ ] **Step 1: Write the failing tests**

Add to `tests/useSudokuBoard.test.ts` (new `describe` block, same file, same imports already present):

```typescript
describe('useSudokuBoard.pendingHint', () => {
  beforeEach(() => localStorage.clear());

  it('clears pending hint when a cell value changes', () => {
    const { result } = renderHook(() => useSudokuBoard());
    act(() => result.current.setPendingHint({ index: 5, value: 7 }));
    expect(result.current.pendingHint).toEqual({ index: 5, value: 7 });
    act(() => result.current.setCellValue(3));
    expect(result.current.pendingHint).toBeNull();
  });

  it('clears pending hint on undo', () => {
    const { result } = renderHook(() => useSudokuBoard());
    act(() => result.current.setCellValue(3));
    act(() => result.current.setPendingHint({ index: 5, value: 7 }));
    act(() => result.current.undo());
    expect(result.current.pendingHint).toBeNull();
  });

  it('clears pending hint on redo', () => {
    const { result } = renderHook(() => useSudokuBoard());
    act(() => result.current.setCellValue(3));
    act(() => result.current.undo());
    act(() => result.current.setPendingHint({ index: 5, value: 7 }));
    act(() => result.current.redo());
    expect(result.current.pendingHint).toBeNull();
  });

  it('clears pending hint when the board is replaced via setBoard', () => {
    const { result } = renderHook(() => useSudokuBoard());
    act(() => result.current.setPendingHint({ index: 5, value: 7 }));
    act(() => result.current.setBoard(Array(81).fill(null)));
    expect(result.current.pendingHint).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/useSudokuBoard.test.ts`
Expected: FAIL — `result.current.setPendingHint is not a function`

- [ ] **Step 3: Write the implementation**

In `src/hooks/useSudokuBoard.ts`:

Add the import at the top:

```typescript
import type { HintResult } from '../sudoku/hint';
```

Add state after the existing `future` state (line 26):

```typescript
  const [pendingHint, setPendingHint] = useState<HintResult | null>(null);
```

Update `applyBoard`, `undo`, and `redo` to also clear it:

```typescript
  // Apply a new board, recording the previous one for undo and clearing redo history
  const applyBoard = (newBoard: Board) => {
    setHistory([...history, board]);
    setFuture([]);
    setBoard(newBoard);
    setPendingHint(null);
  };
```

```typescript
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
```

Add `pendingHint` and `setPendingHint` to the returned object:

```typescript
  return {
    board,
    selectedCell,
    setSelectedCell,
    setCellValue,
    setBoard: applyBoard,
    clearBoard,
    undo,
    redo,
    canUndo: history.length > 0,
    canRedo: future.length > 0,
    pendingHint,
    setPendingHint,
  };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/useSudokuBoard.test.ts`
Expected: PASS (all tests, including the 3 pre-existing `setBoard` ones)

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useSudokuBoard.ts tests/useSudokuBoard.test.ts
git commit -m "feat: add pendingHint state to useSudokuBoard, cleared on any board mutation"
```

---

### Task 3: Amber highlight tokens + `Board.tsx` styling tier

**Files:**
- Modify: `src/theme.ts`
- Modify: `src/components/Board.tsx`

**Interfaces:**
- Consumes: none new.
- Produces: `BoardPalette.hintBg: string` and `BoardPalette.hintBorder: string` (Task 4 doesn't need these directly, but `Board.tsx`'s new `hintCell` prop is read by `App.tsx` in Task 4).
- `BoardProps` gains `hintCell: number | null`.

There's no existing test harness for `Board.tsx` or `theme.ts` (no component-render tests in this repo — `tests/useSudokuBoard.test.ts` is the only jsdom test, and it targets the hook, not rendering). Verify this task with `npm run build` (type-checks the new prop/token usage) and the manual check in Step 4.

- [ ] **Step 1: Add the palette tokens**

In `src/theme.ts`, add two fields to the `BoardPalette` interface (after `shareTint`):

```typescript
  shareTint: string; // shares value with selection
  hintBg: string; // pending-hint highlight background
  hintBorder: string; // pending-hint highlight border
  padBorder: string; // NumberPad button border
```

Add values to the `dark` scheme's `board` object (after `shareTint`):

```typescript
          shareTint: 'rgba(6, 182, 212, 0.2)',
          hintBg: 'rgba(245, 158, 11, 0.25)',
          hintBorder: '#f59e0b',
          padBorder: 'rgba(255, 255, 255, 0.08)',
```

Add values to the `light` scheme's `board` object (after `shareTint`):

```typescript
          shareTint: 'rgba(6, 182, 212, 0.2)',
          hintBg: 'rgba(245, 158, 11, 0.3)',
          hintBorder: '#f59e0b',
          padBorder: 'rgba(0, 0, 0, 0.1)',
```

- [ ] **Step 2: Add the `hintCell` prop and styling tier in `Board.tsx`**

In `src/components/Board.tsx`, update `BoardProps`:

```typescript
interface BoardProps {
  board: BoardState;
  selectedCell: number | null;
  hintCell: number | null;
  onSelectCell: (index: number) => void;
}
```

Update `getCellStyling` to accept and use `hintCell`, inserting the hint tier between conflict and single-candidate (and guarding the two `isSelected`/`else` branches that already special-case conflict):

```typescript
const getCellStyling = (
  board: BoardState,
  selectedCell: number | null,
  conflictingCells: Set<number>,
  index: number,
  candidates: Set<number>,
  hintCell: number | null,
  b: BoardPalette,
) => {
  const isSelected = selectedCell === index;
  const isConflicting = conflictingCells.has(index);
  const isSingleCandidate = board[index] === null && candidates.size === 1;
  const isHinted = hintCell === index;

  let bgcolor = 'background.paper';
  let borderColor = b.padBorder;

  if (isConflicting) {
    bgcolor = b.conflictBg;
    borderColor = b.conflictBorder;
  } else if (isHinted) {
    bgcolor = b.hintBg;
    borderColor = b.hintBorder;
  } else if (isSingleCandidate) {
    bgcolor = b.singleBg;
  }

  if (selectedCell !== null) {
    const sc = getCellCoords(selectedCell);
    const cc = getCellCoords(index);
    const isRelated = sc.row === cc.row || sc.col === cc.col || sc.box === cc.box;
    const selectedValue = board[selectedCell];
    const sharesValue = selectedValue !== null && board[index] === selectedValue;

    if (isSelected) {
      if (isConflicting) {
        bgcolor = b.conflictSelectedBg;
        borderColor = '#ef4444';
      } else if (!isHinted) {
        borderColor = '#06b6d4';
        if (!isSingleCandidate) bgcolor = b.selectionBg;
      }
    } else if (!isConflicting && !isSingleCandidate && !isHinted) {
      if (sharesValue) bgcolor = b.shareTint;
      else if (isRelated) bgcolor = b.relatedTint;
    }
  }

  return { bgcolor, borderColor, isConflicting };
};
```

Update the `Board` component to accept and pass through `hintCell`:

```typescript
const Board = ({ board, selectedCell, hintCell, onSelectCell }: BoardProps) => {
```

```typescript
        const { bgcolor, borderColor, isConflicting } = getCellStyling(
          board,
          selectedCell,
          conflictingCells,
          idx,
          candidates,
          hintCell,
          b,
        );
```

- [ ] **Step 3: Type-check**

Run: `npx tsc -b`
Expected: fails only on `App.tsx` not yet passing `hintCell` to `<Board>` — confirm the error is exactly that (missing required prop `hintCell` on `Board`), not anything about `theme.ts` or the styling function itself.

- [ ] **Step 4: Commit**

```bash
git add src/theme.ts src/components/Board.tsx
git commit -m "feat: add amber hint highlight tier to Board styling"
```

(The `tsc` error from Step 3 about `App.tsx` is expected and resolved in Task 4 — don't fix it here.)

---

### Task 4: Wire the two-tap Hint menu item

**Files:**
- Modify: `src/components/HeaderMenu.tsx`
- Modify: `src/components/Header.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `findHintCell`, `HintResult` from `src/sudoku/hint.ts` (Task 1); `pendingHint`, `setPendingHint` from `useSudokuBoard` (Task 2); `hintCell` prop on `Board` (Task 3).
- Produces: none consumed by later tasks (this is the last task).

- [ ] **Step 1: Update `HeaderMenu.tsx`**

Add the import:

```typescript
import { findHintCell, type HintResult } from '../sudoku/hint';
```

Update `HeaderMenuProps`:

```typescript
interface HeaderMenuProps {
  board: BoardState;
  selectedCell: number | null;
  pendingHint: HintResult | null;
  onSelectCell: (index: number) => void;
  onSetPendingHint: (hint: HintResult | null) => void;
  onClearAll: () => void;
  onSolveCell: (value: number) => void;
  onScanAccept: (board: BoardState) => void;
}
```

Update the component signature:

```typescript
const HeaderMenu = ({
  board,
  selectedCell,
  pendingHint,
  onSelectCell,
  onSetPendingHint,
  onClearAll,
  onSolveCell,
  onScanAccept,
}: HeaderMenuProps) => {
```

Add the handler (after `handleSolveCell`, before `handleScan`):

```typescript
  const isBoardFull = !board.includes(null);

  const handleHint = () => {
    handleClose();
    if (pendingHint !== null) {
      onSolveCell(pendingHint.value);
      return;
    }
    const found = findHintCell(board);
    if (found === null) {
      setMessage('No hint available right now.');
      return;
    }
    onSelectCell(found.index);
    onSetPendingHint(found);
  };
```

Add the menu item (after "Solve cell", before "Scan puzzle"):

```typescript
        <MenuItem onClick={handleHint} disabled={isBoardFull}>
          {pendingHint !== null ? 'Reveal hint' : 'Hint'}
        </MenuItem>
```

- [ ] **Step 2: Update `Header.tsx`**

Add the import:

```typescript
import type { HintResult } from '../sudoku/hint';
```

Update `HeaderProps`:

```typescript
interface HeaderProps {
  board: BoardState;
  selectedCell: number | null;
  pendingHint: HintResult | null;
  onSelectCell: (index: number) => void;
  onSetPendingHint: (hint: HintResult | null) => void;
  onClearAll: () => void;
  onSolveCell: (value: number) => void;
  onScanAccept: (board: BoardState) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}
```

Update the component's destructured props and the `<HeaderMenu>` usage:

```typescript
const Header = ({
  board,
  selectedCell,
  pendingHint,
  onSelectCell,
  onSetPendingHint,
  onClearAll,
  onSolveCell,
  onScanAccept,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: HeaderProps) => (
```

```typescript
          <HeaderMenu
            board={board}
            selectedCell={selectedCell}
            pendingHint={pendingHint}
            onSelectCell={onSelectCell}
            onSetPendingHint={onSetPendingHint}
            onClearAll={onClearAll}
            onSolveCell={onSolveCell}
            onScanAccept={onScanAccept}
          />
```

- [ ] **Step 3: Update `App.tsx`**

Update the hook destructuring:

```typescript
  const {
    board,
    selectedCell,
    setSelectedCell,
    setCellValue,
    setBoard,
    clearBoard,
    undo,
    redo,
    canUndo,
    canRedo,
    pendingHint,
    setPendingHint,
  } = useSudokuBoard();
```

Update the `<Header>` usage:

```typescript
      <Header
        board={board}
        selectedCell={selectedCell}
        pendingHint={pendingHint}
        onSelectCell={setSelectedCell}
        onSetPendingHint={setPendingHint}
        onClearAll={clearBoard}
        onSolveCell={setCellValue}
        onScanAccept={setBoard}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
```

Update the `<Board>` usage:

```typescript
        <Board
          board={board}
          selectedCell={selectedCell}
          hintCell={pendingHint?.index ?? null}
          onSelectCell={setSelectedCell}
        />
```

- [ ] **Step 4: Type-check and run the full test suite**

Run: `npx tsc -b && npm test`
Expected: both pass with no errors.

- [ ] **Step 5: Manual smoke test**

Run: `npm run dev`, open the app in a browser.

- Enter a puzzle with at least one empty cell. Open the kebab menu — confirm "Hint" is enabled.
- Tap "Hint": a cell should become selected with an amber background/border, and the menu item should now read "Reveal hint".
- Tap "Reveal hint": the cell fills in with its value, undo/redo both work normally afterward, and the menu item reverts to "Hint".
- Tap "Hint" again, then edit a different cell before tapping "Reveal hint" — confirm the amber highlight clears and the menu item reverts to "Hint" (no stale reveal).
- Fill every cell (or clear-all then fill just one and check the reverse) — confirm "Hint" is disabled when the board has no empty cells.

- [ ] **Step 6: Commit**

```bash
git add src/components/HeaderMenu.tsx src/components/Header.tsx src/App.tsx
git commit -m "feat: wire two-tap Hint menu item"
```
