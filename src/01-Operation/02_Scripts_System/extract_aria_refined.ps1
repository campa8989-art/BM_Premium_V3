# Script di estrazione ARIA raffinato per ASST FBF Sacco
Import-Module ImportExcel

$Path = "01-Operation\01_Operations_Standard\aria_sacco_final.xlsx"
$Data = Import-Excel -Path $Path

$Registry = @{}

foreach ($row in $Data) {
    # Pulizia codici
    $cat = [string]$row.Codice_C
    if (-not $cat) { continue }
    
    $sub = [string]$row.Codice_D
    $opId = [string]$row.Sottocodice_E
    $desc = [string]$row.Descrizione
    $freq = [string]$row.Frequenza
    $note = [string]$row.Nota_N

    if (-not $Registry.ContainsKey($cat)) {
        $Registry[$cat] = @{
            sezioni = @()
            frequenza = ""
        }
    }

    # Identificazione tipo riga
    $isHeader = -not $opId
    
    # Costruzione oggetto
    $entry = [PSCustomObject]@{
        id = $opId
        desc = $desc
        freq = $freq
        note = $note
        isHeader = $isHeader
        colD = $sub
    }

    # Deduplicazione base: se l'operazione esiste già, aggiorna se la nuova ha frequenza
    $existingIdx = -1
    if ($opId) {
        for ($i = 0; $i -lt $Registry[$cat].sezioni.Count; $i++) {
            if ($Registry[$cat].sezioni[$i].id -eq $opId -and $Registry[$cat].sezioni[$i].colD -eq $sub) {
                $existingIdx = $i
                break
            }
        }
    }

    if ($existingIdx -ge 0) {
        if ($freq -and -not $Registry[$cat].sezioni[$existingIdx].freq) {
            $Registry[$cat].sezioni[$existingIdx] = $entry
        }
    } else {
        $Registry[$cat].sezioni += $entry
    }
}

# Generazione JSON
$Registry | ConvertTo-Json -Depth 10 | Out-File "aria_registry.json" -Encoding utf8
Write-Host "Registro ARIA raffinato generato con successo in aria_registry.json"
