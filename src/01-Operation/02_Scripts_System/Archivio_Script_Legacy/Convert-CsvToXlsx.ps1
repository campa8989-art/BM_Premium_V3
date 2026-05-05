param(
    [Parameter(Mandatory=$true)]
    [string]$CsvFilePath,
    
    [string]$Delimiter = ","
)

try {
    # Risolve il persorso assoluto
    $csvFullPath = Resolve-Path $CsvFilePath -ErrorAction Stop
    $parentDir = Split-Path $csvFullPath
    
    $fileName = Split-Path $csvFullPath -Leaf
    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($csvFullPath)
    
    # Se il file è già in una cartella "csv", mettiamo l'XLSX al livello superiore
    $currentFolderName = Split-Path $parentDir -Leaf
    if ($currentFolderName -eq "csv") {
        $xlsxDir = Split-Path $parentDir
        $csvTargetDir = $parentDir
    } else {
        $xlsxDir = $parentDir
        $csvTargetDir = Join-Path $parentDir "csv"
    }
    
    $xlsxPath = Join-Path $xlsxDir "$baseName.xlsx"

    Write-Host "-> Conversione in corso: '$csvFullPath'"
    Write-Host "-> Destinazione: '$xlsxPath'"

    # Converte il file CSV in formato XLSX (con AutoSize colonne e AutoFilter abilitati)
    Import-Csv -Path $csvFullPath -Delimiter $Delimiter -Encoding UTF8 | Export-Excel -Path $xlsxPath -AutoSize -AutoFilter -ClearSheet

    # Sposta il CSV nella sottocartella "csv" per tenere pulita la directory
    if ($currentFolderName -ne "csv") {
        if (-not (Test-Path $csvTargetDir)) {
            New-Item -ItemType Directory -Path $csvTargetDir | Out-Null
        }
        Move-Item -Path $csvFullPath -Destination (Join-Path $csvTargetDir $fileName) -Force
        Write-Host "-> File CSV spostato in background nella cartella: '$csvTargetDir'"
    }

    Write-Host "-> Completato con successo! Il file XLSX è ora disponibile."
}
catch {
    Write-Host "Errore durante la conversione: $_"
}
