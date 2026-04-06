import { useState, useCallback } from 'react'

// Mock do ViewModel para testes
export const useExpenseCategoryViewModel = () => {
  const [loading, setLoading] = useState(false)
  const [categories] = useState([])
  const [searchResults] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openModal = useCallback(() => setIsModalOpen(true), [])
  const closeModal = useCallback(() => setIsModalOpen(false), [])
  
  const createCategory = useCallback(async (_categoryData: any) => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return { success: true, categoryId: `cat-${Date.now()}` }
    } catch (error) {
      return { success: false, error: 'Failed to create category' }
    } finally {
      setLoading(false)
    }
  }, [])

  const updateCategory = useCallback(async (_categoryId: string, _updates: any) => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to update category' }
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteCategory = useCallback(async (_categoryId: string) => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to delete category' }
    } finally {
      setLoading(false)
    }
  }, [])

  const reorderCategories = useCallback(async (_newOrder: string[]) => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to reorder categories' }
    } finally {
      setLoading(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    categories,
    searchResults,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    isModalOpen,
    openModal,
    closeModal,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    refresh
  }
}
