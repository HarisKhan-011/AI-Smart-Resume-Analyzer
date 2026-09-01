# Evaluation

This document compares matching approaches **as implemented**. It does **not** invent benchmark scores for unpublished human-labeled job-fit corpora.

## What exists

| Method | Status | What it scores |
| --- | --- | --- |
| Keyword / skill matching | Implemented | Required-skill coverage (matched ÷ required × 100) |
| TF-IDF matching | **Not implemented** | — |
| Semantic AI matching | Implemented (optional) | Cosine similarity of Sentence Transformer embeddings, scaled 0–100 |

Job Match overall score when embeddings succeed:

`0.6 × skillScore + 0.4 × semanticScore`

When the embedding service is unavailable, overall = skillScore.

## In-house skill extraction gold set

File: `data/evaluation/skill-extraction-gold.json`  
Test: `tests/unit/evaluation.test.ts`

Five short texts were labeled with dictionary skill names that appear in the text (plus one negative prose sample with no skills). Metrics are **micro-averaged** against `extractSkills()`.

Measured on this gold set (2026-09-01, `npx jest tests/unit/evaluation.test.ts`):

| Metric | Value |
| --- | --- |
| Samples | 5 |
| Precision | 0.941 |
| Recall | 1.000 |
| F1-score | 0.970 |

These numbers describe **dictionary skill extraction on this small labeled set**, not general resume-parsing accuracy and not job-fit ranking quality. Extra dictionary hits on a sample lower precision; recall of 1.0 means every gold skill was found.

Re-run:

```bash
npx jest tests/unit/evaluation.test.ts
```

## Keyword vs semantic (synthetic pairs)

No human “relevant / not relevant” job-fit labels exist in this repo, so ranking accuracy / MAP / NDCG are **not reported**.

The same Jest file checks the **score formulas** on two synthetic pairs:

| Pair | Keyword skill score | Semantic similarity (assumed available) | Combined overall (60/40) |
| --- | --- | --- | --- |
| 4 of 6 required skills match, semantic 80 | 67 | 80 | 72 |
| No required skills match, semantic 20 | 0 | 20 | 8 |

Semantic 80 and 20 in that table are **inputs to the combiner**, not measured embeddings. Cosine → 0–100 conversion is unit-tested in `tests/unit/semantic-matching.test.ts`.

## How to evaluate on real data later

1. Collect 50+ resume–job pairs with binary or graded relevance labels from humans.
2. Freeze splits (train not required for the current non-learned keyword matcher).
3. For each pair compute keyword `skillScore`, embedding `semanticScore`, and combined `overallScore`.
4. Threshold overall score (for example ≥ 60) to predicted “match”.
5. Report precision, recall, F1 vs the human label; optionally Spearman correlation of scores vs graded relevance.
6. Compare three systems on the **same** split: keyword-only, semantic-only, combined. Do not report TF-IDF until it is implemented.
7. Keep the embedding model id (`sentence-transformers/all-MiniLM-L6-v2`) in the write-up.

Until that labeled set exists, use the gold extraction metrics and formula tests above—not fabricated accuracy tables.
