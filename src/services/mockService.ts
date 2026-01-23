import {
    SendMessageRequest,
    SendMessageResponse,
    MessageSender,
    ConversationStep,
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async listServices(_tenantId: string) {
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async startConversation(_channel?: string, _metadata?: any): Promise<SendMessageResponse> {
        const conversationId = `mock_conv_${Date.now()}`;
        this.sessionState.set(conversationId, { step: ConversationStep.GREETING });

        return {
            conversation: {
                conversationId,
                state: ConversationStep.GREETING,
                context: {}
            },
            response: {
                text: '¡Hola! 👋 Bienvenido a nuestro sistema de reservas demo. ¿En qué puedo ayudarte hoy?',
                type: 'text',
                options: [
                    { label: 'Ver Servicios', value: 'services' },
                    { label: 'Ver Profesionales', value: 'providers' }
                ],
                metadata: { sender: MessageSender.AGENT }
            }
        };
    }

    async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
        await new Promise(resolve => setTimeout(resolve, 600)); // Simulate thinking

        const text = request.text.toLowerCase();
        const conversationId = request.conversationId || 'default';
        const currentState = this.sessionState.get(conversationId) || {};

        // Helper to format response
        const buildResponse = (
            step: ConversationStep,
            msgText: string,
            options?: any[],
            slots?: any[],
            metadata: any = {}
        ): SendMessageResponse => {
            return {
                conversation: {
                    conversationId,
                    state: step,
                    context: {}
                },
                response: {
                    text: msgText,
                    type: slots ? 'calendar' : (options ? 'options' : 'text'),
                    options: options,
                    slots: slots,
                    metadata: { ...metadata, sender: MessageSender.AGENT }
                }
            };
        };

        // --- STATE MACHINE ---

        // 0. Intent Detection (Shortcuts)
        const foundProvider = this.providers.find(p => text.includes(p.name.toLowerCase().split(' ')[0].toLowerCase()) || text.includes(p.name.toLowerCase()));
        if (foundProvider) {
            const nextStep = ConversationStep.SERVICE_SELECTION;
            const providerServices = this.services.filter(s => foundProvider.serviceIds.includes(s.id));
            this.sessionState.set(conversationId, { step: nextStep, providerId: foundProvider.id });

            return buildResponse(
                nextStep,
                `¡Entendido! Veo que buscas atenderte con ${foundProvider.name}.\n\nSelecciona el servicio que necesitas:`,
                providerServices.map(s => ({ label: s.name, value: s.id, description: s.description }))
            );
        }

        // 1. Initial Greeting -> Show Options
        if ((!currentState.step || currentState.step === ConversationStep.GREETING || text === '/start') && (text.includes('hola') || text.length < 5)) {
            const nextStep = ConversationStep.OPTIONS_SELECTION;
            this.sessionState.set(conversationId, { step: nextStep });

            return buildResponse(
                nextStep,
                '👋 ¡Hola! Un gusto saludarte.\n\nPara ayudarte mejor, cuéntame: ¿Prefieres ver nuestros servicios o buscar un profesional?',
                [
                    { label: 'Ver Servicios', value: 'services' },
                    { label: 'Ver Profesionales', value: 'providers' }
                ]
            );
        }

        // 2. Handle Option Selection
        if (currentState.step === ConversationStep.OPTIONS_SELECTION || (!currentState.step && (text.includes('servicio') || text.includes('profesional')))) {
            if (text.includes('profesional') || text.includes('providers')) {
                const nextStep = ConversationStep.PROVIDER_SELECTION;
                this.sessionState.set(conversationId, { step: nextStep });
                return buildResponse(
                    nextStep,
                    'Perfecto. Estos son nuestros especialistas disponibles:',
                    this.providers.map(p => ({ label: p.name, value: p.id, description: p.bio }))
                );
            } else {
                // Default to services
                const nextStep = ConversationStep.SERVICE_SELECTION;
                this.sessionState.set(conversationId, { step: nextStep });
                return buildResponse(
                    nextStep,
                    'Aquí tienes nuestro catálogo de servicios:',
                    this.services.map(s => ({ label: s.name, value: s.id, description: s.description }))
                );
            }
        }

        // 3. Provider Selected -> Show their Services
        if (currentState.step === ConversationStep.PROVIDER_SELECTION) {
            const provider = this.providers.find(p => p.id === text || text.toLowerCase().includes(p.name.toLowerCase()));
            if (provider) {
                const nextStep = ConversationStep.SERVICE_SELECTION;
                const providerServices = this.services.filter(s => provider.serviceIds.includes(s.id));
                this.sessionState.set(conversationId, { step: nextStep, providerId: provider.id });

                return buildResponse(
                    nextStep,
                    `Excelente, ${provider.name} realiza los siguientes servicios. ¿Cuál prefieres?`,
                    providerServices.map(s => ({ label: s.name, value: s.id, description: s.description }))
                );
            }
        }

        // 4. Service Selected -> Show Time Slots (Next 2 days)
        if (currentState.step === ConversationStep.SERVICE_SELECTION) {
            const service = this.services.find(s => s.id === text || text.toLowerCase().includes(s.name.toLowerCase()));
            if (service) {
                const nextStep = ConversationStep.TIME_SELECTION;
                const slots = this.generateSlotsForNext2Days(service.id, currentState.providerId);
                this.sessionState.set(conversationId, { ...currentState, step: nextStep, serviceId: service.id });

                return buildResponse(
                    nextStep,
                    `📅 Aquí tienes la disponibilidad más próxima para ${service.name} (Próximos 2 días):`,
                    undefined,
                    slots
                );
            }
        }

        // 5. Time Selected -> Start Data Collection (Name)
        if (text.includes('reservar para') || currentState.step === ConversationStep.TIME_SELECTION) {
            const nextStep = ConversationStep.ASK_NAME;
            this.sessionState.set(conversationId, { ...currentState, step: nextStep, selectedTimeText: text });
            return buildResponse(nextStep, '¡Excelente elección! 📝 Para coordinar tu reserva, primero necesito tu **nombre** (sin apellidos).');
        }

        // 6. Name Provided -> Ask Surname
        if (currentState.step === ConversationStep.ASK_NAME) {
            const nextStep = ConversationStep.ASK_SURNAME;
            this.sessionState.set(conversationId, { ...currentState, step: nextStep, tempName: text });
            return buildResponse(nextStep, `Gracias ${text}. ¿Me podrías indicar tus **apellidos**?`);
        }

        // 7. Surname Provided -> Ask Email
        if (currentState.step === ConversationStep.ASK_SURNAME) {
            const nextStep = ConversationStep.ASK_EMAIL;
            const fullName = `${currentState.tempName} ${text}`;
            this.sessionState.set(conversationId, { ...currentState, step: nextStep, tempSurname: text, tempFullName: fullName });
            return buildResponse(nextStep, 'Perfecto. ¿A qué **correo electrónico** te enviamos la confirmación?');
        }

        // 8. Email Provided -> Ask Phone
        if (currentState.step === ConversationStep.ASK_EMAIL) {
            const nextStep = ConversationStep.ASK_PHONE;
            this.sessionState.set(conversationId, { ...currentState, step: nextStep, tempEmail: text });
            return buildResponse(nextStep, 'Anotado. Por último, ¿me indicas un número de **teléfono** de contacto?');
        }

        // 9. Phone Provided -> Confirm Details
        if (currentState.step === ConversationStep.ASK_PHONE) {
            const nextStep = ConversationStep.CONFIRM_DETAILS;
            this.sessionState.set(conversationId, { ...currentState, step: nextStep, tempPhone: text });

            return buildResponse(
                nextStep,
                `¡Gracias! Por favor confirma si estos datos son correctos:\n\n👤 **Nombre:** ${currentState.tempFullName}\n📧 **Email:** ${currentState.tempEmail}\n📱 **Teléfono:** ${text}\n\n¿Procedemos con la reserva?`,
                [{ label: 'Sí, confirmar', value: 'confirm' }, { label: 'Corregir', value: 'retry' }]
            );
        }

        // 10. Confirmation
        if (currentState.step === ConversationStep.CONFIRM_DETAILS) {
            const lowerText = text.toLowerCase().trim();
            const isConfirmation = ['confirm', 'sí, confirmar', 'sí', 'si', 'yes', 'ok'].includes(lowerText);

            if (isConfirmation) {
                const nextStep = ConversationStep.CONFIRMATION;
                this.sessionState.set(conversationId, { ...currentState, step: nextStep });
                return buildResponse(
                    nextStep,
                    '¡Reserva confirmada con éxito! 🎉 \n\nTe hemos enviado un correo con todos los detalles de tu cita.',
                    undefined,
                    undefined,
                    { type: 'booking_confirmation' }
                );
            } else {
                const nextStep = ConversationStep.ASK_NAME;
                this.sessionState.set(conversationId, { ...currentState, step: nextStep });
                return buildResponse(nextStep, 'Entendido. Comencemos de nuevo para corregir los datos.\n\n¿Cuál es tu **nombre**?');
            }
        }

        // Fallback
        return buildResponse(
            currentState.step || ConversationStep.GREETING,
            'Disculpa, no entendí. Por favor selecciona una de las opciones disponibles.'
        );
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

    async confirmBookingFromConversation(request: any): Promise<any> {
        await new Promise(resolve => setTimeout(resolve, 800));

        const conversationId = request.conversationId || 'default';
        const currentState = this.sessionState.get(conversationId) || {};

        this.sessionState.set(conversationId, { ...currentState, step: ConversationStep.CONFIRMATION });

        return {
            conversation: {
                conversationId: conversationId,
                state: ConversationStep.CONFIRMATION,
                context: {}
            },
            response: {
                text: '¡Reserva confirmada con éxito! 🎉 \n\nTe hemos enviado un correo con todos los detalles de tu cita.',
                metadata: {
                    type: 'booking_confirmation'
                }
            }
        };
    }
}

export const mockService = new MockChatService();
