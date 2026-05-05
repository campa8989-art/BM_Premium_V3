$ErrorActionPreference = "Continue"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ProjectRoot = $ScriptDir
$NodeTools = Join-Path (Split-Path -Parent $ScriptDir) "tools\nodejs"

$env:PATH = "$NodeTools;$env:PATH"
$env:NODE_PATH = $NodeTools
Set-Location $ProjectRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BM Premium V2 - Avvio Vite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "URL: http://localhost:3000" -ForegroundColor Yellow
Write-Host ""

$proc = Start-Process -FilePath "node" -ArgumentList "node_modules\vite\bin\vite.js","--port","3000","--host" -WorkingDirectory $ProjectRoot -PassThru -WindowStyle Normal

Start-Sleep -Seconds 3

if (!$proc.HasExited) {
    Write-Host "Server avviato!" -ForegroundColor Green
    Start-Process "http://localhost:3000"
} else {
    Write-Host "Errore nell'avvio" -ForegroundColor Red
}

Write-Host ""
Write-Host "Premi un tasto per uscire..." -ForegroundColor Gray
Read-Host