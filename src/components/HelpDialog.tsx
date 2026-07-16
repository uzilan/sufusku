import { Box, Dialog, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import { getCellLegendItems, MiniCell } from './CellLegend';

interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Box sx={{ mb: 2.5 }}>
    <Typography variant="h6" sx={{ fontSize: '1.05rem', color: 'secondary.main', mb: 0.5 }}>
      {title}
    </Typography>
    <Typography variant="body2" component="div" sx={{ color: 'text.secondary' }}>
      {children}
    </Typography>
  </Box>
);

const HelpDialog = ({ open, onClose }: HelpDialogProps) => {
  const theme = useTheme();
  const b = (theme.vars ?? theme).palette.board;
  const cellLegendItems = getCellLegendItems(b);

  return (
  <Dialog open={open} onClose={onClose} scroll="paper" maxWidth="sm" fullWidth>
    <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
      How to use
      <IconButton onClick={onClose} sx={{ color: 'secondary.main' }}>
        <CloseIcon />
      </IconButton>
    </DialogTitle>
    <DialogContent dividers>
      <Section title="Enter numbers">
        Tap a cell to select it, then type 1–9 on a keyboard or tap the number pad on your phone.
        Press 0, Backspace or Delete to clear a cell. Arrow keys move the selection. Cells filled
        by a scan or a generated puzzle are read-only — the number pad's <strong>Clear</strong>
        button dims for them, the same as it does for an already-empty cell.
      </Section>
      <Section title="Cell colors">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mt: 0.5 }}>
          {cellLegendItems.map(({ label, description, preview }) => (
            <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {preview}
              <Typography variant="body2" sx={{ color: 'text.primary' }}>
                <strong>{label}</strong> —{' '}
                <Box component="span" sx={{ color: 'text.secondary' }}>
                  {description}
                </Box>
              </Typography>
            </Box>
          ))}
        </Box>
      </Section>
      <Section title="Scan a puzzle">
        Open the menu and choose <strong>Scan puzzle</strong>, then allow camera access. Fill the
        frame with the puzzle and avoid glare. Hold steady — the photo is taken automatically when
        the grid is recognized. Prefer to use an existing photo? Tap the gallery icon in the
        top-left corner instead — it works the same way whether or not the camera is available.
      </Section>
      <Section title="Generate a puzzle">
        No paper puzzle handy? Choose <strong>New puzzle</strong> from the menu and pick a
        difficulty — Easy, Medium or Hard. The starting numbers are locked givens too, exactly
        like a scanned puzzle.
      </Section>
      <Section title="Fix suspicious cells">
        After scanning, a review screen shows what was read.
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, my: 1 }}>
          <MiniCell bg="warning.main" textColor="warning.contrastText" value={6} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Cells the scanner is unsure about, or values that clash with another cell.
          </Typography>
        </Box>
        Tap any cell to correct or clear it, and check the rest too — a confident scan can still
        be wrong. <strong>Retake</strong> scans again; <strong>Accept</strong> puts the result on
        the board, replacing whatever was there.
      </Section>
      <Section title="Undo and redo">
        Use the arrows in the header, or Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z. Accepting a scan or
        generating a new puzzle sets a new baseline — undo only steps back through edits made
        after that point, not past it.
      </Section>
      <Section title="Solve cell, Hint and Clear all">
        With an empty cell selected, <strong>Solve cell</strong> fills it in when only one value
        can possibly go there. <strong>Hint</strong> finds a solvable cell for you and highlights
        it amber — tap it again (now labeled <strong>Reveal hint</strong>) to fill in its value.
        <strong> Clear all</strong> empties the whole board — undo brings it back.
      </Section>
    </DialogContent>
  </Dialog>
  );
};

export default HelpDialog;
