Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
' Ottiene il percorso della cartella corrente in modo corretto
strPath = fso.GetParentFolderName(WScript.ScriptFullName)
' Componi il comando per avviare PowerShell in modalità nascosta
strCommand = "powershell.exe -ExecutionPolicy Bypass -File """ & strPath & "\Dashboard_Launcher_V2.ps1"""
' Esegue il comando (0 = finestra nascosta, False = non aspettare la fine del processo)
WshShell.Run strCommand, 0, False
