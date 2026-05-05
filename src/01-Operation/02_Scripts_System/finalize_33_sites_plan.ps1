$TsvPath = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\master_matrix.tsv"
$MasterListPath = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\Master_Facility_List_Validated.csv"
$OutputPath = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\Master_Scadenzario_33_Siti_Full.csv"

# 1. Caricamento Mapping Siti
$MasterList = Import-Csv $MasterListPath
$SiteMap = @{}
foreach ($s in $MasterList) { 
    $SiteMap[$s.Nome_Sito.ToLower().Trim()] = $s.ID_Folder 
    $SiteMap[$s.Indirizzo_Verificato.ToLower().Trim()] = $s.ID_Folder
}

# 2. Caricamento Headers (Dual Row)
$RawData = Get-Content $TsvPath
$Row1Cols = $RawData[0].Split("`t")
$Row2Cols = $RawData[1].Split("`t")

$ColumnsToProcess = @()

$MaxCols = [Math]::Max($Row1Cols.Count, $Row2Cols.Count)
for ($c = 7; $c -lt $MaxCols; $c++) {
    $r1 = if ($c -lt $Row1Cols.Count) { $Row1Cols[$c].Trim('"').Trim() } else { "" }
    $r2 = if ($c -lt $Row2Cols.Count) { $Row2Cols[$c].Trim('"').Trim() } else { "" }
    
    if (-not $r1 -and -not $r2) { continue }
    if ($r1 -eq "Consistenze totali" -or $r2 -eq "Consistenze totali") { continue }

    $id = "XX"
    # Priorità 1: Match Nome in Row 2
    if ($r2) {
        $cleanR2 = $r2.ToLower() -replace '\.', '' -replace ' ', ''
        foreach ($key in $SiteMap.Keys) {
            $cleanK = $key -replace '\.', '' -replace ' ', ''
            if ($cleanR2 -contains $cleanK -or $cleanK -contains $cleanR2) {
                $id = $SiteMap[$key]
                break
            }
        }
    }
    
    # Priorità 2: Match ID in Row 1 (ID presidio X)
    if ($id -eq "XX" -and $r1 -match "ID presidio (\d+)") {
        $num = $Matches[1].PadLeft(2, '0')
        $id = $num
    }

    if ($id -ne "XX") {
        $siteName = if ($r2) { $r2 } else { "Sito $id" }
        $ColumnsToProcess += [PSCustomObject]@{ ColIndex = $c; Name = $siteName; ID = $id }
        Write-Host "Mapped Col $c to Site $id ($siteName)"
    }
}

Write-Host "Found $($ColumnsToProcess.Count) mapped site columns."

# 3. Trasposizione
$OutputRecords = @('"CODICE";"CATEGORIA";"SOTTOCATEGORIA";"OPERAZIONE";"FREQ_DESCRIZIONE";"NORMATIVA";"COLONNA_C";"COLONNA_D";"QUANTITA";"NOTE"')

for ($r = 2; $r -lt $RawData.Count; $r++) {
    $cols = $RawData[$r].Split("`t")
    if ($cols.Count -lt 7) { continue }
    
    $codC = $cols[2].Trim('"').Trim()
    $codD = $cols[3].Trim('"').Trim()
    $servizio = $cols[4].Trim('"').Trim()
    $asset = $cols[5].Trim('"').Trim()
    $unita = $cols[6].Trim('"').Trim()
    
    if (-not $asset -or $asset -match "Totale") { continue }

    foreach ($site in $ColumnsToProcess) {
        if ($site.ColIndex -ge $cols.Count) { continue }
        
        $qty = $cols[$site.ColIndex].Trim('"').Trim()
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
Write-Host "Success: Generated $OutputPath with $($OutputRecords.Count - 1) rows for $($ColumnsToProcess.Count) sites."
