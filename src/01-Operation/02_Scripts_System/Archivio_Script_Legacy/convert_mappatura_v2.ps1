# Imposta la directory di lavoro alla radice del workspace
Set-Location "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco"

$SourceRel = "01-Operation\05 - Servizi\MANUTENZIONE\Periodicità manutenzioni\Mappatura_Manutenzioni_Sacco_Ordinata.xlsx"
$TargetRel = "01-Operation\10_AI\01_Operations\csv\Mappatura_Manutenzioni_Sacco_Ordinata.csv"

if (-not (Test-Path $SourceRel)) {
    Write-Host "Error: Source file NOT found at $SourceRel"
    exit 1
}

$Excel = New-Object -ComObject Excel.Application
$Excel.Visible = $false

try {
    # Risolvi i percorsi assoluti per Excel COM
    $SourceAbs = (Get-Item $SourceRel).FullName
    $TargetAbs = (Join-Path (Get-Location) $TargetRel)
    
    Write-Host "Opening: $SourceAbs"
    $Workbook = $Excel.Workbooks.Open($SourceAbs)
    $Worksheet = $Workbook.Worksheets.Item(1)
    
    # Crea la cartella di destinazione se non esiste
    $Dir = Split-Path $TargetAbs
    if (-not (Test-Path $Dir)) { New-Item -ItemType Directory -Path $Dir -Force }
    
    # 6 = xlCSV
    $Worksheet.SaveAs($TargetAbs, 6)
    $Workbook.Close($false)
    Write-Host "Success: Converted to $TargetAbs"
} catch {
    Write-Host "Error during conversion: $_"
} finally {
    $Excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($Excel) | Out-Null
}
