$f = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\master_cons.xlsx"
$e = New-Object -ComObject Excel.Application
$e.Visible = $false
try {
    $w = $e.Workbooks.Open($f)
    $s = $w.Worksheets.Item("Consistenze 09_12_25 Gara")
    
    # Ispezioniamo le prime 5 righe e 100 colonne
    $vals = $s.Range("A1:CV5").Value2
    for ($r=1; $r -le 5; $r++) {
        $found = @()
        for ($c=1; $c -le 100; $c++) {
            $v = $vals[$r, $c]
            if ($v) { $found += "[$c]:$v" }
        }
        if ($found.Count -gt 0) {
            Write-Host "Row $r : $($found -join ' | ')"
        }
    }
    $w.Close($false)
} catch {
    Write-Host "Error: $_"
} finally {
    $e.Quit()
}
