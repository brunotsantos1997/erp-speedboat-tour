import { useState, useCallback } from 'react'

// Mock do ViewModel para testes
export const useGlobalState = () => {
  const [user, setUserState] = useState<any>(null)
  const [app, setAppState] = useState({
    loading: false,
    error: null as string | null,
    initialized: false,
    online: navigator.onLine,
    lastActivity: Date.now(),
    version: '1.0.0'
  })
  const [data] = useState({
    events: [],
    clients: [],
    boats: [],
    expenses: [],
    lastSync: null as Date | null
  })
  const [ui, setUi] = useState<any>({
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

  const setUser = useCallback((userData: any) => {
    setUserState(userData)
  }, [])

  const logout = useCallback(() => {
    setUserState(null)
    setAppState((prev: any) => ({ ...prev, initialized: false }))
  }, [])

  const setTheme = useCallback((theme: string) => {
    setAppState((prev: any) => ({ ...prev, theme }))
  }, [])

  const addNotification = useCallback((notification: any) => {
    setUi((prev: any) => ({
      ...prev,
      notifications: [
        {
          id: `notif-${Date.now()}`,
          timestamp: new Date(),
          read: false,
          ...notification
        },
        ...prev.notifications
      ]
    }))
  }, [])

  const openModal = useCallback((modalId: string, modalData?: any) => {
    setUi((prev: any) => ({
      ...prev,
      modals: { ...prev.modals, [modalId]: true },
      modalData: { ...prev.modalData, [modalId]: modalData }
    }))
  }, [])

  const closeModal = useCallback((modalId: string) => {
    setUi((prev: any) => ({
      ...prev,
      modals: { ...prev.modals, [modalId]: false }
    }))
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    setAppState((prev: any) => ({ ...prev, loading, lastActivity: Date.now() }))
  }, [])

  const setError = useCallback((error: string | null) => {
    setAppState((prev: any) => ({ ...prev, error, loading: false, lastActivity: Date.now() }))
  }, [])

  const updateUserProfile = useCallback((updates: any) => {
    if (!user) return
    setUserState((prev: any) => ({ ...prev, ...updates }))
  }, [user])

  const markNotificationAsRead = useCallback((notificationId: string) => {
    setUi((prev: any) => ({
      ...prev,
      notifications: prev.notifications.map((n: any) =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    }))
  }, [])

  const clearNotifications = useCallback(() => {
    setUi((prev: any) => ({ ...prev, notifications: [] }))
  }, [])

  const initialize = useCallback(() => {
    setAppState((prev: any) => ({
      ...prev,
      initialized: true,
      loading: false,
      error: null
    }))
  }, [])

  const updateOnlineStatus = useCallback((online: boolean) => {
    setAppState((prev: any) => ({ ...prev, online, lastActivity: Date.now() }))
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
      unreadNotifications: ui.notifications.filter((n: any) => !n.read).length,
      openModalsCount: Object.values(ui.modals).filter(Boolean).length
    }
  }
}
