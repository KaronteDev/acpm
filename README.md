# ACPM — Altas Capacidades Project Manager

Sistema de gestión de proyectos informáticos diseñado específicamente para equipos con Altas Capacidades Cognitivas (AACC).

## Stack Tecnológico

*   **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
*   **Backend API**: Node.js + Fastify + TypeScript
*   **Base de Datos**: PostgreSQL 16 + JSONB
*   **Caché / RT**: Redis 7
*   **Auth**: JWT + bcrypt
*   **WebSockets**: Socket.io (tiempo real)

## Estructura del Proyecto

```
acpm/
├── backend/          # API Fastify + Node.js
│   ├── src/
│   │   ├── routes/   # Rutas de la API
│   │   ├── models/   # Modelos de datos
│   │   ├── services/ # Lógica de negocio
│   │   ├── middleware/ # Auth, validación
│   │   └── db/       # Conexión BD + migrations
│   └── package.json
├── frontend/         # Next.js 14
│   ├── src/
│   │   ├── app/      # App Router
│   │   ├── components/ # Componentes UI
│   │   ├── lib/      # Utilidades, API client
│   │   └── types/    # TypeScript types
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Inicio Rápido

```
# 1. Levantar servicios de BD
docker-compose up -d postgres redis

# 2. Backend
cd backend && npm install && npm run migrate && npm run dev

# 3. Frontend
cd frontend && npm install && npm run dev
```

La app estará disponible en: http://localhost:3000  
API en: http://localhost:3001