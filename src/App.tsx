import { useState, useEffect } from 'react';
import { AppBar, Box, Toolbar, Typography } from '@mui/material';

function App() {
  const [board, setBoard] = useState<Array<number | null>>(() => Array(81).fill(null));
  const [selectedCell, setSelectedCell] = useState<number | null>(0);

  // Get current row, column, and box block index for a cell index
  const getCellCoords = (index: number) => ({
    row: Math.floor(index / 9),
    col: index % 9,
    box: Math.floor(Math.floor(index / 9) / 3) * 3 + Math.floor((index % 9) / 3),
  });

  // Find all cells that are currently in conflict (duplicate values in same row, col, or box)
  const getConflictingCells = (): Set<number> => {
    const conflicting = new Set<number>();
    for (let i = 0; i < 81; i++) {
      const val = board[i];
      if (val === null) continue;
      const coords = getCellCoords(i);
      for (let j = i + 1; j < 81; j++) {
        if (board[j] === val) {
          const otherCoords = getCellCoords(j);
          if (
            coords.row === otherCoords.row ||
            coords.col === otherCoords.col ||
            coords.box === otherCoords.box
          ) {
            conflicting.add(i);
            conflicting.add(j);
          }
        }
      }
    }
    return conflicting;
  };

  const conflictingCells = getConflictingCells();

  // Dynamically calculate candidates (possible values 1-9) for a cell
  const getCandidates = (currentIndex: number): Set<number> => {
    if (board[currentIndex] !== null) return new Set();
    const candidates = new Set<number>([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const { row: tr, col: tc, box: tb } = getCellCoords(currentIndex);
    for (let i = 0; i < 81; i++) {
      const val = board[i];
      if (val === null || i === currentIndex) continue;
      const { row, col, box } = getCellCoords(i);
      if (row === tr || col === tc || box === tb) candidates.delete(val);
    }
    return candidates;
  };

  // Set number in the selected cell
  const setCellValue = (value: number | null) => {
    if (selectedCell === null) return;
    const newBoard = [...board];
    newBoard[selectedCell] = value;
    setBoard(newBoard);
  };

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedCell === null) return;
      if (e.key >= '1' && e.key <= '9') setCellValue(parseInt(e.key));
      else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') setCellValue(null);
      else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const { row, col } = getCellCoords(selectedCell);
        let newRow = row;
        let newCol = col;
        if (e.key === 'ArrowUp') newRow = Math.max(0, row - 1);
        else if (e.key === 'ArrowDown') newRow = Math.min(8, row + 1);
        else if (e.key === 'ArrowLeft') newCol = Math.max(0, col - 1);
        else if (e.key === 'ArrowRight') newCol = Math.min(8, col + 1);
        setSelectedCell(newRow * 9 + newCol);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, board]);

  // Determine cell styling
  const getCellStyling = (index: number) => {
    const isSelected = selectedCell === index;
    const hasValue = board[index] !== null;
    const isConflicting = conflictingCells.has(index);

    let bgcolor = 'background.paper';
    let borderColor = 'rgba(255, 255, 255, 0.08)';

    if (isConflicting) {
      bgcolor = 'rgba(239, 68, 68, 0.2)';
      borderColor = 'rgba(239, 68, 68, 0.4)';
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
          bgcolor = 'rgba(99, 102, 241, 0.15)';
          borderColor = '#06b6d4';
        }
      } else if (!isConflicting) {
        if (sharesValue) bgcolor = 'rgba(6, 182, 212, 0.2)';
        else if (isRelated) bgcolor = 'rgba(99, 102, 241, 0.05)';
      }
    }

    return { bgcolor, borderColor, hasValue, isSelected, isConflicting };
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <AppBar position="static" elevation={0}>
        <Toolbar variant="dense" sx={{ justifyContent: 'center' }}>
          <Typography
            sx={{
              fontFamily: '"Permanent Marker", cursive',
              fontSize: { xs: '1.5rem', sm: '1.75rem' },
              color: 'secondary.main',
              letterSpacing: '0.02em',
            }}
          >
            Sufusku
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          p: { xs: 1, sm: 2 },
        }}
      >
        <Box
        sx={{
          width: '100%',
          maxWidth: { xs: '100vw', sm: '460px' },
          aspectRatio: '1',
          bgcolor: 'background.paper',
          borderRadius: 0,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          border: '3px solid #1f2937',
          display: 'grid',
          gridTemplateColumns: 'repeat(9, 1fr)',
          gridTemplateRows: 'repeat(9, 1fr)',
          overflow: 'hidden',
        }}
      >
        {board.map((val, idx) => {
          const { row, col } = getCellCoords(idx);
          const { bgcolor, borderColor, hasValue, isSelected, isConflicting } = getCellStyling(idx);
          const candidates = getCandidates(idx);

          const borderTopWidth = row === 0 ? '0px' : row % 3 === 0 ? '2.5px' : '0.5px';
          const borderLeftWidth = col === 0 ? '0px' : col % 3 === 0 ? '2.5px' : '0.5px';
          const borderTopColor = row % 3 === 0 ? '#4b5563' : 'rgba(255,255,255,0.05)';
          const borderLeftColor = col % 3 === 0 ? '#4b5563' : 'rgba(255,255,255,0.05)';

          return (
            <Box
              key={idx}
              onClick={() => setSelectedCell(idx)}
              sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor,
                cursor: 'pointer',
                borderTop: `${borderTopWidth} solid ${borderTopColor}`,
                borderLeft: `${borderLeftWidth} solid ${borderLeftColor}`,
                borderBottom: row === 8 ? 'none' : '0.5px solid rgba(255,255,255,0.05)',
                borderRight: col === 8 ? 'none' : '0.5px solid rgba(255,255,255,0.05)',
                outline: isSelected ? `2px solid ${borderColor}` : 'none',
                outlineOffset: '-2px',
                zIndex: isSelected ? 10 : 1,
                userSelect: 'none',
                touchAction: 'manipulation',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.03)',
                },
              }}
            >
              {hasValue ? (
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.75rem' },
                    color: isConflicting ? '#f87171' : 'secondary.main',
                    lineHeight: 1,
                  }}
                >
                  {val}
                </Typography>
              ) : null}

              {!hasValue && (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(9, 1fr)',
                    width: '100%',
                    position: 'absolute',
                    bottom: { xs: 1.5, sm: 2 },
                    left: 0,
                    px: 0.15,
                    textAlign: 'center',
                  }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <Typography
                      key={num}
                      sx={{
                        fontSize: { xs: '6.5px', sm: '7.5px', md: '8px' },
                        fontWeight: 700,
                        color: candidates.has(num) ? 'primary.light' : 'transparent',
                        lineHeight: 1,
                      }}
                    >
                      {num}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          );
        })}
        </Box>
      </Box>
    </Box>
  );
}

export default App;
