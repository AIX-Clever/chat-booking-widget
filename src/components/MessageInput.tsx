import React, { useState, KeyboardEvent } from 'react';
import { Box, TextField, IconButton, InputAdornment } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

interface MessageInputProps {
  placeholder?: string;
  disabled?: boolean;
  onSend: (text: string) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  placeholder = 'Escribe tu mensaje...',
  disabled = false,
  onSend,
}) => {
  const [text, setText] = useState('');

  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!disabled && inputRef.current) {
      // Small timeout to ensure DOM is ready and preventing race conditions
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [disabled]);

  const handleSend = () => {
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText('');
      // Keep focus after sending if not immediately disabled
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
      <TextField
        fullWidth
        inputRef={inputRef}
        size="small"
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={disabled}
        multiline
        maxRows={3}
        variant="standard"
        InputProps={{
          disableUnderline: true,
          sx: {
            borderRadius: '18px',
            backgroundColor: 'action.hover',
            fontSize: '0.9rem',
            padding: '10px 16px',
            transition: 'all 0.2s',
            border: '1px solid transparent',
            '&:hover': {
              backgroundColor: 'action.selected',
            },
            '&.Mui-focused': {
              backgroundColor: 'background.paper',
              boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.1)',
              borderColor: 'primary.light'
            }
          }
        }}
      />

      <IconButton
        onClick={handleSend}
        disabled={!text.trim() || disabled}
        size="small"
        sx={{
          width: 42,
          height: 42,
          backgroundColor: text.trim() ? 'primary.main' : 'action.disabledBackground',
          color: '#fff',
          flexShrink: 0,
          transition: 'all 0.2s',
          '&:hover': {
            backgroundColor: 'primary.dark',
            transform: 'scale(1.05)'
          },
          '&.Mui-disabled': {
            color: 'text.disabled'
          }
        }}
      >
        <SendIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};
