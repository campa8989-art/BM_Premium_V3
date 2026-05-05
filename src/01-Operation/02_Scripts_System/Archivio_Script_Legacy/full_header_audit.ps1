$TsvPath = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\master_matrix.tsv"
$RawData = Get-Content $TsvPath
$Row1 = $RawData[0].Split("`t")
$Row2 = $RawData[1].Split("`t")

Write-Host "--- HEADER CORRELATION ---"
$max = [Math]::Max($Row1.Count, $Row2.Count)

for ($i = 0; $i -lt $max; $i++) {
    $r1 = if ($i -lt $Row1.Count) { $Row1[$i].Trim() } else { "" }
    $r2 = if ($i -lt $Row2.Count) { $Row2[$i].Trim() } else { "" }
    
    if ($r1 -or $r2) {
        Write-Host "Col $i : [$r1] | [$r2]"
    }
}
