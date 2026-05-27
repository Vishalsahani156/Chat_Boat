# AI Chatbot - Production Ready

A full-stack AI-powered chatbot application built with React, Express, and Google Gemini. Features real-time messaging, voice interaction, persistent chat history, and containerized deployment.

## Features

- AI-powered chatbot with Google Gemini integration
- Real-time messaging with Socket.io
- Push-to-talk voice (any language): record audio → Gemini STT → AI reply → TTS playback
- Live voice mode via Socket.IO (streamed text + spoken reply)
- Streaming text chat (SSE) for ChatGPT-style incremental replies
- Chat history stored in PostgreSQL
- User authentication (register/login), bcrypt hashed passwords, JWT for APIs and Socket.IO
- Dark mode support
- Mobile responsive design
- Docker containerized deployment
- Low token usage optimization

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Express, TypeScript, Socket.io |
| Database | PostgreSQL, Prisma ORM |
| AI | Google Gemini API |
| Containerization | Docker, Docker Compose, Nginx |

## Project Structure

```
ai-chatbot/
├── frontend/               # React + Vite application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   └── App.tsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── backend/                # Express + TypeScript API
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   └── server.ts
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

## Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Google Gemini API Key
- Docker & Docker Compose (optional, for containerized deployment)

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd ai-chatbot
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your GEMINI_API_KEY, DATABASE_URL, and JWT_SECRET (required for auth tokens)
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

**Important:** Run these Prisma commands **from `backend/`** (or use `npm run prisma:migrate` from the **repo root** — see root `package.json`). If you run `npx prisma` from the repo root, npm may install **Prisma 7**, which errors with *“The datasource property `url` is no longer supported”* (P1012). This project uses **Prisma 6**; the CLI in `backend/node_modules` matches the schema.

The backend server starts at `http://localhost:5000`.

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server starts at `http://localhost:5173` (or the next free port, e.g. `5174`).

**API proxy:** Vite forwards `/api` and `/socket.io` to the backend. By default it uses `PORT` from `backend/.env`, or `http://127.0.0.1:5000` if that file is missing. If you run the API with **Docker Compose** (host port **5000**) but your `backend/.env` has a different `PORT` (e.g. `3000`), create `frontend/.env` from `frontend/.env.example` and set `VITE_DEV_API_TARGET=http://127.0.0.1:5000` so the proxy matches the running API. Otherwise you may see `ECONNREFUSED` in the Vite terminal and HTTP 500 / failed WebSocket handshakes in the browser.

**Port already in use (`EADDRINUSE :::5000`):** Another process is already listening on `5000` — often a previous `npm run dev` in another terminal, or Docker `backend`. Use only one: stop the other tab (`Ctrl+C`) or stop the container. To see what owns the port: `ss -tlnp | grep 5000`. To switch the dev API to another port instead, set `PORT=5001` (example) in `backend/.env` and restart Vite so it re-reads the proxy target; avoid running two backends at once.

### 4. Open the app

Navigate to [http://localhost:5173](http://localhost:5173) in your browser.

## Docker Deployment

Deploy the entire stack with a single command:

```bash
# Set your API key
export GEMINI_API_KEY=your-key-here

# Build and run all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

Once running, open [http://localhost](http://localhost) in your browser.

### Backend and Postgres only (Docker)

Keep the database and API in containers; run the UI with `cd frontend && npm run dev` at [http://localhost:5173](http://localhost:5173) (Vite proxies `/api` and `/socket.io` to port 5000).

```bash
export GEMINI_API_KEY=your-key-here
docker compose up -d --build postgres backend
```

API: `http://localhost:5000` — try `GET http://localhost:5000/health`. The container runs `npx prisma migrate deploy` before starting Node.

### Build the backend image only

```bash
docker build -t chatbot-backend ./backend
```

Running that image by itself needs a reachable `DATABASE_URL` (for example Postgres on the host using `host.docker.internal` on Docker Desktop).

### Docker Services

| Service | Port | Description |
|---------|------|-------------|
| frontend | 80 | Nginx serving React build |
| backend | 5000 | Express API server |
| postgres | 5432 | PostgreSQL database |

## Cloud Deployment

### Frontend on Vercel

1. Connect your GitHub repository
2. Set root directory to `frontend`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variable: `VITE_API_URL` = your backend URL

### Backend on Render/Railway

1. Connect your GitHub repository
2. Set root directory to `backend`
3. Build command: `npm install && npx prisma generate && npm run build`
4. Start command: `npx prisma migrate deploy && node dist/server.js`
5. Add environment variables:
   - `DATABASE_URL` - PostgreSQL connection string
   - `GEMINI_API_KEY` - Google Gemini API key
   - `JWT_SECRET` - Long random string for JWT signing
   - `CORS_ORIGIN` - Frontend URL (e.g., `https://your-app.vercel.app`)
   - `PORT` - `5000`

### PostgreSQL

Use a managed PostgreSQL provider:
- [Neon](https://neon.tech) - Serverless Postgres
- [Supabase](https://supabase.com) - Open source Firebase alternative
- [Railway](https://railway.app) - Simple cloud hosting

Update `DATABASE_URL` in your backend environment with the connection string from your provider.

## API Endpoints

### Authentication

Register requires **username** (`name`, letters and numbers only, max **12 characters**), **email**, and **password** (**4–8 characters**).

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Create account; returns `{ user, token }` |
| POST | `/api/auth/login` | No | Email + password; returns `{ user, token }` |
| GET | `/api/auth/me` | Yes (`Bearer`) | Current user profile |

Use JWT on subsequent requests:

```http
Authorization: Bearer <token-from-register-or-login>
```

### Chat

All chat routes require the `Authorization: Bearer <jwt>` header. Responses only include **that user’s** conversations.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send a message and receive AI response |
| POST | `/api/chat/stream` | Stream AI response (SSE) |
| GET | `/api/chat/history` | List all conversations |
| GET | `/api/chat/history/:id` | Get a single conversation with messages |
| POST | `/api/voice/audio` | Upload audio (multipart), language-auto STT + AI + TTS |
| POST | `/api/voice-chat` | Legacy: send pre-transcribed text |
| DELETE | `/api/chat/history/:id` | Delete a conversation |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check endpoint |

### WebSocket Events

The Socket.IO handshake must include a valid JWT: either `auth: { token: '<jwt>' }` or header `Authorization: Bearer <jwt>`.

| Event | Direction | Description |
|-------|-----------|-------------|
| `sendMessage` | Client → Server | Send a chat message |
| `newMessage` | Server → Client | Receive AI response |
| `error` | Server → Client | Error notification |

## Environment Variables

### Backend

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `GEMINI_API_KEY` | Google Gemini API key | - |
| `JWT_SECRET` | Secret key for signing JWTs (required for `/api/auth` and protected routes) | - |
| `JWT_EXPIRES_IN` | Access token lifetime (e.g. `7d`, `24h`) | `7d` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |
| `NODE_ENV` | Environment mode | `development` |

### Frontend

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:5000` |

## License

MIT
# Chat_Boat
