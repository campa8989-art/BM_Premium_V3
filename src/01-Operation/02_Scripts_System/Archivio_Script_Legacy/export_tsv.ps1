$f = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\master_cons.xlsx"
$out = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\master_matrix.tsv"

$e = New-Object -ComObject Excel.Application
$e.Visible = $false
try {
    $w = $e.Workbooks.Open($f)
    $s = $w.Worksheets.Item("Consistenze Agg 17_03_26")
    # xlTextWindows = 20 (Tab delimited)
    $s.SaveAs($out, 20) 
    $w.Close($false)
    Write-Host "Success: Exported matrix to TSV"
} catch {
    Write-Host "Error: $_"
} finally {
    $e.Quit()
}
