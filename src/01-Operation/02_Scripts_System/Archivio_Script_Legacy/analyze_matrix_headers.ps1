$CsvPath = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\master_matrix.csv"
$Data = Get-Content $CsvPath -Head 20

for ($i = 0; $i -lt 10; $i++) {
    $cols = $Data[$i].Split(",")
    Write-Host "Row $($i+1): First 20 columns:"
    for ($c = 0; $c -lt [Math]::Min($cols.Count, 20); $c++) {
        $val = $cols[$c].Trim('"')
        if ($val) {
            Write-Host "  [$($c+1)]: $val"
        }
    }
    Write-Host "--------------------"
}
