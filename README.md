# M Moser AI Brief Assistant

**"Turn unstructured project notes into actionable project intelligence."**

A candidate portfolio prototype demonstrating practical AI application for professional services / workplace design contexts.

---

## 1. Problem

Project briefs and meeting notes in professional services are often unstructured, incomplete, and inconsistently captured. Critical requirements, risks, and open questions are buried in free-text documents, leading to miscommunication, missed scope items, and rework.

## 2. Solution

A lightweight AI assistant that accepts raw project notes and returns a validated, structured project brief — covering requirements, open questions, risks, action items, and AI opportunities — with full source grounding and a human-in-the-loop review workflow.

## 3. Workflow

```
User pastes notes
       ↓
Frontend (React) sends POST /analyze
       ↓
FastAPI backend validates input
       ↓
Prompt + notes sent to Groq LLM (llama-3.3-70b)
       ↓
LLM returns structured JSON
       ↓
Backend validates JSON schema
       ↓
Frontend renders results dashboard
       ↓
User reviews each item (Confirm / Edit / Dismiss)
       ↓
User asks follow-up questions via /qa (grounded Q&A)
```

## 4. Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | React 18, TypeScript, Vite        |
| Backend  | Python 3.10+, FastAPI, Uvicorn    |
| AI       | Groq API (llama-3.3-70b-versatile)|
| Styling  | Vanilla CSS, Inter font           |

## 5. How AI Was Used

- **Structured extraction**: A detailed system prompt instructs the LLM to extract requirements, risks, questions, and actions from the user's notes, grounded in source evidence.
- **Source grounding**: The prompt explicitly forbids inventing information. Missing data must be labeled `"Not specified in source material."` and inferences must be labeled `"Inference — requires human validation."`.
- **Grounded Q&A**: A separate endpoint answers questions only from the submitted notes. If the answer is not present, the model returns a fixed fallback string.
- **Structured output**: The LLM is instructed to return strict JSON. The backend validates the response schema before sending it to the frontend.
- **Fallback model**: If the primary model fails, the backend automatically retries with a smaller fallback model.

## 6. How Outputs Were Validated

- **Backend JSON validation**: `extract_json()` strips code fences and parses the response. `validate_brief()` checks for all required top-level keys.
- **Frontend validation**: Client-side check confirms `project_overview` and `key_requirements` are present before rendering.
- **Human-in-the-loop**: Every requirement, risk, and action item has Confirm / Edit / Dismiss controls. Reviewed items are visually distinguished.
- **Source evidence**: Every output item includes an evidence snippet linking it back to the source material.

## 7. Limitations

- LLM outputs may contain errors, hallucinations, or misinterpretations — always human review before use.
- Ambiguous or poorly written notes may produce inconsistent categorisation.
- The Q&A grounding relies on the model's instruction-following, which is not 100% reliable.
- This prototype uses synthetic data only. Do NOT enter real client or confidential information.
- No authentication, persistence, or audit trail — not suitable for production use.
- Rate limits apply on the Groq free tier.

## 8. How to Run Locally

### Prerequisites
- Python 3.10+
- Node.js 18+
- A Groq API key (free at [console.groq.com](https://console.groq.com))

### Backend

```bash
cd backend

# Create and activate a virtual environment (recommended)
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt

# Create .env file
copy .env.example .env
# Edit .env and add your GROQ_API_KEY

uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

### Environment Variables

| Variable             | Required | Description                          |
|----------------------|----------|--------------------------------------|
| `GROQ_API_KEY`       | ✅ Yes   | Your Groq API key                    |
| `GROQ_MODEL`         | Optional | Primary model (default: llama-3.3-70b-versatile) |
| `GROQ_FALLBACK_MODEL`| Optional | Fallback model (default: llama-3.1-8b-instant)   |

---

*Prototype built for M Moser Associates AI Practice Consultant application. All data is fictional.*
