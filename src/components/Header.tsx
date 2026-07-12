import { AppBar, Box, Toolbar, Typography } from '@mui/material';
import HeaderMenu from './HeaderMenu';

const landscapeQuery = '@media (max-height: 599.95px) and (orientation: landscape)';

interface HeaderProps {
  onClearAll: () => void;
}

const Header = ({ onClearAll }: HeaderProps) => (
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
        justifyContent: 'flex-end',
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
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          [landscapeQuery]: {
            position: 'static',
            left: 'auto',
            top: 'auto',
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
          [landscapeQuery]: {
            order: 1,
            flexShrink: 0,
          },
        }}
      >
        <HeaderMenu onClearAll={onClearAll} />
      </Box>
    </Toolbar>
  </AppBar>
);

export default Header;
