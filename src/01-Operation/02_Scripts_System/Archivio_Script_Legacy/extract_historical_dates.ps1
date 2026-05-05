$source = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\Piano_Manutentivo_Giugno_2026.csv"
$out = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\Historical_Dates_Lookup.csv"

$data = Import-Csv $source -Delimiter ";" -Encoding utf8
$results = @()
foreach ($row in $data) {
    if ($row.DATA_ULTIMO_INTERVENTO_ANTINCENDIO -and $row.DATA_ULTIMO_INTERVENTO_ANTINCENDIO -ne "DA VERIFICARE") {
        $results += $row
    }
}

$results | Export-Csv -Path $out -NoTypeInformation -Delimiter ";" -Encoding utf8
Write-Host "Success: Extracted $($results.Count) historical date records to $out"
