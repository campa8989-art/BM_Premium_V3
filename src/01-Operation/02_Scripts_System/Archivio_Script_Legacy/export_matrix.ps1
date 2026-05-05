$f = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\master_cons.xlsx"
$out = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\master_matrix.csv"

$e = New-Object -ComObject Excel.Application
$e.Visible = $false
try {
    $w = $e.Workbooks.Open($f)
    $s = $w.Worksheets.Item("Consistenze Agg 17_03_26")
    $s.SaveAs($out, 6) # xlCSV = 6
    $w.Close($false)
    Write-Host "Success: Exported matrix to $out"
} catch {
    Write-Host "Error: $_"
} finally {
    $e.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($e) | Out-Null
}
