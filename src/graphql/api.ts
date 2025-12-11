import { graphQLClient } from './client';
import {
  GET_TENANT_SETTINGS,
  LIST_SERVICES,
  GET_SERVICE,
  LIST_PROVIDERS,
  GET_AVAILABILITY,
  START_CONVERSATION,
  SEND_MESSAGE,
  CREATE_BOOKING,
  GET_BOOKING,
  CONFIRM_BOOKING_FROM_CONVERSATION,
  LIST_PROVIDERS_BY_SERVICE,
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
  ConfirmBookingFromConversationRequest,
  ConfirmBookingFromConversationResponse,
} from '@/types';

// ============================================
// Tenant Settings
// ============================================

export async function getTenantSettings(tenantId: string): Promise<TenantSettings> {
  // Backend does not strictly implement getTenantSettings yet (schema mismatch).
  // Return default settings to prevent initialization failure.
  return {
    tenantId,
    language: 'es',
    primaryColor: '#e91e63',
    position: 'bottom-right',
    greetingMessage: '¡Hola! 👋 Bienvenido.',
    autoOpen: true
  } as TenantSettings;
}

// ============================================
// Services
// ============================================

export async function listServices(tenantId: string): Promise<Service[]> {
  const client = graphQLClient.getClient();
  const data = await client.request<{ searchServices: any[] }>(
    LIST_SERVICES,
    {}
  );
  // Map backend Service type to frontend Service type
  return data.searchServices.map(s => ({
    id: s.serviceId,
    name: s.name,
    description: s.description,
    durationMinutes: s.durationMinutes,
    category: s.category,
    price: s.price,
    active: s.available
  }));
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

  let data: { listProviders?: any[]; listProvidersByService?: any[] };

  if (serviceId) {
    data = await client.request(LIST_PROVIDERS_BY_SERVICE, { serviceId });
    return (data.listProvidersByService || []).map(p => ({
      id: p.providerId,
      name: p.name,
      bio: p.bio,
      timezone: p.timezone,
      active: p.available,
      serviceIds: p.serviceIds || []
    }));
  } else {
    data = await client.request(LIST_PROVIDERS, {});
    return (data.listProviders || []).map(p => ({
      id: p.providerId,
      name: p.name,
      bio: p.bio,
      timezone: p.timezone,
      active: p.available,
      serviceIds: p.serviceIds || []
    }));
  }
}

// ============================================
// Availability
// ============================================

export async function getAvailability(
  request: GetAvailabilityRequest
): Promise<TimeSlot[]> {
  const client = graphQLClient.getClient();
  const data = await client.request<{ getAvailableSlots: any[] }>(
    GET_AVAILABILITY,
    {
      input: {
        serviceId: request.serviceId,
        providerId: request.providerId,
        from: request.startDate, // Backend expects 'from' and 'to'
        to: request.endDate,
      }
    }
  );
  return data.getAvailableSlots.map(slot => ({
    start: slot.start,
    end: slot.end,
    providerId: slot.providerId,
    serviceId: slot.serviceId
    // Backend returns isAvailable boolean, but TimeSlot interface implies it (or ignores it)
  }));
}

// ============================================
// Chat / Messages
// ============================================

export async function startConversation(
  channel?: string,
  metadata?: any
): Promise<SendMessageResponse> {
  const client = graphQLClient.getClient();
  const data = await client.request<{ startConversation: SendMessageResponse }>(
    START_CONVERSATION,
    {
      input: {
        channel: channel || 'web',
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      },
    }
  );
  return data.startConversation;
}

export async function sendMessage(
  request: SendMessageRequest
): Promise<SendMessageResponse> {
  const client = graphQLClient.getClient();
  const data = await client.request<{ sendMessage: SendMessageResponse }>(
    SEND_MESSAGE,
    {
      input: {
        conversationId: request.conversationId,
        message: request.text,
        userData: request.userContext ? JSON.stringify(request.userContext) : undefined,
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
  const data = await client.request<{ createBooking: any }>(
    CREATE_BOOKING,
    {
      input: {
        serviceId: request.serviceId,
        providerId: request.providerId,
        start: request.start,
        end: request.end,
        clientName: request.customerName,
        clientEmail: request.customerEmail,
        clientPhone: request.customerPhone,
        notes: "Created via Chat Widget",
        conversationId: request.conversationId
        // tenantId is in header
      },
    }
  );

  const b = data.createBooking;
  return {
    id: b.bookingId,
    tenantId: b.tenantId,
    serviceId: b.serviceId,
    providerId: b.providerId,
    start: b.start,
    end: b.end,
    status: b.status,
    paymentStatus: b.paymentStatus,
    customerName: b.clientName,
    customerEmail: b.clientEmail,
    customerPhone: b.clientPhone,
    service: { id: b.serviceId, name: 'Service', description: '', durationMinutes: 60, price: 0, active: true }, // Hydrate if needed
    provider: { id: b.providerId, name: 'Provider', bio: '', timezone: 'UTC', active: true, serviceIds: [] },
    createdAt: b.createdAt
  };
}

export async function getBooking(
  tenantId: string,
  bookingId: string
): Promise<Booking> {
  const client = graphQLClient.getClient();
  const data = await client.request<{ getBooking: any }>(
    GET_BOOKING,
    { input: { bookingId } }
  );

  const b = data.getBooking;
  return {
    id: b.bookingId,
    tenantId: b.tenantId,
    serviceId: b.serviceId,
    providerId: b.providerId,
    start: b.start,
    end: b.end,
    status: b.status,
    paymentStatus: b.paymentStatus,
    customerName: b.clientName,
    customerEmail: b.clientEmail,
    customerPhone: b.clientPhone,
    service: { id: b.serviceId, name: 'Service', description: '', durationMinutes: 60, price: 0, active: true },
    provider: { id: b.providerId, name: 'Provider', bio: '', timezone: 'UTC', active: true, serviceIds: [] },
    createdAt: b.createdAt
  };
}

export async function confirmBookingFromConversation(
  request: ConfirmBookingFromConversationRequest
): Promise<ConfirmBookingFromConversationResponse> {
  const client = graphQLClient.getClient();
  const data = await client.request<{ confirmBookingFromConversation: ConfirmBookingFromConversationResponse }>(
    CONFIRM_BOOKING_FROM_CONVERSATION,
    {
      input: {
        conversationId: request.conversationId,
      },
    }
  );
  return data.confirmBookingFromConversation;
}
