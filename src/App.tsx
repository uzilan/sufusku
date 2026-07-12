import { Box } from '@mui/material';
import Board from './components/Board';
import Header from './components/Header';
import { useSudokuBoard } from './hooks/useSudokuBoard';

function App() {
  const { board, selectedCell, setSelectedCell } = useSudokuBoard();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <Header />
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          p: { xs: 1, sm: 2 },
        }}
      >
        <Board board={board} selectedCell={selectedCell} onSelectCell={setSelectedCell} />
      </Box>
    </Box>
  );
}

export default App;
