import { useState, useCallback } from 'react';
import {
  WidgetConfig,
  WidgetState,
  ConversationStep,
  Message,
  MessageSender,
  Service,
  Provider,
  TimeSlot,
  Booking,
} from '@/types';
import * as realApi from '@/graphql/api';
import { mockService } from '@/services/mockService';

export function useChat(config: WidgetConfig) {
  const [state, setState] = useState<WidgetState>({
    isOpen: config.autoOpen || false,
    isInitialized: false,
    currentStep: ConversationStep.GREETING,
    messages: [],
    availableServices: [],
    availableProviders: [],
    availableTimeSlots: [],
    isLoading: false,
  });

  // Select API provider
  // Cast to any to avoid strict structural matching issues between Module and Class for now
  const api = (config.useMocks || config.debug ? mockService : realApi) as any;

  const addMessage = useCallback((text: string, sender: MessageSender, metadata?: any) => {
    const message: Message = {
      id: `msg_${Date.now()}_${Math.random()}`,
      sender,
      text,
      timestamp: new Date().toISOString(),
      metadata,
    };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));

    return message;
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      try {
        setState((prev) => ({ ...prev, isLoading: true }));

        // Add user message
        addMessage(text, MessageSender.USER);

        // Send to backend
        const response = await api.sendMessage({
          tenantId: config.tenantId,
          conversationId: state.conversationId,
          text,
          userContext: config.userContext,
        });

        // Add agent response
        addMessage(response.message.text, MessageSender.AGENT, response.message.metadata);

        // Update state with conversation data
        setState((prev) => ({
          ...prev,
          conversationId: response.conversationId,
          currentStep: response.nextStep,
          // Reset options if not provided in the new response to avoid stale buttons
          availableServices: response.options?.services || [],
          availableProviders: response.options?.providers || [],
          availableTimeSlots: response.options?.timeSlots || [],
          isLoading: false,
        }));

        return response;
      } catch (error: any) {
        console.error('Error sending message:', error);
        addMessage(
          config.messages?.errorConnection || 'Error de conexión. Por favor, intenta de nuevo.',
          MessageSender.SYSTEM
        );
        setState((prev) => ({ ...prev, isLoading: false }));
        config.onError?.({
          code: 'SEND_MESSAGE_ERROR',
          message: error.message,
          details: error,
        });
      }
    },
    [config, state.conversationId, addMessage]
  );

  const selectService = useCallback(
    async (service: Service) => {
      await sendMessage(`Selecciono: ${service.name}`);
      setState((prev) => ({ ...prev, selectedService: service }));
    },
    [sendMessage]
  );

  const selectProvider = useCallback(
    async (provider: Provider) => {
      await sendMessage(`Prefiero con: ${provider.name}`);
      setState((prev) => ({ ...prev, selectedProvider: provider }));
    },
    [sendMessage]
  );

  const selectTimeSlot = useCallback(
    async (slot: TimeSlot) => {
      const formattedTime = new Date(slot.start).toLocaleString('es-CL');
      await sendMessage(`Reservo para: ${formattedTime}`);
      setState((prev) => ({ ...prev, selectedTimeSlot: slot }));
    },
    [sendMessage]
  );

  const createBooking = useCallback(
    async (customerName: string, customerEmail: string, customerPhone?: string) => {
      try {
        if (!state.selectedService || !state.selectedProvider || !state.selectedTimeSlot) {
          throw new Error('Missing required booking information');
        }

        setState((prev) => ({ ...prev, isLoading: true }));

        const booking = await api.createBooking({
          tenantId: config.tenantId,
          conversationId: state.conversationId!,
          serviceId: state.selectedService.id,
          providerId: state.selectedProvider.id,
          start: state.selectedTimeSlot.start,
          end: state.selectedTimeSlot.end,
          customerName,
          customerEmail,
          customerPhone,
        });

        addMessage(
          config.messages?.bookingSuccess ||
          '✅ ¡Reserva confirmada! Te enviamos un email de confirmación.',
          MessageSender.SYSTEM,
          { type: 'booking_confirmation', booking }
        );

        setState((prev) => ({
          ...prev,
          currentStep: ConversationStep.COMPLETED,
          isLoading: false,
        }));

        config.onBookingCreated?.(booking);

        return booking;
      } catch (error: any) {
        console.error('Error creating booking:', error);
        addMessage(
          config.messages?.bookingError || 'Error al crear la reserva. Por favor, intenta de nuevo.',
          MessageSender.SYSTEM
        );
        setState((prev) => ({ ...prev, isLoading: false }));
        config.onError?.({
          code: 'CREATE_BOOKING_ERROR',
          message: error.message,
          details: error,
        });
      }
    },
    [config, state, addMessage]
  );

  const initialize = useCallback(async () => {
    try {
      // Load tenant settings
      const settings = await api.getTenantSettings(config.tenantId);

      // Load services
      const services = await api.listServices(config.tenantId);

      // Add greeting message
      addMessage(
        config.greetingMessage || settings.greetingMessage || '¡Hola! 👋 ¿En qué puedo ayudarte?',
        MessageSender.AGENT
      );

      setState((prev) => ({
        ...prev,
        isInitialized: true,
        availableServices: services.filter((s: Service) => s.active),
      }));

      config.onReady?.();
    } catch (error: any) {
      console.warn('[Chat] Backend not available, using fallback initialization:', error);

      // Initialize with defaults even if backend fails
      addMessage(
        config.greetingMessage || '¡Hola! 👋 ¿En qué puedo ayudarte?',
        MessageSender.AGENT
      );

      setState((prev) => ({
        ...prev,
        isInitialized: true,
      }));

      config.onReady?.();

      // Still notify about the error
      config.onError?.({
        code: 'INIT_ERROR',
        message: 'Backend not available - running in offline mode',
        details: error,
      });
    }
  }, [config, addMessage]);

  const open = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: true }));
    config.onOpen?.();
  }, [config]);

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
    config.onClose?.();
  }, [config]);

  const toggle = useCallback(() => {
    setState((prev) => {
      const willOpen = !prev.isOpen;
      if (willOpen) {
        config.onOpen?.();
      } else {
        config.onClose?.();
      }
      return { ...prev, isOpen: willOpen };
    });
  }, [config]);



  const selectOption = useCallback(
    async (value: string) => {
      let text = value;

      if (value === 'confirm') {
        try {
          setState((prev) => ({ ...prev, isLoading: true }));

          // Visual confirmation
          addMessage('Sí, confirmar', MessageSender.USER);

          const response = await api.confirmBookingFromConversation({
            tenantId: config.tenantId,
            conversationId: state.conversationId!,
          });

          // Add agent response
          addMessage(response.response.text, MessageSender.AGENT, response.response.metadata);

          setState((prev) => ({
            ...prev,
            conversationId: response.conversation.conversationId,
            currentStep: response.conversation.state as ConversationStep,
            isLoading: false,
          }));

          if (config.onBookingCreated && response.conversation.bookingId) {
            // Trigger callback if needed
          }

        } catch (error: any) {
          console.error('Error confirming booking:', error);
          addMessage(
            'Error al confirmar. Por favor intenta nuevamente.',
            MessageSender.SYSTEM
          );
          setState((prev) => ({ ...prev, isLoading: false }));
        }
        return;
      }

      if (value === 'services') text = 'Ver Servicios';
      else if (value === 'providers') text = 'Ver Profesionales';
      // 'confirm' handled above
      else if (value === 'retry') text = 'Corregir';
      else if (value === 'restart') text = 'Agendar otra hora';

      await sendMessage(text);
    },
    [sendMessage, config, state.conversationId, addMessage, api]
  );

  return {
    state,
    sendMessage,
    selectService,
    selectProvider,
    selectTimeSlot,
    selectOption,
    createBooking,
    initialize,
    open,
    close,
    toggle,
    addMessage,
  };
}
