import { useState, useCallback } from 'react'

// Mock do ViewModel para testes
export const useToastState = () => {
  const [toasts, setToasts] = useState<any[]>([])
  const [activeToasts, setActiveToasts] = useState(new Set())
  const [toastQueue, setToastQueue] = useState<any[]>([])
  const [maxToasts] = useState(5)
  const [defaultDuration] = useState(5000)
  const [defaultPosition] = useState('top-right')
  const [nextId, setNextId] = useState(1)

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', options?: any) => {
    const toast = {
      id: `toast-${nextId}`,
      message,
      type,
      duration: options?.duration || defaultDuration,
      position: options?.position || defaultPosition,
      persistent: options?.persistent || false,
      action: options?.action,
      timestamp: Date.now(),
      isVisible: false
    }

    setNextId(prev => prev + 1)

    if (activeToasts.size >= maxToasts) {
      // Adicionar à fila
      setToastQueue(prev => [...prev, toast])
      return toast.id
    }

    // Adicionar diretamente
    setToasts(prev => [...prev, toast])
    setActiveToasts(prev => new Set([...prev, toast.id]))

    // Auto-dismiss se não for persistente
    if (!toast.persistent) {
      setTimeout(() => {
        hideToast(toast.id)
      }, toast.duration)
    }

    return toast.id
  }, [nextId, activeToasts.size, maxToasts, defaultDuration, defaultPosition])

  const hideToast = useCallback((toastId: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== toastId))
    setActiveToasts(prev => {
      const newSet = new Set(prev)
      newSet.delete(toastId)
      return newSet
    })

    // Processar fila se houver toasts pendentes
    setToastQueue(prev => {
      if (prev.length > 0) {
        const nextToast = prev[0]
        setToasts(currentToasts => [...currentToasts, nextToast])
        setActiveToasts(currentActive => new Set([...currentActive, nextToast.id]))
        
        // Auto-dismiss para o próximo toast
        if (!nextToast.persistent) {
          setTimeout(() => {
            hideToast(nextToast.id)
          }, nextToast.duration)
        }
        
        return prev.slice(1)
      }
      return prev
    })
  }, [])

  const updateToast = useCallback((toastId: string, updates: any) => {
    setToasts(prev => prev.map(toast => 
      toast.id === toastId 
        ? { ...toast, ...updates, updatedAt: Date.now() }
        : toast
    ))
  }, [])

  const clearAll = useCallback(() => {
    setToasts([])
    setActiveToasts(new Set())
    setToastQueue([])
  }, [])

  const clearByType = useCallback((type: string) => {
    setToasts(prev => prev.filter(toast => {
      if (toast.type === type) {
        setActiveToasts(currentActive => {
          const newSet = new Set(currentActive)
          newSet.delete(toast.id)
          return newSet
        })
        return false
      }
      return true
    }))
  }, [])

  const getToastsByPosition = useCallback((position: string) => {
    return toasts.filter(toast => toast.position === position)
  }, [toasts])

  const getActiveToastsCount = useCallback(() => {
    return activeToasts.size
  }, [activeToasts])

  const isToastActive = useCallback((toastId: string) => {
    return activeToasts.has(toastId)
  }, [activeToasts])

  const executeToastAction = useCallback((toastId: string) => {
    const toast = toasts.find(t => t.id === toastId)
    if (toast && toast.action) {
      toast.action.onClick()
      return true
    }
    return false
  }, [toasts])

  const removeToastAction = useCallback((toastId: string) => {
    updateToast(toastId, { action: null })
  }, [updateToast])

  const getToastQueueCount = useCallback(() => {
    return toastQueue.length
  }, [toastQueue])

  return {
    toasts,
    activeToasts,
    toastQueue,
    maxToasts,
    defaultDuration,
    actions: {
      showToast,
      hideToast,
      updateToast,
      clearAll,
      clearByType,
      executeToastAction,
      removeToastAction
    },
    helpers: {
      getToastsByPosition,
      getActiveToastsCount,
      isToastActive,
      getToastQueueCount
    }
  }
}
