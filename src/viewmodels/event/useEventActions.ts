import { useState, useCallback } from 'react'

// Mock do ViewModel para testes
export const useEventActions = () => {
  const [loading, setLoading] = useState(false)
  const [events, setEvents] = useState<any[]>([])
  const [selectedEvent] = useState<any>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const seedEvents = useCallback((nextEvents: any[]) => {
    setEvents(nextEvents)
  }, [])

  const createEvent = useCallback(async (eventData: any) => {
    setLoading(true)
    setIsCreating(true)
    try {
      await Promise.resolve()
      const newEvent = {
        id: `event-${Date.now()}`,
        ...eventData,
        status: 'PRE_SCHEDULED',
        preScheduledAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      setEvents(prev => [...prev, newEvent])
      return { success: true, event: newEvent }
    } catch (error) {
      return { success: false, error: 'Failed to create event' }
    } finally {
      setLoading(false)
      setIsCreating(false)
    }
  }, [])

  const updateEvent = useCallback(async (eventId: string, updates: any) => {
    setLoading(true)
    setIsEditing(true)
    try {
      await Promise.resolve()
      setEvents(prev => prev.map(event => 
        event.id === eventId ? { ...event, ...updates, updatedAt: Date.now() } : event
      ))
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to update event' }
    } finally {
      setLoading(false)
      setIsEditing(false)
    }
  }, [])

  const cancelEvent = useCallback(async (eventId: string, reason: string) => {
    setLoading(true)
    try {
      await Promise.resolve()
      setEvents(prev => prev.map(event => 
        event.id === eventId ? {
          ...event,
          status: 'CANCELLED',
          cancelReason: reason,
          cancelledAt: Date.now(),
          updatedAt: Date.now()
        } : event
      ))
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to cancel event' }
    } finally {
      setLoading(false)
    }
  }, [])

  const duplicateEvent = useCallback(async (eventId: string, newDate: string) => {
    setLoading(true)
    try {
      await Promise.resolve()
      const originalEvent = events.find((e: any) => e.id === eventId)
      if (!originalEvent) return { success: false, error: 'Event not found' }

      const duplicatedEvent = {
        ...originalEvent,
        id: `event-${Date.now()}`,
        date: newDate,
        status: 'PRE_SCHEDULED',
        preScheduledAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        originalEventId: eventId
      }

      setEvents(prev => [...prev, duplicatedEvent])
      return { success: true, event: duplicatedEvent }
    } catch (error) {
      return { success: false, error: 'Failed to duplicate event' }
    } finally {
      setLoading(false)
    }
  }, [events])

  const deleteEvent = useCallback(async (eventId: string) => {
    setLoading(true)
    try {
      await Promise.resolve()
      setEvents(prev => prev.filter(event => event.id !== eventId))
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to delete event' }
    } finally {
      setLoading(false)
    }
  }, [])

  const checkAvailability = useCallback((boatId: string, date: string, duration: number) => {
    const eventStart = new Date(date)
    const eventEnd = new Date(eventStart.getTime() + duration * 60 * 1000)

    const conflicts = events.filter((event: any) => {
      if (event.boatId !== boatId) return false

      const existingStart = new Date(event.date)
      const existingEnd = new Date(existingStart.getTime() + event.duration * 60 * 1000)

      return (
        (eventStart >= existingStart && eventStart < existingEnd) ||
        (eventEnd > existingStart && eventEnd <= existingEnd) ||
        (eventStart <= existingStart && eventEnd >= existingEnd)
      )
    })

    return {
      isAvailable: conflicts.length === 0,
      conflicts,
      alternativeTimes: []
    }
  }, [events])

  const calculatePrice = useCallback((tourTypeId: string, duration: number, passengerCount: number, discounts: any[] = []) => {
    const tourPrices: Record<string, number> = {
      'tour-1': 100,
      'tour-2': 150,
      'tour-3': 200
    }

    const hourlyRate = tourPrices[tourTypeId] || 100
    const basePrice = Math.round((hourlyRate * duration / 60) * 100) / 100
    const subtotal = basePrice * passengerCount

    let finalPrice = subtotal
    for (const discount of discounts) {
      if (discount.type === 'percentage') {
        finalPrice *= (1 - discount.value / 100)
      } else if (discount.type === 'fixed') {
        finalPrice -= discount.value
      }
    }

    finalPrice = Math.max(finalPrice, basePrice * 0.5)

    return {
      basePrice,
      hourlyRate,
      passengerCount,
      subtotal,
      discounts,
      finalPrice: Math.round(finalPrice * 100) / 100,
      totalDiscount: Math.round((subtotal - finalPrice) * 100) / 100
    }
  }, [])

  const validateEvent = useCallback((eventData: any) => {
    const errors: string[] = []

    if (!eventData.date || new Date(eventData.date) <= new Date()) {
      errors.push('Data do evento deve ser futura')
    }

    if (!eventData.tourTypeId) {
      errors.push('Tipo de tour é obrigatório')
    }

    if (!eventData.boatId) {
      errors.push('Barco é obrigatório')
    }

    if (!eventData.clientId) {
      errors.push('Cliente é obrigatório')
    }

    if (!eventData.duration || eventData.duration < 30) {
      errors.push('Duração deve ser de pelo menos 30 minutos')
    }

    setErrors(errors)
    return errors.length === 0
  }, [])

  const exportEvents = useCallback((format: 'csv' | 'json' = 'csv') => {
    if (format === 'csv') {
      const headers = ['ID', 'Data', 'Cliente', 'Tour', 'Status', 'Total']
      const csvRows = events.map((event: any) => [
        event.id,
        new Date(event.date).toLocaleDateString('pt-BR'),
        event.clientName || '',
        event.tourName || '',
        event.status,
        event.total || 0
      ])

      return [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n')
    }

    return JSON.stringify(events, null, 2)
  }, [events])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.resolve()
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    events,
    selectedEvent,
    isCreating,
    isEditing,
    errors,
    seedEvents,
    createEvent,
    updateEvent,
    cancelEvent,
    duplicateEvent,
    deleteEvent,
    checkAvailability,
    calculatePrice,
    validateEvent,
    exportEvents,
    refresh
  }
}
