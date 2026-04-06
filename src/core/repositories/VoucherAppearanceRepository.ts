// src/core/repositories/VoucherAppearanceRepository.ts
import { doc, getDoc, setDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { User } from '../domain/User';

export interface VoucherAppearanceData {
  id: string;
  watermarkImageUrl: string | null; // Changed from watermarkImage to watermarkImageUrl
  watermarkImageBase64?: string | null; // Keep for backward compatibility during migration
}

export class VoucherAppearanceRepository {
  private static instance: VoucherAppearanceRepository;
  private docId = 'default';
  private collectionName = 'voucher_appearance';
  private data: VoucherAppearanceData | null = null;
  private unsubscribe: Unsubscribe | null = null;
  private currentUser: User | null = null;
  private listeners: ((data: VoucherAppearanceData | null) => void)[] = [];

  private constructor() {}

  public static getInstance(): VoucherAppearanceRepository {
    if (!VoucherAppearanceRepository.instance) {
      VoucherAppearanceRepository.instance = new VoucherAppearanceRepository();
    }
    return VoucherAppearanceRepository.instance;
  }

  initialize(user?: User) {
    if (user) {
      this.currentUser = user;
    }
    if (this.unsubscribe) return;
    this.initListener();
  }

  private initListener() {
    const docRef = doc(db, this.collectionName, this.docId);
    this.unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        this.data = { ...docSnap.data() as VoucherAppearanceData, id: docSnap.id };
      } else {
        this.data = null;
      }
      this.notifyListeners();
    });
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.data));
  }

  subscribe(listener: (data: VoucherAppearanceData | null) => void) {
    this.listeners.push(listener);
    if (this.data) {
      listener(this.data);
    }
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  dispose() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.data = null;
    this.currentUser = null;
  }

  async get(): Promise<VoucherAppearanceData> {
    if (this.data) return this.data;

    const docRef = doc(db, this.collectionName, this.docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      this.data = { ...docSnap.data() as VoucherAppearanceData, id: docSnap.id };
      this.notifyListeners();
      return this.data;
    }

    const defaultData = { id: this.docId, watermarkImageUrl: null, watermarkImageBase64: null };

    this.data = defaultData;
    this.notifyListeners();

    return defaultData;
  }

  async update(updatedData: VoucherAppearanceData): Promise<VoucherAppearanceData> {
    if (!this.currentUser || (this.currentUser.role !== 'OWNER' && this.currentUser.role !== 'SUPER_ADMIN')) {
      throw new Error('Você não tem permissão para alterar a aparência do voucher.');
    }
    const { id, ...data } = updatedData;
    const docRef = doc(db, this.collectionName, this.docId);

    await setDoc(docRef, data, { merge: true });

    this.data = updatedData;
    return updatedData;
  }
}
