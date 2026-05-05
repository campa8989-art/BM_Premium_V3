
$base = Get-Item .
$TargetFile = Join-Path $base.FullName "01-Operation\01_Operations_Standard\MASTER_DATABASE_UNIFICATO_2026.xlsx"
$LogFile = Join-Path $base.FullName "consistency_log.txt"

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
try {
    $wb = $excel.Workbooks.Open($TargetFile)
    
    $wsAna = $wb.Sheets.Item("Anagrafica Presidi")
    $wsMan = $wb.Sheets.Item("Manutenzioni")

    $anaNames = @{}
    for ($r = 2; $r -le $wsAna.UsedRange.Rows.Count; $r++) {
        $name = $wsAna.Cells.Item($r, 2).Text
        if ($name) { $anaNames[$name.ToUpper().Trim()] = $name }
    }

    $out = "Discrepancies found in Manutenzioni:`n"
    for ($r = 2; $r -le $wsMan.UsedRange.Rows.Count; $r++) {
        $name = $wsMan.Cells.Item($r, 2).Text
        if ($name -and -not $anaNames.ContainsKey($name.ToUpper().Trim())) {
            $out += "Row $r: '$name' not found in Anagrafica`n"
        }
    }

    $out | Out-File -FilePath $LogFile -Encoding utf8
    $wb.Close($false)
} finally {
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
}
