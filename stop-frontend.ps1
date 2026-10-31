$ErrorActionPreference = 'Stop'
$pidPath = Join-Path $PSScriptRoot '.local/frontend.pid'
if (-not (Test-Path -LiteralPath $pidPath)) { throw 'No frontend process recorded by start.ps1.' }
$frontendPid = [int](Get-Content -LiteralPath $pidPath)
$processInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $frontendPid"
$vitePath = Join-Path $PSScriptRoot 'frontend/node_modules/vite/bin/vite.js'
if ($processInfo -and $processInfo.Name -eq 'node.exe' -and $processInfo.CommandLine.Contains($vitePath)) {
    Stop-Process -Id $frontendPid
    Write-Output 'Unified frontend stopped. Backend and PostgreSQL are unchanged.'
} elseif ($processInfo) {
    throw 'The recorded process no longer belongs to this frontend; it was not stopped.'
} else {
    Write-Output 'The recorded frontend is already stopped.'
}
