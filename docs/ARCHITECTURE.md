# Project Architecture

Full architecture of **HireCheck** — a technical assessment platform for recruiters to create tests, invite candidates, and review results.

**Stack:** React 18 · Vite · TypeScript · Spring Boot 3 · PostgreSQL · Docker · Railway

---

## High-level overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│                                                             │
│   React SPA (wouter routing, React Query, shadcn/ui)        │
│   client/src/                                               │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP /api/*
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Spring Boot (port 8080)                   │
│                                                             │
│   Controllers → Services → Repositories → PostgreSQL        │
│   backend/src/main/java/com/hirecheck/                    │
│                                                             │
│   Also serves React static files from classpath:/static/    │
└──────────────────────────┬──────────────────────────────────┘
                           │ JDBC
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      PostgreSQL                             │
│   Local: AWS RDS (or Railway Postgres in prod)              │
└─────────────────────────────────────────────────────────────┘
```

**One deployable unit:** API + frontend in a single Docker container / JAR.

---

## Repository structure

```
HireCheck/
│
├── client/                  # React frontend
│   ├── index.html
│   └── src/
│       ├── App.tsx          # Route definitions (wouter)
│       ├── main.tsx         # React entry point
│       ├── pages/           # Page components (one per route)
│       ├── components/      # UI, forms, layout, dashboard widgets
│       ├── lib/             # API client, auth helpers, utils
│       └── hooks/           # Custom React hooks
│
├── backend/                 # Spring Boot API
│   ├── pom.xml
│   ├── mvnw
│   └── src/main/
│       ├── java/com/hirecheck/   # All Java source (see BACKEND.md)
│       └── resources/
│           ├── application.properties
│           └── static/          # React build embedded here in prod
│
├── shared/                  # Shared TypeScript schemas
│   └── schema.ts            # Drizzle table defs + Zod validation schemas
│
├── migrations/              # SQL migrations (Drizzle — legacy Express stack)
│
├── docs/                    # Documentation (this folder)
│   ├── ARCHITECTURE.md
│   ├── BACKEND.md
│   └── DEPLOYMENT.md
│
├── Dockerfile               # Multi-stage production build
├── .dockerignore
├── .env.example             # Local env template (never committed/deployed)
├── package.json             # Frontend npm scripts
├── vite.config.ts           # Vite + dev proxy config
├── tsconfig.json            # TypeScript paths (@/*, @shared/*)
├── tailwind.config.ts
├── drizzle.config.ts        # Drizzle Kit config (legacy)
└── README.md
```

---

## User roles and flows

### Recruiter (authenticated)

```
Signup/Login
    → Dashboard (stats, recent activity)
    → Create/Edit Tests (questions: MC, pattern, coding, subjective)
    → Invite Candidates (email or bulk CSV)
    → View Results (scores, responses per candidate)
```

### Candidate (no account needed)

```
Receive invite link: /take-test/{testLink}
    OR self-register via public link: /public-test/{testId}
    → Start test (timer begins, IP recorded)
    → Answer questions (auto-saved)
    → Submit (or auto-submitted when timer expires)
    → Completion page
```

---

## Frontend architecture

### Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 |
| Build tool | Vite 5 |
| Routing | wouter |
| Data fetching | TanStack React Query |
| Forms | react-hook-form + Zod |
| UI | shadcn/ui (Radix primitives) + Tailwind CSS |
| Icons | lucide-react, react-icons |

### Routes (`client/src/App.tsx`)

| Path | Page | Who |
|------|------|-----|
| `/` `/login` | Login | Recruiter |
| `/signup` | Signup | Recruiter |
| `/dashboard` | Dashboard | Recruiter |
| `/tests` | Test list | Recruiter |
| `/tests/create` | Create test | Recruiter |
| `/tests/:id` | View test + candidates | Recruiter |
| `/tests/:id/edit` | Edit test | Recruiter |
| `/candidates` | All candidates | Recruiter |
| `/take-test/:testLink` | Take test | Candidate |
| `/test-complete` | Completion screen | Candidate |
| `/public-test/:testId` | Self-registration | Candidate |
| `*` | 404 | — |

### API communication (`client/src/lib/`)

**`queryClient.ts`** — central HTTP layer:
- `apiRequest(method, url, data?)` — fetch with JSON + `Authorization: Bearer <token>`
- React Query default `queryFn` — GET requests with auth header
- Token read from `localStorage.getItem("token")`

**`auth.ts`** — login/signup/logout/me wrappers around `/api/auth/*`

All API calls use relative paths (`/api/tests`, `/api/candidate/...`) — same origin in prod, proxied in dev.

### Shared schemas (`shared/schema.ts`)

Used by the frontend for form validation and TypeScript types:
- Drizzle table definitions (legacy, used by `drizzle-kit`)
- Zod schemas: `loginSchema`, `insertTestSchema`, `insertQuestionSchema`, etc.
- TypeScript types: `User`, `Test`, `Question`, `Candidate`, `Response`

Spring backend has its own JPA entities — schemas are not shared at runtime, only for frontend validation.

---

## Dev vs production request flow

### Development (two processes)

```
Browser :5173
    │
    │  GET /dashboard          → Vite serves React
    │  GET /api/tests          → Vite proxy → Spring :8080
    │  POST /api/auth/login    → Vite proxy → Spring :8080
    │
    ├── Vite dev server (client/)
    └── Spring Boot (backend/) on :8080
```

Vite proxy config (`vite.config.ts`):
```typescript
proxy: {
  "^/api/.*": {
    target: "http://127.0.0.1:8080",
    changeOrigin: true,
  }
}
```

CORS: Spring allows `FRONTEND_URL=http://localhost:5173`

### Production (one process)

```
Browser :8080  (or Railway URL)
    │
    │  GET /dashboard          → Spring serves static/index.html
    │  GET /api/tests          → Spring REST controller
    │  GET /assets/index.js    → Spring serves static file
    │
    └── Spring Boot JAR
        ├── REST API (/api/*)
        └── React SPA (classpath:/static/)
```

No CORS issue in prod — same origin. `FRONTEND_URL` and `PUBLIC_URL` both point to the Railway domain.

---

## Docker build pipeline

```
Stage 1: frontend-build (node:20-alpine)
  npm ci
  npm run build:frontend
  → dist/public/

Stage 2: backend-build (maven:3.9-temurin-17)
  copy dist/public → src/main/resources/static/
  mvn package -DskipTests
  → hirecheck-backend-1.0.0.jar

Stage 3: runtime (eclipse-temurin:17-jre-alpine)
  java -jar app.jar
  PORT=8080 (overridden by Railway)
```

`.env` is **not** copied into the image. All production config comes from Railway environment variables.

---

## Data model

```
┌──────────┐         ┌──────────┐         ┌────────────┐
│   User   │ creates │   Test   │  has    │  Question  │
│          │────────>│          │────────>│            │
│ id       │         │ id       │         │ id         │
│ username │         │ title    │         │ testId     │
│ password │         │ duration │         │ type       │
│ email    │         │ createdBy│         │ content    │
│ name     │         │          │         │ options    │
│ company  │         └────┬─────┘         │ answer     │
└────┬─────┘              │               └────────────┘
     │ invites            │ has
     │                    ▼
     │              ┌────────────┐         ┌────────────┐
     └─────────────>│ Candidate  │ answers │  Response  │
                    │            │────────>│            │
                    │ id         │         │ id         │
                    │ testLink   │         │ candidateId│
                    │ status     │         │ questionId │
                    │ score      │         │ response   │
                    │ startedAt  │         │ isCorrect  │
                    └────────────┘         └────────────┘
```

**Candidate status lifecycle:**

```
pending → in_progress → completed
              │
              └── (timer expires) → completed (autoSubmitted=true)
```

---

## Security model

```
┌─────────────────────────────────────────────────────────┐
│                    SecurityConfig                        │
│                                                         │
│  Public routes (no token):                              │
│    /api/auth/login, /api/auth/signup                   │
│    /api/candidate/**                                    │
│    /api/public-test/**                                  │
│    /api/imagekit-auth                                   │
│                                                         │
│  Protected routes (JWT required):                       │
│    /api/tests, /api/questions, /api/candidates          │
│    /api/dashboard, /api/auth/me, /api/auth/logout      │
│                                                         │
│  SPA routes (no auth):                                  │
│    /** → static files or index.html fallback           │
└─────────────────────────────────────────────────────────┘
```

JWT stored client-side in `localStorage`. No server sessions. No token blacklist on logout.

---

## External integrations

| Service | Used for | Config vars | Required? |
|---------|----------|-------------|-----------|
| PostgreSQL | All data storage | `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` | Yes |
| EmailJS | Test invitation emails | `EMAILJS_PUBLIC_KEY`, `EMAILJS_PRIVATE_KEY`, `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID` | Optional |
| ImageKit | Question image uploads | `IMAGEKIT_PRIVATE_KEY` | Optional |

---

## Environment configuration summary

```
LOCAL                          PRODUCTION (Railway)
─────                          ────────────────────
.env file                  →   Railway Variables tab
  DB_PASSWORD                    JWT_SECRET
  JWT_SECRET                     FRONTEND_URL
  FRONTEND_URL                   PUBLIC_URL
  PUBLIC_URL                     EMAILJS_* (optional)
                                 IMAGEKIT_* (optional)

                               Railway Postgres (linked service)
                                 PGHOST, PGPORT, PGUSER
                                 PGPASSWORD, PGDATABASE

                               Railway platform
                                 PORT (auto)
```

Spring resolves `${VAR}` placeholders from OS environment variables. Locally, `.env` is also loaded via `spring.config.import`.

---

## Key design decisions

| Decision | Rationale |
|----------|-----------|
| Single JAR deployment | Simpler ops — one process, one port, no separate frontend server |
| JWT stateless auth | No session store needed; works across Railway restarts |
| JPA `ddl-auto=update` | No migration tooling needed for Spring; schema follows entities |
| Plain FK integers (no JPA relations) | Simpler entities; cascade deletes handled manually in controllers |
| Vite proxy in dev | Frontend dev server stays fast; API calls transparently proxied |
| `shared/schema.ts` for frontend only | Zod validation at the UI layer; Spring has its own entity classes |
| Auto-submit scheduler | Prevents candidates from keeping tests open past the time limit |

---

## Related docs

- [DEPLOYMENT.md](./DEPLOYMENT.md) — local dev, Docker, Railway deploy steps
- [BACKEND.md](./BACKEND.md) — Spring Boot API, auth, services, endpoints in detail
