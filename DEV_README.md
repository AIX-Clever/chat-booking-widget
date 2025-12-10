# Chat Booking Widget - Desarrollo

Widget embebible de React + TypeScript para el sistema de reservas conversacional.

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Desarrollo
npm start
# Abre http://localhost:3000

# Build para producción
npm run build
# Genera dist/chat-widget.js

# Tests
npm test

# Linting
npm run lint

# Type check
npm run type-check
```

## 📁 Estructura

```
src/
├── components/          # Componentes React
│   ├── ChatLauncher.tsx    # Botón flotante
│   ├── ChatWindow.tsx      # Ventana del chat
│   ├── MessageList.tsx     # Lista de mensajes
│   ├── MessageInput.tsx    # Input de mensajes
│   ├── ServiceChips.tsx    # Chips de servicios
│   └── TimeSlotPicker.tsx  # Selector de horarios
├── hooks/              # Custom hooks
│   ├── useChat.ts         # Lógica del chat
│   └── useWidget.ts       # Lógica del widget
├── graphql/            # Cliente GraphQL
│   ├── client.ts          # Cliente singleton
│   ├── queries.ts         # Queries y mutations
│   └── api.ts             # Funciones API
├── types/              # TypeScript types
│   └── index.ts           # Todas las interfaces
├── styles/             # Estilos y tema
│   └── theme.ts           # MUI theme
├── WidgetApp.tsx       # Componente principal
└── index.ts            # Entry point + API pública
```

## 🎯 Características Implementadas

✅ Configuración base (TypeScript, Webpack, ESLint, Jest)
✅ Tipos TypeScript completos
✅ Cliente GraphQL con queries y mutations
✅ Componentes React principales
✅ Hooks personalizados (useChat, useWidget)
✅ API pública window.ChatAgentWidget
✅ Sistema de theming con MUI
✅ Página de demo para desarrollo

## 🔌 Uso

### Integración con script tag

```html
<script src="https://cdn.chat-booking.com/chat-widget/latest/chat-widget.js"
        data-tenant-id="TENANT_123"
        data-public-key="pk_live_xxx"
        data-language="es"
        data-position="right"
        data-theme-color="#e91e63"></script>
```

### API Programática

```javascript
// Inicializar
ChatAgentWidget.init({
  tenantId: 'demo-tenant',
  publicKey: 'pk_test_xxx',
  primaryColor: '#e91e63',
  position: 'bottom-right',
  autoOpen: false,
  onReady: () => console.log('Widget listo'),
  onBookingCreated: (booking) => console.log('Reserva:', booking)
});

// Métodos
ChatAgentWidget.open();
ChatAgentWidget.close();
ChatAgentWidget.toggle();
ChatAgentWidget.sendMessage('Hola');
ChatAgentWidget.isOpen();

// Eventos
ChatAgentWidget.on('booking:created', (booking) => {
  console.log('Nueva reserva:', booking);
});
```

## 🧪 Testing

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm test -- --coverage
```

## 📦 Build

```bash
# Production build
npm run build

# Genera:
# - dist/chat-widget.js (UMD bundle)
# - dist/chat-widget.js.map (source map)
```

## 🔗 Próximos Pasos

1. **Implementar backend mock** para desarrollo local
2. **Agregar tests unitarios** para componentes
3. **Implementar E2E tests** con Playwright
4. **Optimizar bundle size** (code splitting si es necesario)
5. **Agregar más idiomas** (inglés, portugués)
6. **Implementar modo offline** con cache
7. **Agregar analytics** internos
8. **Documentar todos los eventos**

## 📚 Documentación

Ver `/chat-booking-docs/widget/` para documentación completa:
- README.md - Guía principal
- api-reference.md - Referencia de API
- embedding-guide.md - Guías de integración

## 🐛 Debug

Habilitar modo debug:

```javascript
ChatAgentWidget.init({
  tenantId: 'xxx',
  publicKey: 'xxx',
  debug: true  // Muestra logs en consola
});
```

## 📄 Licencia

Privado - Chat Booking SaaS
