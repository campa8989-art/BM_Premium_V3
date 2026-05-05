$f = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\master_matrix.tsv"
$d = Get-Content $f -TotalCount 20
for ($i=2; $i -lt 15; $i++) {
    $r = $d[$i]
    $c = $r.Split("`t")
    $line = if ($r.Length -gt 200) { $r.Substring(0, 200) } else { $r }
    Write-Host "Row $i : Cols=$($c.Count) | $line"
}
