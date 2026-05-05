
$base = Get-Item .
$TargetFile = Join-Path $base.FullName "01-Operation\01_Operations_Standard\MASTER_DATABASE_UNIFICATO_2026.xlsx"
$LogFile = Join-Path $base.FullName "ana_list.txt"
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
try {
    $wb = $excel.Workbooks.Open($TargetFile)
    $ws = $wb.Sheets.Item(1)
    $res = "ANA SITES:`n"
    for ($i = 2; $i -le 40; $i++) {
        $n = $ws.Cells.Item($i, 2).Text
        if ($n) { $res += "[$n]`n" }
    }
    $res | Out-File -FilePath $LogFile -Encoding utf8
    $wb.Close($false)
} finally {
    $excel.Quit()
}
