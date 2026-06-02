# AI Chatbot - Production Ready

A full-stack AI-powered chatbot application built with React, Express, and Google Gemini. Features real-time messaging, voice interaction, persistent chat history, and containerized deployment.

## Features

- AI-powered chatbot with Google Gemini integration
- Real-time messaging with Socket.io
- Push-to-talk voice (any language): record audio → **Gemini speech-to-text** (not Whisper) → voice-optimized Gemini reply → server TTS playback (free Edge TTS; browser fallback if synthesis fails)
- Live voice mode via Socket.IO (streamed text + spoken reply, same Gemini STT + voice prompts)
- Optional `VOICE_SINGLE_CALL=true` for push-to-talk: one Gemini request for transcribe + reply (lower latency)
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

## Troubleshooting: text chat works, voice does not

Voice uses **extra steps** beyond text chat: microphone capture, audio upload or WebSocket, **Gemini speech-to-text**, then the same AI reply + optional TTS.

| Symptom | Likely cause | What to do |
|--------|----------------|------------|
| Red error: cannot reach server | Backend not running or wrong port | `cd backend && npm run dev` — expect `Server running on port 5000`. `curl http://localhost:5000/health` |
| Vite: `ws proxy socket error: ECONNRESET` | Socket.IO cannot reach backend | Stop duplicate processes on `:5000` (`ss -tlnp \| grep 5000`). Restart backend, then frontend |
| Live voice fails, mic may work | WebSocket only used for Live voice | Ensure logged in (JWT in socket handshake). Refresh after backend restart |
| “Could not understand audio” | Recording too short or STT failed | Speak 2–3 seconds; check backend log for `Gemini transcription error` |
| “Too many voice requests” | Rate limit | Wait 1 minute (`VOICE_RATE_LIMIT_PER_MIN`, default 20/min) |
| Text works, voice always 503 | Gemini key/model issue on **audio** API | Valid `GEMINI_API_KEY` in `backend/.env`; try `GEMINI_MODEL=gemini-2.5-flash-lite` |

**Mic (push-to-talk):** chat input mic → `POST /api/voice/audio` (check Network tab).

**Live voice:** header “Live” → Socket.IO `voiceStart` / `voiceChunk` / `voiceEnd` (check WS tab).

**Note:** `Whisper_api_key` in `.env` is **not used**. Speech-to-text is handled by Gemini only.

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
| `GEMINI_API_KEY` | Google Gemini API key (required at startup) | - |
| `GEMINI_MODEL` | Gemini model id | `gemini-2.5-flash-lite` |
| `GEMINI_RETRY_MAX` | Retries on quota/rate-limit errors | `3` |
| `VOICE_SINGLE_CALL` | Push-to-talk: one Gemini call for STT + reply | `false` |
| `VOICE_MAX_BYTES` | Max voice upload size | `10485760` |
| `JWT_SECRET` | Secret key for signing JWTs (required for `/api/auth` and protected routes) | - |
| `JWT_EXPIRES_IN` | Access token lifetime (e.g. `7d`, `24h`) | `7d` |
| `CORS_ORIGIN` | Comma-separated allowed browser origins (required in production) | `http://localhost:5173` |
| `NODE_ENV` | Environment mode | `development` |
| `TTS_VOICE_DEFAULT` | Edge TTS voice id, or `auto` to pick by detected language | `auto` |
| `VOICE_RATE_LIMIT_PER_MIN` | Max voice uploads per user per minute | `20` |

### Production CORS and proxy

When `NODE_ENV=production`, only origins listed in `CORS_ORIGIN` are allowed (no wildcard localhost). For Docker Compose, the default includes `http://localhost` (port 80) and Vite dev ports. For a custom domain, set e.g. `CORS_ORIGIN=https://your-domain.com`.

`GET /health` returns `{ status, geminiConfigured, db, timestamp }` for load balancers and ops checks.

### Text-to-speech (no Google Cloud)

Voice replies use **Microsoft Edge online TTS** via the [`edge-tts-universal`](https://www.npmjs.com/package/edge-tts-universal) package. No `GOOGLE_CLOUD_PROJECT_ID`, service account JSON, or paid Google Cloud APIs are required. The backend needs outbound HTTPS/WebSocket access to Microsoft’s speech service.

If server synthesis fails, the frontend still speaks replies using the browser **Speech Synthesis** API (`frontend/src/utils/audioPlayback.ts`).

Remove any legacy variables from `backend/.env`:

- `GOOGLE_CLOUD_PROJECT_ID`
- `GOOGLE_APPLICATION_CREDENTIALS`

Optional override: set `TTS_VOICE_DEFAULT` to a specific neural voice (e.g. `en-US-JennyNeural`) or leave `auto`.

### Frontend

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:5000` |

## License

MIT
# Chat_Boat
