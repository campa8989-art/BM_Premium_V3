# generate_missing_report.ps1
# Genera l'elenco dei documenti ancora mancanti dal cliente

$ScriptsDir = Get-Item -LiteralPath $PSScriptRoot
$OperationDir = Split-Path $ScriptsDir.FullName -Parent
$csvDir = Join-Path $OperationDir "01_Operations_Standard\csv"
$pianoFile = Join-Path $csvDir "Master_Scadenzario_3programma_2026.csv"
$consolidatedFile = Join-Path $csvDir "Consolidated_Verification_Dates.csv"
$reportFile = Join-Path $csvDir "Report_Documenti_Mancanti.csv"

function Normalize-Name {
    param($name)
    if ([string]::IsNullOrWhiteSpace($name)) { return "" }
    $n = $name.ToUpper().Trim()
    $n = $n -replace "(_6| 4_6| 4/6)", "46"
    $n = $n -replace "( P\.SSA JOLANDA| PRINCIPESSA JOLANDA)", ""
    $n = $n -replace "V\.LE", "VIALE"
    $n = $n -replace "VIA ", ""
    $n = $n -replace "A\. ", ""
    $n = $n -replace "[^A-Z0-9]", ""
    return $n
}

$piano = Import-Csv -Path $pianoFile -Delimiter ";" -Encoding UTF8
$consolidated = Import-Csv -Path $consolidatedFile -Delimiter ";" -Encoding UTF8

# Creiamo un set di chiavi (Sito_Sistema) per una ricerca veloce
$capturedKeys = @{}
foreach ($row in $consolidated) {
    if ($row.Data -and $row.Data -ne "DA VERIFICARE") {
        $capturedKeys[$row.SitoKey + "_" + $row.Sistema.ToUpper()] = $true
    }
}

$missing = @()
foreach ($row in $piano) {
    $normName = Normalize-Name $row.SOTTOCATEGORIA
    $sys = $row.CATEGORIA.ToUpper()
    
    # Mappatura categorie come in sync_data
    $mappedCat = switch($sys) {
        "CLIMATICI" { "HVAC" }
        "CALDAIE" { "HVAC" }
        "UTA" { "HVAC" }
        "IDRICI" { "IDRICO" }
        "ELETT" { "ELETT" }
        "ELETTRICI" { "ELETT" }
        "ANTINCENDIO" { "ANTINCENDIO" }
        default { $sys }
    }
    
    $key = $normName + "_" + $mappedCat
    if (-not $capturedKeys.ContainsKey($key)) {
        $missing += [PSCustomObject]@{
            Sito = $row.SOTTOCATEGORIA
            Sistema = $row.CATEGORIA
            Attivita = $row.OPERAZIONE
            Frequenza = $row.FREQ_DESCRIZIONE
            Stato_Attuale = "DOCUMENTO MANCANTE"
            Azione_Richiesta = "Sollecitare Cliente"
        }
    }
}

$missing | Export-Csv -Path $reportFile -NoTypeInformation -Delimiter ";" -Encoding UTF8
Write-Host "Report generato con successo: $reportFile"
Write-Host "Totale documenti da sollecitare: $($missing.Count)"
