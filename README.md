# HireCheck — Frontend

A technical assessment platform for hiring teams. Recruiters build timed tests, invite
candidates by email or spreadsheet, and watch results come in. Candidates open a single link —
no account needed — and take the test in a proctored, fullscreen session.

**Backend:** https://github.com/PriYanahsu/HireCheck-backend · **API:** https://hirecheck-backend-18ms.onrender.com

---

## What it does

**For recruiters**

- **Build a test.** Title, description, time limit, passing score, and an option to shuffle
  question order per candidate.
- **Write questions of four types** — multiple choice, pattern recognition (image based), coding
  (starter snippet plus input/output test cases), and subjective (with grading guidelines). Each
  question carries its own point value.
- **Import questions in bulk** by pasting a JSON array, rather than one form at a time.
- **Invite candidates** one at a time, or upload an Excel sheet and invite a whole batch. Rows
  are validated in the browser first, so bad emails and phone numbers are shown before anything
  is sent.
- **Share a public link** that lets candidates register themselves for a test.
- **Track everything.** A dashboard of active tests, pending and completed assessments, recent
  activity, and top-performing tests; a candidates page with search and status tabs; and an
  analytics page with score charts and pass rates.

**For candidates**

- Open a unique link, read the instructions, and start when ready.
- Answer one question at a time; every answer is saved as it changes.
- Fullscreen is enforced, leaving the tab is counted, and the test submits itself when time
  runs out.

---

## System architecture

```
   ┌────────────────────────────────────────────────────┐
   │  Browser  ·  React 18 SPA (Vite build)             │
   │                                                    │
   │  Recruiter app ── JWT in Authorization header      │
   │  Candidate app ── unique test link, no account     │
   └──────────┬──────────────────────────┬──────────────┘
              │ fetch /api/*             │ direct upload
              │ (TanStack Query)         │ (signed by the API)
              ▼                          ▼
   ┌──────────────────────────┐   ┌──────────────────┐
   │  Spring Boot REST API    │   │  ImageKit CDN    │
   │  auth · tests · scoring  │   │  question images │
   │  invites · stats         │   └──────────────────┘
   └──────┬────────────┬──────┘
          │            │
          ▼            ▼
   ┌────────────┐  ┌──────────┐
   │ PostgreSQL │  │ EmailJS  │
   │            │  │ invites  │
   └────────────┘  └──────────┘

   Hosting: Vercel (static SPA)  ·  Render (API)
```

The frontend is a static bundle. It holds no secrets and makes no decisions that matter:
the answer key, the score, and the deadline all live on the server. The browser's job is to
present the test, capture answers quickly, and make it hard to wander off mid-test.

---

## The one idea worth knowing

There are two very different users, and they are trusted in two very different ways.

**Recruiters** have accounts. They log in, get a JWT, and every request they make is tied to
them — the API only ever returns tests, candidates and stats that the recruiter created.

**Candidates** have no account at all. Their identity *is* the link: a random 10-character ID
in `/take-test/:testLink`. That keeps the experience to one click from an email, and it means
the candidate side of the app is built around a single rule — **never send the candidate
anything they could use to cheat.** The API strips the correct answer from every question
before it reaches the browser, grades each answer on the server, and records when the test
started so the time limit can't be extended by refreshing the page.

The frontend's proctoring (fullscreen, tab tracking, a countdown) is there to discourage
cheating. The server is what actually prevents it.

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | React 18 | Component model fits a form-heavy dashboard |
| Language | TypeScript | Typed API shapes shared across pages |
| Build tool | Vite 5 | Fast dev server, `/api` proxy, hashed production assets |
| Routing | wouter | Tiny (≈2 KB) router; the app has a dozen flat routes |
| Server state | TanStack Query v5 | Caching, mutations and cache invalidation for every API call |
| Forms | react-hook-form + Zod | Schema-driven validation with typed form values |
| UI kit | shadcn/ui on Radix UI | Accessible primitives (dialogs, tabs, selects) owned in-repo |
| Styling | Tailwind CSS + CSS variables | Design tokens in `index.css`, light and dark palettes |
| Charts | Recharts | Score and performance charts on the dashboard and analytics page |
| Spreadsheets | SheetJS (`xlsx`) | Parse `.xlsx` / `.xls` candidate lists in the browser |
| Images | ImageKit (`imagekit-javascript`) | Signed direct-to-CDN uploads for pattern questions |
| Icons | lucide-react, react-icons | |
| Deploy | Vercel, or Docker + nginx | |

---

## Quick start

**Prerequisites:** Node 20+, and the [backend](https://github.com/PriYanahsu/HireCheck-backend)
running on `localhost:8080` (or point at the deployed API).

```bash
npm install
npm run dev          # http://localhost:5173
```

With `VITE_API_URL` left empty, Vite proxies every `/api/*` request to
`http://127.0.0.1:8080`, so the browser sees one origin and there is no CORS to configure in
development. The proxy also forwards the caller's address as `X-Forwarded-For`, so the
backend's candidate IP capture works locally too.

To run against the deployed API instead, set `VITE_API_URL` in `client/.env.local`.

### Environment variables

Vite's root is `client/`, so env files live in **`client/`**, not the project root. Copy
[`.env.example`](.env.example) to `client/.env.local`.

| Variable | Required | What it's for |
|---|---|---|
| `VITE_API_URL` | prod only | Base URL of the Spring Boot API, no trailing slash. Empty = use the dev proxy |
| `VITE_IMAGEKIT_PUBLIC_KEY` | for image upload | ImageKit **public** key |
| `VITE_IMAGEKIT_URL_ENDPOINT` | for image upload | ImageKit URL endpoint |

Every `VITE_` variable is compiled into the JavaScript bundle and is visible to anyone, which
is why only public values belong here. The ImageKit **private** key lives on the backend, which
signs each upload.

---

## Routes

Defined in [`client/src/App.tsx`](client/src/App.tsx).

| Path | Page | Who |
|---|---|---|
| `/`, `/login` | Login | Recruiter |
| `/signup` | Create an account | Recruiter |
| `/dashboard` | Stats, recent activity, performance chart | Recruiter |
| `/tests` | All tests with per-test stats | Recruiter |
| `/tests/create` | New test | Recruiter |
| `/tests/:id` | Test detail: questions, candidates, invites, results | Recruiter |
| `/tests/:id/edit` | Edit test settings and questions | Recruiter |
| `/candidates` | Every candidate across all tests, searchable, tabbed by status | Recruiter |
| `/analytics` | Score distribution and per-test averages | Recruiter |
| `/public-test/:testId` | Self-registration form | Candidate |
| `/take-test/:testLink` | The test itself | Candidate |
| `/test-complete` | Confirmation screen | Candidate |
| `*` | 404 | — |

Recruiter pages call `useRequireAuth()`, which redirects to `/login` when `/api/auth/me`
fails. That is a convenience for the UI, not a security boundary — the API checks the token
on every request.

---

## How a candidate takes a test

```
/take-test/:testLink
   └─ GET  /api/candidate/:testLink           questions (answers stripped), duration, startedAt
        ├─ completed?        → "Test already taken"
        └─ not started yet   → instructions screen + countdown
   └─ candidate clicks Start
        ├─ request fullscreen
        └─ POST /api/candidate/:testLink/start   server records startedAt + client IP
   └─ answering
        ├─ each change → localStorage  +  POST /responses   (graded server-side)
        ├─ 20 s idle autosave as a safety net
        └─ reload → answers restored from localStorage and the server
   └─ finish
        ├─ manual submit (confirmation dialog shows answered / total)
        ├─ timer hits 00:00            → submit with autoSubmitted = true
        └─ 5th time leaving the tab    → submit with autoSubmitted = true
   └─ /test-complete
```

Details worth knowing:

- **The timer is computed, not counted.** The end time is `startedAt + duration` from the
  server, so refreshing the page or reopening the link resumes the same clock rather than
  restarting it. Under five minutes, the timer turns red and pulses.
- **Answers are saved twice.** Each answer goes to `localStorage` immediately and to the API
  straight after. A flaky connection doesn't lose work, and a closed tab can be reopened.
- **Proctoring.** Fullscreen is requested on start; exiting it blocks the test behind a
  "return to fullscreen" screen. `visibilitychange` counts every time the candidate leaves the
  tab, with an escalating warning dialog each time, and the fifth departure submits the test.
  A `beforeunload` prompt guards against closing the window by accident.
- **The server is the backstop.** If the browser is closed and never comes back, a scheduled
  job on the backend submits the test once the time limit (plus a short grace period) has
  passed.

### Self-registration

`/public-test/:testId` is a link a recruiter can post anywhere. The candidate enters name,
email and a 10-digit phone number (validated with Zod, stored with a `+91` prefix); the API
creates a candidate record, rejects an email that has already taken the test, and returns a
fresh test link that the page redirects to.

---

## Recruiter workflows

### Building questions

[`question-form.tsx`](client/src/components/tests/question-form.tsx) changes its fields with
the question type:

| Type | Fields | Graded |
|---|---|---|
| `multipleChoice` | options, correct option | automatically |
| `patternRecognition` | image (ImageKit upload), options, correct option | automatically |
| `coding` | prompt, starter code, input/output test cases | by the recruiter |
| `subjective` | prompt, evaluation guidelines | by the recruiter |

**Image upload** never routes the file through the API. The browser asks
`/api/imagekit-auth` for a short-lived signature, then uploads straight to ImageKit and stores
the returned CDN URL on the question. Files are checked client-side for type and a 5 MB limit.

**Bulk import** ([`bulk-import-questions.tsx`](client/src/components/tests/bulk-import-questions.tsx))
accepts a JSON array of questions — a sample is built into the dialog — and creates them one
by one, reporting how many succeeded and how many failed.

### Inviting candidates

- **Single invite** — name, email and phone; the API generates the link and sends the email.
  The link can also be copied, or opened in the recruiter's mail client as a `mailto:`.
- **Bulk invite** ([`bulk-invite.tsx`](client/src/components/candidate/bulk-invite.tsx)) — upload
  an `.xlsx` / `.xls` file with the columns `Candidate Name`, `Phone Number` and `Email ID`.
  SheetJS parses it in the browser, each row is validated, and valid and invalid rows are shown
  separately (with row numbers) before the recruiter confirms. Only the valid rows are sent, in
  a single request to `/api/candidates/bulk-invite`, and the response reports success or failure
  per candidate.

### Results

Candidate status moves `pending → in_progress → completed`. Each completed candidate shows a
percentage score, pass / fail against the test's passing score, whether the test was
auto-submitted, time taken, and the IP address the test was started from.

---

## Data fetching

[`client/src/lib/queryClient.ts`](client/src/lib/queryClient.ts) is the only place that talks
to the network.

- **One base URL.** `apiUrl()` prefixes every path with `VITE_API_URL`, or nothing in dev so the
  Vite proxy handles it. The same code runs against local and deployed APIs.
- **Query keys are URLs.** The default `queryFn` fetches `queryKey[0]` with the auth header
  attached, so `useQuery({ queryKey: ["/api/tests"] })` is a complete data call. Mutations call
  `apiRequest(method, url, body)` and then invalidate the keys they affect.
- **Errors carry the status.** Non-2xx responses throw `"<status>: <body>"`, which is how the
  candidate page tells "already completed" apart from "invalid link".
- **Deliberately quiet.** No refetch on window focus and no automatic retries. On a test page,
  a background refetch or a silent retry is a surprise, not a feature.

---

## Authentication

[`client/src/lib/auth.ts`](client/src/lib/auth.ts) exposes a `useAuth()` hook.

- Login and signup return a JWT, which is stored in `localStorage` and sent as
  `Authorization: Bearer <token>` on every request.
- The current user is the cached result of `GET /api/auth/me`. Login seeds that cache directly,
  so the dashboard renders without a second round trip.
- Logout removes the token, clears the user from the cache, and invalidates every query so no
  data from one session leaks into the next.

---

## Project structure

```
client/
├─ index.html
└─ src/
   ├─ App.tsx                  route table + providers (Query, Theme, Tooltip, Toaster)
   ├─ main.tsx                 entry point
   ├─ index.css                Tailwind layers + design tokens (light / dark)
   ├─ pages/
   │  ├─ auth/                 login, signup
   │  ├─ dashboard.tsx
   │  ├─ tests/                index, create, edit, view
   │  ├─ candidates/           all candidates
   │  ├─ analytics/            charts and pass rates
   │  ├─ candidate/            test-taking flow + completion screen
   │  └─ public-test/          self-registration
   ├─ components/
   │  ├─ candidate/            question view, timer progress, instructions, bulk invite
   │  ├─ tests/                test form, question form, question card, bulk import
   │  ├─ dashboard/            stats cards, recent activity, performance chart
   │  ├─ layout/               page shell, auth layout
   │  ├─ ui/                   shadcn/ui primitives, sidebar, file upload
   │  └─ timer.tsx
   ├─ hooks/                   use-toast, use-mobile
   └─ lib/
      ├─ queryClient.ts        fetch wrapper + TanStack Query defaults
      ├─ auth.ts               useAuth hook
      ├─ schema.ts             Zod schemas + domain types
      └─ utils.ts              cn(), date and duration formatting
```

Path alias: `@/` → `client/src/`.

---

## Scripts

```bash
npm run dev      # Vite dev server with /api proxy
npm run build    # production build → dist/
npm run start    # preview the production build
npm run check    # TypeScript type check
```

---

## Deployment

### Vercel

- Build command `npm run build`, output directory `dist`.
- Set `VITE_API_URL` (and the ImageKit public values) in the project settings. They are read
  at **build** time, so changing one needs a redeploy.
- [`vercel.json`](vercel.json) rewrites every path to `index.html`, so a deep link like
  `/take-test/abc123` loads the app rather than a 404.

### Docker

```bash
docker build \
  --build-arg VITE_API_URL=https://your-api.onrender.com \
  -t hirecheck-web .
docker run -p 80:80 hirecheck-web
```

A two-stage build: Node compiles the bundle, then only the static files are copied into an
`nginx:alpine` image. [`nginx.conf`](nginx.conf) falls back to `index.html` for client-side
routes, gzips text assets, and caches Vite's hashed `/assets/` files for a year as immutable —
safe because a changed file gets a new name.

### Connecting to the API

The backend only accepts requests from origins listed in its `FRONTEND_URL`. Add the deployed
frontend origin there (exact match, no trailing slash) or every call will fail CORS.

---

## Known gaps

What isn't finished yet:

- **Coding and subjective answers can't be reviewed in the UI.** They're saved, but there's no
  recruiter view of a candidate's individual responses, and they score zero until one exists.
- **The tab-switch warning copy is out of date.** It says the test submits "on the 3rd
  attempt"; the code submits on the 5th.
- **No refresh tokens.** The JWT lasts seven days; when it expires the user is sent back to
  login.
- **Leftovers to clean up:** a Replit dev-banner script in `index.html`, a `console.log` in
  `file-upload.tsx`, and an unused question-navigation grid on the test page.
- **`docs/` is stale.** It describes an earlier version where the API and frontend shipped as
  one container on Railway. The two are now separate repos on Vercel and Render. Trust this
  README over `docs/`.
- No automated tests yet.
