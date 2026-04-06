import { doc, getDoc, setDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { VoucherTerms } from '../domain/types';
import type { User } from '../domain/User';

export class VoucherTermsRepository {
  private static instance: VoucherTermsRepository;
  private docId = 'default';
  private collectionName = 'voucher_terms';
  private data: VoucherTerms | null = null;
  private unsubscribe: Unsubscribe | null = null;
  private currentUser: User | null = null;
  private listeners: ((data: VoucherTerms | null) => void)[] = [];

  private constructor() {}

  public static getInstance(): VoucherTermsRepository {
    if (!VoucherTermsRepository.instance) {
      VoucherTermsRepository.instance = new VoucherTermsRepository();
    }
    return VoucherTermsRepository.instance;
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
      this.data = docSnap.exists()
        ? { ...(docSnap.data() as VoucherTerms), id: docSnap.id }
        : null;
      this.notifyListeners();
    });
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.data));
  }

  subscribe(listener: (data: VoucherTerms | null) => void) {
    this.listeners.push(listener);
    if (this.data) {
      listener(this.data);
    }
    return () => {
      this.listeners = this.listeners.filter((currentListener) => currentListener !== listener);
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

  async get(): Promise<VoucherTerms | null> {
    if (this.data) return this.data;

    const docRef = doc(db, this.collectionName, this.docId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return null;
    }

    this.data = { ...(docSnap.data() as VoucherTerms), id: docSnap.id };
    this.notifyListeners();
    return this.data;
  }

  async update(updatedData: VoucherTerms): Promise<VoucherTerms> {
    if (!this.currentUser || (this.currentUser.role !== 'OWNER' && this.currentUser.role !== 'SUPER_ADMIN')) {
      throw new Error('Voce nao tem permissao para alterar os termos do voucher.');
    }

    const { id, ...data } = updatedData;
    const docRef = doc(db, this.collectionName, this.docId);
    await setDoc(docRef, data, { merge: true });

    this.data = updatedData;
    this.notifyListeners();
    return updatedData;
  }
}
