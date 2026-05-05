$f = Join-Path $PSScriptRoot "..\01_Operations_Standard\MASTER_DATABASE_UNIFICATO_2026.xlsx"
$out = Join-Path $PSScriptRoot "..\01_Operations_Standard\csv\headers.json"

$e = New-Object -ComObject Excel.Application
$e.Visible = $false
try {
    $w = $e.Workbooks.Open($f)
    $s = $w.Worksheets.Item("Consistenze Agg 17_03_26")
    
    # Range A3:CV3 (Siti) e A5:CV5 (ID)
    $v3 = $s.Range("A3:CV3").Value2
    $v5 = $s.Range("A5:CV5").Value2
    
    $siteNames = @()
    $siteIDs = @()
    
    for ($c = 1; $c -le 100; $c++) { # 1-indexed in Excel
        $siteNames += [string]$v3[1, $c]
        $siteIDs += [string]$v5[1, $c]
    }
    
    $headers = @{ Sites = $siteNames; IDs = $siteIDs }
    $headers | ConvertTo-Json | Out-File -FilePath $out -Encoding utf8
    $w.Close($false)
    Write-Host "Success: Generated headers.json"
} catch {
    Write-Host "Error: $_"
} finally {
    $e.Quit()
}
