# Trova i file dinamicamente per evitare problemi di encoding
$MasterPath = (Get-ChildItem -Recurse -Filter "MASTER_DATABASE_UNIFICATO_2026.xlsx" | Select-Object -First 1).FullName
$AriaPath = (Get-ChildItem -Recurse -Filter "*ARIA_2024*B_C_D_E_F_G.xlsx" | Select-Object -First 1).FullName
$OutputPath = "aria_sacco_example.csv"

Write-Host "Master: $MasterPath"
Write-Host "Aria: $AriaPath"

if (-not $MasterPath -or -not $AriaPath) {
    if (-not $MasterPath) { Write-Error "Master file non trovato." }
    if (-not $AriaPath) { Write-Error "Aria file non trovato." }
    exit
}

Import-Module ImportExcel

# 1. Estrarre codici univoci dal MASTER
Write-Host "Lettura codici dal MASTER..."
$masterData = Import-Excel -Path $MasterPath -WorksheetName "Periodicita manutenzioni"
$rawCodes = $masterData.Sottocategoria | Where-Object { $_ -ne $null } | Select-Object -Unique

$cleanCodes = New-Object System.Collections.Generic.HashSet[string]
foreach ($rc in $rawCodes) {
    # Split by ' - ' and clean
    $parts = $rc -split " - "
    foreach ($p in $parts) {
        $clean = $p.Trim().Trim("-").Trim()
        if ($clean) { [void]$cleanCodes.Add($clean) }
    }
}

Write-Host "Trovati $($cleanCodes.Count) codici univoci nel MASTER."

# 2. Iterare fogli ARIA
$ariaSheets = "B_impianti climatici", "C_Impianti elettrici ", "D_Impianti idrici ", "E_Impianti antincendio", "F_Elevatori", "G_Man Edile "
# Nota: aggiungi F e G se presenti e se Import-Excel li supporta
$results = New-Object System.Collections.Generic.List[PSObject]

foreach ($sheetName in $ariaSheets) {
    Write-Host "Processando foglio ARIA: $sheetName ..."
    $ariaData = Import-Excel -Path $AriaPath -WorksheetName $sheetName -NoHeader
    
    $isCollecting = $false
    $currentBlockCodeC = ""
    $currentBlockCodeD = ""
    $currentSubCodeMatch = ""

    # Riga 1 è solitamente header, ma usiamo -NoHeader quindi P1, P2...
    foreach ($row in $ariaData) {
        $rowEnte = $row.P2
        if ($rowEnte -notmatch "ASST FBF Sacco") {
            $isCollecting = $false
            continue
        }

        $rowCodeC = if ($row.P3) { $row.P3.ToString().Trim() } else { $null }
        $rowCodeD = if ($row.P4) { $row.P4.ToString().Trim() } else { $null }
        $rowDesc = $row.P6  # Col F

        # Regola 2 & 3: Match del codice
        if ($rowCodeC) {
            $currentBlockCodeC = $rowCodeC
            $currentBlockCodeD = "" # Resetta D quando cambia C
            $matchFound = $false
            
            # Caso 1: Codice semplice in MASTER (es. B2.01) -> Regola 2
            if ($cleanCodes.Contains($rowCodeC)) {
                $isCollecting = $true
                $currentSubCodeMatch = "" # Prende tutto il blocco
                $matchFound = $true
            }
            
            # Caso 2: Codice composto in MASTER (es. B2.07.07) -> Regola 3
            if (-not $matchFound -and $rowCodeD) {
                $composed = "$rowCodeC.$rowCodeD"
                if ($cleanCodes.Contains($composed)) {
                    $isCollecting = $true
                    $currentSubCodeMatch = $rowCodeD
                    $matchFound = $true
                }
            }

            if (-not $matchFound) {
                $isCollecting = $false
            }
        }

        # Aggiorniamo il Codice_D corrente se presente (anche se C è vuoto)
        if ($rowCodeD) {
            $currentBlockCodeD = $rowCodeD
        }

        if ($isCollecting) {
            # Se siamo in Rule 3, dobbiamo assicurarci che rowCodeD (o quello corrente) corrisponda ancora
            if ($currentSubCodeMatch -and $currentBlockCodeD -and $currentBlockCodeD -ne $currentSubCodeMatch) {
                continue
            }

            # Saltiamo righe senza descrizione e senza identificativo operazione (E)
            if (-not $rowDesc -and -not $row.P5) {
                continue
            }

            # Mappatura Frequenze (G-O)
            $freqMap = @{
                "S"  = "Semestrale"
                "M"  = "Mensile"
                "A"  = "Annuale"
                "T"  = "Trimestrale"
                "Q"  = "Quadrimestrale"
                "B"  = "Bimestrale"
                "W"  = "Settimanale"
                "O"  = "All'occorrenza"
                "G"  = "Giornaliera"
                "3M" = "Trimestrale"
                "6M" = "Semestrale"
            }

            $foundFreqs = New-Object System.Collections.Generic.List[string]
            for ($i = 7; $i -le 15; $i++) {
                if ($i -eq 14) { continue } # P14 (N) lo gestiamo a parte
                $val = $row."P$i"
                if ($val) {
                    $key = $val.ToString().Trim().ToUpper()
                    if ($freqMap.ContainsKey($key)) {
                        [void]$foundFreqs.Add($freqMap[$key])
                    } else {
                        [void]$foundFreqs.Add($val.ToString())
                    }
                }
            }

            # Colonna N (P14)
            $valN = if ($row.P14) { $row.P14.ToString().Trim() } else { "" }

            $results.Add([PSCustomObject]@{
                Codice_C = $currentBlockCodeC
                Codice_D = $currentBlockCodeD
                Sottocodice_E = if ($row.P5) { $row.P5.ToString().Trim() } else { "" }
                Descrizione = $rowDesc
                Frequenza = (($foundFreqs | Select-Object -Unique) -join ", ")
                Nota_N = $valN
            })

        }
    }

}

$ExcelPath = "aria_sacco_final.xlsx"
if (Test-Path $ExcelPath) { Remove-Item $ExcelPath }

Write-Host "Generazione file Excel multi-foglio: $ExcelPath..."
$groupedResults = $results | Group-Object Codice_C

foreach ($group in $groupedResults) {
    # Il nome del foglio non può superare i 31 caratteri ed è meglio evitare caratteri speciali complessi
    $sheetName = $group.Name.Replace(":", "_").Replace("/", "_").Replace("\", "_")
    if ($sheetName.Length -gt 31) { $sheetName = $sheetName.Substring(0, 31) }
    
    # Esportiamo il gruppo nel foglio corrispondente
    $group.Group | Export-Excel -Path $ExcelPath -WorksheetName $sheetName `
        -BoldTopRow -AutoSize -AutoFilter `
        -ClearSheet # Assicura che il foglio sia pulito se esisteva
}

$results | Export-Csv -Path $OutputPath -NoTypeInformation -Delimiter ";" -Encoding UTF8
Write-Host "Estrazione completata."
Write-Host "CSV salvato in: $OutputPath"
Write-Host "Excel salvato in: $ExcelPath"

