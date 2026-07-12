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
