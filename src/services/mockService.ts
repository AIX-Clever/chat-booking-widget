import {
    SendMessageRequest,
    SendMessageResponse,
    MessageSender,
    ConversationStep,
    Service,
    TimeSlot,
    Booking,
    CreateBookingRequest,
    Provider
} from '../types';
import { MOCK_SERVICES } from '../mocks/data';

// Mock Providers (would be in data.ts usually)
const MOCK_PROVIDERS: Provider[] = [
    { id: 'p1', name: 'Dra. Ana López', bio: 'Especialista en medicina general', timezone: 'America/Santiago', active: true, serviceIds: ['1', '2'] },
    { id: 'p2', name: 'Carlos Ruiz', bio: 'Masajista terapéutico', timezone: 'America/Santiago', active: true, serviceIds: ['1'] },
    { id: 'p3', name: 'Laura M.', bio: 'Instructora de Yoga', timezone: 'America/Santiago', active: true, serviceIds: ['4'] }
];

export class MockChatService {
    private services = MOCK_SERVICES;
    private providers = MOCK_PROVIDERS;

    // Session state simulation (In a real backend this is Redis/DB)
    // We use a simple in-memory map for the mock service instance
    private sessionState: Map<string, any> = new Map();

    async getTenantSettings(tenantId: string) {
        return {
            id: tenantId,
            name: 'Demo Tenant',
            primaryColor: '#e91e63',
            language: 'es',
            greetingMessage: '¡Hola! 👋 Bienvenido a nuestro centro de servicios.'
        };
    }

    async listServices(tenantId: string) {
        return this.services;
    }

    async getAvailability(request: any) {
        // Generate dynamic slots for next 2 days
        const slots = this.generateSlotsForNext2Days(request.serviceId, request.providerId);
        return slots;
    }

    private generateSlotsForNext2Days(serviceId: string, providerId?: string): TimeSlot[] {
        const slots: TimeSlot[] = [];
        const today = new Date();

        // Generate for today and tomorrow (next 2 days logic)
        for (let i = 0; i < 2; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);

            // 4 slots per day
            const hours = [10, 12, 15, 17];

            for (const hour of hours) {
                const start = new Date(date);
                start.setHours(hour, 0, 0, 0);
                // Skip past times for today
                if (i === 0 && start.getTime() < Date.now()) continue;

                const end = new Date(start);
                end.setMinutes(end.getMinutes() + 60); // 1 hour slots default

                slots.push({
                    start: start.toISOString(),
                    end: end.toISOString(),
                    serviceId: serviceId,
                    providerId: providerId || 'p1'
                });
            }
        }
        return slots;
    }

    async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
        await new Promise(resolve => setTimeout(resolve, 600)); // Simulate thinking

        const text = request.text.toLowerCase();
        const currentState = this.sessionState.get(request.conversationId || 'default') || {};

        // --- STATE MACHINE ---

        // 0. Intent Detection (Shortcuts)
        // Check if user is asking for a specific provider or service directly
        const foundProvider = this.providers.find(p => text.includes(p.name.toLowerCase().split(' ')[0].toLowerCase()) || text.includes(p.name.toLowerCase()));
        if (foundProvider) {
            const nextStep = ConversationStep.SERVICE_SELECTION;
            const providerServices = this.services.filter(s => foundProvider.serviceIds.includes(s.id));
            this.sessionState.set(request.conversationId || 'default', { step: nextStep, providerId: foundProvider.id });

            return {
                conversationId: request.conversationId!,
                message: {
                    id: `msg_${Date.now()}`,
                    sender: MessageSender.AGENT,
                    text: `¡Entendido! Veo que buscas atenderte con ${foundProvider.name}.\n\nSelecciona el servicio que necesitas:`,
                    timestamp: new Date().toISOString(),
                    metadata: {
                        type: 'service_chips',
                        services: providerServices
                    }
                },
                nextStep
            };
        }

        // 1. Initial Greeting -> Show Options
        // Only trigger if no specific intent found AND step is empty
        if ((!currentState.step || text === '/start') && (text.includes('hola') || text.length < 5)) {
            const nextStep = ConversationStep.OPTIONS_SELECTION;
            this.sessionState.set(request.conversationId || 'default', { step: nextStep });

            return {
                conversationId: request.conversationId || 'conv_' + Date.now(),
                message: {
                    id: `msg_${Date.now()}`,
                    sender: MessageSender.AGENT,
                    text: '👋 ¡Hola! Un gusto saludarte.\n\nPara ayudarte mejor, cuéntame: ¿Prefieres ver nuestros servicios o buscar un profesional?',
                    timestamp: new Date().toISOString(),
                    metadata: {
                        type: 'options_chips', // Frontend needs to render this
                        options: [
                            { label: 'Ver Servicios', value: 'services' },
                            { label: 'Ver Profesionales', value: 'providers' }
                        ]
                    }
                },
                nextStep
            };
        }

        // 2. Handle Option Selection
        if (currentState.step === ConversationStep.OPTIONS_SELECTION || (!currentState.step && (text.includes('servicio') || text.includes('profesional')))) {
            if (text.includes('profesional') || text.includes('providers')) {
                const nextStep = ConversationStep.PROVIDER_SELECTION;
                this.sessionState.set(request.conversationId || 'default', { step: nextStep });
                return {
                    conversationId: request.conversationId!,
                    message: {
                        id: `msg_${Date.now()}`,
                        sender: MessageSender.AGENT,
                        text: 'Perfecto. Estos son nuestros especialistas disponibles:',
                        timestamp: new Date().toISOString(),
                        metadata: {
                            type: 'provider_chips',
                            providers: this.providers
                        }
                    },
                    nextStep
                };
            } else {
                // Default to services
                const nextStep = ConversationStep.SERVICE_SELECTION;
                this.sessionState.set(request.conversationId || 'default', { step: nextStep });
                return {
                    conversationId: request.conversationId!,
                    message: {
                        id: `msg_${Date.now()}`,
                        sender: MessageSender.AGENT,
                        text: 'Aquí tienes nuestro catálogo de servicios:',
                        timestamp: new Date().toISOString(),
                        metadata: {
                            type: 'service_chips',
                            services: this.services
                        }
                    },
                    nextStep
                };
            }
        }

        // 3. Provider Selected -> Show their Services or Availability
        if (currentState.step === ConversationStep.PROVIDER_SELECTION) {
            // ... (provider logic handled in shortcuts or here)
            // Re-check just in case they typed a name here too
            const provider = this.providers.find(p => text.toLowerCase().includes(p.name.toLowerCase()));
            if (provider) {
                const nextStep = ConversationStep.SERVICE_SELECTION;
                // Filter services for this provider
                const providerServices = this.services.filter(s => provider.serviceIds.includes(s.id));
                this.sessionState.set(request.conversationId || 'default', { step: nextStep, providerId: provider.id });

                return {
                    conversationId: request.conversationId!,
                    message: {
                        id: `msg_${Date.now()}`,
                        sender: MessageSender.AGENT,
                        text: `Excelente, ${provider.name} realiza los siguientes servicios. ¿Cuál prefieres?`,
                        timestamp: new Date().toISOString(),
                        metadata: {
                            type: 'service_chips',
                            services: providerServices
                        }
                    },
                    nextStep
                };
            }
        }

        // 4. Service Selected -> Show Time Slots (Next 2 days)
        if (currentState.step === ConversationStep.SERVICE_SELECTION) {
            const service = this.services.find(s => text.toLowerCase().includes(s.name.toLowerCase()));
            if (service) {
                const nextStep = ConversationStep.TIME_SELECTION;
                const slots = this.generateSlotsForNext2Days(service.id, currentState.providerId);
                this.sessionState.set(request.conversationId || 'default', { ...currentState, step: nextStep, serviceId: service.id });

                return {
                    conversationId: request.conversationId!,
                    message: {
                        id: `msg_${Date.now()}`,
                        sender: MessageSender.AGENT,
                        text: `📅 Aquí tienes la disponibilidad más próxima para ${service.name} (Próximos 2 días):`,
                        timestamp: new Date().toISOString(),
                        metadata: {
                            type: 'time_slots',
                            timeSlots: slots
                        }
                    },
                    nextStep
                };
            }
        }

        // 5. Time Selected -> Start Data Collection (Name)
        if (text.includes('reservar para') || currentState.step === ConversationStep.TIME_SELECTION) {
            const nextStep = ConversationStep.ASK_NAME;
            this.sessionState.set(request.conversationId || 'default', { ...currentState, step: nextStep, selectedTimeText: text });

            return {
                conversationId: request.conversationId!,
                message: {
                    id: `msg_${Date.now()}`,
                    sender: MessageSender.AGENT,
                    text: '¡Excelente elección! 📝 Para coordinar tu reserva, primero necesito tu **nombre** (sin apellidos).',
                    timestamp: new Date().toISOString()
                },
                nextStep
            };
        }

        // 6. Name Provided -> Ask Surname
        if (currentState.step === ConversationStep.ASK_NAME) {
            const nextStep = ConversationStep.ASK_SURNAME;
            this.sessionState.set(request.conversationId || 'default', { ...currentState, step: nextStep, tempName: text });

            return {
                conversationId: request.conversationId!,
                message: {
                    id: `msg_${Date.now()}`,
                    sender: MessageSender.AGENT,
                    text: `Gracias ${text}. ¿Me podrías indicar tus **apellidos**?`,
                    timestamp: new Date().toISOString()
                },
                nextStep
            };
        }

        // 7. Surname Provided -> Ask Email
        if (currentState.step === ConversationStep.ASK_SURNAME) {
            const nextStep = ConversationStep.ASK_EMAIL;
            // Use title case for name/surname properly if possible, but exact text is fine
            const fullName = `${currentState.tempName} ${text}`;
            this.sessionState.set(request.conversationId || 'default', { ...currentState, step: nextStep, tempSurname: text, tempFullName: fullName });

            return {
                conversationId: request.conversationId!,
                message: {
                    id: `msg_${Date.now()}`,
                    sender: MessageSender.AGENT,
                    text: 'Perfecto. ¿A qué **correo electrónico** te enviamos la confirmación?',
                    timestamp: new Date().toISOString()
                },
                nextStep
            };
        }

        // 8. Email Provided -> Ask Phone
        if (currentState.step === ConversationStep.ASK_EMAIL) {
            const nextStep = ConversationStep.ASK_PHONE;
            this.sessionState.set(request.conversationId || 'default', { ...currentState, step: nextStep, tempEmail: text });

            return {
                conversationId: request.conversationId!,
                message: {
                    id: `msg_${Date.now()}`,
                    sender: MessageSender.AGENT,
                    text: 'Anotado. Por último, ¿me indicas un número de **teléfono** de contacto?',
                    timestamp: new Date().toISOString()
                },
                nextStep
            };
        }

        // 9. Phone Provided -> Confirm Details
        if (currentState.step === ConversationStep.ASK_PHONE) {
            const nextStep = ConversationStep.CONFIRM_DETAILS;
            this.sessionState.set(request.conversationId || 'default', { ...currentState, step: nextStep, tempPhone: text });

            return {
                conversationId: request.conversationId!,
                message: {
                    id: `msg_${Date.now()}`,
                    sender: MessageSender.AGENT,
                    text: `¡Gracias! Por favor confirma si estos datos son correctos:\n\n👤 **Nombre:** ${currentState.tempFullName}\n📧 **Email:** ${currentState.tempEmail}\n📱 **Teléfono:** ${text}\n\n¿Procedemos con la reserva?`,
                    timestamp: new Date().toISOString(),
                    metadata: {
                        type: 'options_chips',
                        options: [
                            { label: 'Sí, confirmar', value: 'confirm' },
                            { label: 'Corregir', value: 'retry' }
                        ]
                    }
                },
                nextStep
            };
        }

        // 10. Confirmation
        if (currentState.step === ConversationStep.CONFIRM_DETAILS) {
            const lowerText = text.toLowerCase().trim();
            const isConfirmation =
                lowerText === 'confirm' ||
                lowerText === 'sí, confirmar' ||
                lowerText === 'sí' ||
                lowerText === 'si' ||
                lowerText === 'yes' ||
                lowerText === 'ok';

            if (isConfirmation) {
                const nextStep = ConversationStep.CONFIRMATION;
                this.sessionState.set(request.conversationId || 'default', { ...currentState, step: nextStep });

                return {
                    conversationId: request.conversationId!,
                    message: {
                        id: `msg_${Date.now()}`,
                        sender: MessageSender.AGENT,
                        text: '¡Reserva confirmada con éxito! 🎉 \n\nTe hemos enviado un correo con todos los detalles de tu cita.',
                        timestamp: new Date().toISOString(),
                        metadata: {
                            type: 'booking_confirmation'
                        }
                    },
                    nextStep
                };
            } else {
                // Retry flow - Restart from Name
                const nextStep = ConversationStep.ASK_NAME;
                this.sessionState.set(request.conversationId || 'default', { ...currentState, step: nextStep });
                return {
                    conversationId: request.conversationId!,
                    message: {
                        id: `msg_${Date.now()}`,
                        sender: MessageSender.AGENT,
                        text: 'Entendido. Comencemos de nuevo para corregir los datos.\n\n¿Cuál es tu **nombre**?',
                        timestamp: new Date().toISOString()
                    },
                    nextStep
                };
            }
        }

        // Fallback
        return {
            conversationId: request.conversationId!,
            message: {
                id: `msg_${Date.now()}`,
                sender: MessageSender.AGENT,
                text: 'Disculpa, no entendí. Por favor selecciona una de las opciones disponibles.',
                timestamp: new Date().toISOString()
            },
            nextStep: currentState.step || ConversationStep.GREETING
        };
    }

    async createBooking(request: CreateBookingRequest): Promise<Booking> {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
            id: `booking_${Date.now()}`,
            tenantId: request.tenantId,
            serviceId: request.serviceId,
            providerId: request.providerId || 'p1',
            start: request.start,
            end: request.end,
            status: 'CONFIRMED' as any,
            paymentStatus: 'PAID' as any,
            service: this.services.find(s => s.id === request.serviceId)!,
            provider: { id: 'p1', name: 'Profesional Demo', timezone: 'America/Santiago', active: true, serviceIds: [] },
            createdAt: new Date().toISOString(),
            customerName: request.customerName,
            customerEmail: request.customerEmail
        };
    }
}

export const mockService = new MockChatService();
