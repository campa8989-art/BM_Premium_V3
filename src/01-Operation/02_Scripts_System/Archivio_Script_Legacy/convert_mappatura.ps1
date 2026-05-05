$Excel = New-Object -ComObject Excel.Application
$Excel.Visible = $false
$Source = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\05 - Servizi\MANUTENZIONE\Periodicità manutenzioni\Mappatura_Manutenzioni_Sacco_Ordinata.xlsx"
$Target = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\Mappatura_Manutenzioni_Sacco_Ordinata.csv"

try {
    $Workbook = $Excel.Workbooks.Open($Source)
    $Worksheet = $Workbook.Worksheets.Item(1)
    # 6 = xlCSV
    $Worksheet.SaveAs($Target, 6)
    $Workbook.Close($false)
    Write-Host "Success: $Target"
} catch {
    Write-Host "Error: $_"
} finally {
    $Excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($Excel) | Out-Null
}
