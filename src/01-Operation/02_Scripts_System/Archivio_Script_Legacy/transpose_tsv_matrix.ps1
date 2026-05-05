$TsvPath = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\master_matrix.tsv"
$MasterListPath = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\Master_Facility_List_Validated.csv"
$OutputPath = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\Master_Scadenzario_33_Siti_Final.csv"

# 1. Caricamento Mapping Siti
$MasterList = Import-Csv $MasterListPath
$SiteMap = @{}
foreach ($s in $MasterList) { 
    $SiteMap[$s.Nome_Sito.ToLower().Trim()] = $s.ID_Folder 
    $SiteMap[$s.Indirizzo_Verificato.ToLower().Trim()] = $s.ID_Folder
}

# 2. Caricamento Matrice
$RawData = Get-Content $TsvPath
$HeaderLine = $RawData[1] # Row 2
$HeaderCols = $HeaderLine.Split("`t")

$SitesFound = @()
for ($c = 7; $c -lt $HeaderCols.Count; $c++) {
    $rawName = $HeaderCols[$c].Trim('"').Trim()
    if ($rawName -and $rawName -ne "Totale" -and $rawName -ne "Consistenze") {
        $id = "XX"
        $cleanRaw = $rawName.ToLower() -replace '\.', '' -replace ' ', ''
        foreach ($key in $SiteMap.Keys) {
            $cleanKey = $key -replace '\.', '' -replace ' ', ''
            if ($cleanRaw -contains $cleanKey -or $cleanKey -contains $cleanRaw) {
                $id = $SiteMap[$key]
                break
            }
        }
        $SitesFound += [PSCustomObject]@{ ColIndex = $c; Name = $rawName; ID = $id }
        if ($id -eq "XX") {
            Write-Host "DEBUG: Site '$rawName' (Clean: $cleanRaw) NOT MAPPED."
        } else {
            Write-Host "DEBUG: Site '$rawName' mapped to ID $id."
        }
    }
}

Write-Host "Found $($SitesFound.Count) site columns in TSV."

# 3. Trasposizione
$OutputRecords = @('"CODICE";"CATEGORIA";"SOTTOCATEGORIA";"OPERAZIONE";"FREQ_DESCRIZIONE";"NORMATIVA";"COLONNA_C";"COLONNA_D";"QUANTITA";"NOTE"')

for ($r = 2; $r -lt $RawData.Count; $r++) {
    $cols = $RawData[$r].Split("`t")
    if ($cols.Count -lt 7) { continue }
    
    $codC = $cols[2].Trim()
    $codD = $cols[3].Trim()
    $servizio = $cols[4].Trim()
    $asset = $cols[5].Trim()
    $unita = $cols[6].Trim()
    
    if (-not $asset -or $asset -match "Totale") { continue }

    foreach ($site in $SitesFound) {
        if ($site.ID -eq "XX") { continue } # Saltiamo siti non mappati per ora
        
        $qty = $cols[$site.ColIndex].Trim()
        if ($qty -and $qty -ne "0" -and $qty -match '^\d') {
            # Mapping Categoria
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
Write-Host "Success: Generated $OutputPath with $($OutputRecords.Count - 1) rows for $($SitesFound.Count) sites."
