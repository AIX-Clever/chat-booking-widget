import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Typography, CircularProgress, useTheme } from '@mui/material';
import { Message, MessageSender, Provider } from '@/types';
import { ServiceChips } from './ServiceChips';
import { TimeSlotPicker } from './TimeSlotPicker';

import { OptionsChips } from './OptionsChips';
import { ProviderChips } from './ProviderChips';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  onServiceSelect?: (service: any) => void;
  onTimeSlotSelect?: (slot: any) => void;
  onOptionSelect?: (value: string, label?: string) => void;
  onProviderSelect?: (provider: Provider) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  onServiceSelect,
  onTimeSlotSelect,
  onOptionSelect,
  onProviderSelect
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    // Messages container
    <Box sx={{
      flex: 1,
      overflowY: 'auto',
      overflowX: 'hidden',
      p: 2,
      display: 'flex',
      flexDirection: 'column',
      gap: 1
    }}>
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          viewMode="cards"
          onServiceSelect={onServiceSelect}
          onTimeSlotSelect={onTimeSlotSelect}
          onOptionSelect={onOptionSelect}
          onProviderSelect={onProviderSelect}
          isLoading={isLoading}
        />
      ))}

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', ml: 2, my: 1 }}>
          <TypingIndicator />
        </Box>
      )}

      <div ref={messagesEndRef} />
    </Box>
  );
};

const TypingIndicator = () => (
  <Box sx={{ display: 'flex', gap: 0.5, p: 1.5, bgcolor: '#f5f5f5', borderRadius: '16px 16px 16px 0', width: 'fit-content' }}>
    <Box sx={{ width: 6, height: 6, bgcolor: '#999', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both' }} />
    <Box sx={{ width: 6, height: 6, bgcolor: '#999', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.16s' }} />
    <Box sx={{ width: 6, height: 6, bgcolor: '#999', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.32s' }} />

    <style>
      {`
            @keyframes bounce {
              0%, 80%, 100% { transform: scale(0); }
              40% { transform: scale(1); }
            }
            `}
    </style>
  </Box>
);

interface MessageBubbleProps {
  message: Message;
  viewMode: 'chips' | 'cards';
  onServiceSelect?: (service: any) => void;
  onOptionSelect?: (value: string, label?: string) => void;
  onProviderSelect?: (provider: Provider) => void;
  onTimeSlotSelect?: (slot: any) => void;
  isLoading?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  viewMode,
  onServiceSelect,
  onOptionSelect,
  onProviderSelect,
  onTimeSlotSelect,
  isLoading
}) => {
  const isUser = message.sender === MessageSender.USER;
  const isSystem = message.sender === MessageSender.SYSTEM;

  if (isSystem) {
    return (
      <Box sx={{ my: 1, alignSelf: 'center', width: '100%' }}>
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: 'text.secondary', mb: 0.5 }}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Typography>
        <Box
          sx={{
            p: 1.5,
            bgcolor: 'action.hover',
            borderRadius: 2,
            textAlign: 'center',
            maxWidth: '90%',
            mx: 'auto',
            border: '1px dashed',
            borderColor: 'divider'
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
            {message.text}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      width: '100%',
      my: 0.5,
    }}>
      <Box
        sx={{
          p: '10px 14px',
          bgcolor: isUser ? 'primary.main' : 'background.paper',
          color: isUser ? 'primary.contrastText' : 'text.primary',
          borderRadius: isUser ? '16px 16px 0 16px' : '16px 16px 16px 0',
          boxShadow: isUser ? '0 2px 8px rgba(0,0,0,0.1)' : '0 2px 5px rgba(0,0,0,0.05)',
          maxWidth: '85%',
          wordBreak: 'break-word',
          border: isUser ? 'none' : '1px solid',
          borderColor: isUser ? 'transparent' : 'divider'
        }}
      >
        <Typography variant="body2" sx={{ lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
          {message.text.split(/(\*\*.*?\*\*)/g).map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <Box component="span" sx={{ fontWeight: 600 }} key={index} >
                  {part.slice(2, -2)}
                </Box>
              );
            }
            return part;
          })}
        </Typography>
      </Box>

      {/* Metadata Components */}
      {message.metadata?.type === 'options_chips' && message.metadata.options && (
        <Box sx={{ width: '100%', mt: 0.5 }}>
          <OptionsChips
            options={message.metadata.options}
            onSelect={onOptionSelect}
            disabled={isLoading}
          />
        </Box>
      )}

      {/* Handle confirmation type which uses 'actions' instead of 'options' */}
      {(message.metadata?.type === 'confirmation' || message.metadata?.actions) && (
        <Box sx={{ width: '100%', mt: 0.5 }}>
          <OptionsChips
            options={message.metadata.actions || []}
            onSelect={onOptionSelect}
            disabled={isLoading}
          />
        </Box>
      )}

      {message.metadata?.type === 'provider_chips' && message.metadata.providers && (
        <Box sx={{ width: '100%', mt: 0.5 }}>
          <ProviderChips
            providers={message.metadata.providers}
            onSelect={onProviderSelect}
            disabled={isLoading}
          />
        </Box>
      )}

      {message.metadata?.type === 'service_chips' && message.metadata.services && (
        <Box sx={{ width: '100%', mt: 1 }}>
          <ServiceChips
            services={message.metadata.services}
            onSelect={onServiceSelect}
            viewMode={viewMode}
            disabled={isLoading}
          />
        </Box>
      )}

      {message.metadata?.type === 'time_slots' && message.metadata.timeSlots && (
        <Box sx={{ width: '100%', mt: 1 }}>
          <TimeSlotPicker
            timeSlots={message.metadata.timeSlots}
            onSelect={onTimeSlotSelect}
            disabled={isLoading}
          />
        </Box>
      )}
    </Box>
  );
};
