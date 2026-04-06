# ROADMAP DE IMPLEMENTAÇÃO DE TESTES - ERP SPEEDBOAT TOUR

## Objetivo

Este roadmap foi criado para cobrir integralmente os gaps de testes encontrados na análise atual. Ele não descreve uma estratégia de testes "genérica". Ele descreve a ordem exata para zerar os achados reais de testes, com rastreabilidade entre:

- problema de teste encontrado;
- fase que resolve o problema;
- tarefas necessárias;
- critério de aceite para validar a implementação;
- arquivos que concentram o problema;
- evidências esperadas para provar o fechamento.

## Premissas de Execução

- Nenhum teste de performance ou E2E começa antes de unitários e integração estarem estáveis.
- Nenhum teste mistura configuração, mocks, unitários e E2E sem necessidade.
- Toda fase termina com coverage report validado e smoke test funcional.
- O trabalho será entregue em PRs pequenos e reversíveis.
- Cada achado de teste precisa de owner, evidência e PR de fechamento.
- Nenhum teste usa credenciais reais ou dados sensíveis.

## Resultado Esperado

Ao final deste roadmap, o projeto deve:

- ter suite de testes unitários executável em ≤30 segundos;
- ter ≥90% cobertura em ViewModels e Services críticos;
- ter testes reproduzíveis sem dependências externas;
- ter validação de regras de negócio isolada;
- ter testes de integração com Firebase real;
- ter performance validada para operações críticas;
- ter segurança testada em todos os fluxos sensíveis;
- ter documentação de testes alinhada com o código real.

---

## Catálogo Completo dos Achados de Testes

Cada item abaixo representa um problema de teste encontrado na análise.
Nenhum item desta lista deve ficar sem fase de tratamento.

### T. Estabilidade e Configuração de Testes

- `T01` Vitest configurado mas não utilizado (0 testes executando)
- `T02` Configuração de coverage ausente ou incompleta
- `T03` Scripts de testes não definidos no package.json
- `T04` CI/CD sem pipeline de testes automatizado
- `T05` Ambiente de testes não isolado de produção

### U. Cobertura Unitária Crítica

- `U01` 0 testes unitários para 23 ViewModels existentes
- `U02` 0 testes unitários para 5 Services de domínio
- `U03` 0 testes unitários para repositories críticos
- `U04` 0 testes para regras de comissão (CommissionService)
- `U05` 0 testes para validação de eventos (EventStatusService)
- `U06` 0 testes para transações financeiras (TransactionService)
- `U07` 0 testes para cálculos de dashboard (useDashboardViewModel)
- `U08` 0 testes para criação de eventos (useCreateEventViewModel)

### I. Integração e Firebase

- `I01` 0 testes de integração com Firestore real
- `I02` 0 testes de regras de segurança do Firebase
- `I03` 0 testes de autenticação Firebase Auth
- `I04` 0 testes de sincronização de dados offline
- `I05` 0 testes de concorrência multi-usuário

### E. Testes E2E e Funcionais

- `E01` Testes E2E misturados com scripts operacionais
- `E02` 0 testes para gestão completa de clientes
- `E03` 0 testes para gestão de barcos e recursos
- `E04` 0 testes para fluxo financeiro completo
- `E05` 0 testes para sincronização Google Calendar
- `E06` Testes existentes usam credenciais reais (G01)

### P. Performance e Qualidade

- `P01` 0 testes de performance para dashboard
- `P02` 0 testes de load para operações críticas
- `P03` 0 testes de performance mobile
- `P04` 0 testes de acessibilidade (WCAG)
- `P05` 0 testes de segurança e autorização

### S. Mocks e Fixtures

- `S01` 0 mocks para Firebase em testes unitários
- `S02` 0 fixtures reprodutíveis para dados de teste
- `S03` 0 helpers para geração de dados de teste
- `S04` 0 estratégias de isolamento entre testes

---

## Matriz de Cobertura dos Achados

| ID | Problema | Fase | Arquivos Impactados | Critério de Aceite |
|---|---|---|---|---|
| T01 | Vitest não utilizado | Fase 1 | vitest.config.ts | `npm run test:unit` executa com sucesso |
| T02 | Coverage ausente | Fase 1 | package.json | Coverage report ≥60% baseline |
| T03 | Scripts não definidos | Fase 1 | package.json | `test:unit`, `test:integration`, `test:e2e` |
| T04 | CI/CD sem testes | Fase 1 | .github/workflows/ | Pipeline validado com testes |
| T05 | Ambiente não isolado | Fase 1 | .env.test | Configuração separada funcionando |
| U01 | ViewModels sem testes | Fase 2 | 23 ViewModels | ≥90% cobertura nos críticos |
| U02 | Services sem testes | Fase 2 | 5 Services | ≥95% cobertura de função |
| U03 | Repositories sem testes | Fase 2 | Repositories | ≥85% cobertura de branch |
| U04 | Comissão sem testes | Fase 2 | CommissionService.ts | 100% regras cobertas |
| U05 | Eventos sem testes | Fase 2 | EventStatusService.ts | Máquina de estados testada |
| U06 | Transações sem testes | Fase 2 | TransactionService.ts | Atomicidade validada |
| U07 | Dashboard sem testes | Fase 2 | useDashboardViewModel.ts | Métricas validadas |
| U08 | Criação de eventos | Fase 2 | useCreateEventViewModel.ts | Validações cobertas |
| I01 | Integração Firebase | Fase 3 | Firebase config | Conexão real testada |
| I02 | Regras de segurança | Fase 3 | firestore.rules | Autorização validada |
| I03 | Auth Firebase | Fase 3 | AuthContext.ts | Fluxos auth testados |
| I04 | Offline mode | Fase 3 | Repository layer | Sincronização testada |
| I05 | Multi-usuário | Fase 3 | Shared events | Concorrência validada |
| E01 | Testes misturados | Fase 4 | playwright.config.ts | Separação clara de tipos |
| E02 | Gestão clientes | Fase 4 | Client screens | CRUD completo testado |
| E03 | Gestão barcos | Fase 4 | Boat screens | Disponibilidade testada |
| E04 | Fluxo financeiro | Fase 4 | Finance screens | Relatórios validados |
| E05 | Google sync | Fase 4 | GoogleSyncScreen.ts | Sincronização testada |
| E06 | Credenciais reais | Fase 4 | tests/fixtures/ | Mocks implementados |
| P01 | Performance dashboard | Fase 5 | DashboardScreen.tsx | <2s com 1000 eventos |
| P02 | Load testing | Fase 5 | Critical paths | 100+ usuários simultâneos |
| P03 | Mobile performance | Fase 5 | Responsive design | <3s interactive |
| P04 | Acessibilidade | Fase 5 | All screens | WCAG 2.1 AA |
| P05 | Segurança | Fase 5 | Auth flows | Autorização testada |
| S01 | Mocks Firebase | Fase 6 | tests/mocks/ | 100% coverage sem Firebase |
| S02 | Fixtures reprodutíveis | Fase 6 | tests/fixtures/ | Dados consistentes |
| S03 | Helpers dados | Fase 6 | tests/helpers/ | Geração automatizada |
| S04 | Isolamento testes | Fase 6 | test setup | 0% interferência |

---

## Controle Operacional dos Achados

Durante a execução, cada achado de teste deve ser acompanhado com rastreabilidade operacional mínima. O roadmap deixa de ser apenas plano e passa a ser instrumento de acompanhamento.

### Campos obrigatórios por achado

| Campo | Uso minimo |
|---|---|
| ID | Identificador do achado (`T01` ... `S04`) |
| Status | `não iniciado`, `em andamento`, `bloqueado`, `em validação`, `concluído` |
| Fase | Fase oficial que resolve o achado |
| PR | PR onde o tratamento principal aconteceu |
| Owner | Responsável técnico pelo fechamento |
| Evidência | Coverage report, walkthrough, smoke test |
| Bloqueios | Dependências ou riscos restantes |

### Regra operacional

- Nenhum achado muda para `concluído` sem evidência objetiva.
- Nenhum PR fecha achado crítico sem smoke test ou walkthrough registrado.
- Nenhum achado pode migrar para fase posterior sem anotação explícita do motivo.

---

## Mapa de Contexto por Achado

Esta seção existe para reduzir ambiguidade durante a execução.
Ela diz explicitamente quais arquivos concentram cada problema relevante e por que eles entram no escopo.

### 1. Infraestrutura de Testes Ausente

**Achados relacionados**

- `T01`
- `T02`
- `T03`
- `T04`
- `T05`

**Arquivos principais**

- `vitest.config.ts`
  Contexto: existe mas não executando nenhum teste; precisa de configuração completa com mocks, coverage e setup.
- `package.json`
  Contexto: scripts de testes ausentes ou incompletos; precisa definir `test:unit`, `test:integration`, `test:e2e`.
- `.github/workflows/`
  Contexto: pipeline de CI/CD sem validação de testes; precisa integrar testes em todos os PRs.
- `.env.test`
  Contexto: ambiente de testes não isolado; precisa configuração separada de produção.

### 2. ViewModels Críticos Sem Cobertura

**Achados relacionados**

- `U01`
- `U07`
- `U08`

**Arquivos principais**

- `src/viewmodels/useDashboardViewModel.ts`
  Contexto: 100+ linhas, métricas críticas de negócio, 0% cobertura atual; concentra cálculos financeiros e agregações.
- `src/viewmodels/useCreateEventViewModel.ts`
  Contexto: God hook com 500+ linhas, validações complexas, 0 testes; responsável por criação de eventos e validações de negócio.
- `src/viewmodels/useClientHistoryViewModel.ts`
  Contexto: histórico completo do cliente, métricas de relacionamento, 0% cobertura.

### 3. Services de Domínio Não Testados

**Achados relacionados**

- `U02`
- `U04`
- `U05`
- `U06`

**Arquivos principais**

- `src/core/domain/CommissionService.ts`
  Contexto: regras de comissão por guia, cálculos complexos, 0 testes; impacto direto no financeiro.
- `src/core/domain/EventStatusService.ts`
  Contexto: máquina de estados de eventos, transições válidas, 0 testes; crítico para consistência.
- `src/core/domain/TransactionService.ts`
  Contexto: atomicidade de transações financeiras, 0 testes; essencial para integridade dos dados.

### 4. Integração Firebase Inexistente

**Achados relacionados**

- `I01`
- `I02`
- `I03`
- `I04`
- `I05`

**Arquivos principais**

- `firebase.config.ts`
  Contexto: configuração Firebase real, mas sem testes de integração; precisa validar conexão e operações.
- `firestore.rules`
  Contexto: regras de segurança críticas, 0 testes; precisa validar autorização server-side.
- `src/contexts/auth/AuthContext.tsx`
  Contexto: fluxos de autenticação complexos, 0 testes integrados; precisa validar login/logout/reauth.

### 5. Testes E2E Limitados

**Achados relacionados**

- `E01`
- `E02`
- `E03`
- `E04`
- `E05`
- `E06`

**Arquivos principais**

- `tests/functional/`
  Contexto: apenas 5 arquivos funcionais, misturados com scripts; precisa expandir para cobrir todos os fluxos críticos.
- `tests/fixtures/test-data.ts`
  Contexto: usa credenciais reais (G01), precisa de mocks e dados sintéticos reproduzíveis.
- `playwright.config.ts`
  Contexto: configuração mistura testes funcionais com scripts operacionais; precisa separação clara.

---

## Métricas de Sucesso

### Métricas Técnicas
- **Cobertura de Código**: ≥ 90% para ViewModels e Services críticos
- **Cobertura de Branch**: ≥ 85% para lógica de negócio
- **Cobertura de Função**: ≥ 95% para APIs e repositories
- **Testes Unitários**: ≥ 150 testes unitários
- **Testes de Integração**: ≥ 50 testes de integração
- **Testes E2E**: ≥ 30 fluxos críticos cobertos

### Métricas de Qualidade
- **Tempo de Execução**: Suite completa em ≤ 5 minutos
- **Falhas Intermitentes**: ≤ 1% de taxa de flakiness
- **Manutenibilidade**: ≤ 20% de complexidade ciclomática nos testes
- **Documentação**: 100% dos testes com descrições claras

### Métricas de Performance
- **Tempo de Feedback**: ≤ 30 segundos para testes unitários
- **Paralelização**: 80% dos testes executáveis em paralelo
- **Isolamento**: 100% de isolamento entre testes
- **Recursos**: ≤ 2GB RAM para suite completa

---

## Fases de Implementação por Problemas

### Fase 1: Estabilidade da Infraestrutura (T01-T05)

**Objetivo**: Criar base sólida para execução de testes

#### 1.1 Configuração Vitest (T01, T02)
- **Setup completo**: vitest.config.ts com TypeScript, mocks, coverage
- **Coverage baseline**: Configuração com thresholds mínimos
- **Scripts package.json**: test:unit, test:integration, test:e2e, test:coverage

#### 1.2 CI/CD Integration (T03, T04)
- **GitHub Actions**: Pipeline automatizado com testes em todos os PRs
- **Paralelização**: Execução eficiente de testes
- **Reports**: Upload automático de coverage

#### 1.3 Ambiente Isolado (T05)
- **.env.test**: Configuração separada de produção
- **Test data**: Fixtures sintéticas reproduzíveis
- **Isolamento**: Garantir zero interferência com produção

**Evidências Esperadas**:
- `npm run test:unit` executa com sucesso
- Coverage report ≥60% baseline
- Pipeline GitHub Actions validado
- Ambiente .env.test funcionando

### Fase 2: Cobertura Unitária Crítica (U01-U08)

**Objetivo**: Validar lógica de negócio em isolamento

#### 2.1 ViewModels Críticos (U01, U07, U08)
**useDashboardViewModel.ts**
```typescript
// Casos de teste obrigatórios:
- Inicialização com dados vazios
- Carregamento de 1000+ eventos em <500ms
- Cálculo de métricas financeiras (receita, despesas, lucro)
- Filtros por período e status
- Estados de loading e error
- Atualização em tempo real com listeners
- Performance sob carga
```

**useCreateEventViewModel.ts**
```typescript
// Casos de teste obrigatórios:
- Validação de campos obrigatórios (cliente, barco, data)
- Cálculo automático de preços por tipo de passeio
- Conflito de eventos mesmo barco/data
- Validação de capacidade máxima
- Estados de save/cancel/reset
- Tratamento de erros de rede
- Performance com 50+ clientes
```

**useClientHistoryViewModel.ts**
```typescript
// Casos de teste obrigatórios:
- Histórico completo do cliente (eventos, pagamentos)
- Métricas de relacionamento (valor total, frequência)
- Filtros por status e período
- Pagamentos pendentes vs concluídos
- Performance com histórico longo
```

#### 2.2 Services de Domínio (U02, U04-U06)
**CommissionService.ts**
```typescript
// Casos de teste obrigatórios:
- Cálculo de comissões por guia (10%, 15%, 20%)
- Regras diferentes por tipo de evento
- Comissões compartilhadas entre guias
- Bônus por performance (>R$5000 = 5% extra)
- Penalidades por cancelamento (<24h = -2%)
- Arredondamento correto para centavos
- Validação de períodos de pagamento
```

**EventStatusService.ts**
```typescript
// Casos de teste obrigatórios:
- Máquina de estados completa (DRAFT → CONFIRMED → PAID → COMPLETED)
- Transições válidas e inválidas
- Auto-cancelamento por timeout
- Notificações automáticas por mudança
- Histórico completo de mudanças
- Reversão de estados com permissão
```

**TransactionService.ts**
```typescript
// Casos de teste obrigatórios:
- Atomicidade de evento + pagamento + despesa
- Rollback completo em caso de erro
- Conciliação de pagamentos parciais
- Validação de saldos negativos
- Auditoria completa de transações
- Performance com múltiplas transações
```

#### 2.3 Repositories (U03)
**ClientRepository.ts, EventRepository.ts, PaymentRepository.ts**
```typescript
// Casos de teste obrigatórios:
- CRUD completo com validações
- Busca por CPF, email, ID
- Soft delete e restore
- Paginação eficiente (50 itens por página)
- Queries complexas (joins, agregações)
- Performance com 1000+ registros
```

**Evidências Esperadas**:
- Coverage ≥90% nos ViewModels críticos
- Coverage ≥95% nos Services de domínio
- Coverage ≥85% nos repositories
- Suite unitária executando em ≤30 segundos
- 0 dependências externas (100% mocked)

### Fase 3: Integração Firebase (I01-I05)

**Objetivo**: Validar integração real com backend

#### 3.1 Firestore Integration (I01)
```typescript
// Casos de teste obrigatórios:
- Conexão autenticada com Firestore real
- Operações CRUD em coleções reais
- Queries complexas com filtros múltiplos
- Batch writes e transações
- Offline mode com sincronização
- Performance de queries <1s
- Tratamento de erros de conexão
```

#### 3.2 Security Rules (I02)
```typescript
// Casos de teste obrigatórios:
- Autorização por role (OWNER, ADMIN, GUIDE)
- Acesso negado para usuários não autenticados
- Cross-tenant isolation (dados de outras empresas)
- Validação de dados na escrita
- Injection prevention
- Performance das regras <100ms
```

#### 3.3 Firebase Auth (I03)
```typescript
// Casos de teste obrigatórios:
- Login/logout com email/senha
- Troca de senha com reautenticação
- Reset de fluxo completo
- Sessões múltiplas e logout em todos
- Tokens expirados e refresh
- Performance de login <2s
```

#### 3.4 Concorrência (I04, I05)
```typescript
// Casos de teste obrigatórios:
- Edição concorrente do mesmo evento
- Locking automático de recursos
- Notificações em tempo real
- Conflict resolution (last write wins)
- Performance com 10+ usuários simultâneos
```

**Evidências Esperadas**:
- Conexão Firebase real validada
- Security rules 100% effective
- Auth flows completos testados
- Concorrência validada sem corrupção
- Performance <2s para operações críticas

### Fase 4: Expansão E2E (E01-E06)

**Objetivo**: Cobrir todos os fluxos críticos do usuário

#### 4.1 Separação de Tipos (E01)
- **Restruturação playwright.config.ts**: Separar testes funcionais de scripts
- **Novos projetos**: functional-tests, e2e-tests, operational-scripts
- **Isolamento**: Cada tipo com seu próprio setup e teardown

#### 4.2 Gestão Completa de Clientes (E02)
```typescript
// Fluxos obrigatórios:
- Cadastro de novo cliente com validação de CPF
- Edição de dados com histórico de mudanças
- Upload de avatar e documentos
- Vinculação de eventos e pagamentos
- Geração de relatório de cliente
- Exportação de dados (PDF, Excel)
- Delete soft e hard com permissão
```

#### 4.3 Gestão de Barcos e Recursos (E03)
```typescript
// Fluxos obrigatórios:
- Cadastro de barcos com capacidade e fotos
- Calendário de disponibilidade
- Manutenção programada e indisponibilidade
- Conflict resolution para mesmo horário
- Performance com 20+ barcos
- Relatórios de utilização
```

#### 4.4 Fluxo Financeiro Completo (E04)
```typescript
// Fluxos obrigatórios:
- Registro de despesas com aprovação
- Conciliação bancária automática
- Geração de relatórios fiscais
- Exportação contábil (DRE, Fluxo de Caixa)
- Validação de períodos fiscais
- Performance com 1000+ transações
```

#### 4.5 Google Calendar Sync (E05)
```typescript
// Fluxos obrigatórios:
- Autenticação Google OAuth completa
- Sincronização bidirecional de eventos
- Tratamento de conflitos de calendário
- Sync em massa para eventos históricos
- Performance com 500+ eventos
- Error recovery e retry
```

#### 4.6 Substituição de Credenciais (E06)
- **Remoção completa**: Eliminar todas as credenciais reais
- **Mocks realísticos**: Criar dados sintéticos que simulam produção
- **Fixtures reproduzíveis**: Garantir consistência entre execuções
- **Isolamento total**: Zero dependência de ambiente externo

**Evidências Esperadas**:
- Separação clara de tipos de testes
- CRUD completo de clientes validado
- Gestão de recursos 100% funcional
- Fluxo financeiro ponta a ponta
- Google sync funcionando sem erros
- 0 credenciais reais no código

### Fase 5: Performance e Qualidade (P01-P05)

**Objetivo**: Validar performance e acessibilidade

#### 5.1 Performance Dashboard (P01)
```typescript
// Métricas obrigatórias:
- Carregamento <2s com 1000 eventos
- Renderização de métricas <500ms
- Memory usage <100MB
- Network requests <10 por página
- First paint <1.5s
- Interactive <3s
```

#### 5.2 Load Testing (P02)
```typescript
// Cenários obrigatórios:
- 100+ usuários simultâneos
- 1000+ eventos criados por hora
- 100+ transações financeiras simultâneas
- Database connections <50
- Response time <1s para 95% requests
- No memory leaks após 2h
```

#### 5.3 Mobile Performance (P03)
```typescript
// Métricas obrigatórias:
- Touch response <100ms
- Scroll performance 60fps
- Battery efficiency <5% por hora
- Network usage <1MB por sessão
- Offline functionality completa
```

#### 5.4 Acessibilidade WCAG (P04)
```typescript
// Validações obrigatórias:
- Navegação 100% por teclado
- Screen reader compatibility (NVDA, JAWS)
- Color contrast 4.5:1 mínimo
- Focus management correto
- Alt text 100% para imagens
- ARIA labels apropriadas
```

#### 5.5 Security Testing (P05)
```typescript
// Validações obrigatórias:
- XSS prevention em todos os inputs
- CSRF protection em formulários
- SQL injection prevention
- Authorization bypass attempts
- Data encryption em repouso
- Secure headers implementados
```

**Evidências Esperadas**:
- Dashboard <2s com 1000 eventos
- 100+ usuários simultâneos suportados
- Mobile 60fps e <100ms response
- WCAG 2.1 AA compliance
- Security scan sem vulnerabilidades críticas

### Fase 6: Mocks e Isolamento (S01-S04)

**Objetivo**: Criar infraestrutura de testes robusta

#### 6.1 Firebase Mocks (S01)
```typescript
// Mocks obrigatórios:
- Firestore completo com todas as operações
- Auth com todos os fluxos (login, logout, reset)
- Real-time database para listeners
- Storage para upload/download
- Functions para server-side logic
- Performance dos mocks <10ms
```

#### 6.2 Fixtures Reprodutíveis (S02)
```typescript
// Fixtures obrigatórias:
- 100 clientes realistas com CPF válido
- 500 eventos distribuídos em 6 meses
- 50 barcos com capacidades variadas
- 1000 transações financeiras
- 20 usuários com diferentes roles
- Dados consistentes entre execuções
```

#### 6.3 Helpers de Dados (S03)
```typescript
// Helpers obrigatórios:
- Geração de CPF válido
- Criação de eventos realistas
- Cálculo de datas e períodos
- Geração de transações financeiras
- Mock de network instável
- Controle de tempo para testes determinísticos
```

#### 6.4 Isolamento Total (S04)
```typescript
// Isolamento obrigatório:
- Cada teste com database própria
- Cleanup automático após cada teste
- Zero estado compartilhado
- Paralelização 100% segura
- Determinismo 100% dos resultados
```

**Evidências Esperadas**:
- 100% coverage sem Firebase real
- Fixtures consistentes entre execuções
- Helpers automatizados para dados
- 0% interferência entre testes
- Suite completa executando em paralelo

## Estrutura de Diretórios Final

```
tests/
├── unit/
│   ├── viewmodels/
│   │   ├── useDashboardViewModel.spec.ts
│   │   ├── useCreateEventViewModel.spec.ts
│   │   ├── useFinanceViewModel.spec.ts
│   │   └── ...
│   ├── services/
│   │   ├── CommissionService.spec.ts
│   │   ├── CompanyDataService.spec.ts
│   │   └── ...
│   ├── repositories/
│   │   ├── ClientRepository.spec.ts
│   │   ├── EventRepository.spec.ts
│   │   └── ...
│   └── components/
│       ├── Button.spec.tsx
│       ├── Modal.spec.tsx
│       └── ...
├── integration/
│   ├── firebase/
│   │   ├── firestore.spec.ts
│   │   ├── auth.spec.ts
│   │   └── security-rules.spec.ts
│   ├── api/
│   │   ├── endpoints.spec.ts
│   │   └── middleware.spec.ts
│   └── components/
│       ├── context-integration.spec.tsx
│       └── state-management.spec.tsx
├── e2e/
│   ├── functional/
│   │   ├── client-management.spec.ts
│   │   ├── boat-management.spec.ts
│   │   ├── financial-flow.spec.ts
│   │   └── ...
│   ├── security/
│   │   ├── authorization.spec.ts
│   │   ├── input-validation.spec.ts
│   │   └── data-protection.spec.ts
│   └── performance/
│       ├── dashboard-load.spec.ts
│       ├── query-performance.spec.ts
│       └── mobile-performance.spec.ts
├── accessibility/
│   ├── keyboard-navigation.spec.ts
│   ├── screen-reader.spec.ts
│   └── visual-accessibility.spec.ts
├── fixtures/
│   ├── users.json
│   ├── events.json
│   ├── clients.json
│   ├── financial-data.json
│   └── boats.json
├── mocks/
│   ├── firebase.mock.ts
│   ├── repositories.mock.ts
│   └── network.mock.ts
├── helpers/
│   ├── test-utils.ts
│   ├── data-generators.ts
│   └── assertion-helpers.ts
├── setup.ts
├── teardown.ts
└── global.d.ts
```

## Ferramentas e Configuração

### Dependências de Desenvolvimento
```json
{
  "vitest": "^4.0.18",
  "@vitest/ui": "^4.0.18",
  "@testing-library/react": "^14.0.0",
  "@testing-library/jest-dom": "^6.0.0",
  "@testing-library/user-event": "^14.0.0",
  "msw": "^1.3.0",
  "firebase-mock": "^2.0.0",
  "axe-core": "^4.8.0",
  "@axe-core/playwright": "^4.8.0"
}
```

### Configuração do Vitest
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*'
      ],
      thresholds: {
        global: {
          branches: 85,
          functions: 95,
          lines: 90,
          statements: 90
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests')
    }
  }
})
```

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Run integration tests
      run: npm run test:integration
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
```

## KPIs e Monitoramento

### Métricas de Qualidade
- **Coverage Trend**: Gráfico de cobertura ao longo do tempo
- **Test Performance**: Tempo de execução da suite
- **Flakiness Rate**: Taxa de falhas intermitentes
- **Bug Detection**: Bugs encontrados por testes vs produção

### Dashboards
- **Coverage Dashboard**: Cobertura por módulo
- **Performance Dashboard**: Tempo de execução
- **Quality Dashboard**: Métricas de qualidade
- **Trend Analysis**: Evolução das métricas

### Alertas
- **Coverage Drop**: Alerta se cobertura cair < 85%
- **Performance Regression**: Alerta se tempo > 30% baseline
- **Flaky Tests**: Alerta se taxa > 5%
- **Critical Failures**: Alerta imediato para falhas críticas

## Manutenção e Evolução

### Revisões Semanais
- Análise de cobertura
- Revisão de testes flaky
- Otimização de performance
- Atualização de dependências

### Revisões Mensais
- Análise de tendências
- Planejamento de novos testes
- Refatoração de testes
- Treinamento da equipe

### Revisões Trimestrais
- Avaliação estratégica
- Atualização de ferramentas
- Revisão de métricas
- Planejamento de melhorias

## Critérios de Aceite

### Critérios Técnicos
- [ ] 90%+ cobertura de código
- [ ] 85%+ cobertura de branch
- [ ] 95%+ cobertura de função
- [ ] Suite completa em ≤ 5 minutos
- [ ] 0% de testes flaky
- [ ] 100% de isolamento entre testes

### Critérios de Qualidade
- [ ] Todos os fluxos críticos testados
- [ ] Todos os edge cases cobertos
- [ ] Documentação completa dos testes
- [ ] Padrões consistentes
- [ ] Code review aprovado
- [ ] Performance validada

### Critérios de Processo
- [ ] CI/CD funcional
- [ ] Automação completa
- [ ] Monitoramento ativo
- [ ] Equipe treinada
- [ ] Documentação atualizada
- [ ] Processo de melhoria contínua

## Conclusão

Este roadmap estabelece uma base sólida para qualidade de software no ERP Speedboat Tour. A implementação faseada garante entregas incrementais enquanto mantém o foco na qualidade e na manutenibilidade a longo prazo.

O sucesso desta iniciativa depende do comprometimento da equipe com as melhores práticas de teste e da cultura de qualidade em todo o ciclo de desenvolvimento.
