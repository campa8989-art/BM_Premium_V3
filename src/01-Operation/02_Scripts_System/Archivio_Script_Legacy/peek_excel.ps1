param($target)
if (-not $target) { Write-Host "Usage: .\peek_excel.ps1 -target 'path/to/file.xlsx'"; exit }

$app = New-Object -ComObject Excel.Application
$app.Visible = $false
try {
    $wb = $app.Workbooks.Open($target)
    foreach ($sh in $wb.Worksheets) {
        Write-Host "`n--- Sheet: $($sh.Name) ---"
        $range = $sh.UsedRange.Range("A1:Z10").Value2
        if ($range -ne $null) {
            $rows = $range.GetUpperBound(0)
            $cols = $range.GetUpperBound(1)
            for ($r = 1; $r -le [Math]::Min($rows, 10); $r++) {
                $rowText = ""
                for ($c = 1; $c -le [Math]::Min($cols, 26); $c++) {
                    $val = [string]$range[$r, $c]
                    $rowText += "$val | "
                }
                Write-Host $rowText
            }
        }
    }
    $wb.Close($false)
} catch {
    Write-Host "Error: $($_.Exception.Message)"
} finally {
    $app.Quit()
}
