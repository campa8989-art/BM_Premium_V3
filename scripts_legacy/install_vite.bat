@echo off
cd /d "%~dp0"
set PATH=%~dp0..\tools\nodejs;%PATH%
npm install vite --save-dev
pause