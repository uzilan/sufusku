import { AppBar, Box, IconButton, Toolbar, Typography } from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import HeaderMenu from './HeaderMenu';
import type { Board as BoardState } from '../sudoku/logic';
import type { HintResult } from '../sudoku/hint';

const landscapeQuery = '@media (max-height: 599.95px) and (orientation: landscape)';

const ThemeToggle = () => {
  const { mode, systemMode, setMode } = useColorScheme();
  const resolved = (mode === 'system' ? systemMode : mode) ?? 'dark';
  return (
    <IconButton
      onClick={() => setMode(resolved === 'dark' ? 'light' : 'dark')}
      sx={{ color: 'secondary.main', [landscapeQuery]: { order: 2 } }}
      aria-label={resolved === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {resolved === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
    </IconButton>
  );
};

interface HeaderProps {
  board: BoardState;
  selectedCell: number | null;
  pendingHint: HintResult | null;
  onSelectCell: (index: number) => void;
  onSetPendingHint: (hint: HintResult | null) => void;
  onClearAll: () => void;
  onSolveCell: (value: number) => void;
  onRevealHint: (index: number, value: number) => void;
  onScanAccept: (board: BoardState) => void;
  onNewPuzzle: (board: BoardState) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const Header = ({
  board,
  selectedCell,
  pendingHint,
  onSelectCell,
  onSetPendingHint,
  onClearAll,
  onSolveCell,
  onRevealHint,
  onScanAccept,
  onNewPuzzle,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: HeaderProps) => (
  <AppBar
    position="static"
    elevation={0}
    sx={{
      [landscapeQuery]: {
        width: '56px',
        flexShrink: 0,
      },
    }}
  >
    <Toolbar
      variant="dense"
      sx={{
        position: 'relative',
        justifyContent: 'space-between',
        [landscapeQuery]: {
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'center',
          gap: 1,
          height: '100%',
          minHeight: 'auto',
          px: 0,
          py: 1,
        },
      }}
    >
      <Typography
        sx={{
          fontFamily: '"Permanent Marker", cursive',
          fontSize: { xs: '1.5rem', sm: '1.75rem' },
          color: 'secondary.main',
          letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
          [landscapeQuery]: {
            transform: 'rotate(-90deg)',
            order: 2,
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          },
        }}
      >
        Sufusku
      </Typography>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          [landscapeQuery]: {
            order: 1,
            flexShrink: 0,
            flexDirection: 'column',
          },
        }}
      >
        <IconButton
          onClick={onUndo}
          disabled={!canUndo}
          sx={{ color: 'secondary.main', [landscapeQuery]: { order: 3 } }}
        >
          <UndoIcon />
        </IconButton>
        <IconButton
          onClick={onRedo}
          disabled={!canRedo}
          sx={{ color: 'secondary.main', [landscapeQuery]: { order: 4 } }}
        >
          <RedoIcon />
        </IconButton>
        <ThemeToggle />
        <Box sx={{ [landscapeQuery]: { order: 1 } }}>
          <HeaderMenu
            board={board}
            selectedCell={selectedCell}
            pendingHint={pendingHint}
            onSelectCell={onSelectCell}
            onSetPendingHint={onSetPendingHint}
            onClearAll={onClearAll}
            onSolveCell={onSolveCell}
            onRevealHint={onRevealHint}
            onScanAccept={onScanAccept}
            onNewPuzzle={onNewPuzzle}
          />
        </Box>
      </Box>
    </Toolbar>
  </AppBar>
);

export default Header;
