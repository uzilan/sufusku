import { lazy, Suspense, useState } from 'react';
import type { MouseEvent } from 'react';
import { Alert, IconButton, Menu, MenuItem, Portal, Snackbar } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { getCandidates, type Board as BoardState } from '../sudoku/logic';
import { hasSolution, DEFAULT_SOLVE_BUDGET } from '../sudoku/solver';

const ScanDialog = lazy(() => import('./ScanDialog'));

interface HeaderMenuProps {
  board: BoardState;
  selectedCell: number | null;
  onClearAll: () => void;
  onSolveCell: (value: number) => void;
  onScanAccept: (board: BoardState) => void;
}

const HeaderMenu = ({ board, selectedCell, onClearAll, onSolveCell, onScanAccept }: HeaderMenuProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [scanOpen, setScanOpen] = useState(false);

  const isCellEmpty = selectedCell !== null && board[selectedCell] === null;

  const handleClose = () => setAnchorEl(null);

  const handleClearAll = () => {
    onClearAll();
    handleClose();
  };

  const handleSolveCell = () => {
    handleClose();
    if (selectedCell === null) return;
    const localCandidates = [...getCandidates(board, selectedCell)].sort((a, b) => a - b);
    const budget = { remaining: DEFAULT_SOLVE_BUDGET };
    const validValues: number[] = [];
    let tooComplex = false;

    for (const value of localCandidates) {
      const tentative = [...board];
      tentative[selectedCell] = value;
      const result = hasSolution(tentative, budget);
      if (result === 'unknown') {
        tooComplex = true;
        break;
      }
      if (result === 'solvable') validValues.push(value);
    }

    if (tooComplex) setMessage('This cell is too complex to solve quickly.');
    else if (validValues.length === 0) setMessage('No valid value for this cell.');
    else if (validValues.length === 1) onSolveCell(validValues[0]);
    else if (validValues.length > 3) setMessage(`Too many possible values (${validValues.length}) — not a useful hint.`);
    else setMessage(`Multiple values possible: ${validValues.join(', ')}`);
  };

  const handleScan = () => {
    handleClose();
    setScanOpen(true);
  };

  return (
    <>
      <IconButton
        onClick={(e: MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget)}
        sx={{ color: 'secondary.main' }}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem onClick={handleSolveCell} disabled={!isCellEmpty}>
          Solve cell
        </MenuItem>
        <MenuItem onClick={handleScan}>Scan puzzle</MenuItem>
        <MenuItem onClick={handleClearAll}>Clear all</MenuItem>
      </Menu>
      <Portal>
        <Snackbar
          open={message !== null}
          autoHideDuration={4000}
          onClose={() => setMessage(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setMessage(null)} severity="info" variant="filled">
            {message}
          </Alert>
        </Snackbar>
      </Portal>
      {scanOpen && (
        <Suspense fallback={null}>
          <ScanDialog
            open={scanOpen}
            onClose={() => setScanOpen(false)}
            onAccept={(scanned) => {
              onScanAccept(scanned);
              setScanOpen(false);
            }}
          />
        </Suspense>
      )}
    </>
  );
};

export default HeaderMenu;
