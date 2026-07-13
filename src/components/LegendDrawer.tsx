import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const landscapeQuery = '@media (max-height: 599.95px) and (orientation: landscape)';

const Swatch = ({ color }: { color: string }) => (
  <Box
    component="span"
    sx={{
      display: 'inline-block',
      width: 14,
      height: 14,
      bgcolor: color,
      borderRadius: 0.5,
      flexShrink: 0,
    }}
  />
);

// Persistent bar, collapsed by default; tap the handle to expand in place.
// Bottom bar in portrait/desktop; right-side vertical strip in mobile landscape
// (bottom space is too tight there — see Layout breakpoints in CLAUDE.md).
const LegendDrawer = () => {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const b = (theme.vars ?? theme).palette.board;

  const items: Array<{ label: string; description: string; color: string }> = [
    { label: 'Conflict', description: 'Same number twice in a row, column or box.', color: b.conflictBorder },
    { label: 'Given', description: 'Filled by a scan — read-only until cleared or rescanned.', color: b.givenBg },
    { label: 'Solvable', description: 'Empty cell with only one number that can go there.', color: b.singleBg },
    { label: 'Hint', description: 'The cell found by Hint.', color: b.hintBorder },
  ];

  return (
    <Box
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: (t) => t.zIndex.appBar,
        bgcolor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
        [landscapeQuery]: {
          left: 'auto',
          top: 0,
          bottom: 0,
          right: 0,
          borderTop: 'none',
          borderLeft: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <Box
        onClick={() => setOpen((o) => !o)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.5,
          py: 0.5,
          cursor: 'pointer',
          userSelect: 'none',
          [landscapeQuery]: { flexDirection: 'column', height: '100%', py: 0, px: 0.5, gap: 0.75 },
        }}
      >
        <Typography
          sx={{
            fontSize: '0.75rem',
            color: 'text.secondary',
            fontWeight: 600,
            [landscapeQuery]: { writingMode: 'vertical-rl', transform: 'rotate(180deg)' },
          }}
        >
          Legend
        </Typography>
        <Box sx={{ display: 'none', [landscapeQuery]: { display: 'block' } }}>
          {open ? (
            <ChevronRightIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          ) : (
            <ChevronLeftIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          )}
        </Box>
        <Box sx={{ display: 'flex', [landscapeQuery]: { display: 'none' } }}>
          {open ? (
            <ExpandMoreIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          ) : (
            <ExpandLessIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          )}
        </Box>
      </Box>
      {open && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1.25,
            px: 2,
            pb: 2,
            [landscapeQuery]: {
              position: 'absolute',
              right: '100%',
              top: 0,
              bottom: 0,
              width: 'max-content',
              maxWidth: '33vw',
              bgcolor: 'background.paper',
              borderLeft: '1px solid',
              borderColor: 'divider',
              overflowY: 'auto',
              justifyContent: 'center',
              px: 2,
              py: 2,
            },
          }}
        >
          {items.map(({ label, description, color }) => (
            <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Swatch color={color} />
              <Typography sx={{ fontSize: '0.85rem' }}>
                <strong>{label}</strong> — <Box component="span" sx={{ color: 'text.secondary' }}>{description}</Box>
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default LegendDrawer;
