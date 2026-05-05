@echo off
cd /d "%~dp0"
set PATH=%~dp0..\tools\nodejs;%PATH%

echo ========================================
echo   BM Premium V2 - Vite Server
echo ========================================
echo.

echo Avvio server su http://localhost:3000
echo.

node node_modules\vite\bin\vite.js --port 3000 --host

pause