# AI Ticket It

Plataforma de venta de entradas para eventos (TP Individual DDSW 2C 2026).

- **Backend:** Node.js + Express (persistencia en memoria)
- **Frontend:** React Native con Expo (JavaScript)

## Requisitos

- Node.js 20+
- Expo Go en el celular (opcional) o emulador Android/iOS

## Arranque

### Backend

```bash
cd backend
npm install
npm start
```

API en `http://localhost:3001`.

Opcional: `JWT_SECRET=tu-secreto` (si no se define, usa un secret de desarrollo).

Usuarios seed (documentados acá; en el store se guardan **hasheadas** con bcrypt):

| Email | Password | Roles |
| --- | --- | --- |
| ana@ticket.it | ana123 | COMPRADOR |
| luis@ticket.it | luis123 | ORGANIZADOR |
| maria@ticket.it | maria123 | COMPRADOR, ORGANIZADOR |

**Auth:** `Authorization: Bearer <JWT>` (HS256, expira en 8h). El login ya no devuelve el `userId` como token.

`GET /api/auth/seed-users` lista usuarios demo **sin passwords** y solo si `NODE_ENV !== 'production'` (o `ENABLE_SEED_USERS=true`).

Smoke test del flujo principal (con el backend corriendo):

```bash
cd backend
npm run smoke
```

### Frontend

```bash
cd frontend
npm install
npm start
```

Configurá la URL del API en `frontend/src/api/config.js`:

- Emulador Android: `http://10.0.2.2:3001`
- iOS Simulator / web: `http://localhost:3001`
- Dispositivo físico: `http://<IP-LAN-de-tu-PC>:3001`

## Estructura

```
backend/src/
  auth/ domain/ repositories/ services/ controllers/ routes/ middleware/ seed/
frontend/src/
  api/ context/ navigation/ screens/ components/
```
