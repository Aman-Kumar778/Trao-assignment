# CONTEXT.md — Traq AI Interview Prep Kit Specifications

## 1. Kit JSON Contract (Appendix A)

```json
{
  "source": {
    "company": "",
    "company_url": "",
    "role": "",
    "location": "",
    "jd_chars": 0,
    "researched_at": "ISO-8601 string",
    "pages_used": ["https://..."]
  },
  "company_brief": {
    "summary": "",
    "what_they_do": "",
    "sources": ["https://..."]
  },
  "role": {
    "title": "",
    "seniority": "",
    "responsibilities": [""],
    "requirements": [
      {
        "id": "r1",
        "text": "5+ years with React",
        "kind": "technical",
        "priority": "must"
      }
    ]
  },
  "questions": [
    {
      "id": "q1",
      "requirement_ids": ["r1"],
      "category": "technical",
      "prompt": "",
      "answer_outline": "",
      "difficulty": 2
    }
  ],
  "flashcards": [
    {
      "id": "f1",
      "front": "",
      "back": "",
      "requirement_ids": ["r1"]
    }
  ],
  "schedule": {
    "days_available": 5,
    "days": [
      {
        "day": 1,
        "focus": "",
        "question_ids": ["q1"],
        "minutes": 60
      }
    ]
  },
  "coverage": {
    "uncovered_requirement_ids": [],
    "passes": 2
  }
}
```

### Validation Enums & Types
- `requirement.kind`: `"technical"` | `"behavioural"` | `"domain"`
- `requirement.priority`: `"must"` | `"nice"`
- `question.category`: `"technical"` | `"behavioural"` | `"system-design"` | `"company-fit"`
- `question.difficulty`: `1` | `2` | `3` (integer only)
- `schedule.days[].minutes`: integer only (no floats)
- Every `question.requirement_ids[]` and `flashcard.requirement_ids[]` must reference a valid `requirement.id`.
- Every `schedule.days[].question_ids[]` must reference a valid `question.id`.
- `schedule.days.length === schedule.days_available`.

---

## 2. Batch Evaluation Contract (Appendix B)

CLI Execution:
```bash
npm run evaluate -- --input <cases.json> --output <kits.json>
```

- **Input Format**: Array of objects:
  ```json
  [
    {
      "id": "case-1",
      "jd": "Software Engineer job description...",
      "company_url": "https://example.com",
      "days": 5
    }
  ]
  ```
- **Output Format**:
  ```json
  {
    "version": "1.0.0",
    "generated_at": "ISO-8601",
    "kits": [
      {
        "id": "case-1",
        "status": "ok",
        "kit": { /* Appendix A JSON object */ },
        "error": null
      },
      {
        "id": "case-2",
        "status": "failed",
        "kit": null,
        "error": {
          "code": "RETRIEVAL_FAILED",
          "message": "Detailed error string"
        }
      }
    ]
  }
  ```

---

## 3. Edit / Pin / Regenerate Metadata Schema (`_meta`)

Every array item (`requirement`, `question`, `flashcard`) and composite section carries metadata:
```ts
export interface MetaTag {
  origin: "generated" | "user_added" | "user_edited";
  generation_batch: number;
}
```

### Regeneration Merge Rules:
1. When user triggers section regeneration (e.g., `technical` questions or `company_brief`), execute LLM call scoped only to that target.
2. Retain all items in that section with `origin === "user_edited"` or `origin === "user_added"`.
3. Replace only items with `origin === "generated"` in that targeted category.
4. Recalculate coverage check and schedule over the newly merged dataset.

---

## 4. Edge Case Behavior Matrix

| Edge Case | Standardized Behavior |
|---|---|
| Invalid / 404 / Timeout Company URL | Crawler records empty `pages_used`. Kit generates from JD alone. Company brief says info could not be retrieved. |
| No hiring page found | Crawler uses homepage/about pages. Brief summarizes available text. Questions generated from JD. |
| Two-line / Thin JD | Extract only textually present requirements. Do not invent requirements to hit arbitrary minimums. |
| No public discussion found | Company fit / process questions fall back to JD-grounded standard questions without fabricating interview rounds. |
| Invalid LLM JSON | Retry once with strict JSON system prompt. If persistent, return empty section output gracefully without failing pipeline. |
| LLM Rate Limit (429) | Exponential backoff with jitter (max 3 retries). Request queue limits concurrency. |
| Duplicate Submission | Hash `(jd, company_url)`. If identical kit exists for user, return existing kit (idempotent). |
| 1-day or 60-day schedule | Clamp days cleanly. 1-day packs all must-haves into Day 1. 60-day distributes questions across days without duplication or padding. |

---

## 5. Security & Isolation Rules

- **URL Validation**: In production, block `file://`, loopback (`127.0.0.1`, `localhost`), and private IP ranges (`10.x`, `172.16-31.x`, `192.168.x`). In `development` / `test` mode, allow `http://localhost:8099/` for local test fixture servers.
- **Fetch Limits**: Enforce `Content-Type: text/html`, max 2MB body limit, 5s timeout.
- **Prompt Injection Defense**: Treat JDs and crawled webpage text as untrusted raw `<data>`. Never put raw web data in system instructions.
- **Crawl Rate Limiting**: Respect `robots.txt` and enforce minimum 1s delay between requests per host.
