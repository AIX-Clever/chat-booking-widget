import { GraphQLClient } from 'graphql-request';
import type { WidgetConfig } from '@/types';

class GraphQLClientSingleton {
  private client: GraphQLClient | null = null;
  private config: WidgetConfig | null = null;

  initialize(config: WidgetConfig): void {
    this.config = config;
    const endpoint = this.getEndpoint(config.env);

    this.client = new GraphQLClient(endpoint, {
      headers: {
        'x-api-key': config.publicKey,
        'Authorization': config.publicKey,
        'x-tenant-id': config.tenantId,
        'content-type': 'application/json',
      },
    });
  }

  getClient(): GraphQLClient {
    if (!this.client) {
      throw new Error('GraphQL client not initialized. Call initialize() first.');
    }
    return this.client;
  }

  getConfig(): WidgetConfig {
    if (!this.config) {
      throw new Error('Widget config not set.');
    }
    return this.config;
  }

  private getEndpoint(env: string = 'prod'): string {
    // Priority: 1. Config (Programmatic/HTML), 2. Environment Variable (Build), 3. Hardcoded map
    if (this.config?.apiUrl) {
      return this.config.apiUrl;
    }

    if (process.env.API_URL) {
      return process.env.API_URL;
    }

    const endpoints = {
      prod: 'https://p4mgpaaptzeppfuszun4jdn6vy.appsync-api.us-east-1.amazonaws.com/graphql',
      qa: 'https://p4mgpaaptzeppfuszun4jdn6vy.appsync-api.us-east-1.amazonaws.com/graphql',
      dev: 'https://p4mgpaaptzeppfuszun4jdn6vy.appsync-api.us-east-1.amazonaws.com/graphql',
    };
    return endpoints[env as keyof typeof endpoints] || endpoints.prod;
  }

  updateHeaders(headers: Record<string, string>): void {
    if (!this.client) return;

    const currentHeaders = (this.client as any).requestConfig?.headers || {};
    (this.client as any).requestConfig = {
      ...(this.client as any).requestConfig,
      headers: { ...currentHeaders, ...headers },
    };
  }
}

export const graphQLClient = new GraphQLClientSingleton();
