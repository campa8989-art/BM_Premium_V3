$CsvPath = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\Consistenze_Agg_17_03_26.csv"

# Usiamo un metodo che non dipenda dal nome del drive o da caratteri speciali nel percorso
$Reader = New-Object System.IO.StreamReader($CsvPath)
$Count = 0
while ($Line = $Reader.ReadLine()) {
    $Count++
    if ($Line -match "ASST FBF Sacco") {
        $Cols = $Line.Split(",")
        # Colonna C e D sono indice 2 e 3 (0-indexed)
        if ($Cols.Count -ge 4) {
            Write-Host "Row $Count: C=$($Cols[2]), D=$($Cols[3]), E=$($Cols[4])"
        }
    }
    if ($Count -gt 500) { break }
}
$Reader.Close()
