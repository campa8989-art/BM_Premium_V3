$ErrorActionPreference = "Stop"
$ProjectRoot = "C:\Users\PC\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\BM-Gestione-Commessa\new version"
$NodePath = "C:\Users\PC\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\BM-Gestione-Commessa\tools\nodejs"

$env:PATH = "$NodePath;$env:PATH"
Set-Location $ProjectRoot

Write-Host "Installing Vite..."
npm install vite --save-dev

if ($LASTEXITCODE -eq 0) {
    Write-Host "Vite installed successfully!" -ForegroundColor Green
} else {
    Write-Host "Installation failed. Exit code: $LASTEXITCODE" -ForegroundColor Red
}