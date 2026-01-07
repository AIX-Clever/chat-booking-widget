import React from 'react';
import ReactDOM from 'react-dom/client';
import './i18n/config'; // Initialize i18n
import { WidgetApp } from './WidgetApp';
import type { WidgetConfig, WidgetEventType, Booking, UserContext } from './types';
import { graphQLClient } from './graphql/client';

class ChatAgentWidget {
  private root: ReactDOM.Root | null = null;
  private container: HTMLElement | null = null;
  private config: WidgetConfig | null = null;
  private eventListeners: Map<WidgetEventType, Set<Function>> = new Map();
  private widgetState: any = null;

  /**
   * Initialize the widget programmatically
   */
  init(config: Partial<WidgetConfig>): void {
    if (!config.tenantId || !config.publicKey) {
      throw new Error('tenantId and publicKey are required');
    }

    this.config = {
      tenantId: config.tenantId,
      publicKey: config.publicKey,
      apiUrl: config.apiUrl,
      env: config.env || 'prod',
      language: config.language || (typeof navigator !== 'undefined' && navigator.language ? navigator.language.split('-')[0] : 'es'),
      primaryColor: config.primaryColor || '#1976d2',
      position: config.position || 'bottom-right',
      autoOpen: config.autoOpen || false,
      zIndex: config.zIndex || 9999,
      debug: config.debug || false,
      greetingMessage: config.greetingMessage,
      userContext: config.userContext,
      useMocks: config.useMocks || false,
      messages: config.messages,
      onReady: () => {
        this.emit('ready');
        config.onReady?.();
      },
      onOpen: () => {
        this.emit('opened');
        config.onOpen?.();
      },
      onClose: () => {
        this.emit('closed');
        config.onClose?.();
      },
      onBookingCreated: (booking: Booking) => {
        this.emit('booking:created', booking);
        config.onBookingCreated?.(booking);
      },
      onError: (error) => {
        this.emit('error', error);
        config.onError?.(error);
      },
    };

    // Initialize GraphQL Client immediately if not using mocks
    if (!this.config.useMocks) {
      graphQLClient.initialize(this.config);
    }

    this.mount();

    if (this.config.debug) {
      console.log('[Chat Widget] Initialized:', this.config);
    }
  }

  /**
   * Mount the React app
   */
  private mount(): void {
    if (!this.config) return;

    // Unmount existing if any
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }

    // Create container if not exists
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'chat-agent-widget-root';
      document.body.appendChild(this.container);
    }

    // Create React root and render
    this.root = ReactDOM.createRoot(this.container);
    // Explicitly cast this to any to avoid circular type dependency issues for now
    this.root.render(<WidgetApp config={this.config} widgetInstance={this as any} />);
  }

  /**
   * Open the chat window
   */
  open(): void {
    if (this.config?.debug) {
      console.log('[Chat Widget] Opening chat');
    }
    this.emit('internal:open');
    this.config?.onOpen?.();
  }

  /**
   * Close the chat window
   */
  close(): void {
    if (this.config?.debug) {
      console.log('[Chat Widget] Closing chat');
    }
    this.emit('internal:close');
    this.config?.onClose?.();
  }

  /**
   * Toggle chat window open/close
   */
  toggle(): void {
    this.emit('internal:toggle');
  }

  /**
   * Check if chat is open
   */
  isOpen(): boolean {
    return this.widgetState?.isOpen || false;
  }

  /**
   * Send a message programmatically
   */
  sendMessage(text: string): void {
    if (this.config?.debug) {
      console.log('[Chat Widget] Sending message:', text);
    }
    this.emit('internal:message', text);
  }

  /**
   * Get current conversation ID
   */
  getConversationId(): string | undefined {
    return this.widgetState?.conversationId;
  }

  /**
   * Get user context
   */
  getUserContext(): UserContext | undefined {
    return this.config?.userContext;
  }

  /**
   * Update user context
   */
  setUserContext(context: UserContext): void {
    if (this.config) {
      this.config.userContext = { ...this.config.userContext, ...context };
      if (this.config.debug) {
        console.log('[Chat Widget] User context updated:', this.config.userContext);
      }
    }
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<WidgetConfig>): void {
    if (this.config) {
      this.config = { ...this.config, ...updates };
      // Remount to apply changes
      this.mount();
      if (this.config.debug) {
        console.log('[Chat Widget] Config updated:', this.config);
      }
    }
  }

  /**
   * Set theme
   */
  setTheme(theme: 'light' | 'dark'): void {
    if (this.config?.debug) {
      console.log('[Chat Widget] Setting theme:', theme);
    }
    // Theme support can be added later
  }

  /**
   * Get widget state
   */
  getState(): any {
    return this.widgetState;
  }

  /**
   * Event listener management
   */
  on(event: WidgetEventType, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off(event: WidgetEventType, callback: Function): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  private emit(event: WidgetEventType, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }

  /**
   * Destroy the widget
   */
  destroy(): void {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
    if (this.container) {
      document.body.removeChild(this.container);
      this.container = null;
    }
    this.config = null;
    this.eventListeners.clear();
    this.widgetState = null;

    console.log('[Chat Widget] Destroyed');
  }
}

// Create singleton instance
const widgetInstance = new ChatAgentWidget();

// Auto-initialize if script has data attributes
if (typeof window !== 'undefined') {
  // Try immediate initialization for dev mode
  const tryInit = () => {
    const script = document.querySelector(
      'script[data-tenant-id][data-public-key]'
    ) as HTMLScriptElement;

    if (script && script.dataset.tenantId && script.dataset.publicKey) {
      widgetInstance.init({
        tenantId: script.dataset.tenantId,
        publicKey: script.dataset.publicKey,
        apiUrl: script.dataset.apiUrl,
        language: script.dataset.language,
        position: script.dataset.position as any,
        primaryColor: script.dataset.themeColor,
        autoOpen: script.dataset.autoOpen === 'true',
        greetingMessage: script.dataset.greetingMessage,
        useMocks: script.dataset.useMocks === 'true',
      });
      return true;
    }
    return false;
  };

  // Try immediate init
  if (!tryInit()) {
    // If not found, wait for DOM
    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', tryInit);
    } else {
      // DOM already loaded, try again after a short delay
      setTimeout(tryInit, 100);
    }
  }
}

// Expose to window
declare global {
  interface Window {
    ChatAgentWidget: ChatAgentWidget;
  }
}

if (typeof window !== 'undefined') {
  window.ChatAgentWidget = widgetInstance;
}

// Export for UMD build
export default widgetInstance;
