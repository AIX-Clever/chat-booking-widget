// ============================================
// Core Types
// ============================================

export interface Service {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  category?: string;
  price?: number;
  active: boolean;
}

export interface Provider {
  id: string;
  name: string;
  bio?: string;
  timezone: string;
  active: boolean;
  serviceIds: string[];
}

export interface TimeSlot {
  start: string; // ISO DateTime
  end: string;   // ISO DateTime
  providerId: string;
  serviceId: string;
}

export interface Booking {
  id: string;
  tenantId: string;
  serviceId: string;
  providerId: string;
  start: string; // ISO DateTime
  end: string;   // ISO DateTime
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  service: Service;
  provider: Provider;
  createdAt: string;
}

export enum BookingStatus {
  PENDING = 'PENDING',
  PENDING_PAYMENT = 'PENDING_PAYMENT',  // Reserva temporal esperando pago
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  EXPIRED = 'EXPIRED',  // Reserva expiró sin pago
}

export enum PaymentStatus {
  NONE = 'NONE',
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export interface PaymentSession {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  provider: 'stripe' | 'mercadopago' | 'flow' | 'webpay';
  sessionUrl?: string;
  expiresAt: string;
  status: PaymentStatus;
}

export interface PaymentRequiredData {
  bookingId: string;
  booking: Booking;
  amount: number;
  currency: string;
  expiresAt: string;
  paymentSession?: PaymentSession;
}

// ============================================
// Chat Types
// ============================================

export interface Message {
  id: string;
  sender: MessageSender;
  text: string;
  timestamp: string;
  metadata?: MessageMetadata;
}

export enum MessageSender {
  USER = 'USER',
  AGENT = 'AGENT',
  SYSTEM = 'SYSTEM',
}

export interface MessageMetadata {
  type?: 'service_chips' | 'provider_chips' | 'time_slots' | 'booking_confirmation' | 'options_chips' | 'form_input' | 'confirmation';
  services?: Service[];
  providers?: Provider[];
  timeSlots?: TimeSlot[];
  booking?: Booking;
  options?: Array<{ label: string; value: string }>;
  formFields?: Array<{ name: string; label: string; type: 'text' | 'email' | 'tel'; required?: boolean }>;
  actions?: Array<{ label: string; value: string; style?: string }>;
}

// ============================================
// Widget Configuration
// ============================================

export interface WidgetConfig {
  // Required
  tenantId: string;
  publicKey: string;
  apiUrl?: string;

  // Optional
  env?: 'prod' | 'qa' | 'dev';
  language?: string;
  primaryColor?: string;
  position?: 'bottom-right' | 'bottom-left';
  autoOpen?: boolean;
  greetingMessage?: string;
  zIndex?: number;
  debug?: boolean;

  // User context
  userContext?: UserContext;

  // Dev flags
  useMocks?: boolean;

  // UI Configuration
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    fontFamily?: string;
    borderRadius?: 'none' | 'small' | 'medium' | 'large' | 'full';
    enableGlassmorphism?: boolean;
    launcherIcon?: 'chat' | 'calendar' | 'question' | string; // URL icon support todo
    agentName?: string; // Nombre del asistente en el header
  };

  // Payment configuration
  requirePayment?: boolean;  // Si requiere pago para confirmar reservas
  paymentReservationMinutes?: number;  // Tiempo para completar pago (default: 15)

  // Callbacks
  onReady?: () => void;
  onOpen?: () => void;
  onClose?: () => void;
  onBookingCreated?: (booking: Booking) => void;
  onPaymentRequired?: (data: PaymentRequiredData) => void;  // Cuando se necesita pago
  onPaymentCompleted?: (booking: Booking) => void;  // Pago exitoso
  onPaymentFailed?: (error: any) => void;  // Pago falló
  onReservationExpired?: (bookingId: string) => void;  // Reserva expiró
  onError?: (error: ChatError) => void;

  // Custom messages
  messages?: WidgetMessages;
}

export interface UserContext {
  userId?: string;
  name?: string;
  email?: string;
  phone?: string;
  metadata?: Record<string, any>;
}

export interface WidgetMessages {
  greeting?: string;
  placeholder?: string;
  sendButton?: string;
  errorConnection?: string;
  bookingSuccess?: string;
  bookingError?: string;
  noAvailability?: string;
  paymentTimeout?: string;
  paymentProcessing?: string;
}

export interface TenantSettings {
  tenantId: string;
  language: string;
  primaryColor: string;
  position: 'bottom-right' | 'bottom-left';
  greetingMessage: string;
  autoOpen: boolean;
  logoUrl?: string;
}

// ============================================
// Widget State
// ============================================

export interface WidgetState {
  isOpen: boolean;
  isInitialized: boolean;
  conversationId?: string;
  currentStep: ConversationStep;
  messages: Message[];
  selectedService?: Service;
  selectedProvider?: Provider;
  selectedTimeSlot?: TimeSlot;
  availableServices: Service[];
  availableProviders: Provider[];
  availableTimeSlots: TimeSlot[];
  isLoading: boolean;
  error?: ChatError;
  tenantSettings?: TenantSettings;
}

export enum ConversationStep {
  GREETING = 'GREETING',
  OPTIONS_SELECTION = 'OPTIONS_SELECTION', // New step
  SERVICE_SELECTION = 'SERVICE_SELECTION',
  PROVIDER_SELECTION = 'PROVIDER_SELECTION',
  TIME_SELECTION = 'TIME_SELECTION',
  ASK_NAME = 'ASK_NAME',
  ASK_SURNAME = 'ASK_SURNAME',
  ASK_EMAIL = 'ASK_EMAIL',
  ASK_PHONE = 'ASK_PHONE',
  CONFIRM_DETAILS = 'CONFIRM_DETAILS',
  CUSTOMER_INFO = 'CUSTOMER_INFO',
  CONFIRMATION = 'CONFIRMATION',
  COMPLETED = 'COMPLETED',
}

// ============================================
// Events
// ============================================

export type WidgetEventType =
  | 'ready'
  | 'opened'
  | 'closed'
  | 'message:sent'
  | 'message:received'
  | 'booking:created'
  | 'error'
  | 'internal:open'
  | 'internal:close'
  | 'internal:toggle'
  | 'internal:message';

export interface WidgetEvent<T = any> {
  type: WidgetEventType;
  timestamp: string;
  data?: T;
}

export interface ChatError {
  code: string;
  message: string;
  details?: any;
}

// ============================================
// GraphQL Types
// ============================================

export interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLError[];
}

export interface GraphQLError {
  message: string;
  extensions?: {
    code: string;
    [key: string]: any;
  };
}

// ============================================
// API Requests/Responses
// ============================================

export interface SendMessageRequest {
  tenantId: string;
  conversationId?: string;
  text: string;
  userContext?: UserContext;
}

export interface SendMessageResponse {
  conversation: {
    conversationId: string;
    state: ConversationStep;
    context?: any;
  };
  response: {
    text: string;
    type?: string;
    metadata?: any;
    // Backend ResponseBuilder returns a flat list of options
    options?: any;
    // Calendar type returns slots
    slots?: TimeSlot[];
  };
}

export interface GetAvailabilityRequest {
  tenantId: string;
  serviceId: string;
  providerId?: string;
  startDate: string;
  endDate: string;
}

export interface GetAvailabilityResponse {
  timeSlots: TimeSlot[];
}

export interface CreateBookingRequest {
  tenantId: string;
  conversationId: string;
  serviceId: string;
  providerId: string;
  start: string;
  end: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
}

export interface CreateBookingResponse {
  booking: Booking;
}

export interface ConfirmBookingFromConversationRequest {
  tenantId: string;
  conversationId: string;
}

export interface ConfirmBookingFromConversationResponse {
  conversation: {
    conversationId: string;
    state: string;
    context: Record<string, any>;
  };
  response: Record<string, any>;
}
