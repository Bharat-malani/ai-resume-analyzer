@echo off
title ResumeAI - Python AI Service (Port 8000)
cd /d "%~dp0ai_service"
echo Starting ResumeAI Python AI/NLP Service on http://127.0.0.1:8000 ...
.venv\Scripts\python server.py
pause
