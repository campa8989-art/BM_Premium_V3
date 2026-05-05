$dir = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\05 - Servizi\MANUTENZIONE\Periodicità manutenzioni"
# Cerchiamo il file con wildcard per evitare problemi con i caratteri accentati
$file = Get-ChildItem -Path $dir -Filter "ARIA*Periodicit*.xlsx" | Select-Object -ExpandProperty FullName -First 1

if (-not $file) {
    Write-Host "Error: File not found in $dir"
    exit
}

Write-Host "Opening: $file"

$e = New-Object -ComObject Excel.Application
$e.Visible = $false
try {
    $w = $e.Workbooks.Open($file)
    foreach ($s in $w.Worksheets) {
        Write-Host $s.Name
    }
    $w.Close($false)
} catch {
    Write-Host "Error: $_"
} finally {
    $e.Quit()
}
