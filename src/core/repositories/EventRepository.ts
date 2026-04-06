// src/core/repositories/EventRepository.ts
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  getDoc,
  deleteDoc,
  type Unsubscribe,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { EventType } from '../domain/types';
import type { User } from '../domain/User';
import { timeToMinutes } from '../utils/timeUtils';

export interface IEventRepository {
  getById(eventId: string): Promise<EventType | undefined>;
  getEventsByDate(date: string): Promise<EventType[]>;
  getEventsByDateRange(startDate: string, endDate: string): Promise<EventType[]>;
  getEventsByClient(clientId: string): Promise<EventType[]>;
  add(event: Omit<EventType, 'id'>): Promise<EventType>;
  updateEvent(event: EventType): Promise<EventType>;
  remove(eventId: string): Promise<void>;
  getAll(limitCount?: number): Promise<EventType[]>;
  dispose(): void;
  initialize(user?: User): void;
  subscribe(callback: (data: EventType[]) => void): Unsubscribe;
  subscribeToDateRange(startDate: string, endDate: string, callback: (data: EventType[]) => void): Unsubscribe;
  subscribeToNotifications(callback: (data: EventType[]) => void): Unsubscribe;
  subscribeToId(id: string, callback: (data: EventType | undefined) => void): Unsubscribe;
  subscribeToClientEvents(clientId: string, callback: (data: EventType[]) => void): Unsubscribe;
}

class EventRepositoryImpl implements IEventRepository {
  private collectionName = 'events';
  private currentUser: User | null = null;

  constructor() {}

  initialize(user?: User) {
    if (user) {
      this.currentUser = user;
    }
  }

  subscribe(callback: (data: EventType[]) => void): Unsubscribe {
    const q = query(
      collection(db, this.collectionName),
      orderBy('date', 'desc'),
      limit(100)
    );

    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        ...doc.data() as EventType,
        id: doc.id
      }));
      callback(events);
    });
  }

  subscribeToDateRange(startDate: string, endDate: string, callback: (data: EventType[]) => void): Unsubscribe {
    const q = query(
      collection(db, this.collectionName),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date'),
      orderBy('startTime')
    );

    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        ...doc.data() as EventType,
        id: doc.id
      }));
      callback(events);
    });
  }

  subscribeToNotifications(callback: (data: EventType[]) => void): Unsubscribe {
    const q = query(
      collection(db, this.collectionName),
      where('status', 'in', ['COMPLETED', 'CANCELLED', 'PENDING_REFUND'])
    );

    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        ...doc.data() as EventType,
        id: doc.id
      }));
      callback(events);
    });
  }

  subscribeToId(id: string, callback: (data: EventType | undefined) => void) {
    const docRef = doc(db, this.collectionName, id);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback({ ...docSnap.data() as EventType, id: docSnap.id });
      } else {
        callback(undefined);
      }
    });
  }

  subscribeToClientEvents(clientId: string, callback: (data: EventType[]) => void) {
    const q = query(collection(db, this.collectionName), where('client.id', '==', clientId));
    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        ...doc.data() as EventType,
        id: doc.id
      }));
      callback(events);
    });
  }

  dispose() {
    this.currentUser = null;
  }

  async getById(eventId: string): Promise<EventType | undefined> {
    const docRef = doc(db, this.collectionName, eventId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...docSnap.data() as EventType, id: docSnap.id };
    }
    return undefined;
  }

  async getEventsByDate(date: string): Promise<EventType[]> {
    const q = query(
      collection(db, this.collectionName),
      where('date', '==', date)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data() as EventType,
      id: doc.id
    }));
  }

  async getEventsByDateRange(startDate: string, endDate: string): Promise<EventType[]> {
    const q = query(
      collection(db, this.collectionName),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data() as EventType,
      id: doc.id
    }));
  }

  async getEventsByClient(clientId: string): Promise<EventType[]> {
    const q = query(collection(db, this.collectionName), where('client.id', '==', clientId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data() as EventType,
      id: doc.id
    }));
  }

  async getAll(limitCount: number = 100): Promise<EventType[]> {
    const q = query(
      collection(db, this.collectionName),
      orderBy('date', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data() as EventType,
      id: doc.id
    }));
  }

  private isTimeConflict(eventA: Omit<EventType, 'id'>, eventB: EventType): boolean {
    if (eventA.date !== eventB.date || eventA.boat?.id !== eventB.boat?.id) {
      return false;
    }

    const orgTime = eventA.boat?.organizationTimeMinutes || 0;

    const startA = timeToMinutes(eventA.startTime);
    const endA = timeToMinutes(eventA.endTime);
    const startB = timeToMinutes(eventB.startTime);
    const endB = timeToMinutes(eventB.endTime);

    return (startA - orgTime) < (endB + orgTime) && (endA + orgTime) > (startB - orgTime);
  }

  async add(eventData: Omit<EventType, 'id'>): Promise<EventType> {
    if (!this.currentUser) {
      throw new Error('Você deve estar logado para agendar eventos.');
    }
    if (!eventData.boat?.id || !eventData.client?.id || !eventData.boardingLocation?.id) {
      throw new Error('Dados incompletos para criação do passeio.');
    }
    
    // Optimized conflict check: only check same day and same boat
    const conflictingEvents = await this.getEventsByDate(eventData.date);
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    const boatConflicts = conflictingEvents.filter(existingEvent =>
      existingEvent.boat?.id === eventData.boat.id &&
      existingEvent.status !== 'CANCELLED' &&
      existingEvent.status !== 'ARCHIVED_CANCELLED' &&
      existingEvent.status !== 'REFUNDED' &&
      existingEvent.status !== 'PENDING_REFUND' &&
      this.isTimeConflict(eventData, existingEvent)
    );

    for (const conflict of boatConflicts) {
      if (conflict.status === 'SCHEDULED') {
        throw new Error('Este horário já está agendado e confirmado.');
      }
      if (conflict.status === 'PRE_SCHEDULED' && conflict.preScheduledAt && (now - conflict.preScheduledAt < twentyFourHours)) {
        throw new Error('Este horário está pré-reservado. A vaga será liberada se o pagamento não for confirmado em 24h.');
      }
    }

    const docRef = await addDoc(collection(db, this.collectionName), eventData);
    const newEvent = { ...eventData, id: docRef.id };

    return newEvent;
  }

  async updateEvent(updatedEvent: EventType): Promise<EventType> {
    if (!this.currentUser) {
      throw new Error('Você deve estar logado para atualizar eventos.');
    }
    if (!updatedEvent.id || !updatedEvent.boat?.id || !updatedEvent.client?.id) {
      throw new Error('Dados incompletos para atualização do passeio.');
    }
    if (this.currentUser.role !== 'OWNER' && this.currentUser.role !== 'SUPER_ADMIN' && this.currentUser.role !== 'ADMIN' && updatedEvent.createdByUserId !== this.currentUser.id) {
      throw new Error('Você não tem permissão para alterar este evento.');
    }

    const conflictingEvents = await this.getEventsByDate(updatedEvent.date);
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    const boatConflicts = conflictingEvents.filter(existingEvent =>
      existingEvent.id !== updatedEvent.id &&
      existingEvent.boat?.id === updatedEvent.boat.id &&
      existingEvent.status !== 'CANCELLED' &&
      existingEvent.status !== 'ARCHIVED_CANCELLED' &&
      existingEvent.status !== 'REFUNDED' &&
      existingEvent.status !== 'PENDING_REFUND' &&
      this.isTimeConflict(updatedEvent, existingEvent)
    );

    for (const conflict of boatConflicts) {
      if (conflict.status === 'SCHEDULED') {
        throw new Error('Este horário já está agendado e confirmado por outro evento.');
      }
      if (conflict.status === 'PRE_SCHEDULED' && conflict.preScheduledAt && (now - conflict.preScheduledAt < twentyFourHours)) {
        throw new Error('Este horário está pré-reservado por outro evento.');
      }
    }

    const { id, ...data } = updatedEvent;
    const docRef = doc(db, this.collectionName, id);

    await updateDoc(docRef, data);

    return updatedEvent;
  }

  async remove(eventId: string): Promise<void> {
    const docRef = doc(db, this.collectionName, eventId);
    await deleteDoc(docRef);
  }
}

export const eventRepository = new EventRepositoryImpl();
