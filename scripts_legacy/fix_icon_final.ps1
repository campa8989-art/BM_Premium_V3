# Download a simple ICO converter or use embedded resource
# This creates a simple .ico with proper header
Add-Type -AssemblyName System.Drawing

$pngPath = "C:\Users\PC\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\BM-Gestione-Commessa\new version\assets\cmf_logo.png"
$icoPath = "C:\Users\PC\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\BM-Gestione-Commessa\new version\assets\final_icon.ico"

# Load image
$bmp = [System.Drawing.Bitmap]::FromFile($pngPath)

# Resize to 32x32 for better compatibility
$smallBmp = New-Object System.Drawing.Bitmap(32, 32)
$g = [System.Drawing.Graphics]::FromImage($smallBmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($bmp, 0, 0, 32, 32)
$g.Dispose()

# Create icon and save
$icon = [System.Drawing.Icon]::FromHandle($smallBmp.GetHicon())

$fs = New-Object System.IO.FileStream($icoPath, [System.IO.FileMode]::Create)
$icon.Save($fs)
$fs.Close()

$bmp.Dispose()
$smallBmp.Dispose()

# Now update shortcut
$desktop = [Environment]::GetFolderPath("Desktop")
$shortcutPath = "$desktop\BM Premium V2.lnk"

if (Test-Path $shortcutPath) { Remove-Item $shortcutPath -Force }

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = "C:\Users\PC\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\BM-Gestione-Commessa\AVVIA_BM_PREMIUM_V2.bat"
$Shortcut.IconLocation = $icoPath
$Shortcut.Description = "BM Premium v2"
$Shortcut.Save()

Write-Host "✅ Fatto! Prova ora (F5 sul desktop)" -ForegroundColor Green