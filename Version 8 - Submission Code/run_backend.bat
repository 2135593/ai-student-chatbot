@echo off
title AI Chatbot Backend
cd /d "%~dp0backend"
if not exist ".venv\Scripts\activate.bat" (
  echo ERROR: backend virtual environment was not found.
  echo Run start_chatbot.bat first.
  pause
  exit /b 1
)
call .venv\Scripts\activate.bat
uvicorn main:app --reload --host 0.0.0.0 --port 8000
pause
