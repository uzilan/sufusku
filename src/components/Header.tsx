import { AppBar, Toolbar, Typography } from '@mui/material';

const Header = () => (
  <AppBar position="static" elevation={0}>
    <Toolbar variant="dense" sx={{ justifyContent: 'center' }}>
      <Typography
        sx={{
          fontFamily: '"Permanent Marker", cursive',
          fontSize: { xs: '1.5rem', sm: '1.75rem' },
          color: 'secondary.main',
          letterSpacing: '0.02em',
        }}
      >
        Sufusku
      </Typography>
    </Toolbar>
  </AppBar>
);

export default Header;
