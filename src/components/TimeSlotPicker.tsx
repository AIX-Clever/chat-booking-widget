import React, { useMemo } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { TimeSlot } from '@/types';
import { format, parseISO, getHours } from 'date-fns';
import { es } from 'date-fns/locale';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import WbTwilightIcon from '@mui/icons-material/WbTwilight';
import NightsStayIcon from '@mui/icons-material/NightsStay';

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

  // 1. Group slots by date first
  const slotsByDate = useMemo(() => {
    return timeSlots.reduce((acc, slot) => {
      const dateKey = format(parseISO(slot.start), 'yyyy-MM-dd');
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(slot);
      return acc;
    }, {} as Record<string, TimeSlot[]>);
  }, [timeSlots]);

  // Helper to segment times within a day
  const getDaySegments = (slots: TimeSlot[]) => {
    const morning: TimeSlot[] = [];
    const afternoon: TimeSlot[] = [];
    const evening: TimeSlot[] = [];

    slots.forEach(slot => {
      const hour = getHours(parseISO(slot.start));
      if (hour < 12) {
        morning.push(slot);
      } else if (hour < 17) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    });

    return { morning, afternoon, evening };
  };

  return (
    <Box sx={{ mt: 1.5, mb: 0.5, width: '100%' }}>
      {Object.entries(slotsByDate).map(([date, daySlots]) => {
        const { morning, afternoon, evening } = getDaySegments(daySlots);
        const dayLabel = format(parseISO(daySlots[0].start), 'EEEE, d MMMM', { locale: es });

        return (
          <Box key={date} sx={{ mb: 3 }}>
            {/* Header del Día */}
            <Typography
              variant="subtitle2"
              sx={{
                mb: 1.5,
                fontWeight: 700,
                fontSize: '13px',
                color: '#333',
                textTransform: 'capitalize',
                borderBottom: '1px solid #eee',
                pb: 0.5
              }}
            >
              {dayLabel}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

              {/* Mañana */}
              {morning.length > 0 && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 0.5 }}>
                    <WbSunnyIcon sx={{ fontSize: 16, color: '#fbc02d' }} />
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#666' }}>Mañana</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {morning.map((slot, i) => <SlotButton key={i} slot={slot} onSelect={onSelect} disabled={disabled} />)}
                  </Box>
                </Box>
              )}

              {/* Tarde */}
              {afternoon.length > 0 && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 0.5 }}>
                    <WbTwilightIcon sx={{ fontSize: 16, color: '#ff9800' }} />
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#666' }}>Tarde</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {afternoon.map((slot, i) => <SlotButton key={i} slot={slot} onSelect={onSelect} disabled={disabled} />)}
                  </Box>
                </Box>
              )}

              {/* Noche */}
              {evening.length > 0 && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 0.5 }}>
                    <NightsStayIcon sx={{ fontSize: 16, color: '#3f51b5' }} />
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#666' }}>Noche</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {evening.map((slot, i) => <SlotButton key={i} slot={slot} onSelect={onSelect} disabled={disabled} />)}
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

const SlotButton: React.FC<{ slot: TimeSlot, onSelect?: (s: TimeSlot) => void, disabled?: boolean }> = ({ slot, onSelect, disabled }) => (
  <Button
    variant="outlined"
    size="small"
    disabled={disabled}
    onClick={() => !disabled && onSelect?.(slot)}
    sx={{
      minWidth: '70px',
      borderRadius: '8px',
      padding: '4px 10px',
      fontSize: '13px',
      fontWeight: 500,
      border: '1px solid #e0e0e0',
      color: '#444',
      backgroundColor: '#fff',
      textTransform: 'none',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      '&:hover': {
        backgroundColor: 'primary.main',
        color: '#fff',
        borderColor: 'primary.main',
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      },
    }}
  >
    {format(parseISO(slot.start), 'HH:mm')}
  </Button>
);
