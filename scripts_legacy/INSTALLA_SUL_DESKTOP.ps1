# Script di configurazione per il Desktop aziendale
$AppRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition

Write-Host "--- Configurazione Launcher BM Premium V2 ---" -ForegroundColor Cyan

# 1. Creazione Scorciatoia sul Desktop
try {
    $WshShell = New-Object -ComObject WScript.Shell
    $DesktopPath = [Environment]::GetFolderPath("Desktop")
    $ShortcutFile = Join-Path $DesktopPath "BM Premium V2.lnk"
    
    $Shortcut = $WshShell.CreateShortcut($ShortcutFile)
    $Shortcut.TargetPath = "$AppRoot\AVVIA_DASHBOARD.bat"
    $Shortcut.WorkingDirectory = "$AppRoot"
    $Shortcut.Description = "Avvia la Dashboard Building Manager Premium V2"
    
    # Icona: Usiamo un'icona professionale da shell32 (es. 238 è un monitor con dashboard)
    $Shortcut.IconLocation = "shell32.dll, 238"
    
    $Shortcut.Save()
    
    Write-Host "✅ Scorciatoia creata sul Desktop!" -ForegroundColor Green
    Write-Host "   Nome: BM Premium V2" -ForegroundColor Gray
} catch {
    Write-Host "❌ Errore nella creazione della scorciatoia: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Installazione completata. Ora puoi avviare la Dashboard direttamente dal Desktop." -ForegroundColor Yellow
Start-Sleep -Seconds 2
