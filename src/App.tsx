import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box, Portal, Snackbar } from '@mui/material';
import Board from './components/Board';
import Header from './components/Header';
import LegendDrawer from './components/LegendDrawer';
import NumberPad from './components/NumberPad';
import { useSudokuBoard } from './hooks/useSudokuBoard';
import { getConflictingCells } from './sudoku/logic';

function App() {
  const {
    board,
    selectedCell,
    setSelectedCell,
    setCellValue,
    setCellValueAt,
    acceptScan,
    clearBoard,
    undo,
    redo,
    canUndo,
    canRedo,
    pendingHint,
    setPendingHint,
    givenCells,
  } = useSudokuBoard();

  const isSolved = useMemo(
    () => board.every((v) => v !== null) && getConflictingCells(board).size === 0,
    [board],
  );
  const wasSolvedRef = useRef(isSolved);
  const [celebrate, setCelebrate] = useState(0);
  const [showSolvedBanner, setShowSolvedBanner] = useState(false);

  useEffect(() => {
    if (isSolved && !wasSolvedRef.current) {
      setCelebrate((c) => c + 1);
      setShowSolvedBanner(true);
    } else if (!isSolved) {
      setShowSolvedBanner(false);
    }
    wasSolvedRef.current = isSolved;
  }, [isSolved]);

  // Repeat the shimmer at intervals for as long as the board stays solved —
  // stops on its own once clearBoard/acceptScan (or any edit) makes it unsolved.
  useEffect(() => {
    if (!isSolved) return;
    const id = window.setInterval(() => setCelebrate((c) => c + 1), 4000);
    return () => window.clearInterval(id);
  }, [isSolved]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: 'background.default',
        '@media (max-height: 599.95px) and (orientation: landscape)': {
          flexDirection: 'row',
          height: '100vh',
          pr: '32px',
        },
      }}
    >
      <Header
        board={board}
        selectedCell={selectedCell}
        pendingHint={pendingHint}
        onSelectCell={setSelectedCell}
        onSetPendingHint={setPendingHint}
        onClearAll={clearBoard}
        onSolveCell={setCellValue}
        onRevealHint={setCellValueAt}
        onScanAccept={acceptScan}
        onNewPuzzle={acceptScan}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          p: { xs: 1, sm: 2 },
          gap: 2,
          '@media (max-height: 599.95px) and (orientation: landscape)': {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
          },
          '@media (min-width: 600px) and (min-height: 600px)': {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
          },
        }}
      >
        <Board
          board={board}
          selectedCell={selectedCell}
          hintCell={pendingHint?.index ?? null}
          givenCells={givenCells}
          celebrate={celebrate}
          onSelectCell={setSelectedCell}
        />
        <NumberPad board={board} selectedCell={selectedCell} givenCells={givenCells} onSelect={setCellValue} />
      </Box>
      <LegendDrawer />
      <Portal>
        <Snackbar
          open={showSolvedBanner}
          autoHideDuration={4000}
          onClose={() => setShowSolvedBanner(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={() => setShowSolvedBanner(false)} severity="success" variant="filled">
            Solved!
          </Alert>
        </Snackbar>
      </Portal>
    </Box>
  );
}

export default App;
