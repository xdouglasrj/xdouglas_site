<#
.SYNOPSIS
  Verifica o dominio e a chave de API do Resend e sobe as envs na Vercel.

.DESCRIPTION
  1. Pede RESEND_API_KEY no prompt seguro.
  2. Lista os dominios da conta e mostra o status de cada um
     (nota: o codigo sobe como 'verified' depois que o DNS estiver correto).
  3. Para o EMAIL_FROM que voce quer usar, checa se o dominio esta verificado.
  4. Se a VERCEL_TOKEN estiver no ambiente, sobe RESEND_API_KEY e EMAIL_FROM
     no projeto xdouglas via API. Se nao estiver, so mostra os comandos
     `vercel env add` para voce rodar manualmente.

.NOTES
  - Nenhum segredo e persistido em disco por este script.
#>

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$RESEND_API = 'https://api.resend.com'
$VERCEL_API = 'https://api.vercel.com'
$PROJECT_NAME = 'xdouglas'

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

function Get-Resend([string]$key, [string]$path) {
  $h = @{ Authorization = "Bearer $key"; Accept = 'application/json' }
  return Invoke-RestMethod -Method GET -Uri "$RESEND_API$path" -Headers $h
}

function Get-ResendDomains([string]$key) {
  try {
    return (Get-Resend $key '/domains').data
  } catch {
    Write-Host '[resend] nao consegui listar dominios.' -ForegroundColor Red
    return @()
  }
}

# ----------------------------------------------------------------------
# 1. Chave da API
# ----------------------------------------------------------------------

Write-Section 'Chave do Resend'
Write-Host 'Crie uma chave em https://resend.com/api-keys (escopo: full access).' -ForegroundColor Yellow
$resendKey = Read-Secret 'Cole a RESEND_API_KEY aqui: '
if (-not $resendKey) { throw 'Chave vazia.' }

try {
  $apiKeys = (Get-Resend $resendKey '/api-keys').data
  Write-Host "[resend] autenticado. $($apiKeys.Count) chave(s) encontrada(s)." -ForegroundColor Green
} catch {
  throw 'Chave invalida.'
}

# ----------------------------------------------------------------------
# 2. Dominios
# ----------------------------------------------------------------------

Write-Section 'Dominios'
$domains = Get-ResendDomains $resendKey
if ($domains.Count -eq 0) {
  Write-Host '[resend] nenhum dominio cadastrado ainda.' -ForegroundColor Yellow
} else {
  foreach ($d in $domains) {
    $status = if ($d.status -eq 'verified') { 'VERIFIED' } else { $d.status.ToUpper() }
    $color = if ($d.status -eq 'verified') { 'Green' } else { 'Yellow' }
    Write-Host ('  - {0,-40} [{1}]' -f $d.name, $status) -ForegroundColor $color
  }
}

# ----------------------------------------------------------------------
# 3. EMAIL_FROM
# ----------------------------------------------------------------------

Write-Section 'Remetente (EMAIL_FROM)'
$emailFrom = Read-Host 'Qual remetente voce quer usar? (ex: convite@xdouglas.com.br)'
if (-not $emailFrom -or $emailFrom -notmatch '@') {
  throw 'EMAIL_FROM invalido.'
}

$domain = ($emailFrom -split '@')[1]
$domainOk = $domains | Where-Object { $_.name -eq $domain -and $_.status -eq 'verified' } | Select-Object -First 1

if (-not $domainOk) {
  Write-Host ''
  Write-Host "Dominio $domain nao esta verificado." -ForegroundColor Red
  Write-Host "Adicione os registros DNS (SPF/DKIM) que o Resend mostra no painel" -ForegroundColor Yellow
  Write-Host "em https://resend.com/domains e rode este script de novo." -ForegroundColor Yellow
  Write-Host ''
  Write-Host 'Continuando para subir a chave na Vercel mesmo assim (EMAIL_FROM so enviara quando o dominio estiver ok).' -ForegroundColor DarkYellow
} else {
  Write-Host "[resend] dominio $domain verificado." -ForegroundColor Green
}

# ----------------------------------------------------------------------
# 4. Subir na Vercel (se o token estiver no ambiente)
# ----------------------------------------------------------------------

Write-Section 'Subindo envs na Vercel'

$vercelToken = $env:VERCEL_TOKEN
if (-not $vercelToken) {
  Write-Host 'VERCEL_TOKEN nao definido no ambiente deste shell.' -ForegroundColor Yellow
  Write-Host 'Voce pode rodar separadamente, apos o setup-vercel.ps1:' -ForegroundColor Yellow
  Write-Host '  $env:VERCEL_TOKEN = "<seu token>"' -ForegroundColor Gray
  Write-Host '  powershell -File scripts/online/setup-resend.ps1' -ForegroundColor Gray
  Write-Host ''
  Write-Host 'Ou via CLI da Vercel:' -ForegroundColor Yellow
  Write-Host '  vercel env add RESEND_API_KEY production   (cole a chave quando pedir)' -ForegroundColor Gray
  Write-Host '  vercel env add EMAIL_FROM production      (cole: ' -NoNewline -ForegroundColor Gray
  Write-Host $emailFrom -NoNewline -ForegroundColor Cyan
  Write-Host ')' -ForegroundColor Gray
  Write-Host '  vercel env add RESEND_API_KEY preview' -ForegroundColor Gray
  Write-Host '  vercel env add EMAIL_FROM preview' -ForegroundColor Gray
  exit 0
}

# Detectar team
$me = Invoke-RestMethod -Method GET -Uri "$VERCEL_API/v2/user" -Headers @{ Authorization = "Bearer $vercelToken" }
$teamId = $null
try {
  $teams = Invoke-RestMethod -Method GET -Uri "$VERCEL_API/v2/teams" -Headers @{ Authorization = "Bearer $vercelToken" }
  if ($teams.teams.Count -gt 0) {
    Write-Host 'Times disponiveis:' -ForegroundColor Yellow
    for ($i = 0; $i -lt $teams.teams.Count; $i++) {
      Write-Host "  [$($i+1)] $($teams.teams[$i].slug)"
    }
    Write-Host '  [0] Pessoal'
    $c = Read-Host 'Escolha'
    if ($c -and [int]$c -gt 0 -and [int]$c -le $teams.teams.Count) {
      $teamId = $teams.teams[[int]$c - 1].id
    }
  }
} catch {}

$project = Invoke-RestMethod -Method GET -Uri "$VERCEL_API/v9/projects/$PROJECT_NAME$(if ($teamId) { "?teamId=$teamId" })" -Headers @{ Authorization = "Bearer $vercelToken" }
$projectId = $project.id
Write-Host "[vercel] projeto $PROJECT_NAME (id=$projectId)" -ForegroundColor Green

$headers = @{
  Authorization = "Bearer $vercelToken"
  'Content-Type' = 'application/json'
}

function Set-EnvVar([string]$key, [string]$value, [string]$target) {
  $body = @{ key = $key; value = $value; type = 'sensitive'; target = $target } | ConvertTo-Json
  $url = "$VERCEL_API/v10/projects/$projectId/env$(if ($teamId) { "?teamId=$teamId" })"
  try {
    Invoke-RestMethod -Method POST -Uri $url -Headers $headers -Body $body | Out-Null
    return 'created'
  } catch {
    if ($_.Exception.Response.StatusCode -eq 400) { return 'exists' }
    throw
  }
}

foreach ($t in @('production', 'preview', 'development')) {
  $a = Set-EnvVar 'RESEND_API_KEY' $resendKey $t
  $b = Set-EnvVar 'EMAIL_FROM' $emailFrom $t
  Write-Host ("  {0}: RESEND_API_KEY ({1}) | EMAIL_FROM ({2})" -f $t, $a, $b) -ForegroundColor Gray
}

Write-Host ''
Write-Host 'Pronto. Faca um redeploy para as novas envs serem aplicadas:' -ForegroundColor Green
Write-Host '  vercel --prod' -ForegroundColor Gray
Write-Host 'ou faca um commit vazio para disparar auto-deploy em main.' -ForegroundColor Gray
