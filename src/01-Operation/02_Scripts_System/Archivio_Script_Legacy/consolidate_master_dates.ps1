# consolidate_master_dates.ps1
# Script finale per consolidare le date reali e aggiornare data.js

$CsvDir = "01-Operation\01_Operations_Standard\csv"
$HistoryFile = Join-Path $CsvDir "Historical_Dates_Lookup.csv"
$ArchiveFile = Join-Path $CsvDir "Archivio_File_Status.csv"
$OutputFile = Join-Path $CsvDir "Consolidated_Verification_Dates.csv"

Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host "   📊 CONSOLIDAMENTO DATE: REALE + ARCHIVIO METADATI    " -ForegroundColor Cyan
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan

# 1. Carichiamo lo storico certo (Antincendio)
$History = Import-Csv $HistoryFile -Delimiter ";" -Encoding UTF8
$DateMap = @{} # Chiave: Sito_Sistema

foreach ($Row in $History) {
    if ($Row.DATA_ULTIMO_INTERVENTO_ANTINCENDIO) {
        $Key = ($Row.SOTTOCATEGORIA + "_" + $Row.CATEGORIA).ToLower().Trim()
        $DateMap[$Key] = $Row.DATA_ULTIMO_INTERVENTO_ANTINCENDIO
    }
}

# 2. Carichiamo i metadati dell'archivio (Altri sistemi)
$Archive = Import-Csv $ArchiveFile -Delimiter ";" -Encoding UTF8
foreach ($File in $Archive) {
    # Cerchiamo di dedurre il sito dal percorso
    # Heuristic: Se il percorso contiene un nome via noto
    $Sito = $null
    if ($File.FullName -match "Doria") { $Sito = "Via A. Doria 52" }
    elseif ($File.FullName -match "Don Orione") { $Sito = "Via Don Orione 2" }
    elseif ($File.FullName -match "Farini") { $Sito = "Via Farini 9" }
    elseif ($File.FullName -match "Rugabella") { $Sito = "Via Rugabella 4/6" }
    elseif ($File.FullName -match "Sassi") { $Sito = "Via A. Sassi 4" }
    elseif ($File.FullName -match "Jenner") { $Sito = "Vle Jenner 44" }
    elseif ($File.FullName -match "Livigno") { $Sito = "Via Livigno 3" }
    elseif ($File.FullName -match "Adriano") { $Sito = "Via Adriano" }
    elseif ($File.FullName -match "Bollate") { $Sito = "POT Bollate" }
    elseif ($File.FullName -match "Legnano") { $Sito = "Legnano" }
    elseif ($File.FullName -match "Piceno") { $Sito = "Vle Piceno 60" }
    elseif ($File.FullName -match "Clericetti") { $Sito = "Via Clericetti 22" }
    elseif ($File.FullName -match "Don Bosco") { $Sito = "Via Don Bosco 14" }
    elseif ($File.FullName -match "Fantoli") { $Sito = "Via Fantoli 7" }
    elseif ($File.FullName -match "Palombino") { $Sito = "Via M. Palombino 4" }
    elseif ($File.FullName -match "Quarenghi") { $Sito = "Via Quarenghi 21" }
    elseif ($File.FullName -match "Aldini") { $Sito = "Via Aldini 72" }
    elseif ($File.FullName -match "Perini") { $Sito = "Via Perini 22" }
    elseif ($File.FullName -match "Cilea") { $Sito = "Via Cilea 146A" }
    elseif ($File.FullName -match "Sanzio") { $Sito = "Via R. Sanzio 9" }

    # Sistema
    $Sist = "GENERICO"
    if ($File.FullName -match "Antincendio") { $Sist = "ANTINCENDIO" }
    elseif ($File.FullName -match "Climatici|Idrici|Caldaie|UTA") { $Sist = "MECCANICI" }
    elseif ($File.FullName -match "Elettrici") { $Sist = "ELETTRICI" }
    elseif ($File.FullName -match "Elevatori") { $Sist = "ELEVATORI" }
    elseif ($File.FullName -match "Edile") { $Sist = "EDILE" }

    if ($Sito -and $Sist) {
        $Key = ($Sito + "_" + $Sist).ToLower().Trim()
        $FileDate = ([datetime]$File.LastWriteTime).ToString("yyyy-MM-dd")
        if (-not $DateMap.ContainsKey($Key) -or $FileDate -gt $DateMap[$Key]) {
            $DateMap[$Key] = $FileDate
        }
    }
}

# 3. Esportiamo il Consolidato
$OutputData = @()
foreach ($Key in $DateMap.Keys) {
    $Parts = $Key.Split("_")
    $OutputData += [PSCustomObject]@{
        Sito    = $Parts[0]
        Sistema = $Parts[1]
        Real_Date = $DateMap[$Key]
    }
}

$OutputData | Export-Csv -Path $OutputFile -NoTypeInformation -Delimiter ";" -Encoding UTF8
Write-Host "Successo! Consolidate $($OutputData.Count) date." -ForegroundColor Green
