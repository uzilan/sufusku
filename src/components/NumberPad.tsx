import { Box } from '@mui/material';
import { getCandidates, type Board as BoardState } from '../sudoku/logic';

interface NumberPadProps {
  board: BoardState;
  selectedCell: number | null;
  onSelect: (value: number) => void;
}

const NumberPad = ({ board, selectedCell, onSelect }: NumberPadProps) => {
  if (selectedCell === null) return null;

  const candidates = getCandidates(board, selectedCell);

  return (
    <Box
      sx={{
        display: 'none',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(3, 1fr)',
        gap: 1,
        width: '100%',
        maxWidth: '260px',
        flexShrink: 0,
        '@media (max-width: 599.95px) and (orientation: portrait)': {
          display: 'grid',
          maxWidth: '200px',
        },
        '@media (max-height: 599.95px) and (orientation: landscape)': {
          display: 'grid',
          maxWidth: '180px',
        },
        '@media (min-width: 600px) and (min-height: 600px)': {
          display: 'grid',
          maxWidth: '220px',
        },
      }}
    >
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
        <Box
          key={num}
          onClick={() => onSelect(num)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            aspectRatio: '1',
            borderRadius: 1,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'board.padBorder',
            cursor: 'pointer',
            userSelect: 'none',
            touchAction: 'manipulation',
            fontWeight: 800,
            fontSize: '1.25rem',
            color: candidates.has(num) ? 'secondary.main' : 'text.secondary',
            opacity: candidates.has(num) ? 1 : 0.4,
          }}
        >
          {num}
        </Box>
      ))}
    </Box>
  );
};

export default NumberPad;
