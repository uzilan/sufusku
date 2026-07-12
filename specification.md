# Technical Specification - Sufusku

This specification defines the functional requirements, design system, technical architecture, and implementation details of the Sufusku web application.

---

## 1. Product Overview

**Sufusku** is a mobile-first Sudoku helper tool. The user enters their own Sudoku puzzle into a blank 9x9 grid. The app then assists solving by automating candidate (pencil-mark) tracking and constraint elimination in real-time.

The app does **not** provide pre-loaded puzzles or suggestions. It is entirely up to the user to enter numbers.

---

## 2. Requirements & Visual Specifications

### 2.1 Grid & Cell Sizing
- **Aspect Ratio**: The Sudoku Board must be a perfect square (`aspect-ratio: 1`).
- **Equal Proportion Cells**: Every cell inside the 9x9 board must have identical width and height.
- **Dividers**: 
  - Standard cell boundaries use subtle dividing lines (`0.5px solid rgba(255,255,255,0.05)`).
  - The nine 3x3 blocks must be separated by thicker, highly-visible dividers (`2.5px solid #4b5563`).

### 2.2 Cell States
A cell can exist in one of two visual modes:

1. **Empty / Candidate Mode**:
   - The middle area of the cell is empty.
   - At the bottom of the cell, spanning the **full width**, a single horizontal row displays the numbers `1` through `9`.
   - **Stable Positioning**: The candidate row uses a 9-column grid layout. If a number is an active candidate, it renders in a semi-transparent gray font. If it is eliminated, it is rendered with `transparent` color so that it still occupies its grid position. This prevents remaining numbers from shifting or scaling.
2. **Filled / Resolved Mode**:
   - The cell displays a single, large, bold number centered vertically and horizontally.
   - The candidate row at the bottom is completely hidden.
   - All user-entered numbers are colored with the accent cyan color (`secondary.main` / `#06b6d4`).

### 2.3 Mobile-First Design Strategy
- **Compact Header**: The top app bar uses compact/dense height settings.
- **Fluid Sizing**: The board scales dynamically to take up `100%` width on mobile portrait viewports (up to a maximum desktop size of `460px`).
- **Zero-Scroll Viewport**: Spacing, margins, and card headers are optimized so that the entire app interface (Board + Controls) fits within a single mobile screen height, preventing vertical scrollbars.
- **Tappable Targets**: Cell targets and input pad buttons are oversized for easy touchscreen tapping, but keep minimal padding to remain compact.

---

## 3. Technology Stack & Architecture

- **Core Framework**: React 19 (TypeScript template)
- **Bundler & Server**: Vite 8 (Hot Module Replacement enabled)
- **UI Library**: Material UI (MUI) 9
- **Design Style**: Custom Premium Dark Theme (Deep Navy `#0b0f19` background, Slate-Gray card panels `#111827`, Indigo `#6366f1` and Cyan `#06b6d4` gradients and accent glows).

---

## 4. Logic & Reactive Rules

### 4.1 Constraint Calculation
When a cell at index $i$ is empty, its candidate set $C_i$ is computed dynamically based on the numbers placed in its peer cells:
$$C_i = \{1, 2, \dots, 9\} \setminus (R_i \cup Co_i \cup B_i)$$
Where:
- $R_i$: Set of numbers in the same horizontal row.
- $Co_i$: Set of numbers in the same vertical column.
- $B_i$: Set of numbers in the same 3x3 block.

### 4.2 Board Grid Coordinate Mapping
For a flat array index $idx \in [0, 80]$:
- $\text{Row } r = \lfloor idx / 9 \rfloor$
- $\text{Column } c = idx \pmod 9$
- $\text{3x3 Box } b = \lfloor r / 3 \rfloor \times 3 + \lfloor c / 3 \rfloor$

### 4.3 Interactive Highlights
When a cell is selected:
- **Selected Cell**: Highlighted with a glowing cyan outline.
- **Peer Highlights**: Cells in the same row, column, or 3x3 block are highlighted with a very subtle background tint (`rgba(99, 102, 241, 0.05)`).
- **Matching Value Highlights**: If the selected cell contains a value, all other cells containing that same value are highlighted with a cyan glow (`rgba(6, 182, 212, 0.2)`).

### 4.4 Conflict & Error Detection
- **Trigger**: If two cells in the same row, column, or 3x3 block contain the same number, they are marked as **conflicting**.
- **Visual Alert**:
  - Both conflicting cells immediately transition to a glowing red background (`rgba(239, 68, 68, 0.2)`).
  - The text digit inside the conflicting cells changes color to a reddish pink (`#f87171`) to alert the user.
  - If a conflicting cell is selected, its outline turns red (`#ef4444`) instead of the standard cyan focus outline.

---

## 5. User Interaction & Control Flow

### 5.1 Cell Selection
- Clicking or tapping any cell selects it. Tapping it again keeps it selected. Selecting another cell shifts focus.

### 5.2 Value Input
- **On-Screen Pad**: Tapping digits 1-9 on the sidebar input pad enters the value in the active cell.
- **Keyboard Inputs**: Pressing numeric keys `1` through `9` on desktop enters values. Pressing `Backspace` or `Delete` clears the cell.
- **Clear Action**: A dedicated "Clear Cell" button clears the active cell.

### 5.3 Board Controls
- **Clear Grid**: A "Clear Grid" button wipes all cells, resetting the board to a completely blank state.

### 5.4 Initial State
- The application always starts with a **completely empty 9x9 grid**. Every cell begins in Candidate Mode showing all digits 1–9. There are no pre-loaded puzzles or difficulty presets.
