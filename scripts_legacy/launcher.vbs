' Launcher per BM Premium V2
' Questo script avvia il server e apre il browser

Option Explicit

Dim objShell, objFSO, objWshShell
Dim projectPath, serverScript, url
Dim pid

Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")
Set objWshShell = CreateObject("WScript.Shell")

projectPath = "C:\Users\PC\OneDrive - MANUTENCOOP Facility Management S.p.A\BM ivan\BM-Gestione-Commessa\new version"
serverScript = projectPath & "\reload_server.ps1"
url = "http://localhost:3000"

' Avvia il server in background (senza finestra)
Dim objExec
Set objExec = objShell.Exec("powershell.exe -ExecutionPolicy Bypass -File """ & serverScript & """")

' Aspetta che il server si avvi (3 secondi)
WScript.Sleep 3000

' Apri il browser
objWshShell.Run url

' Crea shortcut sul desktop (opzionale)
Dim shortcutPath
shortcutPath = objShell.SpecialFolders("Desktop") & "\BM Premium V2.lnk"

' Verifica se esiste già
If Not objFSO.FileExists(shortcutPath) Then
    Dim shortcut
    Set shortcut = objShell.CreateShortcut(shortcutPath)
    shortcut.TargetPath = "http://localhost:3000"
    shortcut.Description = "BM Premium v2 Dashboard"
    shortcut.WorkingDirectory = projectPath
    shortcut.Save
End If

WScript.Echo "BM Premium V2 avviato!"
WScript.Quit