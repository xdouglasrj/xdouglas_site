<#
.SYNOPSIS
  Cria o projeto na Vercel, sobe todas as variaveis de ambiente e dispara
  o primeiro deploy linkado ao GitHub (auto-deploy em main).

.DESCRIPTION
  - Le .env.local (com fallback para .env.example).
  - Coleta o token da Vercel uma unica vez (prompt seguro).
  - Valida DATABASE_URL/DIRECT_URL antes de subir (sem isso o deploy quebra).
  - Detecta team_id (uso pessoal se nao houver team).
  - Cria o projeto "xdouglas" se nao existir; senao reaproveita.
  - Marca variaveis sensiveis (JWT, refresh, analytics, cron, resend) como Sensitive.
  - Linka o repo GitHub para auto-deploy em main.
  - Dispara o primeiro deploy via API e imprime a URL.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts/online/setup-vercel.ps1
#>

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$VERCEL_API = 'https://api.vercel.com'
$PROJECT_NAME = 'xdouglas'
$REPO_FULL = 'xdouglasrj/xdouglas_site'
$BRANCH = 'main'

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
  $root = (git rev-parse --show-toplevel).Trim()
  $local = Join-Path $root '.env.local'
  $example = Join-Path $root '.env.example'
  if (Test-Path $local) { return $local }
  if (Test-Path $example) { return $example }
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

function Get-VercelUser([string]$token) {
  $r = Invoke-RestMethod -Method GET -Uri "$VERCEL_API/v2/user" -Headers @{ Authorization = "Bearer $token" }
  return $r.user
}

function Get-VercelTeams([string]$token) {
  try {
    $r = Invoke-RestMethod -Method GET -Uri "$VERCEL_API/v2/teams" -Headers @{ Authorization = "Bearer $token" }
    return $r.teams
  } catch {
    return @()
  }
}

function Find-Project([string]$token, [string]$teamId, [string]$name) {
  $headers = @{ Authorization = "Bearer $token" }
  $url = "$VERCEL_API/v9/projects/$([uri]::EscapeDataString($name))"
  if ($teamId) { $url += "?teamId=$teamId" }
  try {
    return Invoke-RestMethod -Method GET -Uri $url -Headers $headers
  } catch {
    if ($_.Exception.Response.StatusCode -eq 404) { return $null }
    throw
  }
}

function New-Project([string]$token, [string]$teamId, [string]$name) {
  $headers = @{
    Authorization = "Bearer $token"
    'Content-Type' = 'application/json'
  }
  $body = @{
    name = $name
    framework = 'nextjs'
    gitRepository = @{ type = 'github'; repo = $REPO_FULL }
  } | ConvertTo-Json -Depth 5

  $url = "$VERCEL_API/v10/projects"
  if ($teamId) { $url += "?teamId=$teamId" }
  $project = Invoke-RestMethod -Method POST -Uri $url -Headers $headers -Body $body

  $patchBody = @{ productionBranch = $BRANCH } | ConvertTo-Json
  $patchUrl = "$VERCEL_API/v9/projects/$($project.id)"
  if ($teamId) { $patchUrl += "?teamId=$teamId" }
  try {
    Invoke-RestMethod -Method PATCH -Uri $patchUrl -Headers $headers -Body $patchBody | Out-Null
  } catch {
    Write-Host "[vercel] aviso: nao consegui setar productionBranch via API. Siga no painel da Vercel." -ForegroundColor Yellow
  }

  return $project
}

function Set-EnvVar([string]$token, [string]$teamId, [string]$projectId, [string]$key, [string]$value, [string]$target, [bool]$sensitive) {
  $headers = @{
    Authorization = "Bearer $token"
    'Content-Type' = 'application/json'
  }
  # A API da Vercel espera `type` e `target` como arrays de string.
  $typeArr = if ($sensitive) { @('sensitive') } else { @('plain') }
  $targetArr = @($target)
  $body = @{
    key = $key
    value = $value
    type = $typeArr
    target = $targetArr
  } | ConvertTo-Json

  $url = "$VERCEL_API/v10/projects/$projectId/env"
  if ($teamId) { $url += "?teamId=$teamId" }
  try {
    Invoke-RestMethod -Method POST -Uri $url -Headers $headers -Body $body | Out-Null
    return 'created'
  } catch {
    if ($_.Exception.Response.StatusCode -eq 400 -and
        ($_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue).error.code -eq 'ENV_ALREADY_EXISTS') {
      return 'exists'
    }
    throw
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

Write-Section 'Token da Vercel'
Write-Host 'Crie um token Full Account em https://vercel.com/account/tokens' -ForegroundColor Yellow
$token = Read-Secret 'Cole o token aqui: '
if (-not $token) { throw 'Token vazio.' }

try {
  $me = Get-VercelUser $token
  Write-Host "[vercel] autenticado como $($me.username) ($($me.email))" -ForegroundColor Green
} catch {
  throw 'Token invalido ou sem escopo Full Account.'
}

$teams = @(Get-VercelTeams $token)
$teamId = $null
if ($teams.Count -gt 0) {
  Write-Host ''
  Write-Host 'Times encontrados:' -ForegroundColor Yellow
  for ($i = 0; $i -lt $i.Count; $i++) {
    Write-Host "  [$($i+1)] $($teams[$i].slug) ($($teams[$i].name))"
  }
  Write-Host "  [0] Pessoal (sem team)"
  $choice = Read-Host 'Escolha [0]'
  if ($choice -and [int]$choice -gt 0 -and [int]$choice -le $teams.Count) {
    $teamId = $teams[[int]$choice - 1].id
  }
}
$teamArg = $teamId

Write-Section 'Carregando .env.local'
$envFile = Get-EnvFile
$envVars = Read-EnvFile $envFile
Write-Host "[env] $($envVars.Count) variaveis carregadas de $envFile" -ForegroundColor Green

Write-Section 'Validacoes'
$dbUrl = $envVars['DATABASE_URL']
$directUrl = $envVars['DIRECT_URL']
if (-not $dbUrl -or $dbUrl -match 'localhost|127\.0\.0\.1|HOST|USER:PASS') {
  Write-Host 'DATABASE_URL ausente ou ainda com placeholder (USER:PASS@HOST:PORT/DB).' -ForegroundColor Red
  Write-Host 'Substitua os placeholders pelas connection strings reais do Supabase/Neon/Railway' -ForegroundColor Red
  Write-Host 'e rode este script de novo.' -ForegroundColor Red
  exit 1
}
if (-not $directUrl -or $directUrl -match 'localhost|127\.0\.0\.1|HOST|USER:PASS') {
  Write-Host 'DIRECT_URL ausente ou ainda com placeholder.' -ForegroundColor Red
  exit 1
}
Write-Host '[ok] DATABASE_URL e DIRECT_URL apontam para Postgres gerenciado' -ForegroundColor Green

$jwt = $envVars['JWT_SECRET']
if (-not $jwt -or $jwt.Length -lt 32) {
  Write-Host 'JWT_SECRET ausente ou curto demais (precisa de 32+ chars).' -ForegroundColor Red
  exit 1
}
Write-Host '[ok] JWT_SECRET definido' -ForegroundColor Green

Write-Section 'Projeto na Vercel'
$project = Find-Project $token $teamArg $PROJECT_NAME
if ($project) {
  Write-Host "[vercel] projeto $PROJECT_NAME ja existe (id=$($project.id)). Reaproveitando." -ForegroundColor Green
} else {
  Write-Host "[vercel] criando projeto $PROJECT_NAME linkado a $REPO_FULL..." -ForegroundColor Yellow
  $project = New-Project $token $teamArg $PROJECT_NAME
  Write-Host "[vercel] projeto criado (id=$($project.id))" -ForegroundColor Green
}
$projectId = $project.id

Write-Section 'Subindo variaveis de ambiente'
$targets = @('production', 'preview', 'development')

$sensitiveKeys = @(
  'JWT_SECRET', 'REFRESH_TOKEN_SECRET', 'ANALYTICS_ENCRYPTION_KEY',
  'RESEND_API_KEY', 'CRON_SECRET'
)

$requiredKeys = @(
  'DATABASE_URL', 'DIRECT_URL',
  'JWT_SECRET', 'REFRESH_TOKEN_SECRET', 'ANALYTICS_ENCRYPTION_KEY',
  'R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME', 'R2_PUBLIC_HOSTNAME', 'R2_PUBLIC_URL',
  'IP_API_URL', 'NEXT_PUBLIC_APP_URL',
  'CRON_SECRET', 'RESEND_API_KEY', 'EMAIL_FROM'
)

$created = 0
$kept = 0
foreach ($k in $requiredKeys) {
  $v = Get-EnvValue $envFile $envVars $k
  if (-not $v) {
    Write-Host "  [skip] $k (vazio)" -ForegroundColor DarkGray
    continue
  }
  foreach ($t in $targets) {
    $isSensitive = $sensitiveKeys -contains $k
    $state = Set-EnvVar $token $teamArg $projectId $k $v $t $isSensitive
    if ($state -eq 'created') { $created++ } else { $kept++ }
  }
  $tag = if ($sensitiveKeys -contains $k) { '[sensitive]' } else { '[plain]   ' }
  Write-Host "  $tag $k" -ForegroundColor Gray
}
Write-Host ''
Write-Host "[env] $created criadas, $kept ja existiam (atualizadas quando reexecutar)" -ForegroundColor Green

Write-Section 'Disparando deploy'

$headers = @{
  Authorization = "Bearer $token"
  'Content-Type' = 'application/json'
}
$body = @{
  name = $PROJECT_NAME
  target = 'production'
  gitSource = @{
    type = 'github'
    repo = $REPO_FULL
    ref = $BRANCH
  }
} | ConvertTo-Json

$deployUrl = "$VERCEL_API/v13/deployments"
if ($teamArg) { $deployUrl += "?teamId=$teamArg" }
$deploy = Invoke-RestMethod -Method POST -Uri $deployUrl -Headers $headers -Body $body

Write-Host "[vercel] deploy criado (id=$($deploy.id))" -ForegroundColor Green
Write-Host "[vercel] status: $($deploy.readyState) - $($deploy.state)" -ForegroundColor Green
Write-Host "[vercel] url: https://$PROJECT_NAME.vercel.app" -ForegroundColor Green
Write-Host "[vercel] dashboard: https://vercel.com/dashboard/$($deploy.id)" -ForegroundColor Green

Write-Host ''
Write-Host 'Proximos passos:' -ForegroundColor Cyan
Write-Host '  1. Aguarde o build (~2 min) na URL acima'
Write-Host '  2. Rode scripts/online/setup-resend.ps1 para checar o dominio do Resend'
Write-Host '  3. (Opcional) Conecte o dominio customizado em vercel.com/dashboard'
