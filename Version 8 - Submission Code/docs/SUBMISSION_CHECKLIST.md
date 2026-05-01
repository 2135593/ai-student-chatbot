# Final Submission Checklist

## Product ZIP

Include:

- `backend/`
- `frontend/`
- `README.md`
- `start_chatbot.bat`
- `docs/TESTING_AND_EVIDENCE_GUIDE.md`
- `docs/SUBMISSION_CHECKLIST.md`

Do not include:

- `frontend/node_modules/`
- `backend/.venv/`
- `backend/data/chatbot.db`
- `backend/data/faiss.index`
- `backend/data/faiss_meta.npy`
- `.env` containing secrets
- cache folders such as `__pycache__` or `.pytest_cache`

## Before hand-in

- Run the backend once and confirm seed users work.
- Run the frontend and confirm pages load.
- Upload at least one document and test a sourced answer.
- Test an unsupported question and confirm it does not invent an answer.
- Run `backend/run_tests.bat` and screenshot the results.
- Save screenshots into the report appendix.
- Make sure the report explains limitations honestly, especially that Ollama models must be installed locally for full LLM responses.

## Default accounts for the marker

- Admin: `admin / admin123`
- Student: `student / student123`

These are seed/demo users only. The README explains that production deployments should change credentials and set a stronger `SECRET_KEY`.
