import { useState } from 'react';
import type { MouseEvent } from 'react';
import { IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';

interface HeaderMenuProps {
  onClearAll: () => void;
}

const HeaderMenu = ({ onClearAll }: HeaderMenuProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClose = () => setAnchorEl(null);

  const handleClearAll = () => {
    onClearAll();
    handleClose();
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
        <MenuItem onClick={handleClearAll}>Clear all</MenuItem>
      </Menu>
    </>
  );
};

export default HeaderMenu;
