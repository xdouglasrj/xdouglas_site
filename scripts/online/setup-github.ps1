<#
.SYNOPSIS
  Autentica o gh CLI via device flow e publica o branch atual no GitHub.

.DESCRIPTION
  Sem PAT. Roda `gh auth login --web --git-protocol https`, abre o navegador,
  espera você autorizar no github.com/login/device e segue com
  `git add -A`, `git commit` (se houver algo) e `git push origin HEAD:main`.

.NOTES
  - Executa PowerShell como usuário normal (sem admin).
  - Se o `gh` não estiver instalado, exibe um bloco com três opções de install.
  - Idempotente: se já estiver autenticado, pula o device flow.
#>

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Write-Section([string]$title) {
  Write-Host ''
  Write-Host '== ' -NoNewline -ForegroundColor Cyan
  Write-Host $title -ForegroundColor Cyan
}

function Test-GhInstalled {
  $gh = Get-Command gh -ErrorAction SilentlyContinue
  return [bool]$gh
}

function Install-GhFromMsix {
  # Fallback 1: winget (Win11 / Win10 com App Installer)
  $winget = Get-Command winget -ErrorAction SilentlyContinue
  if ($winget) {
    Write-Host '[gh] instalando via winget...' -ForegroundColor Yellow
    & winget install --id GitHub.cli -e --source winget --accept-package-agreements --accept-source-agreements
    return
  }
  # Fallback 2: MSI baixado direto do GitHub (precisa de internet)
  Write-Host '[gh] winget nao encontrado. Baixando MSI do GitHub CLI...' -ForegroundColor Yellow
  $url = 'https://github.com/cli/cli/releases/download/v2.65.0/gh_2.65.0_windows_amd64.msi'
  $msi = Join-Path $env:TEMP 'gh.msi'
  Invoke-WebRequest -UseBasicParsing -Uri $url -OutFile $msi
  Start-Process msiexec.exe -ArgumentList "/i `"$msi`" /qn /norestart" -Wait -NoNewWindow
}

# ----------------------------------------------------------------------
# 1. Garantir que o gh esta instalado
# ----------------------------------------------------------------------

if (-not (Test-GhInstalled)) {
  Write-Section 'Instalando gh CLI'
  try {
    Install-GhFromMsix
  } catch {
    Write-Host ''
    Write-Host 'Nao consegui instalar o gh automaticamente.' -ForegroundColor Red
    Write-Host 'Instale manualmente uma das opcoes abaixo e rode este script de novo:' -ForegroundColor Yellow
    Write-Host '  winget install --id GitHub.cli -e'
    Write-Host '  choco install gh -y'
    Write-Host '  https://cli.github.com/'
    exit 1
  }
  if (-not (Test-GhInstalled)) {
    Write-Host '[gh] ainda nao esta no PATH. Feche e abra o PowerShell de novo e rode este script.' -ForegroundColor Red
    exit 1
  }
}

# ----------------------------------------------------------------------
# 2. Autenticar via device flow (PAT nunca e tocado)
# ----------------------------------------------------------------------

Write-Section 'Autenticando no GitHub (device flow)'

$status = & gh auth status 2>&1 | Out-String
if ($LASTEXITCODE -eq 0 -and $status -match 'Logged in to') {
  Write-Host '[gh] ja esta autenticado. Pulando device flow.' -ForegroundColor Green
} else {
  Write-Host 'Abrindo o navegador em github.com/login/device...' -ForegroundColor Yellow
  Write-Host 'Cole o codigo que apareceu no terminal e autorize o app "GitHub CLI".' -ForegroundColor Yellow
  & gh auth login --web --git-protocol https --hostname github.com
  if ($LASTEXITCODE -ne 0) {
    Write-Host '[gh] autenticacao cancelada ou falhou.' -ForegroundColor Red
    exit 1
  }
}

& gh auth setup-git 2>&1 | Out-Null

# ----------------------------------------------------------------------
# 3. Garantir que o remote usa HTTPS com o helper de credenciais do gh
# ----------------------------------------------------------------------

Write-Section 'Configurando remote'

$repoRoot = (git rev-parse --show-toplevel).Trim()
Set-Location $repoRoot

$origin = (git remote get-url origin).Trim()
if ($origin -match '^git@github\.com:') {
  $newUrl = $origin -replace '^git@github\.com:', 'https://github.com/'
  git remote set-url origin $newUrl
  Write-Host "[remote] convertido para HTTPS: $newUrl" -ForegroundColor Green
} else {
  Write-Host "[remote] ja em HTTPS: $origin" -ForegroundColor Green
}

# ----------------------------------------------------------------------
# 4. Commit + push
# ----------------------------------------------------------------------

Write-Section 'Publicando no GitHub'

$branch = (git rev-parse --abbrev-ref HEAD).Trim()
if ($branch -ne 'main') {
  Write-Host "[git] branch atual: $branch (esperado: main)" -ForegroundColor Yellow
}

git add -A

$hasChanges = ((git status --porcelain) | Measure-Object -Line).Lines -gt 0
if ($hasChanges) {
  $stamp = Get-Date -Format 'yyyy-MM-dd HH:mm'
  $msg = "chore: bootstrap online deploy ($stamp)"
  git commit -m $msg
  Write-Host "[git] commit criado: $msg" -ForegroundColor Green
} else {
  Write-Host '[git] nada para commitar.' -ForegroundColor Yellow
}

git push -u origin $branch
if ($LASTEXITCODE -ne 0) {
  Write-Host '[git] push falhou. Veja o erro acima.' -ForegroundColor Red
  exit 1
}

Write-Host ''
Write-Host 'Pronto. Codigo publicado em:' -ForegroundColor Green
Write-Host "  https://github.com/xdouglasrj/xdouglas_site" -ForegroundColor Green
