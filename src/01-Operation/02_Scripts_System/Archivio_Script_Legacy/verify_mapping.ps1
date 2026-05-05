$TsvPath = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\master_matrix.tsv"
$MasterListPath = "c:\Users\ICampagnoli\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\01-ASST FBF Sacco\01-Operation\10_AI\01_Operations\csv\Master_Facility_List_Validated.csv"

$MasterList = Import-Csv $MasterListPath
$SiteMap = @{}
foreach ($s in $MasterList) { 
    $SiteMap[$s.ID_Folder] = $s.Nome_Sito
}

$RawData = Get-Content $TsvPath
$Row1 = $RawData[0].Split("`t")
$Row2 = $RawData[1].Split("`t")

Write-Host "--- MAPPING AUDIT ---"
for ($c = 7; $c -lt 50; $c++) {
    $r1 = if ($c -lt $Row1.Count) { $Row1[$c].Trim() } else { "" }
    $r2 = if ($c -lt $Row2.Count) { $Row2[$c].Trim() } else { "" }
    
    $id = "XX"
    if ($r1 -match "ID presidio (\d+)") { $id = $Matches[1].PadLeft(2, '0') }
    
    $matched = if ($SiteMap.ContainsKey($id)) { "MATCH: $($SiteMap[$id])" } else { "NO MATCH" }
    
    Write-Host "Col $c: R1=[$r1] | R2=[$r2] | ID=$id | $matched"
}
