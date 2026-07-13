import { Box } from '@mui/material';
import Board from './components/Board';
import Header from './components/Header';
import LegendDrawer from './components/LegendDrawer';
import NumberPad from './components/NumberPad';
import { useSudokuBoard } from './hooks/useSudokuBoard';

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

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: 'background.default',
        pb: '32px',
        '@media (max-height: 599.95px) and (orientation: landscape)': {
          flexDirection: 'row',
          height: '100vh',
          pb: 0,
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
          onSelectCell={setSelectedCell}
        />
        <NumberPad board={board} selectedCell={selectedCell} givenCells={givenCells} onSelect={setCellValue} />
      </Box>
      <LegendDrawer />
    </Box>
  );
}

export default App;
