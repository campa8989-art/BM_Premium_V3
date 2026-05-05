$BaseDir = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv"
$MappaturaPath = Join-Path $BaseDir "Mappatura_Manutenzioni_Sacco_Ordinata_TOTALE.csv"
$ConsistenzeAggPath = Join-Path $BaseDir "cons_agg.csv"
$MasterListPath = Join-Path $BaseDir "Master_Facility_List_Validated.csv"
$OutputPath = Join-Path $BaseDir "Master_Scadenzario_Reale_2026.csv"

# 1. Caricamento Master List per ID Siti
$MasterList = Import-Csv $MasterListPath
$SiteMap = @{}
foreach ($s in $MasterList) { $SiteMap[$s.Nome_Sito] = $s.ID_Folder }
# Aggiunte manuali per match flessibile
$SiteMap["Via A. Doria 52"] = "01"
$SiteMap["Via A. Sassi 4"] = "05"
$SiteMap["Via Rugabella 4/6"] = "04"
$SiteMap["Via Livigno 3"] = "08"
$SiteMap["V.le Jenner 44"] = "07"
$SiteMap["Via Farini 9"] = "03"
$SiteMap["Via Don Orione 2"] = "02"
$SiteMap["^Via Sassi 4 P.ssa Jolanda"] = "06"

# 2. Caricamento Colonne C e D da Consistenze Agg
$ConsMapC = @{} # Codice Servizio
$ConsMapD = @{} # Codice Categoria
$ConsLines = Get-Content $ConsistenzeAggPath
foreach ($line in $ConsLines) {
    if ($line -match "ASST FBF Sacco") {
        $cols = $line.Split(",")
        if ($cols.Count -ge 5) {
            $cat = $cols[4].Trim('"')
            $ConsMapC[$cat] = $cols[2]
            $ConsMapD[$cat] = $cols[3]
        }
    }
}

# 3. Processamento Mappatura Reale
$RawData = Get-Content $MappaturaPath
$Headers = "CODICE;SOTTOCATEGORIA;CATEGORIA;OPERAZIONE;QUANTITA;FREQ_DESCRIZIONE;NORMATIVA;COLONNA_C;COLONNA_D;NOTE"
$OutputLines = @($Headers)

foreach ($line in $RawData) {
    if ($line -match "Ubicazione Prevalente" -or [string]::IsNullOrWhiteSpace($line)) { continue }
    
    $cols = $line.Split(",")
    if ($cols.Count -lt 5) { continue }
    
    $siteName = $cols[0].Trim('"')
    $tipoImpianto = $cols[1].Trim('"')
    $asset = $cols[2].Trim('"')
    $qtyStr = $cols[3].Trim('"')
    $freq = $cols[4].Trim('"')
    $norma = $cols[6].Trim('"')
    
    # Regola dello Zero
    if ($qtyStr -eq "0") { continue }
    
    # Identificazione ID Sito
    $idSito = "XX"
    if ($SiteMap.ContainsKey($siteName)) { $idSito = $SiteMap[$siteName] }
    
    # Mapping Colonne C e D basato su Tipologia Impianto (Semplificato)
    $colC = "TBD"
    $colD = "TBD"
    if ($tipoImpianto -match "ANTINCENDIO") { $colC = "45.1"; $colD = "C4" }
    elseif ($tipoImpianto -match "ELETTRICI") { $colC = "45.2"; $colD = "C5" }
    elseif ($tipoImpianto -match "MECCANICI") { $colC = "1.2"; $colD = "B.01" }
    elseif ($tipoImpianto -match "ELEVATORI") { $colC = "72.1"; $colD = "F1.01" }
    elseif ($tipoImpianto -match "EDILE") { $colC = "81.1"; $colD = "G1.01" }
    
    $outputRow = "$idSito;$siteName;$tipoImpianto;$asset;$qtyStr;$freq;$norma;$colC;$colD;REALE"
    $OutputLines += $outputRow
}

$OutputLines | Out-File -FilePath $OutputPath -Encoding utf8
Write-Host "Success: Generated $OutputPath with $($OutputLines.Count - 1) activities."
