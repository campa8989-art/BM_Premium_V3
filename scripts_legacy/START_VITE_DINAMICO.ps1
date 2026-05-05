$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ProjectRoot = $ScriptDir
$NodeTools = Join-Path (Split-Path -Parent $ScriptDir) "tools\nodejs"

$env:PATH = "$NodeTools;$env:PATH"
$env:NODE_PATH = $NodeTools

Set-Location $ProjectRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BM Premium V2 - Vite Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Project: $ProjectRoot" -ForegroundColor Gray
Write-Host "Node: $NodeTools" -ForegroundColor Gray
Write-Host ""

Write-Host "Starting Vite server..." -ForegroundColor Yellow
Write-Host "URL: http://localhost:3000" -ForegroundColor Green
Write-Host ""

npm run dev