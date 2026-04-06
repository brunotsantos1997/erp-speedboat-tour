import { useState, useCallback, useEffect } from 'react'

// Mock do ViewModel para testes
export const useThemeState = () => {
  const [currentTheme, setCurrentTheme] = useState('light')
  const [systemTheme, setSystemTheme] = useState('light')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [customColors, setCustomColors] = useState<any>({
    primary: '#3b82f6',
    secondary: '#64748b',
    accent: '#f59e0b',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1e293b'
  })
  const [customFonts, setCustomFonts] = useState<any>({
    primary: 'Inter',
    secondary: 'Roboto',
    mono: 'JetBrains Mono'
  })

  const availableThemes = ['light', 'dark', 'auto']
  const isDarkMode = currentTheme === 'dark' || (currentTheme === 'auto' && systemTheme === 'dark')
  const isSystemDark = systemTheme === 'dark'

  // Detectar tema do sistema
  useEffect(() => {
    const detectSystemTheme = () => {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setSystemTheme(isDark ? 'dark' : 'light')
    }

    detectSystemTheme()

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const setTheme = useCallback((theme: string) => {
    if (!availableThemes.includes(theme)) {
      throw new Error('Tema inválido')
    }

    setIsTransitioning(true)
    setCurrentTheme(theme)

    // Simular transição
    setTimeout(() => {
      setIsTransitioning(false)
    }, 300)
  }, [])

  const toggleTheme = useCallback(() => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }, [currentTheme, setTheme])

  const updateColor = useCallback((colorKey: string, value: string) => {
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    if (!colorRegex.test(value)) {
      throw new Error('Formato de cor inválido')
    }

    setCustomColors((prev: any) => ({
      ...prev,
      [colorKey]: value
    }))
  }, [])

  const updateFont = useCallback((fontKey: string, value: string) => {
    const availableFonts = [
      'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
      'JetBrains Mono', 'Fira Code', 'Source Code Pro'
    ]

    if (!availableFonts.includes(value)) {
      throw new Error('Fonte não disponível')
    }

    setCustomFonts((prev: any) => ({
      ...prev,
      [fontKey]: value
    }))
  }, [])

  const resetTheme = useCallback(() => {
    setCurrentTheme('light')
    setCustomColors({
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#f59e0b',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#1e293b'
    })
    setCustomFonts({
      primary: 'Inter',
      secondary: 'Roboto',
      mono: 'JetBrains Mono'
    })
  }, [])

  const getEffectiveTheme = useCallback(() => {
    if (currentTheme === 'auto') {
      return systemTheme
    }
    return currentTheme
  }, [currentTheme, systemTheme])

  const getColor = useCallback((colorKey: string) => {
    return customColors[colorKey as keyof typeof customColors]
  }, [customColors])

  const getFont = useCallback((fontKey: string) => {
    return customFonts[fontKey as keyof typeof customFonts]
  }, [customFonts])

  const generateCSSVariables = useCallback(() => {
    const colorVars = Object.entries(customColors).map(([key, value]) => {
      return `--color-${key}: ${value}`
    })

    const fontVars = Object.entries(customFonts).map(([key, value]) => {
      return `--font-${key}: "${value}"`
    })

    const themeVars = [
      `--theme-current: ${currentTheme}`,
      `--theme-is-dark: ${isDarkMode}`
    ]

    return [...colorVars, ...fontVars, ...themeVars]
  }, [customColors, customFonts, currentTheme, isDarkMode])

  return {
    currentTheme,
    systemTheme,
    isDarkMode,
    isTransitioning,
    customColors,
    customFonts,
    availableThemes,
    isSystemDark,
    actions: {
      setTheme,
      toggleTheme,
      updateColor,
      updateFont,
      resetTheme
    },
    helpers: {
      getEffectiveTheme,
      getColor,
      getFont,
      generateCSSVariables
    }
  }
}
