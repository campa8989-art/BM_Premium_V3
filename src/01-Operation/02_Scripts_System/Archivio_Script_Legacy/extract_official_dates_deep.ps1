# extract_official_dates_deep.ps1
# Estrattore XLSX Regex-based (Versione 3 - Altamente Resiliente)

$ServicesDir = "01-Operation\05 - Servizi"
$OutputDir = "01-Operation\01_Operations_Standard\csv"
$OutputFile = Join-Path $OutputDir "Official_Dates_Captured.csv"
$TempDir = "c:\temp\bm_extract" # Usiamo un percorso breve per evitare problemi OneDrive

if (-not (Test-Path $OutputDir)) { New-Item -Path $OutputDir -ItemType Directory }
if (Test-Path $TempDir) { Remove-Item $TempDir -Recurse -Force }
New-Item $TempDir -ItemType Directory

$ExcelFiles = Get-ChildItem -Path $ServicesDir -Filter "ARIA_2024_401_*.xlsx" -Recurse
$FinalResults = @()

foreach ($File in $ExcelFiles) {
    $UnzipPath = Join-Path $TempDir $File.BaseName
    Expand-Archive -Path $File.FullName -DestinationPath $UnzipPath -Force -ErrorAction SilentlyContinue
    
    # Leggiamo le sharedStrings per mappare gli indici ai testi
    $SharedStrings = @()
    $SSPath = Join-Path $UnzipPath "xl\sharedStrings.xml"
    if (Test-Path $SSPath) {
        $RawSS = Get-Content $SSPath -Raw
        # Estraiamo tutti i blocchi <t>...</t>
        $Matches = [regex]::Matches($RawSS, "<t.*?>(.*?)</t>")
        foreach ($m in $Matches) { $SharedStrings += $m.Groups[1].Value }
    }

    # Scansioniamo tutti i worksheets
    $Worksheets = Get-ChildItem (Join-Path $UnzipPath "xl\worksheets") -Filter "*.xml"
    foreach ($Sheet in $Worksheets) {
        $RawSheet = Get-Content $Sheet.FullName -Raw
        
        # Estraiamo le righe <row>...</row>
        $RowMatches = [regex]::Matches($RawSheet, "<row.*?>(.*?)</row>")
        foreach ($RowM in $RowMatches) {
            $RowXML = $RowM.Groups[1].Value
            $SiteFound = $null
            $DateFound = $null
            
            # Estraiamo le celle <c>...</c> nella riga
            $CellMatches = [regex]::Matches($RowXML, "<c.*?(?: t=""(.*?)"")?.*?>(.*?)</c>")
            foreach ($CellM in $CellMatches) {
                $Type = $CellM.Groups[1].Value
                $ValXML = $CellM.Groups[2].Value
                $VMatch = [regex]::Match($ValXML, "<v>(.*?)</v>")
                if (-not $VMatch.Success) { continue }
                $V = $VMatch.Groups[1].Value

                $DecodedVal = ""
                if ($Type -eq "s") {
                    if ($SharedStrings.Count -gt [int]$V) { $DecodedVal = $SharedStrings[[int]$V] }
                } else {
                    $DecodedVal = $V
                }

                # Euristica Sito
                if ($DecodedVal -match "(Via|Viale|Largo|Piazza|San |Settembrini|Rugabella|Doria|Sassi|Jenner|Livigno)") {
                    $SiteFound = $DecodedVal
                }
                # Euristica Data (Seriale Excel o Testo)
                if ($DecodedVal -match "^\d{5}$" -and [int]$DecodedVal -gt 44000) {
                     $DateFound = [datetime]::FromOADate([double]$DecodedVal).ToString("yyyy-MM-dd")
                }
                if ($DecodedVal -match "\d{2}/\d{2}/\d{4}") { $DateFound = $DecodedVal }
            }

            if ($SiteFound -and $DateFound) {
                $FinalResults += [PSCustomObject]@{
                    Sito = $SiteFound
                    Data = $DateFound
                    Sistema = $File.Name
                }
            }
        }
    }
}

$FinalResults | Export-Csv -Path $OutputFile -NoTypeInformation -Encoding UTF8 -Delimiter ";"
Write-Host "Completato! Date trovate: $($FinalResults.Count)"
