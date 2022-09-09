#SingleInstance, Force
SendMode Input
SetWorkingDir, %A_ScriptDir%

^F5::
SendInput, {F5}
return

^F6::
SendInput, {F6}
return

#InputLevel 1

F5::
SendInput, ^{c}
Run, node "C:\Repos\auto-speech\app.js" --lang="en", , Min
return

F6::
SendInput, ^{c}
Run node "C:\Repos\auto-speech\app.js" --lang="fa", , Min
return

^F12::ExitApp