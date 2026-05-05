$f = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\05 - Servizi\MANUTENZIONE\Periodicità manutenzioni\ARIA_2024_401_Periodicità Manutenzioni B_C_D_E_F_G.xlsx"
$e = New-Object -ComObject Excel.Application
$e.Visible = $false
try {
    $w = $e.Workbooks.Open($f)
    foreach ($s in $w.Worksheets) {
        Write-Host $s.Name
    }
    $w.Close($false)
} catch {
    Write-Host "Error: $_"
} finally {
    $e.Quit()
}
