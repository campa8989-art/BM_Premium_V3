
$mappaturaCsv = "01-Operation\01_Operations_Standard\csv\Mappatura_Manutenzioni_Sacco_Ordinata_TOTALE.csv"
$data = Import-Csv -Path $mappaturaCsv -Encoding UTF8
$firstRow = $data[0]
Write-Host "Properties found in CSV:"
$firstRow.PSObject.Properties.Name | ForEach-Object { Write-Host " - '$_'" }

Write-Host "`nValue of first row Quantità:"
$qProp = $firstRow.PSObject.Properties | Where-Object { $_.Name -like "*Quantit*" } | Select-Object -ExpandProperty Name -First 1
Write-Host " Matched Prop: '$qProp'"
Write-Host " Value: '$($firstRow.$qProp)'"
