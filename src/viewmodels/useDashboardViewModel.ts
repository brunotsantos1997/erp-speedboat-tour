import { useState, useEffect, useMemo, useCallback } from 'react';
import { startOfDay, isWithinInterval, startOfWeek, endOfWeek, getMonth, isSameDay, format, startOfMonth, endOfMonth } from 'date-fns';
import type { EventType, PaymentMethod, PaymentType, Payment } from '../core/domain/types';
import { logger } from '../core/common/Logger';
import { EventStatusService } from '../core/domain/EventStatusService';
import { TransactionService } from '../core/domain/TransactionService';
import { eventRepository } from '../core/repositories/EventRepository';
import { paymentRepository } from '../core/repositories/PaymentRepository';
import { useToast } from '../ui/contexts/toast/useToast';
import { useEventSync } from './useEventSync';

const parseLocalDate = (dateString: string) => new Date(`${dateString}T00:00`);

export const useDashboardViewModel = () => {
  const [eventsForPeriod, setEventsForPeriod] = useState<EventType[]>([]);
  const [notificationEvents, setNotificationEvents] = useState<EventType[]>([]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const { syncEvent } = useEventSync();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activeEventForPayment, setActiveEventForPayment] = useState<EventType | null>(null);
  const [paymentType, setPaymentType] = useState<'DOWN_PAYMENT' | 'BALANCE' | 'FULL'>('DOWN_PAYMENT');
  const [defaultPaymentAmount, setDefaultPaymentAmount] = useState(0);
  const [error] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));

  const periodStart = useMemo(() => format(startOfMonth(selectedDate), 'yyyy-MM-dd'), [selectedDate]);
  const periodEnd = useMemo(() => format(endOfMonth(selectedDate), 'yyyy-MM-dd'), [selectedDate]);

  useEffect(() => {
    const unsubscribeEvents = eventRepository.subscribeToDateRange(
      periodStart,
      periodEnd,
      (events) => {
        setEventsForPeriod(events);
        setIsLoading(false);

        events.forEach(async (event) => {
          const cancelledEvent = EventStatusService.getAutoCancelledEvent(event);
          if (!cancelledEvent) {
            return;
          }

          try {
            const savedEvent = await eventRepository.updateEvent(cancelledEvent);
            await syncEvent(savedEvent);
          } catch (autoCancelError) {
            console.error(`Failed to auto-cancel event ${event.id}:`, autoCancelError);
          }
        });
      }
    );

    const unsubscribeNotifications = eventRepository.subscribeToNotifications(setNotificationEvents);
    const unsubscribePayments = paymentRepository.subscribe(setAllPayments);

    return () => {
      unsubscribeEvents();
      unsubscribeNotifications();
      unsubscribePayments();
    };
  }, [periodStart, periodEnd, syncEvent]);

  const initiatePayment = useCallback(async (eventId: string, type: 'DOWN_PAYMENT' | 'BALANCE' | 'FULL') => {
    const event = eventsForPeriod.find(e => e.id === eventId);
    if (!event) {
      return;
    }

    const payments = await paymentRepository.getByEventId(eventId);
    const totalPaid = payments.reduce((acc, payment) => acc + payment.amount, 0);
    const suggested = EventStatusService.getSuggestedPaymentAmount(event, totalPaid, type);

    setActiveEventForPayment(event);
    setPaymentType(type);
    setDefaultPaymentAmount(suggested);
    setIsPaymentModalOpen(true);
  }, [eventsForPeriod]);

  const confirmPaymentRecord = useCallback(async (amount: number, method: PaymentMethod, type: PaymentType) => {
    if (!activeEventForPayment) {
      return;
    }

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
        activeEventForPayment.createdByUserId || 'system',
        'Dashboard'
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
    } catch (paymentError: unknown) {
      logger.error('Failed to confirm payment', paymentError as Error, {
        eventId: activeEventForPayment?.id,
        amount,
        method,
        type,
        operation: 'confirmPaymentRecord'
      });
      showToast(paymentError instanceof Error ? paymentError.message : 'Erro ao confirmar pagamento.');
    }
  }, [activeEventForPayment, showToast, syncEvent]);

  const processNotification = useCallback(async (eventId: string) => {
    try {
      const eventToUpdate = notificationEvents.find(e => e.id === eventId);
      if (!eventToUpdate) {
        return;
      }

      const updatedEvent = EventStatusService.archiveEvent(eventToUpdate);
      const toastMessage =
        eventToUpdate.status === 'COMPLETED'
          ? 'Conclusao de passeio arquivada.'
          : eventToUpdate.status === 'CANCELLED'
            ? 'Cancelamento arquivado.'
            : 'Estorno confirmado.';

      const savedEvent = await eventRepository.updateEvent(updatedEvent);
      await syncEvent(savedEvent);
      showToast(toastMessage);
    } catch (notificationError) {
      console.error('Failed to process notification:', notificationError);
      showToast('Erro ao processar a notificacao.');
    }
  }, [notificationEvents, showToast, syncEvent]);

  const revertCancellation = useCallback(async (eventId: string) => {
    try {
      const eventToUpdate = notificationEvents.find(e => e.id === eventId);
      if (!eventToUpdate) {
        return;
      }

      const updatedEvent = EventStatusService.revertCancellation(eventToUpdate);
      const savedEvent = await eventRepository.updateEvent(updatedEvent);
      await syncEvent(savedEvent);
      showToast('Cancelamento revertido e reserva confirmada!');
    } catch (revertError: unknown) {
      logger.error('Failed to revert cancellation', revertError as Error, {
        eventId,
        operation: 'revertCancellation'
      });
      showToast(revertError instanceof Error ? revertError.message : 'Erro ao reverter cancelamento.');
    }
  }, [notificationEvents, showToast, syncEvent]);

  const today = startOfDay(new Date());

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return eventsForPeriod.filter(event => {
      if (event.status !== 'SCHEDULED' && event.status !== 'PRE_SCHEDULED') {
        return false;
      }

      const eventEndTime = new Date(`${event.date}T${event.endTime}`);
      return eventEndTime > now;
    });
  }, [eventsForPeriod]);

  const eventsForSelectedDate = useMemo(() =>
    upcomingEvents.filter(event => isSameDay(parseLocalDate(event.date), selectedDate)),
  [upcomingEvents, selectedDate]);

  const eventsThisWeek = useMemo(() => {
    const start = startOfWeek(today);
    const end = endOfWeek(today);
    return upcomingEvents.filter(event => isWithinInterval(parseLocalDate(event.date), { start, end }));
  }, [upcomingEvents, today]);

  const pendingPayments = useMemo(() =>
    upcomingEvents.filter(event => event.paymentStatus === 'PENDING'),
  [upcomingEvents]);

  const monthlyStats = useMemo(() => {
    const currentMonth = getMonth(today);
    const monthlyEvents = eventsForPeriod.filter(event =>
      getMonth(parseLocalDate(event.date)) === currentMonth &&
      (event.status === 'SCHEDULED' || event.status === 'COMPLETED' || event.status === 'ARCHIVED_COMPLETED')
    );

    let realizedRevenue = 0;
    let pendingRevenue = 0;

    monthlyEvents.forEach(event => {
      const eventPayments = allPayments.filter(payment => payment.eventId === event.id);
      const totalPaid = eventPayments.reduce((acc, payment) => acc + payment.amount, 0);

      realizedRevenue += Math.min(event.total, totalPaid);
      pendingRevenue += Math.max(0, event.total - totalPaid);
    });

    return { realizedRevenue, pendingRevenue, totalEvents: monthlyEvents.length };
  }, [allPayments, eventsForPeriod, today]);

  const calendarEvents = useMemo(() =>
    upcomingEvents.map(event => parseLocalDate(event.date)),
  [upcomingEvents]);

  return {
    isLoading,
    error,
    upcomingEvents,
    notificationEvents,
    eventsForSelectedDate,
    eventsThisWeek,
    pendingPayments,
    monthlyStats,
    calendarEvents,
    selectedDate,
    setSelectedDate,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    activeEventForPayment,
    paymentType,
    defaultPaymentAmount,
    initiatePayment,
    confirmPaymentRecord,
    processNotification,
    revertCancellation,
  };
};
