#!/bin/bash

# Script para configurar branch protection rules no GitHub
# Requer: GitHub CLI (gh) instalado e autenticado

set -e

echo "🔧 Configurando branch protection rules para o repositório..."

# Verifica se gh CLI está instalado
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) não encontrado. Instale com: https://cli.github.com/"
    exit 1
fi

# Verifica se está autenticado
if ! gh auth status &> /dev/null; then
    echo "❌ Não autenticado no GitHub CLI. Execute: gh auth login"
    exit 1
fi

# Pega o nome do repositório atual
REPO=$(git config --get remote.origin.url | sed 's/.*:\/\/github.com\///' | sed 's/\.git$//')

if [ -z "$REPO" ]; then
    echo "❌ Não foi possível determinar o repositório. Certifique-se de estar em um repo GitHub."
    exit 1
fi

echo "📦 Configurando proteção para o branch main em: $REPO"

# Configura branch protection rules
gh api \
  --method PUT \
  -H "Accept: application/vnd.github.v3+json" \
  "/repos/$REPO/branches/main/protection" \
  --field 'required_status_checks={"strict":true,"contexts":["CI"]}' \
  --field 'enforce_admins=false' \
  --field 'required_pull_request_reviews={"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  --field 'restrictions=null' \
  --field 'allow_force_pushes=false' \
  --field 'allow_deletions=false'

echo "✅ Branch protection rules configuradas com sucesso!"
echo ""
echo "📋 Resumo das regras aplicadas:"
echo "   • CI status check obrigatório (build, lint, smoke tests)"
echo "   • Pull request reviews obrigatórios (1 aprovação)"
echo "   • Reviews stale descartados automaticamente"
echo "   • Force pushes desabilitados"
echo "   • Deleção do branch desabilitada"
echo ""
echo "🚀 Agora todos os PRs passarão pela validação automática antes do merge!"
