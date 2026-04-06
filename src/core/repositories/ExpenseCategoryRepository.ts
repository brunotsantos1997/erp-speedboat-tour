// src/core/repositories/ExpenseCategoryRepository.ts
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { ExpenseCategory } from '../domain/types';
import type { User } from '../domain/User';

export interface IExpenseCategoryRepository {
  getAll(): Promise<ExpenseCategory[]>;
  add(categoryData: Omit<ExpenseCategory, 'id'>): Promise<ExpenseCategory>;
  update(updatedCategory: ExpenseCategory): Promise<ExpenseCategory>;
  remove(categoryId: string): Promise<void>;
  dispose(): void;
  initialize(user?: User): void;
  subscribe(callback: (data: ExpenseCategory[]) => void): Unsubscribe;
}

class ExpenseCategoryRepositoryImpl implements IExpenseCategoryRepository {
  private static instance: ExpenseCategoryRepositoryImpl;
  private collectionName = 'expense_categories';
  private currentUser: User | null = null;

  private constructor() {}

  public static getInstance(): ExpenseCategoryRepositoryImpl {
    if (!ExpenseCategoryRepositoryImpl.instance) {
      ExpenseCategoryRepositoryImpl.instance = new ExpenseCategoryRepositoryImpl();
    }
    return ExpenseCategoryRepositoryImpl.instance;
  }

  initialize(user?: User) {
    if (user) {
      this.currentUser = user;
    }
  }

  subscribe(callback: (data: ExpenseCategory[]) => void): Unsubscribe {
    const q = query(collection(db, this.collectionName));
    return onSnapshot(q, (snapshot) => {
      const categories = snapshot.docs.map(doc => ({
        ...doc.data() as ExpenseCategory,
        id: doc.id
      }));
      callback(categories.filter(c => !c.isArchived));
    });
  }

  dispose() {
    this.currentUser = null;
  }

  async getAll(): Promise<ExpenseCategory[]> {
    const querySnapshot = await getDocs(collection(db, this.collectionName));
    return querySnapshot.docs
      .map(doc => ({
        ...doc.data() as ExpenseCategory,
        id: doc.id
      }))
      .filter(c => !c.isArchived);
  }

  private checkAdminPermission() {
    if (!this.currentUser || (this.currentUser.role !== 'OWNER' && this.currentUser.role !== 'SUPER_ADMIN' && this.currentUser.role !== 'ADMIN')) {
      throw new Error('Você não tem permissão para realizar esta ação.');
    }
  }

  async add(categoryData: Omit<ExpenseCategory, 'id'>): Promise<ExpenseCategory> {
    this.checkAdminPermission();
    const docRef = await addDoc(collection(db, this.collectionName), categoryData);
    return { id: docRef.id, ...categoryData };
  }

  async update(updatedCategory: ExpenseCategory): Promise<ExpenseCategory> {
    this.checkAdminPermission();
    const { id, ...data } = updatedCategory;
    const docRef = doc(db, this.collectionName, id);

    await updateDoc(docRef, data);

    return updatedCategory;
  }

  async remove(categoryId: string): Promise<void> {
    this.checkAdminPermission();
    const docRef = doc(db, this.collectionName, categoryId);

    await updateDoc(docRef, { isArchived: true });
  }
}

export const expenseCategoryRepository = ExpenseCategoryRepositoryImpl.getInstance();
