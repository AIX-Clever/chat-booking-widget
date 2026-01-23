import React from 'react';
import { Box, Typography, Button, Chip } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

import { Service } from '@/types';

interface ServiceChipsProps {
  services: Service[];
  onSelect?: (service: Service) => void;
  viewMode?: 'chips' | 'cards';
  disabled?: boolean;
}

export const ServiceChips: React.FC<ServiceChipsProps> = ({
  services,
  onSelect,
  viewMode = 'chips',
  disabled
}) => {

  const handleServiceClick = (service: Service) => {
    if (!disabled) {
      onSelect?.(service);
    }
  };

  // Vista de Chips (original)
  if (viewMode === 'chips') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          mt: 1.5,
          mb: 0.5,
          width: '100%',
        }}
      >
        {services.map((service) => (
          <Box
            key={service.id}
            onClick={() => handleServiceClick(service)}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              padding: '12px 14px',
              backgroundColor: '#fff',
              border: '2px solid #e0e0e0',
              borderRadius: '12px',
              cursor: disabled ? 'default' : 'pointer',
              opacity: disabled ? 0.6 : 1,
              pointerEvents: disabled ? 'none' : 'auto',
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: 'primary.main',
                borderColor: 'primary.main',
                transform: 'translateX(4px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                '& *': {
                  color: '#fff !important',
                },
              },
            }}
          >
            <Typography sx={{ fontWeight: 600, fontSize: '14px', color: '#333', marginBottom: '4px' }}>
              {service.name}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontSize: '12px', color: '#666' }}>
                {service.durationMinutes} min
              </Typography>
              {service.price && (
                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: 'primary.main' }}>
                  ${service.price.toLocaleString('es-CL')}
                </Typography>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    );
  }

  // Vista de Cards (nueva - tipo producto)
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        mt: 1.5,
        mb: 0.5,
        width: '100%',
      }}
    >
      {services.map((service) => (
        <Box
          key={service.id}
          onClick={() => handleServiceClick(service)}
          sx={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            padding: '16px',
            backgroundColor: '#fff',
            border: '2px solid #e0e0e0',
            borderRadius: '16px',
            cursor: disabled ? 'default' : 'pointer',
            opacity: disabled ? 0.6 : 1,
            pointerEvents: disabled ? 'none' : 'auto',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            gap: 2,
            '&:hover': {
              borderColor: 'primary.main',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              backgroundColor: 'rgba(25, 118, 210, 0.02)',
            },
          }}
        >
          {/* Sección izquierda: Información */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Categoría si existe */}
            {service.category && (
              <Chip
                label={service.category}
                size="small"
                sx={{
                  height: '20px',
                  fontSize: '10px',
                  fontWeight: 600,
                  mb: 0.5,
                  backgroundColor: 'rgba(25, 118, 210, 0.1)',
                  color: 'primary.main',
                }}
              />
            )}

            {/* Nombre del servicio */}
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: '15px',
                color: '#333',
                marginBottom: '6px',
                lineHeight: 1.3,
              }}
            >
              {service.name}
            </Typography>

            {/* Duración */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTimeIcon sx={{ fontSize: '14px', color: '#666' }} />
              <Typography sx={{ fontSize: '12px', color: '#666' }}>
                {service.durationMinutes} min
              </Typography>
            </Box>
          </Box>

          {/* Sección derecha: Precio y botón */}
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 0.5,
          }}>
            {service.price && (
              <Typography sx={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'primary.main',
                lineHeight: 1,
              }}>
                ${service.price.toLocaleString('es-CL')}
              </Typography>
            )}
            <Button
              size="small"
              variant="text"
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation();
                handleServiceClick(service);
              }}
              sx={{
                fontSize: '11px',
                textTransform: 'none',
                padding: '4px 8px',
                minWidth: 'auto',
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.08)',
                }
              }}
            >
              Seleccionar
            </Button>
          </Box>
        </Box>
      ))}
    </Box>
  );
};
