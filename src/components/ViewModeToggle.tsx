import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';

interface ViewModeToggleProps {
  mode: 'chips' | 'cards';
  onChange: (mode: 'chips' | 'cards') => void;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ mode, onChange }) => {
  return (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      <Tooltip title="Vista de Lista">
        <IconButton
          size="small"
          onClick={() => onChange('chips')}
          sx={{
            color: mode === 'chips' ? 'primary.main' : '#666',
            backgroundColor: mode === 'chips' ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
            padding: '6px',
            '&:hover': {
              backgroundColor: mode === 'chips' ? 'rgba(25, 118, 210, 0.12)' : 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          <ViewListIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Vista de Tarjetas">
        <IconButton
          size="small"
          onClick={() => onChange('cards')}
          sx={{
            color: mode === 'cards' ? 'primary.main' : '#666',
            backgroundColor: mode === 'cards' ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
            padding: '6px',
            '&:hover': {
              backgroundColor: mode === 'cards' ? 'rgba(25, 118, 210, 0.12)' : 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          <ViewModuleIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};
