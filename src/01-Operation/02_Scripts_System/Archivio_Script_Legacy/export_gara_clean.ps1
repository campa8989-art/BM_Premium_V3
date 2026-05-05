$f = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\master_cons.xlsx"
$out = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\matrix_gara_clean.csv"

$e = New-Object -ComObject Excel.Application
$e.Visible = $false
try {
    $w = $e.Workbooks.Open($f)
    $s = $w.Worksheets.Item("Consistenze 09_12_25 Gara")
    
    $s.Cells.Replace([char]10, " ")
    $s.Cells.Replace([char]13, " ")
    
    $s.SaveAs($out, 6) # xlCSV
    $w.Close($false)
    Write-Host "Success: Generated clean gara matrix at $out"
} catch {
    Write-Host "Error: $_"
} finally {
    $e.Quit()
}
