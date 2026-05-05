
$base = Get-Item .
$TargetFile = Join-Path $base.FullName "01-Operation\01_Operations_Standard\MASTER_DATABASE_UNIFICATO_2026.xlsx"

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
try {
    $wb = $excel.Workbooks.Open($TargetFile)
    
    $wsAna = $wb.Sheets.Item("Anagrafica Presidi")
    $wsMan = $wb.Sheets.Item("Manutenzioni")

    # Load Anagrafica (Name -> ID and Address)
    $anaMap = @{}
    $anaList = @()
    for ($r = 2; $r -le $wsAna.UsedRange.Rows.Count; $r++) {
        $id = $wsAna.Cells.Item($r, 1).Text
        $name = $wsAna.Cells.Item($r, 2).Text
        $addr = $wsAna.Cells.Item($r, 3).Text
        if ($name) {
            $anaMap[$name.ToUpper().Trim()] = @{ ID=$id; Name=$name; Addr=$addr }
            $anaList += $name
        }
    }

    # Analyze Manutenzioni
    $manNames = @{}
    for ($r = 2; $r -le $wsMan.UsedRange.Rows.Count; $r++) {
        $name = $wsMan.Cells.Item($r, 2).Text
        if ($name) {
            $manNames[$name] = $true
        }
    }

    Write-Host "--- ANA NAMES ---"
    $anaList | Sort-Object | foreach { Write-Host $_ }

    Write-Host "`n--- DISCREPANCIES IN MANUTENZIONI ---"
    foreach ($mName in $manNames.Keys) {
        if (-not $anaMap.ContainsKey($mName.ToUpper().Trim())) {
            Write-Host "Missing in Anagrafica: [$mName]"
        }
    }

    $wb.Close($false)
} finally {
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
}
