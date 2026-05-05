@echo off
cd /d "%~dp0"
set PATH=%~dp0..\tools\nodejs;%PATH%

start "BM Premium V2" cmd /k "node node_modules\vite\bin\vite.js --port 3000 --host"
timeout /t 4 /nobreak >nul
start http://localhost:3000