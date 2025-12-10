import { useState, useEffect, useCallback } from 'react';
import { WidgetConfig } from '@/types';
import { graphQLClient } from '@/graphql/client';
import { useChat } from './useChat';

const DEFAULT_CONFIG: Partial<WidgetConfig> = {
  env: 'prod',
  language: 'es',
  primaryColor: '#1976d2',
  position: 'bottom-right',
  autoOpen: false,
  zIndex: 9999,
  debug: false,
};

export function useWidget(initialConfig?: Partial<WidgetConfig>) {
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize widget
  const init = useCallback((userConfig: Partial<WidgetConfig>) => {
    if (!userConfig.tenantId || !userConfig.publicKey) {
      throw new Error('tenantId and publicKey are required');
    }

    const fullConfig: WidgetConfig = {
      ...DEFAULT_CONFIG,
      ...userConfig,
      tenantId: userConfig.tenantId,
      publicKey: userConfig.publicKey,
    };

    // Initialize GraphQL client
    graphQLClient.initialize(fullConfig);

    setConfig(fullConfig);

    if (fullConfig.debug) {
      console.log('[Chat Widget] Initialized with config:', fullConfig);
    }
  }, []);

  // Initialize once
  useEffect(() => {
    if (initialConfig && !config) {
      init(initialConfig);
    }
  }, []); // Empty deps - init only once

  const chat = config ? useChat(config) : null;

  useEffect(() => {
    if (chat && !isReady) {
      chat.initialize()
        .then(() => setIsReady(true))
        .catch((error) => {
          console.warn('[Widget] Initialize failed, but widget will still render:', error);
          setIsReady(true); // Allow widget to render even if backend fails
        });
    }
  }, [chat, isReady]);

  const updateConfig = useCallback((updates: Partial<WidgetConfig>) => {
    setConfig((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  return {
    config,
    isReady,
    chat,
    init,
    updateConfig,
  };
}
