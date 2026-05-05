$target = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\scripts\tmp\periodicity.xlsx"

if (-not $target) {
    Write-Host "Error: Target file not found."
    exit
}

Write-Host "Found: $target"

$app = New-Object -ComObject Excel.Application
$app.Visible = $false
try {
    $wb = $app.Workbooks.Open($target)
    foreach ($sh in $wb.Worksheets) {
        Write-Host $sh.Name
    }
    $wb.Close($false)
} catch {
    Write-Host "Error: $($_.Exception.Message)"
} finally {
    $app.Quit()
}
