# AI-Powered Portfolio

RAG-grounded, AI-first developer portfolio — Next.js frontend + FastAPI backend + Supabase/Postgres. An AI assistant answers visitor questions (recruiter, client, student) strictly from your own data (`data/linkedin.txt`, `data/github.json`, Supabase content), with citations and confidence scores.

## Features

- **Portfolio site** — home, about, projects, blogs, timeline, resume, contact, admin dashboard
- **AI assistant** — Gemini-powered (pluggable: OpenAI / Claude / OpenRouter / Ollama), grounded in local knowledge base + Supabase, with domain classifier, validator, and citation enforcement
- **GitHub auto-sync** — sync repos/README/stars into Supabase + local `data/github.json` (manual admin trigger + Vercel cron)
- **Knowledge watcher** — backend auto-refreshes when `data/` files change in development
- **Production hardening** — security headers, global error handling, rate limiting, sensitive-data log scrubber, analytics middleware, health (`/health`) + readiness (`/ready`) probes
- **Supabase schema** — projects, experience, education, skills, blogs, publications, certificates, FAQs, timeline, GitHub repos, conversations/messages, with Row Level Security

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, TanStack Query, react-hook-form + Zod, Recharts, Shiki, lucide-react, next-themes, Vitest |
| Backend | FastAPI, Uvicorn, Pydantic Settings, SQLAlchemy + psycopg, Alembic, Supabase, google-generativeai, httpx, pytest + ruff |
| Data / Infra | Supabase Postgres, Docker + docker-compose (postgres:15, backend, frontend), Vercel-ready frontend |

## Repo structure

```
.
├── frontend/            # Next.js app (src/app, lib/ai, scripts/sync-data.mjs)
├── backend/             # FastAPI app (app/api/v1, app/services, app/core, migrations)
├── supabase/schema.sql  # Full Postgres schema + RLS policies
├── data/                # Canonical knowledge sources (linkedin.txt, github.json)
├── docker/              # backend + frontend Dockerfiles
├── docker-compose.yml   # Local postgres + backend + frontend
└── setup.ps1            # Windows dev bootstrap (venv + pnpm install)
```

## Quickstart

### Option A — Docker (recommended for full stack)

```bash
docker compose up --build
# frontend → http://localhost:3000
# backend → http://localhost:8000/health, docs at /api/v1/openapi.json
# postgres → localhost:5432 (user: postgres / password: password, db: portfolio)
```

### Option B — Local dev

```bash
# 1. Bootstrap (Windows)
.\setup.ps1

# 2. Backend
Copy-Item backend\.env.example backend\.env   # then fill GEMINI_API_KEY, SUPABASE_URL/KEY
cd backend
.\.venv\Scripts\uvicorn.exe app.main:app --reload
# → http://localhost:8000/health

# 3. Frontend (new terminal, repo root)
pnpm --filter frontend dev
# → http://localhost:3000
```

Monorepo shortcuts from root: `pnpm run dev:frontend`, `pnpm run dev:backend`, `pnpm run test:backend`, `pnpm run lint:backend`.

## Environment variables

Backend (`backend/.env`, see `backend/.env.example`):

```
ENVIRONMENT=development
DATABASE_URL=                          # empty → SQLite memory; set postgres://… for Supabase/local pg
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
GITHUB_ACCESS_TOKEN=                   # optional, raises API rate limit for sync
GITHUB_USERNAME=MohammedHabibQureshi
LLM_PROVIDER=gemini                    # gemini | openai | claude | openrouter | ollama
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY= / CLAUDE_API_KEY= / OPENROUTER_API_KEY=
OLLAMA_BASE_URL=http://localhost:11434
```

Frontend (Vercel or `.env.local`): `GEMINI_API_KEY`, `GITHUB_ACCESS_TOKEN`, `CRON_SECRET`, `ADMIN_SECRET`, `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1`.

Never commit real `.env` files — root `.gitignore` already excludes `.env*`, `*.db`, `venv/`, `node_modules/`, and the root `linkedIn_info.txt` scrape dump.

## API overview

- `GET /health`, `GET /ready` — liveness / readiness
- `/api/v1/portfolio/*` — projects, experience, skills, blogs, FAQs, timeline
- `/api/v1/ai/*` — grounded chat + confidence/citations
- `/api/v1/admin/*`, `/api/v1/admin/media/*` — admin CRUD + GitHub sync + media

## Deployment

- **Frontend → Vercel**: set env vars in dashboard, `prebuild` auto-runs `scripts/sync-data.mjs`.
- **Backend → any Python host / Docker**: build `docker/backend.Dockerfile`, set `DATABASE_URL` + `SUPABASE_*` + `GEMINI_API_KEY`.
- **DB → Supabase**: apply `supabase/schema.sql`, enable RLS (included).

## License

Private portfolio project — all rights reserved unless stated otherwise.
