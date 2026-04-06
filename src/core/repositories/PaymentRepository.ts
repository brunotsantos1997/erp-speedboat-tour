// src/core/repositories/PaymentRepository.ts
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  where,
  limit,
  orderBy,
  deleteDoc,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Payment } from '../domain/types';

export interface IPaymentRepository {
  getByEventId(eventId: string): Promise<Payment[]>;
  subscribeToEventPayments(eventId: string, callback: (data: Payment[]) => void): Unsubscribe;
  add(paymentData: Omit<Payment, 'id'>): Promise<Payment>;
  getAll(limitCount?: number): Promise<Payment[]>;
  update(paymentId: string, data: Partial<Payment>): Promise<void>;
  remove(paymentId: string): Promise<void>;
  dispose(): void;
  initialize(): void;
  subscribe(callback: (data: Payment[]) => void): Unsubscribe;
}

class PaymentRepositoryImpl implements IPaymentRepository {
  private static instance: PaymentRepositoryImpl;
  private collectionName = 'payments';

  private constructor() {}

  public static getInstance(): PaymentRepositoryImpl {
    if (!PaymentRepositoryImpl.instance) {
      PaymentRepositoryImpl.instance = new PaymentRepositoryImpl();
    }
    return PaymentRepositoryImpl.instance;
  }

  initialize(): void {
    // User context not needed - security handled by Firebase rules
  }

  subscribe(callback: (data: Payment[]) => void): Unsubscribe {
    // Limited global listener for dashboard/summary, latest 100 payments
    const q = query(
      collection(db, this.collectionName),
      orderBy('timestamp', 'desc'),
      limit(100)
    );
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ ...doc.data() as Payment, id: doc.id })));
    });
  }

  subscribeToEventPayments(eventId: string, callback: (data: Payment[]) => void): Unsubscribe {
    const q = query(collection(db, this.collectionName), where('eventId', '==', eventId));
    return onSnapshot(q, (snapshot) => {
      const payments = snapshot.docs.map(doc => ({
        ...doc.data() as Payment,
        id: doc.id
      }));
      callback(payments);
    });
  }

  dispose() {
    // Cleanup handled by Firebase listeners
  }

  async getAll(limitCount: number = 100): Promise<Payment[]> {
    const q = query(
      collection(db, this.collectionName),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data() as Payment,
      id: doc.id
    }));
  }

  async getByEventId(eventId: string): Promise<Payment[]> {
    const q = query(collection(db, this.collectionName), where('eventId', '==', eventId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data() as Payment,
      id: doc.id
    }));
  }

  async add(paymentData: Omit<Payment, 'id'>): Promise<Payment> {
    const docRef = await addDoc(collection(db, this.collectionName), paymentData);
    return { id: docRef.id, ...paymentData };
  }

  async update(paymentId: string, data: Partial<Payment>): Promise<void> {
    const docRef = doc(db, this.collectionName, paymentId);
    await updateDoc(docRef, data);
  }

  async remove(paymentId: string): Promise<void> {
    const docRef = doc(db, this.collectionName, paymentId);
    await deleteDoc(docRef);
  }
}

export const paymentRepository = PaymentRepositoryImpl.getInstance();
