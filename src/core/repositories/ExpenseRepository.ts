// src/core/repositories/ExpenseRepository.ts
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
  type Unsubscribe
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Expense } from '../domain/types';
import type { User } from '../domain/User';

export interface IExpenseRepository {
  getAll(limitCount?: number): Promise<Expense[]>;
  getByDateRange(startDate: string, endDate: string): Promise<Expense[]>;
  add(expenseData: Omit<Expense, 'id'>): Promise<Expense>;
  update(updatedExpense: Expense): Promise<Expense>;
  remove(expenseId: string): Promise<void>;
  dispose(): void;
  initialize(user?: User): void;
  subscribe(callback: (data: Expense[]) => Unsubscribe): Unsubscribe;
  subscribeByDateRange(startDate: string, endDate: string, callback: (data: Expense[]) => void): Unsubscribe;
}

class ExpenseRepositoryImpl implements IExpenseRepository {
  private static instance: ExpenseRepositoryImpl;
  private collectionName = 'expenses';

  private constructor() {}

  public static getInstance(): ExpenseRepositoryImpl {
    if (!ExpenseRepositoryImpl.instance) {
      ExpenseRepositoryImpl.instance = new ExpenseRepositoryImpl();
    }
    return ExpenseRepositoryImpl.instance;
  }

  initialize(_user?: User): void {}

  subscribe(callback: (data: Expense[]) => void): Unsubscribe {
    const q = query(
      collection(db, this.collectionName),
      orderBy('date', 'desc'),
      limit(100)
    );
    return onSnapshot(q, (snapshot) => {
      const expenses = snapshot.docs.map(doc => ({
        ...doc.data() as Expense,
        id: doc.id
      }));
      callback(expenses);
    });
  }

  subscribeByDateRange(startDate: string, endDate: string, callback: (data: Expense[]) => void): Unsubscribe {
    const q = query(
      collection(db, this.collectionName),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const expenses = snapshot.docs.map(doc => ({
        ...doc.data() as Expense,
        id: doc.id
      }));
      callback(expenses);
    });
  }

  dispose(): void {}

  async getAll(limitCount: number = 100): Promise<Expense[]> {
    const q = query(
      collection(db, this.collectionName),
      orderBy('date', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data() as Expense,
      id: doc.id
    }));
  }

  async getByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    const q = query(
      collection(db, this.collectionName),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data() as Expense,
      id: doc.id
    }));
  }

  async add(expenseData: Omit<Expense, 'id'>): Promise<Expense> {
    const docRef = await addDoc(collection(db, this.collectionName), expenseData);
    return { id: docRef.id, ...expenseData };
  }

  async update(updatedExpense: Expense): Promise<Expense> {
    const { id, ...data } = updatedExpense;
    const docRef = doc(db, this.collectionName, id);

    await updateDoc(docRef, data);

    return updatedExpense;
  }

  async remove(expenseId: string): Promise<void> {
    const docRef = doc(db, this.collectionName, expenseId);

    await updateDoc(docRef, { isArchived: true });
  }
}

export const expenseRepository = ExpenseRepositoryImpl.getInstance();
