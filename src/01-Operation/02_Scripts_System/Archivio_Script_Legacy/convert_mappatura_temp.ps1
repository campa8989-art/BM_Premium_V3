$Source = "c:\Users\ICampagnoli\AppData\Local\Temp\mappatura.xlsx"
$Target = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\Mappatura_Manutenzioni_Sacco_Ordinata_Real.csv"

if (-not (Test-Path $Source)) {
    Write-Host "Error: Temp file NOT found at $Source"
    exit 1
}

$Excel = New-Object -ComObject Excel.Application
$Excel.Visible = $false

try {
    $Workbook = $Excel.Workbooks.Open($Source)
    $Worksheet = $Workbook.Worksheets.Item(1)
    
    # xlCSV = 6
    $Worksheet.SaveAs($Target, 6)
    $Workbook.Close($false)
    Write-Host "Success: Converted to $Target"
} catch {
    Write-Host "Error during conversion: $_"
} finally {
    $Excel.Quit()
    $Excel = $null
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}
