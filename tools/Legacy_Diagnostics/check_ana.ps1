
$base = Get-Item .
$TargetFile = Join-Path $base.FullName "01-Operation\01_Operations_Standard\MASTER_DATABASE_UNIFICATO_2026.xlsx"
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
try {
    $wb = $excel.Workbooks.Open($TargetFile)
    $ws = $wb.Sheets.Item(1)
    for ($i = 2; $i -le 40; $i++) {
        $n = $ws.Cells.Item($i, 2).Text
        if ($n) { Write-Host "SITE: [$n]" }
    }
    $wb.Close($false)
} finally {
    $excel.Quit()
}
