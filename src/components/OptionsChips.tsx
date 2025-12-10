import React from 'react';
import { Box, Chip } from '@mui/material';

interface Option {
    label: string;
    value: string;
}

interface OptionsChipsProps {
    options: Option[];
    onSelect?: (value: string) => void;
    disabled?: boolean;
}

export const OptionsChips: React.FC<OptionsChipsProps> = ({ options, onSelect, disabled }) => {
    return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            {options.map((option) => (
                <Chip
                    key={option.value}
                    label={option.label}
                    onClick={() => !disabled && onSelect && onSelect(option.value)}
                    sx={{
                        backgroundColor: 'secondary.main',
                        color: '#fff',
                        fontWeight: 500,
                        opacity: disabled ? 0.6 : 1,
                        pointerEvents: disabled ? 'none' : 'auto',
                        '&:hover': {
                            backgroundColor: 'secondary.dark',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        },
                        transition: 'all 0.2s',
                        cursor: disabled ? 'default' : 'pointer'
                    }}
                />
            ))}
        </Box>
    );
};
