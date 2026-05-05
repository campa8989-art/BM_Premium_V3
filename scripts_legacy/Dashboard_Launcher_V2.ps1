$AppRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition

# --- 1. Pulizia Chirugica Porte (3000 e 3100) ---
Write-Host "[Reset] Libero le porte di comunicazione..." -ForegroundColor Gray
$ports = @(3000, 3100)
foreach ($port in $ports) {
    $proc = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($proc) {
        Stop-Process -Id $proc.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

# --- 2. Logica Node.js ---
$NODE_EXE = "$AppRoot\..\tools\nodejs\node.exe"
if (-not (Test-Path $NODE_EXE)) { $NODE_EXE = "node" }
$env:PATH = "$AppRoot\..\tools\nodejs;$env:PATH"

Write-Host "----------------------------------------------------" -ForegroundColor Cyan
Write-Host "        💎 BUILDING MANAGER PREMIUM V2" -ForegroundColor Cyan
Write-Host "----------------------------------------------------" -ForegroundColor Cyan
Write-Host "[AI] Sincronizzazione Dati in corso..." -ForegroundColor Yellow

# --- 3. Sincronizzazione Gemini ---
& $NODE_EXE "$AppRoot\GeminiManager.js"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Sincronizzazione fallita." -ForegroundColor Red
    pause; exit
}

Write-Host "✅ Dati Sincronizzati." -ForegroundColor Green
Write-Host "[Server] Avvio Dashboard..." -ForegroundColor Yellow

# --- 4. Avvio Server (lite-server) ---
# Usiamo il comando standard che sappiamo funzionare nel .bat
$serverArgs = "/c npx lite-server"
Start-Process -FilePath "cmd.exe" -ArgumentList $serverArgs -WorkingDirectory "$AppRoot\.." -WindowStyle Hidden

# --- 5. Attesa Avvio e Apertura Browser ---
Write-Host "🚀 Apertura Dashboard in corso..." -ForegroundColor Gray
Start-Sleep -Seconds 3
Start-Process "http://localhost:3000/new%20version/index.html"

Write-Host "✨ Sistema operativo!" -ForegroundColor Green
Start-Sleep -Seconds 1
