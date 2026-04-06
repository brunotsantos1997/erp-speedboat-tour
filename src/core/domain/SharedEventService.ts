import type { BoardingLocation, Boat, ClientProfile, EventType, TourType } from './types';
import { eventRepository } from '../repositories/EventRepository';
import { logger } from '../common/Logger';

export interface SharedEventConfig {
  minPassengers?: number;
  maxPassengers?: number;
}

export interface SharedEventDraft {
  date: string;
  startTime: string;
  endTime: string;
  boat: Boat;
  boardingLocation: BoardingLocation;
  passengerCount: number;
  subtotal: number;
  total: number;
  totalDiscount: number;
  observations?: string;
  createdByUserId?: string;
}

export interface SharedEventMergeInput {
  boardingLocation: BoardingLocation;
  passengerCount: number;
  subtotal: number;
  total: number;
  totalDiscount: number;
  observations?: string;
}

export class SharedEventService {
  static readonly SHARED_CLIENT_ID = 'shared-event-client';
  static readonly SHARED_CLIENT_NAME = 'Passeio Compartilhado';
  static readonly SHARED_TOUR_ID = 'shared-event-tour';
  static readonly SHARED_TOUR_NAME = 'Compartilhado';

  static getSharedClient(): ClientProfile {
    return {
      id: this.SHARED_CLIENT_ID,
      name: this.SHARED_CLIENT_NAME,
      phone: 'shared-event',
      totalTrips: 0
    };
  }

  static getSharedTourType(): TourType {
    return {
      id: this.SHARED_TOUR_ID,
      name: this.SHARED_TOUR_NAME,
      color: '#6B7280',
      isArchived: false
    };
  }

  static isSharedEvent(event?: Pick<EventType, 'tourType' | 'client'> | null): boolean {
    if (!event) {
      return false;
    }

    return event.client?.id === this.SHARED_CLIENT_ID ||
      event.tourType?.id === this.SHARED_TOUR_ID ||
      event.tourType?.name?.toLowerCase() === this.SHARED_TOUR_NAME.toLowerCase();
  }

  static requireBoardingLocation(location: BoardingLocation | null | undefined): BoardingLocation {
    if (!location?.id) {
      throw new Error('Selecione um local de embarque para o passeio compartilhado.');
    }

    return location;
  }

  static validateSharedEventConfig(
    config: SharedEventConfig,
    availableBoats: Boat[]
  ): string[] {
    const errors: string[] = [];
    const activeBoats = availableBoats.filter((boat) => !boat.isArchived);

    if (config.minPassengers && config.maxPassengers && config.minPassengers > config.maxPassengers) {
      errors.push('Minimum passengers cannot be greater than maximum passengers');
    }

    if (config.maxPassengers) {
      const maxPassengers = config.maxPassengers;
      const suitableBoats = activeBoats.filter((boat) =>
        boat.capacity >= (config.minPassengers || 0) &&
        boat.capacity <= maxPassengers
      );

      if (suitableBoats.length === 0) {
        errors.push(`No boats available for passenger range ${(config.minPassengers || 0)}-${maxPassengers}`);
      }
    }

    return errors;
  }

  static async checkSharedEventConflict(
    date: string,
    startTime: string,
    boatId: string,
    excludeEventId?: string
  ): Promise<EventType | null> {
    try {
      const dayEvents = await eventRepository.getEventsByDate(date);

      return dayEvents.find((event) =>
        event.id !== excludeEventId &&
        event.boat.id === boatId &&
        event.startTime === startTime &&
        this.isSharedEvent(event) &&
        event.status !== 'CANCELLED' &&
        event.status !== 'ARCHIVED_CANCELLED'
      ) || null;
    } catch (error) {
      logger.error('Failed to check shared event conflict', error as Error);
      return null;
    }
  }

  static buildEventData(draft: SharedEventDraft): Omit<EventType, 'id'> {
    const boardingLocation = this.requireBoardingLocation(draft.boardingLocation);

    return {
      date: draft.date,
      startTime: draft.startTime,
      endTime: draft.endTime,
      status: 'SCHEDULED',
      paymentStatus: 'CONFIRMED',
      boat: draft.boat,
      boardingLocation,
      tourType: this.getSharedTourType(),
      products: [],
      rentalDiscount: { type: 'FIXED', value: draft.totalDiscount },
      client: this.getSharedClient(),
      passengerCount: draft.passengerCount,
      subtotal: draft.subtotal,
      total: draft.total,
      observations: draft.observations || '',
      rentalRevenue: draft.total,
      productsRevenue: 0,
      rentalGross: draft.subtotal,
      productsGross: 0,
      rentalCost: 0,
      productsCost: 0,
      taxCost: 0,
      additionalCosts: [],
      createdByUserId: draft.createdByUserId
    };
  }

  static buildUpdatedSharedEvent(existingEvent: EventType, draft: SharedEventDraft): EventType {
    return {
      ...existingEvent,
      ...this.buildEventData(draft),
      id: existingEvent.id
    };
  }

  static mergeIntoExistingEvent(existingEvent: EventType, addition: SharedEventMergeInput): EventType {
    const boardingLocation = this.requireBoardingLocation(addition.boardingLocation);

    if (existingEvent.boardingLocation.id !== boardingLocation.id) {
      throw new Error('Ja existe um passeio compartilhado nesse horario com outro local de embarque.');
    }

    const nextPassengerCount = existingEvent.passengerCount + addition.passengerCount;
    if (nextPassengerCount > existingEvent.boat.capacity) {
      throw new Error('A capacidade maxima da embarcacao seria excedida ao adicionar este grupo.');
    }

    const existingDiscount = existingEvent.rentalDiscount?.type === 'FIXED'
      ? existingEvent.rentalDiscount.value
      : 0;

    return {
      ...existingEvent,
      client: this.getSharedClient(),
      tourType: this.getSharedTourType(),
      passengerCount: nextPassengerCount,
      subtotal: existingEvent.subtotal + addition.subtotal,
      total: existingEvent.total + addition.total,
      rentalGross: (existingEvent.rentalGross || 0) + addition.subtotal,
      rentalRevenue: (existingEvent.rentalRevenue || 0) + addition.total,
      rentalDiscount: {
        type: 'FIXED',
        value: existingDiscount + addition.totalDiscount
      },
      observations: this.mergeObservations(existingEvent.observations, addition.passengerCount, addition.observations)
    };
  }

  static async getSharedEvents(startDate: string, endDate: string): Promise<EventType[]> {
    try {
      const events = await eventRepository.getEventsByDateRange(startDate, endDate);
      return events.filter((event) => this.isSharedEvent(event));
    } catch (error) {
      logger.error('Failed to get shared events', error as Error);
      return [];
    }
  }

  static calculateSharedEventPricing(
    basePrice: number,
    passengerCount: number
  ): { totalPrice: number; pricePerPerson: number } {
    const pricePerPerson = basePrice;
    return {
      totalPrice: pricePerPerson * passengerCount,
      pricePerPerson
    };
  }

  private static mergeObservations(
    existingObservations: string | undefined,
    passengerCount: number,
    newObservations?: string
  ) {
    const nextGroupDescription = `Novo grupo: ${passengerCount} pessoas.${newObservations ? ` ${newObservations}` : ''}`.trim();

    if (!existingObservations) {
      return `Grupo inicial compartilhado. ${nextGroupDescription}`.trim();
    }

    return `${existingObservations}\n---\n${nextGroupDescription}`;
  }
}
