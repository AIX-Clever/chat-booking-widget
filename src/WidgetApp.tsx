import React, { useEffect, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ChatLauncher } from './components/ChatLauncher';
import { ChatWindow } from './components/ChatWindow';
import { createWidgetTheme } from './styles/theme';
import { WidgetConfig, Message, MessageSender, Service, TimeSlot } from './types';
import { useChat } from './hooks/useChat';

interface WidgetAppProps {
  config: WidgetConfig;
  widgetInstance: any; // Type as any for now to avoid circular deps
}

export const WidgetApp: React.FC<WidgetAppProps> = ({ config, widgetInstance }) => {
  const {
    state,
    sendMessage,
    selectService,
    selectProvider,
    selectOption,
    selectTimeSlot,
    createBooking,
    initialize,
    open,
    close,
    toggle,
    addMessage
  } = useChat(config);

  const [pendingBookingId, setPendingBookingId] = useState<string | null>(null);

  // Initialize
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Listen to external control events
  useEffect(() => {
    if (!widgetInstance) return;

    const handleOpen = () => open();
    const handleClose = () => close();
    const handleToggle = () => toggle();
    const handleMessage = (text: string) => {
      open(); // Ensure open
      sendMessage(text);
    };

    widgetInstance.on('internal:open', handleOpen);
    widgetInstance.on('internal:close', handleClose);
    widgetInstance.on('internal:toggle', handleToggle);
    widgetInstance.on('internal:message', handleMessage);

    return () => {
      widgetInstance.off('internal:open', handleOpen);
      widgetInstance.off('internal:close', handleClose);
      widgetInstance.off('internal:toggle', handleToggle);
      widgetInstance.off('internal:message', handleMessage);
    };
  }, [widgetInstance, open, close, toggle, sendMessage]);

  // Handle Payment Events (External)
  useEffect(() => {
    (window as any).chatWidgetConfirmPayment = (bookingId: string) => {
      // In a real app, we might verify this against state or backend
      // interacting with useChat to update state

      const confirmMessage: Message = {
        id: `msg_${Date.now()}_payment_success`,
        sender: MessageSender.SYSTEM,
        text: `✅ ¡Pago confirmado!\n\n🎉 Tu reserva está confirmada.\nTe enviamos un email con todos los detalles.`,
        timestamp: new Date().toISOString(),
      };

      addMessage(confirmMessage.text, confirmMessage.sender, confirmMessage.metadata);

      // We don't have the full booking object easily here unless we store it, 
      // but let's assume successful flow trigger
      if (config.onPaymentCompleted) {
        // We might need to fetch the booking or reconstruct it. 
        // For now, minimizing logic here as this is "External" trigger.
      }

      setPendingBookingId(null);

      // Ask for another service
      setTimeout(() => {
        addMessage('¿Quieres agendar otro servicio?', MessageSender.AGENT, {
          type: 'service_chips',
          services: state.availableServices
        });
      }, 2000);
    };

    (window as any).chatWidgetCancelPayment = (bookingId: string, reason?: string) => {
      const text = `❌ ${reason || 'Pago cancelado'}\n\nEl horario ha sido liberado. ¿Quieres intentar de nuevo?`;
      addMessage(text, MessageSender.SYSTEM, {
        type: 'service_chips',
        services: state.availableServices
      });
      setPendingBookingId(null);

      if (config.onPaymentFailed) {
        config.onPaymentFailed({ reason, bookingId });
      }
    };
  }, [addMessage, config, state.availableServices]);


  const theme = createWidgetTheme(config);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <ChatLauncher
        onClick={toggle}
        position={config.position || 'bottom-right'}
        primaryColor={config.primaryColor || '#1976d2'}
        zIndex={config.zIndex}
      />

      <ChatWindow
        isOpen={state.isOpen}
        messages={state.messages}
        isLoading={state.isLoading}
        position={config.position || 'bottom-right'}
        primaryColor={config.primaryColor || '#1976d2'}
        greetingMessage={config.greetingMessage || '¡Hola! 👋 ¿En qué puedo ayudarte?'}
        placeholder={config.messages?.placeholder}
        zIndex={config.zIndex}
        onClose={close}
        onSendMessage={sendMessage}
        agentName={config.theme?.agentName}
        onServiceSelect={selectService}
        onOptionSelect={selectOption}
        onProviderSelect={selectProvider}
        onTimeSlotSelect={(slot) => {
          // We wrap this because WidgetApp logic on time slot selection 
          // involved creating a PENDING booking. 
          // useChat's selectTimeSlot just sends a message "I reserve this".
          // We should let useChat handle it.
          selectTimeSlot(slot);
        }}
      />
    </ThemeProvider>
  );
};
