import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { getCellCoords } from '../sudoku/coords';
import { getCandidates, getConflictingCells, type Board as BoardState } from '../sudoku/logic';
import type { BoardPalette } from '../theme';
import Cell from './Cell';

interface BoardProps {
  board: BoardState;
  selectedCell: number | null;
  onSelectCell: (index: number) => void;
}

// Determine cell styling
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

const Board = ({ board, selectedCell, onSelectCell }: BoardProps) => {
  const conflictingCells = getConflictingCells(board);
  const theme = useTheme();
  const b = (theme.vars ?? theme).palette.board;

  return (
    <Box
      sx={{
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
          width: 'min(calc(100vh - 81px), calc(100vw - 32px))',
          height: 'min(calc(100vh - 81px), calc(100vw - 32px))',
          maxWidth: 'none',
        },
        '@media (max-height: 599.95px) and (orientation: landscape)': {
          width: 'min(calc(100vh - 16px), calc(100vw - 280px))',
          height: 'min(calc(100vh - 16px), calc(100vw - 280px))',
          maxWidth: 'none',
        },
      }}
    >
      {board.map((val, idx) => {
        const { row, col } = getCellCoords(idx);
        const candidates = getCandidates(board, idx);
        const { bgcolor, borderColor, isConflicting } = getCellStyling(board, selectedCell, conflictingCells, idx, candidates, b);

        return (
          <Cell
            key={idx}
            row={row}
            col={col}
            value={val}
            isSelected={selectedCell === idx}
            isConflicting={isConflicting}
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
