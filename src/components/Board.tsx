import { Box } from '@mui/material';
import { getCellCoords } from '../sudoku/coords';
import { getCandidates, getConflictingCells, type Board as BoardState } from '../sudoku/logic';
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
) => {
  const isSelected = selectedCell === index;
  const isConflicting = conflictingCells.has(index);
  const isSingleCandidate = board[index] === null && candidates.size === 1;

  let bgcolor = 'background.paper';
  let borderColor = 'rgba(255, 255, 255, 0.08)';

  if (isConflicting) {
    bgcolor = 'rgba(239, 68, 68, 0.2)';
    borderColor = 'rgba(239, 68, 68, 0.4)';
  } else if (isSingleCandidate) {
    bgcolor = 'rgba(34, 197, 94, 0.2)';
  }

  if (selectedCell !== null) {
    const sc = getCellCoords(selectedCell);
    const cc = getCellCoords(index);
    const isRelated = sc.row === cc.row || sc.col === cc.col || sc.box === cc.box;
    const selectedValue = board[selectedCell];
    const sharesValue = selectedValue !== null && board[index] === selectedValue;

    if (isSelected) {
      if (isConflicting) {
        bgcolor = 'rgba(239, 68, 68, 0.25)';
        borderColor = '#ef4444';
      } else {
        borderColor = '#06b6d4';
        if (!isSingleCandidate) bgcolor = 'rgba(99, 102, 241, 0.15)';
      }
    } else if (!isConflicting && !isSingleCandidate) {
      if (sharesValue) bgcolor = 'rgba(6, 182, 212, 0.2)';
      else if (isRelated) bgcolor = 'rgba(99, 102, 241, 0.05)';
    }
  }

  return { bgcolor, borderColor, isConflicting };
};

const Board = ({ board, selectedCell, onSelectCell }: BoardProps) => {
  const conflictingCells = getConflictingCells(board);

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '100vw',
        aspectRatio: '1',
        bgcolor: 'background.paper',
        borderRadius: 0,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        border: '3px solid #1f2937',
        display: 'grid',
        gridTemplateColumns: 'repeat(9, 1fr)',
        gridTemplateRows: 'repeat(9, 1fr)',
        overflow: 'hidden',
        '@media (min-width: 600px)': {
          maxWidth: '460px',
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
        const { bgcolor, borderColor, isConflicting } = getCellStyling(board, selectedCell, conflictingCells, idx, candidates);

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
