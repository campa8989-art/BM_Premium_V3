$CsvPath = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\matrix_gara_clean.csv"
$OutputPath = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\Master_Scadenzario_33_Siti_Full_Gara.csv"

# 1. Definizione Mapping Manuale Progressivo
$ManualMap = @{
    "doria" = "01"; "orione" = "02"; "farini" = "03"; "rugabella" = "04"; "sassi" = "05";
    "jolanda" = "06"; "jenner" = "07"; "livigno" = "08"; "calvairate" = "09"; "polesine" = "10";
    "adriano 99" = "11b"; "adriano" = "11a"; "bollate" = "12"; "piceno" = "14";
    "clericetti" = "15"; "bosco" = "16"; "fantoli 7" = "17"; "palombino" = "18";
    "quarenghi" = "19"; "aldini" = "20"; "perini" = "21"; "cilea" = "22";
    "sanzio" = "23"; "statuto" = "24"; "erlembaldo" = "25"; "padova" = "26";
    "volontari" = "27"; "plebisciti" = "28"; "serlio" = "29"; "puglie" = "31";
    "natta" = "32"; "oglio" = "33"; "magazzino" = "34"
}

# 2. Caricamento Matrice
$RawData = Get-Content $CsvPath
# Riga 3 (index 2) contiene i nomi dei siti
$SiteRow = $RawData[2].Split(",")
$SitesFound = @()

for ($c = 7; $c -lt $SiteRow.Count; $c++) {
    $val = $SiteRow[$c].Trim('"').ToLower()
    if ($val) {
        $id = "XX"
        foreach ($key in $ManualMap.Keys) {
            if ($val.Contains($key)) { $id = $ManualMap[$key]; break }
        }
        $SitesFound += [PSCustomObject]@{ ColIndex = $c; Name = $SiteRow[$c].Trim('"'); ID = $id }
        if ($id -ne "XX") { Write-Host "Mapped Col $c to Site $id ($($SiteRow[$c].Trim('"')))" }
    }
}

Write-Host "Found $($SitesFound.Count) site columns total."

# 3. Trasposizione Servizi (Riga 5+, index 4+)
$OutputRecords = @('"CODICE";"CATEGORIA";"SOTTOCATEGORIA";"OPERAZIONE";"FREQ_DESCRIZIONE";"NORMATIVA";"COLONNA_C";"COLONNA_D";"QUANTITA";"NOTE"')

for ($r = 4; $r -lt $RawData.Count; $r++) {
    $rowText = $RawData[$r]
    if ($rowText -notmatch "ASST FBF Sacco") { continue }
    
    $cols = $rowText.Split(",")
    if ($cols.Count -lt 7) { continue }
    
    $codC = $cols[2].Trim('"')
    $codD = $cols[3].Trim('"')
    $servizio = $cols[4].Trim('"')
    $asset = $cols[5].Trim('"')
    $unita = $cols[6].Trim('"')
    
    if (-not $asset -or $asset -match "Totale") { continue }

    foreach ($site in $SitesFound) {
        if ($site.ID -eq "XX") { continue }
        if ($site.ColIndex -ge $cols.Count) { continue }
        
        $qty = $cols[$site.ColIndex].Trim('"')
        # Filtriamo quantità 0 o non numeriche
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
Write-Host "Success: Generated $OutputPath with $($OutputRecords.Count - 1) rows for all mapped sites."
