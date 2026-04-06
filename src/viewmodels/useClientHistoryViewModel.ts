// src/viewmodels/useClientHistoryViewModel.ts
import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/auth/useAuth';
import type { ClientProfile, EventType, Payment, PaymentMethod, PaymentType } from '../core/domain/types';
import { clientRepository } from '../core/repositories/ClientRepository';
import { eventRepository } from '../core/repositories/EventRepository';
import { paymentRepository } from '../core/repositories/PaymentRepository';
import { EventStatusService } from '../core/domain/EventStatusService';
import { TransactionService } from '../core/domain/TransactionService';
import { format } from 'date-fns';
import { useEventSync } from './useEventSync';
import { useModal } from '../ui/contexts/modal/useModal';
import { logger } from '../core/common/Logger';
import { PublicVoucherService } from '../core/domain/PublicVoucherService';

export const useClientHistoryViewModel = () => {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const clientIdParam = searchParams.get('clientId');
  const [searchTerm, setSearchTerm] = useState('');
  const { syncEvent, deleteFromGoogle } = useEventSync();
  const { confirm, showAlert } = useModal();
  const [searchResults, setSearchResults] = useState<ClientProfile[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  const [clientEvents, setClientEvents] = useState<EventType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Modal State for Editing Client
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientProfile | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activeEventForPayment, setActiveEventForPayment] = useState<EventType | null>(null);
  const [paymentType, setPaymentType] = useState<'DOWN_PAYMENT' | 'BALANCE' | 'FULL'>('BALANCE');
  const [defaultPaymentAmount, setDefaultPaymentAmount] = useState(0);

  // Shared Event Modal State
  const [isSharedModalOpen, setIsSharedModalOpen] = useState(false);
  const [selectedSharedEventId, setSelectedSharedEventId] = useState<string | null>(null);

  // Quick Edit Modal State
  const [isQuickEditModalOpen, setIsQuickEditModalOpen] = useState(false);
  const [activeEventForQuickEdit, setActiveEventForQuickEdit] = useState<EventType | null>(null);
  const [activeEventPayments, setActiveEventPayments] = useState<Payment[]>([]);

  const handleSearch = useCallback(async (term: string) => {
    setSearchTerm(term);
    if (term.length > 2) {
      setIsSearching(true);
      const results = await clientRepository.search(term);
      setSearchResults(results);
      setIsSearching(false);
    } else {
      setSearchResults([]);
    }
  }, []);

  const selectClient = useCallback(async (client: ClientProfile) => {
    setSelectedClient(client);
    setSearchTerm(client.name);
    setSearchResults([]);
  }, []);

  useEffect(() => {
    if (!selectedClient) {
      setTimeout(() => setClientEvents([]), 0);
      return;
    }

    // Initial fetch for auto-cancel check
    eventRepository.getEventsByClient(selectedClient.id).then(async (events) => {
      for (const event of events) {
        const cancelledEvent = EventStatusService.getAutoCancelledEvent(event);
        if (cancelledEvent) {
          try {
            const savedEvent = await eventRepository.updateEvent(cancelledEvent);
            await syncEvent(savedEvent);
          } catch (error: unknown) {
            logger.error('Failed to auto-cancel event', error as Error, { eventId: event.id, operation: 'auto-cancel' });
          }
        }
      }
      setTimeout(() => setIsLoading(false), 0);
    });

    const unsubscribe = eventRepository.subscribeToClientEvents(selectedClient.id, (events) => {
      setTimeout(() => {
        const sorted = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setClientEvents(sorted);
        setIsLoading(false);
      }, 0);
    });

    return unsubscribe;
  }, [selectedClient, syncEvent]);

  const clearSelection = () => {
    setSelectedClient(null);
    setClientEvents([]);
    setSearchTerm('');
    setSearchResults([]);
  };

  const cancelEvent = useCallback(async (eventId: string) => {
    const eventToUpdate = clientEvents.find(e => e.id === eventId);
    if (!eventToUpdate) return;

    const message = eventToUpdate.paymentStatus === 'CONFIRMED'
      ? 'Este evento já foi pago. Ao cancelar, o status será alterado para "Pendente de Reembolso". Deseja continuar?'
      : 'Tem certeza que deseja cancelar este evento?';

    if (await confirm('Confirmar Cancelamento', message)) {
      const result = await TransactionService.cancelEventWithRefunds(
        eventId,
        'Cancelado pelo histórico do cliente',
        currentUser?.id || 'system',
        currentUser?.name || 'ClientHistory'
      );

      if (!result.success) {
        throw new Error(result.error || 'Erro ao cancelar evento.');
      }

      const updatedEvent = await eventRepository.getById(eventId);
      if (updatedEvent) {
        await syncEvent(updatedEvent);
      }
    }
  }, [clientEvents, confirm, currentUser?.id, currentUser?.name, syncEvent]);

  const initiatePayment = useCallback(async (eventId: string, type: 'DOWN_PAYMENT' | 'BALANCE' | 'FULL') => {
    const event = clientEvents.find(e => e.id === eventId);
    if (event) {
        const payments = await paymentRepository.getByEventId(eventId);
        const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
        const suggested = EventStatusService.getSuggestedPaymentAmount(event, totalPaid, type);

        setActiveEventForPayment(event);
        setPaymentType(type);
        setDefaultPaymentAmount(suggested);
        setIsPaymentModalOpen(true);
    }
  }, [clientEvents]);

  const confirmPaymentRecord = useCallback(async (amount: number, method: PaymentMethod, type: PaymentType) => {
    if (!activeEventForPayment) return;

    try {
        const result = await TransactionService.confirmPaymentAndUpdateStatus(
          activeEventForPayment.id,
          {
            eventId: activeEventForPayment.id,
            amount,
            method,
            type,
            date: format(new Date(), 'yyyy-MM-dd'),
            timestamp: Date.now()
          },
          currentUser?.id || 'system',
          currentUser?.name || 'ClientHistory'
        );

        if (!result.success || !result.eventId) {
          throw new Error(result.error || 'Erro ao confirmar pagamento.');
        }

        const savedEvent = await eventRepository.getById(result.eventId);
        if (savedEvent) {
          await syncEvent(savedEvent);
        }

        setIsPaymentModalOpen(false);
        setActiveEventForPayment(null);
    } catch (error: unknown) {
      logger.error('Failed to record payment', error as Error, { eventId: activeEventForPayment?.id, amount, method, type, operation: 'confirmPaymentRecord' });
      throw error;
    }
  }, [activeEventForPayment, currentUser?.id, currentUser?.name, syncEvent]);

  const revertCancellation = useCallback(async (eventId: string) => {
    try {
      const eventToUpdate = clientEvents.find(e => e.id === eventId);
      if (!eventToUpdate) return;

      const updatedEvent = EventStatusService.revertCancellation(eventToUpdate);

      const savedEvent = await eventRepository.updateEvent(updatedEvent);
      await syncEvent(savedEvent);
    } catch (error: unknown) {
      logger.error('Failed to revert cancellation', error as Error, { eventId, operation: 'revertCancellation' });
      throw error;
    }
  }, [clientEvents, syncEvent]);

  // --- Quick Edit Handlers ---
  const openQuickEdit = useCallback(async (event: EventType) => {
    setActiveEventForQuickEdit(event);
    const payments = await paymentRepository.getByEventId(event.id);
    setActiveEventPayments(payments);
    setIsQuickEditModalOpen(true);
  }, []);

  const manualUpdateEvent = useCallback(async (data: Partial<EventType>) => {
    if (!activeEventForQuickEdit) return;
    const updated = { ...activeEventForQuickEdit, ...data };
    const saved = await eventRepository.updateEvent(updated);
    await syncEvent(saved);
    setActiveEventForQuickEdit(saved);
  }, [activeEventForQuickEdit, syncEvent]);

  const updatePayment = useCallback(async (paymentId: string, data: Partial<Payment>) => {
    if (!activeEventForQuickEdit) return;
    await paymentRepository.update(paymentId, data);
    const payments = await paymentRepository.getByEventId(activeEventForQuickEdit.id);
    setActiveEventPayments(payments);
    await PublicVoucherService.syncForEvent(activeEventForQuickEdit.id);
  }, [activeEventForQuickEdit]);

  const deletePayment = useCallback(async (paymentId: string) => {
    if (!activeEventForQuickEdit) return;
    await paymentRepository.remove(paymentId);
    const payments = await paymentRepository.getByEventId(activeEventForQuickEdit.id);
    setActiveEventPayments(payments);
    await PublicVoucherService.syncForEvent(activeEventForQuickEdit.id);
  }, [activeEventForQuickEdit]);

  const addPaymentToEvent = useCallback(async (data: { amount: number; method: PaymentMethod; type: PaymentType; date: string }) => {
    if (!activeEventForQuickEdit) return;
    await paymentRepository.add({
      ...data,
      eventId: activeEventForQuickEdit.id,
      timestamp: Date.now()
    });
    const payments = await paymentRepository.getByEventId(activeEventForQuickEdit.id);
    setActiveEventPayments(payments);
    await PublicVoucherService.syncForEvent(activeEventForQuickEdit.id);
  }, [activeEventForQuickEdit]);

  const deleteEventPermanently = useCallback(async (eventId: string) => {
    if (!await confirm('Excluir Permanentemente', 'TEM CERTEZA? Esta ação é irreversível e apagará o evento e todos os seus pagamentos permanentemente.')) return;

    try {
      const eventToDelete = clientEvents.find(e => e.id === eventId);
      const googleEventId = eventToDelete?.googleCalendarEventIds?.[currentUser?.id || ''];

      if (googleEventId) {
        await deleteFromGoogle(googleEventId);
      }

      await eventRepository.remove(eventId);
      const payments = await paymentRepository.getByEventId(eventId);
      for (const p of payments) {
        await paymentRepository.remove(p.id);
      }
      await PublicVoucherService.removeForEvent(eventId);
      // UI will update automatically via subscription in useEffect
    } catch (error) {
      console.error('Failed to delete event:', error);
      await showAlert('Erro', 'Erro ao excluir evento.');
    }
  }, [clientEvents, confirm, currentUser, deleteFromGoogle, showAlert]);

  // --- Client Edit Handlers ---
  const openEditModal = () => {
    if (!selectedClient) return;
    setEditingClient(selectedClient);
    setClientName(selectedClient.name);
    setClientPhone(selectedClient.phone);
    setIsModalOpen(true);
  };

  const closeEditModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    setClientName('');
    setClientPhone('');
  };

  const handleSaveChanges = useCallback(async () => {
    if (!editingClient || !clientName || !clientPhone) return;

    const updatedClient = { ...editingClient, name: clientName, phone: clientPhone };
    await clientRepository.update(updatedClient);

    setSelectedClient(updatedClient);
    setSearchTerm(updatedClient.name);

    closeEditModal();
  }, [editingClient, clientName, clientPhone]);

  useEffect(() => {
    const loadClientFromParams = async () => {
      if (clientIdParam && !selectedClient) {
        setIsLoading(true);
        const client = await clientRepository.getById(clientIdParam);
        if (client) {
          await selectClient(client);
        }
        setIsLoading(false);
      }
    };
    loadClientFromParams();
  }, [clientIdParam, selectedClient, selectClient]);

  return {
    searchTerm,
    searchResults,
    selectedClient,
    clientEvents,
    isLoading,
    isSearching,
    isModalOpen,
    editingClient,
    clientName,
    clientPhone,
    setClientName,
    setClientPhone,
    handleSearch,
    selectClient,
    clearSelection,
    cancelEvent,
    openEditModal,
    closeEditModal,
    handleSaveChanges,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    activeEventForPayment,
    paymentType,
    defaultPaymentAmount,
    initiatePayment,
    confirmPaymentRecord,
    revertCancellation,
    isSharedModalOpen,
    setIsSharedModalOpen,
    selectedSharedEventId,
    setSelectedSharedEventId,
    isQuickEditModalOpen,
    setIsQuickEditModalOpen,
    activeEventForQuickEdit,
    activeEventPayments,
    openQuickEdit,
    manualUpdateEvent,
    updatePayment,
    deletePayment,
    addPaymentToEvent,
    deleteEventPermanently
  };
};
