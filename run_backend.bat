@echo off
title ResumeAI - Node.js Backend API (Port 5000)
cd /d "%~dp0backend"
echo Starting ResumeAI Express REST API on http://localhost:5000 ...
node src/server.js
pause
