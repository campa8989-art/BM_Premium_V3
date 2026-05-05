# Aggiorna shortcut con nuova icona
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\BM Premium V2.lnk")

# Path al launcher batch
$Shortcut.TargetPath = "C:\Users\PC\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\BM-Gestione-Commessa\AVVIA_BM_PREMIUM_V2.bat"

# Nuova icona CMF
$icoPath = "C:\Users\PC\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\BM-Gestione-Commessa\new version\assets\bm_icon.ico"
$Shortcut.IconLocation = $icoPath

$Shortcut.Description = "BM Premium v2 - Building Manager Dashboard"
$Shortcut.WorkingDirectory = "C:\Users\PC\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\BM-Gestione-Commessa"

$Shortcut.Save()

# Rimuovi vecchia icona se esiste
$oldPath = "C:\Users\PC\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\BM-Gestione-Commessa\new version\assets\cmf_icon.ico"
if (Test-Path $oldPath) { Remove-Item $oldPath }

Write-Host "✅ Icona aggiornata!" -ForegroundColor Green