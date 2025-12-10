import { graphQLClient } from './client';
import {
  GET_TENANT_SETTINGS,
  LIST_SERVICES,
  GET_SERVICE,
  LIST_PROVIDERS,
  GET_AVAILABILITY,
  SEND_MESSAGE,
  CREATE_BOOKING,
  GET_BOOKING,
} from './queries';
import type {
  TenantSettings,
  Service,
  Provider,
  GetAvailabilityRequest,
  TimeSlot,
  SendMessageRequest,
  SendMessageResponse,
  CreateBookingRequest,
  Booking,
} from '@/types';

// ============================================
// Tenant Settings
// ============================================

export async function getTenantSettings(tenantId: string): Promise<TenantSettings> {
  const client = graphQLClient.getClient();
  const data = await client.request<{ getTenantSettings: TenantSettings }>(
    GET_TENANT_SETTINGS,
    { tenantId }
  );
  return data.getTenantSettings;
}

// ============================================
// Services
// ============================================

export async function listServices(tenantId: string): Promise<Service[]> {
  const client = graphQLClient.getClient();
  const data = await client.request<{ listServices: Service[] }>(
    LIST_SERVICES,
    { tenantId }
  );
  return data.listServices;
}

export async function getService(tenantId: string, serviceId: string): Promise<Service> {
  const client = graphQLClient.getClient();
  const data = await client.request<{ getService: Service }>(
    GET_SERVICE,
    { tenantId, serviceId }
  );
  return data.getService;
}

// ============================================
// Providers
// ============================================

export async function listProviders(
  tenantId: string,
  serviceId?: string
): Promise<Provider[]> {
  const client = graphQLClient.getClient();
  const data = await client.request<{ listProviders: Provider[] }>(
    LIST_PROVIDERS,
    { tenantId, serviceId }
  );
  return data.listProviders;
}

// ============================================
// Availability
// ============================================

export async function getAvailability(
  request: GetAvailabilityRequest
): Promise<TimeSlot[]> {
  const client = graphQLClient.getClient();
  const data = await client.request<{ getAvailability: TimeSlot[] }>(
    GET_AVAILABILITY,
    {
      tenantId: request.tenantId,
      serviceId: request.serviceId,
      providerId: request.providerId,
      startDate: request.startDate,
      endDate: request.endDate,
    }
  );
  return data.getAvailability;
}

// ============================================
// Chat / Messages
// ============================================

export async function sendMessage(
  request: SendMessageRequest
): Promise<SendMessageResponse> {
  const client = graphQLClient.getClient();
  const data = await client.request<{ sendMessage: SendMessageResponse }>(
    SEND_MESSAGE,
    {
      input: {
        tenantId: request.tenantId,
        conversationId: request.conversationId,
        text: request.text,
        userContext: request.userContext,
      },
    }
  );
  return data.sendMessage;
}

// ============================================
// Bookings
// ============================================

export async function createBooking(
  request: CreateBookingRequest
): Promise<Booking> {
  const client = graphQLClient.getClient();
  const data = await client.request<{ createBooking: Booking }>(
    CREATE_BOOKING,
    {
      input: {
        tenantId: request.tenantId,
        conversationId: request.conversationId,
        serviceId: request.serviceId,
        providerId: request.providerId,
        start: request.start,
        end: request.end,
        customerName: request.customerName,
        customerEmail: request.customerEmail,
        customerPhone: request.customerPhone,
      },
    }
  );
  return data.createBooking;
}

export async function getBooking(
  tenantId: string,
  bookingId: string
): Promise<Booking> {
  const client = graphQLClient.getClient();
  const data = await client.request<{ getBooking: Booking }>(
    GET_BOOKING,
    { tenantId, bookingId }
  );
  return data.getBooking;
}
