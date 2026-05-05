$f = Join-Path $PSScriptRoot "..\08 - Contratto Iniziale\ARIA_2024_401_ASST FBF SACCO_consistenze 09.12.25_Aggiornato_01.4.26.xlsx"
$out = Join-Path $PSScriptRoot "..\01_Operations_Standard\csv\Master_Scadenzario_33_Siti_Direct.csv"

# Mapping Manuale per Sicurezza
$ManualMap = @{
    "doria" = "01"; "orione" = "02"; "farini" = "03"; "rugabella" = "04"; "sassi" = "05";
    "jolanda" = "06"; "jenner" = "07"; "livigno" = "08"; "calvairate" = "09"; "polesine" = "10";
    "adriano 107" = "11a"; "adriano 99" = "11b"; "bollate" = "12"; "piceno" = "14";
    "clericetti" = "15"; "bosco" = "16"; "fantoli 7" = "17"; "palombino" = "18";
    "quarenghi" = "19"; "aldini" = "20"; "perini" = "21"; "cilea" = "22";
    "sanzio" = "23"; "statuto" = "24"; "erlembaldo" = "25"; "padova" = "26";
    "volontari" = "27"; "plebisciti" = "28"; "serlio" = "29"; "puglie" = "31";
    "natta" = "32"; "oglio" = "33"; "magazzino" = "34"
}

$e = New-Object -ComObject Excel.Application
$e.Visible = $false
try {
    $w = $e.Workbooks.Open($f)
    $s = $w.Worksheets.Item("Consistenze 09_12_25 Gara")
    
    # 1. Mapping Colonne (Row 3)
    $siteRow = $s.Range("A3:CV3").Value2
    $ColumnsToProcess = @()
    for ($c = 8; $c -le 100; $c++) {
        $val = [string]$siteRow[1,$c]
        if ($val) {
            $id = "XX"
            $cleanVal = $val.ToLower()
            foreach ($key in $ManualMap.Keys) {
                if ($cleanVal.Contains($key)) { $id = $ManualMap[$key]; break }
            }
            if ($id -ne "XX") {
                $ColumnsToProcess += [PSCustomObject]@{ ColIndex = $c; Name = $val; ID = $id }
                Write-Host "Mapped Col $c to Site $id ($val)"
            }
        }
    }
    Write-Host "Total sites mapped: $($ColumnsToProcess.Count)"

    # 2. Estrazione Dati (Row 11-600)
    $OutputRecords = @('"CODICE";"CATEGORIA";"SOTTOCATEGORIA";"OPERAZIONE";"FREQ_DESCRIZIONE";"NORMATIVA";"COLONNA_C";"COLONNA_D";"QUANTITA";"NOTE"')
    
    $dataRange = $s.Range("A11:CV600").Value2
    
    for ($r = 1; $r -le ($dataRange.GetUpperBound(0)); $r++) {
        $ente = [string]$dataRange[$r, 2] # Colonna B
        if ($ente -notmatch "ASST") { continue }
        
        $codC = [string]$dataRange[$r, 3] # Colonna C
        $codD = [string]$dataRange[$r, 4] # Colonna D
        $servizio = [string]$dataRange[$r, 5] # Colonna E
        $asset = [string]$dataRange[$r, 6] # Colonna F
        $unita = [string]$dataRange[$r, 7] # Colonna G
        
        if (-not $asset -or $asset -match "Totale") { continue }

        foreach ($site in $ColumnsToProcess) {
            $qty = [string]$dataRange[$r, $site.ColIndex]
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
    
    $OutputRecords | Out-File -FilePath $out -Encoding utf8
    $w.Close($false)
    Write-Host "Success: Generated $out with $($OutputRecords.Count - 1) rows."
} catch {
    Write-Host "Error: $_"
} finally {
    $e.Quit()
}
