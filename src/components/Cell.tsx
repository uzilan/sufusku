import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CandidateRow from './CandidateRow';

interface CellProps {
  row: number;
  col: number;
  value: number | null;
  isSelected: boolean;
  isConflicting: boolean;
  isGiven: boolean;
  bgcolor: string;
  borderColor: string;
  candidates: Set<number>;
  onClick: () => void;
}

const Cell = ({ row, col, value, isSelected, isConflicting, isGiven, bgcolor, borderColor, candidates, onClick }: CellProps) => {
  const hasValue = value !== null;
  const borderTopWidth = row === 0 ? '0px' : row % 3 === 0 ? '2.5px' : '0.5px';
  const borderLeftWidth = col === 0 ? '0px' : col % 3 === 0 ? '2.5px' : '0.5px';
  const theme = useTheme();
  const b = (theme.vars ?? theme).palette.board;
  const borderTopColor = row % 3 === 0 ? b.line : b.subline;
  const borderLeftColor = col % 3 === 0 ? b.line : b.subline;

  return (
    <Box
      onClick={onClick}
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor,
        cursor: 'pointer',
        borderTop: `${borderTopWidth} solid ${borderTopColor}`,
        borderLeft: `${borderLeftWidth} solid ${borderLeftColor}`,
        borderBottom: row === 8 ? 'none' : `0.5px solid ${b.subline}`,
        borderRight: col === 8 ? 'none' : `0.5px solid ${b.subline}`,
        outline: isSelected ? `2px solid ${borderColor}` : 'none',
        outlineOffset: '-2px',
        zIndex: isSelected ? 10 : 1,
        userSelect: 'none',
        touchAction: 'manipulation',
        '&:hover': {
          bgcolor: b.hoverBg,
        },
      }}
    >
      {hasValue ? (
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.75rem' },
            color: isConflicting ? b.conflictText : isGiven ? b.givenText : 'secondary.main',
            lineHeight: 1,
          }}
        >
          {value}
        </Typography>
      ) : null}

      {!hasValue && <CandidateRow candidates={candidates} />}
    </Box>
  );
};

export default Cell;
