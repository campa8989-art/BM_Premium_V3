$f = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\master_matrix.tsv"
$d = Get-Content $f -Head 10
for ($i=0; $i -lt 10; $i++) {
    $row = $d[$i]
    $cols = $row.Split("`t")
    $hasID = if ($row -match "ID presidio") { "YES" } else { "NO" }
    $hasSite = if ($row -match "Via " -or $row -match "Viale") { "YES" } else { "NO" }
    Write-Host "Row $i : Cols=$($cols.Count) | ID_presidio=$hasID | SiteName=$hasSite | Text=$($row.Substring(0, [Math]::Min($row.Length, 100)))"
}
