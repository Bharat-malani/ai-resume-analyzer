@echo off
title ResumeAI - All Services Launcher
echo ==========================================================
echo Starting ResumeAI — AI-Powered Resume Analyzer & Job Match
echo ==========================================================
echo.
echo Launching [1/3] Python AI Microservice (Port 8000)...
start "ResumeAI - Python AI Service" cmd /k "run_ai.bat"

timeout /t 3 /nobreak >nul

echo Launching [2/3] Node.js Express Backend API (Port 5000)...
start "ResumeAI - Backend API" cmd /k "run_backend.bat"

timeout /t 2 /nobreak >nul

echo Launching [3/3] React Vite Frontend (Port 5173)...
start "ResumeAI - React Frontend" cmd /k "run_frontend.bat"

echo.
echo All 3 services are launching in their own terminal windows!
echo Open your browser to: http://localhost:5173
echo ==========================================================
pause
