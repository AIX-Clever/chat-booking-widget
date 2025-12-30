import React from 'react';
import { Box, Typography, IconButton, Paper, useTheme, Avatar } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MinimizeIcon from '@mui/icons-material/Minimize';
import { useTranslation } from 'react-i18next';
import { Message } from '@/types';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

interface ChatWindowProps {
  isOpen: boolean;
  messages: Message[];
  isLoading: boolean;
  position: 'bottom-right' | 'bottom-left';
  primaryColor: string;
  greetingMessage: string;
  placeholder?: string;
  zIndex?: number;
  onClose: () => void;
  onSendMessage: (text: string) => void;
  onServiceSelect?: (service: any) => void;
  onOptionSelect?: (value: string, label?: string) => void;
  onProviderSelect?: (provider: any) => void;
  onTimeSlotSelect?: (slot: any) => void;
  agentName?: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  isOpen,
  messages,
  isLoading,
  position,
  greetingMessage,
  placeholder,
  zIndex = 9998,
  onClose,
  onSendMessage,
  onServiceSelect,
  onTimeSlotSelect,
  onOptionSelect,
  onProviderSelect,
  agentName = 'Lucia',
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  // Transitions
  // Use simple CSS transition for mounting since we conditionally render null
  // In a real production app we might use <Collapse> or <Zoom> from MUI

  if (!isOpen) return null;

  const positionStyle = position === 'bottom-right' ? { right: 24, bottom: 100 } : { left: 24, bottom: 100 };

  return (
    <Paper
      elevation={8}
      id="chat-agent-widget-window"
      sx={{
        position: 'fixed',
        ...positionStyle,
        zIndex,
        width: '380px',
        maxWidth: 'calc(100vw - 48px)',
        height: '650px',
        maxHeight: 'calc(100vh - 140px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
        border: theme.palette.mode === 'light' ? '1px solid rgba(0,0,0,0.05)' : '1px solid rgba(255,255,255,0.1)',
        animation: 'fadeIn 0.3s ease-out',
        '@keyframes fadeIn': {
          '0%': { opacity: 0, transform: 'translateY(20px) scale(0.95)' },
          '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
      }}
    >
      {/* Header */}
      <Box sx={{
        p: 2,
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 32, height: 32 }}>
            {agentName.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ lineHeight: 1.2 }}>
              {agentName}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.7rem' }}>
              {t('chat.typing')}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex' }}>
          <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', color: '#fff' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Messages */}
      <Box sx={{
        flex: 1,
        overflow: 'hidden',
        position: 'relative',
        bgcolor: theme.palette.background.default,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <MessageList
          messages={messages}
          isLoading={isLoading}
          onServiceSelect={onServiceSelect}
          onTimeSlotSelect={onTimeSlotSelect}
          onOptionSelect={onOptionSelect}
          onProviderSelect={onProviderSelect}
        />
        {/* Shadow Overlay for scroll perception */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '24px',
          background: `linear-gradient(to bottom, ${theme.palette.background.default} 0%, transparent 100%)`,
          zIndex: 1,
          pointerEvents: 'none'
        }} />
      </Box>

      {/* Input */}
      <Box sx={{
        p: 2,
        bgcolor: theme.palette.background.paper,
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>
        <MessageInput
          placeholder={placeholder || t('chat.placeholder')}
          disabled={isLoading}
          onSend={onSendMessage}
        />
        <Typography variant="caption" align="center" display="block" sx={{ mt: 1, color: 'text.disabled', fontSize: '0.65rem' }}>
          Powered by ChatBooking Engine
        </Typography>
      </Box>
    </Paper>
  );
};
