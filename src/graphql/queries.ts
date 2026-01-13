import { gql } from 'graphql-request';

// ============================================
// Tenant Settings
// ============================================



export const GET_TENANT_SETTINGS = gql`
  query GetTenant($tenantId: ID) {
    getTenant(tenantId: $tenantId) {
      tenantId
      name
      settings
    }
  }
`;

// ============================================
// Services
// ============================================

export const LIST_SERVICES = gql`
  query ListServices {
    searchServices(availableOnly: true) {
      serviceId
      name
      description
      durationMinutes
      category
      price
      available
    }
  }
`;

export const GET_SERVICE = gql`
  query GetService($tenantId: ID!, $serviceId: ID!) {
    getService(tenantId: $tenantId, serviceId: $serviceId) {
      id
      name
      description
      durationMinutes
      category
      price
      active
    }
  }
`;

// ============================================
// Providers
// ============================================

// ============================================
// Providers
// ============================================

export const LIST_PROVIDERS = gql`
  query ListProviders {
    listProviders {
      providerId
      name
      bio
      timezone
      available
      serviceIds
      photoUrl
    }
  }
`;

export const LIST_PROVIDERS_BY_SERVICE = gql`
  query ListProvidersByService($serviceId: ID!) {
    listProvidersByService(serviceId: $serviceId) {
      providerId
      name
      bio
      timezone
      available
      serviceIds
      photoUrl
    }
  }
`;

// ============================================
// Availability
// ============================================

export const GET_AVAILABILITY = gql`
  query GetAvailability($input: GetAvailableSlotsInput!) {
    getAvailableSlots(input: $input) {
      start
      end
      providerId
      serviceId
      isAvailable
    }
  }
`;

// ============================================
// Chat / Messages
// ============================================

export const START_CONVERSATION = gql`
  mutation StartConversation($input: StartConversationInput!) {
    startConversation(input: $input) {
      conversation {
        conversationId
        state
        context
      }
      response
    }
  }
`;

export const SEND_MESSAGE = gql`
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      conversation {
        conversationId
        state
        context
      }
      response
    }
  }
`;

// ============================================
// Bookings
// ============================================

export const CREATE_BOOKING = gql`
  mutation CreateBooking($input: CreateBookingInput!) {
    createBooking(input: $input) {
      bookingId
      tenantId
      serviceId
      providerId
      start
      end
      status
      paymentStatus
      clientName
      clientEmail
      clientPhone
      createdAt
    }
  }
`;

export const GET_BOOKING = gql`
  query GetBooking($input: GetBookingInput!) {
    getBooking(input: $input) {
      bookingId
      tenantId
      serviceId
      providerId
      start
      end
      status
      paymentStatus
      clientName
      clientEmail
      clientPhone
      createdAt
    }
  }
`;

export const CONFIRM_BOOKING_FROM_CONVERSATION = gql`
  mutation ConfirmBookingFromConversation($input: ConfirmBookingFromConversationInput!) {
    confirmBookingFromConversation(input: $input) {
      conversation {
        conversationId
        state
        context
      }
      response
    }
  }
`;
