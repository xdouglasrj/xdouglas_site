<#
.SYNOPSIS
  Sobe as 18 variaveis de ambiente do .env.local para o projeto xdouglas-site
  na Vercel sem sobrescrever envs ja configuradas.

.DESCRIPTION
  - Detecta team automaticamente.
  - Acha o projeto xdouglas-site (no time correto).
  - Sobe envs idempotentemente em production + preview + development.
  - Sensitive (JWT, refresh, analytics, cron, resend) pulam o target development
    (a Vercel proibe sensitive + development).
  - Se a env ja existe para qualquer target (ENV_CONFLICT), pula e segue.
  - NAO dispara deploy. Use o botao Redeploy no painel ou git push vazio.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts/online/sync-envs.ps1
#>

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$VERCEL_API = 'https://api.vercel.com'
$PROJECT_NAME = 'xdouglas-site'

function Write-Section([string]$title) {
  Write-Host ''
  Write-Host '== ' -NoNewline -ForegroundColor Cyan
  Write-Host $title -ForegroundColor Cyan
}

function Read-Secret([string]$prompt) {
  Write-Host $prompt -NoNewline -ForegroundColor Yellow
  $secure = Read-Host -AsSecureString
  [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  )
}

function Get-EnvFile {
  $dir = (Get-Location).Path
  while ($dir) {
    $candidate = Join-Path $dir '.env.local'
    if (Test-Path $candidate) { return $candidate }
    $example = Join-Path $dir '.env.example'
    if (Test-Path $example) { return $example }
    $parent = Split-Path -Parent $dir
    if ($parent -eq $dir) { break }
    $dir = $parent
  }
  throw 'Nenhum .env.local nem .env.example encontrado na raiz do repo.'
}

function Read-EnvFile([string]$path) {
  $map = @{}
  Get-Content $path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith('#')) { return }
    if ($line -notmatch '^[A-Z0-9_]+=') { return }
    $parts = $line.Split('=', 2)
    $key = $parts[0].Trim()
    $val = $parts[1].Trim()
    if (($val.StartsWith('"') -and $val.EndsWith('"')) -or
        ($val.StartsWith("'") -and $val.EndsWith("'"))) {
      $val = $val.Substring(1, $val.Length - 2)
    }
    $map[$key] = $val
  }
  return $map
}

function Get-VercelTeams([string]$token) {
  try { return (Invoke-RestMethod -Method GET -Uri "$VERCEL_API/v2/teams" -Headers @{ Authorization = "Bearer $token" }).teams } catch { return @() }
}

function Find-Project([string]$token, [string]$teamId, [string]$name) {
  $headers = @{ Authorization = "Bearer $token" }
  $candidates = @()
  if ($teamId) {
    $candidates += @{ teamId = $teamId; label = "team $teamId" }
  }
  $candidates += @{ teamId = $null; label = 'pessoal' }
  foreach ($c in $candidates) {
    $url = "$VERCEL_API/v9/projects/$([uri]::EscapeDataString($name))"
    if ($c.teamId) { $url += "?teamId=$($c.teamId)" }
    try {
      $p = Invoke-RestMethod -Method GET -Uri $url -Headers $headers
      return @{ project = $p; teamId = $c.teamId }
    } catch {
      if ($_.Exception.Response.StatusCode -ne 404) {
        Write-Host "[busca] $($c.label): $($_.ErrorDetails.Message)" -ForegroundColor Yellow
      }
    }
  }
  return $null
}

function Set-EnvVar([string]$token, [string]$teamId, [string]$projectId, [string]$key, [string]$value, [string]$target, [bool]$sensitive) {
  $headers = @{
    Authorization = "Bearer $token"
    'Content-Type' = 'application/json'
  }
  $typeArr = if ($sensitive) { @('sensitive') } else { @('plain') }
  $body = @{
    key = $key
    value = $value
    type = $typeArr
    target = @($target)
  } | ConvertTo-Json

  $url = "$VERCEL_API/v10/projects/$projectId/env"
  if ($teamId) { $url += "?teamId=$teamId" }
  try {
    Invoke-RestMethod -Method POST -Uri $url -Headers $headers -Body $body | Out-Null
    return 'created'
  } catch {
    $code = $_.Exception.Response.StatusCode
    $msg = $_.ErrorDetails.Message
    # ENV_CONFLICT: ja existe com mesmo nome (em um dos targets). Nao sobrescreve.
    if ($code -eq 400) {
      try {
        $parsed = $msg | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($parsed.error.code -eq 'ENV_CONFLICT') { return 'exists' }
        # sensitive nao aceita target development (limitacao da Vercel)
        if ($parsed.error.code -eq 'BAD_REQUEST' -and $msg -match 'development') { return 'skip-bad-target' }
      } catch {}
    }
    Write-Host "    [ERRO] $key / $target : HTTP $code $msg" -ForegroundColor Red
    return "error:$code"
  }
}

function Get-EnvValue([string]$path, [hashtable]$env, [string]$key) {
  if ($env.ContainsKey($key)) {
    $v = $env[$key]
    if ($v -and $v.Trim() -ne '') { return $v }
  }
  if (Test-Path $path) {
    $m = Select-String -Path $path -Pattern "^$key=`"?(?<v>[^`"#]*)" -ErrorAction SilentlyContinue
    if ($m -and $m.Matches.Count -gt 0 -and $m.Matches[0].Groups['v'].Value.Trim()) {
      return $m.Matches[0].Groups['v'].Value.Trim()
    }
  }
  return $null
}

# ----------------------------------------------------------------------
Write-Section 'Token da Vercel'
$token = Read-Secret 'Cole o token aqui: '
if (-not $token) { throw 'Token vazio.' }

$teams = @(Get-VercelTeams $token)
Write-Host "[vercel] $($teams.Count) time(s) acessivel(is) com este token" -ForegroundColor Green
$teamId = $null
if ($teams.Count -gt 0) {
  Write-Host ''
  Write-Host 'Times:' -ForegroundColor Yellow
  for ($i = 0; $i -lt $teams.Count; $i++) {
    Write-Host "  [$($i+1)] $($teams[$i].slug) ($($teams[$i].name))"
  }
  Write-Host "  [0] Pessoal (sem team)"
  $choice = Read-Host 'Em qual time esta o projeto xdouglas-site?'
  if ($choice -and [int]$choice -gt 0 -and [int]$choice -le $teams.Count) {
    $teamId = $teams[[int]$choice - 1].id
  }
}

# ----------------------------------------------------------------------
Write-Section "Achando projeto $PROJECT_NAME"
$found = Find-Project $token $teamId $PROJECT_NAME
if (-not $found) {
  Write-Host "[erro] projeto $PROJECT_NAME nao encontrado." -ForegroundColor Red
  exit 1
}
$project = $found.project
$teamId = $found.teamId
Write-Host "[vercel] projeto $($project.name) (id=$($project.id))" -ForegroundColor Green
if ($teamId) { Write-Host "[vercel] team: $teamId" }

# ----------------------------------------------------------------------
Write-Section 'Carregando .env.local'
$envFile = Get-EnvFile
$envVars = Read-EnvFile $envFile
Write-Host "[env] $($envVars.Count) variaveis carregadas de $envFile" -ForegroundColor Green

# ----------------------------------------------------------------------
$sensitiveKeys = @(
  'JWT_SECRET', 'REFRESH_TOKEN_SECRET', 'ANALYTICS_ENCRYPTION_KEY',
  'RESEND_API_KEY', 'CRON_SECRET'
)

$requiredKeys = @(
  'DATABASE_URL', 'DIRECT_URL',
  'JWT_SECRET', 'REFRESH_TOKEN_SECRET', 'ANALYTICS_ENCRYPTION_KEY',
  'R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME_PUBLIC', 'R2_BUCKET_NAME_PRIVATE', 'R2_PUBLIC_HOSTNAME', 'R2_PUBLIC_URL',
  'IP_API_URL', 'NEXT_PUBLIC_APP_URL',
  'CRON_SECRET', 'RESEND_API_KEY', 'EMAIL_FROM'
)

Write-Section 'Subindo envs'
$created = 0
$kept = 0
$skipped = 0
$targetErrors = 0

foreach ($k in $requiredKeys) {
  $v = Get-EnvValue $envFile $envVars $k
  if (-not $v) {
    Write-Host "  [skip] $k (vazio no .env.local)" -ForegroundColor DarkGray
    $skipped++
    continue
  }
  $isSensitive = $sensitiveKeys -contains $k
  # Sensitive nao aceita target development na Vercel
  $targetsForKey = if ($isSensitive) { @('production', 'preview') } else { @('production', 'preview', 'development') }

  $keyOk = $true
  foreach ($t in $targetsForKey) {
    $state = Set-EnvVar $token $teamId $project.id $k $v $t $isSensitive
    switch ($state) {
      'created'   { $created++ }
      'exists'    { $kept++ }
      'skip-bad-target' { $targetErrors++; $keyOk = $false }
      default     { $keyOk = $false }
    }
  }
  $tag = if ($isSensitive) { '[sensitive]' } else { '[plain]   ' }
  $color = if ($keyOk) { 'Gray' } else { 'Yellow' }
  Write-Host ("  {0} {1}" -f $tag, $k) -ForegroundColor $color
}

Write-Host ''
Write-Host "[env] $created criadas, $kept ja existiam (puladas), $skipped ignoradas (vazias)" -ForegroundColor Green
if ($targetErrors -gt 0) {
  Write-Host "[env] $targetErrors ocorrencia(s) de bad target (sensitiva + development) -- ignore" -ForegroundColor Yellow
}

Write-Host ''
Write-Host 'Proximo passo: redeploy para as novas envs valerem.' -ForegroundColor Cyan
Write-Host '  Opcao A (sem git push): va no painel da Vercel -> Deployments -> Redeploy no ultimo deploy' -ForegroundColor Gray
Write-Host '  Opcao B (com git push, vazio):' -ForegroundColor Gray
Write-Host '    git commit --allow-empty -m "chore: redeploy com envs"' -ForegroundColor Gray
Write-Host '    git push origin main' -ForegroundColor Gray
