// src/viewmodels/useCreateEventViewModel.ts
import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Product, Discount, SelectedProduct, ClientProfile } from '../core/domain/types';
import { LOYALTY_RULES } from '../core/data/mocks';
import { clientRepository } from '../core/repositories/ClientRepository';
import { productRepository } from '../core/repositories/ProductRepository';

export const useCreateEventViewModel = () => {
  // Core State
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [discount, setDiscount] = useState<Discount>({ type: 'FIXED', value: 0 });
  const [passengerCount, setPassengerCount] = useState(1);

  // Client Management State
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [clientSearchResults, setClientSearchResults] = useState<ClientProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loyaltySuggestion, setLoyaltySuggestion] = useState<string | null>(null);

  // New Client Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  // Fetch initial data
  useEffect(() => {
    productRepository.getAll().then(products => {
      setAvailableProducts(products);
      // Set default courtesies
      const defaultCourtesies = products
        .filter(p => p.isDefaultCourtesy)
        .map(p => ({ ...p, isCourtesy: true }));
      setSelectedProducts(defaultCourtesies);
    });
  }, []);

  // Handlers for Products, Discount, Passengers
  const toggleProduct = useCallback((product: Product) => {
    setSelectedProducts(prev =>
      prev.some(p => p.id === product.id)
        ? prev.filter(p => p.id !== product.id)
        : [...prev, { ...product, isCourtesy: false }]
    );
  }, []);

  const toggleCourtesy = useCallback((productId: string) => {
    setSelectedProducts(prev =>
      prev.map(p => p.id === productId ? { ...p, isCourtesy: !p.isCourtesy } : p)
    );
  }, []);

  const updateDiscountType = useCallback((type: 'FIXED' | 'PERCENTAGE') => {
    setDiscount(prev => ({ ...prev, type }));
  }, []);

  const updateDiscountValue = useCallback((value: number) => {
    setDiscount(prev => ({ ...prev, value: isNaN(value) || value < 0 ? 0 : value }));
  }, []);

  const updatePassengerCount = useCallback((count: number) => {
    const newCount = Math.max(1, count);
    if (!isNaN(newCount)) {
      setPassengerCount(newCount);
    }
  }, []);

  // Client Management Handlers (same as before)
  const handleClientSearch = useCallback(async (term: string) => {
    setClientSearchTerm(term);
    if (term.length > 2) {
      setIsSearching(true);
      const results = await clientRepository.search(term);
      setClientSearchResults(results);
      setIsSearching(false);
    } else {
      setClientSearchResults([]);
    }
  }, []);

  const selectClient = useCallback((client: ClientProfile) => {
    setSelectedClient(client);
    setClientSearchTerm(client.name);
    setClientSearchResults([]);
  }, []);

  const clearClientSelection = useCallback(() => {
    setSelectedClient(null);
    setClientSearchTerm('');
  }, []);

  const handleAddNewClient = useCallback(async () => {
    if (!newClientName || !newClientPhone) return;
    const newClient = await clientRepository.add({ id: '', name: newClientName, phone: newClientPhone });
    selectClient(newClient);
    setIsModalOpen(false);
    setNewClientName('');
    setNewClientPhone('');
  }, [newClientName, newClientPhone, selectClient]);


  // Derived State: Calculations with new pricing logic
  const subtotal = useMemo(() => {
    return selectedProducts.reduce((acc, product) => {
      if (product.isCourtesy) {
        return acc;
      }
      const price = product.pricingType === 'PER_PERSON' ? product.price * passengerCount : product.price;
      return acc + price;
    }, 0);
  }, [selectedProducts, passengerCount]);

  const totalDiscount = useMemo(() => {
    if (discount.type === 'FIXED') return discount.value;
    return subtotal * (discount.value / 100);
  }, [subtotal, discount]);

  const total = useMemo(() => Math.max(0, subtotal - totalDiscount), [subtotal, totalDiscount]);

  // Side Effects: Loyalty Checks (same as before)
  useEffect(() => {
    if (!selectedClient) {
      setLoyaltySuggestion(null);
      return;
    }
    let suggestion: string | null = null;
    const recurrenceRule = LOYALTY_RULES.find(r => r.type === 'RECURRENCE');
    if (recurrenceRule && recurrenceRule.threshold && (selectedClient.totalTrips + 1) % recurrenceRule.threshold === 0) {
      suggestion = recurrenceRule.message;
    }
    const today = new Date().toISOString().split('T')[0];
    const specialDateRule = LOYALTY_RULES.find(r => r.type === 'SPECIAL_DATE' && r.date === today);
    if (specialDateRule) {
      suggestion = suggestion ? `${suggestion} ${specialDateRule.message}` : specialDateRule.message;
    }
    setLoyaltySuggestion(suggestion);
  }, [selectedClient]);

  return {
    // State & Derived State
    availableProducts,
    selectedProducts,
    discount,
    passengerCount,
    subtotal,
    totalDiscount,
    total,
    // Client state
    selectedClient,
    clientSearchTerm,
    clientSearchResults,
    isSearching,
    loyaltySuggestion,
    // Modal state
    isModalOpen,
    newClientName,
    newClientPhone,
    // Handlers
    toggleProduct,
    toggleCourtesy,
    updateDiscountType,
    updateDiscountValue,
    updatePassengerCount,
    handleClientSearch,
    selectClient,
    clearClientSelection,
    setIsModalOpen,
    setNewClientName,
    setNewClientPhone,
    handleAddNewClient,
  };
};
