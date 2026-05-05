# Script di verifica finale per l'allineamento frequenze
# Confronta i dati in data.js con il mapping ARIA e segnala eventuali "MISSING".

$dataJsPath = "data.js"
$ariaMappingPath = "scratch/aria_all_freq_mapping.json"
$outputPath = "audit_frequenze_report_NEW.csv"

Write-Host "--- GENERAZIONE REPORT AUDIT POST-FIX ---" -ForegroundColor Cyan

if (-not (Test-Path $dataJsPath)) { Write-Error "data.js non trovato"; return }
$dataJsContent = Get-Content $dataJsPath -Raw
$jsonText = $dataJsContent -replace '^\s*const\s+\w+\s*=\s*', '' -replace ';\s*$', ''
$data = $jsonText | ConvertFrom-Json

$AriaMapping = Get-Content $ariaMappingPath | ConvertFrom-Json

$results = @()

foreach ($item in $data) {
    $status = "OK"
    $suggest = ""
    
    if (-not $item.Frequenza -or $item.Frequenza -eq "-") {
        $status = "MISSING"
        # Cerchiamo suggerimento
        # Mapping flessibile
        $found = $null
        $nc = [string]$item.Sottocategoria.Replace(" ", "").Replace(".", "").Replace("-", "").ToLower().Replace("b2", "b")
        
        foreach($prop in $AriaMapping.PSObject.Properties) {
            $propNc = [string]$prop.Name.Replace(" ", "").Replace(".", "").Replace("-", "").ToLower().Replace("b2", "b")
            if ($propNc -eq $nc) {
                $found = $prop.Value
                break
            }
        }
        
        if ($found) {
            $suggest = $found.Frequenza
        }
    }

    $results += [PSCustomObject]@{
        ID_Folder = $item.ID_Sito
        Sito = $item.Nome_Sito
        Codice = $item.Sottocategoria
        Attivita = $item.Attivita
        Frequenza_Attuale = $item.Frequenza
        Stato = $status
        Suggerimento = $suggest
    }
}

$results | Export-Csv -Path $outputPath -Delimiter ";" -NoTypeInformation -Encoding utf8
Write-Host "Report generato: $outputPath" -ForegroundColor Green

$missing = $results | Where-Object { $_.Stato -eq "MISSING" }
if ($missing.Count -gt 0) {
    Write-Warning "Trovati ancora $($missing.Count) elementi mancanti!"
} else {
    Write-Host "OTTIMO! Tutti gli elementi (33 presidi) hanno ora una frequenza associata." -ForegroundColor Green
}
