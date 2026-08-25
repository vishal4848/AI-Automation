@echo off
setlocal enabledelayedexpansion

echo ======================================
echo  AI Automation - Starting All Services
echo ======================================

set "PROJECT_ROOT=%~dp0"
set "BACKEND_DIR=%PROJECT_ROOT%ai-automation-backend"
set "FRONTEND_DIR=%PROJECT_ROOT%ai-automation-app"

echo Project Root: %PROJECT_ROOT%
echo.

if not exist "%BACKEND_DIR%" (
    echo [ERROR] Backend folder not found at: "%BACKEND_DIR%"
    echo Please make sure ai-automation-backend exists.
    pause
    exit /b 1
)

if not exist "%FRONTEND_DIR%" (
    echo [ERROR] Frontend folder not found at: "%FRONTEND_DIR%"
    echo Please make sure ai-automation-app exists.
    pause
    exit /b 1
)

echo [1/2] Starting NestJS Backend (port 3001)...
start "NestJS Backend (Port 3001)" cmd /k "cd /d "%BACKEND_DIR%" && npm run start:dev"

timeout /t 3 /nobreak > nul

echo [2/2] Starting Next.js Frontend (port 3000)...
start "Next.js Frontend (Port 3000)" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev"

echo.
echo ======================================
echo  Services starting up...
echo  Frontend: http://localhost:3000
echo  Backend:  http://localhost:3001
echo  API Docs: http://localhost:3001/api/docs
echo ======================================
pause
