# Widget Frontend — Embeddable Chat Widget

Este repositorio contiene el widget JavaScript embebible que se integra en los sitios de los clientes.

## 📁 Estructura del proyecto

```
widget-frontend/
├── src/
│   ├── index.ts             # Entry point
│   ├── components/
│   │   ├── ChatLauncher.tsx
│   │   ├── ChatWindow.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageInput.tsx
│   │   ├── ServiceChips.tsx
│   │   └── TimeSlotPicker.tsx
│   ├── graphql/
│   │   ├── client.ts
│   │   ├── queries.ts
│   │   └── mutations.ts
│   ├── hooks/
│   │   ├── useChat.ts
│   │   └── useWidget.ts
│   ├── types/
│   │   └── index.ts
│   └── styles/
│       └── theme.ts
│
├── public/
│   └── index.html
│
├── dist/                    # Build output
│
├── package.json
├── tsconfig.json
├── webpack.config.js
└── .env.example
```

## 🛠️ Desarrollo local

```bash
npm install
npm start          # Dev server en http://localhost:3000
npm run build      # Build para producción
npm test           # Ejecutar tests
```

## 📦 Build

```bash
npm run build

# Genera:
# - dist/chat-widget.js
# - dist/chat-widget.css
```

## 🚀 Deploy

```bash
# Upload a S3
aws s3 sync dist/ s3://chat-booking-widget-prod/latest/

# Invalidar CloudFront
aws cloudfront create-invalidation --distribution-id DIST_ID --paths "/*"
```

## 📚 Documentación

- [Widget Integration Guide](../plan/widget/README.md)
- [API Reference](../plan/widget/api-reference.md)
- [Embedding Guide](../plan/widget/embedding-guide.md)
