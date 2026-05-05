$baseDir = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$targetDir = Join-Path $PSScriptRoot "..\.."
$outputJs = Join-Path $PSScriptRoot "workspace_data.js"

function Get-DirStructure {
    param($path)
    $structure = @()
    $items = Get-ChildItem -Path $path
    foreach ($entry in $items) {
        if ($entry.Name.StartsWith(".") -or $entry.Name -eq "tmp" -or $entry.FullName -match "\\tmp\\") { continue }
        if ($entry.Length -gt 1MB -and -not $entry.PSIsContainer) { continue } # Salta file troppo grandi (>1MB)
        $item = @{
            name = $entry.Name
            isDir = $entry.PSIsContainer
            path = $entry.FullName.Replace($baseDir + "\", "")
        }
        
        if ($entry.PSIsContainer) {
            $item.children = Get-DirStructure $entry.FullName
        } else {
            $item.size = $entry.Length
            $item.ext = $entry.Extension
        }
        $structure += $item
    }
    return $structure | Sort-Object { $_.isDir }, { $_.name }
}

$data = Get-DirStructure $targetDir
$json = $data | ConvertTo-Json -Depth 20
"const workspaceData = $json;" | Out-File -FilePath $outputJs -Encoding utf8
Write-Host "Workspace data generated successfully."
