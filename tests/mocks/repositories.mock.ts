import { vi } from 'vitest'
import type { EventType, Payment, PaymentMethod, PaymentType, ClientProfile, Boat, BoardingLocation } from '../../src/core/domain/types'

// Mock data helpers
const createMockClient = (): ClientProfile => ({
  id: 'client-1',
  name: 'João Silva',
  phone: '11999999999',
  totalTrips: 5
})

const createMockBoat = (): Boat => ({
  id: 'boat-1',
  name: 'Speedboat Alpha',
  capacity: 10,
  size: 25,
  pricePerHour: 500,
  pricePerHalfHour: 300,
  organizationTimeMinutes: 15
})

const createMockBoardingLocation = (): BoardingLocation => ({
  id: 'location-1',
  name: 'Marina Central'
})

// Mock do EventRepository
export const mockEventRepository = {
  events: [] as EventType[],
  listeners: new Map(),

  subscribeToDateRange: vi.fn((startDate: string, endDate: string, callback: (events: EventType[]) => void) => {
    // Simular eventos mockados
    const mockEvents: EventType[] = [
      {
        id: 'event-1',
        date: '2024-04-06',
        startTime: '09:00',
        endTime: '11:00',
        status: 'SCHEDULED',
        paymentStatus: 'PENDING',
        boat: createMockBoat(),
        boardingLocation: createMockBoardingLocation(),
        client: createMockClient(),
        passengerCount: 4,
        subtotal: 500,
        total: 500,
        products: []
      },
      {
        id: 'event-2',
        date: '2024-04-07',
        startTime: '14:00',
        endTime: '16:00',
        status: 'COMPLETED',
        paymentStatus: 'CONFIRMED',
        boat: createMockBoat(),
        boardingLocation: createMockBoardingLocation(),
        client: createMockClient(),
        passengerCount: 6,
        subtotal: 800,
        total: 800,
        products: []
      }
    ]
    callback(mockEvents)
    
    return vi.fn(() => {
      // Mock unsubscribe
    })
  }),

  subscribeToNotifications: vi.fn((callback: (events: EventType[]) => void) => {
    const mockNotifications: EventType[] = [
      {
        id: 'event-3',
        date: '2024-04-05',
        startTime: '10:00',
        endTime: '12:00',
        status: 'CANCELLED',
        paymentStatus: 'PENDING',
        boat: createMockBoat(),
        boardingLocation: createMockBoardingLocation(),
        client: createMockClient(),
        passengerCount: 2,
        subtotal: 300,
        total: 300,
        products: []
      }
    ]
    callback(mockNotifications)
    
    return vi.fn(() => {
      // Mock unsubscribe
    })
  }),

  updateEvent: vi.fn(async (event: EventType) => {
    return { ...event }
  }),

  getById: vi.fn(async (id: string) => {
    return mockEventRepository.events.find(e => e.id === id) || null
  })
}

// Mock do PaymentRepository
export const mockPaymentRepository = {
  payments: [] as Payment[],

  subscribe: vi.fn((callback: (payments: Payment[]) => void) => {
    const mockPayments: Payment[] = [
      {
        id: 'payment-1',
        eventId: 'event-1',
        amount: 150,
        method: 'PIX' as PaymentMethod,
        type: 'DOWN_PAYMENT' as PaymentType,
        date: '2024-04-06',
        timestamp: Date.now()
      },
      {
        id: 'payment-2',
        eventId: 'event-2',
        amount: 800,
        method: 'CASH' as PaymentMethod,
        type: 'FULL' as PaymentType,
        date: '2024-04-07',
        timestamp: Date.now()
      }
    ]
    callback(mockPayments)
    
    return vi.fn(() => {
      // Mock unsubscribe
    })
  }),

  getByEventId: vi.fn(async (eventId: string) => {
    return mockPaymentRepository.payments.filter(p => p.eventId === eventId)
  }),

  add: vi.fn(async (payment: Omit<Payment, 'id'>) => {
    const newPayment: Payment = {
      ...payment,
      id: `payment-${Date.now()}`
    }
    mockPaymentRepository.payments.push(newPayment)
    return newPayment
  })
}

// Mock do useEventSync
export const mockUseEventSync = () => ({
  syncEvent: vi.fn(async (event: EventType) => {
    return event
  })
})

// Mock do useToast
export const mockUseToast = () => ({
  showToast: vi.fn()
})

// Mock do ClientRepository
export const mockClientRepository = {
  clients: [] as ClientProfile[],

  subscribe: vi.fn((callback: (clients: ClientProfile[]) => void) => {
    const mockClients: ClientProfile[] = [
      {
        id: 'client-1',
        name: 'João Silva',
        phone: '11999999999',
        totalTrips: 5
      },
      {
        id: 'client-2',
        name: 'Maria Santos',
        phone: '11888888888',
        totalTrips: 3
      }
    ]
    callback(mockClients)
    
    return vi.fn(() => {
      // Mock unsubscribe
    })
  }),

  getById: vi.fn(async (id: string) => {
    return mockClientRepository.clients.find(c => c.id === id) || null
  }),

  getByPhone: vi.fn(async (phone: string) => {
    return mockClientRepository.clients.find(c => c.phone === phone) || null
  }),

  add: vi.fn(async (client: Omit<ClientProfile, 'id'>) => {
    const newClient: ClientProfile = {
      ...client,
      id: `client-${Date.now()}`,
      totalTrips: 0
    }
    mockClientRepository.clients.push(newClient)
    return newClient
  }),

  update: vi.fn(async (id: string, data: Partial<ClientProfile>) => {
    const index = mockClientRepository.clients.findIndex(c => c.id === id)
    if (index >= 0) {
      mockClientRepository.clients[index] = { ...mockClientRepository.clients[index], ...data }
      return mockClientRepository.clients[index]
    }
    return null
  }),

  delete: vi.fn(async (id: string) => {
    const index = mockClientRepository.clients.findIndex(c => c.id === id)
    if (index >= 0) {
      mockClientRepository.clients.splice(index, 1)
      return true
    }
    return false
  })
}

// Mock do BoatRepository
export const mockBoatRepository = {
  boats: [] as Boat[],

  subscribe: vi.fn((callback: (boats: Boat[]) => void) => {
    const mockBoats: Boat[] = [
      {
        id: 'boat-1',
        name: 'Speedboat Alpha',
        capacity: 10,
        size: 25,
        pricePerHour: 500,
        pricePerHalfHour: 300,
        organizationTimeMinutes: 15
      },
      {
        id: 'boat-2',
        name: 'Lancha Beta',
        capacity: 8,
        size: 20,
        pricePerHour: 400,
        pricePerHalfHour: 250,
        organizationTimeMinutes: 10
      }
    ]
    callback(mockBoats)
    
    return vi.fn(() => {
      // Mock unsubscribe
    })
  }),

  getById: vi.fn(async (id: string) => {
    return mockBoatRepository.boats.find(b => b.id === id) || null
  }),

  getActive: vi.fn(async () => {
    return mockBoatRepository.boats.filter(b => !b.isArchived)
  }),

  getByCapacity: vi.fn(async (minCapacity: number) => {
    return mockBoatRepository.boats.filter(b => b.capacity >= minCapacity)
  }),

  add: vi.fn(async (boat: Omit<Boat, 'id'>) => {
    const newBoat: Boat = {
      ...boat,
      id: `boat-${Date.now()}`
    }
    mockBoatRepository.boats.push(newBoat)
    return newBoat
  }),

  update: vi.fn(async (id: string, data: Partial<Boat>) => {
    const index = mockBoatRepository.boats.findIndex(b => b.id === id)
    if (index >= 0) {
      mockBoatRepository.boats[index] = { ...mockBoatRepository.boats[index], ...data }
      return mockBoatRepository.boats[index]
    }
    return null
  }),

  toggleActive: vi.fn(async (id: string) => {
    const boat = mockBoatRepository.boats.find(b => b.id === id)
    if (boat) {
      boat.isArchived = !boat.isArchived
      return boat
    }
    return null
  })
}

// Mock do ExpenseRepository
export const mockExpenseRepository = {
  expenses: [] as any[],

  subscribe: vi.fn((callback: (expenses: any[]) => void) => {
    const mockExpenses = [
      {
        id: 'expense-1',
        description: 'Combustível',
        amount: 200,
        date: '2024-04-01',
        category: 'fuel',
        status: 'approved',
        createdBy: 'user-1'
      },
      {
        id: 'expense-2',
        description: 'Manutenção',
        amount: 500,
        date: '2024-04-02',
        category: 'maintenance',
        status: 'pending',
        createdBy: 'user-1'
      }
    ]
    callback(mockExpenses)
    
    return vi.fn(() => {
      // Mock unsubscribe
    })
  }),

  getByDateRange: vi.fn(async (startDate: string, endDate: string) => {
    return mockExpenseRepository.expenses.filter(e => 
      e.date >= startDate && e.date <= endDate
    )
  }),

  getByCategory: vi.fn(async (category: string) => {
    return mockExpenseRepository.expenses.filter(e => e.category === category)
  }),

  add: vi.fn(async (expense: Omit<any, 'id'>) => {
    const newExpense = {
      ...expense,
      id: `expense-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'pending'
    }
    mockExpenseRepository.expenses.push(newExpense)
    return newExpense
  }),

  approve: vi.fn(async (id: string) => {
    const expense = mockExpenseRepository.expenses.find(e => e.id === id)
    if (expense) {
      expense.status = 'approved'
      return expense
    }
    return null
  }),

  reject: vi.fn(async (id: string, reason: string) => {
    const expense = mockExpenseRepository.expenses.find(e => e.id === id)
    if (expense) {
      expense.status = 'rejected'
      expense.rejectionReason = reason
      return expense
    }
    return null
  })
}

// Mock do UserRepository
export const mockUserRepository = {
  users: [] as any[],

  subscribe: vi.fn((callback: (users: any[]) => void) => {
    const mockUsers = [
      {
        id: 'user-1',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'OWNER',
        isActive: true,
        createdAt: '2024-01-01'
      },
      {
        id: 'user-2',
        name: 'Guide User',
        email: 'guide@example.com',
        role: 'GUIDE',
        isActive: true,
        createdAt: '2024-01-02'
      }
    ]
    callback(mockUsers)
    
    return vi.fn(() => {
      // Mock unsubscribe
    })
  }),

  getByRole: vi.fn(async (role: string) => {
    return mockUserRepository.users.filter(u => u.role === role)
  }),

  getActive: vi.fn(async () => {
    return mockUserRepository.users.filter(u => u.isActive)
  }),

  add: vi.fn(async (user: Omit<any, 'id'>) => {
    const newUser = {
      ...user,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isActive: true
    }
    mockUserRepository.users.push(newUser)
    return newUser
  }),

  updateRole: vi.fn(async (id: string, role: string) => {
    const user = mockUserRepository.users.find(u => u.id === id)
    if (user) {
      user.role = role
      return user
    }
    return null
  }),

  toggleActive: vi.fn(async (id: string) => {
    const user = mockUserRepository.users.find(u => u.id === id)
    if (user) {
      user.isActive = !user.isActive
      return user
    }
    return null
  })
}

// Mock do ProductRepository
export const mockProductRepository = {
  products: [] as any[],

  subscribe: vi.fn((callback: (products: any[]) => void) => {
    const mockProducts = [
      {
        id: 'product-1',
        name: 'Passeio Completo',
        price: 500,
        duration: 120,
        description: 'Passeio completo pela costa',
        isActive: true,
        category: 'tour'
      },
      {
        id: 'product-2',
        name: 'Passeio Rápido',
        price: 300,
        duration: 60,
        description: 'Passeio rápido pela baía',
        isActive: true,
        category: 'tour'
      }
    ]
    callback(mockProducts)
    
    return vi.fn(() => {
      // Mock unsubscribe
    })
  }),

  getActive: vi.fn(async () => {
    return mockProductRepository.products.filter(p => p.isActive)
  }),

  getByCategory: vi.fn(async (category: string) => {
    return mockProductRepository.products.filter(p => p.category === category)
  }),

  add: vi.fn(async (product: Omit<any, 'id'>) => {
    const newProduct = {
      ...product,
      id: `product-${Date.now()}`,
      isActive: true,
      createdAt: new Date().toISOString()
    }
    mockProductRepository.products.push(newProduct)
    return newProduct
  }),

  update: vi.fn(async (id: string, data: Partial<any>) => {
    const index = mockProductRepository.products.findIndex(p => p.id === id)
    if (index >= 0) {
      mockProductRepository.products[index] = { ...mockProductRepository.products[index], ...data }
      return mockProductRepository.products[index]
    }
    return null
  }),

  toggleActive: vi.fn(async (id: string) => {
    const product = mockProductRepository.products.find(p => p.id === id)
    if (product) {
      product.isActive = !product.isActive
      return product
    }
    return null
  })
}
