# fix_excel_alignment.ps1 - Allineamento e Bonifica Nomi Presidi
$base = Get-Item .
$TargetFile = Join-Path $base.FullName "01-Operation\01_Operations_Standard\MASTER_DATABASE_UNIFICATO_2026.xlsx"
$LogFile = Join-Path $base.FullName "fix_excel_report.txt"

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

$report = @()
$report += "Data: $(Get-Date)"

try {
    $wb = $excel.Workbooks.Open($TargetFile)
    
    # Identify sheets by index to avoid naming issues
    $wsAna = $wb.Sheets.Item(1)
    $wsMan = $wb.Sheets.Item(2)

    $report += "Sheet 1: $($wsAna.Name)"
    $report += "Sheet 2: $($wsMan.Name)"

    # 1. Load Anagrafica lookup
    $lookup = @{}
    $anaRows = $wsAna.UsedRange.Rows.Count
    for ($i = 2; $i -le $anaRows; $i++) {
        $name = [string]$wsAna.Cells.Item($i, 2).Text
        if ($name) {
            $key = $name.ToUpper().Trim()
            $lookup[$key] = @{
                ID = [string]$wsAna.Cells.Item($i, 1).Value2
                Name = $name
                Addr = [string]$wsAna.Cells.Item($i, 3).Value2
            }
        }
    }

    # 2. Fix Manutenzioni
    $manRows = $wsMan.UsedRange.Rows.Count
    for ($j = 2; $j -le $manRows; $j++) {
        $curName = [string]$wsMan.Cells.Item($j, 2).Text
        if (-not $curName) { continue }

        $key = $curName.ToUpper().Trim()
        if ($lookup.ContainsKey($key)) {
            $match = $lookup[$key]
            $wsMan.Cells.Item($j, 1) = $match.ID
            $wsMan.Cells.Item($j, 2) = $match.Name
            $wsMan.Cells.Item($j, 3) = $match.Addr
            $wsMan.Rows.Item($j).Interior.ColorIndex = 0
        } else {
            # Highlight unrecognized site
            $wsMan.Rows.Item($j).Interior.ColorIndex = 6
            $report += "Row $($j): Unrecognized site [$curName]"
        }
    }

    $wb.Save()
    $wb.Close($false)
    $report += "Bonifica completata con successo."

} catch {
    $report += "ERRORE: $($_.Exception.Message)"
} finally {
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
    $report | Out-File -FilePath $LogFile -Encoding utf8
}
