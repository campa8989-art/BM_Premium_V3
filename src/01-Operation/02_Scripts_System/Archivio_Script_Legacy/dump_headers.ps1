$CsvPath = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\master_matrix.csv"
$Data = Get-Content $CsvPath
$HeaderLine = $Data[1] # Row 2
$Cols = $HeaderLine.Split(",")

Write-Host "Site Columns Audit:"
for ($i = 0; $i -lt $Cols.Count; $i++) {
    $val = $Cols[$i].Trim('"').Trim()
    if ($val) {
        Write-Host "  Col $i: $val"
    }
}
