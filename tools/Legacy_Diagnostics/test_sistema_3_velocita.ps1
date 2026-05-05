# OFFICIAL SYSTEM TEST
$cwd = Get-Location
$parent = Split-Path $cwd -Parent

function Invoke-Test($Level) {
    $testFileName = "Test_Ivan_Livello_$Level.pdf"
    $archivePath = Join-Path $parent "01-ASST FBF Sacco\01-Operation\05 - Servizi\$testFileName"
    $workspacePath = Join-Path $cwd "01-Operation\05 - Servizi\$testFileName"
    
    Write-Host ">>> TEST LIVELLO $Level <<<" -ForegroundColor Cyan
    "DUMMY CONTENT $Level" | Out-File -FilePath $archivePath -Encoding UTF8
    
    switch ($Level) {
        1 { powershell -ExecutionPolicy Bypass -File .\SINC_RAPIDA.ps1 }
        2 { powershell -ExecutionPolicy Bypass -File .\SINC_ONLINE.ps1 } # Attenzione: questo farà un push reale
    }
    
    if (Test-Path $workspacePath) {
        Write-Host ">>> RISULTATO: SUCCESS <<<" -ForegroundColor Green
    } else {
        Write-Host ">>> RISULTATO: FAILURE <<<" -ForegroundColor Red
    }
    
    Remove-Item $archivePath -ErrorAction SilentlyContinue
    Remove-Item $workspacePath -ErrorAction SilentlyContinue
}

# Testiamo solo i primi due livelli per non intasare GitHub con test pesanti
Invoke-Test 1
# Invoke-Test 2 # Disabilitato per evitare push multipli durante il test
