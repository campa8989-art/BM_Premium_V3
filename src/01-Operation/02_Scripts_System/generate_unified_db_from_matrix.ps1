
$base = Get-Item .
$TargetFile = Join-Path $base.FullName "01-Operation\08 - Contratto Iniziale\ARIA_2024_401_ASST FBF SACCO_consistenze 09.12.25_Aggiornato_01.4.26.xlsx"
$SiteMappingFile = Join-Path $base.FullName "01-Operation\01_Operations_Standard\csv\Master_Facility_List_Validated.csv"
$OutputFile = Join-Path $base.FullName "01-Operation\01_Operations_Standard\csv\MASTER_DATABASE_UNIFICATO_2026.csv"

# 1. Load Master List for Lookup
$masterList = Import-Csv $SiteMappingFile -Encoding UTF8
$lookup = @{}
function Normalize-SiteName($name) {
    if ([string]::IsNullOrWhiteSpace($name)) { return "" }
    return $name.ToUpper().Replace("VIA ","").Replace("V.LE ","").Replace("VLE ","").Replace("P.ZZA ","").Replace("PIAZZA ","").Replace(".","").Replace(" ","").Replace("_","").Trim()
}

foreach ($site in $masterList) {
    $norm = Normalize-SiteName $site.Nome_Sito
    $lookup[$norm] = $site
}

# 2. Open Excel
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
try {
    $wb = $excel.Workbooks.Open($TargetFile)
    $ws = $wb.Sheets.Item(1)

    # 3. Read Site Headers (Row 3, Col H to AN)
    $siteCols = @()
    for ($c = 8; $c -le 40; $c++) {
        $rawName = $ws.Cells.Item(3, $c).Text
        $norm = Normalize-SiteName $rawName
        
        # Mapping manuale per casi particolari se necessario
        $siteInfo = $lookup[$norm]
        if (-not $siteInfo) {
            # Try partial matching or fuzzy
            foreach ($k in $lookup.Keys) {
                if ($norm -match $k -or $k -match $norm) {
                    $siteInfo = $lookup[$k]
                    break
                }
            }
        }
        
        $siteCols += @{ Col=$c; RawName=$rawName; SiteInfo=$siteInfo }
    }

    # 4. Extract Data (Rows 4 to 34)
    $finalData = @()
    for ($r = 4; $r -le 34; $r++) {
        $cat = $ws.Cells.Item($r, 3).Text
        $subCat = $ws.Cells.Item($r, 4).Text
        $op = $ws.Cells.Item($r, 6).Text
        $freq = $ws.Cells.Item($r, 7).Text

        if ([string]::IsNullOrWhiteSpace($op)) { continue }

        foreach ($sCol in $siteCols) {
            $val = $ws.Cells.Item($r, $sCol.Col).Text
            if ($val -match '\d' -and $val -ne "0") {
                $info = $sCol.SiteInfo
                $finalData += [PSCustomObject]@{
                    ID_Folder = if ($info) { $info.ID_Folder } else { "TBD" }
                    Nome_Sito = if ($info) { $info.Nome_Sito } else { $sCol.RawName }
                    Indirizzo = if ($info) { $info.Indirizzo_Verificato } else { "TBD" }
                    Sistema = $cat
                    Sottocategoria = $subCat
                    Attivita = $op
                    Frequenza = $freq
                    Quantita = $val
                    Stato_Documentale = "DA VERIFICARE"
                    Note = "Sorgente: Matrice Consistenze 2026"
                    Data_Ultimo_Intervento = "DOCUMENTO MANCANTE"
                }
            }
        }
    }

    # 5. Export
    $finalData | Export-Csv -Path $OutputFile -NoTypeInformation -Delimiter ";" -Encoding UTF8
    Write-Host "Generato $OutputFile con $($finalData.Count) righe." -ForegroundColor Green

    $wb.Close($false)
} finally {
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
}
