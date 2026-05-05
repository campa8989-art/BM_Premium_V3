$Source = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\05 - Servizi\MANUTENZIONE\Periodicità manutenzioni\Mappatura_Manutenzioni_Sacco_Ordinata.xlsx"
if (Test-Path $Source) {
    Write-Host "File exists: $Source"
    $Item = Get-Item $Source
    Write-Host "Full Name: $($Item.FullName)"
} else {
    Write-Host "File NOT found: $Source"
    $Parent = Split-Path $Source
    if (Test-Path $Parent) {
        Write-Host "Parent exists, listing contents:"
        Get-ChildItem $Parent | Select-Object Name
    }
}
