# AI Student Chatbot – CMP600 Extended Project
## Overview
This project presents a locally hosted AI-powered chatbot designed to improve how students access academic information. Students often struggle to locate key information (e.g. deadlines, timetables, module guides) due to fragmentation across multiple systems. 

This system addresses that problem by:
- Centralising academic information
- Allowing natural language queries
- Providing source-referenced responses for transparency

The chatbot is built using a Retrieval-Augmented Generation (RAG) architecture, ensuring responses are grounded in uploaded institutional documents rather than generated blindly.

---

## Project Aim

To design and develop an intelligent, ethical, and accessible AI chatbot that improves student access to reliable academic information through conversational interaction.

---

## Key Features

### Student Features
- Natural language question answering
- Accurate, summarised responses
- Source citations for transparency
- Multi-language support
- Chat history (conversation tracking)
- Reminder system (deadlines & events)

### Admin Features
- Upload and manage documents
- Add/edit/delete FAQs
- Maintain chatbot knowledge base
- Admin dashboard with role-based access

### AI Capabilities
- Semantic search using embeddings
- Context-aware responses via RAG pipeline
- Dual-model system:
  - Fast model (performance)
  - Quality model (accuracy)

---

## Tech Stack

### Frontend
- React (Vite)
- HTML5 / CSS3

### Backend
- FastAPI (Python)
- Uvicorn (ASGI server)

### AI / NLP
- Ollama (local LLM inference)
- SentenceTransformers (embeddings)
- FAISS (vector search)

### Database & Storage
- SQLite (users, conversations, messages)
- FAISS index (semantic retrieval)

### Additional Tools
- JWT Authentication (OAuth2)
- PyPDF / python-docx (document parsing)
- langdetect (language detection)

---

## Quick Start (One-Click Setup)

### Run the chatbot
Double-click the file below:

```
start_chatbot.bat
```

### What this does
- Installs dependencies (first run only)
- Creates Python virtual environment
- Starts backend API
- Starts frontend server
- Opens the chatbot in browser

**Note:** First run may take several minutes due to model downloads and package installation.

---

## Manual Setup (Fallback)

If the `.bat` file does not work:

### Backend Setup
```
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend Setup
```
cd frontend
npm install
npm run dev
```

---

## Test Accounts

### Student
```
Username: Student
Password: Student001
```

### Admin
```
Username: Admin
Password: Admin001
```

---

## Testing Strategy

The system has been tested using a combination of:
- Functional testing
- User-based testing
- API testing (Postman)

### Key Test Areas
- Authentication (valid/invalid login)
- Chatbot accuracy (retrieval vs hallucination)
- Document upload & retrieval
- FAQ management
- Reminder functionality

### Example Test Case
- Query: *“When is the CMP600 assessment due?”*
- Expected: Accurate answer sourced from uploaded documents
- If unavailable: System should avoid hallucination and prompt user accordingly

---

## System Architecture

### RAG Workflow
1. User submits query
2. Query converted into embeddings
3. FAISS retrieves relevant document chunks
4. Context passed to LLM
5. LLM generates response
6. Sources returned to user

### Architecture Style
- Client–Server (React ↔ FastAPI)
- Local-first AI system
- Modular backend design

---

## Project Structure

```
/frontend        → React UI
/backend         → FastAPI API
/data            → FAISS index + documents
/start_chatbot.bat
README.md
```

---

## Known Limitations

- Retrieval recall can vary depending on document structure
- Performance limited by local hardware
- Limited long-term conversational memory
- Initial setup requires dependency/model downloads

---

## Future Improvements

- Improved retrieval accuracy (reranking, better chunking)
- Cloud database integration (PostgreSQL)
- Real-time notifications for reminders
- Document preview/download support
- Enhanced conversation memory
- UI/UX improvements for admin features

---

## Assessor / Lecturer Guide

### Recommended Way to Test
1. Run `start_chatbot.bat`
2. Login using provided test accounts
3. Upload a document (admin)
4. Ask a question based on that document
5. Verify:
   - Response accuracy
   - Source citation
6. Test FAQ and reminder features

### If Issues Occur
- Use manual setup steps
- Check Python (3.11+) and Node.js installed
- Ensure Ollama is installed and running

### Evidence Provided
- Screenshots in report appendix
- Testing table included
- User evaluation results documented

---

## License

This project is developed for academic purposes (CMP600 Extended Project).

---

## Author

**Kai Roeves**  
BSc (Hons) Computing (Top-Up)  
Newcastle College University Centre

---
