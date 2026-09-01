"""
Local Sentence Transformers embedding service for Phase 14 semantic matching.

Start from the project root:
  python -m uvicorn --app-dir ai-service main:app --host 127.0.0.1 --port 8001

The Next.js app calls POST /embed. Cosine similarity is computed in Node so the
embedding model can be swapped without changing the scoring formula.
"""

from __future__ import annotations

import os
from typing import Optional

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

MODEL_NAME = os.environ.get("SEMANTIC_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
API_KEY = os.environ.get("AI_API_KEY") or os.environ.get("SEMANTIC_AI_KEY") or ""
MAX_CHARS = 8000

app = FastAPI(title="ResumeAI Semantic Embeddings", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type", "X-API-Key"],
)

_model = None


class EmbedRequest(BaseModel):
    texts: list[str] = Field(min_length=1)


def _verify(authorization: Optional[str], x_api_key: Optional[str]) -> None:
    if not API_KEY:
        return
    token = ""
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
    elif x_api_key:
        token = x_api_key.strip()
    if token != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")


def get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer

        _model = SentenceTransformer(MODEL_NAME)
    return _model


@app.get("/health")
def health():
    return {"ok": True, "model": MODEL_NAME}


@app.post("/embed")
def embed(
    body: EmbedRequest,
    authorization: Optional[str] = Header(default=None),
    x_api_key: Optional[str] = Header(default=None, alias="X-API-Key"),
):
    _verify(authorization, x_api_key)
    texts = [text.replace("\x00", " ").strip()[:MAX_CHARS] for text in body.texts]
    if not any(texts):
        raise HTTPException(status_code=400, detail="texts required")

    try:
        model = get_model()
        vectors = model.encode(texts, normalize_embeddings=True).tolist()
    except Exception as error:
        raise HTTPException(status_code=503, detail=f"Embedding model failed: {error}") from error

    return {"model": MODEL_NAME, "embeddings": vectors}
