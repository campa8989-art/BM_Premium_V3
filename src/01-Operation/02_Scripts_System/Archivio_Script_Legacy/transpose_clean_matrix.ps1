$CsvPath = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\clean_matrix.csv"
$MasterListPath = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\Master_Facility_List_Validated.csv"
$OutputPath = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\Master_Scadenzario_33_Siti_Final.csv"

# 1. Caricamento Mapping Siti
$MasterList = Import-Csv $MasterListPath
$SiteMap = @{}
foreach ($s in $MasterList) { 
    $SiteMap[$s.ID_Folder] = $s.Nome_Sito
    $SiteMap[$s.Nome_Sito.ToLower().Trim()] = $s.ID_Folder 
    $SiteMap[$s.Indirizzo_Verificato.ToLower().Trim()] = $s.ID_Folder
}

# 2. Caricamento Matrice Pulita
$Data = Import-Csv $CsvPath -Delimiter ";" -Header (0..49 | % { "Col$_" })

# Riga 3 (Siti) -> Index 2
$RowSiteNames = $Data[2]
# Riga 5 (IDs) -> Index 4
$RowSiteIDs = $Data[4]

$ColumnsToProcess = @()
for ($c = 7; $c -le 49; $c++) { # Indice 7 è Colonna 8 di Excel
    $colName = "Col$c"
    $r1 = $RowSiteIDs.$colName.Trim('"').Trim()
    $r2 = $RowSiteNames.$colName.Trim('"').Trim()
    
    if (-not $r1 -and -not $r2) { continue }
    if ($r1 -match "Consistenze totali" -or $r2 -match "Consistenze totali") { continue }

    $id = "XX"
    # Priorità 1: Match Nome in Row 3 (r2)
    if ($r2) {
        $cleanR2 = $r2.ToLower() -replace '\.', '' -replace ' ', ''
        foreach ($key in $SiteMap.Keys) {
            $cleanK = $key -replace '\.', '' -replace ' ', ''
            if ($cleanR2 -contains $cleanK -or $cleanK -contains $cleanR2) {
                # Se il match è numerico (ID), prendiamolo
                if ($SiteMap[$key] -match '^\d') { $id = $SiteMap[$key]; break }
                # Altrimenti se avevamo salvato il nome per mappare l'ID
                $id = $SiteMap[$key]
                break
            }
        }
    }
    
    # Priorità 2: Match ID in Row 5 (r1)
    if ($id -eq "XX" -and $r1 -match "ID presidio (\d+)") {
        $id = $Matches[1].PadLeft(2, '0')
    }

    if ($id -ne "XX" -and $id -ne "ID folder" -and $id -ne "ID") {
        $finalName = if ($r2) { $r2 } else { "Sito $id" }
        $ColumnsToProcess += [PSCustomObject]@{ ColIndex = $c; Name = $finalName; ID = $id }
        Write-Host "Mapped Index $c to Site $id ($finalName)"
    }
}

Write-Host "Found $($ColumnsToProcess.Count) mapped site columns."

# 3. Trasposizione Servizi (Inizio da riga 10 o dove c'è Ente = ASST)
$OutputRecords = @('"CODICE";"CATEGORIA";"SOTTOCATEGORIA";"OPERAZIONE";"FREQ_DESCRIZIONE";"NORMATIVA";"COLONNA_C";"COLONNA_D";"QUANTITA";"NOTE"')

foreach ($row in $Data) {
    # Saltiamo header
    if ($row.Col1 -notmatch "ASST") { continue }
    
    $codC = $row.Col2.Trim('"').Trim()
    $codD = $row.Col3.Trim('"').Trim()
    $servizio = $row.Col4.Trim('"').Trim()
    $asset = $row.Col5.Trim('"').Trim()
    $unita = $row.Col6.Trim('"').Trim()
    
    if (-not $asset -or $asset -match "Totale") { continue }

    foreach ($site in $ColumnsToProcess) {
        $colName = "Col$($site.ColIndex)"
        $qty = $row.$colName.Trim('"').Trim()
        
        if ($qty -and $qty -ne "0" -and $qty -match '^-?\d') {
            # Mapping Categoria
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
Write-Host "Success: Generated $OutputPath with $($OutputRecords.Count - 1) rows for all sites."
