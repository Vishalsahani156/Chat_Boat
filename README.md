# AI Chatbot - Production Ready

A full-stack AI-powered chatbot application built with React, Express, and Google Gemini. Features real-time messaging, voice interaction, persistent chat history, and containerized deployment.

## Features

- AI-powered chatbot with Google Gemini integration
- Real-time messaging with Socket.io
- Voice input (Speech-to-Text) and voice output (Text-to-Speech)
- Chat history stored in PostgreSQL
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
# Edit .env with your GEMINI_API_KEY and DATABASE_URL
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

The backend server starts at `http://localhost:5000`.

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server starts at `http://localhost:5173`.

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
   - `CORS_ORIGIN` - Frontend URL (e.g., `https://your-app.vercel.app`)
   - `PORT` - `5000`

### PostgreSQL

Use a managed PostgreSQL provider:
- [Neon](https://neon.tech) - Serverless Postgres
- [Supabase](https://supabase.com) - Open source Firebase alternative
- [Railway](https://railway.app) - Simple cloud hosting

Update `DATABASE_URL` in your backend environment with the connection string from your provider.

## API Endpoints

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send a message and receive AI response |
| GET | `/api/chat/history` | List all conversations |
| GET | `/api/chat/history/:id` | Get a single conversation with messages |
| POST | `/api/voice-chat` | Send voice-transcribed text, get AI response |
| DELETE | `/api/chat/history/:id` | Delete a conversation |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check endpoint |

### WebSocket Events

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
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |
| `NODE_ENV` | Environment mode | `development` |

### Frontend

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:5000` |

## License

MIT
# Chat_Boat
