# Script di riparazione frequenze V2 - Correzione Headers e Schema
Import-Module ImportExcel

$MasterXlsx = "01-Operation\01_Operations_Standard\MASTER_DATABASE_UNIFICATO_2026.xlsx"
$AriaMappingPath = "scratch/aria_accurate_mapping.json"
$BackupXlsx = "01-Operation\01_Operations_Standard\MASTER_DATABASE_UNIFICATO_2026_BAK_ACCURATE_$(Get-Date -Format 'yyyyMMdd_HHmmss').xlsx"

Write-Host "--- ALLINEAMENTO FREQUENZE ARIA (ACCURATE V3) ---" -ForegroundColor Cyan

# 1. Caricamento Mapping ARIA
if (-not (Test-Path $AriaMappingPath)) {
    Write-Error "Errore: Mapping ARIA non trovato"
    return
}
$AriaMapping = Get-Content $AriaMappingPath | ConvertFrom-Json

# 2. Backup
Copy-Item $MasterXlsx $BackupXlsx
Write-Host "Backup creato: $BackupXlsx" -ForegroundColor Green

# 3. Lettura Dati
Write-Host "Lettura foglio Dettaglio..." -ForegroundColor Gray
$Dettaglio = Import-Excel -Path $MasterXlsx -WorksheetName "Dettaglio"

# 4. Funzione Normalizzazione (Manteniamo B2 distinta da B)
function Get-NormalizedCode($code) {
    if (-not $code) { return "" }
    # Rimuoviamo punti, spazi e trattini per un matching più elastico
    $n = [string]$code.Replace(" ", "").Replace(".", "").Replace("-", "").ToLower()
    return $n
}

# 5. Elaborazione Nuovi Dati per Periodicita
# Costruiamo un set di righe pulite basate sullo schema atteso da sync_data.ps1
$NewPeriodicita = @()
$AddedKeys = @{}

foreach ($row in $Dettaglio) {
    if (-not $row.ID_Folder -or -not $row.Sottocategoria) { continue }
    
    # ID_Folder pulito (stringa senza decimali)
    $cleanId = ([string]$row.ID_Folder).Split(".")[0]
    $rowNormCode = Get-NormalizedCode $row.Sottocategoria
    $key = "${cleanId}_${rowNormCode}"
    
    if ($AddedKeys.ContainsKey($key)) { continue }

    # Cerchiamo nel mapping ARIA (accumulando tutte le frequenze per codici composti con dettaglio del codice)
    $codesInRow = $row.Sottocategoria.Split("-") | ForEach-Object { $_.Trim() }
    $freqItems = @()
    $firstNorm = ""
    
    foreach ($c in $codesInRow) {
        $nc = Get-NormalizedCode $c
        $foundMapping = $null
        foreach($prop in $AriaMapping.PSObject.Properties) {
            if (Get-NormalizedCode $prop.Name -eq $nc) {
                $foundMapping = $prop.Value
                break
            }
        }
        if ($foundMapping) {
            if ($foundMapping.Frequenza) { 
                $freqItems += "$($c): $($foundMapping.Frequenza)"
            }
            if (-not $firstNorm -and $foundMapping.Norma) { 
                $firstNorm = $foundMapping.Norma 
            }
        }
    }

    $ariaFreq = ($freqItems | Select-Object -Unique) -join "; "
    $ariaNorma = $firstNorm

    if ($ariaFreq) {
        $norma = $ariaNorma
        if ($row.Riferimento_Normativo) { $norma = $row.Riferimento_Normativo }
        
        $NewPeriodicita += [PSCustomObject]@{
            ID_Folder = $cleanId
            Sistema = $row.Sistema
            Tipologia_Impianto = $row.Tipologia_Impianto
            Sottocategoria = $row.Sottocategoria
            Frequenza = $ariaFreq
            Riferimento_Normativo = $norma
        }
        $AddedKeys[$key] = $true
    }
}

# 6. Scrittura su Excel (Sostituzione totale del foglio per pulire gli header)
Write-Host "Riassegnazione totale di $($NewPeriodicita.Count) righe di periodicità..." -ForegroundColor Yellow

# Rimuoviamo il foglio esistente per assicurarci che gli header siano quelli nuovi
# (Esportazione con header espliciti)
$NewPeriodicita | Export-Excel -Path $MasterXlsx -WorksheetName "Periodicita manutenzioni" -AutoNameRange -TableStyle Light1 -NoHeader:$false -ClearSheet

Write-Host "OPERAZIONE COMPLETATA! Lo schema è ora allineato." -ForegroundColor Green
