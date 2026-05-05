$Excel = New-Object -ComObject Excel.Application
$Excel.Visible = $false
$Source = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\tmp_mappatura.xlsx"
$Target = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\Mappatura_Manutenzioni_Sacco_Ordinata_TOTALE.csv"

try {
    $Workbook = $Excel.Workbooks.Open($Source)
    $AllData = @()
    
    foreach ($Sheet in $Workbook.Worksheets) {
        Write-Host "Processing Sheet: $($Sheet.Name)"
        $UsedRange = $Sheet.UsedRange
        $Rows = $UsedRange.Rows.Count
        $Cols = $UsedRange.Columns.Count
        
        # Saltiamo l'intestazione per i fogli successivi al primo
        $StartRow = 1
        if ($AllData.Count -gt 0) { $StartRow = 2 }
        
        for ($r = $StartRow; $r -le $Rows; $r++) {
            $Line = @()
            for ($c = 1; $c -le $Cols; $c++) {
                $Value = $UsedRange.Cells.Item($r, $c).Text
                # Escape quotes for CSV
                if ($Value -match ",") { $Value = "`"$Value`"" }
                $Line += $Value
            }
            $AllData += ($Line -join ",")
        }
    }
    
    $AllData | Out-File -FilePath $Target -Encoding utf8
    Write-Host "Success: Consolidated all sheets into $Target"
    $Workbook.Close($false)
} catch {
    Write-Host "Error: $_"
} finally {
    $Excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($Excel) | Out-Null
}
