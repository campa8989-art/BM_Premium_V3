$FilePath = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\master_cons.xlsx"
$Excel = New-Object -ComObject Excel.Application
$Excel.Visible = $false

try {
    $Workbook = $Excel.Workbooks.Open($FilePath)
    $Sheet = $Workbook.Worksheets.Item("Consistenze Agg 17_03_26")
    
    # Scansioniamo le prime 10 righe e 100 colonne
    $Range = $Sheet.Range("A1:CV10")
    $Values = $Range.Value2
    
    for ($r = 1; $r -le 10; $r++) {
        $foundInRow = @()
        for ($c = 1; $c -le 100; $c++) {
            $val = $Values[$r, $c]
            if ($val -match "Via " -or $val -match "Viale" -or $val -match "Piazza") {
                $foundInRow += "[$c]: $val"
            }
        }
        if ($foundInRow.Count -gt 0) {
            Write-Host "Row $r Sites: $($foundInRow -join ' | ')"
        }
    }
    
    $Workbook.Close($false)
} catch {
    Write-Host "Error: $_"
} finally {
    $Excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($Excel) | Out-Null
}
