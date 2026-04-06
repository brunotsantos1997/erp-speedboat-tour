import { useState, useCallback } from 'react'

// Mock do ViewModel para testes
export const useCreateClientViewModel = () => {
  const [loading, setLoading] = useState(false)
  const [clients] = useState([])
  const [searchResults] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openModal = useCallback(() => setIsModalOpen(true), [])
  const closeModal = useCallback(() => setIsModalOpen(false), [])
  
  const saveClient = useCallback(async (_clientData: any) => {
    setLoading(true)
    try {
      // Mock de salvamento
      await new Promise(resolve => setTimeout(resolve, 1000))
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Erro ao salvar cliente' }
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteClient = useCallback(async (_clientId: string) => {
    setLoading(true)
    try {
      // Mock de exclusão
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Erro ao excluir cliente' }
    } finally {
      setLoading(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      // Mock de refresh
      await new Promise(resolve => setTimeout(resolve, 500))
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    clients,
    searchResults,
    searchTerm,
    setSearchTerm,
    selectedClient,
    setSelectedClient,
    isModalOpen,
    openModal,
    closeModal,
    saveClient,
    deleteClient,
    refresh
  }
}
