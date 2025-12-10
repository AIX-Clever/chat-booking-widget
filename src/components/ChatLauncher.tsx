import React from 'react';
import { Fab, Zoom, useTheme } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';

interface ChatLauncherProps {
  onClick: () => void;
  position: 'bottom-right' | 'bottom-left';
  primaryColor: string;
  zIndex?: number;
}

export const ChatLauncher: React.FC<ChatLauncherProps> = ({
  onClick,
  position,
  zIndex = 9999,
}) => {
  const theme = useTheme();
  const positionStyle = position === 'bottom-right' ? { right: 24 } : { left: 24 };

  return (
    <Zoom in={true} style={{ transitionDelay: '300ms' }}>
      <Fab
        id="chat-agent-widget-launcher"
        onClick={onClick}
        sx={{
          position: 'fixed',
          bottom: 24,
          ...positionStyle,
          zIndex,
          width: 60,
          height: 60,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: '#fff',
          '&:hover': {
            transform: 'scale(1.05)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
          },
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
        aria-label="chat"
      >
        <ChatIcon fontSize="medium" />
      </Fab>
    </Zoom>
  );
};
