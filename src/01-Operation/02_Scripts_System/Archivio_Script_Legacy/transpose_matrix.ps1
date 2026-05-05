$CsvPath = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\master_matrix.csv"
$MasterListPath = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\Master_Facility_List_Validated.csv"
$OutputPath = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\Master_Scadenzario_33_Siti.csv"

# 1. Caricamento Mapping Siti
$MasterList = Import-Csv $MasterListPath
$SiteMap = @{}
foreach ($s in $MasterList) { 
    $SiteMap[$s.Nome_Sito.ToLower()] = $s.ID_Folder 
    # Aggiungiamo varianti comuni per match flessibile
    $SiteMap[$s.Indirizzo_Verificato.ToLower()] = $s.ID_Folder
}

# 2. Caricamento Matrice (Lettura Raw per gestire intestazioni orizzontali)
$RawData = Get-Content $CsvPath
if ($RawData.Count -lt 5) { Write-Host "Error: CSV empty or too small"; exit }

# Identificazione riga intestazioni siti (Row 2 nel nostro report, indice 1)
$HeaderCols = $RawData[1].Split(",") 
$SitesFound = @() # Lista di { ColIndex, SiteName, SiteID }

for ($c = 7; $c -lt $HeaderCols.Count; $c++) { # Da Colonna 8 in poi (indice 7)
    $siteNameRaw = $HeaderCols[$c].Trim('"').Trim()
    if ($siteNameRaw) {
        $id = "XX"
        # Match flessibile
        foreach ($key in $SiteMap.Keys) {
            if ($siteNameRaw.ToLower().Contains($key) -or $key.Contains($siteNameRaw.ToLower())) {
                $id = $SiteMap[$key]
                break
            }
        }
        $SitesFound += [PSCustomObject]@{ ColIndex = $c; Name = $siteNameRaw; ID = $id }
    }
}

Write-Host "Found $($SitesFound.Count) site columns."

# 3. Trasposizione
$OutputRecords = @('"CODICE";"CATEGORIA";"SOTTOCATEGORIA";"OPERAZIONE";"FREQ_DESCRIZIONE";"NORMATIVA";"COLONNA_C";"COLONNA_D";"QUANTITA";"NOTE"')

for ($r = 2; $r -lt $RawData.Count; $r++) { # Dalla riga 3 in poi (indice 2)
    $cols = $RawData[$r].Split(",")
    if ($cols.Count -lt 7) { continue }
    
    $codC = $cols[2].Trim('"')
    $codD = $cols[3].Trim('"')
    $servizio = $cols[4].Trim('"')
    $asset = $cols[5].Trim('"')
    $unita = $cols[6].Trim('"')
    
    if (-not $asset) { continue }

    foreach ($site in $SitesFound) {
        $qty = $cols[$site.ColIndex].Trim('"')
        if ($qty -and $qty -ne "0") {
            # Mapping Categoria basato su CodC/CodD o nome servizio
            $cat = "MANUTENZIONE"
            if ($servizio -match "clima" -or $codD -match "^B") { $cat = "HVAC" }
            elseif ($servizio -match "elettr" -or $codD -match "^C") { $cat = "Elettrico" }
            elseif ($servizio -match "antinc" -or $codD -match "^C4") { $cat = "Antincendio" }
            elseif ($servizio -match "elev" -or $codD -match "^F") { $cat = "Elevatori" }
            elseif ($servizio -match "idric" -or $codD -match "^E") { $cat = "Idrico" }
            elseif ($servizio -match "edile" -or $codD -match "^G") { $cat = "Edile" }

            $operazione = "$qty $unita x $asset"
            $row = '"' + $site.ID + '";"' + $cat + '";"' + $site.Name + '";"' + $operazione + '";"Periodica";"Normativa vigente";"' + $codC + '";"' + $codD + '";"' + $qty + '";"REALE"'
            $OutputRecords += $row
        }
    }
}

$OutputRecords | Out-File -FilePath $OutputPath -Encoding utf8
Write-Host "Success: Generated $OutputPath with $($OutputRecords.Count - 1) rows."
