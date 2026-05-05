$CsvPath = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\matrix_ultra_clean.csv"
$OutputPath = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\Master_Scadenzario_33_Siti_Full_v3.csv"

# 1. Definizione Mapping Manuale (Nome Matrice -> ID Folder)
$ManualMap = @{
    "doria" = "01"; "orione" = "02"; "farini" = "03"; "rugabella" = "04"; "sassi" = "05";
    "jolanda" = "06"; "jenner" = "07"; "livigno" = "08"; "calvairate" = "09"; "polesine" = "10";
    "adriano 107" = "11a"; "adriano 99" = "11b"; "bollate" = "12"; "piceno" = "14";
    "clericetti" = "15"; "bosco" = "16"; "fantoli 7" = "17"; "palombino" = "18";
    "quarenghi" = "19"; "aldini" = "20"; "perini" = "21"; "cilea" = "22";
    "sanzio" = "23"; "statuto" = "24"; "erlembaldo" = "25"; "padova" = "26";
    "volontari" = "27"; "plebisciti" = "28"; "serlio" = "29"; "puglie" = "31";
    "natta" = "32"; "oglio 18" = "33"
}

# 2. Caricamento Matrice
$RawData = Get-Content $CsvPath
# La riga con i nomi dei siti è la riga 3 (index 2) se esportata correttamente
# Ma verifichiamo tutte le prime 10 righe per sicurezza
$SitesFound = @()

for ($rIdx = 0; $rIdx -lt 10; $rIdx++) {
    $cols = $RawData[$rIdx].Split(",")
    for ($c = 7; $c -lt $cols.Count; $c++) {
        $val = $cols[$c].Trim('"').ToLower()
        if ($val -match "via" -or $val -match "viale" -or $val -match "piazza" -or $val -match "pot") {
            $id = "XX"
            foreach ($key in $ManualMap.Keys) {
                if ($val.Contains($key)) { $id = $ManualMap[$key]; break }
            }
            if ($id -ne "XX") {
                $SitesFound += [PSCustomObject]@{ ColIndex = $c; Name = $cols[$c].Trim('"'); ID = $id }
            }
        }
    }
    if ($SitesFound.Count -gt 5) { break } # Trovata la riga dei siti
}

Write-Host "Found $($SitesFound.Count) sites mapped."

# 3. Trasposizione
$OutputRecords = @('"CODICE";"CATEGORIA";"SOTTOCATEGORIA";"OPERAZIONE";"FREQ_DESCRIZIONE";"NORMATIVA";"COLONNA_C";"COLONNA_D";"QUANTITA";"NOTE"')

for ($r = 0; $r -le $RawData.Count; $r++) {
    $rowText = $RawData[$r]
    if ($rowText -notmatch "ASST FBF Sacco") { continue }
    
    $cols = $rowText.Split(",")
    if ($cols.Count -lt 7) { continue }
    
    $codC = $cols[2].Trim('"')
    $codD = $cols[3].Trim('"')
    $servizio = $cols[4].Trim('"')
    $asset = $cols[5].Trim('"')
    $unita = $cols[6].Trim('"')
    
    if (-not $asset) { continue }

    foreach ($site in $SitesFound) {
        if ($site.ColIndex -ge $cols.Count) { continue }
        $qty = $cols[$site.ColIndex].Trim('"')
        
        if ($qty -and $qty -ne "0" -and $qty -match '^-?\d') {
            $cat = "MANUTENZIONE"
            if ($servizio -match "clima" -or $codD -match "^B") { $cat = "HVAC" }
            elseif ($servizio -match "elettr" -or $codD -match "^C") { $cat = "Elettrico" }
            elseif ($servizio -match "antinc" -or $codD -match "^C4") { $cat = "Antincendio" }
            elseif ($servizio -match "elev" -or $codD -match "^F") { $cat = "Elevatori" }
            elseif ($servizio -match "idric" -or $codD -match "^E") { $cat = "Idrico" }
            elseif ($servizio -match "edile" -or $codD -match "^G") { $cat = "Edile" }

            $operazione = "$qty $unita x $asset"
            $outLine = '"' + $site.ID + '";"' + $cat + '";"' + $site.Name + '";"' + $operazione + '";"Periodica";"Normativa vigente";"' + $codC + '";"' + $codD + '";"' + $qty + '";"REALE"'
            $OutputRecords += $outLine
        }
    }
}

$OutputRecords | Out-File -FilePath $OutputPath -Encoding utf8
Write-Host "Success: Generated $OutputPath with $($OutputRecords.Count - 1) rows for all 33 sites."
