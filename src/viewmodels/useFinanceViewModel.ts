// src/viewmodels/useFinanceViewModel.ts
import { useState, useEffect, useMemo, useCallback } from 'react';
import type { EventType, Expense, Payment, Income } from '../core/domain/types';
import { eventRepository } from '../core/repositories/EventRepository';
import { expenseRepository } from '../core/repositories/ExpenseRepository';
import { incomeRepository } from '../core/repositories/IncomeRepository';
import { paymentRepository } from '../core/repositories/PaymentRepository';
import { startOfMonth, endOfMonth, format, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const useFinanceViewModel = () => {
  const [events, setEvents] = useState<EventType[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));

  const fetchData = useCallback(async () => {
    setLoading(true);
    const startStr = format(startDate, 'yyyy-MM-dd');
    const endStr = format(endDate, 'yyyy-MM-dd');

    try {
      const [fetchedEvents, fetchedExpenses, fetchedPayments, fetchedIncomes] = await Promise.all([
        eventRepository.getEventsByDateRange(startStr, endStr),
        expenseRepository.getByDateRange(startStr, endStr),
        paymentRepository.getAll(), // Full historical data for accurate reports
        incomeRepository.getByDateRange(startStr, endStr)
      ]);

      setEvents(fetchedEvents);
      setExpenses(fetchedExpenses.filter(e => !e.isArchived));
      setPayments(fetchedPayments);
      setIncomes(fetchedIncomes);
    } catch (error) {
      console.error("Failed to fetch finance data:", error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
    
    const startStr = format(startDate, 'yyyy-MM-dd');
    const endStr = format(endDate, 'yyyy-MM-dd');

    // Subscribe to changes in the current period
    const unsubEvents = eventRepository.subscribeToDateRange(startStr, endStr, setEvents);
    const unsubExpenses = expenseRepository.subscribeByDateRange(startStr, endStr, (data) => setExpenses(data.filter(e => !e.isArchived)));
    const unsubIncomes = incomeRepository.subscribeByDateRange(startStr, endStr, setIncomes);
    
    // Payments are more global, but let's keep a limited subscription for immediate feedback
    const unsubPayments = paymentRepository.subscribe(setPayments);

    return () => {
      unsubEvents();
      unsubExpenses();
      unsubIncomes();
      unsubPayments();
    };
  }, [startDate, endDate, fetchData]);

  const stats = useMemo(() => {
    const confirmedStatuses = ['SCHEDULED', 'COMPLETED', 'ARCHIVED_COMPLETED'];
    const filteredEvents = events.filter(e => confirmedStatuses.includes(e.status));
    const filteredExpenses = expenses.filter(e => e.status === 'PAID');
    const filteredIncomes = incomes;

    const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

    let realizedFromEvents = 0;
    let pendingFromEvents = 0;
    let boatRentalRealized = 0;
    let productsRealized = 0;
    let totalEventsValue = 0;

    filteredEvents.forEach(event => {
        totalEventsValue += event.total;
        const eventPayments = payments.filter(p => p.eventId === event.id);
        const totalPaidForEvent = eventPayments.reduce((acc, p) => acc + p.amount, 0);

        const realized = Math.min(event.total, totalPaidForEvent);
        const pending = Math.max(0, event.total - totalPaidForEvent);

        realizedFromEvents += realized;
        pendingFromEvents += pending;

        if (event.total > 0) {
            const ratio = realized / event.total;
            boatRentalRealized += (event.rentalRevenue || 0) * ratio;
            productsRealized += (event.productsRevenue || 0) * ratio;
        }
    });

    const otherRevenue = filteredIncomes.reduce((acc, i) => acc + i.amount, 0);
    const totalRealizedRevenue = realizedFromEvents + otherRevenue;

    return {
      totalRevenue: totalRealizedRevenue,
      projectedRevenue: pendingFromEvents,
      averageProjectedValue: filteredEvents.length > 0 ? totalEventsValue / filteredEvents.length : 0,
      totalExpenses,
      netProfit: totalRealizedRevenue - totalExpenses,
      boatRentalRevenue: boatRentalRealized,
      productsRevenue: productsRealized,
      otherRevenue,
      eventCount: filteredEvents.length,
      expenseCount: filteredExpenses.length
    };
  }, [events, expenses, incomes, payments]);

  const cashFlowData = useMemo(() => {
    const data = [];
    const projectedStatuses = ['SCHEDULED', 'COMPLETED', 'ARCHIVED_COMPLETED', 'PRE_SCHEDULED'];

    // Generate data for the last 6 months
    const currentDate = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthStartStr = format(monthStart, 'yyyy-MM-dd');
      const monthEndStr = format(monthEnd, 'yyyy-MM-dd');

      // Filter events and incomes for this month
      const monthEvents = events.filter(e => 
        projectedStatuses.includes(e.status) && 
        e.date >= monthStartStr && 
        e.date <= monthEndStr
      );
      const monthIncomes = incomes.filter(i => 
        i.date >= monthStartStr && 
        i.date <= monthEndStr
      );

      // Calculate realized revenue from incomes
      const realized = monthIncomes.reduce((acc, i) => acc + i.amount, 0);
      
      // Calculate pending revenue from events
      let pending = 0;
      monthEvents.forEach(e => {
        const ePayments = payments.filter(p => p.eventId === e.id);
        const ePaid = ePayments.reduce((acc, p) => acc + p.amount, 0);
        pending += Math.max(0, e.total - ePaid);
      });

      // Calculate expenses for this month
      const monthExpenses = expenses.filter(e => 
        e.status === 'PAID' && 
        e.date >= monthStartStr && 
        e.date <= monthEndStr
      );
      const expensesTotal = monthExpenses.reduce((acc, e) => acc + e.amount, 0);

      data.push({
        month: format(monthDate, 'MMM', { locale: ptBR }),
        projected: pending,
        realized: realized,
        expenses: expensesTotal,
      });
    }
    
    return data;
  }, [events, expenses, incomes, payments]);

  const dailyCashFlow = useMemo(() => {
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const projectedStatuses = ['SCHEDULED', 'COMPLETED', 'ARCHIVED_COMPLETED', 'PRE_SCHEDULED'];
    const displayDays = days.slice(-31);

    return displayDays.map(date => {
      const dStr = format(date, 'yyyy-MM-dd');
      const dayEvents = events.filter(e => e.date === dStr && projectedStatuses.includes(e.status));
      const dayIncomes = incomes.filter(i => i.date === dStr);
      const dayExpenses = expenses.filter(e => e.date === dStr && e.status === 'PAID');

      let dayRealized = dayIncomes.reduce((acc, i) => acc + i.amount, 0);
      let dayPending = 0;

      dayEvents.forEach(e => {
          const ePayments = payments.filter(p => p.eventId === e.id);
          const ePaid = ePayments.reduce((acc, p) => acc + p.amount, 0);
          dayRealized += Math.min(e.total, ePaid);
          dayPending += Math.max(0, e.total - ePaid);
      });

      return {
        day: format(date, 'dd/MM'),
        projected: dayPending,
        realized: dayRealized,
        expenses: dayExpenses.reduce((acc, e) => acc + e.amount, 0),
      };
    });
  }, [events, expenses, incomes, payments, startDate, endDate]);

  return {
    loading,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    stats,
    cashFlowData,
    dailyCashFlow,
    refresh: fetchData
  };
};
