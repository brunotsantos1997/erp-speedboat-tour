// src/core/repositories/VoucherTermsRepository.ts
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { VoucherTerms } from '../domain/types';

export class VoucherTermsRepository {
  private static instance: VoucherTermsRepository;
  private docId = 'default';
  private collectionName = 'voucher_terms';

  private constructor() {}

  public static getInstance(): VoucherTermsRepository {
    if (!VoucherTermsRepository.instance) {
      VoucherTermsRepository.instance = new VoucherTermsRepository();
    }
    return VoucherTermsRepository.instance;
  }

  async get(): Promise<VoucherTerms> {
    const docRef = doc(db, this.collectionName, this.docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...docSnap.data() as VoucherTerms, id: docSnap.id };
    }
    return { id: this.docId, terms: 'Termos padrão...' };
  }

  async update(updatedData: VoucherTerms): Promise<VoucherTerms> {
    const { id, ...data } = updatedData;
    const docRef = doc(db, this.collectionName, this.docId);
    await setDoc(docRef, data, { merge: true });
    return updatedData;
  }
}
