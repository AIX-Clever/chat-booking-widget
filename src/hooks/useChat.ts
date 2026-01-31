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
  const api = (config.useMocks ? mockService : realApi) as any;

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
    async (text: string, displayLabel?: string) => {
      try {
        setState((prev) => ({ ...prev, isLoading: true }));

        // Add user message
        addMessage(displayLabel || text, MessageSender.USER);

        // If no conversation exists, start one first
        let currentConversationId = state.conversationId;
        if (!currentConversationId) {
          const startResponse = await api.startConversation('web', config.userContext);
          currentConversationId = startResponse.conversation.conversationId;
          setState((prev) => ({ ...prev, conversationId: currentConversationId }));
        }

        // Send to backend
        const response = await api.sendMessage({
          tenantId: config.tenantId,
          conversationId: currentConversationId,
          text, // Always send the value/ID/text to backend
          userContext: config.userContext,
        });

        // Update state with conversation data
        // Map generic options to specific types based on context if needed
        const rawOptions = response.response.options || [];
        const rawSlots = response.response.slots || [];
        const responseType = response.response.type; // 'options', 'calendar', 'text', etc.

        // Simple mapping: We treat generic options as Services or Providers depending on what we need.
        // In a real generic chat, we might just use 'availableOptions'.
        const mappedServices = rawOptions.map((opt: any) => {
          // Attempt to parse duration from label if present, e.g. "Service Name ($Price) (45 min)"
          let duration = 0;
          const durationMatch = opt.label?.match(/\((\d+)\s*min\)/i);
          if (durationMatch) {
            duration = parseInt(durationMatch[1], 10);
          }

          // Attempt to parse price
          let price = 0;
          const priceMatch = opt.label?.match(/\$([0-9.]+)/);
          if (priceMatch) {
            price = parseFloat(priceMatch[1]);
          }

          // Clean up name by removing price and duration info
          let cleanName = opt.label || '';
          cleanName = cleanName.replace(/\s*\(\d+\s*min\)/i, ''); // Remove duration
          cleanName = cleanName.replace(/\s*-\s*\$[0-9.]+/i, ''); // Remove price part

          return {
            id: opt.value,
            name: cleanName.trim(),
            description: opt.description || '',
            durationMinutes: duration,
            price: price,
            active: true
          };
        });

        const mappedProviders = rawOptions.map((opt: any) => ({
          id: opt.value,
          name: opt.label,
          bio: opt.description,
          timezone: 'UTC',
          active: true,
          serviceIds: []
        }));

        // Construct metadata for the message so MessageList renders the correct chips
        const messageMetadata = { ...response.response.metadata };

        // Determine what to show based on the specific type sent by backend OR infer from context
        // Backend sends: 'options' for both services and providers.
        // We know implicit context from the 'label' or we can rely on state, but easier to infer:
        if (responseType === 'options') {
          // Heuristic: If we are in SERVICE_SELECTION step (or SERVICE_PENDING), treat as service_chips
          // If we are in PROVIDER_SELECTION/PENDING, treat as provider_chips
          // Or default to generic options if unsure.

          // However, a robust way is to check the options content or rely on what the backend intent is.
          // Since backend sends just 'options', we might default to 'options_chips' 
          // BUT MessageList uses 'service_chips' to show the nice cards for services.

          const isServiceList = rawOptions.some((o: any) => o.label?.includes('$')); // Services usually have price in label from backend

          if (isServiceList) {
            messageMetadata.type = 'service_chips';
            messageMetadata.services = mappedServices;
          } else if (response.conversation.state === 'PROVIDER_PENDING') {
            messageMetadata.type = 'provider_chips';
            messageMetadata.providers = mappedProviders;
          } else {
            // Default to generic options (chips)
            messageMetadata.type = 'options_chips';
            messageMetadata.options = rawOptions.map((o: any) => ({
              label: o.label,
              value: o.value
            }));
          }
        } else if (responseType === 'calendar') {
          messageMetadata.type = 'time_slots';
          messageMetadata.timeSlots = rawSlots;
        }

        // Add agent response with the enriched metadata
        addMessage(response.response.text, MessageSender.AGENT, messageMetadata);

        setState((prev) => ({
          ...prev,
          conversationId: response.conversation.conversationId,
          currentStep: response.conversation.state,
          availableServices: mappedServices,
          availableProviders: mappedProviders,
          availableTimeSlots: rawSlots,
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
      await sendMessage(slot.start, `Reservo para: ${formattedTime}`);
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

      // Determine greeting based on language
      const language = config.language || settings.widgetConfig?.language || 'es';
      const welcomeMessages = settings.widgetConfig?.welcomeMessages || {};
      // Fallback to legacy welcomeMessage or default
      const greeting = welcomeMessages[language] ||
        config.greetingMessage ||
        settings.widgetConfig?.welcomeMessage ||
        '¡Hola! 👋 ¿En qué puedo ayudarte?';

      // Add greeting message
      addMessage(
        greeting,
        MessageSender.AGENT
      );

      setState((prev) => ({
        ...prev,
        isInitialized: true,
        availableServices: services.filter((s: Service) => s.active),
        tenantSettings: settings // Store settings in state
      }));

      config.onReady?.();
      return settings; // Return settings for immediate use if needed
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
      return null;
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
    async (value: string, label?: string) => {
      let text = value;
      let displayLabel = label;

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

      if (value === 'services') {
        text = 'Ver Servicios';
        displayLabel = text;
      } else if (value === 'providers') {
        text = 'Ver Profesionales';
        displayLabel = text;
      } else if (value === 'retry') {
        text = 'Corregir';
        displayLabel = text;
      } else if (value === 'restart') {
        text = 'Agendar otra hora';
        displayLabel = text;
      }

      // If we have a label passed from UI (e.g. from generic options), prefer using it for display
      // but keep 'text' as the value sending to backend unless mapped above.
      // The issue was: "Reservar Servicio" (label) -> "flow_booking" (value/text). 
      // We want to send "flow_booking" but display "Reservar Servicio".

      await sendMessage(text, displayLabel);
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
