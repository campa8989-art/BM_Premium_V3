$f = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\master_cons.xlsx"
$out = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\clean_matrix_v2.csv"

$e = New-Object -ComObject Excel.Application
$e.Visible = $false
try {
    $w = $e.Workbooks.Open($f)
    $s = $w.Worksheets.Item("Consistenze Agg 17_03_26")
    
    $maxR = 600 
    $maxC = 100  # Wide range for 33+ sites
    
    $range = $s.Range($s.Cells.Item(1,1), $s.Cells.Item($maxR, $maxC))
    $vals = $range.Value2
    
    $outputLines = @()
    for ($r = 1; $r -le $maxR; $r++) {
        $rowArray = @()
        for ($c = 1; $c -le $maxC; $c++) {
            $val = $vals[$r, $c]
            if ($val -eq $null) { $val = "" }
            $cleanVal = [string]$val -replace "`n", " " -replace "`r", " " -replace ";", ","
            $rowArray += '"' + $cleanVal + '"'
        }
        $outputLines += ($rowArray -join ";")
    }
    
    $outputLines | Out-File -FilePath $out -Encoding utf8
    $w.Close($false)
    Write-Host "Success: Generated clean matrix v2 at $out"
} catch {
    Write-Host "Error: $_"
} finally {
    $e.Quit()
}
