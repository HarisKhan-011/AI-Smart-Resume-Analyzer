# ResumeAI — Smart Resume Analyzer & Job Matcher

## Project overview

ResumeAI is a Next.js application that helps candidates analyze resumes, match them to jobs, find skill gaps, and track applications. Recruiters can post jobs, review applicants, and rank candidates by skill fit.

The system uses dictionary NLP for skill extraction, keyword skill matching, and optional Sentence Transformers embeddings for semantic similarity. MongoDB stores users, resumes, jobs, matches, and applications.

This repository is a Final Year Project (FYP). Branding in the UI is **ResumeAI**.

## Features

**Candidates**
- Register / login / logout
- Upload PDF or DOCX resumes and extract text
- Analyze resumes and extract skills (dictionary NLP)
- Search online jobs (Remotive by default, optional Adzuna)
- Check job match (skill + optional semantic score)
- View skill gaps and learning suggestions
- Get job recommendations
- Save and track applications (saved, applied, interview, offered, rejected)

**Recruiters**
- Create, edit, delete, activate/deactivate job postings
- View applicants for their own jobs
- Candidate detail (name, email, skills, truncated summary)
- Rank applicants by skill match

**Platform**
- Role-based access (candidate, recruiter, admin)
- Owner-scoped resumes and applications
- Recruiter jobs scoped to `createdBy`
- Optional local embedding service for semantic matching

## Technology stack

| Layer | Stack |
| --- | --- |
| App | Next.js 15 (App Router), React 18, TypeScript |
| UI | Tailwind CSS, Radix UI primitives |
| Auth | Auth.js (`next-auth` v5) |
| Database | MongoDB + Mongoose |
| NLP | Dictionary skill matcher, preprocess/tokenize, stopword filter |
| Semantic AI | Sentence Transformers `all-MiniLM-L6-v2` (Python FastAPI) or Hugging Face Inference API |
| Jobs | Remotive (default), optional Adzuna |
| Tests | Jest |

TF-IDF is **not** implemented.

## Installation

Prerequisites: Node.js 18+, npm, and a MongoDB database (local or Atlas).

```bash
npm install
cp .env.example .env.local
```

Edit `.env.local` with a real `MONGODB_URI` and `AUTH_SECRET`. Do not commit `.env.local`.

Optional semantic AI:

```bash
pip install -r ai-service/requirements.txt
npm run ai:embed
```

## Environment variables

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string |
| `AUTH_SECRET` | Auth.js secret |
| `AUTH_URL` | App URL (default `http://localhost:3000`) |
| `AI_API_URL` | Embedding service URL (default `http://127.0.0.1:8001`) |
| `AI_API_KEY` | Optional shared secret for the Python service |
| `SEMANTIC_PROVIDER` | `auto`, `python`, or `huggingface` |
| `SEMANTIC_MODEL` | Embedding model id |
| `HF_TOKEN` | Hugging Face token if using that provider |
| `JOB_PROVIDER` | `remotive` (default) or `adzuna` |
| `ADZUNA_APP_ID` / `ADZUNA_APP_KEY` / `ADZUNA_COUNTRY` | Adzuna only |
| `NEXT_PUBLIC_API_URL` | Optional public API prefix |

Never put secrets in source files. `.env*.local` is gitignored.

## How to run

```bash
npm run dev          # http://localhost:3000
npm run build && npm start
npm test
npm run lint
npx tsc --noEmit
npm run ai:embed     # optional Python embedding server on port 8001
```

## Database setup

1. Create a MongoDB database (local or [Atlas](https://www.mongodb.com/atlas)).
2. Set `MONGODB_URI` in `.env.local`.
3. Collections are created by Mongoose on first write: `users`, `resumes`, `jobs`, `matches`, `applications`, `skills`.
4. User passwords are stored as bcrypt hashes (`passwordHash`, `select: false`).
5. Resume extracted text is `select: false` unless an owner/recruiter flow explicitly loads it.

## AI / NLP architecture

1. **Text extraction** — PDF (`pdf-parse`) and DOCX (`mammoth`).
2. **Preprocess** — lowercase, tokenize, stopword removal.
3. **Skill extraction** — phrase/alias match against `data/skills.json`.
4. **Job skill extraction** — same dictionary, with required vs preferred section heuristics.
5. **Keyword matching** — required-skill coverage = matched / required × 100.
6. **Semantic matching (optional)** — embed resume text and job description, cosine similarity → 0–100.
7. **Combined Job Match score** — 60% skill + 40% semantic when embeddings succeed; otherwise skill-only.

If the embedding service is down, Job Match still returns skill scores.

## Matching algorithm

```
skillScore     = required skills matched / required skills total × 100
semanticScore  = max(0, cosine(resumeEmbedding, jobEmbedding)) × 100
overallScore   = 0.6 × skillScore + 0.4 × semanticScore   # when semantic AI is available
overallScore   = skillScore                                 # fallback
```

Weights live in `lib/config.ts` (`matching.weight.skills` / `matching.weight.semantic`).

Recommendations use skill coverage plus preferred skills, experience tokens, and title relevance — not embeddings.

Recruiter ranking reuses stored match scores when present, otherwise keyword `calculateMatch`.

## Project structure

```
app/                 Pages and API routes
components/          UI (layout, resume, jobs, matching, recruiter)
services/            Business logic (NLP, matching, jobs, applications, AI)
models/              Mongoose schemas
lib/                 Auth, config, validations, MongoDB helper
types/               Shared TypeScript types
data/                Skill dictionary, evaluation gold set
ai-service/          Python Sentence Transformers embed API
tests/unit/          Jest tests
docs/                Architecture, testing, evaluation
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm test` | Jest unit tests |
| `npm run lint` | ESLint |
| `npm run ai:embed` | Local embedding service |

## License

Final Year Project. Contributions are not accepted.
