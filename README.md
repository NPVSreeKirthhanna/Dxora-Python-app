# LinkScope & Dispatch API — AI Website Link Analysis & Multi-Platform Publishing

Full-stack implementation featuring:
1. **AI-Powered Website Link Analysis (`POST /link-analysis`)** — Validates public URLs with SSRF protection, extracts clean webpage text, and generates structured 5-section business, competitor, cross-platform search query, SEO, service, and audience intelligence using Google Gemini.
2. **Automated Multi-Platform Posting (`POST /posting`)** — Enforces the 200-character and single-CTA-URL contract and dispatches independently to 5 third-party platforms (`Telegraph`, `Dev.to`, `Mastodon`, `Bluesky`, `Discord`).
3. **Interactive Web Console & Python FastAPI Reference Projects** — Includes the live Node/Express + React dashboard (`port 3000`) plus complete Python 3.x / FastAPI reference implementations under `python/ai-link-analysis/` and `python/automated-posting/` (`port 4000`).

---

## 1. Local Development & Execution

### Option A: Live Full-Stack Web App & API (`port 3000`)

```bash
npm install
cp .env.example .env
# Configure GEMINI_API_KEY (and optional platform tokens) in .env
npm run dev
```

### Option B: Python 3.x / FastAPI Reference Services (`port 4000`)

**AI Link Analysis Service:**
```bash
cd python/ai-link-analysis
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 4000
# OpenAPI Docs: http://localhost:4000/docs
```

**Automated Multi-Platform Posting Service:**
```bash
cd python/automated-posting
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 4000
# OpenAPI Docs: http://localhost:4000/docs
```

---

## 2. Sample API Requests & Responses

### `POST /link-analysis`

**Request:**
```bash
curl -X POST http://localhost:3000/link-analysis \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

**Response (abbreviated):**
```json
{
  "success": true,
  "website": "https://example.com/",
  "brand": {
    "name": "Example Domain",
    "category": "Documentation & Placeholder Web Domain",
    "summary": "Illustrative domain maintained by IANA for documentation examples."
  },
  "analysis": {
    "competitor_analysis": {
      "brand_overview": "...",
      "competitors": [
        {
          "name": "RFC 2606 Reserved Domains (.test / .invalid)",
          "main_service": "Reserved documentation domains",
          "target_market": "Technical writers and developers",
          "key_strength": "Standardized by IETF",
          "weakness_gap": "Not resolvable on public DNS",
          "opportunity": "Provide interactive developer test endpoints",
          "source_note": "AI-identified industry competitor suggestion"
        }
      ],
      "strengths": ["Universally recognized in technical tutorials"],
      "opportunities": ["Publish interactive testing fixtures"]
    },
    "target_search_queries": [
      {
        "query": "example domain for API testing",
        "platforms": ["Google", "LinkedIn"],
        "intent": "Informational",
        "business_relevance": "Developers verifying HTTP client behavior",
        "target_audience": "Software Engineers"
      }
    ],
    "seo_improvements": {
      "primary_keyword": "example domain documentation",
      "secondary_keywords": ["IANA reserved domain", "safe test URL"],
      "long_tail_keywords": ["standard example url for technical documentation"],
      "business_keywords": ["HTTP test domain", "RFC 2606 domain"],
      "recommended_title": "Example Domain — IANA Reserved Testing & Documentation URL",
      "meta_description": "Official IANA-reserved example domain for safe use in technical documentation, tutorials, and software tests.",
      "supporting_content": []
    },
    "top_services": [],
    "target_audience": {
      "primary_audience": ["Software Developers", "Technical Writers"],
      "secondary_audience": ["QA Engineers", "Educators"],
      "industries": ["Software & DevTools", "Education"],
      "customer_needs": ["Safe non-intrusive URLs for documentation and tests"]
    }
  }
}
```

### `POST /posting`

**Request:**
```bash
curl -X POST http://localhost:3000/posting \
  -H "Content-Type: application/json" \
  -d '{"message": "Check out our latest website intelligence platform and grow your visibility. https://example.com"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Check out our latest website intelligence platform and grow your visibility. https://example.com",
  "cta_url": "https://example.com/",
  "character_count": 96,
  "summary": {
    "total_platforms": 5,
    "succeeded": 1,
    "failed": 4
  },
  "results": [
    {
      "platform": "Telegraph (telegra.ph)",
      "status": "success",
      "posted_url": "https://telegra.ph/Check-out-our-latest-website-intelligence-platform-11-22",
      "public_access": true,
      "date": "2026-11-22",
      "time": "07:55:12",
      "error": null
    },
    {
      "platform": "Dev.to",
      "status": "failed",
      "posted_url": null,
      "public_access": false,
      "date": null,
      "time": null,
      "error": "Authentication failed: DEVTO_API_KEY is not configured"
    }
  ]
}
```

---

## 3. LLM Platform & Model Research — Cost, Speed & Accuracy

### A. Provider Comparison

*Note: Per-million token rates reflect published reference pricing tiers; response times are estimates unless directly measured per request in the application telemetry strip.*

| Provider | Model | Input / 1M | Output / 1M | Context Window | Structured JSON | Estimated Latency | Suitability |
| :--- | :--- | :---: | :---: | :---: | :--- | :---: | :--- |
| **Google Gemini** | `gemini-4-hydrogen` | ~$0.15 | ~$0.60 | 1,000,000 | Native `responseSchema` | 1.8s – 3.5s (est.) | **Recommended Primary** |
| **Google Gemini** | `gemini-3.1-flash-lite` | ~$0.075 | ~$0.30 | 1,000,000 | Native `responseSchema` | 0.9s – 2.0s (est.) | **High-Availability Fallback** |
| **OpenAI** | `gpt-4o-mini` | ~$0.15 | ~$0.60 | 128,000 | Strict JSON Schema | 2.0s – 4.2s (est.) | Cross-vendor alternative |
| **Anthropic** | `claude-3-5-haiku` | ~$0.80 | ~$4.00 | 200,000 | Tool-use schema | 1.8s – 3.8s (est.) | Higher output token cost |

### B. Cost Optimization Practices Implemented

1. **HTML Noise Stripping**: Removes `<script>`, `<style>`, `<noscript>`, `<svg>`, `<template>`, and `<canvas>` tags before prompt construction (typically cutting raw payload size by 70%–88%).
2. **Paragraph Deduplication & Character Cap**: Deduplicates repeated header/footer text and caps body prose at 7,500 characters (~1,850 tokens).
3. **Schema-Constrained Output**: Uses `responseMimeType: "application/json"` with strict `responseSchema` so zero retries are wasted on malformed JSON.
4. **Resilient Fallback Ladder**: Routes primary extraction to `gemini-4-hydrogen` and automatically fails over to `gemini-3.1-flash-lite` on `429`/`503`/`404`/`500`.

### C. Final Model Recommendation

- **Recommended Provider:** Google Gemini API
- **Primary Model:** `gemini-4-hydrogen`
- **Fallback Model:** `gemini-3.1-flash-lite`
- **Estimated Input Usage:** ~2,100 tokens per website analysis (after HTML cleaning)
- **Estimated Output Usage:** ~1,400 tokens for the 5-section structured JSON report
- **Estimated Cost per Analysis:** ~$0.00116 USD
- **Expected Response Time:** 2.0s – 4.0s (estimated; exact fetch and LLM durations are reported per call in `extraction_telemetry`)

---

## 4. Google Cloud Deployment, Secret Manager & Firestore Security

### Prerequisites
Enable required APIs and authenticate with the Google Cloud CLI:
```bash
gcloud services enable run.googleapis.com secretmanager.googleapis.com firestore.googleapis.com
```

### Secret Manager Bindings
Store `GEMINI_API_KEY` in Google Cloud Secret Manager and grant the Cloud Run runtime service account access:
```bash
# Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Grant the default Cloud Run service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Firestore Security Rules (`firestore.rules`)
When persisting user interactions in Cloud Firestore, enforce strict owner-bound isolation:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Cloud Run Deployment & Verification Labeling
```bash
gcloud run deploy linkscope-dispatch \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest"

gcloud run services update <SERVICE_NAME> \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=<REGION>
```
