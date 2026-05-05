@echo off
setlocal EnableDelayedExpansion

cd /d "%~dp0"

set "NODE_PATH=%~dp0..\tools\nodejs"
set "PATH=%NODE_PATH%;%PATH%"

echo ========================================
echo   BM Premium V2 - Vite Server
echo ========================================
echo.
echo Cartella: %CD%
echo Node: %NODE_PATH%
echo.
echo Server: http://localhost:3000
echo.
echo Per fermare il server: CTRL+C
echo.

node node_modules\vite\bin\vite.js --port 3000 --host

pause