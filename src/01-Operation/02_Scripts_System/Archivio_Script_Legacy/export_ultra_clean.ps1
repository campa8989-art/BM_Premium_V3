$f = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\master_cons.xlsx"
$out = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\matrix_ultra_clean.csv"

$e = New-Object -ComObject Excel.Application
$e.Visible = $false
try {
    $w = $e.Workbooks.Open($f)
    $s = $w.Worksheets.Item("Consistenze Agg 17_03_26")
    
    # Sostituzione globale di newline con spazi nelle celle
    # [char]10 = LF, [char]13 = CR
    $s.Cells.Replace([char]10, " ")
    $s.Cells.Replace([char]13, " ")
    
    # Salvataggio come CSV (6 = xlCSV)
    $s.SaveAs($out, 6)
    
    $w.Close($false)
    Write-Host "Success: Generated ultra clean matrix at $out"
} catch {
    Write-Host "Error: $_"
} finally {
    $e.Quit()
}
