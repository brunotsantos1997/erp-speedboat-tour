import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../contexts/auth/useAuth';
import type { BoardingLocation, Boat, EventType, PaymentMethod } from '../core/domain/types';
import { boatRepository } from '../core/repositories/BoatRepository';
import { eventRepository } from '../core/repositories/EventRepository';
import { format } from 'date-fns';
import { timeToMinutes, minutesToTime } from '../core/utils/timeUtils';
import { boardingLocationRepository } from '../core/repositories/BoardingLocationRepository';
import { useToast } from '../ui/contexts/toast/useToast';
import { useEventSync } from './useEventSync';
import { logger } from '../core/common/Logger';
import { SharedEventService } from '../core/domain/SharedEventService';
import { TransactionService } from '../core/domain/TransactionService';

export const useSharedEventViewModel = (editingEventId?: string | null) => {
  const { currentUser } = useAuth();
  const { syncEvent } = useEventSync();
  const { showToast } = useToast();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [durationHours, setDurationHours] = useState(1);
  const [selectedBoat, setSelectedBoat] = useState<Boat | null>(null);
  const [selectedBoardingLocation, setSelectedBoardingLocation] = useState<BoardingLocation | null>(null);
  const [passengerCount, setPassengerCount] = useState(1);
  const [costPerPerson, setCostPerPerson] = useState(0);
  const [discountPerPerson, setDiscountPerPerson] = useState(0);
  const [generalDiscount, setGeneralDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [observations, setObservations] = useState('');

  const [availableBoats, setAvailableBoats] = useState<Boat[]>([]);
  const [availableBoardingLocations, setAvailableBoardingLocations] = useState<BoardingLocation[]>([]);
  const [scheduledEvents, setScheduledEvents] = useState<EventType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const existingSharedEvent = useMemo(() => {
    if (!selectedBoat || !startTime) return null;

    return scheduledEvents.find((event) =>
      event.id !== editingEventId &&
      event.boat.id === selectedBoat.id &&
      event.startTime === startTime &&
      SharedEventService.isSharedEvent(event) &&
      event.status !== 'CANCELLED' &&
      event.status !== 'ARCHIVED_CANCELLED'
    ) || null;
  }, [scheduledEvents, selectedBoat, startTime, editingEventId]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [boats, boardingLocations] = await Promise.all([
          boatRepository.getAll(),
          boardingLocationRepository.getAll()
        ]);

        const activeBoats = boats.filter((boat) => !boat.isArchived);
        setAvailableBoats(activeBoats);
        setAvailableBoardingLocations(boardingLocations);

        if (editingEventId) {
          const event = await eventRepository.getById(editingEventId);
          if (event) {
            setSelectedDate(new Date(`${event.date}T00:00:00`));
            setStartTime(event.startTime);
            setSelectedBoat(activeBoats.find((boat) => boat.id === event.boat.id) || event.boat);
            setSelectedBoardingLocation(boardingLocations.find((location) => location.id === event.boardingLocation.id) || event.boardingLocation);
            setPassengerCount(event.passengerCount);
            setObservations(event.observations || '');

            const startMinutes = timeToMinutes(event.startTime);
            const endMinutes = timeToMinutes(event.endTime);
            setDurationHours(Math.max(1, (endMinutes - startMinutes) / 60));

            if (event.passengerCount > 0) {
              setCostPerPerson((event.rentalGross || 0) / event.passengerCount);
              setDiscountPerPerson(((event.rentalGross || 0) - (event.rentalRevenue || 0)) / event.passengerCount);
            }
          }
        } else if (activeBoats.length > 0) {
          setSelectedBoat(activeBoats[0]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [editingEventId]);

  useEffect(() => {
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    eventRepository.getEventsByDate(dateString).then(setScheduledEvents);
  }, [selectedDate]);

  const endTime = useMemo(() => {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = startMinutes + (durationHours * 60);
    return minutesToTime(endMinutes % 1440);
  }, [startTime, durationHours]);

  const subtotal = useMemo(() => passengerCount * costPerPerson, [passengerCount, costPerPerson]);
  const totalDiscount = useMemo(() => (passengerCount * discountPerPerson) + generalDiscount, [passengerCount, discountPerPerson, generalDiscount]);
  const total = useMemo(() => Math.max(0, subtotal - totalDiscount), [subtotal, totalDiscount]);

  const availableTimeSlots = useMemo(() => {
    const slots = Array.from({ length: 24 }, (_, hour) => `${hour.toString().padStart(2, '0')}:00`);

    if (!selectedBoat) {
      return slots;
    }

    const organizationTime = selectedBoat.organizationTimeMinutes || 0;
    const nonSharedEvents = scheduledEvents.filter((event) =>
      event.id !== editingEventId &&
      event.boat.id === selectedBoat.id &&
      event.status !== 'CANCELLED' &&
      event.status !== 'ARCHIVED_CANCELLED' &&
      !SharedEventService.isSharedEvent(event)
    );

    return slots.filter((slot) => {
      const slotMinutes = timeToMinutes(slot);
      const slotEndMinutes = slotMinutes + (durationHours * 60);

      if (slotEndMinutes > 1440) {
        return false;
      }

      return !nonSharedEvents.some((event) => {
        const eventStartMinutes = timeToMinutes(event.startTime);
        const eventEndMinutes = timeToMinutes(event.endTime);
        const isBefore = slotEndMinutes <= (eventStartMinutes - 2 * organizationTime);
        const isAfter = slotMinutes >= (eventEndMinutes + 2 * organizationTime);
        return !isBefore && !isAfter;
      });
    });
  }, [durationHours, editingEventId, scheduledEvents, selectedBoat]);

  useEffect(() => {
    if (availableTimeSlots.length > 0 && !availableTimeSlots.includes(startTime)) {
      setStartTime(availableTimeSlots[0]);
    }
  }, [availableTimeSlots, startTime]);

  const createSharedEvent = async () => {
    if (!selectedBoat || !startTime || !selectedBoardingLocation) {
      showToast('Selecione barco, horario e local de embarque.');
      return false;
    }

    if (passengerCount > selectedBoat.capacity) {
      showToast('A quantidade de passageiros excede a capacidade do barco.');
      return false;
    }

    try {
      const draft = {
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime,
        endTime,
        boat: selectedBoat,
        boardingLocation: selectedBoardingLocation,
        passengerCount,
        subtotal,
        total,
        totalDiscount,
        observations,
        createdByUserId: currentUser?.id
      };

      if (editingEventId) {
        const originalEvent = await eventRepository.getById(editingEventId);
        if (!originalEvent) {
          throw new Error('Evento nao encontrado.');
        }

        const updatedEvent = SharedEventService.buildUpdatedSharedEvent(originalEvent, draft);
        const savedEvent = await eventRepository.updateEvent(updatedEvent);
        await syncEvent(savedEvent);
        showToast('Passeio compartilhado atualizado com sucesso!');
        return true;
      }

      if (existingSharedEvent) {
        const updatedEvent = SharedEventService.mergeIntoExistingEvent(existingSharedEvent, {
          boardingLocation: selectedBoardingLocation,
          passengerCount,
          subtotal,
          total,
          totalDiscount,
          observations
        });

        const result = await TransactionService.updateEventWithPayment(
          existingSharedEvent,
          updatedEvent,
          {
            eventId: existingSharedEvent.id,
            amount: total,
            method: paymentMethod,
            type: 'FULL',
            date: format(new Date(), 'yyyy-MM-dd'),
            timestamp: Date.now()
          },
          currentUser?.id || 'system',
          currentUser?.name || 'SharedEvent'
        );

        if (!result.success || !result.eventId) {
          throw new Error(result.error || 'Erro ao adicionar grupo ao passeio compartilhado.');
        }

        const savedEvent = await eventRepository.getById(result.eventId);
        if (savedEvent) {
          await syncEvent(savedEvent);
        }

        showToast('Passageiros adicionados ao passeio compartilhado existente!');
        return true;
      }

      const eventData = SharedEventService.buildEventData(draft);
      const result = await TransactionService.createEventWithPayment(
        eventData,
        {
          eventId: 'pending-shared-event',
          amount: total,
          method: paymentMethod,
          type: 'FULL',
          date: format(new Date(), 'yyyy-MM-dd'),
          timestamp: Date.now()
        },
        currentUser?.id || 'system',
        currentUser?.name || 'SharedEvent'
      );

      if (!result.success || !result.eventId) {
        throw new Error(result.error || 'Erro ao criar passeio compartilhado.');
      }

      const savedEvent = await eventRepository.getById(result.eventId);
      if (savedEvent) {
        await syncEvent(savedEvent);
      }

      showToast('Passeio compartilhado criado com sucesso!');
      return true;
    } catch (error: unknown) {
      logger.error('Error creating shared event', error as Error, {
        operation: 'createSharedEvent',
        selectedDate,
        startTime,
        passengerCount,
        selectedBoatId: selectedBoat?.id,
        selectedBoardingLocationId: selectedBoardingLocation?.id
      });
      showToast(error instanceof Error ? error.message : 'Erro ao criar passeio compartilhado.');
      return false;
    }
  };

  return {
    isLoading,
    selectedDate,
    setSelectedDate,
    startTime,
    setStartTime,
    durationHours,
    setDurationHours,
    selectedBoat,
    setSelectedBoat,
    availableBoardingLocations,
    selectedBoardingLocation,
    setSelectedBoardingLocation,
    passengerCount,
    setPassengerCount,
    costPerPerson,
    setCostPerPerson,
    discountPerPerson,
    setDiscountPerPerson,
    generalDiscount,
    setGeneralDiscount,
    paymentMethod,
    setPaymentMethod,
    observations,
    setObservations,
    availableBoats,
    availableTimeSlots,
    subtotal,
    totalDiscount,
    total,
    existingSharedEvent,
    createSharedEvent
  };
};
