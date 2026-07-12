# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Sufusku — mobile-first Sudoku helper. User enters their own puzzle into a blank 9x9 grid; app tracks candidates (pencil marks) and highlights conflicts in real-time. No pre-loaded puzzles, no solver/suggestions — purely an entry + constraint-visualization tool. Full functional/visual spec: `specification.md`.

## Commands

- `npm run dev` — start Vite dev server (HMR)
- `npm run build` — type-check (`tsc -b`) then build (`vite build`)
- `npm run lint` — run Oxlint
- `npm run preview` — preview production build

No test suite/framework is configured in this repo.

## Stack

React 19 + TypeScript, Vite 8, MUI 9 (Emotion). Oxlint for linting (`.oxlintrc.json`), TypeScript project split into `tsconfig.app.json` / `tsconfig.node.json`.

## Architecture

- `src/App.tsx` — entire application: board state, all Sudoku logic, and rendering. Not yet split into components/hooks.
  - Board state: flat `Array<number | null>` of length 81 (`board[idx]`), plus `selectedCell` index.
  - `getCellCoords(index)` converts a flat index to `{ row, col, box }` — the box formula is `Math.floor(row/3)*3 + Math.floor(col/3)`. This coordinate mapping is the basis for every row/column/box constraint check in the file.
  - `getConflictingCells()` — O(n²) scan over all cell pairs sharing a row/col/box with equal values; returns a `Set` of conflicting indices, recomputed on every render.
  - `getCandidates(index)` — computes the pencil-mark set for an empty cell by removing values already present among row/col/box peers.
  - `getCellStyling(index)` — derives background/border/outline for a cell from selection, peer relation, matching-value highlight, and conflict state (conflict styling always takes priority over selection/peer styling).
  - Keyboard input is wired via a `useEffect` on `window` `keydown` (digits 1-9 set value; Backspace/Delete/0 clear); on-screen digit pad is not yet implemented in `App.tsx` despite being in spec §5.2.
  - Candidate row rendering keeps all 9 digit slots in the DOM at all times (eliminated candidates render `color: transparent` rather than being removed) specifically to prevent layout shift — see spec §2.2.
- `src/theme.ts` — MUI dark theme (custom palette: indigo `#6366f1` primary, cyan `#06b6d4` secondary, deep navy background). Exported via `responsiveFontSizes`. Colors/spacing referenced directly as sx values in `App.tsx` should stay consistent with this theme and spec §3.
- `src/main.tsx` — React root + `ThemeProvider` wiring.

## Spec-implementation gaps

`specification.md` describes a header/app-bar, on-screen input pad, and Clear Cell / Clear Grid controls (§3, §5.2, §5.3) that are not yet present in `src/App.tsx` — only the board grid and keyboard input exist today. When implementing these, follow the spec's exact interaction/visual rules rather than inventing new ones.
