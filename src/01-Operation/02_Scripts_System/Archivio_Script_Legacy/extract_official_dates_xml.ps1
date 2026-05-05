# extract_official_dates_xml.ps1
# Estrattore XLSX senza bisogno di Excel (Parsing XML diretto)

$ServicesDir = "01-Operation\05 - Servizi"
$OutputDir = "01-Operation\01_Operations_Standard\csv"
$OutputFile = Join-Path $OutputDir "Official_Dates_Captured.csv"
$TempDir = Join-Path $PSScriptRoot "temp_xlsx_extract"

if (-not (Test-Path $OutputDir)) { New-Item -Path $OutputDir -ItemType Directory }
if (Test-Path $TempDir) { Remove-Item $TempDir -Recurse -Force }
New-Item $TempDir -ItemType Directory

$ExcelFiles = Get-ChildItem -Path $ServicesDir -Filter "ARIA_2024_401_*.xlsx" -Recurse
$Results = @()

foreach ($File in $ExcelFiles) {
    Write-Host ("Analizzando XML di: " + $File.Name) -ForegroundColor Yellow
    
    $TargetTemp = Join-Path $TempDir $File.BaseName
    if (Test-Path $TargetTemp) { Remove-Item $TargetTemp -Recurse -Force }
    
    # Unzip XLSX
    try {
        Expand-Archive -Path $File.FullName -DestinationPath $TargetTemp -Force -ErrorAction SilentlyContinue
    } catch {
        continue
    }

    # Carichiamo SharedStrings (se esistono) per risolvere i testi
    $SharedStrings = @()
    $StrFile = Join-Path $TargetTemp "xl\sharedStrings.xml"
    if (Test-Path $StrFile) {
        [xml]$ssXml = Get-Content $StrFile
        $SharedStrings = $ssXml.sst.si | ForEach-Object { $_.t.'#text' -or $_.t -or "" }
    }

    # Carichiamo il primo foglio (solitamente sheet1.xml)
    $SheetFile = Join-Path $TargetTemp "xl\worksheets\sheet1.xml"
    if (Test-Path $SheetFile) {
        [xml]$shXml = Get-Content $SheetFile
        
        # Cerchiamo le righe e le celle
        $Rows = $shXml.worksheet.sheetData.row
        foreach ($Row in $Rows) {
            $SiteText = ""; $DateText = ""
            
            foreach ($Cell in $Row.c) {
                $Val = ""
                if ($Cell.v) {
                    if ($Cell.t -eq "s") {
                        $Val = $SharedStrings[[int]$Cell.v]
                    } else {
                        $Val = $Cell.v
                    }
                }

                # Logica euristica: se la cella contiene un nome di via/sito
                if ($Val -match "Via " -or $Val -match "Doria" -or $Val -match "Rugabella" -or $Val -match "Farini") {
                    $SiteText = $Val
                }
                # Se la cella sembra una data (o un numero seriale Excel di data ~45000-46000)
                if ($Val -match "^\d{5}$" -and [int]$Val -gt 40000 -and [int]$Val -lt 50000) {
                    # Converti seriale Excel in Data
                    $DateText = [datetime]::FromOADate([double]$Val).ToString("yyyy-MM-dd")
                }
                if ($Val -match "\d{2}/\d{2}/\d{4}") {
                    $DateText = $Val # Formato testuale
                }
            }

            if ($SiteText -and $DateText) {
                $Results += [PSCustomObject]@{
                    Nome_Sito = $SiteText
                    Last_Date = $DateText
                    Fonte     = $File.Name
                }
            }
        }
    }
}

# Cleanup
Remove-Item $TempDir -Recurse -Force

# Salvataggio
if ($Results.Count -gt 0) {
    $Results | Export-Csv -Path $OutputFile -NoTypeInformation -Encoding UTF8 -Delimiter ";"
    Write-Host ("Successo! Recuperate " + $Results.Count + " date reali.") -ForegroundColor Green
} else {
    Write-Warning "Nessuna corrispondenza Sito-Data trovata nell'XML."
}
