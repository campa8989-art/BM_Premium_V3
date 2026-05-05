# TEST SETUP
$cwd = Get-Location
$parent = Split-Path $cwd -Parent
$targetPath = Join-Path $parent "01-ASST FBF Sacco\01-Operation\05 - Servizi\Test_Sincro_Ivan.pdf"

Write-Host "Creating test file in: $targetPath"
"DUMMY PDF CONTENT FOR TESTING" | Out-File -FilePath $targetPath -Encoding UTF8
Write-Host "Done."
