import { useState, useCallback } from 'react';
import type { ClientProfile } from '../../core/domain/types';
import { clientRepository } from '../../core/repositories/ClientRepository';

export const useClientManagement = (
  initialClient?: ClientProfile | null,
  confirmAction?: (title: string, message: string) => Promise<boolean>
) => {
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(initialClient || null);
  const [clientSearchTerm, setClientSearchTerm] = useState(initialClient?.name || '');
  const [clientSearchResults, setClientSearchResults] = useState<ClientProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loyaltySuggestion, setLoyaltySuggestion] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientProfile | null>(null);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  const handleClientSearch = useCallback(async (term: string) => {
    setClientSearchTerm(term);
    if (term.length > 2) {
      setIsSearching(true);
      try {
        const results = await clientRepository.search(term);
        setClientSearchResults(results);
        const existingClient = results.find(c => c.name.toLowerCase().includes(term.toLowerCase()));
        if (existingClient && existingClient.totalTrips > 0) {
          setLoyaltySuggestion(`Cliente fiel! Já realizou ${existingClient.totalTrips} passeios.`);
        } else {
          setLoyaltySuggestion(null);
        }
      } catch (error) {
        console.error('Failed to search clients:', error);
        setClientSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setClientSearchResults([]);
      setLoyaltySuggestion(null);
    }
  }, []);

  const selectClient = useCallback((client: ClientProfile) => {
    setSelectedClient(client);
    setClientSearchTerm(client.name);
    setClientSearchResults([]);
    setLoyaltySuggestion(null);
  }, []);

  const clearClientSelection = useCallback(() => {
    setSelectedClient(null);
    setClientSearchTerm('');
    setClientSearchResults([]);
    setLoyaltySuggestion(null);
  }, []);

  const openNewClientModal = useCallback(() => {
    setEditingClient(null);
    setNewClientName('');
    setNewClientPhone('');
    setIsModalOpen(true);
  }, []);

  const openEditClientModal = useCallback((client: ClientProfile) => {
    setEditingClient(client);
    setNewClientName(client.name);
    setNewClientPhone(client.phone);
    setIsModalOpen(true);
  }, []);

  const closeClientModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingClient(null);
    setNewClientName('');
    setNewClientPhone('');
  }, []);

  const handleSaveClient = useCallback(async () => {
    if (!newClientName || !newClientPhone) {
      // This should be handled by the view with a toast
      console.error('Client name and phone are required.');
      return;
    }

    try {
      if (editingClient) {
        const updatedClient = { ...editingClient, name: newClientName, phone: newClientPhone };
        await clientRepository.update(updatedClient);
        setSelectedClient(updatedClient);
        setClientSearchTerm(updatedClient.name);
      } else {
        const newClient = await clientRepository.add({ name: newClientName, phone: newClientPhone });
        setSelectedClient(newClient);
        setClientSearchTerm(newClient.name);
        setClientSearchResults([]);
      }
      closeClientModal();
    } catch (error) {
      console.error('Failed to save client:', error);
      // This should be handled by the view with a toast
    }
  }, [editingClient, newClientName, newClientPhone, closeClientModal]);

  const handleDeleteClient = useCallback(async (client: ClientProfile) => {
    if (confirmAction && !await confirmAction('Tem certeza que deseja excluir este cliente?', 'Esta ação é irreversível.')) {
      return;
    }

    try {
      await clientRepository.delete(client.id);
      if (selectedClient?.id === client.id) {
        clearClientSelection();
      }
    } catch (error) {
      console.error('Failed to delete client:', error);
      // This should be handled by the view with a toast
    }
  }, [selectedClient, clearClientSelection, confirmAction]);

  return {
    selectedClient,
    clientSearchTerm,
    clientSearchResults,
    isSearching,
    loyaltySuggestion,
    isModalOpen,
    editingClient,
    newClientName,
    newClientPhone,
    handleClientSearch,
    selectClient,
    clearClientSelection,
    openNewClientModal,
    openEditClientModal,
    closeClientModal,
    handleSaveClient,
    handleDeleteClient,
    setNewClientName,
    setNewClientPhone,
    setSelectedClient,
    setClientSearchTerm
  };
};
