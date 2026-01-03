import React from 'react';
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    Box
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface FAQ {
    question: string;
    answer: string;
}

interface FAQAccordionProps {
    faqs: FAQ[];
    primaryColor?: string;
}

export const FAQAccordion: React.FC<FAQAccordionProps> = ({
    faqs,
    primaryColor = '#1976d2'
}) => {
    const [expanded, setExpanded] = React.useState<string | false>(false);

    const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
        setExpanded(isExpanded ? panel : false);
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Typography
                variant="h6"
                sx={{
                    mb: 2,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}
            >
                📚 Preguntas Frecuentes
            </Typography>

            {faqs.map((faq, index) => (
                <Accordion
                    key={index}
                    expanded={expanded === `panel${index}`}
                    onChange={handleChange(`panel${index}`)}
                    sx={{
                        mb: 1,
                        borderRadius: '8px !important',
                        '&:before': { display: 'none' },
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        '&.Mui-expanded': {
                            boxShadow: `0 2px 8px ${primaryColor}33`,
                        }
                    }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ color: primaryColor }} />}
                        sx={{
                            '&:hover': {
                                backgroundColor: `${primaryColor}08`,
                            },
                            '& .MuiAccordionSummary-content': {
                                margin: '12px 0',
                            }
                        }}
                    >
                        <Typography
                            sx={{
                                fontWeight: 500,
                                color: expanded === `panel${index}` ? primaryColor : 'text.primary'
                            }}
                        >
                            {faq.question}
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails
                        sx={{
                            pt: 0,
                            pb: 2,
                            backgroundColor: `${primaryColor}05`,
                        }}
                    >
                        <Typography
                            sx={{
                                color: 'text.secondary',
                                lineHeight: 1.6,
                                whiteSpace: 'pre-wrap'
                            }}
                        >
                            {faq.answer}
                        </Typography>
                    </AccordionDetails>
                </Accordion>
            ))}
        </Box>
    );
};
