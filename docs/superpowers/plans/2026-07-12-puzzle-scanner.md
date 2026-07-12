# Puzzle Scanner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On-device sudoku scanning: live camera viewfinder detects the printed grid, a small CNN reads the digits, a review screen lets the user fix uncertain cells, and Accept replaces the board as one undoable action.

**Architecture:** All scan code lives in a lazy-loaded chunk (`src/scan/` + `ScanDialog`). Grid detection uses a custom-trimmed OpenCV.js wasm build loaded via script tag from `public/opencv/`. Digit recognition uses a tiny Keras CNN trained on synthetic font-rendered digits, exported to TF.js and committed to `public/models/digits/`. Pure pipeline functions (slicing, classification, detection) are testable in Node via vitest.

**Tech Stack:** React 19 + TypeScript + MUI 9 (existing), OpenCV.js 4.10 (trimmed, ~2 MB), `@tensorflow/tfjs`, vitest + jsdom + @testing-library/react (new dev deps), Python 3.11 + TensorFlow/Keras + Pillow (training, one-off), Docker (opencv build, one-off).

**Spec:** `docs/superpowers/specs/2026-07-12-puzzle-scanner-design.md`

## Global Constraints

- Nothing scan-related may land in the main bundle: `ScanDialog` is `React.lazy`, opencv.js loads via script tag on demand, TF.js is imported only from files reachable solely through `ScanDialog`.
- Pixel normalization MUST be identical in training and inference: `value = (255 - gray) / 255` (ink ≈ 1.0, paper ≈ 0.0), 28×28 grayscale. Any change must be made in BOTH `tools/train-digits/train.py` and `src/scan/classify.ts` `prepareDigit`.
- Grid constants: warped grid is 450×450 (`GRID_SIZE`), cells 50×50 (`CELL_SIZE`), model input 28×28 (`DIGIT_SIZE`). All defined once in `src/scan/classify.ts`.
- Review threshold: a cell needs review when `confidence < 0.9` or it is in `getConflictingCells(board)`.
- Digit classes: model outputs 9 softmax classes, index `d` = digit `d + 1`. Empty cells never reach the model (ink-density gate).
- Match existing style: arrow-function components, `sx` styling, existing media-query strings verbatim (see CLAUDE.md), colors from theme (`secondary.main` cyan, `warning.main` amber for review highlights).
- Board type is `Array<number | null>` length 81 from `src/sudoku/logic.ts`. Never invent another board representation.
- Commit after every task. Test command: `npx vitest run` (also `npm test` after Task 1).
- End every commit message with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: Vitest setup + `setBoard` hook API

**Files:**
- Modify: `package.json` (deps + `test` script)
- Create: `vitest.config.ts`
- Create: `tests/useSudokuBoard.test.ts`
- Modify: `src/hooks/useSudokuBoard.ts:109-119` (return object)

**Interfaces:**
- Produces: `useSudokuBoard()` return gains `setBoard: (board: Board) => void` — replaces the whole board, pushes previous board to undo history, clears redo. Task 9 wires it to `ScanDialog`'s `onAccept`.

- [ ] **Step 1: Install dev dependencies and add test script**

```bash
npm install -D vitest jsdom @testing-library/react
```

In `package.json` add to `"scripts"`:

```json
"test": "vitest run"
```

- [ ] **Step 2: Create vitest config**

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
  },
});
```

Default environment is node (fast, right for the pure pipeline tests). The hook test opts into jsdom per-file.

- [ ] **Step 3: Write the failing test**

`tests/useSudokuBoard.test.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run tests/useSudokuBoard.test.ts`
Expected: FAIL — `result.current.setBoard is not a function`

- [ ] **Step 5: Expose `applyBoard` as `setBoard`**

In `src/hooks/useSudokuBoard.ts`, the internal `useState` setter is already named `setBoard`, so expose `applyBoard` under the public name via an explicit key (no rename needed). `applyBoard` already does exactly what the spec requires (push history, clear future, set board). Change the return object:

```ts
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
  };
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run tests/useSudokuBoard.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 7: Lint and commit**

```bash
npm run lint
git add package.json package-lock.json vitest.config.ts tests/useSudokuBoard.test.ts src/hooks/useSudokuBoard.ts
git commit -m "feat: add setBoard to useSudokuBoard and vitest setup

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Pure cell pipeline — `sliceCells`, `isEmptyCell`, `prepareDigit`

**Files:**
- Create: `src/scan/classify.ts`
- Create: `tests/helpers/image.ts`
- Create: `tests/classify.test.ts`

**Interfaces:**
- Produces (all from `src/scan/classify.ts`):
  - `interface RawImage { data: Uint8ClampedArray; width: number; height: number }` — structural subset of DOM `ImageData`, so canvas `getImageData()` results pass directly. Used by every later pipeline function; keeps Node tests free of DOM types.
  - `const GRID_SIZE = 450`, `const CELL_SIZE = 50`, `const DIGIT_SIZE = 28`
  - `sliceCells(grid: RawImage): RawImage[]` — 81 cells, row-major, each 50×50.
  - `isEmptyCell(cell: RawImage): boolean` — ink-density gate.
  - `prepareDigit(cell: RawImage): Float32Array` — length 784 (28×28), normalized `(255 - gray) / 255`.
  - `grayAt(img: RawImage, x: number, y: number): number` — exported for tests.

- [ ] **Step 1: Write test helpers**

`tests/helpers/image.ts`:

```ts
import fs from 'node:fs';
import { PNG } from 'pngjs';
import type { RawImage } from '../../src/scan/classify';

export const makeImage = (width: number, height: number, gray = 255): RawImage => {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = gray;
    data[i * 4 + 1] = gray;
    data[i * 4 + 2] = gray;
    data[i * 4 + 3] = 255;
  }
  return { data, width, height };
};

export const fillRect = (
  img: RawImage,
  x0: number,
  y0: number,
  w: number,
  h: number,
  gray: number,
): void => {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      const i = (y * img.width + x) * 4;
      img.data[i] = gray;
      img.data[i + 1] = gray;
      img.data[i + 2] = gray;
    }
  }
};

// Hollow rectangle outline of given line thickness
export const strokeRect = (
  img: RawImage,
  x0: number,
  y0: number,
  w: number,
  h: number,
  thickness: number,
  gray: number,
): void => {
  fillRect(img, x0, y0, w, thickness, gray);
  fillRect(img, x0, y0 + h - thickness, w, thickness, gray);
  fillRect(img, x0, y0, thickness, h, gray);
  fillRect(img, x0 + w - thickness, y0, thickness, h, gray);
};

export const loadPng = (path: string): RawImage => {
  const png = PNG.sync.read(fs.readFileSync(path));
  return { data: new Uint8ClampedArray(png.data), width: png.width, height: png.height };
};
```

Install the PNG decoder:

```bash
npm install -D pngjs @types/pngjs
```

- [ ] **Step 2: Write the failing tests**

`tests/classify.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  CELL_SIZE,
  DIGIT_SIZE,
  GRID_SIZE,
  isEmptyCell,
  prepareDigit,
  sliceCells,
} from '../src/scan/classify';
import { fillRect, makeImage } from './helpers/image';

describe('sliceCells', () => {
  it('returns 81 cells of CELL_SIZE, row-major', () => {
    const grid = makeImage(GRID_SIZE, GRID_SIZE);
    // Mark top-left pixel of cell (row 2, col 5) — flat index 23
    fillRect(grid, 5 * CELL_SIZE, 2 * CELL_SIZE, 1, 1, 0);
    const cells = sliceCells(grid);
    expect(cells).toHaveLength(81);
    expect(cells[0].width).toBe(CELL_SIZE);
    expect(cells[0].height).toBe(CELL_SIZE);
    expect(cells[23].data[0]).toBe(0); // marked pixel landed in cell 23
    expect(cells[22].data[0]).toBe(255);
  });
});

describe('isEmptyCell', () => {
  it('treats a blank cell as empty', () => {
    expect(isEmptyCell(makeImage(CELL_SIZE, CELL_SIZE))).toBe(true);
  });

  it('treats a cell with a central ink blob as non-empty', () => {
    const cell = makeImage(CELL_SIZE, CELL_SIZE);
    fillRect(cell, 18, 14, 14, 22, 20); // digit-sized dark blob
    expect(isEmptyCell(cell)).toBe(false);
  });

  it('ignores grid lines at the cell borders', () => {
    const cell = makeImage(CELL_SIZE, CELL_SIZE);
    fillRect(cell, 0, 0, CELL_SIZE, 3, 20); // top grid line
    fillRect(cell, 0, 0, 3, CELL_SIZE, 20); // left grid line
    expect(isEmptyCell(cell)).toBe(true);
  });
});

describe('prepareDigit', () => {
  it('returns 784 values, ~0 for blank cells', () => {
    const out = prepareDigit(makeImage(CELL_SIZE, CELL_SIZE));
    expect(out).toHaveLength(DIGIT_SIZE * DIGIT_SIZE);
    expect(Math.max(...out)).toBeLessThan(0.05);
  });

  it('maps ink to values near 1', () => {
    const cell = makeImage(CELL_SIZE, CELL_SIZE);
    fillRect(cell, 15, 12, 20, 26, 0); // solid black blob
    const out = prepareDigit(cell);
    expect(Math.max(...out)).toBeGreaterThan(0.9);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tests/classify.test.ts`
Expected: FAIL — cannot resolve `../src/scan/classify`

- [ ] **Step 4: Implement `src/scan/classify.ts`**

```ts
// Pure pixel pipeline over RawImage — no DOM, no OpenCV, testable in Node.
// RawImage is a structural subset of ImageData so canvas results pass directly.
export interface RawImage {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export const GRID_SIZE = 450;
export const CELL_SIZE = 50; // GRID_SIZE / 9
export const DIGIT_SIZE = 28; // CNN input size

const EMPTY_CELL_MARGIN = 10; // px skipped on each side — grid lines live here
const EMPTY_INK_THRESHOLD_OFFSET = 60; // ink = darker than cell mean by this much
const EMPTY_MAX_INK_FRACTION = 0.02;
const DIGIT_CROP_MARGIN = 6; // px trimmed before downsampling to 28x28

export const grayAt = (img: RawImage, x: number, y: number): number => {
  const i = (y * img.width + x) * 4;
  return 0.299 * img.data[i] + 0.587 * img.data[i + 1] + 0.114 * img.data[i + 2];
};

// Split the warped 450x450 grid into 81 row-major 50x50 cells
export const sliceCells = (grid: RawImage): RawImage[] => {
  const cells: RawImage[] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const data = new Uint8ClampedArray(CELL_SIZE * CELL_SIZE * 4);
      for (let y = 0; y < CELL_SIZE; y++) {
        const srcStart = ((r * CELL_SIZE + y) * grid.width + c * CELL_SIZE) * 4;
        data.set(grid.data.subarray(srcStart, srcStart + CELL_SIZE * 4), y * CELL_SIZE * 4);
      }
      cells.push({ data, width: CELL_SIZE, height: CELL_SIZE });
    }
  }
  return cells;
};

// A cell is empty when its central region has almost no pixels darker than the cell mean
export const isEmptyCell = (cell: RawImage): boolean => {
  let sum = 0;
  for (let y = 0; y < cell.height; y++) {
    for (let x = 0; x < cell.width; x++) sum += grayAt(cell, x, y);
  }
  const mean = sum / (cell.width * cell.height);
  const threshold = mean - EMPTY_INK_THRESHOLD_OFFSET;

  let dark = 0;
  const side = CELL_SIZE - 2 * EMPTY_CELL_MARGIN;
  for (let y = EMPTY_CELL_MARGIN; y < cell.height - EMPTY_CELL_MARGIN; y++) {
    for (let x = EMPTY_CELL_MARGIN; x < cell.width - EMPTY_CELL_MARGIN; x++) {
      if (grayAt(cell, x, y) < threshold) dark++;
    }
  }
  return dark / (side * side) < EMPTY_MAX_INK_FRACTION;
};

// Crop borders, box-downsample to 28x28, normalize (255 - gray) / 255.
// MUST match the normalization in tools/train-digits/train.py.
export const prepareDigit = (cell: RawImage): Float32Array => {
  const cropSize = CELL_SIZE - 2 * DIGIT_CROP_MARGIN;
  const out = new Float32Array(DIGIT_SIZE * DIGIT_SIZE);
  for (let oy = 0; oy < DIGIT_SIZE; oy++) {
    const sy0 = DIGIT_CROP_MARGIN + Math.floor((oy * cropSize) / DIGIT_SIZE);
    const sy1 = DIGIT_CROP_MARGIN + Math.max(sy0 - DIGIT_CROP_MARGIN + 1, Math.floor(((oy + 1) * cropSize) / DIGIT_SIZE));
    for (let ox = 0; ox < DIGIT_SIZE; ox++) {
      const sx0 = DIGIT_CROP_MARGIN + Math.floor((ox * cropSize) / DIGIT_SIZE);
      const sx1 = DIGIT_CROP_MARGIN + Math.max(sx0 - DIGIT_CROP_MARGIN + 1, Math.floor(((ox + 1) * cropSize) / DIGIT_SIZE));
      let sum = 0;
      let count = 0;
      for (let sy = sy0; sy < sy1; sy++) {
        for (let sx = sx0; sx < sx1; sx++) {
          sum += grayAt(cell, sx, sy);
          count++;
        }
      }
      out[oy * DIGIT_SIZE + ox] = (255 - sum / count) / 255;
    }
  }
  return out;
};
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/classify.test.ts`
Expected: PASS (6 tests). If `isEmptyCell` thresholds misbehave, tune `EMPTY_INK_THRESHOLD_OFFSET` / `EMPTY_MAX_INK_FRACTION` — the tests encode the required behavior.

- [ ] **Step 6: Lint and commit**

```bash
npm run lint && npm test
git add src/scan/classify.ts tests/classify.test.ts tests/helpers/image.ts package.json package-lock.json
git commit -m "feat: pure cell pipeline (slice, empty gate, digit prep)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Trimmed OpenCV.js build + loaders

**Files:**
- Create: `tools/opencv-build/whitelist.py`
- Create: `tools/opencv-build/build.sh`
- Create: `public/opencv/opencv.js` (build artifact, committed)
- Create: `src/scan/opencv.ts` (browser loader)
- Create: `tests/helpers/opencvNode.ts` (Node loader for tests)
- Create: `tests/opencv.test.ts`
- Modify: `.gitignore` (ignore intermediate build output)

**Interfaces:**
- Produces:
  - `type CV = any` and `loadOpenCV(): Promise<CV>` from `src/scan/opencv.ts` — idempotent script-tag loader for the browser. Resolves once wasm runtime is initialized.
  - `loadOpenCVNode(): Promise<CV>` from `tests/helpers/opencvNode.ts` — same module loaded via `require` for vitest.

**Prerequisite:** Docker running (`docker info` succeeds). This is a one-off build; the artifact is committed so no one else needs Docker.

- [ ] **Step 1: Write the whitelist config**

`tools/opencv-build/whitelist.py` (format required by opencv's `platforms/js/build_js.py --config`):

```python
# Trimmed OpenCV.js whitelist for Sufusku: only what grid detection needs.
def makeWhiteList(module_list):
    wl = {}
    for m in module_list:
        for k in m.keys():
            if k in wl:
                wl[k] += m[k]
            else:
                wl[k] = m[k]
    return wl

core = {'': ['minMaxLoc']}

imgproc = {'': [
    'adaptiveThreshold',
    'approxPolyDP',
    'arcLength',
    'boundingRect',
    'contourArea',
    'cvtColor',
    'findContours',
    'GaussianBlur',
    'getPerspectiveTransform',
    'isContourConvex',
    'resize',
    'threshold',
    'warpPerspective',
]}

white_list = makeWhiteList([core, imgproc])
```

- [ ] **Step 2: Write the build script**

`tools/opencv-build/build.sh`:

```bash
#!/usr/bin/env bash
# One-off Docker build of a trimmed opencv.js. Artifact is committed to
# public/opencv/ — rerun only to upgrade OpenCV or change the whitelist.
set -euo pipefail
cd "$(dirname "$0")"

OPENCV_VERSION=4.10.0
EMSDK_IMAGE=emscripten/emsdk:3.1.64

docker run --rm -v "$PWD":/work "$EMSDK_IMAGE" bash -c "
  set -e
  git clone --depth 1 --branch $OPENCV_VERSION https://github.com/opencv/opencv.git /opencv
  cd /opencv
  python3 ./platforms/js/build_js.py build_wasm --build_wasm --config /work/whitelist.py
  cp build_wasm/bin/opencv.js /work/opencv.js
  cp build_wasm/bin/*.wasm /work/ 2>/dev/null || true
"

mkdir -p ../../public/opencv
cp opencv.js ../../public/opencv/opencv.js
if ls ./*.wasm >/dev/null 2>&1; then cp ./*.wasm ../../public/opencv/; fi
echo "Done: $(du -h ../../public/opencv/opencv.js | cut -f1)"
```

```bash
chmod +x tools/opencv-build/build.sh
```

Add to `.gitignore` (intermediate copies in the tool dir; the `public/opencv/` artifact IS committed):

```
tools/opencv-build/opencv.js
tools/opencv-build/*.wasm
```

- [ ] **Step 3: Run the build**

Run: `docker info >/dev/null && ./tools/opencv-build/build.sh`
Expected: `Done: ~2-4M`. First run downloads the emsdk image and compiles for 10-30 min.
If the compile fails with emscripten errors, retry with `EMSDK_IMAGE=emscripten/emsdk:3.1.61` (the version OpenCV 4.10 CI used).

- [ ] **Step 4: Write the Node loader and failing smoke test**

`tests/helpers/opencvNode.ts`:

```ts
import { createRequire } from 'node:module';

let cvPromise: Promise<any> | null = null;

// opencv.js is a UMD build; in Node it exports the emscripten Module.
export const loadOpenCVNode = (): Promise<any> => {
  cvPromise ??= (async () => {
    const require = createRequire(import.meta.url);
    const cv = require('../../public/opencv/opencv.js');
    if (typeof cv.then === 'function') return await cv; // 4.x: module is a thenable
    if (cv.Mat) return cv;
    return new Promise((resolve) => {
      cv.onRuntimeInitialized = () => resolve(cv);
    });
  })();
  return cvPromise;
};
```

`tests/opencv.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { loadOpenCVNode } from './helpers/opencvNode';

describe('trimmed opencv.js', () => {
  it('loads and exposes the whitelisted imgproc ops', async () => {
    const cv = await loadOpenCVNode();
    for (const fn of [
      'adaptiveThreshold',
      'approxPolyDP',
      'arcLength',
      'contourArea',
      'cvtColor',
      'findContours',
      'GaussianBlur',
      'getPerspectiveTransform',
      'isContourConvex',
      'warpPerspective',
    ]) {
      expect(typeof cv[fn], fn).toBe('function');
    }
  }, 60000);

  it('runs cvtColor on a Mat', async () => {
    const cv = await loadOpenCVNode();
    const mat = new cv.Mat(10, 10, cv.CV_8UC4, new cv.Scalar(255, 255, 255, 255));
    const gray = new cv.Mat();
    cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY);
    expect(gray.rows).toBe(10);
    expect(gray.cols).toBe(10);
    mat.delete();
    gray.delete();
  }, 60000);
});
```

- [ ] **Step 5: Run smoke test**

Run: `npx vitest run tests/opencv.test.ts`
Expected: PASS. If a whitelisted function is missing, fix `whitelist.py` and rebuild (Step 3).

- [ ] **Step 6: Write the browser loader**

`src/scan/opencv.ts`:

```ts
// OpenCV.js is deliberately NOT bundled: it is a ~2 MB wasm artifact served
// from public/opencv/ and loaded via script tag on first scan.
export type CV = any;

let cvPromise: Promise<CV> | null = null;

export const loadOpenCV = (): Promise<CV> => {
  cvPromise ??= new Promise<CV>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/opencv/opencv.js';
    script.async = true;
    script.onload = () => {
      const cv = (window as unknown as { cv: CV }).cv;
      if (cv && typeof cv.then === 'function') cv.then(resolve, reject);
      else if (cv && cv.Mat) resolve(cv);
      else cv.onRuntimeInitialized = () => resolve(cv);
    };
    script.onerror = () => reject(new Error('Failed to load OpenCV'));
    document.head.appendChild(script);
  });
  return cvPromise;
};
```

- [ ] **Step 7: Lint and commit**

```bash
npm run lint && npm test
git add tools/opencv-build public/opencv src/scan/opencv.ts tests/helpers/opencvNode.ts tests/opencv.test.ts .gitignore
git commit -m "build: trimmed opencv.js wasm + loaders

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Grid detection — `findGridQuad`, `warpGrid`

**Files:**
- Create: `src/scan/detect.ts`
- Create: `tests/detect.test.ts`

**Interfaces:**
- Consumes: `CV` from `src/scan/opencv.ts`; `RawImage`, `GRID_SIZE` from `src/scan/classify.ts`; `loadOpenCVNode` from `tests/helpers/opencvNode.ts`.
- Produces (from `src/scan/detect.ts`):
  - `type Point = { x: number; y: number }`
  - `type Quad = [Point, Point, Point, Point]` — ordered top-left, top-right, bottom-right, bottom-left.
  - `findGridQuad(cv: CV, image: RawImage): Quad | null` — largest convex 4-corner contour covering >30% of the frame, or null.
  - `warpGrid(cv: CV, image: RawImage, quad: Quad, size?: number): RawImage` — perspective-corrected `size`×`size` (default `GRID_SIZE`) RGBA image.

- [ ] **Step 1: Write the failing tests**

`tests/detect.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { findGridQuad, warpGrid } from '../src/scan/detect';
import { grayAt } from '../src/scan/classify';
import { makeImage, strokeRect } from './helpers/image';
import { loadOpenCVNode } from './helpers/opencvNode';

describe('findGridQuad', () => {
  it('finds a large square outline', async () => {
    const cv = await loadOpenCVNode();
    const image = makeImage(320, 240);
    strokeRect(image, 40, 20, 240, 200, 6, 20); // covers 62% of frame
    const quad = findGridQuad(cv, image);
    expect(quad).not.toBeNull();
    const [tl, tr, br, bl] = quad!;
    expect(Math.abs(tl.x - 40)).toBeLessThanOrEqual(8);
    expect(Math.abs(tl.y - 20)).toBeLessThanOrEqual(8);
    expect(Math.abs(tr.x - 280)).toBeLessThanOrEqual(8);
    expect(Math.abs(br.y - 220)).toBeLessThanOrEqual(8);
    expect(Math.abs(bl.x - 40)).toBeLessThanOrEqual(8);
  }, 60000);

  it('returns null when nothing big enough exists', async () => {
    const cv = await loadOpenCVNode();
    const image = makeImage(320, 240);
    strokeRect(image, 100, 100, 60, 60, 4, 20); // only ~5% of frame
    expect(findGridQuad(cv, image)).toBeNull();
  }, 60000);
});

describe('warpGrid', () => {
  it('maps the quad to a 450x450 image', async () => {
    const cv = await loadOpenCVNode();
    const image = makeImage(320, 240);
    strokeRect(image, 40, 20, 240, 200, 6, 20);
    const quad = findGridQuad(cv, image)!;
    const grid = warpGrid(cv, image, quad);
    expect(grid.width).toBe(450);
    expect(grid.height).toBe(450);
    expect(grayAt(grid, 225, 225)).toBeGreaterThan(200); // white interior
    expect(grayAt(grid, 225, 4)).toBeLessThan(120); // border ink at top edge
  }, 60000);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/detect.test.ts`
Expected: FAIL — cannot resolve `../src/scan/detect`

- [ ] **Step 3: Implement `src/scan/detect.ts`**

```ts
import type { CV } from './opencv';
import { GRID_SIZE, type RawImage } from './classify';

export type Point = { x: number; y: number };
// Ordered: top-left, top-right, bottom-right, bottom-left
export type Quad = [Point, Point, Point, Point];

const MIN_GRID_AREA_FRACTION = 0.3;

const orderCorners = (pts: Point[]): Quad => {
  const bySum = [...pts].sort((a, b) => a.x + a.y - (b.x + b.y));
  const byDiff = [...pts].sort((a, b) => a.y - a.x - (b.y - b.x));
  return [bySum[0], byDiff[0], bySum[3], byDiff[3]];
};

// Largest convex quadrilateral contour covering >30% of the frame
export const findGridQuad = (cv: CV, image: RawImage): Quad | null => {
  const src = cv.matFromImageData(image);
  const gray = new cv.Mat();
  const bin = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0);
    cv.adaptiveThreshold(gray, bin, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 11, 2);
    cv.findContours(bin, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let best: Quad | null = null;
    let bestArea = image.width * image.height * MIN_GRID_AREA_FRACTION;
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      if (area > bestArea) {
        const approx = new cv.Mat();
        cv.approxPolyDP(contour, approx, 0.02 * cv.arcLength(contour, true), true);
        if (approx.rows === 4 && cv.isContourConvex(approx)) {
          const pts: Point[] = [];
          for (let p = 0; p < 4; p++) {
            pts.push({ x: approx.data32S[p * 2], y: approx.data32S[p * 2 + 1] });
          }
          best = orderCorners(pts);
          bestArea = area;
        }
        approx.delete();
      }
      contour.delete();
    }
    return best;
  } finally {
    src.delete();
    gray.delete();
    bin.delete();
    contours.delete();
    hierarchy.delete();
  }
};

// Perspective-correct the quad into a square RGBA image
export const warpGrid = (cv: CV, image: RawImage, quad: Quad, size = GRID_SIZE): RawImage => {
  const src = cv.matFromImageData(image);
  const dst = new cv.Mat();
  const srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, quad.flatMap((p) => [p.x, p.y]));
  const dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, size, 0, size, size, 0, size]);
  const transform = cv.getPerspectiveTransform(srcPts, dstPts);
  try {
    cv.warpPerspective(src, dst, transform, new cv.Size(size, size));
    return { data: new Uint8ClampedArray(dst.data), width: size, height: size };
  } finally {
    src.delete();
    dst.delete();
    srcPts.delete();
    dstPts.delete();
    transform.delete();
  }
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/detect.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Lint and commit**

```bash
npm run lint && npm test
git add src/scan/detect.ts tests/detect.test.ts
git commit -m "feat: opencv grid detection and perspective warp

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Digit model training pipeline + synthetic fixture

**Files:**
- Create: `tools/train-digits/requirements.txt`
- Create: `tools/train-digits/train.py`
- Create: `tools/train-digits/make_fixture.py`
- Create: `public/models/digits/` (exported model, committed)
- Create: `tests/fixtures/synthetic-1.png`, `tests/fixtures/synthetic-1.txt` (committed)
- Modify: `.gitignore`

**Interfaces:**
- Produces: TF.js **Layers** model at `public/models/digits/model.json` (+ weight shards). Input `[batch, 28, 28, 1]` float32 normalized `(255 - gray) / 255`; output `[batch, 9]` softmax, class `d` = digit `d + 1`. Fixture pair: PNG photo-like puzzle image + 81-char expected string (`0` = empty, row-major).

- [ ] **Step 1: Set up the Python environment**

`tools/train-digits/requirements.txt`:

```
tensorflow==2.15.0
tensorflowjs==4.17.0
pillow==10.3.0
numpy==1.26.4
```

```bash
cd tools/train-digits
python3.11 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

Add to `.gitignore`:

```
tools/train-digits/.venv
```

If `python3.11` is missing, any 3.10-3.11 works; `tensorflowjs==4.17.0` requires TF 2.15, keep the pins.

- [ ] **Step 2: Write the training script**

`tools/train-digits/train.py`:

```python
"""Train a tiny printed-digit CNN on synthetic font renders; export to TF.js.

Normalization contract (must match src/scan/classify.ts prepareDigit):
input = (255 - gray) / 255, 28x28, ink ~1.0, paper ~0.0.
"""
import glob
import random
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

DIGIT_SIZE = 28
RENDER_SIZE = 64
SAMPLES_PER_FONT_PER_DIGIT = 40
MAX_FONTS = 60
VAL_ACCURACY_GATE = 0.99

FONT_DIRS = [
    "/System/Library/Fonts/**/*.ttf",
    "/System/Library/Fonts/**/*.ttc",
    "/System/Library/Fonts/**/*.otf",
    "/Library/Fonts/**/*.ttf",
    "/Library/Fonts/**/*.otf",
]


def usable_fonts():
    paths = sorted({p for pattern in FONT_DIRS for p in glob.glob(pattern, recursive=True)})
    fonts = []
    for path in paths:
        try:
            font = ImageFont.truetype(path, 44)
            img = Image.new("L", (RENDER_SIZE, RENDER_SIZE), 255)
            ImageDraw.Draw(img).text((10, 5), "5", font=font, fill=0)
            arr = np.array(img)
            ink = (arr < 128).sum()
            if 40 < ink < 1200:  # skip symbol/blank fonts
                fonts.append(path)
        except OSError:
            continue
        if len(fonts) >= MAX_FONTS:
            break
    return fonts


def render_sample(font_path, digit, rng):
    font = ImageFont.truetype(font_path, rng.randint(36, 52))
    img = Image.new("L", (RENDER_SIZE, RENDER_SIZE), 255)
    draw = ImageDraw.Draw(img)
    bbox = draw.textbbox((0, 0), str(digit), font=font)
    x = (RENDER_SIZE - (bbox[2] - bbox[0])) // 2 - bbox[0] + rng.randint(-3, 3)
    y = (RENDER_SIZE - (bbox[3] - bbox[1])) // 2 - bbox[1] + rng.randint(-3, 3)
    draw.text((x, y), str(digit), font=font, fill=rng.randint(0, 60))
    img = img.rotate(rng.uniform(-8, 8), fillcolor=255, resample=Image.BILINEAR)
    if rng.random() < 0.5:
        img = img.filter(ImageFilter.GaussianBlur(rng.uniform(0.3, 1.0)))
    img = img.resize((DIGIT_SIZE, DIGIT_SIZE), Image.BILINEAR)
    arr = np.array(img, dtype=np.float32)
    arr += rng.uniform(-15, 25)  # brightness jitter
    arr += np.random.normal(0, rng.uniform(2, 8), arr.shape)  # sensor noise
    arr = np.clip(arr, 0, 255)
    return (255.0 - arr) / 255.0


def build_dataset(fonts):
    rng = random.Random(42)
    np.random.seed(42)
    xs, ys = [], []
    for font_path in fonts:
        for digit in range(1, 10):
            for _ in range(SAMPLES_PER_FONT_PER_DIGIT):
                xs.append(render_sample(font_path, digit, rng))
                ys.append(digit - 1)
    x = np.stack(xs)[..., np.newaxis]
    y = np.array(ys)
    idx = np.random.permutation(len(x))
    return x[idx], y[idx]


def main():
    import tensorflow as tf
    import tensorflowjs as tfjs

    fonts = usable_fonts()
    print(f"Using {len(fonts)} fonts")
    if len(fonts) < 20:
        sys.exit("Too few usable fonts found — pass more font dirs")

    x, y = build_dataset(fonts)
    split = int(len(x) * 0.9)
    x_train, y_train, x_val, y_val = x[:split], y[:split], x[split:], y[split:]
    print(f"Train {len(x_train)}, val {len(x_val)}")

    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(DIGIT_SIZE, DIGIT_SIZE, 1)),
        tf.keras.layers.Conv2D(16, 3, activation="relu"),
        tf.keras.layers.MaxPooling2D(),
        tf.keras.layers.Conv2D(32, 3, activation="relu"),
        tf.keras.layers.MaxPooling2D(),
        tf.keras.layers.Flatten(),
        tf.keras.layers.Dense(64, activation="relu"),
        tf.keras.layers.Dropout(0.25),
        tf.keras.layers.Dense(9, activation="softmax"),
    ])
    model.compile(optimizer="adam", loss="sparse_categorical_crossentropy", metrics=["accuracy"])
    model.fit(x_train, y_train, validation_data=(x_val, y_val), epochs=10, batch_size=128)

    _, val_acc = model.evaluate(x_val, y_val, verbose=0)
    print(f"Validation accuracy: {val_acc:.4f}")
    if val_acc < VAL_ACCURACY_GATE:
        sys.exit(f"Accuracy gate failed: {val_acc:.4f} < {VAL_ACCURACY_GATE}")

    tfjs.converters.save_keras_model(model, "../../public/models/digits")
    print("Exported to public/models/digits/")


if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Train and export**

Run: `cd tools/train-digits && .venv/bin/python train.py`
Expected: `Validation accuracy: 0.99xx`, then `Exported to public/models/digits/`. Takes a few minutes on CPU. If the gate fails, bump `SAMPLES_PER_FONT_PER_DIGIT` to 60 and rerun.

Verify: `ls public/models/digits/` shows `model.json` and `group1-shard*.bin`, total ≈100-300 KB.

- [ ] **Step 4: Write the fixture generator**

`tools/train-digits/make_fixture.py`:

```python
"""Render a photo-like synthetic sudoku for the golden pipeline test."""
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# A valid puzzle, 0 = empty, row-major
PUZZLE = (
    "530070000"
    "600195000"
    "098000060"
    "800060003"
    "400803001"
    "700020006"
    "060000280"
    "000419005"
    "000080079"
)

CANVAS = 900
MARGIN = 90
GRID = CANVAS - 2 * MARGIN
CELL = GRID // 9
FONT_PATH = "/System/Library/Fonts/Helvetica.ttc"


def main():
    img = Image.new("L", (CANVAS, CANVAS), 250)
    draw = ImageDraw.Draw(img)
    for i in range(10):
        w = 5 if i % 3 == 0 else 2
        pos = MARGIN + i * CELL
        draw.line([(MARGIN, pos), (MARGIN + GRID, pos)], fill=20, width=w)
        draw.line([(pos, MARGIN), (pos, MARGIN + GRID)], fill=20, width=w)
    font = ImageFont.truetype(FONT_PATH, int(CELL * 0.6))
    for i, ch in enumerate(PUZZLE):
        if ch == "0":
            continue
        r, c = divmod(i, 9)
        cx = MARGIN + c * CELL + CELL // 2
        cy = MARGIN + r * CELL + CELL // 2
        bbox = draw.textbbox((0, 0), ch, font=font)
        draw.text(
            (cx - (bbox[2] - bbox[0]) / 2 - bbox[0], cy - (bbox[3] - bbox[1]) / 2 - bbox[1]),
            ch, font=font, fill=15,
        )
    img = img.rotate(2.0, fillcolor=250, resample=Image.BILINEAR)  # slight camera tilt
    arr = np.array(img, dtype=np.float32)
    arr += np.random.default_rng(7).normal(0, 4, arr.shape)  # sensor noise
    img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).convert("RGBA")
    img = img.resize((640, 640), Image.BILINEAR)
    img.save("../../tests/fixtures/synthetic-1.png")
    with open("../../tests/fixtures/synthetic-1.txt", "w") as f:
        f.write(PUZZLE + "\n")
    print("Wrote tests/fixtures/synthetic-1.png + .txt")


if __name__ == "__main__":
    main()
```

- [ ] **Step 5: Generate the fixture**

```bash
mkdir -p tests/fixtures
cd tools/train-digits && .venv/bin/python make_fixture.py
```

Expected: `Wrote tests/fixtures/synthetic-1.png + .txt`. Open the PNG and eyeball it: slightly tilted grid, digits legible.

- [ ] **Step 6: Commit**

```bash
git add tools/train-digits public/models/digits tests/fixtures .gitignore
git commit -m "feat: digit CNN training pipeline, exported model, synthetic fixture

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Model wrapper + `classifyGrid` + golden end-to-end test

**Files:**
- Create: `src/scan/model.ts`
- Modify: `src/scan/classify.ts` (append `ScanResult`, `classifyGrid`)
- Create: `tests/helpers/modelNode.ts`
- Create: `tests/goldenScan.test.ts`

**Interfaces:**
- Consumes: model artifact from Task 5; `findGridQuad`/`warpGrid` from Task 4; helpers from Tasks 2-3.
- Produces:
  - From `src/scan/model.ts`: `interface DigitPrediction { digit: number; confidence: number }`, `interface DigitModel { predict(batch: Float32Array, count: number): Promise<DigitPrediction[]> }`, `wrapModel(model: tf.LayersModel): DigitModel`, `loadDigitModel(): Promise<DigitModel>` (browser, fetches `/models/digits/model.json`, cached).
  - From `src/scan/classify.ts`: `interface ScanResult { board: Board; confidence: number[] }` (confidence per cell, `1` for empty cells), `classifyGrid(model: DigitModel, grid: RawImage): Promise<ScanResult>`.

- [ ] **Step 1: Install TF.js**

```bash
npm install @tensorflow/tfjs
```

Runtime dependency, but only imported from `src/scan/model.ts`, which is reachable only via the lazy `ScanDialog` chunk — main bundle unaffected (verified in Task 9).

- [ ] **Step 2: Write the failing golden test**

`tests/helpers/modelNode.ts` (filesystem loader — `tf.loadLayersModel(url)` needs HTTP, tests read from disk):

```ts
import fs from 'node:fs';
import path from 'node:path';
import * as tf from '@tensorflow/tfjs';

interface WeightsGroup {
  paths: string[];
  weights: tf.io.WeightsManifestEntry[];
}

export const loadModelFromDisk = async (dir: string): Promise<tf.LayersModel> => {
  const modelJSON = JSON.parse(fs.readFileSync(path.join(dir, 'model.json'), 'utf8'));
  const manifest = modelJSON.weightsManifest as WeightsGroup[];
  const weightSpecs = manifest.flatMap((g) => g.weights);
  const buffers = manifest.flatMap((g) => g.paths.map((p) => fs.readFileSync(path.join(dir, p))));
  const concatenated = Buffer.concat(buffers);
  const weightData = concatenated.buffer.slice(
    concatenated.byteOffset,
    concatenated.byteOffset + concatenated.byteLength,
  );
  return tf.loadLayersModel(
    tf.io.fromMemory({ modelTopology: modelJSON.modelTopology, weightSpecs, weightData }),
  );
};
```

`tests/goldenScan.test.ts`:

```ts
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { classifyGrid } from '../src/scan/classify';
import { findGridQuad, warpGrid } from '../src/scan/detect';
import { wrapModel } from '../src/scan/model';
import { loadPng } from './helpers/image';
import { loadModelFromDisk } from './helpers/modelNode';
import { loadOpenCVNode } from './helpers/opencvNode';

describe('golden scan pipeline', () => {
  it('reads the synthetic fixture puzzle end to end', async () => {
    const cv = await loadOpenCVNode();
    const model = wrapModel(await loadModelFromDisk('public/models/digits'));
    const image = loadPng('tests/fixtures/synthetic-1.png');
    const expected = fs.readFileSync('tests/fixtures/synthetic-1.txt', 'utf8').trim();

    const quad = findGridQuad(cv, image);
    expect(quad).not.toBeNull();
    const grid = warpGrid(cv, image, quad!);
    const { board, confidence } = await classifyGrid(model, grid);

    expect(board.map((v) => v ?? 0).join('')).toBe(expected);
    for (let i = 0; i < 81; i++) {
      if (board[i] !== null) expect(confidence[i]).toBeGreaterThan(0.5);
    }
  }, 120000);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/goldenScan.test.ts`
Expected: FAIL — `wrapModel`/`classifyGrid` not defined

- [ ] **Step 4: Implement `src/scan/model.ts`**

```ts
import * as tf from '@tensorflow/tfjs';
import { DIGIT_SIZE } from './classify';

export interface DigitPrediction {
  digit: number; // 1-9
  confidence: number; // softmax probability of the chosen digit
}

export interface DigitModel {
  predict(batch: Float32Array, count: number): Promise<DigitPrediction[]>;
}

// Wrap a layers model behind a plain-array interface so callers and tests
// never touch tensors directly
export const wrapModel = (model: tf.LayersModel): DigitModel => ({
  async predict(batch, count) {
    if (count === 0) return [];
    const input = tf.tensor4d(batch, [count, DIGIT_SIZE, DIGIT_SIZE, 1]);
    const output = model.predict(input) as tf.Tensor;
    const probs = await output.data();
    input.dispose();
    output.dispose();
    const predictions: DigitPrediction[] = [];
    for (let i = 0; i < count; i++) {
      let digit = 1;
      let confidence = 0;
      for (let d = 0; d < 9; d++) {
        const p = probs[i * 9 + d];
        if (p > confidence) {
          confidence = p;
          digit = d + 1;
        }
      }
      predictions.push({ digit, confidence });
    }
    return predictions;
  },
});

let modelPromise: Promise<DigitModel> | null = null;

export const loadDigitModel = (): Promise<DigitModel> => {
  modelPromise ??= tf.loadLayersModel('/models/digits/model.json').then(wrapModel);
  return modelPromise;
};
```

- [ ] **Step 5: Append `classifyGrid` to `src/scan/classify.ts`**

Add the import at the top and the block at the bottom:

```ts
import type { Board } from '../sudoku/logic';
import type { DigitModel } from './model';
```

```ts
export interface ScanResult {
  board: Board;
  confidence: number[]; // per cell; 1 for empty cells
}

// Slice the warped grid, gate empties, batch-classify the rest
export const classifyGrid = async (model: DigitModel, grid: RawImage): Promise<ScanResult> => {
  const cells = sliceCells(grid);
  const board: Board = Array(81).fill(null);
  const confidence: number[] = Array(81).fill(1);
  const digitIndices: number[] = [];
  for (let i = 0; i < 81; i++) {
    if (!isEmptyCell(cells[i])) digitIndices.push(i);
  }
  const batch = new Float32Array(digitIndices.length * DIGIT_SIZE * DIGIT_SIZE);
  digitIndices.forEach((cellIndex, n) => {
    batch.set(prepareDigit(cells[cellIndex]), n * DIGIT_SIZE * DIGIT_SIZE);
  });
  const predictions = await model.predict(batch, digitIndices.length);
  digitIndices.forEach((cellIndex, n) => {
    board[cellIndex] = predictions[n].digit;
    confidence[cellIndex] = predictions[n].confidence;
  });
  return { board, confidence };
};
```

- [ ] **Step 6: Run the golden test**

Run: `npx vitest run tests/goldenScan.test.ts`
Expected: PASS. Debug order if it fails: (1) quad null → fixture border too thin, regenerate; (2) wrong empties → dump `isEmptyCell` results per cell, tune constants in Task 2 (its unit tests must stay green); (3) wrong digits → normalization mismatch between `prepareDigit` and `train.py` — verify both compute `(255 - gray) / 255`.

- [ ] **Step 7: Full suite, lint, commit**

```bash
npm test && npm run lint
git add src/scan/model.ts src/scan/classify.ts tests/helpers/modelNode.ts tests/goldenScan.test.ts package.json package-lock.json
git commit -m "feat: digit model wrapper, classifyGrid, golden e2e test

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: ScanDialog — viewfinder, auto-capture, file fallback

**Files:**
- Create: `src/components/ScanDialog.tsx`

**Interfaces:**
- Consumes: everything from Tasks 3-6; `ScanReview` from Task 8 (stub it this task, replace next task).
- Produces: `ScanDialog` default export with props `{ open: boolean; onClose: () => void; onAccept: (board: Board) => void }`. Task 9 mounts it lazily from `HeaderMenu`.

UI states are verified manually (spec) — no unit tests for this component.

- [ ] **Step 1: Create a temporary `ScanReview` stub**

At the bottom of the new `src/components/ScanDialog.tsx` file scope for now (Task 8 extracts the real component into its own file):

The stub used inside this task:

```tsx
// TEMPORARY until Task 8: minimal review placeholder
const ScanReview = ({ result, onRetake, onAccept }: {
  result: ScanResult;
  onRetake: () => void;
  onAccept: (board: Board) => void;
}) => (
  <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
    <Typography>Scanned {result.board.filter((v) => v !== null).length} digits</Typography>
    <Button onClick={() => onAccept(result.board)}>Accept</Button>
    <Button onClick={onRetake}>Retake</Button>
  </Box>
);
```

- [ ] **Step 2: Implement `src/components/ScanDialog.tsx`**

```tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Dialog, IconButton, Snackbar, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { Board } from '../sudoku/logic';
import { classifyGrid, GRID_SIZE, type RawImage, type ScanResult } from '../scan/classify';
import { findGridQuad, warpGrid, type Quad } from '../scan/detect';
import { loadDigitModel } from '../scan/model';
import { loadOpenCV, type CV } from '../scan/opencv';

interface ScanDialogProps {
  open: boolean;
  onClose: () => void;
  onAccept: (board: Board) => void;
}

const DETECT_WIDTH = 320; // frames are downscaled to this width for detection
const DETECT_INTERVAL_MS = 100; // ~10 fps
const STABLE_FRAMES = 5;
const STABLE_TOLERANCE_PX = 10; // max corner drift between frames, at detection scale
const HINT_DELAY_MS = 5000;
const FALLBACK_MAX_WIDTH = 800; // still photos downscaled before detection

type Phase = 'viewfinder' | 'processing' | 'review';

const quadIsStable = (a: Quad, b: Quad): boolean =>
  a.every((p, i) => Math.hypot(p.x - b[i].x, p.y - b[i].y) < STABLE_TOLERANCE_PX);

const imageDataFrom = (source: CanvasImageSource, width: number, height: number): RawImage => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(source, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
};

const ScanDialog = ({ open, onClose, onAccept }: ScanDialogProps) => {
  const [phase, setPhase] = useState<Phase>('viewfinder');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [cameraFailed, setCameraFailed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stableQuadRef = useRef<{ quad: Quad; count: number } | null>(null);

  const runPipeline = useCallback(
    async (cv: CV, image: RawImage, quad: Quad) => {
      setPhase('processing');
      try {
        const grid = warpGrid(cv, image, quad, GRID_SIZE);
        const model = await loadDigitModel();
        setResult(await classifyGrid(model, grid));
        setPhase('review');
      } catch {
        setMessage('Could not read the puzzle — try again.');
        setPhase('viewfinder');
      }
    },
    [],
  );

  // Camera + detection loop, active only while the viewfinder shows
  useEffect(() => {
    if (!open || phase !== 'viewfinder' || cameraFailed) return;

    let cancelled = false;
    let rafId = 0;
    let lastTick = 0;
    let stream: MediaStream | null = null;
    stableQuadRef.current = null;
    const hintTimer = window.setTimeout(() => setShowHint(true), HINT_DELAY_MS);

    const start = async () => {
      let cv: CV;
      try {
        [cv, stream] = await Promise.all([
          loadOpenCV(),
          navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }),
        ]);
      } catch {
        if (!cancelled) setCameraFailed(true);
        return;
      }
      void loadDigitModel(); // warm up in parallel; errors surface in runPipeline
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();

      const tick = (now: number) => {
        if (cancelled) return;
        rafId = requestAnimationFrame(tick);
        if (now - lastTick < DETECT_INTERVAL_MS || video.readyState < 2) return;
        lastTick = now;

        const scale = DETECT_WIDTH / video.videoWidth;
        const detectHeight = Math.round(video.videoHeight * scale);
        const frame = imageDataFrom(video, DETECT_WIDTH, detectHeight);
        const quad = findGridQuad(cv, frame);

        const overlay = overlayRef.current;
        if (overlay) {
          overlay.width = video.videoWidth;
          overlay.height = video.videoHeight;
          const ctx = overlay.getContext('2d')!;
          ctx.clearRect(0, 0, overlay.width, overlay.height);
          if (quad) {
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 4;
            ctx.beginPath();
            quad.forEach((p, i) => {
              const x = p.x / scale;
              const y = p.y / scale;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            });
            ctx.closePath();
            ctx.stroke();
          }
        }

        if (!quad) {
          stableQuadRef.current = null;
          return;
        }
        const stable = stableQuadRef.current;
        if (stable && quadIsStable(stable.quad, quad)) {
          stable.count++;
          stable.quad = quad;
          if (stable.count >= STABLE_FRAMES) {
            cancelAnimationFrame(rafId);
            cancelled = true;
            const fullFrame = imageDataFrom(video, video.videoWidth, video.videoHeight);
            const fullQuad = quad.map((p) => ({ x: p.x / scale, y: p.y / scale })) as Quad;
            void runPipeline(cv, fullFrame, fullQuad);
          }
        } else {
          stableQuadRef.current = { quad, count: 1 };
        }
      };
      rafId = requestAnimationFrame(tick);
    };
    void start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      window.clearTimeout(hintTimer);
      setShowHint(false);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [open, phase, cameraFailed, runPipeline]);

  // Reset when reopened
  useEffect(() => {
    if (open) {
      setPhase('viewfinder');
      setResult(null);
      setCameraFailed(false);
    }
  }, [open]);

  const handleFile = async (file: File) => {
    try {
      const cv = await loadOpenCV();
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, FALLBACK_MAX_WIDTH / bitmap.width);
      const image = imageDataFrom(
        bitmap,
        Math.round(bitmap.width * scale),
        Math.round(bitmap.height * scale),
      );
      const quad = findGridQuad(cv, image);
      if (!quad) {
        setMessage('No grid found in that photo — try another one.');
        return;
      }
      await runPipeline(cv, image, quad);
    } catch {
      setMessage('Could not read that photo — try another one.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullScreen>
      <Box sx={{ position: 'relative', height: '100%', bgcolor: 'background.default' }}>
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2, color: 'secondary.main' }}
        >
          <CloseIcon />
        </IconButton>

        {phase === 'review' && result ? (
          <ScanReview result={result} onRetake={() => setPhase('viewfinder')} onAccept={onAccept} />
        ) : cameraFailed ? (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              p: 3,
            }}
          >
            <Typography align="center">
              Camera unavailable. Pick a photo of the puzzle instead.
            </Typography>
            <Button variant="contained" onClick={() => fileInputRef.current?.click()}>
              Choose photo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
                e.target.value = '';
              }}
            />
          </Box>
        ) : (
          <Box sx={{ position: 'relative', height: '100%' }}>
            <video
              ref={videoRef}
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <canvas
              ref={overlayRef}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            {(showHint || phase === 'processing') && (
              <Typography
                sx={{
                  position: 'absolute',
                  bottom: 24,
                  left: 0,
                  right: 0,
                  textAlign: 'center',
                  color: 'secondary.main',
                  textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                }}
              >
                {phase === 'processing'
                  ? 'Reading puzzle…'
                  : 'Fill the frame with the puzzle. Avoid glare.'}
              </Typography>
            )}
          </Box>
        )}
      </Box>

      <Snackbar
        open={message !== null}
        autoHideDuration={4000}
        onClose={() => setMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setMessage(null)} severity="info" variant="filled">
          {message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default ScanDialog;
```

Include the `ScanReview` stub from Step 1 above the `ScanDialog` component in the same file for now.

Note the overlay canvas: its internal size is set to the video's native resolution and CSS stretches both identically with `objectFit: cover`, so quad lines align with the video.

- [ ] **Step 3: Type-check and lint**

Run: `npm run lint && npx tsc -b`
Expected: clean. (No `npm run build` yet — the component isn't reachable until Task 9, and `tsc -b` covers type errors.)

- [ ] **Step 4: Manual smoke test**

Temporarily render `<ScanDialog open onClose={() => {}} onAccept={console.log} />` inside `App.tsx`, run `npm run dev`, open in a browser with a webcam:
- Camera prompt appears; viewfinder shows.
- Hold a printed sudoku (or one displayed on a phone) in front of the camera: cyan quad outline appears, and after ~0.5 s of holding steady it switches to "Reading puzzle…" then the stub review ("Scanned N digits").
- Deny camera permission (reload, block): fallback "Choose photo" appears; picking a puzzle photo reaches the stub review.
- Remove the temporary render from `App.tsx` before committing.

- [ ] **Step 5: Commit**

```bash
git add src/components/ScanDialog.tsx
git commit -m "feat: scan dialog with live viewfinder, auto-capture, file fallback

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: Review screen

**Files:**
- Create: `src/components/ScanReview.tsx`
- Modify: `src/components/ScanDialog.tsx` (delete the stub, import the real component)

**Interfaces:**
- Consumes: `ScanResult` from `src/scan/classify.ts`, `getConflictingCells` from `src/sudoku/logic.ts`.
- Produces: `ScanReview` default export with props `{ result: ScanResult; onRetake: () => void; onAccept: (board: Board) => void }`.

- [ ] **Step 1: Implement `src/components/ScanReview.tsx`**

```tsx
import { useMemo, useState } from 'react';
import { Box, Button, Dialog, Typography } from '@mui/material';
import { getConflictingCells, type Board } from '../sudoku/logic';
import type { ScanResult } from '../scan/classify';

interface ScanReviewProps {
  result: ScanResult;
  onRetake: () => void;
  onAccept: (board: Board) => void;
}

const CONFIDENCE_THRESHOLD = 0.9;

const ScanReview = ({ result, onRetake, onAccept }: ScanReviewProps) => {
  const [board, setBoard] = useState<Board>([...result.board]);
  const [edited, setEdited] = useState<Set<number>>(new Set());
  const [pickerCell, setPickerCell] = useState<number | null>(null);

  const conflicts = useMemo(() => getConflictingCells(board), [board]);

  const needsReview = (i: number): boolean =>
    conflicts.has(i) || (!edited.has(i) && result.confidence[i] < CONFIDENCE_THRESHOLD);

  const setCell = (index: number, value: number | null) => {
    const next = [...board];
    next[index] = value;
    setBoard(next);
    setEdited(new Set(edited).add(index));
    setPickerCell(null);
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 2,
      }}
    >
      <Typography color="text.secondary">
        Check the scan — tap a highlighted cell to fix it.
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(9, 1fr)',
          width: 'min(90vw, 60vh, 450px)',
          aspectRatio: '1',
          border: 2,
          borderColor: 'divider',
        }}
      >
        {board.map((value, i) => {
          const row = Math.floor(i / 9);
          const col = i % 9;
          return (
            <Box
              key={i}
              onClick={() => setPickerCell(i)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                cursor: 'pointer',
                borderRight: col === 8 ? 0 : col % 3 === 2 ? 2 : 1,
                borderBottom: row === 8 ? 0 : row % 3 === 2 ? 2 : 1,
                borderColor: 'divider',
                bgcolor: needsReview(i) ? 'warning.main' : 'transparent',
                color: needsReview(i) ? 'warning.contrastText' : 'text.primary',
              }}
            >
              {value ?? ''}
            </Box>
          );
        })}
      </Box>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="outlined" onClick={onRetake}>
          Retake
        </Button>
        <Button variant="contained" onClick={() => onAccept(board)}>
          Accept
        </Button>
      </Box>

      <Dialog open={pickerCell !== null} onClose={() => setPickerCell(null)}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, p: 2 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <Button key={n} variant="outlined" onClick={() => setCell(pickerCell!, n)}>
              {n}
            </Button>
          ))}
          <Button
            variant="outlined"
            onClick={() => setCell(pickerCell!, null)}
            sx={{ gridColumn: 'span 3' }}
          >
            Clear
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
};

export default ScanReview;
```

- [ ] **Step 2: Swap the stub out of `ScanDialog.tsx`**

Delete the temporary `ScanReview` stub from `src/components/ScanDialog.tsx` and add:

```tsx
import ScanReview from './ScanReview';
```

Also remove the now-unused `Button` import from `ScanDialog.tsx` if nothing else uses it.

- [ ] **Step 3: Type-check, lint**

Run: `npm run lint && npx tsc -b`
Expected: clean.

- [ ] **Step 4: Manual check**

Repeat the temporary-render trick from Task 7 Step 4. Verify:
- Review grid shows scanned digits; low-confidence or conflicting cells are amber.
- Tapping a cell opens the 1-9 + Clear picker; fixing a cell removes its amber (unless still conflicting).
- Fixing one of two conflicting duplicates clears amber from both.
- Retake returns to the live viewfinder; Accept fires `onAccept` with the edited board (check console).
- Remove the temporary render before committing.

- [ ] **Step 5: Commit**

```bash
git add src/components/ScanReview.tsx src/components/ScanDialog.tsx
git commit -m "feat: scan review screen with uncertainty highlights and cell fixes

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: Integration — menu item, lazy loading, verification

**Files:**
- Modify: `src/components/HeaderMenu.tsx`
- Modify: `src/components/Header.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `setBoard` from `useSudokuBoard` (Task 1), `ScanDialog` (Tasks 7-8).
- Produces: `HeaderMenuProps` and `HeaderProps` each gain `onScanAccept: (board: Board) => void`.

- [ ] **Step 1: Add the menu item + lazy dialog to `HeaderMenu.tsx`**

Add imports:

```tsx
import { lazy, Suspense, useState } from 'react';
```

(replacing the existing `import { useState } from 'react';`)

```tsx
const ScanDialog = lazy(() => import('./ScanDialog'));
```

Extend the props interface:

```tsx
interface HeaderMenuProps {
  board: BoardState;
  selectedCell: number | null;
  onClearAll: () => void;
  onSolveCell: (value: number) => void;
  onScanAccept: (board: BoardState) => void;
}
```

Inside the component add state and handlers:

```tsx
  const [scanOpen, setScanOpen] = useState(false);

  const handleScan = () => {
    handleClose();
    setScanOpen(true);
  };
```

Add the menu item above "Clear all":

```tsx
        <MenuItem onClick={handleScan}>Scan puzzle</MenuItem>
```

And render the dialog after the `<Portal>` block (lazy chunk loads only once opened):

```tsx
      {scanOpen && (
        <Suspense fallback={null}>
          <ScanDialog
            open={scanOpen}
            onClose={() => setScanOpen(false)}
            onAccept={(scanned) => {
              onScanAccept(scanned);
              setScanOpen(false);
            }}
          />
        </Suspense>
      )}
```

Update the component signature to destructure `onScanAccept`.

- [ ] **Step 2: Thread the prop through `Header.tsx`**

Add `onScanAccept: (board: BoardState) => void;` to `HeaderProps`, destructure it, and pass it to `<HeaderMenu ... onScanAccept={onScanAccept} />`.

- [ ] **Step 3: Wire `App.tsx`**

Destructure `setBoard` from the hook and pass it down:

```tsx
  const { board, selectedCell, setSelectedCell, setCellValue, setBoard, clearBoard, undo, redo, canUndo, canRedo } =
    useSudokuBoard();
```

```tsx
      <Header
        board={board}
        selectedCell={selectedCell}
        onClearAll={clearBoard}
        onSolveCell={setCellValue}
        onScanAccept={setBoard}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
```

- [ ] **Step 4: Verify lazy-chunk isolation**

Run: `npm run build`
Expected: build succeeds; output lists a separate chunk for `ScanDialog` containing TF.js (large, hundreds of KB) while the main `index-*.js` stays roughly its current size (~400 KB). If TF.js landed in the main chunk, something outside the scan path imports `src/scan/model.ts` — fix the import graph.

- [ ] **Step 5: Full test suite + lint**

Run: `npm test && npm run lint`
Expected: all green.

- [ ] **Step 6: Manual end-to-end verification**

`npm run dev`, then:
- Menu → "Scan puzzle" → network tab shows the scan chunk + `/opencv/opencv.js` + `/models/digits/*` loading only now.
- Scan a printed puzzle → review → Accept → board fills; conflict highlighting works on the real board.
- Undo restores the pre-scan board; redo re-applies the scan.
- Portrait phone viewport (DevTools) and landscape-mobile viewport: dialog is fullscreen and usable in both.
- Deny camera permission → photo fallback works end to end.

- [ ] **Step 7: Commit**

```bash
git add src/components/HeaderMenu.tsx src/components/Header.tsx src/App.tsx
git commit -m "feat: wire puzzle scanner into header menu with lazy loading

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```
