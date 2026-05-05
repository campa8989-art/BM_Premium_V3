$FilePath = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\08 - Contratto Iniziale\02-Edifici Consistenze\ARIA_2024_401_L3_ASST FBF SACCO_Dettaglio prezzi_17_03_2026.xlsx"

$Excel = New-Object -ComObject Excel.Application
$Excel.Visible = $false

try {
    $Workbook = $Excel.Workbooks.Open($FilePath)
    $Sheet = $Workbook.Worksheets.Item("Consistenze Agg 17_03_26")
    
    # Leggiamo le prime 2000 righe della colonna B (Ente/Sito)
    $Range = $Sheet.Range("C1:C2000")
    $Values = $Range.Value2
    
    $Sites = @{}
    for ($i = 1; $i -le 2000; $i++) {
        $val = $Values[$i, 1]
        if ($val -ne $null) {
            $Sites[$val] = $true
        }
    }
    
    Write-Host "Unique entries in Column C (probably sites):"
    foreach ($s in $Sites.Keys) {
        Write-Host " - $s"
    }
    
    Write-Host "Total unique entries: $($Sites.Count)"
    
    $Workbook.Close($false)
} catch {
    Write-Host "Error: $_"
} finally {
    $Excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($Excel) | Out-Null
}
