# Aggiorna shortcut per usare VBS (senza terminale)
$desktop = [Environment]::GetFolderPath("Desktop")
$shortcutPath = "$desktop\BM Premium V2.lnk"

if (Test-Path $shortcutPath) { 
    Remove-Item $shortcutPath -Force 
}

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($shortcutPath)

# Usa il file VBS che nasconde il terminale
$Shortcut.TargetPath = "C:\Users\PC\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\BM-Gestione-Commessa\AVVIA_BM_V2.vbs"

$Shortcut.IconLocation = "C:\Users\PC\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\BM-Gestione-Commessa\new version\assets\favicon.ico"
$Shortcut.Description = "BM Premium v2 - Dashboard"
$Shortcut.WorkingDirectory = "C:\Users\PC\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\BM-Gestione-Commessa"

$Shortcut.Save()

Write-Host "✅ Shortcut aggiornato!" -ForegroundColor Green
Write-Host "Ora l'avvio non mostra più il terminale!" -ForegroundColor Cyan