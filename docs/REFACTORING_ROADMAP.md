# ROADMAP DE REFACTORAÇÃO - ERP SPEEDBOAT TOUR

## VISÃO GERAL

Este documento apresenta um plano detalhado para refatoração completa do projeto ERP Speedboat Tour, abordando todos os problemas críticos identificados na code review. O roadmap está organizado por fases e prioridades para garantir uma migração segura e estruturada.

**Duração Estimada Total:** 2-3 meses
**Investimento:** 400-500 horas de desenvolvimento sênior
**Risco:** Médio-Alto (requer planejamento cuidadoso)

---

## FASE 0: PREPARAÇÃO E INFRAESTRUTURA (Semana 1)

### OBJETIVO
Preparar o ambiente e ferramentas para suportar a refatoração sem quebrar o funcionamento atual.

### TAREFAS

#### 0.1 Setup de Ambiente de Desenvolvimento
- [ ] Criar branch `refactoring/main` a partir da main
- [ ] Configurar ambiente de staging separado
- [ ] Implementar pipeline de CI/CD para validações automáticas
- [ ] Configurar testes E2E como regressão

#### 0.2 Ferramentas de Qualidade
- [ ] Configurar ESLint com regras estritas
- [ ] Implementar SonarQube para análise estática
- [ ] Configurar Husky para pre-commit hooks
- [ ] Implementar test coverage mínimo (70%)

#### 0.3 Documentação de Referência
- [ ] Documentar arquitetura atual (as-is)
- [ ] Mapear todas as dependências e acoplamentos
- [ ] Criar diagrama de fluxo de dados atual
- [ ] Documentar regras de negócio existentes

### CRITÉRIOS DE SUCESSO
- Ambiente de desenvolvimento estável
- Pipeline de CI funcionando
- Testes de regressão executando
- Documentação completa do estado atual

---

## FASE 1: CORREÇÕES CRÍTICAS - SEGURANÇA E ESTABILIDADE (Semanas 2-4)

### OBJETIVO
Resolver problemas críticos que podem causar falhas em produção ou riscos de segurança.

### 1.1 IMPLEMENTAÇÃO DE SISTEMA DE LOGGING (Semana 2)

#### PROBLEMAS ENDEREÇADOS
- Console.log em produção
- Logs expostos com informações sensíveis
- Ausência de estrutura para debugging

#### IMPLEMENTAÇÃO
```typescript
// Criar src/core/common/Logger.ts
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private logs: LogEntry[] = [];
  
  // Implementação completa com levels, persistência e sanitização
}
```

#### TAREFAS
- [ ] Criar classe Logger centralizada
- [ ] Implementar níveis de log configuráveis
- [ ] Adicionar sanitização de dados sensíveis
- [ ] Implementar persistência local para debugging
- [ ] Substituir TODOS os console.log/error/warn
- [ ] Configurar log level por ambiente

#### VALIDAÇÃO
- [ ] Nenhum console.log remanescente no código
- [ ] Logs funcionando em todos os níveis
- [ ] Dados sensíveis mascarados
- [ ] Performance impact < 1%

### 1.2 REFACTORAÇÃO DO AUTHCONTEXT - PARTE 1 (Semana 2-3)

#### PROBLEMAS ENDEREÇADOS
- God Class com 586 linhas
- Múltiplas responsabilidades
- Lógica de negócio no Context

#### ESTRATÉGIA DE DIVISÃO
```typescript
// Estrutura futura:
src/viewmodels/auth/
├── AuthViewModel.ts          (Autenticação pura)
├── UserManagementViewModel.ts  (Gestão de usuários)
├── GoogleSyncViewModel.ts     (Integração Google)
├── PasswordResetViewModel.ts  (Reset de senha)
└── index.ts                  (Exports unificados)
```

#### TAREFAS
- [ ] Criar interfaces para cada ViewModel
- [ ] Migrar lógica de autenticação pura para AuthViewModel
- [ ] Migrar gestão de usuários para UserManagementViewModel
- [ ] Migrar Google Sync para GoogleSyncViewModel
- [ ] Migrar password reset para PasswordResetViewModel
- [ ] Criar testes unitários para cada ViewModel
- [ ] Atualizar AuthContext para usar os ViewModels

#### VALIDAÇÃO
- [ ] AuthContext com < 100 linhas
- [ ] Cada ViewModel com responsabilidade única
- [ ] Testes unitários com > 80% coverage
- [ ] Funcionalidades existentes intactas

### 1.3 TYPE SAFETY - ELIMINAÇÃO DE 'ANY' (Semana 3-4)

#### PROBLEMAS ENDEREÇADOS
- Uso extensivo de 'any'
- Perda de type safety
- Erros em runtime não detectados

#### ESTRATÉGIA
```typescript
// Criar src/core/common/Types.ts
export interface BaseEntity {
  id: string;
  createdAt: number;
  updatedAt: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}
```

#### TAREFAS
- [ ] Mapear todos os usos de 'any' no projeto
- [ ] Criar tipos específicos para cada domínio
- [ ] Implementar tipos genéricos reutilizáveis
- [ ] Substituir 'any' por tipos específicos
- [ ] Configurar ESLint para proibir 'any'
- [ ] Adicionar validações de tipo em runtime

#### VALIDAÇÃO
- [ ] Zero usos de 'any' no código
- [ ] TypeScript strict mode ativado
- [ ] Build sem erros de tipo
- [ ] Autocompletação funcionando

### 1.4 VALIDAÇÕES SERVER-SIDE (Semana 4)

#### PROBLEMAS ENDEREÇADOS
- Validações apenas client-side
- Risco de segurança
- Bypass possível de regras

#### IMPLEMENTAÇÃO
```typescript
// Firebase Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Validações de senha, email, etc.
    match /profiles/{userId} {
      allow create, update: if 
        request.auth != null &&
        request.auth.uid == userId &&
        request.resource.data.email.matches('^[^@]+@[^@]+\.[^@]+$') &&
        request.resource.data.name.size() > 2;
    }
  }
}
```

#### TAREFAS
- [ ] Implementar regras de segurança no Firestore
- [ ] Adicionar validações de dados no backend
- [ ] Implementar rate limiting
- [ ] Adicionar logging de tentativas inválidas
- [ ] Testar bypass de validações client-side

#### VALIDAÇÃO
- [ ] Todas as validações têm contraparte server-side
- [ ] Testes de segurança passando
- [ ] Rate limiting funcionando
- [ ] Logs de segurança ativos

---

## FASE 2: ARQUITETURA MVVM - FUNDAÇÃO (Semanas 5-8)

### OBJETIVO
Implementar corretamente o padrão MVVM em todo o projeto.

### 2.1 BASE VIEWMODEL E INFRAESTRUTURA (Semana 5)

#### IMPLEMENTAÇÃO
```typescript
// src/core/viewmodels/BaseViewModel.ts
export abstract class BaseViewModel {
  protected _isLoading = false;
  protected _error: string | null = null;
  protected _listeners: (() => void)[] = [];

  get isLoading(): boolean { return this._isLoading; }
  get error(): string | null { return this._error; }

  protected setLoading(loading: boolean): void {
    this._isLoading = loading;
    this.notifyListeners();
  }

  protected setError(error: string | null): void {
    this._error = error;
    this.notifyListeners();
  }

  protected notifyListeners(): void {
    this._listeners.forEach(listener => listener());
  }

  subscribe(listener: () => void): () => void {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter(l => l !== listener);
    };
  }

  abstract dispose(): void;
}
```

#### TAREFAS
- [ ] Criar BaseViewModel abstrato
- [ ] Implementar hook useViewModel para React
- [ ] Criar interfaces padrão para ViewModels
- [ ] Implementar padrão de notificação reativa
- [ ] Adicionar testes para BaseViewModel

### 2.2 REFACTORAÇÃO DE REPOSITÓRIOS (Semana 5-6)

#### PROBLEMAS ENDEREÇADOS
- Repositórios com estado
- Violação de princípios
- Acoplamento com UI

#### NOVA ESTRUTURA
```typescript
// src/core/repositories/BaseRepository.ts
export abstract class BaseRepository<T extends BaseEntity> {
  protected abstract collectionName: string;
  
  abstract getAll(params?: PaginationParams): Promise<T[]>;
  abstract getById(id: string): Promise<T | null>;
  abstract create(data: Omit<T, 'id'>): Promise<T>;
  abstract update(id: string, data: Partial<T>): Promise<T>;
  abstract delete(id: string): Promise<void>;
  
  // Sem estado local, sem listeners, puramente funcional
}
```

#### TAREFAS
- [ ] Criar BaseRepository abstrato
- [ ] Refatorar ProductRepository para ser stateless
- [ ] Refatorar todos os outros repositórios
- [ ] Remover estado local dos repositórios
- [ ] Mover lógica de cache para serviço separado
- [ ] Implementar injeção de dependências

### 2.3 MIGRAÇÃO DE VIEWMODELS EXISTENTES (Semana 6-8)

#### VIEWMODELS A MIGRAR
- [ ] useDashboardViewModel → DashboardViewModel
- [ ] useCreateEventViewModel → CreateEventViewModel
- [ ] useClientHistoryViewModel → ClientHistoryViewModel
- [ ] useFinanceViewModel → FinanceViewModel
- [ ] Todos os outros ViewModels

#### ESTRATÉGIA DE MIGRAÇÃO
1. Criar nova classe ViewModel estendendo BaseViewModel
2. Mover lógica do hook para a classe
3. Adaptar hook para usar a classe
4. Migrar componente para usar novo padrão
5. Remover hook antigo
6. Testar funcionalidade

#### TAREFAS
- [ ] Migrar DashboardViewModel
- [ ] Migrar CreateEventViewModel (mais complexo)
- [ ] Migrar ViewModels de gestão
- [ ] Migrar ViewModels financeiros
- [ ] Atualizar todos os componentes para usar novos ViewModels
- [ ] Remover hooks antigos

### 2.4 SEPARAÇÃO DE COMPONENTES UI (Semana 7-8)

#### PROBLEMAS ENDEREÇADOS
- Componentes com lógica de negócio
- Componentes monolíticos
- Dificuldade de reutilização

#### ESTRATÉGIA
```typescript
// Estrutura futura:
src/ui/components/
├── common/           (Componentes reutilizáveis)
├── forms/           (Componentes de formulário)
├── layout/          (Componentes de layout)
└── features/        (Componentes específicos)

src/ui/screens/
├── Dashboard/
│   ├── DashboardScreen.tsx      (Apenas orquestração)
│   ├── components/             (Componentes específicos)
│   └── DashboardViewModel.ts    (Lógica)
```

#### TAREFAS
- [ ] Extrair StatCard para componente separado
- [ ] Extrair QuickAccessButton para componente separado
- [ ] Extrair EventListItem para componente separado
- [ ] Extrair NotificationCard para componente separado
- [ ] Refatorar DashboardScreen para ser apenas orquestração
- [ ] Aplicar mesmo padrão para outras telas

---

## FASE 3: TRATAMENTO DE ERROS E PERFORMANCE (Semanas 9-10)

### OBJETIVO
Implementar tratamento de erros consistente e otimizar performance.

### 3.1 SISTEMA CENTRALIZADO DE ERROS (Semana 9)

#### IMPLEMENTAÇÃO
```typescript
// src/core/common/ErrorHandler.ts
export interface ErrorContext {
  action: string;
  resource: string;
  userId?: string;
  additionalData?: Record<string, any>;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  
  handleError(error: Error, context: ErrorContext): AppError {
    const appError = this.createAppError(error, context);
    this.logError(appError);
    this.notifyUser(appError);
    return appError;
  }
  
  private createAppError(error: Error, context: ErrorContext): AppError {
    // Lógica de categorização e padronização
  }
}
```

#### TAREFAS
- [ ] Criar ErrorHandler centralizado
- [ ] Definir categorias de erro padrão
- [ ] Implementar mensagens amigáveis
- [ ] Integrar com sistema de logging
- [ ] Substituir todos os try/catch manuais
- [ ] Implementar Error Boundaries

### 3.2 OTIMIZAÇÃO DE PERFORMANCE (Semana 10)

#### ESTRATÉGIAS
```typescript
// src/core/performance/PerformanceOptimizer.ts
export class PerformanceOptimizer {
  // Memoização
  static memoize<T extends (...args: any[]) => any>(
    fn: T,
    keyGenerator?: (...args: Parameters<T>) => string
  ): T {
    // Implementação
  }
  
  // Debounce
  static debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
  ): T {
    // Implementação
  }
  
  // Throttle
  static throttle<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
  ): T {
    // Implementação
  }
}
```

#### TAREFAS
- [ ] Implementar memoização para cálculos pesados
- [ ] Adicionar debounce para operações de busca
- [ ] Implementar throttle para eventos frequentes
- [ ] Otimizar re-renders com React.memo
- [ ] Implementar virtual scrolling para listas longas
- [ ] Adicionar monitoramento de performance

---

## FASE 4: INTERNACIONALIZAÇÃO E EXPERIÊNCIA DO USUÁRIO (Semanas 11-12)

### OBJETIVO
Completar internacionalização e melhorar UX.

### 4.1 INTERNACIONALIZAÇÃO COMPLETA (Semana 11)

#### TAREFAS
- [ ] Mapear todos os textos hardcoded
- [ ] Completar traduções para pt-BR
- [ ] Implementar traduções en-US
- [ ] Implementar traduções es-ES
- [ ] Adicionar suporte a formatação de datas/moedas
- [ ] Implementar seletor de idioma persistente

### 4.2 MELHORIAS DE UX (Semana 12)

#### TAREFAS
- [ ] Implementar loading states consistentes
- [ ] Adicionar skeletons para melhor feedback
- [ ] Implementar toast notifications melhoradas
- [ ] Adicionar feedback visual para todas as ações
- [ ] Implementar atalhos de teclado
- [ ] Melhorar acessibilidade (ARIA labels)

---

## FASE 5: TESTES E DOCUMENTAÇÃO (Semanas 13-14)

### OBJETIVO
Garantir qualidade e documentação completas.

### 5.1 SUÍTE DE TESTES COMPLETA (Semana 13)

#### ESTRATÉGIA
```typescript
// Estrutura de testes:
tests/
├── unit/              (Testes unitários)
│   ├── viewmodels/
│   ├── repositories/
│   └── utils/
├── integration/       (Testes de integração)
│   ├── auth/
│   └── events/
├── e2e/             (Testes E2E já existentes)
└── fixtures/        (Dados de teste)
```

#### TAREFAS
- [ ] Implementar testes unitários para todos os ViewModels
- [ ] Implementar testes para repositórios
- [ ] Implementar testes de integração para fluxos críticos
- [ ] Configurar test coverage mínimo de 80%
- [ ] Implementar testes de regressão automáticos
- [ ] Configurar relatórios de cobertura

### 5.2 DOCUMENTAÇÃO COMPLETA (Semana 14)

#### TAREFAS
- [ ] Documentar nova arquitetura MVVM
- [ ] Criar guias de desenvolvimento
- [ ] Documentar todas as APIs internas
- [ ] Criar diagramas de arquitetura atualizados
- [ ] Documentar processo de deploy
- [ ] Criar guia de troubleshooting

---

## FASE 6: MIGRAÇÃO E ESTABILIZAÇÃO (Semana 15-16)

### OBJETIVO
Migrar para nova arquitetura e estabilizar.

### 6.1 MIGRAÇÃO CONTROLADA

#### ESTRATÉGIA
1. Feature flags para funcionalidades refatoradas
2. Migração gradual por módulo
3. Monitoramento intensivo
4. Rollback plan pronto

#### TAREFAS
- [ ] Implementar feature flags
- [ ] Migrar módulo por módulo
- [ ] Monitorar métricas de performance
- [ ] Coletar feedback dos usuários
- [ ] Ajustar based no feedback

### 6.2 ESTABILIZAÇÃO FINAL

#### TAREFAS
- [ ] Remover código legado
- [ ] Limpar dependências não utilizadas
- [ ] Otimizar bundle size
- [ ] Configurar monitoramento em produção
- [ ] Documentar lições aprendidas

---

## MÉTRICAS DE SUCESSO

### MÉTRICAS TÉCNICAS
- [ ] Type Safety: 95%+ (sem 'any')
- [ ] Test Coverage: 80%+
- [ ] Build Time: < 30 segundos
- [ ] Bundle Size: Redução de 20%
- [ ] Performance: Lighthouse score > 90

### MÉTRICAS DE QUALIDADE
- [ ] Zero violações de ESLint
- [ ] Zero warnings de TypeScript
- [ ] SonarQube Quality Gate: Pass
- [ ] Zero bugs críticos em produção

### MÉTRICAS DE DESENVOLVIMENTO
- [ ] Tempo de onboarding: < 2 dias
- [ ] Tempo de feature: Redução de 40%
- [ ] Bug fix time: Redução de 60%
- [ ] Code review time: Redução de 50%

---

## RISCOS E MITIGAÇÃO

### RISCOS CRÍTICOS
1. **Quebra de funcionalidades existentes**
   - Mitigação: Testes de regressão automatizados
   - Rollback plan detalhado

2. **Resistência da equipe**
   - Mitigação: Treinamento e documentação
   - Migração gradual

3. **Estouro de prazo**
   - Mitigação: MVP approach
   - Priorização de críticos

### RISCOS MÉDIOS
1. **Performance degradation**
   - Mitigação: Monitoramento contínuo
   - Testes de负载

2. **Complexidade excessiva**
   - Mitigação: Code reviews rigorosos
   - Simplificação contínua

---

## RECURSOS NECESSÁRIOS

### HUMANOS
- 1 Desenvolvedor Sênior (full-time)
- 1 Desenvolvedor Pleno (part-time, weeks 5-12)
- 1 QA Engineer (part-time, weeks 13-16)
- 1 Tech Lead (consultoria, semanas 1, 8, 16)

### TECNOLÓGICOS
- Ambiente de staging dedicado
- Ferramentas de análise estática
- Serviços de monitoramento
- Licenças de ferramentas de teste

### TEMPO
- 16 semanas totais
- 400-500 horas de desenvolvimento
- 80-100 horas de teste e documentação

---

## CONCLUSÃO

Este roadmap representa uma transformação completa do projeto, abordando todas as dívidas técnicas identificadas. A abordagem por fases garante que o projeto continue funcionando durante a refatoração, enquanto a métrica de sucesso clara permite acompanhar o progresso.

O resultado final será uma aplicação robusta, escalável, testável e preparada para crescimento futuro, seguindo as melhores práticas da indústria e os padrões arquiteturais definidos.
