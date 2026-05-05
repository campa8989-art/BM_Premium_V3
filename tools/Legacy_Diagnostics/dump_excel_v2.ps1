
$base = Get-Item .
$TargetFile = Join-Path $base.FullName "01-Operation\08 - Contratto Iniziale\ARIA_2024_401_ASST FBF SACCO_consistenze 09.12.25_Aggiornato_01.4.26.xlsx"
$OutFile = Join-Path $base.FullName "excel_dump.txt"

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
try {
    $wb = $excel.Workbooks.Open($TargetFile)
    $ws = $wb.Sheets.Item(1)

    $results = @()
    $results += "Sites at Row 3:"
    for ($col = 8; $col -le 40; $col++) {
        $v = $ws.Cells.Item(3, $col).Text
        $results += "Col $col: $v"
    }

    $results += "`nMetadata Sample Row 4:"
    $c = $ws.Cells.Item(4, 3).Text
    $d = $ws.Cells.Item(4, 4).Text
    $f = $ws.Cells.Item(4, 6).Text
    $g = $ws.Cells.Item(4, 7).Text
    $results += "C: $c | D: $d | F: $f | G: $g"

    $results | Out-File -FilePath $OutFile -Encoding utf8
    $wb.Close($false)
} catch {
    $_.Exception.Message | Out-File -FilePath $OutFile -Encoding utf8
} finally {
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
}
