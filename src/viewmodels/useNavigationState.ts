import { useState, useCallback } from 'react'

// Mock do ViewModel para testes
export const useNavigationState = () => {
  const [currentPath, setCurrentPath] = useState('/dashboard')
  const [previousPath, setPreviousPath] = useState<string | null>(null)
  const [navigationHistory, setNavigationHistory] = useState<string[]>(['/dashboard'])
  const [breadcrumbs, setBreadcrumbs] = useState<any[]>([{ label: 'Início', path: '/dashboard' }])
  const [isNavigating, setIsNavigating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [navigationStack] = useState<any[]>([])

  const navigate = useCallback((path: string, _state?: any) => {
    setIsNavigating(true)
    setPreviousPath(currentPath)
    setCurrentPath(path)
    setNavigationHistory((prev: any) => [...prev, path])
    
    // Simular navegação assíncrona
    setTimeout(() => {
      setIsNavigating(false)
      generateBreadcrumbs(path)
    }, 100)
  }, [currentPath])

  const goBack = useCallback(() => {
    if (navigationHistory.length > 1) {
      const newHistory = [...navigationHistory]
      newHistory.pop()
      const previousPath = newHistory[newHistory.length - 1]
      setNavigationHistory(newHistory)
      setCurrentPath(previousPath)
      setPreviousPath(currentPath)
      generateBreadcrumbs(previousPath)
    }
  }, [navigationHistory, currentPath])

  const goForward = useCallback(() => {
    // Implementação simplificada
    return false
  }, [])

  const replace = useCallback((path: string) => {
    setPreviousPath(currentPath)
    setCurrentPath(path)
    generateBreadcrumbs(path)
  }, [currentPath])

  const reload = useCallback(() => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 500)
  }, [])

  const generateBreadcrumbs = useCallback((path: string) => {
    const breadcrumbConfig: Record<string, any[]> = {
      '/dashboard': [{ label: 'Início', path: '/dashboard' }],
      '/events': [
        { label: 'Início', path: '/dashboard' },
        { label: 'Eventos', path: '/events' }
      ],
      '/events/create': [
        { label: 'Início', path: '/dashboard' },
        { label: 'Eventos', path: '/events' },
        { label: 'Novo Evento', path: '/events/create' }
      ],
      '/clients': [
        { label: 'Início', path: '/dashboard' },
        { label: 'Clientes', path: '/clients' }
      ],
      '/boats': [
        { label: 'Início', path: '/dashboard' },
        { label: 'Barcos', path: '/boats' }
      ],
      '/finance': [
        { label: 'Início', path: '/dashboard' },
        { label: 'Financeiro', path: '/finance' }
      ]
    }

    const config = breadcrumbConfig[path] || [{ label: 'Início', path: '/dashboard' }]
    setBreadcrumbs(config)
  }, [])

  const canGoBack = navigationHistory.length > 1
  const canGoForward = false // Implementação simplificada

  const canAccessRoute = useCallback((path: string, userRole: string, isAuthenticated: boolean) => {
    const routeProtection: Record<string, { requiredRole: string | null; authenticated: boolean }> = {
      '/dashboard': { requiredRole: null, authenticated: true },
      '/events': { requiredRole: null, authenticated: true },
      '/events/create': { requiredRole: 'ADMIN', authenticated: true },
      '/clients': { requiredRole: null, authenticated: true },
      '/clients/create': { requiredRole: 'ADMIN', authenticated: true },
      '/finance': { requiredRole: 'ADMIN', authenticated: true },
      '/settings': { requiredRole: 'ADMIN', authenticated: true },
      '/login': { requiredRole: null, authenticated: false }
    }

    const protection = routeProtection[path]
    if (!protection) return false

    if (protection.authenticated && !isAuthenticated) return false
    if (!protection.authenticated && isAuthenticated) return false
    if (protection.requiredRole && userRole !== protection.requiredRole) return false

    return true
  }, [])

  return {
    currentPath,
    previousPath,
    navigationHistory,
    breadcrumbs,
    isNavigating,
    isLoading,
    navigationStack,
    actions: {
      navigate,
      goBack,
      goForward,
      replace,
      reload
    },
    helpers: {
      canGoBack,
      canGoForward,
      generateBreadcrumbs,
      canAccessRoute
    }
  }
}
