# Script per ispezionare gli header e i primi dati del file ARIA originale
Import-Module ImportExcel

$AriaFile = Get-ChildItem -Path "01-Operation\05 - Servizi\MANUTENZIONE" -Recurse -Filter "ARIA*.xlsx" | Select-Object -First 1
$AriaPath = $AriaFile.FullName
$sheets = @("B_impianti climatici", "C_Impianti elettrici ", "D_Impianti idrici ", "E_Impianti antincendio", "F_Impianti elevatori", "G_Opere edili")

foreach ($s in $sheets) {
    Write-Host "--- SHEET: $s ---" -ForegroundColor Cyan
    $data = Import-Excel -Path $AriaPath -WorksheetName $s -NoHeader | Select-Object -First 20
    $data | ConvertTo-Json | Out-File "scratch/aria_inspect_$($s.Substring(0,1)).json" -Encoding utf8
}
