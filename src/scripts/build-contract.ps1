$ErrorActionPreference = 'Stop'
$arenaVsWhere = 'C:/Program Files (x86)/Microsoft Visual Studio/Installer/vswhere.exe'
if (Test-Path $arenaVsWhere) {
    $arenaVsPath = & $arenaVsWhere -latest -products '*' -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
    if ($arenaVsPath) { & "$arenaVsPath/Common7/Tools/Launch-VsDevShell.ps1" -Arch amd64 -HostArch amd64 -SkipAutomaticLocation }
}
$env:PATH = "$env:USERPROFILE/.cargo/bin;$env:PATH"
if (Test-Path .tools/stellar/stellar.exe) { & .tools/stellar/stellar.exe contract build --package arena_escrow --optimize=false }
else { & stellar contract build --package arena_escrow --optimize=false }
exit $LASTEXITCODE
