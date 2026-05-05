# generate_master_xlsx.ps1 - Conversione in Excel Multi-Foglio
$base = Get-Item .
$CsvManutenzioni = Join-Path $base.FullName "01-Operation\01_Operations_Standard\csv\MASTER_DATABASE_UNIFICATO_2026.csv"
$CsvAnagrafica = Join-Path $base.FullName "01-Operation\01_Operations_Standard\csv\Master_Facility_List_Validated.csv"
$OutputFile = Join-Path $base.FullName "01-Operation\01_Operations_Standard\MASTER_DATABASE_UNIFICATO_2026.xlsx"

Write-Host "--- GENERAZIONE EXCEL MASTER UNIFICATO ---" -ForegroundColor Cyan

# 1. Caricamento Dati
$dataManutenzioni = Import-Csv $CsvManutenzioni -Delimiter ";" -Encoding UTF8
$dataAnagrafica = Import-Csv $CsvAnagrafica -Encoding UTF8

# 2. Apertura Excel
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

try {
    $wb = $excel.Workbooks.Add()
    
    # --- Foglio 1: Anagrafica Presidi ---
    $wsAna = $wb.Sheets.Item(1)
    $wsAna.Name = "Anagrafica Presidi"
    
    # Headers
    $wsAna.Cells.Item(1, 1) = "ID_Folder"
    $wsAna.Cells.Item(1, 2) = "Nome_Sito"
    $wsAna.Cells.Item(1, 3) = "Indirizzo_Verificato"
    $wsAna.Cells.Item(1, 4) = "Note"
    $wsAna.Rows.Item(1).Font.Bold = $true

    $row = 2
    foreach ($item in $dataAnagrafica) {
        $wsAna.Cells.Item($row, 1) = $item.ID_Folder
        $wsAna.Cells.Item($row, 2) = $item.Nome_Sito
        $wsAna.Cells.Item($row, 3) = $item.Indirizzo_Verificato
        $wsAna.Cells.Item($row, 4) = $item.Note
        $row++
    }
    $wsAna.UsedRange.Columns.AutoFit() | Out-Null

    # --- Foglio 2: Manutenzioni ---
    $wsMan = $wb.Sheets.Add([System.Reflection.Missing]::Value, $wsAna)
    $wsMan.Name = "Manutenzioni"

    # Headers (ID_Folder;Nome_Sito;Indirizzo;Sistema;Sottocategoria;Attivita;Frequenza;Quantita;Stato_Documentale;Note;Data_Ultimo_Intervento)
    $headers = @("ID_Folder", "Nome_Sito", "Indirizzo", "Sistema", "Sottocategoria", "Attivita", "Frequenza", "Quantita", "Stato_Documentale", "Note", "Data_Ultimo_Intervento")
    for ($i = 0; $i -lt $headers.Count; $i++) {
        $wsMan.Cells.Item(1, $i+1) = $headers[$i]
    }
    $wsMan.Rows.Item(1).Font.Bold = $true

    $row = 2
    foreach ($item in $dataManutenzioni) {
        $wsMan.Cells.Item($row, 1) = $item.ID_Folder
        $wsMan.Cells.Item($row, 2) = $item.Nome_Sito
        $wsMan.Cells.Item($row, 3) = $item.Indirizzo
        $wsMan.Cells.Item($row, 4) = $item.Sistema
        $wsMan.Cells.Item($row, 5) = $item.Sottocategoria
        $wsMan.Cells.Item($row, 6) = $item.Attivita
        $wsMan.Cells.Item($row, 7) = $item.Frequenza
        $wsMan.Cells.Item($row, 8) = $item.Quantita
        $wsMan.Cells.Item($row, 9) = $item.Stato_Documentale
        $wsMan.Cells.Item($row, 10) = $item.Note
        $wsMan.Cells.Item($row, 11) = $item.Data_Ultimo_Intervento
        $row++
    }
    $wsMan.UsedRange.Columns.AutoFit() | Out-Null

    # 3. Salvataggio
    $wb.SaveAs($OutputFile)
    $wb.Close($false)
    Write-Host "Eccellente! File generato in: $OutputFile" -ForegroundColor Green

} catch {
    Write-Error "Errore durante la generazione Excel: $($_.Exception.Message)"
} finally {
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
}
