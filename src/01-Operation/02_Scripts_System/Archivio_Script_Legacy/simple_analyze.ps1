$f = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\master_cons.xlsx"
$e = New-Object -ComObject Excel.Application
$e.Visible = $false
$w = $e.Workbooks.Open($f)
$s = $w.Worksheets.Item("Consistenze Agg 17_03_26")
$v = $s.Range("A1:Z5").Value2
for ($r = 1; $r -le 5; $r++) {
    $line = ""
    for ($c = 1; $c -le 26; $c++) {
        $val = $v[$r, $c]
        $line += "$c: $val | "
    }
    Write-Host "Row $r: $line"
}
$w.Close($false)
$e.Quit()
