import { beforeAll, afterEach, afterAll, vi } from 'vitest'

// Mock do Firebase para testes unitários
beforeAll(() => {
  // Configurar mocks globais para ambiente Node
  global.console = {
    ...console,
    // Silenciar logs específicos durante testes se necessário
  }

  // Mock de process.env para variáveis de teste
  process.env.NODE_ENV = 'test'
  process.env.VITE_FIREBASE_TEST_PROJECT_ID = 'erp-speedboat-test'
  process.env.VITE_TEST_MOCK_FIRESTORE = 'true'
})

// Limpeza após cada teste
afterEach(() => {
  // Limpar mocks se necessário
  vi.clearAllMocks()
})

afterAll(() => {
  // Cleanup final
})
