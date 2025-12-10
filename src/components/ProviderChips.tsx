import React from 'react';
import { Box, Chip, Avatar } from '@mui/material';
import { Provider } from '@/types';

interface ProviderChipsProps {
    providers: Provider[];
    onSelect?: (provider: Provider) => void;
    disabled?: boolean;
}

export const ProviderChips: React.FC<ProviderChipsProps> = ({ providers, onSelect, disabled }) => {
    return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            {providers.map((provider) => (
                <Chip
                    key={provider.id}
                    avatar={<Avatar>{provider.name[0]}</Avatar>}
                    label={provider.name}
                    variant="outlined"
                    onClick={() => !disabled && onSelect && onSelect(provider)}
                    sx={{
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        fontWeight: 600,
                        opacity: disabled ? 0.6 : 1,
                        pointerEvents: disabled ? 'none' : 'auto',
                        '&:hover': {
                            backgroundColor: 'primary.light',
                            color: '#fff',
                            borderColor: 'primary.light',
                            '& .MuiChip-avatar': {
                                borderColor: '#fff'
                            }
                        },
                        transition: 'all 0.2s',
                        cursor: disabled ? 'default' : 'pointer'
                    }}
                />
            ))}
        </Box>
    );
};
