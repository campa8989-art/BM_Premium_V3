$ErrorActionPreference = "Stop"
$projectDir = "C:\Users\PC\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\BM-Gestione-Commessa\new version"
$nodePath = "C:\Users\PC\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\BM-Gestione-Commessa\tools\nodejs"

$env:PATH = "$nodePath;$env:PATH"
Set-Location $projectDir

Write-Host "Installing xlsx..."
npm install xlsx --save

if ($LASTEXITCODE -eq 0) {
    Write-Host "xlsx installed successfully!" -ForegroundColor Green
} else {
    Write-Host "Installation failed. Exit code: $LASTEXITCODE" -ForegroundColor Red
}