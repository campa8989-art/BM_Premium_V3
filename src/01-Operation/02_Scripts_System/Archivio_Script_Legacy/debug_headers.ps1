$CsvPath = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\master_matrix.csv"
$FileContent = Get-Content $CsvPath
$HeaderLine = $FileContent[1] # Row 2
$Cols = $HeaderLine.Split(",")

Write-Host "Total columns in Row 2: $($Cols.Count)"
for ($i = 0; $i -lt $Cols.Count; $i++) {
    $val = $Cols[$i].Trim('"').Trim()
    if ($val) {
        Write-Host "Column $i: $val"
    } else {
        # Check if it was supposed to be a site but is empty
    }
}
