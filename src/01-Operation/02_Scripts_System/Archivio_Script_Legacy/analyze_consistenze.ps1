$CsvPath = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\Consistenze_Agg_17_03_26.csv"
$Data = Get-Content $CsvPath

# Trova la prima riga con dati reali
$HeaderRowIndex = -1
for ($i = 0; $i -lt $Data.Count; $i++) {
    if ($Data[$i] -match "ASST FBF Sacco") {
        $HeaderRowIndex = $i - 1
        Write-Host "Potential Header Row at Index $HeaderRowIndex: $($Data[$HeaderRowIndex])"
        Write-Host "Data Row Sample: $($Data[$i])"
        break
    }
}

if ($HeaderRowIndex -ge 0) {
    $Rows = $Data[$HeaderRowIndex..($HeaderRowIndex + 10)]
    foreach ($Row in $Rows) {
        $Cols = $Row.Split(",")
        Write-Host "Row: $($Cols -join ' | ')"
    }
} else {
    Write-Host "Could not find 'ASST FBF Sacco' marker."
}
