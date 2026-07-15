import { Box, Button, Dialog, DialogContent, DialogTitle, Typography } from '@mui/material';
import { generatePuzzle, type Difficulty } from '../sudoku/generate';
import type { Board } from '../sudoku/logic';

interface NewPuzzleDialogProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (board: Board) => void;
}

const DIFFICULTIES: Array<{ value: Difficulty; label: string; description: string }> = [
  { value: 'easy', label: 'Easy', description: 'More starting numbers, gentler solving.' },
  { value: 'medium', label: 'Medium', description: 'A balanced challenge.' },
  { value: 'hard', label: 'Hard', description: 'Fewer starting numbers, tougher deductions.' },
];

const NewPuzzleDialog = ({ open, onClose, onGenerate }: NewPuzzleDialogProps) => {
  const handlePick = (difficulty: Difficulty) => {
    onGenerate(generatePuzzle(difficulty));
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>New puzzle</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pb: 1 }}>
          {DIFFICULTIES.map(({ value, label, description }) => (
            <Button
              key={value}
              variant="outlined"
              onClick={() => handlePick(value)}
              sx={{
                justifyContent: 'flex-start',
                textAlign: 'left',
                flexDirection: 'column',
                alignItems: 'flex-start',
                py: 1.25,
                textTransform: 'none',
              }}
            >
              <Typography sx={{ fontWeight: 700 }}>{label}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {description}
              </Typography>
            </Button>
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default NewPuzzleDialog;
