import { useState, useCallback } from 'react'

type UserState = Record<string, unknown> | null
type NotificationState = {
  id: string
  timestamp: Date
  read: boolean
} & Record<string, unknown>
type ModalState = Record<string, boolean>
type ModalDataState = Record<string, unknown>

const getCurrentTimestamp = () => Date.now()
const createNotificationId = () => `notif-${getCurrentTimestamp()}`

// Mock do ViewModel para testes
export const useGlobalState = () => {
  const [user, setUserState] = useState<UserState>(null)
  const [app, setAppState] = useState(() => ({
    loading: false,
    error: null as string | null,
    initialized: false,
    online: navigator.onLine,
    lastActivity: getCurrentTimestamp(),
    version: '1.0.0'
  }))
  const [data] = useState({
    events: [],
    clients: [],
    boats: [],
    expenses: [],
    lastSync: null as Date | null
  })
  const [ui, setUi] = useState<{
    sidebarOpen: boolean
    modals: ModalState
    notifications: NotificationState[]
    breadcrumbs: unknown[]
    modalData: ModalDataState
  }>({
    sidebarOpen: true,
    modals: {
      createEvent: false,
      editClient: false,
      confirmDelete: false
    },
    notifications: [],
    breadcrumbs: [],
    modalData: {}
  })

  const setUser = useCallback((userData: UserState) => {
    setUserState(userData)
  }, [])

  const logout = useCallback(() => {
    setUserState(null)
    setAppState(prev => ({ ...prev, initialized: false }))
  }, [])

  const setTheme = useCallback((theme: string) => {
    setAppState(prev => ({ ...prev, theme }))
  }, [])

  const addNotification = useCallback((notification: Record<string, unknown>) => {
    setUi(prev => ({
      ...prev,
      notifications: [
        {
          id: createNotificationId(),
          timestamp: new Date(),
          read: false,
          ...notification
        },
        ...prev.notifications
      ]
    }))
  }, [])

  const openModal = useCallback((modalId: string, modalData?: unknown) => {
    setUi(prev => ({
      ...prev,
      modals: { ...prev.modals, [modalId]: true },
      modalData: { ...prev.modalData, [modalId]: modalData }
    }))
  }, [])

  const closeModal = useCallback((modalId: string) => {
    setUi(prev => ({
      ...prev,
      modals: { ...prev.modals, [modalId]: false }
    }))
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    setAppState(prev => ({ ...prev, loading, lastActivity: getCurrentTimestamp() }))
  }, [])

  const setError = useCallback((error: string | null) => {
    setAppState(prev => ({ ...prev, error, loading: false, lastActivity: getCurrentTimestamp() }))
  }, [])

  const updateUserProfile = useCallback((updates: Record<string, unknown>) => {
    if (!user) return
    setUserState(prev => (prev ? { ...prev, ...updates } : prev))
  }, [user])

  const markNotificationAsRead = useCallback((notificationId: string) => {
    setUi(prev => ({
      ...prev,
      notifications: prev.notifications.map(notification =>
        notification.id === notificationId ? { ...notification, read: true } : notification
      )
    }))
  }, [])

  const clearNotifications = useCallback(() => {
    setUi(prev => ({ ...prev, notifications: [] }))
  }, [])

  const initialize = useCallback(() => {
    setAppState(prev => ({
      ...prev,
      initialized: true,
      loading: false,
      error: null
    }))
  }, [])

  const updateOnlineStatus = useCallback((online: boolean) => {
    setAppState(prev => ({ ...prev, online, lastActivity: getCurrentTimestamp() }))
  }, [])

  return {
    user,
    app,
    data,
    ui,
    actions: {
      setUser,
      logout,
      setTheme,
      addNotification,
      openModal,
      closeModal,
      setLoading,
      setError,
      updateUserProfile,
      markNotificationAsRead,
      clearNotifications,
      initialize,
      updateOnlineStatus
    },
    computed: {
      isAuthenticated: !!user,
      isOnline: app.online,
      unreadNotifications: ui.notifications.filter(notification => !notification.read).length,
      openModalsCount: Object.values(ui.modals).filter(Boolean).length
    }
  }
}
