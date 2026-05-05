$TsvPath = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\master_matrix.tsv"
$RawData = Get-Content $TsvPath
$HeaderLine = $RawData[1] # Row 2 (Zero-indexed index 1)
$Cols = $HeaderLine.Split("`t")

Write-Host "--- ALL COLUMNS AUDIT ---"
for ($i = 0; $i -lt $Cols.Count; $i++) {
    $val = $Cols[$i].Trim('"').Trim()
    if ($val) {
        Write-Host "[$i] : $val"
    } else {
        # Optional: dump empty columns if they are in between sites
    }
}
