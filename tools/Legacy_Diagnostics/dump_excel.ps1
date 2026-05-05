
$TargetFile = "01-Operation\08 - Contratto Iniziale\ARIA_2024_401_ASST FBF SACCO_consistenze 09.12.25_Aggiornato_01.4.26.xlsx"
$FullTargetFile = Join-Path (Get-Location) $TargetFile
$OutFile = Join-Path (Get-Location) "excel_dump.txt"

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
try {
    $wb = $excel.Workbooks.Open($FullTargetFile)
    $ws = $wb.Sheets.Item(1)

    $out = "Sites at Row 3:`n"
    for ($c = 8; $c -le 40; $c++) {
        $val = $ws.Cells.Item(3, $c).Text
        $out += "Col $c: $val`n"
    }

    $out += "`nMetadata Sample Row 4:`n"
    $cVal = $ws.Cells.Item(4, 3).Text
    $dVal = $ws.Cells.Item(4, 4).Text
    $fVal = $ws.Cells.Item(4, 6).Text
    $gVal = $ws.Cells.Item(4, 7).Text
    $out += "C,D,F,G: $cVal, $dVal, $fVal, $gVal`n"

    $out | Out-File -FilePath $OutFile -Encoding utf8
    $wb.Close($false)
} finally {
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
}
