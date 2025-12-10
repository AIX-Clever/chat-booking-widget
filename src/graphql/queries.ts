import { gql } from 'graphql-request';

// ============================================
// Tenant Settings
// ============================================



export const GET_TENANT_SETTINGS = gql`
  query GetTenantSettings($tenantId: ID!) {
    getTenantSettings(tenantId: $tenantId) {
      tenantId
      language
      primaryColor
      position
      greetingMessage
      autoOpen
      logoUrl
    }
  }
`;

// ============================================
// Services
// ============================================

export const LIST_SERVICES = gql`
  query ListServices($tenantId: ID!) {
    listServices(tenantId: $tenantId) {
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

export const LIST_PROVIDERS = gql`
  query ListProviders($tenantId: ID!, $serviceId: ID) {
    listProviders(tenantId: $tenantId, serviceId: $serviceId) {
      id
      name
      bio
      timezone
      active
      serviceIds
    }
  }
`;

// ============================================
// Availability
// ============================================

export const GET_AVAILABILITY = gql`
  query GetAvailability(
    $tenantId: ID!
    $serviceId: ID!
    $providerId: ID
    $startDate: AWSDateTime!
    $endDate: AWSDateTime!
  ) {
    getAvailability(
      tenantId: $tenantId
      serviceId: $serviceId
      providerId: $providerId
      startDate: $startDate
      endDate: $endDate
    ) {
      start
      end
      providerId
      serviceId
    }
  }
`;

// ============================================
// Chat / Messages
// ============================================

export const SEND_MESSAGE = gql`
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      conversationId
      message {
        id
        sender
        text
        timestamp
        metadata
      }
      nextStep
      options {
        services {
          id
          name
          description
          durationMinutes
          price
        }
        providers {
          id
          name
          bio
        }
        timeSlots {
          start
          end
          providerId
          serviceId
        }
      }
    }
  }
`;

// ============================================
// Bookings
// ============================================

export const CREATE_BOOKING = gql`
  mutation CreateBooking($input: CreateBookingInput!) {
    createBooking(input: $input) {
      id
      tenantId
      serviceId
      providerId
      start
      end
      status
      paymentStatus
      customerName
      customerEmail
      customerPhone
      service {
        id
        name
        description
        durationMinutes
        price
      }
      provider {
        id
        name
        bio
      }
      createdAt
    }
  }
`;

export const GET_BOOKING = gql`
  query GetBooking($tenantId: ID!, $bookingId: ID!) {
    getBooking(tenantId: $tenantId, bookingId: $bookingId) {
      id
      tenantId
      serviceId
      providerId
      start
      end
      status
      paymentStatus
      customerName
      customerEmail
      customerPhone
      service {
        id
        name
        description
        durationMinutes
        price
      }
      provider {
        id
        name
        bio
      }
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
