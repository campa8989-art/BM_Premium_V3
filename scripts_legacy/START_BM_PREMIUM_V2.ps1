$AppRoot = (Split-Path -Parent $MyInvocation.MyCommand.Definition)
$ProjectRoot = (Resolve-Path "$AppRoot\..").Path
$NodeToolsDir = Join-Path $ProjectRoot "tools\nodejs"

Clear-Host

# Configurazione Ambiente (Copiata dal batch funzionante)
$env:PATH = "$NodeToolsDir;$env:PATH"
$env:NODE_PATH = "$NodeToolsDir"

# Colori
$Cyan = "Cyan"
$Yellow = "Yellow"
$Green = "Green"
$Gray = "Gray"
$Red = "Red"

Write-Host "####################################################"
Write-Host "#      BUILDING MANAGER PREMIUM - VERSION 2.0      #"
Write-Host "####################################################"
Write-Host ""

try {
    # 1. Reset Porte
    Write-Host "[1/4] Ottimizzazione canali..." -ForegroundColor $Gray
    $proc = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if ($proc) {
        Stop-Process -Id $proc.OwningProcess -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
    }

    # 2. Sync AI
    Write-Host "[2/4] Sincronizzazione AI Brain..." -ForegroundColor $Yellow
    & node "$AppRoot\GeminiManager.cjs"
    if ($LASTEXITCODE -ne 0) {
        throw "Errore durante la sincronizzazione dati."
    }

    # 3. Avvio Server
    Write-Host "[3/4] Avvio Web Server in corso..." -ForegroundColor $Yellow
    # Lanciamo il server esattamente come nel batch originale
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c npx lite-server" -WorkingDirectory "$ProjectRoot" -WindowStyle Hidden
    
    # --- NOVITA': Controllo Reale della Porta ---
    Write-Host "      In attesa che il server si metta in ascolto..." -ForegroundColor $Gray
    $attempts = 0
    $maxAttempts = 15
    $serverReady = $false
    
    while ($attempts -lt $maxAttempts) {
        $check = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
        if ($check) {
            $serverReady = $true
            break
        }
        $attempts++
        Write-Host "." -NoNewline -ForegroundColor $Gray
        Start-Sleep -Seconds 1
    }
    Write-Host ""

    if (-not $serverReady) {
        throw "Il server non si e' avviato entro i tempi previsti (3000)."
    }
    Write-Host "      Server attivo e pronto." -ForegroundColor $Green

    # 4. Apertura Dashboard
    Write-Host "[4/4] Apertura interfaccia..." -ForegroundColor $Cyan
    Start-Process "http://localhost:3000/new%20version/index.html"

    Write-Host ""
    Write-Host "DASHBOARD PRONTA!" -ForegroundColor $Green
    Start-Sleep -Seconds 2
}
catch {
    Write-Host ""
    Write-Host "ERRORE CRITICO:" -ForegroundColor $Red
    Write-Host $_.Exception.Message -ForegroundColor $Red
    Write-Host ""
    Write-Host "Premi un tasto per uscire..." -ForegroundColor $Yellow
    $null = [Console]::ReadKey()
}
