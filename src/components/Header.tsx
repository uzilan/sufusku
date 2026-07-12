import { AppBar, Toolbar, Typography } from '@mui/material';

const landscapeQuery = '@media (max-height: 599.95px) and (orientation: landscape)';

const Header = () => (
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
        justifyContent: 'center',
        [landscapeQuery]: {
          height: '100%',
          minHeight: 'auto',
          px: 0,
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
          },
        }}
      >
        Sufusku
      </Typography>
    </Toolbar>
  </AppBar>
);

export default Header;
