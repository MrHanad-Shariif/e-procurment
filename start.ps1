param([switch]$ContainerFrontend)
$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
Push-Location $projectRoot
try {
    if (-not (Test-Path -LiteralPath '.env')) {
        $sessionSecret = [guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
        $jwtSecret = [guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
        @("SECRET_KEY=$sessionSecret", "JWT_SECRET_KEY=$jwtSecret", 'POSTGRES_PASSWORD=eprocure-local', 'AI_PROVIDER=disabled') |
            Set-Content -LiteralPath '.env' -Encoding UTF8
    }
    docker compose -p tenderrank-unified up -d postgres redis backend
    if ($LASTEXITCODE -ne 0) { throw 'Could not start the shared backend services.' }
    if ($ContainerFrontend) {
        docker compose -p tenderrank-unified up -d frontend
        if ($LASTEXITCODE -ne 0) { throw 'Could not start the frontend container.' }
    } else {
        $alreadyRunning = $false
        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:5175' -TimeoutSec 5
            $alreadyRunning = $response.StatusCode -eq 200
        } catch { }
        if (-not $alreadyRunning) {
            Push-Location (Join-Path $projectRoot 'frontend')
            try {
                if (-not (Test-Path -LiteralPath 'node_modules/vite/bin/vite.js')) {
                    npm.cmd ci
                    if ($LASTEXITCODE -ne 0) { throw 'Could not install frontend dependencies.' }
                }
                $env:API_PROXY_TARGET = 'http://127.0.0.1:5002'
                $env:VITE_API_URL = '/api'
                $logDir = Join-Path $projectRoot '.local'
                New-Item -ItemType Directory -Path $logDir -Force | Out-Null
                $vitePath = Join-Path (Get-Location) 'node_modules/vite/bin/vite.js'
                $frontendTask = Start-Process -FilePath (Get-Command node).Source -ArgumentList @(
                    ('"' + $vitePath + '"'), '--host', '127.0.0.1', '--port', '5175', '--strictPort'
                ) -WorkingDirectory (Get-Location) -WindowStyle Hidden -PassThru `
                    -RedirectStandardOutput (Join-Path $logDir 'frontend.stdout.log') `
                    -RedirectStandardError (Join-Path $logDir 'frontend.stderr.log')
                $frontendTask.Id | Set-Content -LiteralPath (Join-Path $logDir 'frontend.pid')
            } finally { Pop-Location }
        }
    }
    Write-Output 'TenderRank: http://127.0.0.1:5175/login'
    Write-Output 'API: http://127.0.0.1:5002/api/v1/health/'
} finally { Pop-Location }
