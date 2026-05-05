$BaseDir = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv"
$InputPath = Join-Path $BaseDir "Master_Scadenzario_Reale_2026.csv"
$OutputPath = Join-Path $BaseDir "Piano_Manutentivo_Reale_Final.csv"

# Carichiamo i dati reali (separatore ;)
$RawData = Get-Content $InputPath
$HeaderRow = $RawData[0]
$DataRows = $RawData[1..($RawData.Count - 1)]

$FinalHeaders = '"CODICE";"CATEGORIA";"SOTTOCATEGORIA";"OPERAZIONE";"FREQ_G";"FREQ_St";"FREQ_Q";"FREQ_M";"FREQ_T";"FREQ_S";"FREQ_A";"FREQ_B";"FREQ_N";"FREQ_DESCRIZIONE";"PRIORITA";"FLAG_SANITARIO";"NORMATIVA";"RESPONSABILE";"NOTE";"FONTE";"DATA_ULTIMO_INTERVENTO_ANTINCENDIO"'
$OutputLines = @($FinalHeaders)

foreach ($row in $DataRows) {
    if ([string]::IsNullOrWhiteSpace($row)) { continue }
    $cols = $row.Split(";")
    if ($cols.Count -lt 10) { continue }
    
    $idSito = $cols[0]
    $siteName = $cols[1]
    $cat = $cols[2]
    $asset = $cols[3]
    $qty = $cols[4]
    $freqDesc = $cols[5]
    $norma = $cols[6]
    $colC = $cols[7]
    $colD = $cols[8]
    $note = $cols[9]
    
    # Mapping frequenze (X nella colonna corretta)
    $fG=$fSt=$fQ=$fM=$fT=$fS=$fA=$fB=$fN = ""
    if ($freqDesc -match "Settimanale") { $fSt = "X" }
    elseif ($freqDesc -match "Mensile") { $fM = "X" }
    elseif ($freqDesc -match "Trimestrale") { $fT = "X" }
    elseif ($freqDesc -match "Semestrale") { $fS = "X" }
    elseif ($freqDesc -match "Annuale") { $fA = "X" }
    elseif ($freqDesc -match "Biennale") { $fB = "X" }

    # Formattazione operazione con quantità
    $operazione = "$qty x $asset"
    $fullNote = "CodC: $colC | CodD: $colD | $note"
    
    $finalRow = '"' + $idSito + '";"' + $cat + '";"' + $siteName + '";"' + $operazione + '";"' + $fG + '";"' + $fSt + '";"' + $fQ + '";"' + $fM + '";"' + $fT + '";"' + $fS + '";"' + $fA + '";"' + $fB + '";"' + $fN + '";"' + $freqDesc + '";"";"";"' + $norma + '";"";"' + $fullNote + '";"REALE";""'
    $OutputLines += $finalRow
}

$OutputLines | Out-File -FilePath $OutputPath -Encoding utf8
Write-Host "Success: Generated $OutputPath with $($OutputLines.Count - 1) detailed rows."
