# Architecture

## Overview

ResumeAI is a monolithic Next.js 15 App Router application. Server Components load data from MongoDB. Client components call JSON APIs under `/app/api`. Auth.js issues sessions. Optional semantic matching is delegated to a small Python process.

```
Browser
  → Next.js pages (RSC) + client forms
  → Auth.js session
  → Route handlers / services
  → MongoDB
  → Optional: Python embed service (Sentence Transformers)
  → Optional: Remotive or Adzuna job APIs
```

## Layers

| Layer | Responsibility |
| --- | --- |
| `app/` | Routes, layouts, loading/error UI, API handlers |
| `components/` | Presentation only; fetch via `/api/*` on the client |
| `services/` | Authorization-aware business rules |
| `models/` | Persistence |
| `lib/` | Config, auth helpers, validation, DB connection |
| `ai-service/` | Embedding HTTP API |

## Auth and access control

1. **Middleware** (`middleware.ts`) — unauthenticated users hitting protected prefixes go to `/login`. Candidates hitting `/recruiter/*` go to `/unauthorized`. APIs are excluded from the matcher.
2. **Layouts** — `ProtectedLayout` calls `requireAuth()` or `requireRole(...)`.
3. **API handlers** — `getApiUser()`; recruiter APIs also check `canAccessRecruiterRoutes`.

Ownership rules:

- Resumes: `{ _id, userId }`
- Applications: `{ _id, userId }`
- Recruiter jobs: `{ _id, createdBy, isPosted: true }`
- Recruiter candidates: applicants to that recruiter’s posted jobs only
- Public user DTO never includes `passwordHash`

## Data model

- **User** — name, email, bcrypt `passwordHash`, role
- **Resume** — file metadata, extracted text (hidden by default), skills, analysis status
- **Job** — description, required/preferred skills, `source`, `isPosted`, `isActive`, `createdBy`
- **Match** — `skillScore`, `semanticScore`, `overallScore`, matched/missing skills
- **Application** — status pipeline per user/job

## Matching pipeline

Job Match (`POST /api/matching`):

1. Load owned resume + accessible job
2. Keyword `calculateMatch` (Phase 8, unchanged)
3. `calculateSemanticScore(resumeText, jobText)` if an embedding provider is configured
4. Combine with configurable weights; persist Match

Recommendations and recruiter ranking do not call the embedding service. They reuse keyword matching and/or a stored Match.

## External systems

| System | Role | Failure behavior |
| --- | --- | --- |
| MongoDB | Source of truth | 503 on handlers that catch DB unavailability |
| Remotive / Adzuna | Job search | Empty results / error message in UI |
| Python embed service / HF | Semantic score | Skill-only overall score |

## Important routes

**Candidate:** `/`, `/login`, `/register`, `/dashboard`, `/resume`, `/resume/upload`, `/jobs`, `/job-match`, `/skill-gap`, `/recommendations`, `/applications`, `/profile`, `/settings`

**Recruiter:** `/recruiter`, `/recruiter/jobs`, `/recruiter/jobs/new`, `/recruiter/jobs/[id]/edit`, `/recruiter/candidates`, `/recruiter/candidates/[id]`, `/recruiter/rankings`

**Admin:** `/admin`

**APIs (authenticated unless noted):** `/api/auth/*` (public register/login), `/api/resumes*`, `/api/jobs*`, `/api/matching*`, `/api/skill-gap`, `/api/recommendations`, `/api/applications*`, `/api/recruiter/jobs*`, `/api/users/me`, `/api/health/db` (signed-in)
