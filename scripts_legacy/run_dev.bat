@echo off
cd /d "%~dp0"
set PATH=%~dp0..\tools\nodejs;%PATH%
npm run dev
pause