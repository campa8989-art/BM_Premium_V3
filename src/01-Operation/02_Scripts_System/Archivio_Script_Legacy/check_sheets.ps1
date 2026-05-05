$Files = @(
    "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\05 - Servizi\MANUTENZIONE\Periodicità manutenzioni\ARIA_2024_401_Periodicità Manutenzioni B_C_D_E_F_G.xlsx",
    "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\08 - Contratto Iniziale\02-Edifici Consistenze\ARIA_2024_401_L3_ASST FBF SACCO_Dettaglio prezzi_17_03_2026.xlsx"
)

$Excel = New-Object -ComObject Excel.Application
$Excel.Visible = $false

foreach ($FilePath in $Files) {
    if (Test-Path $FilePath) {
        Write-Host "Checking: $FilePath"
        try {
            $Workbook = $Excel.Workbooks.Open($FilePath)
            foreach ($Sheet in $Workbook.Worksheets) {
                Write-Host "  Sheet: $($Sheet.Name)"
                if ($Sheet.Name -like "*Consistenze*Agg*17*03*26*") {
                    Write-Host "  >>> FOUND MATCH! <<<"
                }
            }
            $Workbook.Close($false)
        } catch {
            Write-Host "  Error opening file: $_"
        }
    } else {
        Write-Host "File NOT found: $FilePath"
    }
}

$Excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($Excel) | Out-Null
