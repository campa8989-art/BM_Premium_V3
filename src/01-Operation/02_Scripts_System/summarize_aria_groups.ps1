# Script per generare un sommario delle frequenze per ogni gruppo ARIA
$HMap = Get-Content "scratch/aria_real_hierarchy_mapping.json" | ConvertFrom-Json

$Summary = @{}

foreach ($cat in $HMap.PSObject.Properties) {
    if ($cat.Value -eq $null) { continue }
    $freqs = $cat.Value.Freq | ForEach-Object { $_.Split(",") | ForEach-Object { $_.Trim() } }
    $uniqueFreqs = $freqs | Select-Object -Unique
    
    $Summary[$cat.Name] = $uniqueFreqs -join ", "
}

$Summary | ConvertTo-Json | Out-File "scratch/aria_group_summary.json" -Encoding utf8
Write-Host "Sommario generato in scratch/aria_group_summary.json"
