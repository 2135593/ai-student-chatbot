# Final Demo Script for Viva / Lecturer Testing

## 1. Start-up
1. Run `setup_windows.bat` once if the project has not been installed before.
2. Start Ollama and ensure the configured models are available.
3. Run `start_chatbot.bat`.
4. Open `http://localhost:5173`.

## 2. Admin demonstration
1. Log in as `admin / admin123`.
2. Open **Manage Documents**.
3. Upload `docs/demo-materials/CMP600_demo_upload.txt`.
4. Rename the document to show document edit functionality.
5. Open the chatbot and ask: `When is the CMP600 deadline?`
6. Point out that the answer uses source IDs and the source panel shows citation evidence.
7. Ask: `When is the CMP605 deadline?` and show that the system refuses to guess if no source exists.
8. Open **Manage FAQ** and add, edit, then delete a sample FAQ.
9. Open **Manage Users** and create a temporary student user, then delete it.

## 3. Student demonstration
1. Log out.
2. Register a new student or log in as `student / student123`.
3. Show that admin pages are not available to a student account.
4. Create, edit, complete and delete a reminder.
5. Ask a document-based question and show chat history persistence.

## 4. Testing evidence
1. Run `backend/run_tests.bat`.
2. Screenshot the passing test output.
3. Screenshot key manual tests from the testing table.

## 5. Points to explain in the viva
- The system uses a local-first RAG architecture: uploaded files are chunked, embedded, indexed in FAISS, then retrieved before the LLM answers.
- Citations improve transparency because users can see which uploaded document/FAQ supported an answer.
- Role-based access protects admin actions such as document, FAQ and user management.
- The fallback behaviour reduces hallucination by refusing unsupported answers.
- SQLite is suitable for the prototype, with a clear upgrade path to PostgreSQL for deployment.
