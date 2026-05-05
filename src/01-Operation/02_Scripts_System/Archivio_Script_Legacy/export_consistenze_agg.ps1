$Excel = New-Object -ComObject Excel.Application
$Excel.Visible = $false
$Source = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\08 - Contratto Iniziale\02-Edifici Consistenze\ARIA_2024_401_L3_ASST FBF SACCO_Dettaglio prezzi_17_03_2026.xlsx"
$Target = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\Consistenze_Agg_17_03_26.csv"

try {
    $Workbook = $Excel.Workbooks.Open($Source)
    $Sheet = $Workbook.Worksheets.Item("Consistenze Agg 17_03_26")
    
    # xlCSV = 6
    $Sheet.SaveAs($Target, 6)
    $Workbook.Close($false)
    Write-Host "Success: Exported to $Target"
} catch {
    Write-Host "Error: $_"
} finally {
    $Excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($Excel) | Out-Null
}
