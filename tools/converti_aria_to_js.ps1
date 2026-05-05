# converti_aria_to_js.ps1
# Converte il file Excel finale (aria_sacco_final.xlsx) in un file JavaScript (aria_registry.js) per la dashboard

$excelPath = "aria_sacco_final.xlsx"
$outputPath = "aria_registry.json"

if (-not (Test-Path $excelPath)) {
    Write-Error "File $excelPath non trovato!"
    exit
}

Import-Module ImportExcel

Write-Host "Lettura fogli da $excelPath..."
$sheets = Get-ExcelSheetInfo -Path $excelPath
$registry = @{}

foreach ($sheet in $sheets) {
    $sheetName = $sheet.Name
    Write-Host "Processing sheet: $sheetName"
    
    $data = Import-Excel -Path $excelPath -WorksheetName $sheetName
    
    if ($data.Count -gt 0) {
        $code = $data[0].Codice_C
        if (-not $code) { $code = $sheetName }

        $frequenze = $data.Frequenza | Where-Object { $_ -ne $null -and $_ -ne "" } | Select-Object -Unique
        $frequenzaStr = $frequenze -join ", "
        
        $sezioni = @()
        foreach ($row in $data) {
            $sezioni += @{
                freq = if ($row.Frequenza) { $row.Frequenza } else { "" }
                id   = if ($row.Sottocodice_E) { $row.Sottocodice_E } else { "" }
                colD = if ($row.Codice_D) { $row.Codice_D } else { "" }
                desc = if ($row.Descrizione) { $row.Descrizione } else { "" }
                note = if ($row.Nota_N) { $row.Nota_N } else { "" }
            }
        }
        
        $registry[$code] = @{
            frequenza = $frequenzaStr
            sezioni = $sezioni
        }
    }
}

Write-Host "Generazione $outputPath..."
$json = $registry | ConvertTo-Json -Depth 10

Set-Content -Path $outputPath -Value $json -Encoding UTF8

Write-Host "Generazione JSON completata con successo."


