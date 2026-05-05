# Rimuovi e ricrea shortcut
$desktop = [Environment]::GetFolderPath("Desktop")
$shortcutPath = "$desktop\BM Premium V2.lnk"

# Rimuovi vecchio shortcut
if (Test-Path $shortcutPath) {
    Remove-Item $shortcutPath -Force
    Write-Host "Vecchio shortcut rimosso" -ForegroundColor Yellow
}

# Crea nuovo shortcut
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($shortcutPath)

$Shortcut.TargetPath = "C:\Users\PC\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\BM-Gestione-Commessa\AVVIA_BM_PREMIUM_V2.bat"
$Shortcut.IconLocation = "C:\Users\PC\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\BM-Gestione-Commessa\new version\assets\bm_icon.ico"
$Shortcut.Description = "BM Premium v2 - Building Manager Dashboard"
$Shortcut.WorkingDirectory = "C:\Users\PC\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\BM-Gestione-Commessa"

$Shortcut.Save()

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ ICONA AGGIORNATA SUL DESKTOP!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Se non vedi il logo, prova:" -ForegroundColor Yellow
Write-Host "1. Premi F5 sul desktop per aggiornare" -ForegroundColor Cyan
Write-Host "2. Oppure riavvia Explorer" -ForegroundColor Cyan
Write-Host ""