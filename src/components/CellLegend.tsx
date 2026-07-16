import { Box } from '@mui/material';
import type { BoardPalette } from '../theme';

// A small stand-in for a real board cell — same border/bg/digit language as Cell.tsx,
// so previews read as "this is what it looks like" rather than an abstract swatch.
export const MiniCell = ({
  bg,
  outline,
  value,
  textColor,
  candidate,
}: {
  bg: string;
  outline?: string;
  value?: number;
  textColor?: string;
  candidate?: number;
}) => (
  <Box
    sx={{
      position: 'relative',
      width: 30,
      height: 30,
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: bg,
      border: '1px solid',
      borderColor: 'divider',
      outline: outline ? `2px solid ${outline}` : 'none',
      outlineOffset: '-2px',
      fontWeight: 800,
      fontSize: '0.9rem',
      color: textColor ?? 'secondary.main',
    }}
  >
    {/* CandidateGrid's Typography line-height is tuned for real (larger) board cells and
        overflows a 30px box, so a candidate digit here is a lightweight positioned span
        instead — same row/col math (row ⌊(n-1)/3⌋, col (n-1)%3), no line-height baggage. */}
    {candidate !== undefined ? (
      <Box
        sx={{
          position: 'absolute',
          left: `${((candidate - 1) % 3) * (100 / 3)}%`,
          top: `${Math.floor((candidate - 1) / 3) * (100 / 3)}%`,
          width: `${100 / 3}%`,
          height: `${100 / 3}%`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '9px',
          fontWeight: 700,
          lineHeight: 1,
          color: 'primary.light',
          opacity: 0.6,
        }}
      >
        {candidate}
      </Box>
    ) : (
      value
    )}
  </Box>
);

// Two adjacent cells sharing a border, mimicking how a real conflict looks on the board.
export const MiniConflictPair = ({
  bg,
  borderColor,
  textColor,
  value,
}: {
  bg: string;
  borderColor: string;
  textColor: string;
  value: number;
}) => (
  <Box sx={{ display: 'flex', flexShrink: 0 }}>
    <Box
      sx={{
        width: 30,
        height: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: bg,
        border: '1px solid',
        borderColor: 'divider',
        borderRight: `1px solid ${borderColor}`,
        fontWeight: 800,
        fontSize: '0.9rem',
        color: textColor,
      }}
    >
      {value}
    </Box>
    <Box
      sx={{
        width: 30,
        height: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: bg,
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: 'none',
        fontWeight: 800,
        fontSize: '0.9rem',
        color: textColor,
      }}
    >
      {value}
    </Box>
  </Box>
);

export interface CellLegendItem {
  label: string;
  description: string;
  preview: React.ReactNode;
}

// Single source of truth for the four semantic cell states + selection, consumed by
// both LegendDrawer (always-visible bar) and HelpDialog (How to use) so they can't drift.
export const getCellLegendItems = (b: BoardPalette): CellLegendItem[] => [
  {
    label: 'Conflict',
    description: 'Same number twice in a row, column or box.',
    preview: <MiniConflictPair bg={b.conflictBg} borderColor={b.conflictBorder} textColor={b.conflictText} value={7} />,
  },
  {
    label: 'Given',
    description: 'Filled by a scan or a new puzzle — read-only until cleared, rescanned, or regenerated.',
    preview: <MiniCell bg={b.givenBg} value={4} textColor={b.givenText} />,
  },
  {
    label: 'Solvable',
    description: 'Empty cell with only one number that can go there.',
    preview: <MiniCell bg={b.singleBg} candidate={8} />,
  },
  {
    label: 'Hint',
    description: 'The cell found by Hint.',
    preview: <MiniCell bg={b.hintBg} outline={b.hintBorder} />,
  },
  {
    label: 'Selected',
    description: 'The cell you last tapped or navigated to.',
    preview: <MiniCell bg={b.selectionBg} outline="#06b6d4" />,
  },
  {
    label: 'Highlighted',
    description: 'Shares the same number as the selected cell.',
    preview: <MiniCell bg={b.shareTint} value={6} />,
  },
];
