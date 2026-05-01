@echo off
setlocal EnableExtensions EnableDelayedExpansion
title CMP600 AI Chatbot - One Click Setup and Launch
cd /d "%~dp0"

cls
echo ======================================================
echo CMP600 AI Chatbot - One Click Setup and Launch
echo ======================================================
echo.
echo This script checks/installs required tools, installs dependencies,
echo starts the backend/frontend, and opens the app.
echo.
echo First launch can take a while because AI packages and Ollama models
echo may need to download.
echo.

set "ROOT=%~dp0"
set "PY_CMD="
set "NPM_CMD="
set "OLLAMA_CMD="
set "FAST_MODEL=phi4-mini"
set "QUALITY_MODEL=llama3.1:8b"

rem Clear broken npm/node environment settings that can make npm look inside this project folder.
set "NPM_CONFIG_PREFIX="
set "npm_config_prefix="
set "NODE_PATH="
set "NODE_OPTIONS="

where winget >nul 2>&1
if %errorlevel% neq 0 (
  set "HAS_WINGET=0"
  echo WARNING: winget was not found. Missing tools may need manual install.
) else (
  set "HAS_WINGET=1"
)

echo.
echo [1/8] Checking Python 3.11+...
py -3 --version >nul 2>&1
if %errorlevel% equ 0 set "PY_CMD=py -3"
if "%PY_CMD%"=="" (
  python --version >nul 2>&1
  if %errorlevel% equ 0 set "PY_CMD=python"
)
if "%PY_CMD%"=="" if "%HAS_WINGET%"=="1" (
  echo Python not found. Installing Python 3.11...
  winget install -e --id Python.Python.3.11 --accept-package-agreements --accept-source-agreements
  py -3 --version >nul 2>&1
  if %errorlevel% equ 0 set "PY_CMD=py -3"
)
if "%PY_CMD%"=="" (
  echo ERROR: Python could not be found or installed.
  echo Install Python 3.11+ and tick Add Python to PATH, then run this file again.
  pause
  exit /b 1
)
%PY_CMD% --version

echo.
echo [2/8] Checking Node.js/npm...

rem Prefer the official Node.js install location. Avoid using a broken npm from the current folder/PATH.
if exist "%ProgramFiles%\nodejs\npm.cmd" set "NPM_CMD=%ProgramFiles%\nodejs\npm.cmd"
if "%NPM_CMD%"=="" if exist "%ProgramFiles(x86)%\nodejs\npm.cmd" set "NPM_CMD=%ProgramFiles(x86)%\nodejs\npm.cmd"
if not "%NPM_CMD%"=="" (
  set "PATH=%ProgramFiles%\nodejs;%ProgramFiles(x86)%\nodejs;%PATH%"
)

rem If Node/npm is missing or npm is broken, install/reinstall Node.js LTS with winget.
if "%NPM_CMD%"=="" if "%HAS_WINGET%"=="1" (
  echo Node.js/npm not found. Installing Node.js LTS...
  winget install -e --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
  if exist "%ProgramFiles%\nodejs\npm.cmd" set "NPM_CMD=%ProgramFiles%\nodejs\npm.cmd"
  if "%NPM_CMD%"=="" if exist "%ProgramFiles(x86)%\nodejs\npm.cmd" set "NPM_CMD=%ProgramFiles(x86)%\nodejs\npm.cmd"
)

if "%NPM_CMD%"=="" (
  echo ERROR: npm could not be found or installed.
  echo Install Node.js LTS from nodejs.org, then run this file again.
  pause
  exit /b 1
)

call "%NPM_CMD%" --version >nul 2>&1
if %errorlevel% neq 0 (
  echo Existing npm is broken or misconfigured. Reinstalling Node.js LTS...
  if "%HAS_WINGET%"=="1" (
    winget install -e --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
    if exist "%ProgramFiles%\nodejs\npm.cmd" set "NPM_CMD=%ProgramFiles%\nodejs\npm.cmd"
  )
)

call "%NPM_CMD%" --version
if %errorlevel% neq 0 (
  echo ERROR: npm is installed but still failing.
  echo Fix: uninstall Node.js, install Node.js LTS from nodejs.org, then run this file again.
  pause
  exit /b 1
)

echo.
echo [3/8] Checking Ollama...
where ollama >nul 2>&1
if %errorlevel% equ 0 set "OLLAMA_CMD=ollama"
if "%OLLAMA_CMD%"=="" if exist "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" set "OLLAMA_CMD=%LOCALAPPDATA%\Programs\Ollama\ollama.exe"
if "%OLLAMA_CMD%"=="" if exist "%ProgramFiles%\Ollama\ollama.exe" set "OLLAMA_CMD=%ProgramFiles%\Ollama\ollama.exe"
if "%OLLAMA_CMD%"=="" if "%HAS_WINGET%"=="1" (
  echo Ollama not found. Installing Ollama...
  winget install -e --id Ollama.Ollama --accept-package-agreements --accept-source-agreements
  if exist "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" set "OLLAMA_CMD=%LOCALAPPDATA%\Programs\Ollama\ollama.exe"
  if "%OLLAMA_CMD%"=="" if exist "%ProgramFiles%\Ollama\ollama.exe" set "OLLAMA_CMD=%ProgramFiles%\Ollama\ollama.exe"
  if "%OLLAMA_CMD%"=="" where ollama >nul 2>&1 && set "OLLAMA_CMD=ollama"
)
if "%OLLAMA_CMD%"=="" (
  echo WARNING: Ollama was not found. The app opens, but AI answers need Ollama.
) else (
  "%OLLAMA_CMD%" --version
)

echo.
echo [4/8] Setting up backend virtual environment...
if not exist "%ROOT%backend" (
  echo ERROR: backend folder is missing.
  pause
  exit /b 1
)
cd /d "%ROOT%backend"
if not exist .venv\Scripts\activate.bat (
  %PY_CMD% -m venv .venv
  if %errorlevel% neq 0 (
    echo ERROR: Could not create backend virtual environment.
    pause
    exit /b 1
  )
)
call .venv\Scripts\activate.bat

echo.
echo [5/8] Installing/checking backend dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt
if %errorlevel% neq 0 (
  echo ERROR: Backend dependency installation failed.
  pause
  exit /b 1
)

echo.
echo [6/8] Installing/checking frontend dependencies...
if not exist "%ROOT%frontend" (
  echo ERROR: frontend folder is missing.
  pause
  exit /b 1
)
cd /d "%ROOT%frontend"
call "%NPM_CMD%" install
if %errorlevel% neq 0 (
  echo ERROR: Frontend dependency installation failed.
  pause
  exit /b 1
)

echo.
echo [7/8] Checking Ollama models...
if not "%OLLAMA_CMD%"=="" (
  "%OLLAMA_CMD%" list >nul 2>&1
  if %errorlevel% neq 0 (
    echo Starting Ollama server...
    start "Ollama Server" /min cmd /k ""%OLLAMA_CMD%" serve"
    timeout /t 8 /nobreak >nul
  )
  "%OLLAMA_CMD%" list | findstr /i "%FAST_MODEL%" >nul 2>&1
  if %errorlevel% neq 0 (
    echo Pulling fast model: %FAST_MODEL%
    "%OLLAMA_CMD%" pull %FAST_MODEL%
  ) else echo Fast model already installed.
  "%OLLAMA_CMD%" list | findstr /i "llama3.1" >nul 2>&1
  if %errorlevel% neq 0 (
    echo Pulling quality model: %QUALITY_MODEL%
    echo This is large and may take a while on first setup.
    "%OLLAMA_CMD%" pull %QUALITY_MODEL%
  ) else echo Quality model already installed.
) else (
  echo Skipping Ollama model download because Ollama is not installed.
)

echo.
echo [8/8] Launching the app...
cd /d "%ROOT%backend"
start "AI Chatbot Backend" cmd /k ""%ROOT%run_backend.bat""
timeout /t 4 /nobreak >nul
cd /d "%ROOT%frontend"
start "AI Chatbot Frontend" "%COMSPEC%" /k call "%ROOT%run_frontend.bat"
timeout /t 4 /nobreak >nul
start "" "http://localhost:5173"

echo.
echo ======================================================
echo AI Chatbot is starting.
echo ======================================================
echo Browser URL: http://localhost:5173
echo Backend API:  http://localhost:8000/docs
echo.
echo Demo accounts:
echo   Admin:   admin / admin123
echo   Student: student / student123
echo.
echo Keep the Backend and Frontend windows open while using the app.
echo If the browser opens before the app is ready, wait a few seconds and refresh.
echo.
pause
