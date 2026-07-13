import { Box, Dialog, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

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

// Inline swatch matching an in-app cell highlight color
const Swatch = ({ color }: { color: string }) => (
  <Box
    component="span"
    sx={{
      display: 'inline-block',
      width: 12,
      height: 12,
      bgcolor: color,
      borderRadius: 0.5,
      verticalAlign: 'baseline',
      mx: 0.5,
    }}
  />
);

const HelpDialog = ({ open, onClose }: HelpDialogProps) => (
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
        by a scan are read-only — the number pad's <strong>Clear</strong> button dims for them, the
        same as it does for an already-empty cell.
      </Section>
      <Section title="Cell colors">
        A red background
        <Swatch color="rgba(239, 68, 68, 0.6)" />
        marks a conflict: the same number appears twice in a row, column or box. A green
        background
        <Swatch color="rgba(34, 197, 94, 0.6)" />
        marks an empty cell where only one number can go — a good place to play next. An amber
        background
        <Swatch color="rgba(245, 158, 11, 0.6)" />
        marks the cell found by <strong>Hint</strong>. A gray background
        <Swatch color="rgba(148, 163, 184, 0.5)" />
        marks a cell filled by a scan — it's read-only until you clear the board or scan again. The
        <strong> Legend</strong> bar at the bottom of the screen has the full list.
      </Section>
      <Section title="Scan a puzzle">
        Open the menu and choose <strong>Scan puzzle</strong>, then allow camera access. Fill the
        frame with the puzzle and avoid glare. Hold steady — the photo is taken automatically when
        the grid is recognized. Prefer to use an existing photo? Tap the gallery icon in the
        top-left corner instead — it works the same way whether or not the camera is available.
      </Section>
      <Section title="Fix suspicious cells">
        After scanning, a review screen shows what was read. Amber cells
        <Swatch color="warning.main" />
        are ones the scanner is unsure about, or values that clash with another cell. Tap any cell
        to correct or clear it, and check the rest too — a confident scan can still be wrong.
        <strong> Retake</strong> scans again; <strong>Accept</strong> puts the result on the board,
        replacing whatever was there.
      </Section>
      <Section title="Undo and redo">
        Use the arrows in the header, or Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z. Accepting a scan sets a
        new baseline — undo only steps back through edits made after that scan, not past it.
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

export default HelpDialog;
