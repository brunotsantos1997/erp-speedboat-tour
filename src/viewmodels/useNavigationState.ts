import { useState, useCallback } from 'react'

type Breadcrumb = {
  label: string
  path: string
}

const DEFAULT_BREADCRUMBS: Breadcrumb[] = [{ label: 'Inicio', path: '/dashboard' }]

// Mock do ViewModel para testes
export const useNavigationState = () => {
  const [currentPath, setCurrentPath] = useState('/dashboard')
  const [previousPath, setPreviousPath] = useState<string | null>(null)
  const [navigationHistory, setNavigationHistory] = useState<string[]>(['/dashboard'])
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>(DEFAULT_BREADCRUMBS)
  const [isNavigating, setIsNavigating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [navigationStack] = useState<string[]>([])

  const generateBreadcrumbs = useCallback((path: string) => {
    const breadcrumbConfig: Record<string, Breadcrumb[]> = {
      '/dashboard': DEFAULT_BREADCRUMBS,
      '/events': [
        { label: 'Inicio', path: '/dashboard' },
        { label: 'Eventos', path: '/events' }
      ],
      '/events/create': [
        { label: 'Inicio', path: '/dashboard' },
        { label: 'Eventos', path: '/events' },
        { label: 'Novo Evento', path: '/events/create' }
      ],
      '/clients': [
        { label: 'Inicio', path: '/dashboard' },
        { label: 'Clientes', path: '/clients' }
      ],
      '/boats': [
        { label: 'Inicio', path: '/dashboard' },
        { label: 'Barcos', path: '/boats' }
      ],
      '/finance': [
        { label: 'Inicio', path: '/dashboard' },
        { label: 'Financeiro', path: '/finance' }
      ]
    }

    setBreadcrumbs(breadcrumbConfig[path] || DEFAULT_BREADCRUMBS)
  }, [])

  const navigate = useCallback((path: string, _state?: unknown) => {
    setIsNavigating(true)
    setPreviousPath(currentPath)
    setCurrentPath(path)
    setNavigationHistory(prev => [...prev, path])

    setTimeout(() => {
      setIsNavigating(false)
      generateBreadcrumbs(path)
    }, 100)
  }, [currentPath, generateBreadcrumbs])

  const goBack = useCallback(() => {
    if (navigationHistory.length <= 1) return

    const newHistory = [...navigationHistory]
    newHistory.pop()
    const nextPreviousPath = newHistory[newHistory.length - 1]

    setNavigationHistory(newHistory)
    setCurrentPath(nextPreviousPath)
    setPreviousPath(currentPath)
    generateBreadcrumbs(nextPreviousPath)
  }, [navigationHistory, currentPath, generateBreadcrumbs])

  const goForward = useCallback(() => {
    return false
  }, [])

  const replace = useCallback((path: string) => {
    setPreviousPath(currentPath)
    setCurrentPath(path)
    generateBreadcrumbs(path)
  }, [currentPath, generateBreadcrumbs])

  const reload = useCallback(() => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 500)
  }, [])

  const canGoBack = navigationHistory.length > 1
  const canGoForward = false

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
