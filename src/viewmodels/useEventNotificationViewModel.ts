import { useState, useCallback } from 'react'

// Mock do ViewModel para testes
export const useEventNotificationViewModel = () => {
  const [loading, setLoading] = useState(false)
  const [upcomingEvents] = useState([])
  const [notifications] = useState([])
  const [preferences] = useState({})

  const sendNotification = useCallback(async (_clientId: string, _message: string, _type: 'email' | 'sms' | 'whatsapp') => {
    setLoading(true)
    try {
      // Mock de envio
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true, notificationId: `notif-${Date.now()}` }
    } catch (error) {
      return { success: false, error: 'Failed to send notification' }
    } finally {
      setLoading(false)
    }
  }, [])

  const scheduleNotifications = useCallback(async (events: any[]) => {
    setLoading(true)
    try {
      // Mock de agendamento
      await new Promise(resolve => setTimeout(resolve, 1000))
      return { success: true, scheduled: events.length }
    } catch (error) {
      return { success: false, error: 'Failed to schedule notifications' }
    } finally {
      setLoading(false)
    }
  }, [])

  const getNotificationHistory = useCallback(async (_filters?: any) => {
    setLoading(true)
    try {
      // Mock de histórico
      await new Promise(resolve => setTimeout(resolve, 300))
      return { success: true, history: [] }
    } catch (error) {
      return { success: false, error: 'Failed to get history' }
    } finally {
      setLoading(false)
    }
  }, [])

  const updatePreferences = useCallback(async (_clientId: string, _prefs: any) => {
    setLoading(true)
    try {
      // Mock de atualização
      await new Promise(resolve => setTimeout(resolve, 200))
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to update preferences' }
    } finally {
      setLoading(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      // Mock de refresh
      await new Promise(resolve => setTimeout(resolve, 500))
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    upcomingEvents,
    notifications,
    preferences,
    sendNotification,
    scheduleNotifications,
    getNotificationHistory,
    updatePreferences,
    refresh
  }
}
