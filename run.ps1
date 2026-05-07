# ==============================================================================
# BUILDING MANAGER PREMIUM V2 - UNIFIED STARTUP SCRIPT
# ==============================================================================
# Questo script avvia tutti i servizi necessari per il dashboard:
# 1. Pulizia delle porte (3000, 3001)
# 2. Sincronizzazione AI Brain (GeminiManager)
# 3. Avvio API Verbali (Backend)
# 4. Avvio Vite (Frontend)
# 5. Apertura Browser
# ==============================================================================

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
if (!$ProjectRoot) { $ProjectRoot = Get-Location }

# --- 1. Configurazione Ambiente Node.js ---
$NodeTools = Join-Path $ProjectRoot "tools\nodejs"
if (Test-Path $NodeTools) {
    Write-Host "[OK] Utilizzo Node.js locale da tools/" -ForegroundColor Gray
    $env:PATH = $NodeTools + ";" + $env:PATH
    $env:NODE_PATH = $NodeTools
}

Clear-Host
Write-Host "####################################################" -ForegroundColor Cyan
Write-Host "#      BUILDING MANAGER PREMIUM - VERSION 2.0      #" -ForegroundColor Cyan
Write-Host "####################################################" -ForegroundColor Cyan
Write-Host ""

try {
    # --- 2. Verifica Prerequisiti ---
    Write-Host "[1/5] Verifica ambiente..." -ForegroundColor Yellow
    
    $NodeExe = Join-Path $NodeTools "node.exe"
    if (!(Test-Path $NodeExe)) { $NodeExe = "node" }
    
    # Usiamo virgolette per gestire spazi nel percorso
    & $NodeExe "src/backend/check_env.cjs"
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    # --- 3. Pulizia Chirugica Porte ---
    Write-Host "[2/5] Reset canali di comunicazione (3000, 3001)..." -ForegroundColor Yellow
    $ports = @(3000, 3001)
    foreach ($port in $ports) {
        $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($conns) {
            foreach ($conn in $conns) {
                Write-Host "      - Liberando porta $port (Processo: $($conn.OwningProcess))..." -ForegroundColor Gray
                Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
            }
            Start-Sleep -Seconds 1
        }
    }

    # --- 4. Sincronizzazione AI Brain ---
    Write-Host "[3/5] Sincronizzazione AI Brain..." -ForegroundColor Yellow
    & $NodeExe "src/backend/GeminiManager.cjs"
    if ($LASTEXITCODE -ne 0) {
        throw "Errore durante la sincronizzazione dati Gemini."
    }

    # --- 5. Avvio Servizi ---
    Write-Host "[4/5] Avvio Server Backend e Frontend..." -ForegroundColor Yellow
    
    # Risoluzione percorsi assoluti per maggiore robustezza
    # (NodeExe già definito sopra)
    
    # Percorso Vite (usando separatori Windows per sicurezza)
    $ViteJs = Join-Path $ProjectRoot "node_modules\vite\bin\vite.js"
    
    # Avvio Backend (Server Verbali) in background (finestra nascosta)
    # Racchiudiamo il percorso tra virgolette per gestire gli spazi
    $BackendPath = Join-Path $ProjectRoot "src/backend/server_verbali.js"
    $backendProc = Start-Process -FilePath $NodeExe -ArgumentList "`"$BackendPath`"" -WorkingDirectory $ProjectRoot -PassThru -WindowStyle Hidden
    Write-Host "      - Backend API pronto su http://localhost:3001" -ForegroundColor Green

    # Avvio Frontend (Vite)
    Write-Host "      - Avvio Vite Dashboard (In background)..." -ForegroundColor Gray
    # Usiamo virgolette doppie per proteggere i percorsi con spazi
    # WindowStyle Hidden per mantenere pulito il desktop
    $ViteArgsString = "`"$ViteJs`" dev --port 3000 --host 0.0.0.0 --force"
    $frontendProc = Start-Process -FilePath $NodeExe -ArgumentList $ViteArgsString -WorkingDirectory $ProjectRoot -PassThru -WindowStyle Hidden -RedirectStandardOutput "vite_output.log" -RedirectStandardError "vite_error.log"

    # --- 6. Apertura Browser ---
    Write-Host "[5/5] Apertura interfaccia..." -ForegroundColor Cyan
    
    # Attesa che Vite sia pronto (massimo 30 secondi)
    $attempts = 0
    while ($attempts -lt 30) {
        $check = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
        if ($check) { 
            Write-Host "      - Frontend pronto!" -ForegroundColor Green
            break 
        }
        $attempts++
        Start-Sleep -Seconds 1
    }

    # Apertura browser (usiamo localhost per risoluzione automatica OS)
    Start-Process "http://localhost:3000/"
    
    Write-Host ""
    Write-Host "DASHBOARD PRONTA!" -ForegroundColor Green
    Write-Host "Premi CTRL+C per terminare i processi o chiudi questa finestra." -ForegroundColor Gray
    
    # Mantieni il processo attivo per monitorare i server
    while ($true) {
        if ($backendProc -and $backendProc.HasExited) {
            Write-Host "[AVVISO] Il processo Backend non e' piu' attivo." -ForegroundColor Yellow
        }
        if ($frontendProc.HasExited) {
            Write-Host "[AVVISO] Il processo Frontend non e' piu' attivo. Controlla la finestra di Vite." -ForegroundColor Yellow
            Start-Sleep -Seconds 10
        }
        Start-Sleep -Seconds 5
    }
}
catch {
    Write-Host ""
    Write-Host "ERRORE CRITICO:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Premi un tasto per uscire..." -ForegroundColor Yellow
    $null = [Console]::ReadKey()
}
finally {
    # Cleanup finale al termine dello script
    Write-Host "[STOP] Arresto server in corso..." -ForegroundColor Red
    if ($backendProc -and !$backendProc.HasExited) { Stop-Process -Id $backendProc.Id -Force }
    if ($frontendProc -and !$frontendProc.HasExited) { Stop-Process -Id $frontendProc.Id -Force }
    Write-Host "[OK] Pulizia completata." -ForegroundColor Gray
}
