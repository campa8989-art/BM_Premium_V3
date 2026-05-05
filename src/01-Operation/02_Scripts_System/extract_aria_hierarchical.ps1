# Script di ricerca approfondita per mappare i codici ARIA alle frequenze reali
Import-Module ImportExcel

$AriaFile = Get-ChildItem -Path "01-Operation\05 - Servizi\MANUTENZIONE" -Recurse -Filter "ARIA*.xlsx" | Select-Object -First 1
$Path = $AriaFile.FullName

$sheets = @("B_impianti climatici", "C_Impianti elettrici ", "D_Impianti idrici ", "E_Impianti antincendio")

$FinalMapping = @{}

foreach ($s in $sheets) {
    Write-Host "Analisi foglio: $s"
    $raw = Import-Excel -Path $Path -WorksheetName $s -NoHeader
    
    $CurrentCat = ""
    $CurrentSubSub = ""
    
    foreach ($row in $raw) {
        $p3 = [string]$row.P3
        $p4 = [string]$row.P4
        $p5 = [string]$row.P5
        $desc = [string]$row.P6
        
        # 1. Update Hierarchy
        if ($p3 -match '^[B-E]$') { $CurrentCat = $p3; continue }
        if ($p3 -match '^[B-E]\d+$') { $CurrentCat = $p3; continue }
        if ($p3 -match '^[B-E]\d+\.\d+') { $CurrentCat = $p3; continue }
        
        # Gestione B2.01 (P3) - Spesso i codici sono in P3 completi
        if ($p3 -match '^[B-E][\d\.]+$') { $CurrentCat = $p3 }
        
        # 2. Identificazione Operazione
        # Se P6 ha testo e (P5 o P4) ha un numero, è un'operazione
        if ($desc -and ($p5 -match '^\d+$' -or $p4 -match '^\d+$')) {
            # Estrazione Frequenza (P7-P14)
            $freqs = @()
            if ($row.P7)  { $freqs += "Giornaliera" }
            if ($row.P8)  { $freqs += "Settimanale" }
            if ($row.P9)  { $freqs += "Quindicinale" }
            if ($row.P10) { $freqs += "Mensile" }
            if ($row.P11) { $freqs += "Trimestrale" }
            if ($row.P12) { $freqs += "Semestrale" }
            if ($row.P13) { $freqs += "Annuale" }
            if ($row.P14) { $freqs += "Biennale" }
            if ($row.P15 -and $row.P15 -match '[A-Z]') { $freqs += "All'occorrenza" } # Colonna Note/Occorrenza
            
            if ($freqs.Count -gt 0) {
                if (-not $FinalMapping.ContainsKey($CurrentCat)) {
                    $FinalMapping[$CurrentCat] = @()
                }
                $FinalMapping[$CurrentCat] += [PSCustomObject]@{
                    Op = if($p5){$p5}else{$p4}
                    Desc = $desc
                    Freq = ($freqs -join ", ")
                }
            }
        }
    }
}

$FinalMapping | ConvertTo-Json -Depth 5 | Out-File "scratch/aria_real_hierarchy_mapping.json" -Encoding utf8
Write-Host "Mappatura completata in scratch/aria_real_hierarchy_mapping.json"
