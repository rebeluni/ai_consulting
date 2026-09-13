"""
M Moser AI Brief Assistant — Backend
FastAPI + Groq LLM
"""
import os
import json
import re
import logging
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="M Moser AI Brief Assistant", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
GROQ_FALLBACK_MODEL = os.getenv("GROQ_FALLBACK_MODEL", "llama-3.1-8b-instant")

if not GROQ_API_KEY:
    logger.warning("GROQ_API_KEY not set. Set it in backend/.env")

client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None


# ─── Request / Response Models ────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    text: str

    @field_validator("text")
    @classmethod
    def text_must_not_be_empty(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Project text cannot be empty.")
        if len(stripped) < 20:
            raise ValueError("Project text is too short to analyze meaningfully.")
        return stripped


class QARequest(BaseModel):
    question: str
    project_text: str

    @field_validator("question")
    @classmethod
    def question_must_not_be_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Question cannot be empty.")
        return v.strip()


# ─── Prompts ─────────────────────────────────────────────────────────────────

ANALYZE_SYSTEM_PROMPT = """You are an expert project intelligence assistant for a professional services firm specialising in workplace design and project delivery.

Your task is to analyse unstructured project notes and produce a STRICT JSON response with NO additional text, markdown, or commentary outside the JSON block.

CRITICAL RULES:
1. NEVER invent information not present in the source text.
2. If information is missing, use exactly: "Not specified in source material."
3. If you are making an inference, prefix it with: "Inference — requires human validation:"
4. Always quote or paraphrase the source evidence for each finding.
5. Return ONLY valid JSON. No preamble, no explanation, no code fences.

Return this exact JSON structure:

{
  "project_overview": {
    "project_name": "string or 'Not specified in source material.'",
    "project_type": "string or 'Not specified in source material.'",
    "location": "string or 'Not specified in source material.'",
    "project_objective": "string",
    "key_stakeholders": ["list of strings"],
    "timeline": "string or 'Not specified in source material.'"
  },
  "key_requirements": [
    {
      "requirement": "string — prefix with 'Inference — requires human validation:' if inferred",
      "category": "Interior Design | Workplace Strategy & Consulting | Engineering & Sustainability | Project Delivery | Business & Operations",
      "evidence": "short quote or paraphrase from source",
      "confidence": "High | Medium | Low",
      "is_inference": false
    }
  ],
  "open_questions": [
    {
      "question": "string",
      "why_it_matters": "string"
    }
  ],
  "risks_and_dependencies": [
    {
      "type": "Risk | Dependency",
      "description": "string — prefix with 'Inference — requires human validation:' if inferred",
      "severity": "High | Medium | Low",
      "supporting_evidence": "short quote or paraphrase from source",
      "is_inference": false
    }
  ],
  "action_items": [
    {
      "action": "string — prefix with 'Inference — requires human validation:' if inferred",
      "suggested_owner": "string",
      "priority": "High | Medium | Low",
      "evidence": "short quote or paraphrase from source",
      "is_inference": false
    }
  ],
  "ai_opportunities": [
    {
      "opportunity": "string",
      "potential_benefit": "string",
      "feasibility": "High | Medium | Low",
      "caution": "string",
      "potential_value": "High | Medium | Low",
      "effort": "High | Medium | Low",
      "data_availability": "High | Medium | Low",
      "human_oversight_required": "Yes | No",
      "risk": "High | Medium | Low",
      "recommendation": "Pilot | Explore | Defer | Not recommended"
    }
  ]
}

Produce exactly 3 ai_opportunities. For each ai_opportunity, the recommendation field must follow this logic: 'Pilot' if feasibility is High and risk is Low or Medium; 'Explore' if feasibility is Medium; 'Defer' if effort is High and potential_value is Low; 'Not recommended' if risk is High and data_availability is Low. Ensure key_requirements has at least 5 items if the material supports it. Ensure open_questions captures genuinely missing or ambiguous information."""

QA_SYSTEM_PROMPT = """You are a project assistant. You can ONLY answer questions based on the project notes provided to you.

RULES:
1. Answer ONLY from information explicitly stated in the project notes.
2. Do NOT infer, guess, or use outside knowledge.
3. If the answer is not in the notes, respond with exactly: "I couldn't find this information in the provided project material."
4. Keep answers concise and factual.
5. Quote or reference the relevant part of the notes when possible."""


VERIFY_SYSTEM_PROMPT = """You are an independent fact-checker for a document intelligence system.

You will be given:
1. SOURCE TEXT — the raw project notes a user submitted.
2. CLAIMS — a numbered list of claims extracted from those notes.

For EACH claim, decide whether it is:
- "supported"    — the claim is clearly backed by the source text.
- "partial"      — the claim is partially supported but goes slightly beyond what the source explicitly states.
- "unsupported"  — the claim overreaches the source text or cannot be verified from it.

CRITICAL RULES:
1. Judge ONLY on what the source text says — do not use outside knowledge.
2. An inference explicitly labelled as such in the claim is NOT automatically unsupported; judge whether the underlying basis is in the source.
3. Return ONLY valid JSON — no preamble, no explanation, no code fences.
4. Return a JSON array with one object per claim:
   [{"id": "<id>", "verification": "supported" | "partial" | "unsupported"}, ...]"""


# ─── Helper: call Groq with fallback ──────────────────────────────────────────

def call_groq(messages: list, model: Optional[str] = None) -> str:
    """Call Groq API. Falls back to smaller model only on rate-limit/server errors."""
    if not client:
        raise HTTPException(
            status_code=503,
            detail="LLM service not configured. Please set GROQ_API_KEY in backend/.env"
        )

    primary = model or GROQ_MODEL

    try:
        logger.info(f"Calling Groq model: {primary}")
        response = client.chat.completions.create(
            model=primary,
            messages=messages,
            temperature=0.1,
            max_tokens=4096,
        )
        return response.choices[0].message.content
    except Exception as e:
        error_str = str(e)
        logger.warning(f"Primary model {primary} failed: {error_str}")

        # Only try fallback if error is NOT a model-not-found or auth error
        # (those will also fail on the fallback)
        if GROQ_FALLBACK_MODEL and GROQ_FALLBACK_MODEL != primary and (
            "rate_limit" in error_str.lower() or
            "529" in error_str or
            "500" in error_str or
            "502" in error_str or
            "503" in error_str
        ):
            try:
                logger.info(f"Retrying with fallback model: {GROQ_FALLBACK_MODEL}")
                response = client.chat.completions.create(
                    model=GROQ_FALLBACK_MODEL,
                    messages=messages,
                    temperature=0.1,
                    max_tokens=4096,
                )
                return response.choices[0].message.content
            except Exception as fallback_err:
                logger.error(f"Fallback model also failed: {fallback_err}")

        raise HTTPException(
            status_code=502,
            detail=f"LLM request failed: {error_str}"
        )



def find_evidence_span(source: str, evidence: str) -> tuple[int, int] | None:
    """Find best-matching span of evidence in source text.
    Returns (start, end) char offsets or None if no confident match found.
    Strategy: try exact substring first; then try longest common window.
    """
    if not evidence or len(evidence) < 8:
        return None

    # Normalise for matching
    source_lower = source.lower()
    evidence_lower = evidence.strip().lower()

    # 1. Exact substring match
    idx = source_lower.find(evidence_lower)
    if idx != -1:
        return (idx, idx + len(evidence))

    # 2. Try sliding-window with longest matching phrase (min 8 chars)
    # Split evidence into words, build progressively shorter ngrams from the
    # middle outward, stop at first match covering >=60% of words.
    words = evidence_lower.split()
    if len(words) < 2:
        return None

    threshold = max(2, int(len(words) * 0.6))
    # Try all windows of length from len(words) down to threshold
    for window in range(len(words), threshold - 1, -1):
        for start_w in range(len(words) - window + 1):
            phrase = ' '.join(words[start_w: start_w + window])
            idx = source_lower.find(phrase)
            if idx != -1:
                return (idx, idx + len(phrase))

    return None


def extract_json(text: str) -> dict:
    """Extract and parse JSON from LLM response, handling code fences."""
    # Strip markdown code fences if present
    text = text.strip()
    # Remove ```json ... ``` or ``` ... ```
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        # Try to find JSON object in the text
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
        raise ValueError(f"Could not parse LLM response as JSON: {e}")


def validate_brief(data: dict) -> dict:
    """Validate that the brief has required top-level keys."""
    required_keys = [
        "project_overview",
        "key_requirements",
        "open_questions",
        "risks_and_dependencies",
        "action_items",
        "ai_opportunities",
    ]
    missing = [k for k in required_keys if k not in data]
    if missing:
        raise ValueError(f"LLM response missing required sections: {missing}")

    # Ensure ai_opportunities has exactly 3 (or at least some)
    if not isinstance(data.get("ai_opportunities"), list) or len(data["ai_opportunities"]) == 0:
        raise ValueError("ai_opportunities must be a non-empty list")

    return data


def run_verification(source_text: str, items: list[dict]) -> dict:
    """Call Groq to independently verify each extracted claim against the source.

    Returns a dict mapping item id -> verification string.
    On ANY failure, logs a warning and returns {} so the caller can degrade
    gracefully by stamping items as 'not independently verified'.
    """
    if not items:
        return {}

    # Build a flat numbered list: id + primary claim text only (no evidence/JSON)
    lines = []
    for item in items:
        lines.append(f"{item['id']}: {item['text']}")
    claims_block = "\n".join(lines)

    messages = [
        {"role": "system", "content": VERIFY_SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"SOURCE TEXT:\n---\n{source_text}\n---\n\n"
                f"CLAIMS:\n{claims_block}"
            ),
        },
    ]

    try:
        logger.info(f"Verification call: {len(items)} items to verify")
        raw = call_groq(messages)
        parsed = extract_json(raw)
        # parsed should be a list; turn it into id -> verification map
        if isinstance(parsed, list):
            return {entry["id"]: entry["verification"] for entry in parsed if "id" in entry and "verification" in entry}
        logger.warning("Verification response was not a list; degrading gracefully")
        return {}
    except Exception as e:
        logger.warning(f"Verification pass failed (degrading gracefully): {e}")
        return {}



# ─── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "ok",
        "llm_configured": client is not None,
        "model": GROQ_MODEL
    }


@app.post("/analyze")
def analyze(request: AnalyzeRequest):
    """Analyze project notes and return a structured project brief."""
    messages = [
        {"role": "system", "content": ANALYZE_SYSTEM_PROMPT},
        {"role": "user", "content": f"Analyse the following project notes:\n\n{request.text}"},
    ]

    raw = call_groq(messages)
    logger.info(f"Raw LLM response (first 200 chars): {raw[:200]}")

    try:
        data = extract_json(raw)
        validated = validate_brief(data)

        # ── Evidence span enrichment ────────────────────────────────────────
        # Add start/end character offsets so the frontend can highlight the
        # matching text span in the original source without any extra API call.
        source_text = request.text

        INFERENCE_PREFIX = "Inference"

        for item in validated.get("key_requirements", []):
            ev = item.get("evidence", "")
            span = find_evidence_span(source_text, ev)
            item["span_start"]  = span[0] if span else None
            item["span_end"]    = span[1] if span else None
            # Authoritative is_inference: check the requirement text itself
            item["is_inference"] = item.get("requirement", "").startswith(INFERENCE_PREFIX)

        for item in validated.get("risks_and_dependencies", []):
            ev = item.get("supporting_evidence", "")
            span = find_evidence_span(source_text, ev)
            item["span_start"]  = span[0] if span else None
            item["span_end"]    = span[1] if span else None
            item["is_inference"] = item.get("description", "").startswith(INFERENCE_PREFIX)

        for item in validated.get("action_items", []):
            ev = item.get("evidence", "")
            span = find_evidence_span(source_text, ev)
            item["span_start"]  = span[0] if span else None
            item["span_end"]    = span[1] if span else None
            item["is_inference"] = item.get("action", "").startswith(INFERENCE_PREFIX)

        # ── Independent verification pass ───────────────────────────────────
        # Build a flat list of {id, text} for all reviewable items, then call
        # run_verification once. Merge results back; default to
        # 'not independently verified' if the call failed or id is missing.
        verify_items = []
        for i, item in enumerate(validated.get("key_requirements", [])):
            verify_items.append({"id": f"req-{i}", "text": item.get("requirement", "")})
        for i, item in enumerate(validated.get("risks_and_dependencies", [])):
            verify_items.append({"id": f"risk-{i}", "text": item.get("description", "")})
        for i, item in enumerate(validated.get("action_items", [])):
            verify_items.append({"id": f"action-{i}", "text": item.get("action", "")})

        verification_map = run_verification(source_text, verify_items)

        for i, item in enumerate(validated.get("key_requirements", [])):
            item["verification"] = verification_map.get(f"req-{i}", "not independently verified")
        for i, item in enumerate(validated.get("risks_and_dependencies", [])):
            item["verification"] = verification_map.get(f"risk-{i}", "not independently verified")
        for i, item in enumerate(validated.get("action_items", [])):
            item["verification"] = verification_map.get(f"action-{i}", "not independently verified")

        return validated
    except (ValueError, KeyError) as e:
        logger.error(f"JSON validation failed: {e}\nRaw response: {raw}")
        raise HTTPException(
            status_code=422,
            detail=f"The AI returned an unexpected format. Please try again. (Detail: {e})"
        )


@app.post("/qa")
def qa(request: QARequest):
    """Answer a question grounded strictly in the provided project notes."""
    messages = [
        {"role": "system", "content": QA_SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"PROJECT NOTES:\n---\n{request.project_text}\n---\n\n"
                f"QUESTION: {request.question}"
            ),
        },
    ]

    answer = call_groq(messages)
    return {"answer": answer.strip()}
