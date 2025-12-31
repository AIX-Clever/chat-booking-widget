import React from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Chip, Avatar, Typography, Badge, Button } from '@mui/material';
import { Provider } from '@/types';

interface ProviderChipsProps {
    providers: Provider[];
    onSelect?: (provider: Provider) => void;
    disabled?: boolean;
}

export const ProviderChips: React.FC<ProviderChipsProps> = ({ providers, onSelect, disabled }) => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1.5, width: '100%' }}>
            {providers.map((provider) => (
                <Box
                    key={provider.id}
                    onClick={() => !disabled && onSelect?.(provider)}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 2,
                        backgroundColor: '#fff',
                        border: '2px solid #e0e0e0',
                        borderRadius: '16px',
                        cursor: disabled ? 'default' : 'pointer',
                        opacity: disabled ? 0.6 : 1,
                        pointerEvents: disabled ? 'none' : 'auto',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                            borderColor: 'primary.main',
                            backgroundColor: 'rgba(25, 118, 210, 0.02)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Badge
                            overlap="circular"
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            variant="dot"
                            sx={{
                                '& .MuiBadge-badge': {
                                    backgroundColor: provider.active ? '#44b700' : '#bdbdbd',
                                    color: provider.active ? '#44b700' : '#bdbdbd',
                                    boxShadow: '0 0 0 2px #fff',
                                    width: 10,
                                    height: 10,
                                    borderRadius: '50%',
                                    '&::after': provider.active ? {
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: '50%',
                                        animation: 'ripple 1.2s infinite ease-in-out',
                                        border: '1px solid currentColor',
                                        content: '""',
                                    } : {},
                                },
                                '@keyframes ripple': {
                                    '0%': { transform: 'scale(.8)', opacity: 1 },
                                    '100%': { transform: 'scale(2.4)', opacity: 0 },
                                },
                            }}
                        >
                            <Avatar
                                sx={{ width: 48, height: 48 }}
                                alt={provider.name}
                                src={undefined} // Todo: support avatar url
                            >
                                {provider.name.charAt(0)}
                            </Avatar>
                        </Badge>
                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '15px' }}>
                                {provider.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: provider.active ? 'success.main' : 'text.secondary', fontWeight: 500 }}>
                                {provider.active ? 'Disponible' : 'No disponible'}
                            </Typography>
                        </Box>
                    </Box>

                    <Button
                        size="small"
                        disabled={disabled}
                        variant="text"
                        sx={{
                            minWidth: 'auto',
                            padding: '4px 8px',
                            color: 'primary.main',
                            fontWeight: 600,
                            textTransform: 'none',
                            display: { xs: 'none', sm: 'block' }
                        }}
                    >
                        Seleccionar
                    </Button>
                </Box>
            ))}
        </Box>
    );
};
