# sync_v4.ps1
# Script consolidato con Normalizzazione Unificata

function Normalize-Name {
    param($name)
    if ([string]::IsNullOrWhiteSpace($name)) { return "" }
    $n = $name.ToUpper().Trim()
    # Gestione varianti Rugabella e abbreviazioni comuni
    $n = $n -replace "(_6| 4_6| 4/6)", "46"
    $n = $n -replace "V\.LE", "VIALE"
    $n = $n -replace "VLE", "VIALE"
    $n = $n -replace "VIA ", ""
    $n = $n -replace "A\. ", ""
    $n = $n -replace "[^A-Z0-9]", ""
    return $n
}

$csv = "01-Operation\01_Operations_Standard\csv"
$h = Import-Csv (Join-Path $csv "Historical_Dates_Lookup.csv") -Delim ";"
$a = Import-Csv (Join-Path $csv "Archivio_File_Status.csv") -Delim ";"
$map = @{}

foreach($r in $h){ if($r.DATA_ULTIMO_INTERVENTO_ANTINCENDIO){
  $k = (Normalize-Name $r.SOTTOCATEGORIA) + "_" + $r.CATEGORIA.ToUpper().Trim()
  $map[$k] = $r.DATA_ULTIMO_INTERVENTO_ANTINCENDIO
}}

foreach($f in $a){
  $s = $null; $p = $f.FullName
  if($p -match "Doria"){$s="Via Doria 52"}elseif($p -match "Orione"){$s="Via Don Orione 2"}elseif($p -match "Farini"){$s="Via Farini 9"}
  elseif($p -match "Rugabella"){$s="Via Rugabella 4_6"}elseif($p -match "Sassi"){$s="Via Sassi 4"}elseif($p -match "Jenner"){$s="Viale Jenner 44"}
  elseif($p -match "Livigno"){$s="Via Livigno 3"}elseif($p -match "Adriano"){$s="Via Adriano"}elseif($p -match "Bollate"){$s="POT Bollate"}
  elseif($p -match "Legnano"){$s="Legnano"}elseif($p -match "Piceno"){$s="Viale Piceno 60"}elseif($p -match "Clericetti"){$s="Via Clericetti 22"}
  elseif($p -match "Bosco"){$s="Via Don Bosco 14"}elseif($p -match "Fantoli"){$s="Via Fantoli 7"}elseif($p -match "Palombino"){$s="Via Palombino 4"}
  elseif($p -match "Quarenghi"){$s="Via Quarenghi 21"}elseif($p -match "Aldini"){$s="Via Aldini 72"}elseif($p -match "Perini"){$s="Via Perini 22"}
  elseif($p -match "Cilea"){$s="Via Cilea 146A"}elseif($p -match "Sanzio"){$s="Via Sanzio 9"}
  
  $sys = $null
  if($p -match "Antincendio"){$sys="ANTINCENDIO"}
  elseif($p -match "Climatici|Caldaie|UTA"){$sys="HVAC"}
  elseif($p -match "Idrici"){$sys="IDRICO"}
  elseif($p -match "Elettrici"){$sys="ELETT"}
  elseif($p -match "Elevatori"){$sys="ELEVATORI"}
  elseif($p -match "Edile"){$sys="EDILE"}
  
  if($s){
    $k = (Normalize-Name $s) + "_" + $sys
    $dt = [datetime]::Parse($f.LastWriteTime, [cultureinfo]::GetCultureInfo('it-IT')).ToString('yyyy-MM-dd')
    if(-not $map.ContainsKey($k) -or $dt -gt $map[$k]){ $map[$k] = $dt }
  }
}

$out = @(); foreach($k in $map.Keys){ $p=$k.Split("_"); $out += [PSCustomObject]@{SitoKey=$p[0];Sistema=$p[1];Data=$map[$k]} }
$out | Export-Csv (Join-Path $csv "Consolidated_Verification_Dates.csv") -NoType -Delim ";" -Enc UTF8
Write-Host "Sync v4.1 completato con successo."
