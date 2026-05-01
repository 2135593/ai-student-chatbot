# Testing and Evidence Guide

This file explains how to evidence the system for the CMP600 submission and viva.

## Automated backend tests

From the `backend` folder:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
set CHATBOT_TEST_MODE=1
python -m pytest tests -v
```

Or double-click:

```text
backend/run_tests.bat
```

The test mode uses a small deterministic embedding model so tests can run without downloading a SentenceTransformers model. The real application still uses `all-MiniLM-L6-v2` unless `CHATBOT_TEST_MODE=1` is set.

## Manual test evidence to capture

Take screenshots for the appendix. Use this structure:

| Evidence ID | Screenshot to capture | Why it matters |
|---|---|---|
| T1 | Student login succeeds | Confirms authentication works for student role |
| T2 | Admin login succeeds | Confirms authentication works for admin role |
| T3 | Incorrect login rejected | Confirms secure error handling |
| T4 | Student blocked from admin pages | Confirms role-based access control |
| T5 | Admin uploads CMP600 document | Confirms document management works |
| T6 | Admin renames document | Confirms document edit requirement |
| T7 | Chatbot answers from uploaded document | Confirms core RAG function |
| T8 | Source panel shows citation ID, document, chunk, score and confidence | Confirms transparency/source-link objective |
| T9 | Chatbot refuses unsupported question | Confirms hallucination reduction |
| T10 | FAQ add/edit/delete | Confirms admin FAQ management |
| T11 | Reminder add/edit/complete/delete | Confirms time-management feature |
| T12 | Chat history persists after logout/login | Confirms persistence |
| T13 | Health check endpoint | Confirms backend, database and Ollama status can be diagnosed |
| T14 | Frontend responsive layout | Confirms usability/accessibility consideration |

## Suggested appendix wording

**Appendix D - Testing Evidence**

- Figure D1: Successful student login.
- Figure D2: Successful admin login.
- Figure D3: Invalid login rejection.
- Figure D4: Student role blocked from admin-only page.
- Figure D5: Admin document upload.
- Figure D6: Document rename/edit.
- Figure D7: Chatbot answer using uploaded CMP600 document.
- Figure D8: Citation/source panel showing retrieval evidence.
- Figure D9: Unsupported question fallback.
- Figure D10: FAQ create, update and delete.
- Figure D11: Reminder create, update, complete and delete.
- Figure D12: Automated PyTest results.
- Figure D13: Health endpoint showing backend status.

## Viva demo order

1. Start Ollama.
2. Run `start_chatbot.bat`.
3. Log in as admin.
4. Upload the CMP600 module guide.
5. Ask: `When is the CMP600 project submission due?`
6. Point out the citation/source panel.
7. Ask: `When is CMP605 due?` without uploading CMP605 evidence and explain the fallback.
8. Show FAQ management.
9. Show reminder management.
10. Show admin user management.
11. Run or show automated test output.
