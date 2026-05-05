# fix_excel_alignment.ps1 - Allineamento e Bonifica Nomi Presidi
$base = Get-Item .
$TargetFile = Join-Path $base.FullName "01-Operation\01_Operations_Standard\MASTER_DATABASE_UNIFICATO_2026.xlsx"
$LogFile = Join-Path $base.FullName "fix_excel_report.txt"

Write-Host "--- AVVIO BONIFICA ECCELLENTE ---" -ForegroundColor Cyan

function Normalize-SiteName($name) {
    if ([string]::IsNullOrWhiteSpace($name)) { return "" }
    $n = $name.ToUpper().Trim()
    $n = $n -replace "(VIA |V\.LE |VLE |A\. |ANDREA |DENARI |CARLO |L\.GO |LARGO |CORSO |PIAZZA |P\.ZZA |P\.SSA |PRINCIPESSA )", ""
    $n = $n -replace "[^A-Z0-9]", ""
    return $n
}

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

try {
    $wb = $excel.Workbooks.Open($TargetFile)
    
    $wsAna = $wb.Sheets.Item("Anagrafica Presidi")
    $wsMan = $wb.Sheets.Item("Manutenzioni")

    # 1. Caricamento Dizionario Anagrafica
    $lookup = @{}
    for ($idx = 2; $idx -le $wsAna.UsedRange.Rows.Count; $idx++) {
        $idVal = [string]$wsAna.Cells.Item($idx, 1).Text
        $nameVal = [string]$wsAna.Cells.Item($idx, 2).Text
        $addrVal = [string]$wsAna.Cells.Item($idx, 3).Text
        if ($nameVal) {
            $norm = Normalize-SiteName $nameVal
            $lookup[$norm] = @{ ID=$idVal; Name=$nameVal; Addr=$addrVal }
            if ($norm -match "ADRIANO") { $lookup["ADRIANO11A"] = $lookup[$norm]; $lookup["ADRIANO11B"] = $lookup[$norm] }
        }
    }

    $report = "REPORT BONIFICA MASTER DATABASE`n"
    $report += "Data: $(Get-Date)`n`n"
    $countFixed = 0
    $countUnknown = 0

    # 2. Scansione e Fix Manutenzioni
    for ($rowIdx = 2; $rowIdx -le $wsMan.UsedRange.Rows.Count; $rowIdx++) {
        $rawName = [string]$wsMan.Cells.Item($rowIdx, 2).Text
        if (-not $rawName) { continue }

        $norm = Normalize-SiteName $rawName
        $match = $lookup[$norm]

        if ($match) {
            $currentID = [string]$wsMan.Cells.Item($rowIdx, 1).Text
            if ($rawName -ne $match.Name -or $currentID -ne $match.ID) {
                $wsMan.Cells.Item($rowIdx, 1) = $match.ID
                $wsMan.Cells.Item($rowIdx, 2) = $match.Name
                $wsMan.Cells.Item($rowIdx, 3) = $match.Addr
                # Clear cell color
                $wsMan.Rows.Item($rowIdx).Interior.ColorIndex = 0
                $report += "Row $($rowIdx): Rinomato [$rawName] -> [$($match.Name)] (ID: $($match.ID))`n"
                $countFixed++
            }
        } else {
            # Sito non riconosciuto: evidenzia in Giallo (ColorIndex 6)
            $wsMan.Rows.Item($rowIdx).Interior.ColorIndex = 6
            $report += "Row $($rowIdx): SITO SCONOSCIUTO! [$rawName] - Evidenziato in Giallo`n"
            $countUnknown++
        }
    }

    # 3. Salvataggio e Chiusura
    $wb.Save()
    $wb.Close($false)
    
    $report += "`n--- RIEPILOGO ---`n"
    $report += "Righe aggiornate: $countFixed`n"
    $report += "Righe sconosciute (da revisionare): $countUnknown`n"
    
    $report | Out-File -FilePath $LogFile -Encoding utf8
    Write-Host "Bonifica completata! Report generato in: $LogFile" -ForegroundColor Green

} catch {
    Write-Error "Errore critico: $($_.Exception.Message)"
} finally {
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
}
