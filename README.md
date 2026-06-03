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

## Cloud Deployment (Vercel frontend + Render backend)

```
Browser → https://your-app.vercel.app
              ↓  vercel.json rewrites (or VITE_API_URL)
         https://your-api.onrender.com  →  Neon PostgreSQL
```

### 1. PostgreSQL (Neon recommended)

1. Create a project at [Neon](https://neon.tech) (or Supabase / Railway Postgres).
2. Copy the **connection string** (use `?sslmode=require` if Neon requires SSL).
3. You will set it as `DATABASE_URL` on Render.

### 2. Backend on Render

1. [Render Dashboard](https://dashboard.render.com) → **New +** → **Web Service** → connect your GitHub repo.
2. Settings:

| Setting | Value |
|---------|--------|
| **Root Directory** | `backend` |
| **Build Command** | `npm install && npx prisma generate && npm run build` |
| **Start Command** | `npx prisma migrate deploy && node dist/server.js` |
| **Health Check Path** | `/health` |

3. **Environment variables** (Render → Environment):

| Variable | Example / notes |
|----------|-----------------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Neon connection string |
| `GEMINI_API_KEY` | From [Google AI Studio](https://aistudio.google.com/apikey) |
| `JWT_SECRET` | Long random string (32+ characters) |
| `CORS_ORIGIN` | `https://your-app.vercel.app` (exact URL, no trailing `/`) |

Do **not** set `PORT` on Render — Render injects it automatically.

4. Deploy and note your URL, e.g. `https://ai-chatbot-api.onrender.com`.

5. Verify:

```bash
curl https://YOUR-RENDER-URL.onrender.com/health
```

Expect: `{"status":"ok","geminiConfigured":true,"db":"ok",...}`

> Free Render services sleep when idle; the first request after sleep can take 30–60 seconds.

### 3. Frontend on Vercel

1. [Vercel](https://vercel.com) → **Add New Project** → same GitHub repo.
2. Settings:

| Setting | Value |
|---------|--------|
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

3. **Connect to Render (choose one option)**

#### Option A — Vercel proxy (recommended)

Before deploying, edit **`frontend/vercel.json`** and replace `REPLACE_WITH_YOUR_RENDER_URL` with your Render hostname (no `https://`, no trailing slash):

```json
"destination": "https://ai-chatbot-api.onrender.com/api/:path*"
```

See `frontend/vercel.json.example` for a full sample.

- Leave **`VITE_API_URL` unset** on Vercel.
- Browser calls `https://your-app.vercel.app/api/...` and `/socket.io`; Vercel forwards to Render.

#### Option B — Direct backend URL

On Vercel → **Environment Variables**:

| Name | Value |
|------|--------|
| `VITE_API_URL` | `https://YOUR-RENDER-URL.onrender.com` (no trailing slash) |

- Remove or disable `vercel.json` rewrites (delete rewrites or do not commit `vercel.json`).
- Set Render `CORS_ORIGIN` to your Vercel URL (required for browser → Render).

4. Deploy Vercel and copy your site URL, e.g. `https://chat-boat.vercel.app`.

5. **Update Render `CORS_ORIGIN`** to that exact Vercel URL, then redeploy the backend.

### 4. Post-deploy checks

| Check | How |
|-------|-----|
| Backend | `curl https://YOUR-RENDER-URL.onrender.com/health` |
| Login / register | Open Vercel URL |
| Text chat | Send a message |
| Mic voice | Record 2–3 s → Network: `POST .../api/voice/audio` → 200 |
| Live voice | DevTools → WS `socket.io` connected |

### Troubleshooting (Vercel + Render)

| Symptom | Fix |
|---------|-----|
| CORS error in browser | `CORS_ORIGIN` on Render = exact `https://....vercel.app` |
| API 404 on Vercel | Fix `frontend/vercel.json` Render hostname; redeploy Vercel |
| `db: error` on `/health` | Check `DATABASE_URL` and Neon SSL params |
| Slow first load | Render free tier cold start |
| Live voice fails, text OK | Ensure `/socket.io` rewrite exists in `vercel.json` (Option A) |

### PostgreSQL providers

- [Neon](https://neon.tech) — serverless Postgres (good with Render)
- [Supabase](https://supabase.com)
- [Railway](https://railway.app)

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
| `VITE_DEV_API_TARGET` | Dev only: Vite proxy target for `/api` and `/socket.io` | From `backend/.env` `PORT` or `http://127.0.0.1:5000` |
| `VITE_API_URL` | Production: direct Render/Railway origin (Option B). Unset when using `vercel.json` (Option A) | *(unset → same-origin `/api`)* |
| `VITE_CHAT_STREAM` | Set `false` to disable SSE streaming | enabled |

## License

MIT
