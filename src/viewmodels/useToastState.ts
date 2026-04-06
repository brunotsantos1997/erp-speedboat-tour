import { useState, useCallback, useRef } from 'react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

type ToastAction = {
  onClick: () => void
}

type Toast = {
  id: string
  message: string
  type: ToastType
  duration: number
  position: string
  persistent: boolean
  action?: ToastAction | null
  timestamp: number
  isVisible: boolean
  updatedAt?: number
}

type ToastOptions = {
  duration?: number
  position?: string
  persistent?: boolean
  action?: ToastAction | null
}

// Mock do ViewModel para testes
export const useToastState = () => {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [activeToasts, setActiveToasts] = useState<Set<string>>(new Set())
  const [toastQueue, setToastQueue] = useState<Toast[]>([])
  const [maxToasts] = useState(5)
  const [defaultDuration] = useState(5000)
  const [defaultPosition] = useState('top-right')
  const toastsRef = useRef<Toast[]>([])
  const activeToastsRef = useRef<Set<string>>(new Set())
  const toastQueueRef = useRef<Toast[]>([])
  const nextIdRef = useRef(1)

  function hideToast(toastId: string) {
    const nextActiveToasts = new Set(activeToastsRef.current)
    nextActiveToasts.delete(toastId)

    const queuedToast = toastQueueRef.current[0] ?? null
    const remainingQueue = queuedToast ? toastQueueRef.current.slice(1) : []

    if (queuedToast) {
      nextActiveToasts.add(queuedToast.id)
    }

    const remainingToasts = toastsRef.current.filter(toast => toast.id !== toastId)
    const nextToasts = queuedToast ? [...remainingToasts, queuedToast] : remainingToasts

    toastsRef.current = nextToasts
    activeToastsRef.current = nextActiveToasts
    toastQueueRef.current = remainingQueue

    setToasts(nextToasts)
    setActiveToasts(new Set(nextActiveToasts))
    setToastQueue(remainingQueue)

    if (queuedToast && !queuedToast.persistent) {
      setTimeout(() => {
        hideToast(queuedToast.id)
      }, queuedToast.duration)
    }
  }

  const showToast = useCallback((message: string, type: ToastType = 'info', options?: ToastOptions) => {
    const toastId = `toast-${nextIdRef.current}`
    nextIdRef.current += 1

    const toast: Toast = {
      id: toastId,
      message,
      type,
      duration: options?.duration || defaultDuration,
      position: options?.position || defaultPosition,
      persistent: options?.persistent || false,
      action: options?.action,
      timestamp: Date.now(),
      isVisible: false
    }

    if (activeToastsRef.current.size >= maxToasts) {
      const nextQueue = [...toastQueueRef.current, toast]
      toastQueueRef.current = nextQueue
      setToastQueue(nextQueue)
      return toast.id
    }

    const nextActiveToasts = new Set(activeToastsRef.current)
    nextActiveToasts.add(toast.id)
    const nextToasts = [...toastsRef.current, toast]

    toastsRef.current = nextToasts
    activeToastsRef.current = nextActiveToasts

    setToasts(nextToasts)
    setActiveToasts(new Set(nextActiveToasts))

    if (!toast.persistent) {
      setTimeout(() => {
        hideToast(toast.id)
      }, toast.duration)
    }
    return toast.id
  }, [maxToasts, defaultDuration, defaultPosition, hideToast])

  const updateToast = useCallback((toastId: string, updates: Partial<Toast>) => {
    setToasts(prev => prev.map(toast =>
      toast.id === toastId
        ? { ...toast, ...updates, updatedAt: Date.now() }
        : toast
    ))
  }, [])

  const clearAll = useCallback(() => {
    toastsRef.current = []
    activeToastsRef.current = new Set()
    toastQueueRef.current = []
    setToasts([])
    setActiveToasts(new Set())
    setToastQueue([])
  }, [])

  const clearByType = useCallback((type: ToastType) => {
    const nextToasts = toastsRef.current.filter(toast => toast.type !== type)
    const nextActiveToasts = new Set(
      [...activeToastsRef.current].filter(toastId => nextToasts.some(toast => toast.id === toastId))
    )

    toastsRef.current = nextToasts
    activeToastsRef.current = nextActiveToasts

    setToasts(nextToasts)
    setActiveToasts(new Set(nextActiveToasts))
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
    const toast = toasts.find(currentToast => currentToast.id === toastId)
    if (toast?.action) {
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
