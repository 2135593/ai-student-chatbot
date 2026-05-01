@echo off
title AI Chatbot Frontend
cd /d "%~dp0frontend"

set "NPM_CONFIG_PREFIX="
set "npm_config_prefix="
set "NODE_PATH="
set "NODE_OPTIONS="

where npm >nul 2>&1
if errorlevel 1 (
  echo ERROR: npm was not found. Install Node.js LTS and try again.
  pause
  exit /b 1
)

call npm run dev -- --host 0.0.0.0
pause