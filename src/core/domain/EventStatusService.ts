// src/core/domain/EventStatusService.ts
import type { EventType, Payment, PaymentType } from './types';
import { logger } from '../common/Logger';

export class EventStatusService {
  /**
   * Centralized rule: Auto-cancel PRE_SCHEDULED events after 24 hours
   */
  static shouldAutoCancel(event: EventType): boolean {
    if (event.status !== 'PRE_SCHEDULED' || !event.preScheduledAt) {
      return false;
    }

    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const shouldCancel = now - event.preScheduledAt > twentyFourHours;

    if (shouldCancel) {
      logger.info(`Event ${event.id} should be auto-cancelled`, {
        eventId: event.id,
        preScheduledAt: event.preScheduledAt,
        hoursElapsed: (now - event.preScheduledAt) / (60 * 60 * 1000)
      });
    }

    return shouldCancel;
  }

  /**
   * Build the canonical auto-cancelled state when a pre-scheduled event expires.
   */
  static getAutoCancelledEvent(event: EventType): EventType | null {
    if (!this.shouldAutoCancel(event)) {
      return null;
    }

    return {
      ...event,
      status: 'CANCELLED',
      autoCancelled: true
    };
  }

  /**
   * Centralized rule: Update event status based on payment
   */
  static updateStatusFromPayment(
    event: EventType,
    totalPaid: number,
    payments: Payment[]
  ): EventType {
    const updatedEvent = { ...event };

    // Rule 1: PRE_SCHEDULED -> SCHEDULED on first payment
    if (totalPaid > 0 && updatedEvent.status === 'PRE_SCHEDULED') {
      updatedEvent.status = 'SCHEDULED';
      logger.info(`Event ${event.id} moved from PRE_SCHEDULED to SCHEDULED`, {
        eventId: event.id,
        totalPaid,
        paymentsCount: payments.length
      });
    }

    // Rule 2: Update payment status
    updatedEvent.paymentStatus = totalPaid >= updatedEvent.total ? 'CONFIRMED' : 'PENDING';

    return updatedEvent;
  }

  /**
   * Suggest the next amount to charge for a payment action.
   */
  static getSuggestedPaymentAmount(
    event: EventType,
    totalPaid: number,
    type: PaymentType,
    reservationFeePercentage = 0.3
  ): number {
    if (type === 'DOWN_PAYMENT') {
      return Math.max(0, (event.total * reservationFeePercentage) - totalPaid);
    }

    return Math.max(0, event.total - totalPaid);
  }

  /**
   * Centralized rule: Archive completed/cancelled events
   */
  static archiveEvent(event: EventType): EventType {
    let archivedEvent: EventType;

    switch (event.status) {
      case 'COMPLETED':
        archivedEvent = { ...event, status: 'ARCHIVED_COMPLETED' as const };
        logger.info(`Event ${event.id} archived as completed`, { eventId: event.id });
        break;
      case 'CANCELLED':
        archivedEvent = { ...event, status: 'ARCHIVED_CANCELLED' as const };
        logger.info(`Event ${event.id} archived as cancelled`, { eventId: event.id });
        break;
      case 'PENDING_REFUND':
        archivedEvent = { ...event, status: 'REFUNDED' as const };
        logger.info(`Event ${event.id} marked as refunded`, { eventId: event.id });
        break;
      default:
        throw new Error(`Cannot archive event with status: ${event.status}`);
    }

    return archivedEvent;
  }

  /**
   * Determine the correct status when a user cancels an event.
   */
  static getCancellationStatus(event: EventType): EventType['status'] {
    return event.paymentStatus === 'CONFIRMED' ? 'PENDING_REFUND' : 'CANCELLED';
  }

  /**
   * Revert an auto-cancelled event back into a scheduled state.
   */
  static revertCancellation(event: EventType): EventType {
    return {
      ...event,
      status: 'SCHEDULED',
      autoCancelled: false
    };
  }

  /**
   * Update event state when a payment is deleted or rolled back.
   */
  static updateStatusAfterPaymentRemoval(
    event: EventType,
    totalPaid: number,
    reservationFeePercentage = 0.3
  ): EventType {
    const updatedEvent: EventType = {
      ...event,
      paymentStatus: totalPaid >= event.total ? 'CONFIRMED' : 'PENDING'
    };

    const reservationFee = event.total * reservationFeePercentage;
    if (totalPaid < reservationFee && updatedEvent.status === 'SCHEDULED') {
      updatedEvent.status = 'PRE_SCHEDULED';
      updatedEvent.preScheduledAt = Date.now();
    }

    return updatedEvent;
  }

  /**
   * Centralized rule: Validate if event can be edited
   */
  static canEditEvent(event: EventType, userRole: string, userId: string): boolean {
    // Owners and admins can edit any event
    if (['OWNER', 'SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
      return true;
    }

    // Regular users can only edit their own events
    if (event.createdByUserId === userId) {
      return true;
    }

    return false;
  }

  /**
   * Centralized rule: Get confirmed statuses for reporting
   */
  static getConfirmedStatuses(): readonly string[] {
    return ['SCHEDULED', 'COMPLETED', 'ARCHIVED_COMPLETED'] as const;
  }

  /**
   * Centralized rule: Get active (non-cancelled) statuses
   */
  static getActiveStatuses(): readonly string[] {
    return ['PRE_SCHEDULED', 'SCHEDULED', 'COMPLETED'] as const;
  }
}
