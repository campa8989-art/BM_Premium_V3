# Script di debug per ispezionare il contenuto del Master Excel
Import-Module ImportExcel

$MasterXlsx = "01-Operation\01_Operations_Standard\MASTER_DATABASE_UNIFICATO_2026.xlsx"
$SheetName = "Periodicita manutenzioni"

Write-Host "Reading last 20 rows of $SheetName..." -ForegroundColor Cyan
$data = Import-Excel -Path $MasterXlsx -WorksheetName $SheetName
$data | Select-Object -Last 20 | ConvertTo-Json | Out-File "scratch/excel_debug_periodicita.json" -Encoding utf8

Write-Host "Unique ID_Folder values in ${SheetName}:"
$data | Group-Object ID_Folder | Select-Object Name, Count | Write-Host
