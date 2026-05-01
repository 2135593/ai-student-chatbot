# Troubleshooting Guide

## The BAT file closes immediately
Run `setup_windows.bat` first. The start script expects `backend/.venv` and `frontend/node_modules` to exist.

## Backend window says uvicorn is not recognised
Activate the virtual environment and reinstall dependencies:

```bat
cd backend
.venv\Scripts\activate
pip install -r requirements.txt
```

## Frontend says npm is not recognised
Install Node.js LTS, then run:

```bat
cd frontend
npm install
```

## Chatbot says Ollama is not running
Open Ollama, then pull the models:

```bat
ollama pull phi4-mini
ollama pull llama3.1:8b
```

## Upload works but answers are weak
Upload a readable PDF, DOCX or TXT file with selectable text. Scanned image PDFs may not extract text correctly.

## Database needs resetting
Close the backend and delete:

```text
backend/data/chatbot.db
backend/data/faiss.index
backend/data/faiss_meta.npy
```

Restart the backend. Demo users and seed FAQs will be recreated.
