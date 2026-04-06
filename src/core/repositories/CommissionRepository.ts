// src/core/repositories/CommissionRepository.ts
import type { CommissionReportEntry } from '../domain/types';
import { eventRepository } from './EventRepository';
import { expenseRepository } from './ExpenseRepository';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { User } from '../domain/User';
import { format } from 'date-fns';
import { CommissionService } from '../domain/CommissionService';

export interface ICommissionRepository {
  getCommissionReport(
    startDate: Date,
    endDate: Date,
    userId?: string
  ): Promise<CommissionReportEntry[]>;
}

class CommissionRepository implements ICommissionRepository {
  async getCommissionReport(
    startDate: Date,
    endDate: Date,
    userId?: string
  ): Promise<CommissionReportEntry[]> {
    const startStr = format(startDate, 'yyyy-MM-dd');
    const endStr = format(endDate, 'yyyy-MM-dd');
    
    // Fetch only events in the period
    const filteredEvents = await eventRepository.getEventsByDateRange(startStr, endStr);

    // Fetch all users/profiles (Profiles collection is usually small, so getDocs is okay)
    const profilesSnap = await getDocs(collection(db, 'profiles'));
    const allUsers = profilesSnap.docs.map(doc => ({ ...doc.data() as User, id: doc.id }));

    const userMap = new Map<string, User>(allUsers.map(user => [user.id, user]));

    // Fetch expenses for the period to check for commission payments
    const expensesInPeriod = await expenseRepository.getByDateRange(startStr, endStr);

    const confirmedStatuses = ['SCHEDULED', 'COMPLETED', 'ARCHIVED_COMPLETED'];

    const validEvents = filteredEvents.filter(event => {
      if (!confirmedStatuses.includes(event.status)) {
        return false;
      }
      return !userId || event.createdByUserId === userId;
    });

    const report: CommissionReportEntry[] = [];

    for (const event of validEvents) {
      if (event.createdByUserId) {
        const user = userMap.get(event.createdByUserId);
        if (user && (user.commissionPercentage || user.commissionSettings)) {
          // Use CommissionService for centralized calculation
          const commissionCalculation = await CommissionService.calculateCommission(event, user);
          
          // Check if commission is paid using structured detection
          const isCommissionPaid = CommissionService.isCommissionPaid(event.id, expensesInPeriod);

          report.push({
            userId: user.id,
            userName: user.name,
            eventId: event.id,
            eventDate: event.date,
            eventTotalPrice: event.total,
            rentalRevenue: commissionCalculation.rentalBaseValue,
            commissionPercentage: user.commissionSettings ? 0 : (user.commissionPercentage || 0),
            commissionValue: commissionCalculation.commissionValue,
            clientName: event.client.name,
            status: isCommissionPaid ? 'PAID' : 'PENDING',
            expenseId: expensesInPeriod.find(exp =>
              !exp.isArchived &&
              exp.categoryId === 'COMMISSION' &&
              exp.eventId === event.id
            )?.id
          });
        }
      }
    }

    return report;
  }
}

export const commissionRepository = new CommissionRepository();
