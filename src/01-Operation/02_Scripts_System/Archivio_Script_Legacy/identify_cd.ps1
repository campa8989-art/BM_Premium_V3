$CsvPath = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\cons_agg.csv"
$Lines = Get-Content $CsvPath -Head 500

foreach ($Line in $Lines) {
    if ($Line -match "ASST FBF Sacco") {
        $Cols = $Line.Split(",")
        if ($Cols.Count -ge 4) {
            Write-Host "C: $($Cols[2]) | D: $($Cols[3]) | E: $($Cols[4])"
            # Mostriamo solo i primi 10 per capire il pattern
            $found++
            if ($found -gt 10) { break }
        }
    }
}
