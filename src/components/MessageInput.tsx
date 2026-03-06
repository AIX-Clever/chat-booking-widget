import React, { useState, KeyboardEvent, useMemo } from 'react';
import { Box, TextField, IconButton, Chip, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const EMAIL_DOMAINS = ['@gmail.com', '@hotmail.com', '@outlook.com', '@yahoo.com', '@icloud.com'];

interface MessageInputProps {
  placeholder?: string;
  disabled?: boolean;
  showEmailChips?: boolean;
  onSend: (text: string) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  placeholder = 'Escribe tu mensaje...',
  disabled = false,
  onSend,
}) => {
  const [text, setText] = useState('');

  const inputRef = React.useRef<HTMLInputElement>(null);

  // Detect if the user is typing something that looks like an email (has chars but no @)
  const isTypingEmail = showEmailChips && text.length > 0 && !text.includes('@');

  const emailSuggestions = useMemo(() => {
    if (!isTypingEmail) return [];
    return EMAIL_DOMAINS.map(domain => `${text}${domain}`);
  }, [isTypingEmail, text]);

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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      {/* Contextual email chip suggestions */}
      {emailSuggestions.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, pb: 0.5 }}>
          {emailSuggestions.map(suggestion => (
            <Chip
              key={suggestion}
              label={<><Typography component="span" variant="caption" sx={{ fontWeight: 600 }}>{text}</Typography><Typography component="span" variant="caption" sx={{ opacity: 0.7 }}>{suggestion.substring(text.length)}</Typography></>}
              size="small"
              variant="outlined"
              onClick={() => { onSend(suggestion); setText(''); }}
              sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'primary.50', borderColor: 'primary.main' }, transition: 'all 0.15s' }}
            />
          ))}
        </Box>
      )}
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
    </Box>
  );
};
