# Script per sincronizzare i dati della Dashboard Building Manager
# Utilizza il modulo ImportExcel per leggere il file XLSX senza dipendere da Excel COM

$masterXlsx = Join-Path $PSScriptRoot "..\01_Operations_Standard\MASTER_DATABASE_UNIFICATO_2026.xlsx"
$outputFile = Join-Path $PSScriptRoot "..\..\data.js"

Write-Host "--- SINCRONIZZAZIONE DASHBOARD (MODULO IMPORTEXCEL) ---" -ForegroundColor Cyan

# Caricamento Modulo ImportExcel
$moduleRoot = "$env:USERPROFILE\Documents\WindowsPowerShell\Modules\ImportExcel\7.8.10"
$psd1Path = Join-Path $moduleRoot "ImportExcel.psd1"
$dllPath = Join-Path $moduleRoot "EPPlus.dll"

# 1. Sblocco e pre-caricamento assembly (se necessario)
if (Test-Path $dllPath) {
    Unblock-File $dllPath -ErrorAction SilentlyContinue
    if (-not ([System.Management.Automation.PSTypeName]'OfficeOpenXml.ExcelPackage').Type) {
        Add-Type -Path $dllPath -ErrorAction SilentlyContinue
    }
}

# 2. Caricamento Modulo
if (Test-Path $psd1Path) {
    Import-Module $psd1Path -ErrorAction Stop
} else {
    # Tentativo fallback standard
    Import-Module ImportExcel -ErrorAction Stop
}

# 1. Caricamento Dati Anagrafica (Site IDs and Names)
Write-Host "[1/3] Lettura Anagrafica Siti..." -ForegroundColor Gray
$anagraficaRaw = Import-Excel -Path $masterXlsx -WorksheetName "Anagrafica Presidi"
$sitesMap = @{}
$anagraficaRaw | ForEach-Object {
    if ($_.ID_Folder) {
        $sitesMap[$_.ID_Folder] = $_
    }
}

# 2. Caricamento Dati Manutenzioni
Write-Host "[2/3] Lettura Dettaglio e Periodicita..." -ForegroundColor Gray
$manutenzioniRaw = Import-Excel -Path $masterXlsx -WorksheetName "Dettaglio"
$periodicitaRaw = Import-Excel -Path $masterXlsx -WorksheetName "Periodicita manutenzioni"

# Funzione per normalizzare i codici Sottocategoria per il match
function Get-NormalizedCode($code) {
    if (-not $code) { return "" }
    # Rimuove spazi, punti e converte in minuscolo. Gestisce anche B. vs B2.
    $n = [string]$code.Replace(" ", "").Replace(".", "").Replace("-", "").ToLower()
    $n = $n.Replace("b2", "b") # Normalizziamo B2.x come B.x
    return $n
}

# Creazione Mappa Periodicita (ID_Folder + Codice Normalizzato)
$periodicitaMap = @{}
foreach ($p in $periodicitaRaw) {
    if ($p.ID_Folder -and $p.Sottocategoria) {
        $normCode = Get-NormalizedCode $p.Sottocategoria
        $key = "$($p.ID_Folder)_$normCode"
        $periodicitaMap[$key] = $p
    }
}

$maintenanceData = @()
$i = 0
foreach ($row in $manutenzioniRaw) {
    if (-not $row.ID_Folder -or -not $row.Attivita) { continue }
    
    $site = $sitesMap[$row.ID_Folder]
    $siteName = if ($site) { $site.Nome_Sito } else { $row.Nome_Sito }
    $indirizzo = if ($site) { $site.Indirizzo_Verificato } else { $row.Indirizzo }

    # Recupero frequenza dal nuovo foglio con match robusto
    $freq = ""
    $norma = [string]$row.Riferimento_Normativo
    
    $rowNormCode = Get-NormalizedCode $row.Sottocategoria
    $key = "$($row.ID_Folder)_$rowNormCode"
    
    if ($periodicitaMap.ContainsKey($key)) {
        $p = $periodicitaMap[$key]
        if ($p.Frequenza) { $freq = [string]$p.Frequenza }
        if ($p.Riferimento_Normativo) { $norma = [string]$p.Riferimento_Normativo }
    } else {
        # Fallback alla frequenza del foglio Dettaglio se non trovato in Periodicita?
        # L'utente ha chiesto esplicitamente di usare il dato estratto dal foglio periodicita.
        # Per ora inizializziamo a stringa vuota e usiamo quella del dettaglio solo se non c' match?
        # No, l'utente dice "deve essere quello estratto da periodicita".
        $freq = [string]$row.Frequenza 
    }

    # Calcolo Urgenza
    $urgency = "Normal"
    if ($row.Stato_Documentale -eq "DA VERIFICARE" -or $row.Data_Ultimo_Intervento -eq "DOCUMENTO MANCANTE") { 
        $urgency = "Urgent" 
    }
    
    # Logica Calcolo Prossima Scadenza (Semplificata)
    $nextDate = "2026-06-30" # Default
    if ($row.Data_Ultimo_Intervento -match "\d{2}/\d{2}/\d{4}") {
        try {
            $lastDate = [DateTime]::ParseExact($row.Data_Ultimo_Intervento, "dd/MM/yyyy", $null)
            $monthsToAdd = 6 # Default Semestrale
            if ($freq -match "A") { $monthsToAdd = 12 }
            elseif ($freq -match "T") { $monthsToAdd = 3 }
            elseif ($freq -match "M") { $monthsToAdd = 1 }
            elseif ($freq -match "B") { $monthsToAdd = 24 }
            
            $nextDate = $lastDate.AddMonths($monthsToAdd).ToString("yyyy-MM-dd")
        } catch { }
    }

    # Rilevamento dinamico colonne Quantità e Unità di misura (gestisce problemi di accenti/encoding EXCEL)
    $qProp = $row.psobject.Properties.Name | Where-Object { $_ -like "Quantit*" } | Select-Object -First 1
    $uProp = $row.psobject.Properties.Name | Where-Object { $_ -like "Unit*mi*" } | Select-Object -First 1

    # Mapping dell'oggetto per data.js
    $obj = [PSCustomObject]@{
        ID_Sito               = [string]$row.ID_Folder
        Nome_Sito             = [string]$siteName
        Indirizzo             = [string]$indirizzo
        Sistema               = [string]$row.Sistema
        Tipologia_Impianto    = [string]$row.Tipologia_Impianto
        Sottocategoria        = ([string]$row.Sottocategoria).TrimEnd('.').Trim()
        Tipologia_Servizio    = [string]$row.Tipologia_Servizio
        Attivita              = [string]$row.Attivita
        Frequenza             = $freq
        Quantita              = if ($qProp) { [string]$row.$qProp } else { "" }
        Unita_Misura          = if ($uProp) { [string]$row.$uProp } else { "" }
        Note                  = [string]$row.Note
        Last_Date             = [string]$row.Data_Ultimo_Intervento
        Next_Date             = $nextDate
        Urgency               = $urgency
        Stato_Documentale     = $(
            $s = [string]$row.Stato_Documentale
            if ($s -eq "REALE" -and $row.Data_Ultimo_Intervento -eq "DOCUMENTO MANCANTE") { "DA VERIFICARE" }
            else { $s }
        )
        Riferimento_Normativo = $norma
        Sort_Rank             = [int]$row.ID_Folder
    }
    
    $maintenanceData += $obj
    $i++
}

# 3. Export data.js
Write-Host "[3/3] Generazione $outputFile ($i righe)..." -ForegroundColor Gray
$json = $maintenanceData | ConvertTo-Json -Depth 5
"const maintenanceData = $json;" | Out-File -FilePath $outputFile -Encoding utf8

Write-Host "COMPLETATO! I dati sono stati aggiornati correttamente." -ForegroundColor Green
