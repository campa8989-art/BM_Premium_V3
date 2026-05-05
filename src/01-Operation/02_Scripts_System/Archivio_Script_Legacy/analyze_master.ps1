$FilePath = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\master_cons.xlsx"

$Excel = New-Object -ComObject Excel.Application
$Excel.Visible = $false

try {
    $Workbook = $Excel.Workbooks.Open($FilePath)
    $Sheet = $Workbook.Worksheets.Item("Consistenze Agg 17_03_26")
    
    # Analizziamo un'area più ampia per trovare i nomi dei siti
    $Range = $Sheet.Range("A1:Z20")
    $Values = $Range.Value2
    
    for ($r = 1; $r -le 20; $r++) {
        $rowStr = ""
        for ($c = 1; $c -le 26; $c++) {
            $val = $Values[$r, $c]
            if ($val -ne $null) {
                $rowStr += "[$c]: $val | "
            }
        }
        if ($rowStr -ne "") {
            Write-Host "Row $r: $rowStr"
        }
    }
    
    $Workbook.Close($false)
} catch {
    Write-Host "Error: $_"
} finally {
    $Excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($Excel) | Out-Null
}
