# extract_official_dates_v2.ps1
# Script per estrarre le date reali di manutenzione dagli Excel ufficiali (ARIA 2024)

$ServicesDir = "01-Operation\05 - Servizi"
$OutputDir = "01-Operation\01_Operations_Standard\csv"
$OutputFile = Join-Path $OutputDir "Official_Dates_Captured.csv"

# Verifichiamo la cartella di output
if (-not (Test-Path $OutputDir)) { New-Item -Path $OutputDir -ItemType Directory }

# Filtro file
$ExcelFiles = Get-ChildItem -Path $ServicesDir -Filter "ARIA_2024_401_*.xlsx" -Recurse

if ($ExcelFiles.Count -eq 0) {
    Write-Warning "Nessun file Excel ARIA_2024_401 trovato."
    exit
}

# Avviamo Excel
$Excel = New-Object -ComObject Excel.Application
$Excel.Visible = $false
$Excel.DisplayAlerts = $false

$ExtractedData = @()

foreach ($File in $ExcelFiles) {
    Write-Host ("Processando: " + $File.Name)
    try {
        $Workbook = $Excel.Workbooks.Open($File.FullName)
        
        $Sistema = "GENERICO"
        if ($File.Name -like "*antincendio*") { $Sistema = "ANTINCENDIO" }
        elseif ($File.Name -like "*climatici*") { $Sistema = "MECCANICI" }
        elseif ($File.Name -like "*idrici*") { $Sistema = "MECCANICI" }
        elseif ($File.Name -like "*elettrici*") { $Sistema = "ELETTRICI" }
        elseif ($File.Name -like "*elevatori*") { $Sistema = "ELEVATORI" }
        elseif ($File.Name -like "*edile*") { $Sistema = "EDILE" }

        foreach ($Sheet in $Workbook.Worksheets) {
            # Keyword matching for header row
            $DateCol = 0; $SiteCol = 0; $StartRow = 2
            for ($r = 1; $r -le 5; $r++) {
                for ($c = 1; $c -le 20; $c++) {
                    $Txt = $Sheet.Cells($r, $c).Text
                    if ($Txt -match "Sito" -or $Txt -match "Presidio") { $SiteCol = $c }
                    if ($Txt -match "Data" -or $Txt -match "Intervento") { $DateCol = $c }
                }
                if ($DateCol -gt 0 -and $SiteCol -gt 0) { $StartRow = $r + 1; break }
            }

            if ($DateCol -gt 0 -and $SiteCol -gt 0) {
                # Row extraction
                for ($r = $StartRow; $r -le 300; $r++) {
                    $SiteName = $Sheet.Cells($r, $SiteCol).Text
                    if ([string]::IsNullOrWhiteSpace($SiteName) -or $SiteName -match "Totale") { continue }
                    
                    $DateVal = $Sheet.Cells($r, $DateCol).Text
                    if ($DateVal -match '\d') { # Generic check for content
                        $ExtractedData += [PSCustomObject]@{
                            Nome_Sito = $SiteName
                            Sistema   = $Sistema
                            Last_Date = $DateVal
                            Fonte     = $File.Name
                        }
                    }
                }
            }
        }
        $Workbook.Close($false)
    } catch {
        Write-Warning ("Errore lettura file: " + $File.Name)
    }
}

$Excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($Excel) | Out-Null

# Salvataggio
if ($ExtractedData.Count -gt 0) {
    $ExtractedData | Export-Csv -Path $OutputFile -NoTypeInformation -Encoding UTF8 -Delimiter ";"
    Write-Host ("Fatto! Recuperate " + $ExtractedData.Count + " date.")
} else {
    Write-Warning "Dati non trovati."
}
