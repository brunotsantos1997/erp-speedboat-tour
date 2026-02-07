// src/viewmodels/useFinanceViewModel.ts
import { useState, useEffect, useMemo, useCallback } from 'react';
import type { EventType, Expense, Payment, Income } from '../core/domain/types';
import { eventRepository } from '../core/repositories/EventRepository';
import { expenseRepository } from '../core/repositories/ExpenseRepository';
import { incomeRepository } from '../core/repositories/IncomeRepository';
import { paymentRepository } from '../core/repositories/PaymentRepository';
import { startOfMonth, endOfMonth, format, subMonths, subDays } from 'date-fns';

export const useFinanceViewModel = () => {
  const [events, setEvents] = useState<EventType[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Trigger backfill for events missing financial data
      await eventRepository.backfillFinancialData();

      const [allEvents, allExpenses, allPayments, allIncomes] = await Promise.all([
        eventRepository.getAll(),
        expenseRepository.getAll(),
        paymentRepository.getAll(),
        incomeRepository.getAll()
      ]);
      setEvents(allEvents);
      setExpenses(allExpenses.filter((e: any) => !e.isArchived));
      setPayments(allPayments);
      setIncomes(allIncomes);
    } catch (err) {
      console.error('Failed to load financial data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredData = useMemo(() => {
    const startStr = format(startDate, 'yyyy-MM-dd');
    const endStr = format(endDate, 'yyyy-MM-dd');

    const confirmedStatuses = ['SCHEDULED', 'COMPLETED', 'ARCHIVED_COMPLETED'];
    const filteredEvents = events.filter(e => e.date >= startStr && e.date <= endStr && confirmedStatuses.includes(e.status));
    const filteredExpenses = expenses.filter(e => e.date >= startStr && e.date <= endStr && e.status === 'PAID');
    const filteredPayments = payments.filter(p => p.date >= startStr && p.date <= endStr);
    const filteredIncomes = incomes.filter(i => i.date >= startStr && i.date <= endStr);

    return { filteredEvents, filteredExpenses, filteredPayments, filteredIncomes };
  }, [events, expenses, payments, incomes, startDate, endDate]);

  const stats = useMemo(() => {
    const { filteredEvents, filteredExpenses, filteredIncomes } = filteredData;

    const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

    // Granular revenue from events in this period
    let boatRentalRevenue = 0;
    let productsRevenue = 0;
    let otherRevenue = filteredIncomes.reduce((acc, i) => acc + i.amount, 0);

    filteredEvents.forEach(event => {
        // If we have stored breakdown, use it, otherwise approximate
        if (event.rentalRevenue !== undefined && event.productsRevenue !== undefined) {
            boatRentalRevenue += event.rentalRevenue;
            productsRevenue += event.productsRevenue;
        } else {
            // Fallback calculation logic if not stored
            const boatCost = event.boat ? event.total * 0.7 : 0; // Rough estimate
            boatRentalRevenue += boatCost;
            productsRevenue += (event.total - boatCost);
        }
    });

    const totalRevenue = boatRentalRevenue + productsRevenue + otherRevenue;

    return {
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      boatRentalRevenue,
      productsRevenue,
      otherRevenue,
      eventCount: filteredEvents.length,
      expenseCount: filteredExpenses.length
    };
  }, [filteredData]);

  const cashFlowData = useMemo(() => {
    // Generate last 6 months of data
    const data = [];
    const confirmedStatuses = ['SCHEDULED', 'COMPLETED', 'ARCHIVED_COMPLETED'];

    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const mStart = format(startOfMonth(monthDate), 'yyyy-MM-dd');
      const mEnd = format(endOfMonth(monthDate), 'yyyy-MM-dd');

      const monthEvents = events.filter(e => e.date >= mStart && e.date <= mEnd && confirmedStatuses.includes(e.status));
      const monthExpenses = expenses.filter(e => e.date >= mStart && e.date <= mEnd && e.status === 'PAID');
      const monthIncomes = incomes.filter(i => i.date >= mStart && i.date <= mEnd);

      const eventRevenue = monthEvents.reduce((acc, e) => {
        if (e.rentalRevenue !== undefined && e.productsRevenue !== undefined) {
          return acc + e.rentalRevenue + e.productsRevenue;
        }
        return acc + e.total;
      }, 0);

      data.push({
        month: format(monthDate, 'MMM', { locale: undefined }), // Simplified for now
        revenue: eventRevenue + monthIncomes.reduce((acc, i) => acc + i.amount, 0),
        expenses: monthExpenses.reduce((acc, e) => acc + e.amount, 0),
      });
    }
    return data;
  }, [events, expenses, incomes]);

  const weeklyCashFlow = useMemo(() => {
    const data = [];
    const confirmedStatuses = ['SCHEDULED', 'COMPLETED', 'ARCHIVED_COMPLETED'];

    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dStr = format(date, 'yyyy-MM-dd');

      const dayEvents = events.filter(e => e.date === dStr && confirmedStatuses.includes(e.status));
      const dayIncomes = incomes.filter(i => i.date === dStr);
      const dayExpenses = expenses.filter(e => e.date === dStr && e.status === 'PAID');

      const revenue = dayEvents.reduce((acc, e) => acc + (e.total || 0), 0) + dayIncomes.reduce((acc, i) => acc + i.amount, 0);
      const exp = dayExpenses.reduce((acc, e) => acc + e.amount, 0);

      data.push({
        day: format(date, 'dd/MM'),
        revenue,
        expenses: exp,
      });
    }
    return data;
  }, [events, expenses, incomes]);

  const cashBook = useMemo(() => {
    const startStr = format(startDate, 'yyyy-MM-dd');
    const endStr = format(endDate, 'yyyy-MM-dd');

    const combined = [
      ...incomes.map(i => ({
        id: i.id,
        date: i.date,
        amount: i.amount,
        description: i.description,
        type: 'INCOME' as const,
        timestamp: i.timestamp
      })),
      ...expenses.map(e => ({
        id: e.id,
        date: e.date,
        amount: e.amount,
        description: e.description,
        type: 'EXPENSE' as const,
        timestamp: e.timestamp
      })),
      ...payments.map(p => {
        const event = events.find(ev => ev.id === p.eventId);
        return {
          id: p.id,
          date: p.date,
          amount: p.amount,
          description: event
            ? `Pagamento: ${event.client.name} (${event.boat.name})`
            : `Pagamento de Evento (${p.type})`,
          type: 'PAYMENT' as const,
          timestamp: p.timestamp,
          eventId: p.eventId
        };
      })
    ].filter(item => item.date >= startStr && item.date <= endStr);

    return combined.sort((a, b) => {
        if (b.date !== a.date) return b.date.localeCompare(a.date);
        return b.timestamp - a.timestamp;
    });
  }, [incomes, expenses, payments, startDate, endDate]);

  const deleteEntry = async (id: string, type: 'INCOME' | 'EXPENSE' | 'PAYMENT') => {
    if (!window.confirm('Tem certeza que deseja excluir este registro financeiro?')) return;
    setIsDeleting(true);
    try {
      if (type === 'INCOME') {
        await incomeRepository.remove(id);
      } else if (type === 'EXPENSE') {
        await expenseRepository.remove(id);
      } else if (type === 'PAYMENT') {
        const payment = payments.find(p => p.id === id);
        if (payment) {
          await paymentRepository.remove(id);

          // Update event status
          const event = await eventRepository.getById(payment.eventId);
          if (event) {
            const remainingPayments = await paymentRepository.getByEventId(event.id);
            const totalPaid = remainingPayments.reduce((acc, p) => acc + p.amount, 0);
            const reservationFee = event.total * 0.3;

            let updatedEvent = { ...event };

            // If total paid drops below 30% and it was scheduled, move back to pre-scheduled?
            // Actually, usually we just keep it as is unless it's a critical change.
            // But let's at least update the paymentStatus.
            if (totalPaid < event.total) {
              updatedEvent.paymentStatus = 'PENDING';
            }
            if (totalPaid < reservationFee && updatedEvent.status === 'SCHEDULED') {
              updatedEvent.status = 'PRE_SCHEDULED';
              updatedEvent.preScheduledAt = Date.now(); // Reset timer?
            }

            await eventRepository.updateEvent(updatedEvent);
          }
        }
      }
      await loadData();
    } catch (err) {
      console.error('Failed to delete entry:', err);
      alert('Erro ao excluir registro.');
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    loading,
    isDeleting,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    stats,
    cashFlowData,
    weeklyCashFlow,
    cashBook,
    deleteEntry,
    refresh: loadData
  };
};
