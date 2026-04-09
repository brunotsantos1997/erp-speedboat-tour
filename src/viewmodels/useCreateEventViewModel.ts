// src/viewmodels/useCreateEventViewModel.ts
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useEventDataState } from './event/useEventDataState';
import { useEventCalculations } from './event/useEventCalculations';
import { useClientManagement } from './event/useClientManagement';
import { useEventCreation } from './event/useEventCreation';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/auth/useAuth';
import type { DayOfWeek, Product, Discount, SelectedProduct, ClientProfile, Boat, EventType, PaymentStatus, CompanyData } from '../core/domain/types';
import { clientRepository } from '../core/repositories/ClientRepository';
import { productRepository } from '../core/repositories/ProductRepository';
import { boatRepository } from '../core/repositories/BoatRepository';
import { tourTypeRepository } from '../core/repositories/TourTypeRepository';
import { eventRepository } from '../core/repositories/EventRepository';
import { CompanyDataRepository } from '../core/repositories/CompanyDataRepository';
import { format } from 'date-fns';
import { timeToMinutes, minutesToTime } from '../core/utils/timeUtils';
import type { BoardingLocation, TourType } from '../core/domain/types';
import { boardingLocationRepository } from '../core/repositories/BoardingLocationRepository';
import { sanitizeObject } from '../core/utils/objectUtils';
import { useEventSync } from './useEventSync';
import { useModal } from '../ui/contexts/modal/useModal';

export const useCreateEventViewModel = () => {
  const { currentUser } = useAuth();
  const { syncEvent } = useEventSync();
  const { confirm } = useModal();
  const [searchParams] = useSearchParams();
  const [editingEventId, setEditingEventId] = useState<string | null>(searchParams.get(\'eventId\'));

  const { 
    selectedClient,
    clientSearchTerm,
    clientSearchResults, 
    isSearching, 
    loyaltySuggestion, 
    isModalOpen, 
    editingClient, 
    newClientName, setNewClientName,
    newClientPhone, setNewClientPhone,
    handleClientSearch, 
    selectClient, 
    clearClientSelection,
    openNewClientModal: handleOpenModal, 
    closeClientModal: handleCloseModal, 
    handleSaveClient, 
    handleDeleteClient,
    setSelectedClient, // Now exposed by useClientManagement
    setClientSearchTerm // Now exposed by useClientManagement
  } = useClientManagement(originalEvent?.client, confirm);


   const { 
    selectedDate, setSelectedDate,
    startTime, setStartTime,
    endTime, setEndTime,
    scheduledEvents, setScheduledEventsData,
    isPreScheduled, updateIsPreScheduled,
    availableBoats, setAvailableBoats,
    selectedBoat, setSelectedBoat,
    availableBoardingLocations, setAvailableBoardingLocations,
    selectedBoardingLocation, setSelectedBoardingLocation,
    availableTourTypes, setAvailableTourTypes,
    selectedTourType, setSelectedTourType,
    availableProducts, setAvailableProducts,
    selectedProducts, setSelectedProducts,
    rentalDiscount, setRentalDiscount,
    passengerCount, updatePassengerCount,
    observations, updateObservations,
    tax, updateTax,
    taxDescription, updateTaxDescription,
    companyData, setCompanyData,
    isLoading, setLoadingState,
    originalEvent, originalPaymentStatus
  } = useEventDataState(originalEvent, editingEventId);


  // Fetch scheduled events when selected date changes
  useEffect(() => {
    if (selectedDate) {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      eventRepository.getEventsByDate(dateString).then(setScheduledEventsData);
    }
  }, [selectedDate]);

  // Handlers
  const toggleProduct = useCallback((product: Product) => {
    setSelectedProducts(prev =>
      prev.some(p => p.id === product.id)
        ? prev.filter(p => p.id !== product.id)
        : [...prev, {
            ...product,
            isCourtesy: false,
            startTime: product.pricingType === 'HOURLY' ? startTime : undefined,
            endTime: product.pricingType === 'HOURLY' ? endTime : undefined
          }]
    );
  }, [startTime, endTime]);

  const toggleCourtesy = useCallback((productId: string) => {
    setSelectedProducts(prev =>
      prev.map(p => p.id === productId ? { ...p, isCourtesy: !p.isCourtesy } : p)
    );
  }, []);

  const updateProductDiscount = useCallback((productId: string, discount: Discount) => {
    setSelectedProducts(prev =>
      prev.map(p => p.id === productId ? { ...p, discount } : p)
    );
  }, []);

  const updateDiscountType = useCallback((type: 'FIXED' | 'PERCENTAGE', category: 'rental') => {
    if (category === 'rental') setRentalDiscount(prev => ({ ...prev, type }));
  }, []);

  const updateDiscountValue = useCallback((value: number, category: 'rental') => {
    const val = isNaN(value) || value < 0 ? 0 : value;
    if (category === 'rental') setRentalDiscount(prev => ({ ...prev, value: val }));
  }, []);

  const updatePassengerCount = useCallback((count: number) => {
    const newCount = Math.max(1, count);
    if (!isNaN(newCount)) {
      setPassengerCount(newCount);
    }
  }, []);

  const updateTax = useCallback((value: number) => {
    setTax(isNaN(value) || value < 0 ? 0 : value);
  }, []);

  const updateTaxDescription = useCallback((desc: string) => {
    setTaxDescription(desc);
  }, []);

  const handleBoatSelection = useCallback((boatId: string) => {
    const boat = availableBoats.find(b => b.id === boatId);
    setSelectedBoat(boat || null);
  }, [availableBoats]);

  const handleBoardingLocationSelection = useCallback((locationId: string) => {
    const location = availableBoardingLocations.find(l => l.id === locationId);
    setSelectedBoardingLocation(location || null);
  }, [availableBoardingLocations]);

  const handleTourTypeSelection = useCallback((tourTypeId: string) => {
    const tourType = availableTourTypes.find(t => t.id === tourTypeId);
    setSelectedTourType(tourType || null);
  }, [availableTourTypes]);

  const handleSaveTourType = useCallback(async (name: string, color: string) => {
    const newTourType = await tourTypeRepository.add({ name, color, isArchived: false });
    const tourTypes = await tourTypeRepository.getAll();
    setAvailableTourTypes(tourTypes);
    setSelectedTourType(newTourType);
  }, []);

  const updateHourlyProductTime = useCallback((productId: string, time: string, type: 'start' | 'end') => {
    setSelectedProducts(prev =>
      prev.map(p => {
        if (p.id === productId && p.pricingType === 'HOURLY') {
          return {
            ...p,
            startTime: type === 'start' ? time : p.startTime,
            endTime: type === 'end' ? time : p.endTime,
          };
        }
        return p;
      })
    );
  }, []);




  // Calculations
  const isCapacityExceeded = useMemo(() => {
    if (!selectedBoat) return false;
    return passengerCount > selectedBoat.capacity;
  }, [passengerCount, selectedBoat]);

  const boatRentalCost = useMemo(() => {
    if (!selectedBoat || !startTime || !endTime) return 0;

    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);
    const durationInMinutes = endMin - startMin;

    if (durationInMinutes <= 0) return 0;

    const hours = Math.floor(durationInMinutes / 60);
    const remainingMinutes = durationInMinutes % 60;

    let cost = hours * (selectedBoat.pricePerHour || 0);
    if (remainingMinutes >= 30) {
      cost += (selectedBoat.pricePerHalfHour || 0);
    }

    return cost;
  }, [startTime, endTime, selectedBoat]);

  const productsCost = useMemo(() => {
    return selectedProducts.reduce((acc, product) => {
      if (product.isCourtesy) {
        return acc;
      }

      switch (product.pricingType) {
        case 'PER_PERSON':
          return acc + (product.price || 0) * passengerCount;
        case 'HOURLY':
          if (product.startTime && product.endTime && product.hourlyPrice) {
            const startMin = timeToMinutes(product.startTime);
            const endMin = timeToMinutes(product.endTime);
            const durationInMinutes = endMin - startMin;
            const durationInHours = durationInMinutes / 60;

            if (durationInHours > 0) {
              return acc + durationInHours * product.hourlyPrice;
            }
          }
          return acc;
        case 'FIXED':
        default:
          return acc + (product.price || 0);
      }
    }, 0);
  }, [selectedProducts, passengerCount]);

  const subtotal = useMemo(() => productsCost + boatRentalCost, [productsCost, boatRentalCost]);

  const rentalDiscountValue = useMemo(() => {
    if (rentalDiscount.type === 'FIXED') return rentalDiscount.value;
    return boatRentalCost * (rentalDiscount.value / 100);
  }, [boatRentalCost, rentalDiscount]);

  const totalDiscount = useMemo(() => {
    const productDiscountsTotal = selectedProducts.reduce((acc, p) => {
      if (p.isCourtesy || !p.discount || p.discount.value <= 0) return acc;

      let itemGross = 0;
      if (p.pricingType === 'PER_PERSON') itemGross = (p.price || 0) * passengerCount;
      else if (p.pricingType === 'HOURLY' && p.startTime && p.endTime && p.hourlyPrice) {
           const duration = (timeToMinutes(p.endTime) - timeToMinutes(p.startTime)) / 60;
           itemGross = duration > 0 ? duration * p.hourlyPrice : 0;
      } else itemGross = p.price || 0;

      if (p.discount.type === 'FIXED') return acc + p.discount.value;
      return acc + (itemGross * (p.discount.value / 100));
    }, 0);

    return rentalDiscountValue + productDiscountsTotal;
  }, [rentalDiscountValue, selectedProducts, passengerCount]);

  const total = useMemo(() => Math.max(0, subtotal - totalDiscount + tax), [subtotal, totalDiscount, tax]);

  const createEvent = useCallback(async () => {
    if (!selectedDate || !selectedClient || !selectedBoat || !selectedBoardingLocation || !selectedTourType) {
      throw new Error('Campos obrigatórios ausentes.');
    }

    const productDiscountsTotal = selectedProducts.reduce((acc, p) => {
        if (p.isCourtesy || !p.discount || p.discount.value <= 0) return acc;

        let itemGross = 0;
        if (p.pricingType === 'PER_PERSON') itemGross = (p.price || 0) * passengerCount;
        else if (p.pricingType === 'HOURLY' && p.startTime && p.endTime && p.hourlyPrice) {
             const duration = (timeToMinutes(p.endTime) - timeToMinutes(p.startTime)) / 60;
             itemGross = duration > 0 ? duration * p.hourlyPrice : 0;
        } else itemGross = p.price || 0;

        if (p.discount.type === 'FIXED') return acc + p.discount.value;
        return acc + (itemGross * (p.discount.value / 100));
    }, 0);

    const productsRevenue = productsCost - productDiscountsTotal;
    const rentalRevenue = boatRentalCost - rentalDiscountValue;

    // Calculate Costs
    let rentalCost = 0;
    if (selectedBoat && startTime && endTime) {
      const startMin = timeToMinutes(startTime);
      const endMin = timeToMinutes(endTime);
      const durationInMinutes = endMin - startMin;
      if (durationInMinutes > 0) {
        const hours = Math.floor(durationInMinutes / 60);
        const remainingMinutes = durationInMinutes % 60;
        rentalCost = hours * (selectedBoat.costPerHour || 0);
        if (remainingMinutes >= 30) {
          rentalCost += (selectedBoat.costPerHalfHour || 0);
        }
      }
    }

    const productsCostValue = selectedProducts.reduce((acc, p) => {
      if (p.isCourtesy) return acc;
      if (p.pricingType === 'PER_PERSON') return acc + (p.cost || 0) * passengerCount;
      if (p.pricingType === 'HOURLY' && p.startTime && p.endTime && p.hourlyCost) {
        const d = (timeToMinutes(p.endTime) - timeToMinutes(p.startTime)) / 60;
        return acc + (d > 0 ? d * p.hourlyCost : 0);
      }
      return acc + (p.cost || 0);
    }, 0);

    const eventStatus = isPreScheduled ? 'PRE_SCHEDULED' : 'SCHEDULED';

    const eventData: Omit<EventType, 'id'> = {
      date: format(selectedDate, 'yyyy-MM-dd'),
      startTime: startTime,
      endTime: endTime,
      status: eventStatus as EventType['status'],
      paymentStatus: (editingEventId && originalPaymentStatus === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING') as PaymentStatus,
      boat: selectedBoat,
      boardingLocation: selectedBoardingLocation,
      tourType: selectedTourType,
      products: selectedProducts.map(p => ({ ...p, snapshotCost: p.cost })),
      rentalDiscount,
      // For editing legacy events, we want to clear the old discount fields upon saving
      discount: { type: 'FIXED', value: 0 },
      productsDiscount: { type: 'FIXED', value: 0 },
      client: selectedClient,
      passengerCount,
      subtotal,
      total,
      tax: tax || 0,
      taxDescription,
      observations,
      rentalRevenue,
      productsRevenue,
      rentalGross: boatRentalCost,
      productsGross: productsCost,
      rentalCost,
      productsCost: productsCostValue,
      taxCost: originalEvent?.taxCost || 0,
      additionalCosts: originalEvent?.additionalCosts || [],
    };

    if (isPreScheduled) {
      // Use existing timestamp if editing, otherwise set now
      eventData.preScheduledAt = originalEvent?.preScheduledAt || Date.now();
    }

    let savedEvent: EventType;
    if (editingEventId) {
      const updatedEvent = sanitizeObject({
        ...eventData,
        id: editingEventId,
        createdByUserId: originalEvent?.createdByUserId,
      }) as EventType;
      savedEvent = await eventRepository.updateEvent(updatedEvent);
    } else {
      const newEventData = sanitizeObject({
        ...eventData,
        createdByUserId: currentUser?.id,
      }) as Omit<EventType, 'id'>;
      savedEvent = await eventRepository.add(newEventData);
    }

    // Auto-sync
    await syncEvent(savedEvent);

    return selectedClient;
  }, [
    selectedDate,
    startTime,
    endTime,
    selectedBoat,
    selectedBoardingLocation,
    selectedTourType,
    selectedProducts,
    rentalDiscount,
    passengerCount,
    boatRentalCost,
    productsCost,
    subtotal,
    rentalDiscountValue,
    total,
    tax,
    taxDescription,
    observations,
    selectedClient,
    editingEventId,
    isPreScheduled,
    currentUser,
    originalEvent,
    originalPaymentStatus,
    syncEvent
  ]);

  useEffect(() => {
    if (!selectedClient) {
      setLoyaltySuggestion(null);
      return;
    }
    setLoyaltySuggestion(null);
  }, [selectedClient]);

  const dayOfWeek = useMemo(() => {
    if (!selectedDate) return null;
    return format(selectedDate, 'EEEE').toLowerCase() as DayOfWeek;
  }, [selectedDate]);

  const isBusinessClosed = useMemo(() => {
    if (!companyData?.businessHours || !dayOfWeek) return true;
    const dayConfig = companyData.businessHours[dayOfWeek];
    return dayConfig.isClosed || !dayConfig.startTime || !dayConfig.endTime;
  }, [companyData, dayOfWeek]);

  const availableTimeSlots = useMemo(() => {
    // Generate all minutes of the day (1440 slots)
    const allDaySlots = Array.from({ length: 1440 }, (_, i) => minutesToTime(i));

    if (!companyData || isBusinessClosed || !dayOfWeek) {
      return [];
    }
    const { startTime: businessStartTime, endTime: businessEndTime } = companyData.businessHours[dayOfWeek];
    const businessStartMin = timeToMinutes(businessStartTime);
    const businessEndMin = timeToMinutes(businessEndTime);

    // Initial filter by business hours (start time must be within business hours)
    // and must allow at least 30 min before closing.
    const validSlots = allDaySlots.filter(slot => {
      const min = timeToMinutes(slot);
      return min >= businessStartMin && min <= (businessEndMin - 30);
    });

    if (!selectedBoat) {
      return validSlots;
    }

    const orgTime = selectedBoat.organizationTimeMinutes || 0;
    const otherBoatEvents = scheduledEvents.filter(event => event.boat?.id === selectedBoat.id && event.id !== editingEventId);

    return validSlots.filter(slot => {
      const slotMin = timeToMinutes(slot);
      const slotEndMin = slotMin + 30; // Minimum duration

      return !otherBoatEvents.some(event => {
        const eventStartMin = timeToMinutes(event.startTime);
        const eventEndMin = timeToMinutes(event.endTime);

        // An event starting at slotMin is valid if its blocked window [slotMin - org, slotEndMin + org]
        // doesn't overlap with existing event's blocked window [eventStart - org, eventEnd + org].
        // This is equivalent to:
        // slotEndMin + org <= eventStartMin - org  => slotEndMin <= eventStartMin - 2*org
        // OR
        // slotMin - org >= eventEndMin + org  => slotMin >= eventEndMin + 2*org

        const isBefore = slotEndMin <= (eventStartMin - 2 * orgTime);
        const isAfter = slotMin >= (eventEndMin + 2 * orgTime);

        return !isBefore && !isAfter;
      });
    });
  }, [scheduledEvents, selectedBoat, editingEventId, companyData, dayOfWeek, isBusinessClosed]);

  const availableEndTimeSlots = useMemo(() => {
    if (!startTime || !selectedBoat) {
      return [];
    }

    const startMin = timeToMinutes(startTime);
    const orgTime = selectedBoat.organizationTimeMinutes || 0;

    // Generate options: startTime + n * 30
    const options: string[] = [];
    for (let n = 1; ; n++) {
      const endMin = startMin + n * 30;
      if (endMin > 1440) break; // End of day

      const endTimeStr = minutesToTime(endMin);

      // Check if this endTime exceeds business hours (if we want to enforce it)
      if (companyData && dayOfWeek) {
        const { endTime: businessEndTime } = companyData.businessHours[dayOfWeek];
        if (endMin > timeToMinutes(businessEndTime)) break;
      }

      // Check for conflicts with next events
      const hasConflict = scheduledEvents
        .filter(event => event.boat?.id === selectedBoat.id && event.id !== editingEventId)
        .some(event => {
          const eventStartMin = timeToMinutes(event.startTime);
          // Gap must be at least 2 * orgTime
          return endMin > (eventStartMin - 2 * orgTime) && startMin < (timeToMinutes(event.endTime) + 2 * orgTime);
        });

      if (hasConflict) break; // Cannot go further if we hit a conflict

      options.push(endTimeStr);
    }

    return options;
  }, [startTime, scheduledEvents, selectedBoat, editingEventId, companyData, dayOfWeek]);


  // Reset endTime when startTime changes
  useEffect(() => {
    if (availableEndTimeSlots.length > 0) {
      // If current endTime is not in the new available list, or if it's invalid, reset it.
      if (!availableEndTimeSlots.includes(endTime)) {
        setEndTime(availableEndTimeSlots[0]);
      }
    } else {
      setEndTime('');
    }
  }, [availableEndTimeSlots, startTime, endTime]);

  // Initial validation for startTime
  useEffect(() => {
    if (availableTimeSlots.length > 0 && !availableTimeSlots.includes(startTime)) {
      // Find closest available time or just pick first
       setStartTime(availableTimeSlots[0]);
    }
  }, [availableTimeSlots, startTime]);


  return {
    isLoading,
    editingEventId,
    selectedDate,
    startTime,
    endTime,
    scheduledEvents,
    isPreScheduled,
    availableBoats,
    selectedBoat,
    isCapacityExceeded,
    isBusinessClosed,
    availableBoardingLocations,
    selectedBoardingLocation,
    availableTourTypes,
    selectedTourType,
    availableProducts,
    selectedProducts,
    rentalDiscount,
    passengerCount,
    boatRentalCost,
    subtotal,
    totalDiscount,
    total,
    tax,
    taxDescription,
    observations,
    setObservations,
    selectedClient,
    clientSearchTerm,
    clientSearchResults,
    isSearching,
    loyaltySuggestion,
    availableTimeSlots,
    availableEndTimeSlots,
    isModalOpen,
    editingClient,
    newClientName,
    newClientPhone,
    setSelectedDate,
    setStartTime,
    setEndTime,
    setIsPreScheduled,
    handleBoatSelection,
    handleBoardingLocationSelection,
    handleTourTypeSelection,
    handleSaveTourType,
    updateHourlyProductTime,
    toggleProduct,
    toggleCourtesy,
    updateProductDiscount,
    updateDiscountType,
    updateDiscountValue,
    updatePassengerCount,
    updateTax,
    updateTaxDescription,
    handleClientSearch,
    selectClient,
    clearClientSelection,
    setNewClientName,
    setNewClientPhone,
    handleOpenModal,
    handleCloseModal,
    handleSaveClient,
    handleDeleteClient,
    createEvent,
    syncEvent,
  };
};
