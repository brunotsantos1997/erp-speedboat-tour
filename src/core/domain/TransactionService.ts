// src/core/domain/TransactionService.ts
import type { EventType, Payment } from './types';
import { eventRepository } from '../repositories/EventRepository';
import { paymentRepository } from '../repositories/PaymentRepository';
import { logger } from '../common/Logger';
import { EventStatusService } from './EventStatusService';

export interface TransactionResult {
  success: boolean;
  eventId?: string;
  paymentId?: string;
  expenseIds?: string[];
  error?: string;
  rollbackData?: {
    originalEvent?: EventType;
    createdPaymentIds?: string[];
    createdExpenseIds?: string[];
  };
}

export class TransactionService {
  /**
   * Atomic transaction: Event + Payment + Status Update
   */
  static async createEventWithPayment(
    eventData: Omit<EventType, 'id'>,
    paymentData: Omit<Payment, 'id'>,
    userId: string,
    _userName: string
  ): Promise<TransactionResult> {
    const rollbackData: TransactionResult['rollbackData'] = {
      createdPaymentIds: [],
      createdExpenseIds: []
    };

    try {
      logger.info('Starting atomic transaction: create event with payment', {
        userId,
        eventTotal: eventData.total,
        paymentAmount: paymentData.amount
      });

      // Step 1: Create event
      const savedEvent = await eventRepository.add(eventData);
      
      // Step 2: Create payment with event reference
      const paymentWithEventRef = {
        ...paymentData,
        eventId: savedEvent.id
      };
      const savedPayment = await paymentRepository.add(paymentWithEventRef);
      rollbackData.createdPaymentIds = [savedPayment.id];

      // Step 3: Update event status based on payment
      const updatedEvent = EventStatusService.updateStatusFromPayment(
        savedEvent,
        paymentData.amount,
        [savedPayment]
      );

      const finalEvent = await eventRepository.updateEvent(updatedEvent);

      logger.info('Atomic transaction completed successfully', {
        eventId: finalEvent.id,
        paymentId: savedPayment.id
      });

      return {
        success: true,
        eventId: finalEvent.id,
        paymentId: savedPayment.id
      };

    } catch (error) {
      logger.error('Atomic transaction failed, attempting rollback', error as Error, {
        userId,
        rollbackData
      });

      await this.performRollback(rollbackData);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Atomic transaction: Update event totals/details + create payment
   */
  static async updateEventWithPayment(
    originalEvent: EventType,
    updatedEvent: EventType,
    paymentData: Omit<Payment, 'id'>,
    userId: string,
    _userName: string
  ): Promise<TransactionResult> {
    try {
      logger.info('Starting atomic transaction: update event with payment', {
        eventId: updatedEvent.id,
        paymentAmount: paymentData.amount,
        userId
      });

      const savedEvent = await eventRepository.updateEvent(updatedEvent);

      try {
        const savedPayment = await paymentRepository.add({
          ...paymentData,
          eventId: updatedEvent.id
        });

        return {
          success: true,
          eventId: savedEvent.id,
          paymentId: savedPayment.id
        };
      } catch (paymentError) {
        await eventRepository.updateEvent(originalEvent);
        throw paymentError;
      }
    } catch (error) {
      logger.error('Update event with payment transaction failed', error as Error, {
        eventId: updatedEvent.id,
        userId
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Atomic transaction: Confirm Payment + Update Event Status
   */
  static async confirmPaymentAndUpdateStatus(
    eventId: string,
    paymentData: Omit<Payment, 'id'>,
    userId: string,
    _userName: string
  ): Promise<TransactionResult> {
    try {
      logger.info('Starting atomic transaction: confirm payment', {
        eventId,
        paymentAmount: paymentData.amount
      });

      // Get current event
      const event = await eventRepository.getById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      // Step 1: Add payment
      const savedPayment = await paymentRepository.add(paymentData);

      // Step 2: Get all payments for this event
      const allPayments = await paymentRepository.getByEventId(eventId);
      const totalPaid = allPayments.reduce((acc, p) => acc + p.amount, 0);

      // Step 3: Update event status
      const updatedEvent = EventStatusService.updateStatusFromPayment(event, totalPaid, allPayments);

      let finalEvent: EventType;
      try {
        finalEvent = await eventRepository.updateEvent(updatedEvent);
      } catch (updateError) {
        await paymentRepository.remove(savedPayment.id);
        throw updateError;
      }

      logger.info('Payment confirmation transaction completed', {
        eventId,
        paymentId: savedPayment.id,
        totalPaid,
        newStatus: finalEvent.status
      });

      return {
        success: true,
        eventId: finalEvent.id,
        paymentId: savedPayment.id
      };

    } catch (error) {
      logger.error('Payment confirmation transaction failed', error as Error, {
        eventId,
        userId
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Atomic transaction: Cancel Event + Handle Payments
   */
  static async cancelEventWithRefunds(
    eventId: string,
    cancelReason: string,
    userId: string,
    _userName: string
  ): Promise<TransactionResult> {
    const rollbackData: TransactionResult['rollbackData'] = {};

    try {
      logger.info('Starting atomic transaction: cancel event', {
        eventId,
        cancelReason
      });

      // Get current event
      const event = await eventRepository.getById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      rollbackData.originalEvent = event;

      // Step 1: Get all payments for this event
      const payments = await paymentRepository.getByEventId(eventId);

      // Step 2: Update event status
      const cancelledEvent = {
        ...event,
        status: EventStatusService.getCancellationStatus(event),
        cancelReason,
        cancelledAt: Date.now()
      };

      const finalEvent = await eventRepository.updateEvent(cancelledEvent);

      // Step 3: Handle refunds if needed (simplified - would integrate with payment gateway)
      const refundablePayments = payments.filter(p => p.status === 'CONFIRMED');
      
      logger.info('Event cancellation transaction completed', {
        eventId,
        paymentsCount: payments.length,
        refundableCount: refundablePayments.length
      });

      return {
        success: true,
        eventId: finalEvent.id
      };

    } catch (error) {
      logger.error('Event cancellation transaction failed', error as Error, {
        eventId,
        userId
      });

      // Attempt to restore original event status
      if (rollbackData.originalEvent) {
        try {
          await eventRepository.updateEvent(rollbackData.originalEvent);
          logger.info('Rollback successful - original event restored', {
            eventId
          });
        } catch (rollbackError) {
          logger.error('Rollback failed - manual intervention required', rollbackError as Error, {
            eventId
          });
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private static async performRollback(rollbackData: NonNullable<TransactionResult['rollbackData']>) {
    logger.warn('Performing transaction rollback', rollbackData);

    // Rollback created payments
    if (rollbackData.createdPaymentIds) {
      for (const paymentId of rollbackData.createdPaymentIds) {
        try {
          await paymentRepository.remove(paymentId);
          logger.debug(`Rolled back payment: ${paymentId}`);
        } catch (error) {
          logger.error(`Failed to rollback payment: ${paymentId}`, error as Error);
        }
      }
    }
  }

  /**
   * Validate transaction prerequisites
   */
  static validateTransactionPrerequisites(eventData: Omit<EventType, 'id'>): string[] {
    const errors: string[] = [];

    if (!eventData.boat?.id) {
      errors.push('Boat is required');
    }

    if (!eventData.client?.id) {
      errors.push('Client is required');
    }

    if (!eventData.boardingLocation?.id) {
      errors.push('Boarding location is required');
    }

    if (eventData.total <= 0) {
      errors.push('Event total must be greater than 0');
    }

    if (eventData.passengerCount <= 0) {
      errors.push('Passenger count must be greater than 0');
    }

    return errors;
  }
}
