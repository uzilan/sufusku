# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Sufusku — mobile-first Sudoku helper. User enters their own puzzle into a blank 9x9 grid; app tracks candidates (pencil marks) and highlights conflicts in real-time. Board state persists across reloads via `localStorage`.

## Commands

- `npm run dev` — start Vite dev server (HMR)
- `npm run build` — type-check (`tsc -b`) then build (`vite build`)
- `npm run lint` — run Oxlint
- `npm run preview` — preview production build

No test suite/framework is configured in this repo.

## Stack

React 19 + TypeScript, Vite 8, MUI 9 (Emotion). Oxlint for linting (`.oxlintrc.json`), TypeScript project split into `tsconfig.app.json` / `tsconfig.node.json`.

## Architecture

App logic is split across `src/sudoku/`, `src/hooks/`, and `src/components/`; `src/App.tsx` just composes `Header` and `Board` (plus `NumberPad` on narrow/short viewports).

- `src/sudoku/coords.ts` — `getCellCoords(index)` converts a flat index to `{ row, col, box }` — the box formula is `Math.floor(row/3)*3 + Math.floor(col/3)`. This coordinate mapping is the basis for every row/column/box constraint check.
- `src/sudoku/logic.ts` — pure functions over a `Board` (`Array<number | null>` of length 81):
  - `getConflictingCells(board)` — O(n²) scan over all cell pairs sharing a row/col/box with equal values; returns a `Set` of conflicting indices, recomputed on every render.
  - `getCandidates(board, index)` — computes the pencil-mark set for an empty cell by removing values already present among row/col/box peers (local row/col/box filter only, not a full solve).
- `src/sudoku/solver.ts` — `hasSolution(board, budget)`: backtracking search with the minimum-remaining-values (MRV) heuristic (branches on the empty cell with fewest candidates first) and first-solution early exit, checking whether a board has *any* valid completion. `budget` is a shared mutable `{ remaining: number }` counter decremented once per node visited; returns `'unknown'` the instant it hits zero, so callers can bound worst-case work regardless of board emptiness. `DEFAULT_SOLVE_BUDGET` is 50,000 nodes — in practice a blank-board check finishes in single-digit milliseconds, so this is a safety net, not a real limiter.
- `src/hooks/useSudokuBoard.ts` — owns `board`, `selectedCell`, and undo/redo `history`/`future` stacks (arrays of `Board`, not persisted — reset on reload). `setCellValue` and `clearBoard` both funnel through `applyBoard`, which pushes the pre-change board onto `history` and clears `future` (so any new action invalidates redo). `undo`/`redo` pop between the two stacks. The keyboard `useEffect` on `window` `keydown` handles: digits 1-9 set value, Backspace/Delete/0 clear, arrow keys move `selectedCell` by row/col (clamped at grid edges, no wraparound), and `Ctrl/Cmd+Z` / `Ctrl/Cmd+Shift+Z` / `Ctrl/Cmd+Y` for undo/redo. `board` is lazily initialized from `localStorage` (key `sufusku-board`, validated shape, falls back to a blank 81-cell array) and persisted on every change via a `useEffect`. Returns `{ board, selectedCell, setSelectedCell, setCellValue, clearBoard, undo, redo, canUndo, canRedo }`.
- `src/components/Board.tsx` — renders the 9x9 grid; `getCellStyling(...)` (local to this file) derives background/border/outline per cell from priority order: conflict (red) > single-remaining-candidate (green) > selection (indigo bg / cyan outline) > shares-value-with-selected (cyan tint) > same row/col/box as selected (faint indigo tint). Delegates per-cell rendering to `Cell`. Sizing has three cases — see Layout breakpoints below.
- `src/components/Cell.tsx` — presentational: renders either the resolved value or the candidate row for one cell, given precomputed styling/candidates as props. Candidate row rendering keeps all 9 digit slots in the DOM at all times (eliminated candidates render `color: transparent` rather than being removed) to prevent layout shift.
- `src/components/Header.tsx` — `AppBar`/`Toolbar` with the "Sufusku" title in Permanent Marker font (loaded via Google Fonts link in `index.html`), undo/redo `IconButton`s, and a `HeaderMenu`. Becomes a vertical strip on the left in landscape (`@media (max-height: 599.95px) and (orientation: landscape)`), with the title rotated -90deg and vertically centered below the icon group; the icon group's landscape order is menu (top) then undo then redo, via `order` overrides scoped to the landscape query only — portrait/desktop keep DOM order (undo, redo, menu).
- `src/components/HeaderMenu.tsx` — kebab-icon `IconButton` + MUI `Menu` with two items: "Solve cell" (disabled unless the selected cell is empty; runs `hasSolution` per locally-plausible candidate against a shared budget, then: 0 valid → "No valid value for this cell.", 1 → auto-fills via `onSolveCell`, 2-3 → lists them, >3 → "Too many possible values (N) — not a useful hint.", budget exhausted → "This cell is too complex to solve quickly.") and "Clear all" (calls `clearBoard`). Feedback messages render via a MUI `Snackbar`/`Alert` wrapped in `Portal` — **required**, not decorative: the `AppBar`'s `backdropFilter` establishes a CSS containing block for `position: fixed` descendants, so without the `Portal` the Snackbar renders trapped inside the 49px-tall AppBar box instead of the viewport.
- `src/components/NumberPad.tsx` — 3x3 tap-to-fill grid shown only on portrait phones (`max-width: 599.95px`) or landscape phones (`max-height: 599.95px`); non-candidate numbers render dimmed but stay clickable (tapping always overwrites, matching keyboard behavior).
- `src/theme.ts` — MUI dark theme (custom palette: indigo `#6366f1` primary, cyan `#06b6d4` secondary, deep navy background). Exported via `responsiveFontSizes`. Colors/spacing referenced directly as sx values in components should stay consistent with this theme.
- `src/main.tsx` — React root + `ThemeProvider` wiring.

## Layout breakpoints

Two custom media queries recur across `App.tsx`, `Board.tsx`, `Header.tsx`, and `NumberPad.tsx` — always use the exact same query strings (not MUI's `sm`/`xs` breakpoint shorthand) to avoid cascade-order conflicts between width- and height-based rules:
- Portrait mobile: `@media (max-width: 599.95px) and (orientation: portrait)`
- Landscape mobile: `@media (max-height: 599.95px) and (orientation: landscape)` — in this mode the header collapses to a 56px-wide left strip and the board is sized via `min(calc(100vh - 16px), calc(100vw - 280px))` (applied identically to width and height — don't reuse a `%`-based expression across both properties, since `%` resolves against different bases per axis; width-relative `%` and height-relative `%` mean different things, which caused a real bug here once).
- Desktop: `@media (min-width: 600px) and (min-height: 600px)` — board fills available height via `min(calc(100vh - 81px), calc(100vw - 32px))` instead of the plain `@media (min-width: 600px)` rule's fixed 460px cap (that rule still applies as the fallback for wide-but-short windows, which get the landscape-mobile treatment instead since the two queries are mutually exclusive on height).
