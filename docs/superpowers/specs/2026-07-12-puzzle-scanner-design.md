# Puzzle Scanner — Design Spec

**Date:** 2026-07-12
**Status:** Approved

## Summary

Add on-device sudoku scanning to Sufusku: the user points their phone camera at a printed puzzle, the app detects the grid live, auto-captures, recognizes the digits with a small CNN, and shows a review screen where uncertain digits are highlighted for correction before the result replaces the board. Everything runs in the browser — no backend, no image leaves the device.

## Decisions (settled during brainstorming)

| Decision | Choice |
|---|---|
| Capture UX | Live viewfinder (`getUserMedia`) with grid-detection overlay and auto-capture |
| Input scope | Machine-printed digits only (newspaper/book/screen); handwritten out of scope |
| Review flow | Always show review screen; scan never writes directly to the board |
| CV dependency | Custom-trimmed OpenCV.js build (imgproc only, ~2 MB wasm), lazy-loaded |
| Digit model | Own tiny CNN trained on synthetic font-rendered digits, exported to TF.js (~100 KB), committed to repo |
| Non-empty board | Accept replaces the whole board; existing undo history restores the previous board |

## Architecture

All scan code lives in a lazy-loaded chunk — zero bytes added to the main bundle until the user first taps "Scan puzzle".

### New files

- `src/components/ScanDialog.tsx` — fullscreen MUI `Dialog` with two states: **viewfinder** and **review**. Opened from a new "Scan puzzle" item in `HeaderMenu`. Loaded via `React.lazy` + `Suspense`.
- `src/scan/detect.ts` — grid detection and perspective warp. Pure functions over `ImageData` using OpenCV.js: grayscale → adaptive threshold → `findContours` → quad selection → `warpPerspective`.
- `src/scan/classify.ts` — cell slicing, empty-cell detection (ink density), digit inference (batched CNN), confidence scoring.
- `src/scan/opencv.ts` — lazy loader for the trimmed opencv.js wasm from `public/opencv/`.
- `src/scan/model.ts` — lazy loader for TF.js + the digit model from `public/models/digits/`.
- `tools/train-digits/` — Python training pipeline (one-off, kept for retraining):
  - renders digits 1–9 in ~50 common fonts with random skew, blur, noise, contrast, and thickness variation
  - trains a tiny CNN (target ≤100 KB exported)
  - evaluates on a held-out synthetic set and prints accuracy
  - exports a TF.js graph model to `public/models/digits/`
- `tools/opencv-build/` — Docker-based script producing a trimmed opencv.js (imgproc module only). The built artifact is committed to `public/opencv/` so day-to-day development never needs emscripten.

### Changed files

- `src/hooks/useSudokuBoard.ts` — add `setBoard(board: Board)`, funneling through the existing `applyBoard` so an accepted scan is one undoable action.
- `src/components/HeaderMenu.tsx` — add "Scan puzzle" menu item that opens `ScanDialog`.

### Bundle impact

First scan downloads ~3 MB (opencv wasm ~2 MB, TF.js ~1 MB, model ~100 KB), then browser-cached. Main bundle unchanged.

## Data flow

1. Tap **Scan puzzle** → `ScanDialog` opens → `getUserMedia` requests the rear camera (`facingMode: environment`).
2. Detection loop (rAF, throttled to ~10 fps): downscale current frame to ~320 px wide → grayscale → adaptive threshold → `findContours` → pick the largest contour that approximates to 4 corners and covers >30% of the frame → draw a green quad overlay on the viewfinder.
3. When the quad is stable for ~5 consecutive frames, auto-capture the full-resolution frame.
4. Perspective-warp the captured grid to 450×450, slice into 81 cells of 50×50.
5. Per cell: center-crop to avoid grid lines, ink-density test to classify empty vs digit. Digit cells are normalized to 28×28 and batch-inferred through the CNN, yielding a digit (1–9) and a confidence score.
6. Run the resulting board through the existing `getConflictingCells`.
7. **Review screen**: a 9×9 preview grid (not the live board). Cells are highlighted amber when confidence < 0.9 **or** the cell is in conflict. Tapping a cell opens a NumberPad-style digit picker (1–9 plus clear) to correct it. Buttons: **Retake** (back to viewfinder) and **Accept**.
8. **Accept** → `setBoard(scannedBoard)` → dialog closes. The whole board is replaced; one undo restores the previous board.

## Error handling

- **Camera permission denied or no camera**: fall back to `<input type="file" accept="image/*" capture="environment">` — a single still photo run through the same pipeline from step 4 (detection on the still instead of live frames).
- **No grid found after ~5 s of viewfinding**: show a hint overlay ("Fill the frame with the puzzle. Avoid glare.") and keep trying.
- **Bad recognition**: no special handling — the always-on review screen with conflict/confidence highlighting is the safety net.

## Testing

The repo currently has no test framework. This feature adds **vitest**, scoped to the scan module's pure functions:

- Fixture photos of real printed puzzles in `tests/fixtures/`, with expected 81-character strings.
- Golden tests: fixture image in → expected board out (exercises detect + classify end to end, no DOM).
- Unit tests for cell slicing boundaries and the empty/digit ink-density threshold.
- The training script reports held-out accuracy at train time; model regressions are caught by the golden tests.

UI states (viewfinder overlay, review interactions, fallback input) are verified manually.

## Out of scope

- Handwritten digits
- Multiple puzzles in one frame
- Web-worker pipeline (main thread first; move to a worker only if measured frame processing blocks UI noticeably)
- Merging scan results into an existing board
