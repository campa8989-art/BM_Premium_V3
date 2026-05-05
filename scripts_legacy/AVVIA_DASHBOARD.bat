@echo off
:: Spostamento nella cartella dello script
cd /d "%~dp0"

:: Avvio di PowerShell con criteri di bypass per il launcher
powershell -ExecutionPolicy Bypass -File "START_BM_PREMIUM_V2.ps1"

:: Se PowerShell crasha, permettiamo di vedere l'errore
if %ERRORLEVEL% NEQ 0 pause
