# final_force_fix.ps1 - Allineamento Finale al 100%
$base = Get-Item .
$TargetFile = Join-Path $base.FullName "01-Operation\01_Operations_Standard\MASTER_DATABASE_UNIFICATO_2026.xlsx"

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

try {
    $wb = $excel.Workbooks.Open($TargetFile)
    $wsAna = $wb.Sheets.Item(1)
    $wsMan = $wb.Sheets.Item(2)

    # 1. Caricamento Anagrafica Ufficiale
    $lookup = @{}
    for ($i = 2; $i -le $wsAna.UsedRange.Rows.Count; $i++) {
        $n = [string]$wsAna.Cells.Item($i, 2).Value2
        if ($n) {
            $lookup[$n.ToUpper().Trim()] = @{
                ID = [string]$wsAna.Cells.Item($i, 1).Value2
                Name = $n
                Addr = [string]$wsAna.Cells.Item($i, 3).Value2
            }
        }
    }

    # 2. Fix Forzato
    for ($j = 2; $j -le $wsMan.UsedRange.Rows.Count; $j++) {
        $raw = [string]$wsMan.Cells.Item($j, 2).Value2
        if (-not $raw) { continue }
        
        $key = $raw.ToUpper().Trim()
        
        # Casi Splicefici
        if ($key -match "S. ERLEMBALDO") { $key = "VIA ERLEMBALDO 4D" }
        if ($key -match "OGLIO 18") { $key = "VIA OGLIO 4" }
        if ($key -match "ADRIANO 99") { $key = "VIA ADRIANO 99/107" }

        # Normalizzatore generico fall-back
        $normKey = $key -replace "(VIA |V\.LE |VLE |A\. |S\. )", ""
        $normKey = $normKey -replace "[^A-Z0-9]", ""

        $match = $null
        if ($lookup.ContainsKey($key)) {
            $match = $lookup[$key]
        } else {
            # Try fuzzy match in lookup keys
            foreach ($k in $lookup.Keys) {
                $nk = $k -replace "(VIA |V\.LE |VLE |A\. |S\. )", ""
                $nk = $nk -replace "[^A-Z0-9]", ""
                if ($normKey -eq $nk) {
                    $match = $lookup[$k]
                    break
                }
            }
        }

        if ($match) {
            $wsMan.Cells.Item($j, 1) = $match.ID
            $wsMan.Cells.Item($j, 2) = $match.Name
            $wsMan.Cells.Item($j, 3) = $match.Addr
            $wsMan.Rows.Item($j).Interior.ColorIndex = 0 # Rimuovi giallo
        }
    }

    $wb.Save()
    $wb.Close($false)
    Write-Host "Auto-Fix completato con successo."
} finally {
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
}
