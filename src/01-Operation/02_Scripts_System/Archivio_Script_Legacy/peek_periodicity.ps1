$target = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\scripts\tmp\periodicity.xlsx"
$app = New-Object -ComObject Excel.Application
$app.Visible = $false
try {
    $wb = $app.Workbooks.Open($target)
    $sheets = @("B_impianti climatici", "C_Impianti elettrici", "D_Impianti idrici", "E_Impianti antincendio")
    
    foreach ($shName in $sheets) {
        Write-Host "`n--- Sheet: $shName ---"
        $sh = $wb.Worksheets.Item($shName)
        $range = $sh.Range("A1:Z5").Value2
        for ($r = 1; $r -le 5; $r++) {
            $row = ""
            for ($c = 1; $c -le 26; $c++) {
                $val = [string]$range[$r, $c]
                $row += "$val | "
            }
            Write-Host $row
        }
    }
    $wb.Close($false)
} catch {
    Write-Host "Error: $($_.Exception.Message)"
} finally {
    $app.Quit()
}
