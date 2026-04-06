import { useState, useCallback } from 'react'

// Mock do ViewModel para testes
export const useModalState = () => {
  const [openModals, setOpenModals] = useState(new Set())
  const [modalData, setModalData] = useState<any>({})
  const [modalHistory, setModalHistory] = useState<any[]>([])
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [modalStack, setModalStack] = useState<string[]>([])
  const [lockedModals, setLockedModals] = useState(new Set())
  const [lockReasons, setLockReasons] = useState<any>({})

  const openModal = useCallback((modalId: string, _data?: any, _options?: any) => {
    if (openModals.has(modalId)) {
      throw new Error('Modal já está aberto')
    }

    setIsTransitioning(true)
    
    setOpenModals((prev: any) => new Set([...prev, modalId]))
    setModalData((prev: any) => ({ ...prev, [modalId]: _data }))
    setModalHistory((prev: any) => [...prev, {
      action: 'open',
      modalId,
      timestamp: Date.now(),
      data: _data
    }])
    setActiveModal(modalId)
    setModalStack((prev: any) => [...prev, modalId])

    // Simular transição
    setTimeout(() => {
      setIsTransitioning(false)
    }, 200)
  }, [openModals])

  const closeModal = useCallback((modalId: string, force: boolean = false) => {
    if (!openModals.has(modalId)) {
      throw new Error('Modal não está aberto')
    }

    if (!force && modalStack.length > 1) {
      const modalIndex = modalStack.indexOf(modalId)
      if (modalIndex < modalStack.length - 1) {
        throw new Error('Não é possível fechar modal que não está no topo da pilha')
      }
    }

    setIsTransitioning(true)
    
    setOpenModals((prev: any) => {
      const newSet = new Set(prev)
      newSet.delete(modalId)
      return newSet
    })
    setModalData((prev: any) => {
      const newData = { ...prev }
      delete newData[modalId]
      return newData
    })
    setModalHistory((prev: any) => [...prev, {
      action: 'close',
      modalId,
      timestamp: Date.now()
    }])

    const newStack = modalStack.filter(id => id !== modalId)
    setModalStack(newStack)
    setActiveModal(newStack.length > 0 ? newStack[newStack.length - 1] : null)

    // Simular transição
    setTimeout(() => {
      setIsTransitioning(false)
    }, 200)
  }, [openModals, modalStack])

  const confirmAction = useCallback(async (_modalId: string, message: string, _options?: any) => {
    return new Promise((resolve) => {
      const userResponse = window.confirm(message)
      resolve(userResponse)
    })
  }, [])

  const showAlert = useCallback((modalId: string, message: string, _type?: any) => {
    window.alert(message)
    return `${modalId}-${Date.now()}`
  }, [])

  const lockModal = useCallback((modalId: string, reason: string) => {
    setLockedModals((prev: any) => new Set([...prev, modalId]))
    setLockReasons((prev: any) => ({ ...prev, [modalId]: reason }))
  }, [])

  const unlockModal = useCallback((modalId: string) => {
    setLockedModals((prev: any) => {
      const newSet = new Set(prev)
      newSet.delete(modalId)
      return newSet
    })
    setLockReasons((prev: any) => {
      const newReasons = { ...prev }
      delete newReasons[modalId]
      return newReasons
    })
  }, [])

  const isModalOpen = useCallback((modalId: string) => {
    return openModals.has(modalId)
  }, [openModals])

  const isModalLocked = useCallback((modalId: string) => {
    return lockedModals.has(modalId)
  }, [lockedModals])

  const getModalData = useCallback((modalId: string) => {
    return modalData[modalId]
  }, [modalData])

  const getModalDepth = useCallback(() => {
    return modalStack.length
  }, [modalStack])

  const getLockReason = useCallback((modalId: string) => {
    return lockReasons[modalId] || null
  }, [lockReasons])

  const closeAllModals = useCallback(() => {
    setOpenModals(new Set())
    setModalData({})
    setModalHistory((prev: any) => [...prev, {
      action: 'closeAll',
      timestamp: Date.now(),
      closedModals: Array.from(openModals)
    }])
    setActiveModal(null)
    setModalStack([])
  }, [])

  const getActiveModal = useCallback(() => {
    return activeModal
  }, [activeModal])

  return {
    openModals,
    modalData,
    activeModal,
    isTransitioning,
    modalStack,
    modalHistory,
    lockedModals,
    lockReasons,
    actions: {
      openModal,
      closeModal,
      confirmAction,
      showAlert,
      lockModal,
      unlockModal,
      closeAllModals
    },
    helpers: {
      isModalOpen,
      isModalLocked,
      getModalData,
      getModalDepth,
      getLockReason,
      getActiveModal
    }
  }
}
