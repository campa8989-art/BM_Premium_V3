$f = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\master_cons.xlsx"
$e = New-Object -ComObject Excel.Application
$e.Visible = $false
try {
    $w = $e.Workbooks.Open($f)
    $s = $w.Worksheets.Item("Consistenze 09_12_25 Gara")
    $v = $s.Range("A3:CV3").Value2
    for ($c=1; $c -le 100; $c++) {
        $val = $v[1, $c]
        if ($val) {
            Write-Host "Col $c : $val"
        }
    }
    $w.Close($false)
} catch {
    Write-Host "Error: $_"
} finally {
    $e.Quit()
}
