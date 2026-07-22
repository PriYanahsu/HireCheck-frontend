# Deployment Guide

How to run and deploy **HireCheck** locally, with Docker, and on Railway.

---

## What gets deployed

One process serves everything:

| Path | Served by |
|------|-----------|
| `/api/*` | Spring Boot REST API |
| `/*` | React SPA (static files + client-side routing) |

The production Docker image is built from the root `Dockerfile` in three stages:

1. **frontend-build** — `npm ci` + `npm run build:frontend` → `dist/public/`
2. **backend-build** — copies frontend into `classpath:/static/`, runs `mvn package`
3. **runtime** — `java -jar app.jar` on port 8080

---

## Environment variables

### How local vs production works

Your local `.env` file **never ships to production**. The Docker image only contains the JAR — no `.env`.

| Source | When | What it provides |
|--------|------|------------------|
| `.env` (project root) | Local dev only | `DB_PASSWORD`, `JWT_SECRET`, `FRONTEND_URL`, `PUBLIC_URL` |
| Railway Variables tab | Production | `JWT_SECRET`, `FRONTEND_URL`, `PUBLIC_URL`, optional email/image keys |
| Railway Postgres (linked) | Production | `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` |
| Railway platform | Production | `PORT` (auto-injected) |

Spring reads variables via `application.properties` placeholders like `${JWT_SECRET}`. Locally, it also imports `.env`:

```properties
spring.config.import=optional:file:${user.dir}/../.env[.properties]
```

On Railway there is no `.env` in the container — only Railway's environment variables matter.

### Variable reference

| Variable | Required | Local example | Production example |
|----------|----------|---------------|-------------------|
| `DB_PASSWORD` | Local only | `your-password` | Not needed if Railway Postgres is linked |
| `JWT_SECRET` | Yes | random 32+ char string | same, set in Railway dashboard |
| `FRONTEND_URL` | Yes | `http://localhost:5173` | `https://your-app.up.railway.app` |
| `PUBLIC_URL` | Yes | `http://localhost:8080` | `https://your-app.up.railway.app` |
| `PGHOST` | Auto (Railway) | falls back to RDS host in properties | injected by linked Postgres |
| `PGPORT` | Auto | `5432` | injected |
| `PGUSER` | Auto | `postgres` | injected |
| `PGPASSWORD` | Auto | — | injected |
| `PGDATABASE` | Auto | `jobsearchdb` | injected |
| `PORT` | Auto (Railway) | `8080` | injected by Railway |
| `EMAILJS_*` | Optional | — | invitation emails |
| `IMAGEKIT_PRIVATE_KEY` | Optional | — | image uploads |

> **Note:** This project does **not** use `DATABASE_URL`. Spring builds the JDBC URL from `PGHOST` + `PGPORT` + `PGUSER` + `PGPASSWORD` + `PGDATABASE`. The `DATABASE_URL` in `drizzle.config.ts` is leftover from the old Express stack.

### Local setup

```bash
cp .env.example .env
# Edit .env with your values
```

---

## Local development

Two terminals — frontend and backend run separately.

**Terminal 1 — Spring Boot (port 8080):**

```bash
cd backend
./mvnw spring-boot:run
```

**Terminal 2 — Vite frontend (port 5173):**

```bash
npm install
npm run dev
```

Open http://localhost:5173

Vite proxies all `/api/*` requests to `http://127.0.0.1:8080` (see `vite.config.ts`).

---

## Local production test (Docker)

Test the full production build before deploying:

```bash
# Build image
docker build -t HireCheck .

# Run with your local env
docker run -p 8080:8080 --env-file .env HireCheck
```

Open http://localhost:8080 — same origin for API and SPA.

---

## Railway deployment

### Prerequisites

```bash
npm i -g @railway/cli
railway login
```

### First-time setup

1. **Create project** — Railway dashboard → New Project → Empty Project (or connect GitHub)
2. **Link CLI** — from project root:
   ```bash
   cd /path/to/HireCheck-Full-Stack-
   railway link
   ```
3. **Add PostgreSQL** — dashboard → + New → Database → PostgreSQL → link to your app service
4. **Set variables** — app service → Variables:
   ```
   JWT_SECRET=<strong-random-secret>
   FRONTEND_URL=https://your-app.up.railway.app
   PUBLIC_URL=https://your-app.up.railway.app
   ```
   Get your URL: `railway domain`
5. **First deploy:**
   ```bash
   railway up
   ```

### Redeploy after code changes

**Use `railway up` — not `railway redeploy`.**

| Command | What it does |
|---------|--------------|
| `railway up` | Uploads code, rebuilds Docker image, deploys **new changes** |
| `railway redeploy` | Restarts the **previous** deployment — no new code |
| `git push` | Auto-deploy if GitHub is connected to Railway |
| `docker build` (local) | Builds on your machine only — does **not** affect Railway |

```bash
cd /path/to/HireCheck-Full-Stack-
railway up
```

Or with GitHub connected:

```bash
git add .
git commit -m "describe your change"
git push
```

### Verify deployment

```bash
railway logs          # live application logs
railway logs --build  # build-time logs
railway status        # deployment status
railway open          # open in browser
```

In the Railway dashboard → Deployments, a successful deploy shows Maven + Vite build steps with a new timestamp.

Hard refresh the browser after deploy: `Ctrl+Shift+R` (cached frontend assets can hide changes).

### Redeploy without code changes

Use this after updating environment variables only:

```bash
railway redeploy
```

Or redeploy from the Railway dashboard after saving new variables.

---

## Common issues

| Problem | Cause | Fix |
|---------|-------|-----|
| Changes not visible | Used `railway redeploy` instead of `railway up` | Run `railway up` or `git push` |
| `reqwest error / operation timed out` after upload | CLI lost connection; upload may have succeeded | Check build logs URL or Railway dashboard |
| App crashes on start | Missing `JWT_SECRET` | Set in Railway Variables |
| DB connection error | Postgres not linked | Link Postgres service; verify `PGHOST` etc. appear in Variables |
| CORS errors | Wrong `FRONTEND_URL` | Must exactly match your Railway domain |
| Old frontend showing | Browser cache | Hard refresh `Ctrl+Shift+R` |
| Local `.env` not working in prod | `.env` is not deployed | Set vars in Railway dashboard |

---

## Quick reference

```bash
# Local dev
cd backend && ./mvnw spring-boot:run    # terminal 1
npm run dev                              # terminal 2

# Deploy new code to Railway
railway up

# Watch logs
railway logs

# Open live app
railway open
```
