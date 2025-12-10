import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { TimeSlot } from '@/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface TimeSlotPickerProps {
  timeSlots: TimeSlot[];
  onSelect?: (slot: TimeSlot) => void;
}

interface TimeSlotPickerProps {
  timeSlots: TimeSlot[];
  onSelect?: (slot: TimeSlot) => void;
  disabled?: boolean;
}

export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({ timeSlots, onSelect, disabled }) => {
  if (timeSlots.length === 0) {
    return (
      <Box sx={{ mt: 2, p: 2, backgroundColor: '#fff3e0', borderRadius: 2, width: '100%' }}>
        <Typography variant="body2" color="text.secondary">
          No hay horarios disponibles para este servicio.
        </Typography>
      </Box>
    );
  }

  // Group slots by date
  const slotsByDate = timeSlots.reduce((acc, slot) => {
    const date = format(parseISO(slot.start), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>);

  return (
    <Box sx={{ mt: 1.5, mb: 0.5, width: '100%' }}>
      {Object.entries(slotsByDate).map(([date, slots]) => (
        <Box key={date} sx={{ mb: 2 }}>
          <Typography
            variant="subtitle2"
            sx={{
              mb: 1,
              fontWeight: 600,
              fontSize: '12px',
              color: '#666',
              textTransform: 'capitalize',
            }}
          >
            {format(parseISO(slots[0].start), 'EEEE, d MMMM', { locale: es })}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {slots.map((slot, index) => (
              <Button
                key={`${slot.start}-${index}`}
                variant="outlined"
                size="small"
                disabled={disabled}
                onClick={() => !disabled && onSelect?.(slot)}
                sx={{
                  minWidth: '65px',
                  flex: '0 0 auto',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderWidth: '2px',
                  borderColor: '#e0e0e0',
                  color: '#333',
                  backgroundColor: '#fff',
                  transition: 'all 0.2s',
                  opacity: disabled ? 0.6 : 1,
                  '&:hover': {
                    backgroundColor: 'primary.main',
                    color: '#fff',
                    borderColor: 'primary.main',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  },
                }}
              >
                {format(parseISO(slot.start), 'HH:mm')}
              </Button>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
};
