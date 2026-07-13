# Dark/Light Theme Toggle — Design

**Date:** 2026-07-13
**Status:** Approved

## Goal

Add a dark/light theme toggle to Sufusku. First-time visitors follow the OS
`prefers-color-scheme`; tapping the toggle overrides it, and the override
persists across reloads. The toggle is a sun/moon icon button in the header
next to undo/redo.

## Approach

MUI 9 `colorSchemes` API (chosen over manual two-theme state management):
built-in system-follow, automatic localStorage persistence, and CSS-variable
theming so mode switches are pure CSS.

## Design

### 1. Theme structure (`src/theme.ts`)

Single theme via:

```ts
createTheme({
  cssVariables: { colorSchemeSelector: 'class' },
  colorSchemes: { dark: { palette: … }, light: { palette: … } },
  // shared typography / shape / component overrides
})
```

- **dark** keeps the exact current palette (indigo `#6366f1` primary, cyan
  `#06b6d4` secondary, `#0b0f19`/`#111827` backgrounds, gray text, white-alpha
  divider).
- **light** keeps the indigo/cyan brand. Background default `#f8fafc`
  (slate-50), paper `#ffffff`, text slate-900 primary / slate-500 secondary,
  divider `rgba(0, 0, 0, 0.08)`.
- Typography, shape, and shared button behavior stay as one shared config.
- Mode-specific component overrides (MuiAppBar's translucent navy background,
  MuiCard background/border) switch via `theme.applyStyles('light', …)` /
  `theme.applyStyles('dark', …)` inside the style overrides.

### 2. Board color tokens (`palette.board`)

The migration pain is ~23 raw color strings scattered across `Board.tsx`
(`getCellStyling`), `Cell.tsx`, and `NumberPad.tsx` — mostly white-alpha
values that only work on dark backgrounds.

Fix: a custom palette slot `palette.board`, defined per colorScheme, e.g.:

| Token | Dark (current value) | Light |
|---|---|---|
| `line` (3x3 box border) | `#4b5563` | `#94a3b8` |
| `subline` (cell border) | `rgba(255,255,255,0.05)` | `rgba(0,0,0,0.08)` |
| `candidateBg` | `rgba(255,255,255,0.03)` | `rgba(0,0,0,0.03)` |
| `conflictBg` / `conflictBorder` / `conflictText` | red-alpha / `#ef4444` / `#f87171` | `rgba(239,68,68,0.15)` / `rgba(239,68,68,0.5)` / `#dc2626` |
| `singleBg` (green) | `rgba(34,197,94,0.2)` | `rgba(34,197,94,0.25)` |
| `selectionBg` / `relatedTint` (indigo) | `rgba(99,102,241,0.15)` / `rgba(99,102,241,0.05)` | `rgba(99,102,241,0.15)` / `rgba(99,102,241,0.07)` |
| `shareTint` (cyan) | `rgba(6,182,212,0.2)` | `rgba(6,182,212,0.2)` |
| `padBorder` (NumberPad) | `rgba(255,255,255,0.08)` | `rgba(0,0,0,0.1)` |

Light-column values are starting points — final values settle during the
visual check.

With CSS variables enabled, custom palette keys become CSS vars; components
reference `theme.vars.palette.board.*` (or the `var(--mui-…)` string in
`getCellStyling`'s returned values). No per-mode conditionals in components —
mode switching is pure CSS. TypeScript module augmentation adds `board` to the
`Palette` interface.

Colored semi-transparent tints (red/green/indigo/cyan) mostly survive both
modes but get per-mode alpha adjustments where light-background contrast needs
it.

### 3. Toggle button (`src/components/Header.tsx`)

- `IconButton` beside undo/redo using `useColorScheme()` →
  `{ mode, systemMode, setMode }`.
- Resolved mode (mode, or systemMode when mode is `'system'`) dark → show
  `LightMode` icon, tap calls `setMode('light')`; light → `DarkMode` icon,
  tap calls `setMode('dark')`.
- MUI persists the choice to localStorage automatically; default mode is
  `system`.
- Landscape strip: the toggle joins the existing `order` overrides (menu,
  toggle, undo, redo top-to-bottom); portrait/desktop keep DOM order.

### 4. Scope edges

- `ScanDialog` viewfinder overlay keeps hardcoded cyan `#06b6d4` — it draws on
  live video, theme-independent.
- `HelpDialog` swatches are colored (not white-alpha) — legible in both modes,
  unchanged.
- `index.html` has no `theme-color` meta — nothing to update there.
- No new tests: sudoku logic untouched; existing suite must stay green.
  Verification is visual — Playwright screenshots in both modes, portrait and
  landscape viewports.

## Success criteria

1. `npm run build`, `npm run lint`, `npm test` all pass.
2. Fresh profile (no localStorage): app matches OS color scheme.
3. Toggle switches theme instantly; choice survives reload.
4. Board, number pad, header, menus, help dialog, and scan review are legible
   in both modes (visual check, both orientations).
5. Dark mode looks identical to today's app.
