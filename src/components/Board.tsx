import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { getCellCoords } from '../sudoku/coords';
import { getCandidates, getConflictingCells, type Board as BoardState } from '../sudoku/logic';
import type { BoardPalette } from '../theme';
import Cell from './Cell';

const SHIMMER_DURATION_MS = 1100;

interface BoardProps {
  board: BoardState;
  selectedCell: number | null;
  hintCell: number | null;
  givenCells: Set<number>;
  celebrate: number;
  onSelectCell: (index: number) => void;
}

// Determine cell styling
const getCellStyling = (
  board: BoardState,
  selectedCell: number | null,
  conflictingCells: Set<number>,
  index: number,
  candidates: Set<number>,
  hintCell: number | null,
  givenCells: Set<number>,
  b: BoardPalette,
) => {
  const isSelected = selectedCell === index;
  const isConflicting = conflictingCells.has(index);
  const isSingleCandidate = board[index] === null && candidates.size === 1;
  const isHinted = hintCell === index;
  const isGiven = givenCells.has(index);

  let bgcolor = 'background.paper';
  let borderColor = b.padBorder;

  if (isConflicting) {
    bgcolor = b.conflictBg;
    borderColor = b.conflictBorder;
  } else if (isHinted) {
    bgcolor = b.hintBg;
    borderColor = b.hintBorder;
  } else if (isSingleCandidate) {
    bgcolor = b.singleBg;
  } else if (isGiven) {
    bgcolor = b.givenBg;
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
      } else if (!isHinted) {
        borderColor = '#06b6d4';
        if (!isSingleCandidate && !isGiven) bgcolor = b.selectionBg;
      }
    } else if (!isConflicting && !isSingleCandidate && !isHinted && !isGiven) {
      if (sharesValue) bgcolor = b.shareTint;
      else if (isRelated) bgcolor = b.relatedTint;
    }
  }

  return { bgcolor, borderColor, isConflicting };
};

const Board = ({ board, selectedCell, hintCell, givenCells, celebrate, onSelectCell }: BoardProps) => {
  const conflictingCells = getConflictingCells(board);
  const theme = useTheme();
  const b = (theme.vars ?? theme).palette.board;
  const [shimmering, setShimmering] = useState(false);

  useEffect(() => {
    if (celebrate === 0) return;
    setShimmering(true);
    const timer = window.setTimeout(() => setShimmering(false), SHIMMER_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [celebrate]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: '100vw',
        aspectRatio: '1',
        bgcolor: 'background.paper',
        borderRadius: 0,
        boxShadow: b.shadow,
        border: `3px solid ${b.frame}`,
        display: 'grid',
        gridTemplateColumns: 'repeat(9, 1fr)',
        gridTemplateRows: 'repeat(9, 1fr)',
        overflow: 'hidden',
        '@media (min-width: 600px)': {
          maxWidth: '460px',
        },
        '@media (min-width: 600px) and (min-height: 600px)': {
          width: 'min(calc(100vh - 113px), calc(100vw - 260px))',
          height: 'min(calc(100vh - 113px), calc(100vw - 260px))',
          maxWidth: 'none',
        },
        '@media (max-height: 599.95px) and (orientation: landscape)': {
          width: 'min(calc(100vh - 16px), calc(100vw - 280px))',
          height: 'min(calc(100vh - 16px), calc(100vw - 280px))',
          maxWidth: 'none',
        },
        ...(shimmering && {
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            zIndex: 20,
            pointerEvents: 'none',
            background:
              'linear-gradient(115deg, transparent 30%, rgba(6,182,212,0.35) 48%, rgba(99,102,241,0.35) 52%, transparent 70%)',
            transform: 'translateX(-140%)',
            animation: 'sufusku-shimmer-sweep 1.1s ease-in-out 1',
          },
        }),
      }}
    >
      {board.map((val, idx) => {
        const { row, col } = getCellCoords(idx);
        const candidates = getCandidates(board, idx);
        const { bgcolor, borderColor, isConflicting } = getCellStyling(
          board,
          selectedCell,
          conflictingCells,
          idx,
          candidates,
          hintCell,
          givenCells,
          b,
        );

        return (
          <Cell
            key={idx}
            row={row}
            col={col}
            value={val}
            isSelected={selectedCell === idx}
            isConflicting={isConflicting}
            isGiven={givenCells.has(idx)}
            bgcolor={bgcolor}
            borderColor={borderColor}
            candidates={candidates}
            onClick={() => onSelectCell(idx)}
          />
        );
      })}
    </Box>
  );
};

export default Board;
