# Dark/Light Theme Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dark/light theme toggle button to the header; first visit follows the OS color scheme, the toggle overrides it, and the choice persists.

**Architecture:** MUI 9 `colorSchemes` API with CSS variables. A custom `palette.board` token slot (defined per scheme) replaces every hardcoded color in Board/Cell/NumberPad, so switching modes is pure CSS. `useColorScheme()` drives a sun/moon `IconButton` in the header; MUI handles persistence (localStorage key `mui-mode`) and system-follow (`defaultMode="system"`).

**Tech Stack:** React 19, TypeScript, MUI 9.2 (`createTheme` colorSchemes, `useColorScheme`, `theme.applyStyles`), Vite 8, Vitest.

**Spec:** `docs/superpowers/specs/2026-07-13-theme-toggle-design.md`

## Global Constraints

- Dark mode must look identical to today's app (spec success criterion 5).
- Existing 20 Vitest tests must stay green; no sudoku/scan logic changes.
- Layout media queries stay verbatim (see CLAUDE.md "Layout breakpoints") — this feature must not touch them except adding `order` entries in the header's landscape query.
- `ScanDialog` viewfinder cyan `#06b6d4` stays hardcoded (draws on live video, theme-independent).
- Do NOT push to origin — main auto-deploys to Firebase Hosting.
- Commit messages end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: Theme with colorSchemes + board tokens

**Files:**
- Modify: `src/theme.ts` (full rewrite below)
- Modify: `src/main.tsx:11` (add `defaultMode="system"`)
- Modify: `src/index.css` (delete the scrollbar rules — they move into the theme)

**Interfaces:**
- Produces: `BoardPalette` type exported from `src/theme.ts`; `theme.vars.palette.board.*` CSS-variable tokens (`--mui-palette-board-*`); theme default export unchanged in shape.
- Consumed by Tasks 2 and 3.

- [ ] **Step 1: Rewrite `src/theme.ts`**

Replace the entire file with:

```ts
import { createTheme, responsiveFontSizes } from '@mui/material/styles';

// Board-specific color tokens, defined once per color scheme. Components read
// them through theme.vars (CSS variables), so switching modes is pure CSS.
export interface BoardPalette {
  line: string; // 3x3 box separator
  subline: string; // plain cell separator
  frame: string; // outer board border + scrollbar thumb
  shadow: string; // board drop shadow
  hoverBg: string; // cell hover tint
  conflictBg: string;
  conflictSelectedBg: string;
  conflictBorder: string;
  conflictText: string;
  singleBg: string; // single-remaining-candidate green
  selectionBg: string;
  relatedTint: string; // same row/col/box as selection
  shareTint: string; // shares value with selection
  padBorder: string; // NumberPad button border
}

declare module '@mui/material/styles' {
  interface Palette {
    board: BoardPalette;
  }
  interface PaletteOptions {
    board?: BoardPalette;
  }
}

const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'class' },
  colorSchemes: {
    dark: {
      palette: {
        primary: {
          main: '#6366f1', // Indigo 500
          light: '#818cf8',
          dark: '#4f46e5',
          contrastText: '#ffffff',
        },
        secondary: {
          main: '#06b6d4', // Cyan 500
          light: '#22d3ee',
          dark: '#0891b2',
          contrastText: '#0f172a',
        },
        background: {
          default: '#0b0f19', // Premium deep space background
          paper: '#111827', // Gray 900
        },
        text: {
          primary: '#f3f4f6', // Gray 100
          secondary: '#9ca3af', // Gray 400
        },
        divider: 'rgba(255, 255, 255, 0.08)',
        board: {
          line: '#4b5563',
          subline: 'rgba(255, 255, 255, 0.05)',
          frame: '#1f2937',
          shadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          hoverBg: 'rgba(255, 255, 255, 0.03)',
          conflictBg: 'rgba(239, 68, 68, 0.2)',
          conflictSelectedBg: 'rgba(239, 68, 68, 0.25)',
          conflictBorder: 'rgba(239, 68, 68, 0.4)',
          conflictText: '#f87171',
          singleBg: 'rgba(34, 197, 94, 0.2)',
          selectionBg: 'rgba(99, 102, 241, 0.15)',
          relatedTint: 'rgba(99, 102, 241, 0.05)',
          shareTint: 'rgba(6, 182, 212, 0.2)',
          padBorder: 'rgba(255, 255, 255, 0.08)',
        },
      },
    },
    light: {
      palette: {
        primary: {
          main: '#6366f1',
          light: '#818cf8',
          dark: '#4f46e5',
          contrastText: '#ffffff',
        },
        secondary: {
          main: '#06b6d4',
          light: '#22d3ee',
          dark: '#0891b2',
          contrastText: '#0f172a',
        },
        background: {
          default: '#f8fafc', // Slate 50
          paper: '#ffffff',
        },
        text: {
          primary: '#0f172a', // Slate 900
          secondary: '#64748b', // Slate 500
        },
        divider: 'rgba(0, 0, 0, 0.08)',
        board: {
          line: '#94a3b8',
          subline: 'rgba(0, 0, 0, 0.08)',
          frame: '#cbd5e1',
          shadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          hoverBg: 'rgba(0, 0, 0, 0.03)',
          conflictBg: 'rgba(239, 68, 68, 0.15)',
          conflictSelectedBg: 'rgba(239, 68, 68, 0.2)',
          conflictBorder: 'rgba(239, 68, 68, 0.5)',
          conflictText: '#dc2626',
          singleBg: 'rgba(34, 197, 94, 0.25)',
          selectionBg: 'rgba(99, 102, 241, 0.15)',
          relatedTint: 'rgba(99, 102, 241, 0.07)',
          shareTint: 'rgba(6, 182, 212, 0.2)',
          padBorder: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontWeight: 700,
      letterSpacing: '-0.015em',
    },
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 500,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      // Scrollbar styling moved here from index.css so it follows the theme.
      // Var names are deterministic: --mui-palette-<path with dots as dashes>.
      styleOverrides: {
        '::-webkit-scrollbar': { width: '8px', height: '8px' },
        '::-webkit-scrollbar-track': {
          background: 'var(--mui-palette-background-default)',
        },
        '::-webkit-scrollbar-thumb': {
          background: 'var(--mui-palette-board-frame)',
          borderRadius: '4px',
        },
        '::-webkit-scrollbar-thumb:hover': {
          background: 'var(--mui-palette-board-line)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          fontWeight: 600,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
          },
        },
      },
      variants: [
        {
          props: { variant: 'contained', color: 'secondary' },
          style: {
            '&:hover': {
              boxShadow: '0 4px 12px rgba(6, 182, 212, 0.25)',
            },
          },
        },
      ],
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundImage: 'none',
          backgroundColor: 'var(--mui-palette-background-paper)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.3)',
          transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out, border-color 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 24px 0 rgba(0, 0, 0, 0.4)',
            borderColor: 'rgba(99, 102, 241, 0.3)',
          },
          ...theme.applyStyles('light', {
            border: '1px solid rgba(0, 0, 0, 0.05)',
            boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.08)',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 12px 24px 0 rgba(0, 0, 0, 0.12)',
              borderColor: 'rgba(99, 102, 241, 0.3)',
            },
          }),
        }),
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: 'rgba(11, 15, 25, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          backgroundImage: 'none',
          ...theme.applyStyles('light', {
            backgroundColor: 'rgba(248, 250, 252, 0.8)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
            color: '#0f172a',
          }),
        }),
      },
    },
  },
});

export default responsiveFontSizes(theme);
```

Notes for the implementer:
- `colorSchemes.dark.palette` is byte-for-byte today's palette — do not "improve" values.
- The old scrollbar-thumb hover was `#374151`; it is deliberately unified onto the `board.line` token (`#4b5563` dark) — visually near-identical, one token fewer.
- `theme.applyStyles('light', …)` emits styles scoped to the light color-scheme class; the unscoped base styles are the dark look.

- [ ] **Step 2: Update `src/main.tsx`**

Change the ThemeProvider line to:

```tsx
    <ThemeProvider theme={theme} defaultMode="system">
```

Rest of the file unchanged.

- [ ] **Step 3: Trim `src/index.css`**

Delete everything from `/* Custom modern scrollbar */` to the end of the file (the four `::-webkit-scrollbar*` blocks). Keep the `html, body, #root` block untouched.

- [ ] **Step 4: Verify**

Run: `npx tsc -b && npm run lint && npm test`
Expected: tsc clean; lint shows only the pre-existing `useSudokuBoard.ts` exhaustive-deps warning; 20/20 tests pass.

Run the app (`npm run dev`, do NOT pipe the output — a closed pipe SIGPIPE-kills vite) and load it in a browser with dark OS preference (or `emulate` dark color scheme via devtools): the app must look exactly like before. Old hardcoded component colors are still in place — this task only makes the theme dual-scheme.

Also verify in the browser console: `document.documentElement.className` contains `dark` (scheme class applied), and toggling `localStorage.setItem('mui-mode', 'light')` + reload switches MUI surfaces (AppBar/paper) to light while the board still looks dark-ish — expected until Task 2 migrates it.

- [ ] **Step 5: Commit**

```bash
git add src/theme.ts src/main.tsx src/index.css
git commit -m "feat: dual color schemes with board palette tokens

MUI colorSchemes (CSS variables, class selector) with the existing dark
palette unchanged and a new light palette. Custom palette.board token
slot holds every board-specific color per scheme; scrollbar styling
moves from index.css into MuiCssBaseline so it follows the theme.
defaultMode=system follows the OS until the user overrides.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Migrate Board, Cell, NumberPad to board tokens

**Files:**
- Modify: `src/components/Board.tsx`
- Modify: `src/components/Cell.tsx`
- Modify: `src/components/NumberPad.tsx`

**Interfaces:**
- Consumes: `BoardPalette` type from `src/theme.ts`; `useTheme()` from `@mui/material/styles`; token access pattern `(theme.vars ?? theme).palette.board` (returns `var(--mui-palette-board-*)` strings when CSS variables are on).
- Produces: no API changes — component props unchanged except where shown.

- [ ] **Step 1: Migrate `src/components/Board.tsx`**

Add imports and thread the tokens through `getCellStyling`:

```tsx
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { BoardPalette } from '../theme';
```

Change `getCellStyling` — new parameter `b: BoardPalette` (the vars-resolved tokens), literals replaced:

```tsx
const getCellStyling = (
  board: BoardState,
  selectedCell: number | null,
  conflictingCells: Set<number>,
  index: number,
  candidates: Set<number>,
  b: BoardPalette,
) => {
  const isSelected = selectedCell === index;
  const isConflicting = conflictingCells.has(index);
  const isSingleCandidate = board[index] === null && candidates.size === 1;

  let bgcolor = 'background.paper';
  let borderColor = b.padBorder;

  if (isConflicting) {
    bgcolor = b.conflictBg;
    borderColor = b.conflictBorder;
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
      } else {
        borderColor = '#06b6d4';
        if (!isSingleCandidate) bgcolor = b.selectionBg;
      }
    } else if (!isConflicting && !isSingleCandidate) {
      if (sharesValue) bgcolor = b.shareTint;
      else if (isRelated) bgcolor = b.relatedTint;
    }
  }

  return { bgcolor, borderColor, isConflicting };
};
```

(`#ef4444` and `#06b6d4` are deliberately identical in both schemes — they stay literal.)

In the `Board` component body, resolve the tokens once and pass them in; also replace the frame border/shadow literals:

```tsx
const Board = ({ board, selectedCell, onSelectCell }: BoardProps) => {
  const conflictingCells = getConflictingCells(board);
  const theme = useTheme();
  const b = (theme.vars ?? theme).palette.board;
```

In the outer `Box` sx, change:

```tsx
        boxShadow: b.shadow,
        border: `3px solid ${b.frame}`,
```

(replacing `boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'` and `border: '3px solid #1f2937'`), and in the map:

```tsx
        const { bgcolor, borderColor, isConflicting } = getCellStyling(board, selectedCell, conflictingCells, idx, candidates, b);
```

- [ ] **Step 2: Migrate `src/components/Cell.tsx`**

Add:

```tsx
import { useTheme } from '@mui/material/styles';
```

Inside the component, before the border computations:

```tsx
  const theme = useTheme();
  const b = (theme.vars ?? theme).palette.board;
```

Replace the four hardcoded border colors and the hover/conflict colors:

```tsx
  const borderTopColor = row % 3 === 0 ? b.line : b.subline;
  const borderLeftColor = col % 3 === 0 ? b.line : b.subline;
```

```tsx
        borderBottom: row === 8 ? 'none' : `0.5px solid ${b.subline}`,
        borderRight: col === 8 ? 'none' : `0.5px solid ${b.subline}`,
```

```tsx
        '&:hover': {
          bgcolor: b.hoverBg,
        },
```

```tsx
            color: isConflicting ? b.conflictText : 'secondary.main',
```

- [ ] **Step 3: Migrate `src/components/NumberPad.tsx`**

Replace the hardcoded border (sx resolves `borderColor` palette paths, including custom slots):

```tsx
            border: '1px solid',
            borderColor: 'board.padBorder',
```

(replacing `border: '1px solid rgba(255, 255, 255, 0.08)'`).

- [ ] **Step 4: Verify**

Run: `npx tsc -b && npm run lint && npm test`
Expected: clean (same pre-existing warning), 20/20 pass.

Visual check with the dev server, browser in **dark** mode: board must look pixel-identical to before (all dark token values equal the old literals). Then set light (`localStorage.setItem('mui-mode', 'light')` + reload or use the devtools rendering emulation): the whole app — board grid lines, cell tints, number pad — must be legible on light background. Exercise: select a cell, enter a duplicate to force a red conflict, empty cell with single candidate showing green, number pad on a 375×667 viewport.

- [ ] **Step 5: Commit**

```bash
git add src/components/Board.tsx src/components/Cell.tsx src/components/NumberPad.tsx
git commit -m "refactor: board colors read from palette.board tokens

Replaces hardcoded white-alpha/hex colors in Board, Cell, and NumberPad
with the per-scheme board palette CSS variables, making the grid legible
in both color schemes. Dark values are unchanged.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Theme toggle button in header

**Files:**
- Modify: `src/components/Header.tsx`

**Interfaces:**
- Consumes: `useColorScheme()` from `@mui/material/styles` → `{ mode, systemMode, setMode }`. `mode` is `'light' | 'dark' | 'system' | undefined`; when `'system'`, `systemMode` holds the resolved value.
- Produces: no prop changes; Header gains a self-contained toggle.

- [ ] **Step 1: Add the toggle**

New imports in `src/components/Header.tsx`:

```tsx
import { useColorScheme } from '@mui/material/styles';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
```

Add a small component above `Header` (same file — it is header-only):

```tsx
const ThemeToggle = () => {
  const { mode, systemMode, setMode } = useColorScheme();
  const resolved = (mode === 'system' ? systemMode : mode) ?? 'dark';
  return (
    <IconButton
      onClick={() => setMode(resolved === 'dark' ? 'light' : 'dark')}
      sx={{ color: 'secondary.main', [landscapeQuery]: { order: 2 } }}
      aria-label={resolved === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {resolved === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
    </IconButton>
  );
};
```

`Header` is currently an expression-bodied arrow component — it stays that way; `ThemeToggle` owns the hook.

Place `<ThemeToggle />` as the first child of the icon-group `Box` (before the undo `IconButton`), and renumber the landscape `order` overrides so the top-to-bottom landscape order is menu, toggle, undo, redo:

- undo `IconButton`: `[landscapeQuery]: { order: 3 }`
- redo `IconButton`: `[landscapeQuery]: { order: 4 }`
- menu wrapper `Box`: `[landscapeQuery]: { order: 1 }` (unchanged)
- toggle: `order: 2` (in the snippet above)

Portrait/desktop DOM order becomes: toggle, undo, redo, menu.

- [ ] **Step 2: Verify**

Run: `npx tsc -b && npm run lint && npm test`
Expected: clean, 20/20.

In the browser (dev server):
1. Fresh state (`localStorage.removeItem('mui-mode')`, reload): theme matches OS/emulated preference; icon shows the *other* mode (sun in dark, moon in light).
2. Click toggle: instant switch, no reload; `localStorage.getItem('mui-mode')` now `'light'` (or `'dark'`).
3. Reload: choice sticks.
4. Landscape viewport (e.g. 700×380): header strip shows menu, toggle, undo, redo top-to-bottom.

- [ ] **Step 3: Commit**

```bash
git add src/components/Header.tsx
git commit -m "feat: dark/light theme toggle in header

Sun/moon icon button next to undo/redo via useColorScheme. Follows the
OS scheme until first use; the override persists in localStorage.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Full visual pass + docs

**Files:**
- Modify: `README.md` (features list)
- Modify: `CLAUDE.md` (Architecture: theme.ts and Header.tsx bullets)
- Possibly tweak: light-scheme values in `src/theme.ts` if the visual pass finds contrast problems (spec: light values are starting points)

**Interfaces:**
- Consumes: everything from Tasks 1-3.

- [ ] **Step 1: Visual pass, both modes**

Dev server + browser. For each of dark and light, check at desktop (1280×800), portrait phone (375×667), landscape phone (700×380):

- board with values, conflicts (red), single-candidate (green), selection + related/shared tints
- number pad (phone viewports)
- header, kebab menu, help dialog, snackbar (trigger "Solve cell" on a non-empty selection-adjacent case or "Clear all")
- scan review screen if reachable without camera (skip live camera — user QA covers it)

Fix any illegible light-mode value directly in `src/theme.ts` light `board` tokens. Dark values must not change.

- [ ] **Step 2: Update docs**

`README.md` — add to the features list (after the "How to use" bullet):

```markdown
- Dark/light theme toggle — follows your system preference until you override it
```

`CLAUDE.md` — update two Architecture bullets:

- `src/theme.ts` bullet: rewrite to describe dual `colorSchemes` (dark palette unchanged, light slate-based), CSS variables with class selector, the custom `palette.board` token slot (components must use these tokens — never hardcode board colors), scrollbar styles living in `MuiCssBaseline`, and `defaultMode="system"` set in `main.tsx`.
- `src/components/Header.tsx` bullet: mention the `ThemeToggle` (useColorScheme sun/moon button) and the updated landscape order: menu, toggle, undo, redo.

- [ ] **Step 3: Verify**

Run: `npm run build && npm test`
Expected: build succeeds, 20/20 tests.

- [ ] **Step 4: Commit**

```bash
git add README.md CLAUDE.md src/theme.ts
git commit -m "docs: document theme toggle; polish light palette

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

(Drop `src/theme.ts` from the add list if the visual pass changed nothing.)
