# Testing

## What is tested

Jest unit tests under `tests/unit/` (Node environment). They cover:

- File validation and text extraction helpers
- NLP preprocess and dictionary skill extraction
- Keyword matching and skill-gap logic
- Semantic cosine math, score combine, and AI fallback
- HTTP handlers for resumes, jobs, matching, applications, recommendations, recruiter jobs (401/403/404 ownership)
- Auth path helpers, register role restriction, public user DTO (no password hash)
- In-house skill-extraction evaluation set

Run:

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

## Manual candidate flow

Register → Login → Upload resume → Extract text → Analyze → Search jobs → Job Match → Skill Gap → Recommendations → Save/Apply → Logout

## Manual recruiter flow

Register as recruiter → Login → Create job → Edit / deactivate / delete → Candidates → Candidate detail → Rankings → Logout

## Security checks

- Logged-out visit to `/dashboard` or `/recruiter` redirects to login
- Candidate cannot open `/recruiter`
- Candidate cannot `GET /api/recruiter/jobs` (403)
- Resume GET for another user’s id returns 404
- Application PATCH/DELETE for another user’s id returns 404
- Recruiter PATCH/DELETE of another recruiter’s job returns 404
- Register body `role: "admin"` is rejected
- `/api/users/me` and match payloads do not include `passwordHash`
- `/api/health/db` requires a session and does not return database names

## UI / responsive

Exercise `/dashboard`, `/jobs`, `/job-match`, `/applications`, `/recruiter/candidates` at:

- Desktop (1280px+)
- Tablet (~768px, collapsed sidebar)
- Mobile (~375px, hamburger nav, stacked cards)

Look for horizontal overflow, missing empty/error/loading states, and broken nav labels.

## Gaps (not automated)

- No Playwright/Cypress end-to-end suite
- Middleware itself is not executed in Jest (path helpers are)
- Python embedding service is not started in CI; fallback is unit-tested
- Semantic accuracy vs human labels is not measured (see `docs/evaluation.md`)
