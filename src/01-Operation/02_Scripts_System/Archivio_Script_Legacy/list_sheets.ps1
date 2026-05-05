$f = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\master_cons.xlsx"
$e = New-Object -ComObject Excel.Application
$e.Visible = $false
try {
    $w = $e.Workbooks.Open($f)
    foreach ($s in $w.Worksheets) {
        Write-Host $s.Name
    }
    $w.Close($false)
} catch {
    Write-Host "Error: $_"
} finally {
    $e.Quit()
}
