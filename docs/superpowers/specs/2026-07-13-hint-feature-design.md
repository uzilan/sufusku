# Hint feature

## Problem

Users who get stuck have no way to find a solvable cell short of manually
checking each empty cell via "Solve cell". The board already highlights naked
singles (green), so a hint only matters once no green cells remain — the user
needs help finding a cell that's solvable via full-board constraints, not just
local row/col/box filtering.

## Decision

Two-tap "Hint" menu item in `HeaderMenu`, separate from the existing "Solve
cell" (which stays manual/selection-based, unchanged):

- **Tap 1 ("Hint"):** find a solvable cell and highlight it (don't reveal the
  value). Menu label flips to "Reveal hint".
- **Tap 2 ("Reveal hint"):** fill in that cell's value (undoable, same
  mechanism as Solve cell's auto-fill). Label reverts to "Hint".

### Cell selection

1. If any empty cell already has exactly one *locally* valid candidate (the
   existing green "naked single" cells), pick the first one in board order —
   cheap, catches cells the user hasn't noticed.
2. Otherwise, scan empty cells in board order. For each, run the same
   per-candidate `hasSolution` check `HeaderMenu`'s "Solve cell" already uses,
   sharing one `budget` object across the *entire* scan (not per cell). Stop
   at the first cell whose true candidate count is 1 (a "hidden single" or
   harder deduction the local filter can't see).
3. If the scan finds no true single anywhere (or the shared budget is
   exhausted first), show a Snackbar: "No hint available right now."

The "Hint" menu item is disabled when the board has no empty cells.

### Highlighting

New `board.hint` palette tokens (dark/light, alongside the existing
`conflictBg`/`singleBg`/etc. tokens in `src/theme.ts`): amber background +
border (`rgba(245, 158, 11, 0.25)` bg / `#f59e0b` border for dark; tuned
equivalents for light), chosen via the brainstorming visual companion against
mockups of amber/purple/pulsing-indigo — amber won for reading as "look here"
without colliding with existing conflict/single/selection colors.

`getCellStyling` in `Board.tsx` gets a new priority tier: conflict > hint >
single > selection > share-tint > related-tint. The hinted cell is also set
as `selectedCell` so NumberPad/keyboard input work normally on it.

### Invalidation

Any board edit (via `setCellValue`, `clearBoard`, undo/redo) between tap 1
and tap 2 clears the pending hint state — label reverts to "Hint", highlight
disappears. A stale highlight could point at a cell whose true candidate
count has changed.

### Out of scope

- No background/precomputed hint scanning. `hasSolution`'s cost is paid
  on-demand at tap time, matching how "Solve cell" already works. The JS
  runtime here is single-threaded with no Web Worker in this codebase, so a
  background scan wouldn't run in parallel — it would just move the same
  work to a different (and possibly wasted, if never used) moment. Revisit
  only if on-demand latency proves to be a real problem.
- No fallback to "best available" cell when no true single exists — the
  Snackbar message is the whole response in that case.
- No changes to "Solve cell", `hasSolution`, or `DEFAULT_SOLVE_BUDGET`.

## Testing

Unit tests for the hint-picker function (new, colocated near existing
`logic.ts`/`solver.ts` tests):

- Board with an existing green cell → picks it without a full scan.
- Board with no green cells but a hidden single somewhere → full scan finds
  it, stops at first match.
- Board with no true single anywhere → "no hint available" result.
- Budget exhausted mid-scan → same "no hint available" result.
- Tap 2 reveal fills the correct value.
- Board edit between tap 1 and tap 2 clears pending hint state.
