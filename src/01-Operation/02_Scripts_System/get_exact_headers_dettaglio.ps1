# Script per ispezionare gli header reali del foglio Dettaglio
Import-Module ImportExcel
$MasterXlsx = "01-Operation\01_Operations_Standard\MASTER_DATABASE_UNIFICATO_2026.xlsx"
$data = Import-Excel -Path $MasterXlsx -WorksheetName "Dettaglio" -NoHeader
$headers = $data[0]
$headers | ConvertTo-Json | Out-File "scratch/exact_headers_dettaglio.json" -Encoding utf8
Write-Host "Headers salvati in scratch/exact_headers_dettaglio.json"
