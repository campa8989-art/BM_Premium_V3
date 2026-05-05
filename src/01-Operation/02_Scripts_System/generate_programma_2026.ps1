$csvDir = Join-Path $PSScriptRoot "..\01_Operations_Standard\csv"
$MasterCsv = Join-Path $csvDir "Master_Scadenzario_33_Siti_Direct.csv"
$HistoricalCsv = Join-Path $csvDir "Historical_Dates_Lookup.csv"
$OutputCsv = Join-Path $csvDir "Master_Scadenzario_33_Siti_Programma_2026.csv"

# 1. Caricamento Dati
$MasterData = Import-Csv $MasterCsv -Delimiter ";" -Encoding utf8
$HistoricalData = Import-Csv $HistoricalCsv -Delimiter ";" -Encoding utf8

# 2. Definizione Mesi Target per Distribuzione Bilanciata (Default)
$FreqMonths = @{
    "Mensile"    = (1..12)
    "Trimestrale" = @(3, 6, 9, 12)
    "Semestrale"  = @(6, 12)
    "Annuale"     = @(10) # Default in autunno per bilanciare
}

# Funzione per trovare la prossima scadenza utile dopo oggi (Marzo 2026)
function Get-NextDue {
    param($frequency)
    $today = Get-Date # 2026-03-27
    $targetMonths = $FreqMonths[$frequency]
    if (-not $targetMonths) { $targetMonths = @(6) } # Fallback giugno

    foreach ($m in $targetMonths) {
        $candidate = Get-Date -Year 2026 -Month $m -Day 15 # Giorno fisso a metà mese
        if ($candidate -gt $today) {
            return $candidate.ToString("yyyy-MM-dd")
        }
    }
    # Se nessun mese nel 2026 è successivo a oggi, passiamo al 2027
    return (Get-Date -Year 2027 -Month $targetMonths[0] -Day 15).ToString("yyyy-MM-dd")
}

# 3. Elaborazione
$FinalRecords = @()

foreach ($row in $MasterData) {
    if (-not $row.CODICE) { continue }
    
    $lastDate = "DA VERIFICARE"
    $nextDue = "DA DEFINIRE"
    $cat = $row.CATEGORIA.Trim()
    
    # Inferenza Frequenza se "Periodica"
    $inferredFreq = "Annuale"
    if ($cat -eq "HVAC") { $inferredFreq = "Semestrale" }
    elseif ($cat -eq "Antincendio") { $inferredFreq = "Semestrale" }
    elseif ($cat -eq "Elevatori") { $inferredFreq = "Mensile" }
    elseif ($cat -eq "Idrico") { $inferredFreq = "Trimestrale" }
    
    # Check if we have historical data for this site/service
    $match = $HistoricalData | Where-Object { 
        $_.CODICE -eq $row.CODICE -and 
        $_.OPERAZIONE.ToLower().Contains($row.OPERAZIONE.Split(" ")[2].ToLower())
    } | Select-Object -First 1

    if ($match) {
        $lastDate = $match.DATA_ULTIMO_INTERVENTO_ANTINCENDIO
        try {
            $lastDateObj = [datetime]::ParseExact($lastDate, "yyyy-MM-dd", $null)
            $offset = 365
            if ($inferredFreq -eq "Semestrale") { $offset = 180 }
            elseif ($inferredFreq -eq "Trimestrale") { $offset = 90 }
            elseif ($inferredFreq -eq "Mensile") { $offset = 30 }
            
            $nextDue = $lastDateObj.AddDays($offset).ToString("yyyy-MM-dd")
        } catch {
            $nextDue = Get-NextDue $inferredFreq
        }
    } else {
        $nextDue = Get-NextDue $inferredFreq
    }

    # Distribuzione Bilanciata per i nuovi siti
    if (-not $match) {
        $siteIdInt = [int]($row.CODICE -replace '\D', '') 
        if ($inferredFreq -eq "Annuale") {
            $monthOffset = ($siteIdInt % 6) + 4 # Apr-Set
            $nextDue = (Get-Date -Year 2026 -Month $monthOffset -Day 15).ToString("yyyy-MM-dd")
        } elseif ($inferredFreq -eq "Semestrale") {
            # Distribuiamo i semestrali tra aprile/ottobre e maggio/novembre
            $startMonth = ($siteIdInt % 2) + 4 
            $nextDue = (Get-Date -Year 2026 -Month $startMonth -Day 15).ToString("yyyy-MM-dd")
        }
    }

    $newRow = [PSCustomObject]@{
        CODICE = $row.CODICE
        CATEGORIA = $row.CATEGORIA
        SOTTOCATEGORIA = $row.SOTTOCATEGORIA
        OPERAZIONE = $row.OPERAZIONE
        FREQ_DESCRIZIONE = $inferredFreq # Usiamo quella inferita per chiarezza
        NORMATIVA = $row.NORMATIVA
        LAST_DATE = $lastDate
        NEXT_DUE = $nextDue
        NOTE = $row.NOTE
    }
    $FinalRecords += $newRow
}

$FinalRecords | Export-Csv -Path $OutputCsv -Delimiter ";" -NoTypeInformation -Encoding utf8
Write-Host "Success: Generated 2026 Program with $SourceCount records at $OutputCsv"
