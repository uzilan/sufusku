import { Box } from '@mui/material';
import Board from './components/Board';
import Header from './components/Header';
import NumberPad from './components/NumberPad';
import { useSudokuBoard } from './hooks/useSudokuBoard';

function App() {
  const { board, selectedCell, setSelectedCell, setCellValue, setBoard, clearBoard, undo, redo, canUndo, canRedo } =
    useSudokuBoard();

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
        },
      }}
    >
      <Header
        board={board}
        selectedCell={selectedCell}
        onClearAll={clearBoard}
        onSolveCell={setCellValue}
        onScanAccept={setBoard}
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
        }}
      >
        <Board board={board} selectedCell={selectedCell} onSelectCell={setSelectedCell} />
        <NumberPad board={board} selectedCell={selectedCell} onSelect={setCellValue} />
      </Box>
    </Box>
  );
}

export default App;
