import { useState, useCallback } from 'react'

// Mock do ViewModel para testes
export const useDashboardMetrics = () => {
  const [loading, setLoading] = useState(true)
  const [error, setErrorState] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<Record<string, unknown>>({})
  const [financialMetrics, setFinancialMetrics] = useState<any>(null)
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null)
  const [periodMetrics, setPeriodMetrics] = useState<any>(null)
  const [trends] = useState<any>(null)
  const [targetComparison] = useState<any>(null)
  const [alerts] = useState<any[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const refreshMetrics = useCallback(async () => {
    setLoading(true)
    setErrorState(null)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock de métricas atualizadas
      const updatedFinancialMetrics = {
        realizedRevenue: 3500,
        pendingRevenue: 1800,
        totalReceived: 4400,
        totalExpenses: 1000,
        outstandingBalance: 1800,
        netProfit: 2500,
        profitMargin: 71
      }

      const updatedPerformanceMetrics = {
        completionRate: 85,
        cancellationRate: 15,
        avgPassengersPerEvent: 9,
        avgDurationPerEvent: 105,
        activeBoatsCount: 2,
        avgOccupancyRate: 26
      }

      setFinancialMetrics(updatedFinancialMetrics)
      setPerformanceMetrics(updatedPerformanceMetrics)
      setMetrics({
        ...updatedFinancialMetrics,
        ...updatedPerformanceMetrics
      })
      setLastUpdate(new Date())
      
      return { success: true }
    } catch (error) {
      setErrorState('Failed to refresh metrics')
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }, [])

  const updatePeriod = useCallback(async (period: string) => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const updatedPeriodMetrics = {
        period,
        totals: { revenue: 4500, expenses: 650, events: 6 },
        averages: { avgRevenue: 1500, avgExpenses: 217, avgEvents: 2 }
      }

      setPeriodMetrics(updatedPeriodMetrics)
      return { success: true }
    } catch (error) {
      setErrorState('Failed to update period')
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }, [])

  const exportMetrics = useCallback(async (format: 'json' | 'csv' = 'json') => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const exportData = {
        financialMetrics,
        performanceMetrics,
        periodMetrics,
        trends,
        exportedAt: new Date().toISOString()
      }

      if (format === 'csv') {
        const csv = 'Metric,Value\nRevenue,3500\nExpenses,1000\nNet Profit,2500'
        return { success: true, data: csv, format }
      }

      return { success: true, data: JSON.stringify(exportData, null, 2), format }
    } catch (error) {
      setErrorState('Failed to export metrics')
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }, [financialMetrics, performanceMetrics, periodMetrics, trends])

  const updateMetrics = useCallback((nextMetrics: Record<string, unknown>) => {
    setMetrics(nextMetrics)
    setLoading(false)
  }, [])

  const setError = useCallback((nextError: string | null) => {
    setErrorState(nextError)
    setLoading(false)
  }, [])

  return {
    loading,
    error,
    metrics,
    financialMetrics,
    performanceMetrics,
    periodMetrics,
    trends,
    targetComparison,
    alerts,
    lastUpdate,
    setError,
    refreshMetrics,
    updatePeriod,
    updateMetrics,
    exportMetrics
  }
}
