@echo off
cd /d "%~dp0"
set PATH=%~dp0..\tools\nodejs;%PATH%
start "BM Premium V2" cmd /k "npm run dev"
exit