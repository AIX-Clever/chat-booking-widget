# 💳 Flujo de Pago - Chat Booking Widget

## 📋 Descripción General

El widget implementa un flujo completo de pago con reserva temporal, ideal para asegurar que los horarios solo se confirmen cuando el usuario complete el pago.

## 🎯 Flujo Ideal

```
1. Usuario selecciona servicio
   └─> "Me interesa: Masaje Relajante"

2. Sistema muestra horarios disponibles
   └─> Chips con horarios clickeables

3. Usuario selecciona horario
   └─> "Reservar para: miércoles, 4 diciembre a las 14:00"

4. Sistema crea reserva TEMPORAL (PENDING_PAYMENT)
   └─> ⏰ "Horario reservado temporalmente"
   └─> ⚠️ "Completa el pago en los próximos 15 minutos"

5. Widget emite evento onPaymentRequired
   └─> Sitio web abre modal de pago (Stripe/MercadoPago/etc)

6a. Pago exitoso:
    └─> Sitio llama: window.chatWidgetConfirmPayment(bookingId)
    └─> Widget muestra: ✅ "¡Pago confirmado!"
    └─> Reserva cambia a: CONFIRMED
    └─> Email de confirmación enviado

6b. Pago fallido/cancelado:
    └─> Sitio llama: window.chatWidgetCancelPayment(bookingId, reason)
    └─> Widget muestra: ❌ "Pago cancelado"
    └─> Horario liberado
    └─> Pregunta: "¿Quieres intentar de nuevo?"

7. Timer de expiración (15 minutos)
   └─> Si no hay pago: onReservationExpired(bookingId)
   └─> Reserva cambia a: EXPIRED
   └─> Horario liberado automáticamente
```

## ⚙️ Configuración

### Widget Config

```typescript
ChatAgentWidget.init({
  tenantId: 'your-tenant-id',
  requirePayment: true,  // Activar flujo de pago
  paymentReservationMinutes: 15,  // Tiempo límite (default: 15)
  
  // Callbacks del flujo de pago
  onPaymentRequired: (data) => {
    // Abrir modal de pago
    openPaymentModal({
      bookingId: data.bookingId,
      amount: data.amount,
      currency: data.currency,
      expiresAt: data.expiresAt,
    });
  },
  
  onPaymentCompleted: (booking) => {
    // Pago exitoso
    console.log('Reserva confirmada:', booking);
    showSuccessNotification();
  },
  
  onPaymentFailed: (error) => {
    // Pago falló
    console.error('Pago fallido:', error);
    showErrorNotification(error.reason);
  },
  
  onReservationExpired: (bookingId) => {
    // Reserva expiró sin pago
    console.log('Reserva expirada:', bookingId);
    liberateTimeSlot(bookingId);
  },
});
```

## 🔌 API Pública del Widget

### Confirmar Pago (desde el sitio web)

```javascript
// Llamar después de pago exitoso en Stripe/MercadoPago
window.chatWidgetConfirmPayment(bookingId);
```

### Cancelar Pago

```javascript
// Llamar cuando el pago falla o el usuario cancela
window.chatWidgetCancelPayment(bookingId, 'Motivo de cancelación');
```

## 📊 Estados de Reserva

| Estado | Descripción | Siguiente Paso |
|--------|-------------|----------------|
| `PENDING_PAYMENT` | Reserva temporal esperando pago | Confirmar o Expirar |
| `CONFIRMED` | Reserva confirmada con pago | Completar o Cancelar |
| `EXPIRED` | Reserva expiró sin pago | Liberar horario |
| `CANCELLED` | Usuario canceló | Liberar horario |

## 🔐 Consideraciones de Seguridad

### 1. Reserva Temporal vs Confirmada

**Recomendación**: Crear reserva con `status: PENDING_PAYMENT` en lugar de bloquear el horario inmediatamente.

```typescript
// ✅ Buena práctica
const booking = {
  status: 'PENDING_PAYMENT',
  paymentStatus: 'PENDING',
  expiresAt: new Date(Date.now() + 15 * 60 * 1000),
};

// ❌ No recomendado
const booking = {
  status: 'CONFIRMED',  // ¡Bloquea sin pago!
  paymentStatus: 'PENDING',
};
```

### 2. Timeout de Reserva

**Importante**: Liberar horarios si no se completa el pago.

```typescript
// Backend - Cron job cada 5 minutos
async function cleanupExpiredReservations() {
  const now = new Date();
  
  const expired = await db.bookings.findMany({
    where: {
      status: 'PENDING_PAYMENT',
      expiresAt: { lt: now },
    },
  });
  
  for (const booking of expired) {
    await db.bookings.update({
      where: { id: booking.id },
      data: { status: 'EXPIRED' },
    });
    
    // Liberar horario
    await releaseTimeSlot(booking.providerId, booking.start);
  }
}
```

### 3. Validación de Pago

**Crítico**: Siempre validar en el backend antes de confirmar.

```typescript
// ❌ Nunca confiar solo en el frontend
window.chatWidgetConfirmPayment(bookingId);

// ✅ Validar con webhook del proveedor de pago
app.post('/webhooks/stripe', async (req, res) => {
  const event = stripe.webhooks.constructEvent(
    req.body,
    req.headers['stripe-signature'],
    webhookSecret
  );
  
  if (event.type === 'payment_intent.succeeded') {
    const bookingId = event.data.object.metadata.bookingId;
    
    // Confirmar en DB
    await confirmBooking(bookingId);
    
    // Notificar al widget
    await notifyWidgetPaymentConfirmed(bookingId);
  }
});
```

## 💰 Integración con Proveedores de Pago

### Stripe

```typescript
onPaymentRequired: async (data) => {
  // 1. Crear Payment Intent en backend
  const response = await fetch('/api/create-payment-intent', {
    method: 'POST',
    body: JSON.stringify({
      bookingId: data.bookingId,
      amount: data.amount,
      currency: data.currency,
    }),
  });
  
  const { clientSecret } = await response.json();
  
  // 2. Abrir Stripe modal
  const stripe = Stripe('pk_live_...');
  const { error } = await stripe.confirmCardPayment(clientSecret);
  
  // 3. Notificar resultado al widget
  if (error) {
    window.chatWidgetCancelPayment(data.bookingId, error.message);
  }
  // Confirmación vía webhook
}
```

### MercadoPago

```typescript
onPaymentRequired: async (data) => {
  // 1. Crear preferencia en backend
  const response = await fetch('/api/mercadopago/create-preference', {
    method: 'POST',
    body: JSON.stringify({
      bookingId: data.bookingId,
      amount: data.amount,
    }),
  });
  
  const { initPoint } = await response.json();
  
  // 2. Abrir checkout
  window.open(initPoint, '_blank');
  
  // 3. Escuchar webhook para confirmar
  // Confirmación vía webhook de MercadoPago
}
```

### Flow (Chile)

```typescript
onPaymentRequired: async (data) => {
  // Similar a MercadoPago - redirect flow
  const response = await fetch('/api/flow/create-payment', {
    method: 'POST',
    body: JSON.stringify({
      bookingId: data.bookingId,
      amount: data.amount,
    }),
  });
  
  const { url } = await response.json();
  window.location.href = url;  // Redirect to Flow
}
```

## 📱 UX Recomendaciones

### 1. Indicador Visual de Tiempo

```typescript
// Mostrar countdown en el widget
const expirationTime = new Date(data.expiresAt);
const interval = setInterval(() => {
  const remaining = expirationTime - Date.now();
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  
  updateTimerDisplay(`${minutes}:${seconds.toString().padStart(2, '0')}`);
  
  if (remaining <= 0) {
    clearInterval(interval);
    window.chatWidgetCancelPayment(bookingId, 'Tiempo expirado');
  }
}, 1000);
```

### 2. Advertencia de Cierre

```typescript
// Prevenir que el usuario cierre accidentalmente
window.addEventListener('beforeunload', (e) => {
  if (hasPendingPayment) {
    e.preventDefault();
    e.returnValue = '¿Seguro que quieres salir? Tu reserva se perderá.';
  }
});
```

### 3. Mensajes Claros

```typescript
messages: {
  paymentTimeout: '⚠️ Te quedan {minutes} minutos para completar el pago',
  paymentProcessing: '💳 Procesando pago seguro...',
}
```

## 🧪 Testing

### Flujo Completo

```typescript
// 1. Iniciar widget con pago requerido
ChatAgentWidget.init({ requirePayment: true });

// 2. Seleccionar servicio y horario
// ... interacción del usuario ...

// 3. Simular pago exitoso
window.chatWidgetConfirmPayment('booking_123');

// 4. Verificar confirmación
expect(messages).toContain('✅ ¡Pago confirmado!');
```

### Edge Cases

```typescript
// Timeout
await sleep(16 * 60 * 1000);  // 16 minutos
expect(booking.status).toBe('EXPIRED');

// Pago duplicado
window.chatWidgetConfirmPayment('booking_123');
window.chatWidgetConfirmPayment('booking_123');  // Debería ignorarse

// Cierre durante pago
widget.close();
// Reserva debe mantenerse hasta expiración
```

## 📈 Métricas Recomendadas

- **Tasa de Conversión de Pago**: `pagos_exitosos / reservas_temporales`
- **Tiempo Promedio de Pago**: Desde `PENDING_PAYMENT` hasta `CONFIRMED`
- **Tasa de Expiración**: `reservas_expiradas / reservas_temporales`
- **Tasa de Cancelación**: `pagos_cancelados / intentos_pago`

## 🎯 Roadmap

- [ ] Retry automático en caso de error de red
- [ ] Guardado de método de pago para próximas reservas
- [ ] Pago en cuotas (ej: 3 cuotas sin interés)
- [ ] Cupones de descuento
- [ ] Reserva sin pago inicial (cobro al finalizar servicio)

---

**Versión**: 1.0.0  
**Última actualización**: 3 de diciembre de 2025
