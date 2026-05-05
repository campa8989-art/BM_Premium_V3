$baseDir = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco"
$pianoCsv = Join-Path $baseDir "01-Operation\10_AI\01_Operations\csv\Master_Scadenzario_33_Siti_Programma_2026.csv"
$masterListCsv = Join-Path $baseDir "01-Operation\10_AI\01_Operations\csv\Master_Facility_List_Validated.csv"
$outputJs = Join-Path $baseDir "01-Operation\10_AI\02_Dashboard\data.js"

function Get-Urgency {
    param($nextDueStr)
    if ([string]::IsNullOrWhiteSpace($nextDueStr) -or $nextDueStr -eq "DA DEFINIRE") { return "Normal" }

    try {
        $nextDue = [datetime]::ParseExact($nextDueStr, "yyyy-MM-dd", $null)
        $today = Get-Date
        $daysToDue = ($nextDue - $today).Days
        
        if ($daysToDue -lt 0) { return "Overdue" }
        if ($daysToDue -lt 30) { return "Urgent" }
        return "Normal"
    } catch {
        return "Normal"
    }
}

# Load Master List for addresses
$masterList = Import-Csv -Path $masterListCsv -Encoding UTF8
$addressMap = @{}
foreach ($item in $masterList) {
    $id = $item.ID_Folder
    $addressMap[$id] = $item.Indirizzo_Verificato
}

# Load Piano CSV
$pianoData = Import-Csv -Path $pianoCsv -Delimiter ";" -Encoding UTF8
$maintenanceData = @()

foreach ($row in $pianoData) {
    if (-not $row.CODICE) { continue }
    $codice = $row.CODICE
    $urgency = Get-Urgency $row.NEXT_DUE
    
    $entry = [PSCustomObject]@{
        ID_Sito = $codice
        Nome_Sito = $row.SOTTOCATEGORIA
        Indirizzo = if ($addressMap.ContainsKey($codice)) { $addressMap[$codice] } else { "ASST FBF Sacco" }
        Sistema = $row.CATEGORIA
        Attivita = $row.OPERAZIONE
        Frequenza = $row.FREQ_DESCRIZIONE
        Normativa = $row.NORMATIVA
        Stato_Documentale = $row.NOTE
        Note = "Programma 2026"
        Last_Date = $row.LAST_DATE
        Next_Date = $row.NEXT_DUE
        Urgency = $urgency
    }
    $maintenanceData += $entry
}

$json = $maintenanceData | ConvertTo-Json -Depth 5
"const maintenanceData = $json;" | Out-File -FilePath $outputJs -Encoding utf8
Write-Host "Dashboard data synchronized successfully with 33-site REAL consistencies from Gara matrix."
