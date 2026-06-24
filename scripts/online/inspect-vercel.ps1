<#
.SYNOPSIS
  Inspecao read-only do projeto xdouglas-site na Vercel.
  Lista: dados do projeto, envs configuradas (por target e tipo), ultimo deploy,
  dominios configurados. NAO modifica nada.
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

function Get-VercelTeams([string]$token) {
  try { return (Invoke-RestMethod -Method GET -Uri "$VERCEL_API/v2/teams" -Headers @{ Authorization = "Bearer $token" }).teams } catch { return @() }
}

function Get-Project([string]$token, [string]$teamId, [string]$name) {
  $url = "$VERCEL_API/v9/projects/$([uri]::EscapeDataString($name))"
  if ($teamId) { $url += "?teamId=$teamId" }
  return Invoke-RestMethod -Method GET -Uri $url -Headers @{ Authorization = "Bearer $token" }
}

function Get-ProjectEnvs([string]$token, [string]$teamId, [string]$projectId) {
  $url = "$VERCEL_API/v9/projects/$projectId/env"
  if ($teamId) { $url += "?teamId=$teamId" }
  try {
    return (Invoke-RestMethod -Method GET -Uri $url -Headers @{ Authorization = "Bearer $token" }).envs
  } catch {
    Write-Host "[env] nao consegui listar (algum erro de permissao?)" -ForegroundColor Yellow
    return @()
  }
}

function Get-LastDeploy([string]$token, [string]$teamId, [string]$projectId) {
  $url = "$VERCEL_API/v6/deployments?projectId=$projectId&limit=5"
  if ($teamId) { $url += "&teamId=$teamId" }
  try {
    return Invoke-RestMethod -Method GET -Uri $url -Headers @{ Authorization = "Bearer $token" }
  } catch {
    return $null
  }
}

function Get-ProjectDomains([string]$token, [string]$teamId, [string]$projectId) {
  $url = "$VERCEL_API/v9/projects/$projectId/domains"
  if ($teamId) { $url += "?teamId=$teamId" }
  try {
    return (Invoke-RestMethod -Method GET -Uri $url -Headers @{ Authorization = "Bearer $token" }).domains
  } catch { return @() }
}

# ----------------------------------------------------------------------
Write-Section 'Token da Vercel'
$token = Read-Secret 'Cole o token aqui: '
if (-not $token) { throw 'Token vazio.' }

$teams = @(Get-VercelTeams $token)
$teamId = $null
if ($teams.Count -gt 0) {
  Write-Host 'Times encontrados:' -ForegroundColor Yellow
  for ($i = 0; $i -lt $teams.Count; $i++) {
    Write-Host "  [$($i+1)] $($teams[$i].slug)"
  }
  Write-Host '  [0] Pessoal'
  $c = Read-Host 'Escolha'
  if ($c -and [int]$c -gt 0 -and [int]$c -le $teams.Count) {
    $teamId = $teams[[int]$c - 1].id
  }
}

# ----------------------------------------------------------------------
Write-Section 'Projeto'
try {
  $p = Get-Project $token $teamId $PROJECT_NAME
  Write-Host ("  id              : {0}" -f $p.id)
  Write-Host ("  name            : {0}" -f $p.name)
  Write-Host ("  framework       : {0}" -f $p.framework)
  Write-Host ("  productionBranch: {0}" -f $p.productionBranch)
  Write-Host ("  createdAt       : {0}" -f $p.createdAt)
  Write-Host ("  updatedAt       : {0}" -f $p.updatedAt)
  Write-Host ("  link.repository : {0}" -f $p.link.repository)
  Write-Host ("  link.productionBranch: {0}" -f $p.link.productionBranch)
} catch {
  Write-Host "[erro] nao achei o projeto $PROJECT_NAME" -ForegroundColor Red
  exit 1
}

# ----------------------------------------------------------------------
Write-Section 'Ultimos 5 deploys'
$d = Get-LastDeploy $token $teamId $p.id
if ($d -and $d.deployments.Count -gt 0) {
  foreach ($dep in $d.deployments) {
    Write-Host ("  ---") -ForegroundColor DarkGray
    Write-Host ("  id        : {0}" -f $dep.id)
    Write-Host ("  state     : {0}" -f $dep.state)
    Write-Host ("  readyState: {0}" -f $dep.readyState)
    Write-Host ("  url       : {0}" -f $dep.url)
    Write-Host ("  target    : {0}" -f $dep.target)
    Write-Host ("  createdAt : {0}" -f $dep.createdAt)
    if ($dep.alias) { Write-Host ("  alias     : {0}" -f ($dep.alias -join ', ')) }
    if ($dep.errorMessage) {
      Write-Host ("  ERROR     : {0}" -f $dep.errorMessage) -ForegroundColor Red
    }
  }
} else {
  Write-Host '  nenhum deploy encontrado ainda' -ForegroundColor Yellow
}

# ----------------------------------------------------------------------
Write-Section 'Variaveis de ambiente'
$envs = @(Get-ProjectEnvs $token $teamId $p.id)
if ($envs.Count -eq 0) {
  Write-Host '  nenhuma env configurada' -ForegroundColor Yellow
} else {
  Write-Host ("  total: {0}" -f $envs.Count)
  $byKey = @{}
  foreach ($e in $envs) {
    if (-not $byKey.ContainsKey($e.key)) { $byKey[$e.key] = @{ targets = @(); type = $e.type } }
    $byKey[$e.key].targets += $e.target
  }
  foreach ($k in ($byKey.Keys | Sort-Object)) {
    $info = $byKey[$k]
    $targets = ($info.targets | Sort-Object) -join ', '
    $color = if ($info.type -eq 'sensitive') { 'Yellow' } else { 'Gray' }
    Write-Host ("  [{0,-9}] {1,-32} -> {2}" -f $info.type, $k, $targets) -ForegroundColor $color
  }
}

# ----------------------------------------------------------------------
Write-Section 'Dominios'
$domains = @(Get-ProjectDomains $token $teamId $p.id)
if ($domains.Count -eq 0) {
  Write-Host '  nenhum dominio customizado (so o *.vercel.app padrao)' -ForegroundColor Yellow
} else {
  foreach ($dom in $domains) {
    Write-Host ("  - {0,-40}  {1}" -f $dom.name, $dom.verification[0].type)
  }
}

Write-Host ''
Write-Host 'Inspecao concluida. Nenhuma alteracao foi feita.' -ForegroundColor Green
