# Script para configurar branch protection rules no GitHub (Windows)
# Requer: GitHub CLI (gh) instalado e autenticado

Write-Host "🔧 Configurando branch protection rules para o repositório..." -ForegroundColor Cyan

# Verifica se gh CLI está instalado
try {
    $null = Get-Command gh -ErrorAction Stop
} catch {
    Write-Host "❌ GitHub CLI (gh) não encontrado. Instale com: https://cli.github.com/" -ForegroundColor Red
    exit 1
}

# Verifica se está autenticado
try {
    $null = gh auth status
} catch {
    Write-Host "❌ Não autenticado no GitHub CLI. Execute: gh auth login" -ForegroundColor Red
    exit 1
}

# Pega o nome do repositório atual
try {
    $remoteUrl = git config --get remote.origin.url
    if ($remoteUrl -match "github\.com[:/](.+)\.git$") {
        $repo = $matches[1]
    } else {
        throw "URL do repositório não reconhecida"
    }
} catch {
    Write-Host "❌ Não foi possível determinar o repositório. Certifique-se de estar em um repo GitHub." -ForegroundColor Red
    exit 1
}

Write-Host "📦 Configurando proteção para o branch main em: $repo" -ForegroundColor Yellow

# Prepara o payload JSON
$payload = @{
    required_status_checks = @{
        strict = $true
        contexts = @("CI")
    }
    enforce_admins = $false
    required_pull_request_reviews = @{
        required_approving_review_count = 1
        dismiss_stale_reviews = $true
    }
    restrictions = $null
    allow_force_pushes = $false
    allow_deletions = $false
} | ConvertTo-Json -Depth 10

# Configura branch protection rules
try {
    $result = gh api `
        --method PUT `
        -H "Accept: application/vnd.github.v3+json" `
        "/repos/$repo/branches/main/protection" `
        --raw-field $payload

    Write-Host "✅ Branch protection rules configuradas com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Resumo das regras aplicadas:" -ForegroundColor Cyan
    Write-Host "   • CI status check obrigatório (build, lint, smoke tests)" -ForegroundColor White
    Write-Host "   • Pull request reviews obrigatórios (1 aprovação)" -ForegroundColor White
    Write-Host "   • Reviews stale descartados automaticamente" -ForegroundColor White
    Write-Host "   • Force pushes desabilitados" -ForegroundColor White
    Write-Host "   • Deleção do branch desabilitada" -ForegroundColor White
    Write-Host ""
    Write-Host "🚀 Agora todos os PRs passarão pela validação automática antes do merge!" -ForegroundColor Green

} catch {
    Write-Host "❌ Erro ao configurar branch protection rules: $_" -ForegroundColor Red
    exit 1
}
