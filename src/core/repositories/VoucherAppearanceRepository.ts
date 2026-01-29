// src/core/repositories/VoucherAppearanceRepository.ts
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export interface VoucherAppearanceData {
  id: string;
  watermarkImage: string | null;
}

export class VoucherAppearanceRepository {
  private static instance: VoucherAppearanceRepository;
  private docId = 'default';
  private collectionName = 'voucher_appearance';

  private constructor() {}

  public static getInstance(): VoucherAppearanceRepository {
    if (!VoucherAppearanceRepository.instance) {
      VoucherAppearanceRepository.instance = new VoucherAppearanceRepository();
    }
    return VoucherAppearanceRepository.instance;
  }

  async get(): Promise<VoucherAppearanceData> {
    const docRef = doc(db, this.collectionName, this.docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...docSnap.data() as VoucherAppearanceData, id: docSnap.id };
    }
    return { id: this.docId, watermarkImage: null };
  }

  async update(updatedData: VoucherAppearanceData): Promise<VoucherAppearanceData> {
    const { id, ...data } = updatedData;
    const docRef = doc(db, this.collectionName, this.docId);
    await setDoc(docRef, data, { merge: true });
    return updatedData;
  }
}
