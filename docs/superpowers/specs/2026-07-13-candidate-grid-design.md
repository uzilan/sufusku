# Candidate row → 3x3 grid

## Problem

`CandidateRow` renders pencil marks as a single 9-column row pinned to the
bottom of the cell. Digits are tiny (6.5-8px) and hard to read.

## Decision

Replace the 1x9 strip with a 3x3 grid that fills the whole cell, matching the
standard sudoku pencil-mark convention (digit `n` at row `floor((n-1)/3)`,
col `(n-1)%3` — 1 top-left, 9 bottom-right) and giving each digit room to be
legible, similar in spirit to `NumberPad`'s 3x3 layout.

Validated visually via the brainstorming visual companion: mocked up the grid
next to filled-value cells to confirm digit scale reads well against solved
cells on the same board.

## Implementation

`src/components/CandidateRow.tsx` only:

- Container: `position: absolute; inset: 0; display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 1fr);` (was `position: absolute; bottom; left: 0` 1-row grid).
- Map digits 1-9 in row-major order over the 3x3 grid — natural DOM order (1,2,3,4,5,6,7,8,9) already produces the correct row-major placement, no explicit row/col math needed.
- Increase font size from the current 6.5/7.5/8px (`xs`/`sm`/`md`) to a size that reads clearly within a 3x3 slot at existing cell sizes — tune by eye during implementation, keep the same breakpoint keys.
- Keep eliminated-candidate slots rendered with `color: transparent` (unchanged — prevents layout shift, per existing pattern).
- No prop/interface changes; `Cell.tsx` usage is untouched.

## Out of scope

- No changes to `Cell.tsx`, `Board.tsx`, or candidate-computation logic (`getCandidates`).
- No changes to `NumberPad.tsx`.
