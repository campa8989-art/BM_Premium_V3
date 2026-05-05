$FilePath = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\08 - Contratto Iniziale\02-Edifici Consistenze\ARIA_2024_401_L3_ASST FBF SACCO_Dettaglio prezzi_17_03_2026.xlsx"

$Excel = New-Object -ComObject Excel.Application
$Excel.Visible = $false

try {
    $Workbook = $Excel.Workbooks.Open($FilePath)
    $Sheet = $Workbook.Worksheets.Item("Consistenze Agg 17_03_26")
    
    # Leggiamo le prime 10 righe per capirne la struttura (Colonne A-Z)
    $Range = $Sheet.Range("A1:Z10")
    $Values = $Range.Value2
    
    for ($r = 1; $r -le 10; $r++) {
        $rowStr = ""
        for ($c = 1; $c -le 26; $c++) {
            $val = $Values[$r, $c]
            $rowStr += "[$c]: $val | "
        }
        Write-Host "Row $r: $rowStr"
    }
    
    $Workbook.Close($false)
} catch {
    Write-Host "Error: $_"
} finally {
    $Excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($Excel) | Out-Null
}
