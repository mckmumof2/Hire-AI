@echo off
setlocal
title Hire AI - Professional Recruitment Studio

echo ============================================================
echo   Hire AI - Smart Recruitment Studio for Architecture
echo ============================================================
echo.

:: Check for Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/ to run this app.
    pause
    exit /b 1
)

echo [1/3] Checking dependencies...
if not exist "node_modules\" (
    echo Installing root dependencies...
    call npm install
)
if not exist "client\node_modules\" (
    echo Installing client dependencies (this may take a minute)...
    cd client && call npm install && cd ..
)

echo [2/3] Starting Backend Server...
start /b cmd /c "npm run server"

echo [3/3] Starting Frontend Dashboard...
echo.
echo ============================================================
echo   SUCCESS: App is starting! 
echo   - Recruiter Dashboard: http://localhost:5173
echo   - Candidate Apply Page: http://localhost:5173/#apply
echo ============================================================
echo.
echo (Keep this window open while using the app)
echo.

npm run client
pause
