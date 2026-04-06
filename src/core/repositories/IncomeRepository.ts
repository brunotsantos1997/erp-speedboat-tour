// src/core/repositories/IncomeRepository.ts
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  type Unsubscribe,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Income } from '../domain/types';
import type { User } from '../domain/User';

export interface IIncomeRepository {
  getAll(limitCount?: number): Promise<Income[]>;
  getByDateRange(startDate: string, endDate: string): Promise<Income[]>;
  add(incomeData: Omit<Income, 'id'>): Promise<Income>;
  update(updatedIncome: Income): Promise<Income>;
  remove(incomeId: string): Promise<void>;
  dispose(): void;
  initialize(user?: User): void;
  subscribe(callback: (data: Income[]) => void): Unsubscribe;
  subscribeByDateRange(startDate: string, endDate: string, callback: (data: Income[]) => void): Unsubscribe;
}

class IncomeRepositoryImpl implements IIncomeRepository {
  private static instance: IncomeRepositoryImpl;
  private collectionName = 'incomes';
  private currentUser: User | null = null;

  private constructor() {}

  public static getInstance(): IncomeRepositoryImpl {
    if (!IncomeRepositoryImpl.instance) {
      IncomeRepositoryImpl.instance = new IncomeRepositoryImpl();
    }
    return IncomeRepositoryImpl.instance;
  }

  initialize(user?: User) {
    if (user) {
      this.currentUser = user;
    }
  }

  subscribe(callback: (data: Income[]) => void): Unsubscribe {
    const q = query(
      collection(db, this.collectionName),
      orderBy('date', 'desc'),
      limit(100)
    );
    return onSnapshot(q, (snapshot) => {
      const incomes = snapshot.docs.map(doc => ({
        ...doc.data() as Income,
        id: doc.id
      }));
      callback(incomes);
    });
  }

  subscribeByDateRange(startDate: string, endDate: string, callback: (data: Income[]) => void): Unsubscribe {
    const q = query(
      collection(db, this.collectionName),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const incomes = snapshot.docs.map(doc => ({
        ...doc.data() as Income,
        id: doc.id
      }));
      callback(incomes);
    });
  }

  dispose() {
    this.currentUser = null;
  }

  async getAll(limitCount: number = 100): Promise<Income[]> {
    const q = query(
      collection(db, this.collectionName),
      orderBy('date', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data() as Income,
      id: doc.id
    }));
  }

  async getByDateRange(startDate: string, endDate: string): Promise<Income[]> {
    const q = query(
      collection(db, this.collectionName),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data() as Income,
      id: doc.id
    }));
  }

  private checkAdminPermission() {
    if (!this.currentUser || (this.currentUser.role !== 'OWNER' && this.currentUser.role !== 'SUPER_ADMIN' && this.currentUser.role !== 'ADMIN')) {
      throw new Error('Você não tem permissão para realizar esta ação.');
    }
  }

  async add(incomeData: Omit<Income, 'id'>): Promise<Income> {
    this.checkAdminPermission();
    const docRef = await addDoc(collection(db, this.collectionName), incomeData);
    return { id: docRef.id, ...incomeData };
  }

  async update(updatedIncome: Income): Promise<Income> {
    this.checkAdminPermission();
    const { id, ...data } = updatedIncome;
    const docRef = doc(db, this.collectionName, id);

    await updateDoc(docRef, data);

    return updatedIncome;
  }

  async remove(incomeId: string): Promise<void> {
    this.checkAdminPermission();
    const docRef = doc(db, this.collectionName, incomeId);

    await deleteDoc(docRef);
  }
}

export const incomeRepository = IncomeRepositoryImpl.getInstance();
