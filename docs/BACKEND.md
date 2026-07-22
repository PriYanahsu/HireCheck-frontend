# Spring Boot Backend Guide

How the **HireCheck** backend works — architecture, API, auth, database, and services.

**Stack:** Spring Boot 3.3.5 · Java 17 · Spring Security · Spring Data JPA · PostgreSQL · JWT (jjwt)

---

## Entry point

```
backend/src/main/java/com/hirecheck/HireCheckApplication.java
```

`@SpringBootApplication` + `@EnableScheduling` — boots the app and runs the auto-submit scheduler.

Configuration lives in:

```
backend/src/main/resources/application.properties
```

---

## Package structure

```
com.hirecheck/
├── HireCheckApplication.java       # Main class
│
├── config/
│   ├── SecurityConfig.java          # JWT filter, CORS, route permissions
│   └── WebConfig.java               # SPA static file serving
│
├── controller/                      # REST API layer (7 controllers)
│   ├── AuthController.java
│   ├── TestController.java
│   ├── QuestionController.java
│   ├── CandidateController.java
│   ├── PublicTestController.java
│   ├── DashboardController.java
│   └── ImageKitController.java
│
├── dto/
│   ├── LoginRequest.java
│   └── SignupRequest.java
│
├── entity/                          # JPA entities (5 tables)
│   ├── User.java
│   ├── Test.java
│   ├── Question.java
│   ├── Candidate.java
│   └── Response.java
│
├── repository/                      # Spring Data JPA repos (5)
│
├── security/
│   ├── JwtUtil.java                 # Sign / parse JWT tokens
│   ├── JwtAuthFilter.java           # Extract Bearer token per request
│   └── UserPrincipal.java           # Authenticated user identity
│
├── service/
│   ├── CandidateTestService.java    # Scoring, answer evaluation, submit
│   ├── StatsService.java            # Dashboard + per-test statistics
│   ├── EmailService.java            # EmailJS invitation emails
│   └── ImageKitService.java         # ImageKit upload signatures
│
├── scheduler/
│   └── AutoSubmitScheduler.java     # Auto-submit expired tests every 60s
│
├── exception/
│   ├── ApiException.java
│   └── GlobalExceptionHandler.java  # @RestControllerAdvice
│
└── util/
    ├── NanoidUtil.java              # Generate unique test link IDs
    └── ClientIpUtil.java            # Resolve client IP from proxy headers
```

---

## Database layer

### Connection

Spring builds the JDBC URL from individual env vars (not `DATABASE_URL`):

```properties
spring.datasource.url=jdbc:postgresql://${PGHOST}:${PGPORT}/${PGDATABASE}?sslmode=require
spring.datasource.username=${PGUSER}
spring.datasource.password=${PGPASSWORD:${DB_PASSWORD:}}
```

- **Local:** `DB_PASSWORD` from `.env`, host defaults to AWS RDS in properties
- **Railway:** `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` injected automatically when Postgres is linked

### Schema management

```properties
spring.jpa.hibernate.ddl-auto=update
```

Hibernate creates/updates tables from Java entities at startup. No Flyway or Liquibase migrations on the Spring side.

> The `migrations/` folder and `drizzle.config.ts` at the repo root are from the old Express stack. Spring uses JPA entities only.

### Entities and relationships

No `@ManyToOne` / `@OneToMany` annotations — foreign keys are plain `Integer` columns enforced in application code.

```
User (users)
  id, username, password, email, name, company

Test (tests)
  id, title, description, duration, passingScore, shuffleQuestions
  createdBy → User.id
  createdAt

Question (questions)
  id, testId → Test.id
  type, content, codeSnippet
  options (JSON), answer, testCases (JSON), evaluationGuidelines
  imageUrl, points, order

Candidate (candidates)
  id, name, email, phone
  testId → Test.id, invitedBy → User.id
  testLink (unique nanoid)
  status: pending | in_progress | completed
  invitedAt, startedAt, completedAt, score, autoSubmitted, ipAddress

Response (responses)
  id, candidateId → Candidate.id, questionId → Question.id
  response, isCorrect, points, submittedAt
```

**Relationship diagram:**

```
User ──creates──> Test ──has──> Question
  │                  │
  └──invites──> Candidate ──answers──> Response
```

**Question types** (`type` field):

| Type | Auto-scored? |
|------|-------------|
| `multipleChoice` | Yes |
| `patternRecognition` | Yes |
| `coding` | No (manual review) |
| `subjective` | No (manual review) |

`Question.options` and `Question.testCases` are stored as JSON columns via `@JdbcTypeCode(SqlTypes.JSON)`.

---

## Authentication & security

### JWT flow

```
1. POST /api/auth/login or /api/auth/signup
   → server returns { token, user }

2. Client stores token in localStorage

3. Every protected request:
   Authorization: Bearer <token>

4. JwtAuthFilter runs before controllers:
   → parses token via JwtUtil
   → sets UserPrincipal in SecurityContext

5. Controllers read @AuthenticationPrincipal UserPrincipal
```

**Token details:**
- Algorithm: HS256
- Claims: `id`, `username`
- Expiry: 7 days (`app.jwt.expiration-days`)
- Secret: `JWT_SECRET` env var

**Logout:** Stateless — server returns a success message; client deletes the token. No server-side token blacklist.

**Password storage:** Plain string comparison in `AuthController.login()` — no `PasswordEncoder` / bcrypt.

### Route permissions (`SecurityConfig`)

| Routes | Auth required? |
|--------|---------------|
| `/api/auth/login`, `/api/auth/signup` | No |
| `/api/candidate/**` | No (test-taking) |
| `/api/public-test/**` | No (self-registration) |
| `/api/imagekit-auth` | No |
| All other `/api/**` | Yes (JWT Bearer) |
| `/**` (non-API) | No (SPA static files) |

CORS allows a single origin from `app.frontend.url` (`FRONTEND_URL` env var).

Sessions are `STATELESS` — CSRF disabled.

### Ownership checks

No `@PreAuthorize` annotations. Controllers manually verify:
- Tests belong to the logged-in user (`createdBy`)
- Questions belong to the user's test
- Candidates belong to the user's test

---

## REST API reference

### Auth — `AuthController` → `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | No | Login → JWT + user |
| POST | `/api/auth/signup` | No | Register → JWT + user |
| POST | `/api/auth/logout` | Yes | Stateless logout message |
| GET | `/api/auth/me` | Yes | Current user profile |

### Tests — `TestController` → `/api/tests`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/tests` | Yes | List user's tests with stats |
| GET | `/api/tests/{id}` | Yes | Test detail + questions + stats |
| POST | `/api/tests` | Yes | Create test |
| PUT | `/api/tests/{id}` | Yes | Update test |
| DELETE | `/api/tests/{id}` | Yes | Delete test + cascade all related data |
| GET | `/api/tests/{id}/candidates` | Yes | List candidates for a test |

### Questions — `QuestionController` → `/api/questions`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/questions` | Yes | Create question |
| PUT | `/api/questions/{id}` | Yes | Update question |
| DELETE | `/api/questions/{id}` | Yes | Delete question |

### Candidates (recruiter) — `CandidateController` → `/api/candidates`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/candidates` | Yes | Invite single candidate + send email |
| POST | `/api/candidates/bulk-invite` | Yes | Bulk invite with validation |
| DELETE | `/api/candidates/{id}` | Yes | Delete candidate |

### Candidate test-taking — `CandidateController` → `/api/candidate`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/candidate/{testLink}` | No | Load test (questions, no answers) |
| POST | `/api/candidate/{testLink}/start` | No | Start test, record IP + `startedAt` |
| GET | `/api/candidate/{testLink}/responses/{questionId}` | No | Get saved answer |
| POST | `/api/candidate/{testLink}/responses` | No | Save/update answer |
| POST | `/api/candidate/{testLink}/submit` | No | Submit test (optional `{ autoSubmitted }`) |

### Public registration — `PublicTestController` → `/api/public-test`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/public-test/{testId}/register` | No | Self-register → `{ testLink }` |

### Dashboard — `DashboardController` → `/api/dashboard`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/dashboard/stats` | Yes | `{ activeTests, pendingAssessments, completedTests }` |
| GET | `/api/dashboard/recent-activity` | Yes | Last 10 start/complete events |

### ImageKit — `ImageKitController` → `/api/imagekit-auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/imagekit-auth` | No | HMAC-SHA1 upload auth params for client |

---

## Services

### `CandidateTestService`

Core test-taking logic:
- Evaluates `multipleChoice` and `patternRecognition` answers automatically
- Upserts `Response` records as candidates save answers
- Computes percentage score on submit
- Called by `CandidateController` and `AutoSubmitScheduler`

### `StatsService`

Aggregates data for dashboards:
- Per-test stats: total/completed/in-progress/pending candidates, average score
- Global dashboard stats
- Recent activity feed (last 10 start/complete events)

### `EmailService`

Sends test invitation emails via EmailJS REST API.

Invite link format: `{PUBLIC_URL}/take-test/{testLink}`

Requires env vars: `EMAILJS_PUBLIC_KEY`, `EMAILJS_PRIVATE_KEY`, `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `PUBLIC_URL`

### `ImageKitService`

Generates HMAC-SHA1 signature for client-side ImageKit uploads.

Requires: `IMAGEKIT_PRIVATE_KEY`

---

## Scheduler

### `AutoSubmitScheduler`

Runs every 60 seconds (`@Scheduled(fixedRate = 60000)`).

Finds candidates with:
- `status = in_progress`
- `startedAt + test.duration + 5 minutes` has passed

Calls `submitCandidateTest(candidate, autoSubmitted=true)` to force-submit expired tests.

---

## SPA static file serving

`WebConfig` serves the React build from `classpath:/static/`:

```java
// api/* paths → fall through to Spring controllers
// existing static file → serve it
// everything else → return index.html (client-side routing)
```

In production, the Docker build copies `dist/public/` into `src/main/resources/static/` before packaging the JAR.

**Result:** one process on port 8080 serves both `/api/*` and the React SPA.

---

## Error handling

`GlobalExceptionHandler` (`@RestControllerAdvice`) catches:

| Exception | HTTP status |
|-----------|-------------|
| `ApiException` | Custom status from exception |
| `MethodArgumentNotValidException` | 400 Bad Request |
| Generic `Exception` | 500 Internal Server Error |

Controllers throw `ApiException` for business logic errors (not found, forbidden, etc.).

---

## Request lifecycle (example: create test)

```
POST /api/tests  (with Bearer token)
        │
        ▼
JwtAuthFilter
  → parse token → UserPrincipal in SecurityContext
        │
        ▼
SecurityConfig
  → /api/tests requires authentication ✓
        │
        ▼
TestController.create()
  → read @AuthenticationPrincipal UserPrincipal
  → validate request body
  → save Test entity (createdBy = user.id)
  → return test JSON
        │
        ▼
GlobalExceptionHandler (if error thrown)
```

---

## Running the backend

```bash
# Dev
cd backend
./mvnw spring-boot:run

# Build JAR
cd backend
./mvnw package -DskipTests
# Output: backend/target/hirecheck-backend-1.0.0.jar

# Run JAR
java -jar backend/target/hirecheck-backend-1.0.0.jar
```

API available at http://localhost:8080/api/
