# format_excel_database.ps1
# Script per formattare i fogli del Master Database come Tabelle Excel

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$masterXlsx = Join-Path $ProjectRoot "01-Operation\01_Operations_Standard\MASTER_DATABASE_UNIFICATO_2026.xlsx"
$backupXlsx = Join-Path $ProjectRoot "01-Operation\01_Operations_Standard\MASTER_DATABASE_UNIFICATO_2026_BAK.xlsx"

Write-Host "--- FORMATTAZIONE EXCEL DATABASE (TABELLE) ---" -ForegroundColor Cyan

# 1. Caricamento Modulo
$moduleRoot = "$env:USERPROFILE\Documents\WindowsPowerShell\Modules\ImportExcel\7.8.10"
$psd1Path = Join-Path $moduleRoot "ImportExcel.psd1"
if (Test-Path $psd1Path) {
    Import-Module $psd1Path -ErrorAction Stop
} else {
    Import-Module ImportExcel -ErrorAction Stop
}

# 2. Backup
Write-Host "Creazione backup: $backupXlsx" -ForegroundColor Gray
Copy-Item $masterXlsx $backupXlsx -Force

# 3. Formattazione Fogli come Tabelle
$sheets = @("Anagrafica Presidi", "Dettaglio", "Periodicita manutenzioni")

foreach ($sheet in $sheets) {
    Write-Host "Formattazione foglio '$sheet' come tabella..." -ForegroundColor Yellow
    
    # Importiamo i dati esistenti
    $data = Import-Excel -Path $masterXlsx -WorksheetName $sheet
    
    # Esportiamo nuovamente come tabella con stile Medium2 (Blu) e ridimensionamento automatico colonne
    $data | Export-Excel -Path $masterXlsx -WorksheetName $sheet -TableStyle Medium2 -TableName "Table_$($sheet.Replace(' ', '_'))" -ClearSheet -AutoSize
}

Write-Host "OPERAZIONE COMPLETATA! Il database e' ora formattato con Tabelle Excel strutturate." -ForegroundColor Green
