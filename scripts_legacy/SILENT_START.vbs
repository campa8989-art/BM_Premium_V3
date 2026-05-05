Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Ottiene il percorso della cartella corrente in modo affidabile
strPath = fso.GetParentFolderName(WScript.ScriptFullName)

' Comando per lanciare il launcher PowerShell in modalità nascosta
' Usiamo -WindowStyle Hidden per garantire che non ci siano flash
strCommand = "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & strPath & "\START_BM_PREMIUM_V2.ps1"""

' Esegue il comando (0 = finestra nascosta, False = non aspettare la fine del processo)
WshShell.Run strCommand, 0, False
