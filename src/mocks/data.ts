import { Service, TimeSlot } from '../types';

export const MOCK_SERVICES: Service[] = [
    { id: '1', name: 'Masaje Relajante', description: '60 minutos de relajación', durationMinutes: 60, price: 45000, active: true },
    { id: '2', name: 'Consulta Dermatológica', description: 'Evaluación con especialista', durationMinutes: 30, price: 35000, active: true },
    { id: '3', name: 'Limpieza Facial', description: 'Tratamiento facial completo', durationMinutes: 45, price: 28000, active: true },
    { id: '4', name: 'Yoga Personal', description: 'Sesión personalizada 1:1', durationMinutes: 60, price: 32000, active: true },
];

export const MOCK_TIME_SLOTS: TimeSlot[] = [
    { start: '2025-12-04T09:00:00Z', end: '2025-12-04T10:00:00Z', providerId: 'p1', serviceId: '1' },
    { start: '2025-12-04T10:30:00Z', end: '2025-12-04T11:30:00Z', providerId: 'p1', serviceId: '1' },
    { start: '2025-12-04T14:00:00Z', end: '2025-12-04T15:00:00Z', providerId: 'p1', serviceId: '1' },
    { start: '2025-12-04T16:00:00Z', end: '2025-12-04T17:00:00Z', providerId: 'p1', serviceId: '1' },
    { start: '2025-12-05T09:00:00Z', end: '2025-12-05T10:00:00Z', providerId: 'p1', serviceId: '1' },
    { start: '2025-12-05T11:00:00Z', end: '2025-12-05T12:00:00Z', providerId: 'p1', serviceId: '1' },
];
