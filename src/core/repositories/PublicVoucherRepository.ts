import {
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { CompanyData, EventType, Payment, VoucherTerms } from '../domain/types';

export interface PublicVoucherDocument {
  id: string;
  event: EventType;
  companyData: Pick<CompanyData, 'id' | 'appName' | 'cnpj' | 'phone' | 'reservationFeePercentage'> | null;
  voucherTerms: VoucherTerms | null;
  watermarkImageUrl: string | null;
  payments: Payment[];
  updatedAt: number;
}

export class PublicVoucherRepository {
  private static instance: PublicVoucherRepository;
  private collectionName = 'public_vouchers';

  private constructor() {}

  static getInstance(): PublicVoucherRepository {
    if (!PublicVoucherRepository.instance) {
      PublicVoucherRepository.instance = new PublicVoucherRepository();
    }
    return PublicVoucherRepository.instance;
  }

  async getByEventId(eventId: string): Promise<PublicVoucherDocument | null> {
    const snapshot = await getDoc(doc(db, this.collectionName, eventId));
    if (!snapshot.exists()) {
      return null;
    }

    return {
      ...(snapshot.data() as PublicVoucherDocument),
      id: snapshot.id
    };
  }

  subscribeToEvent(eventId: string, callback: (data: PublicVoucherDocument | null) => void): Unsubscribe {
    return onSnapshot(doc(db, this.collectionName, eventId), (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }

      callback({
        ...(snapshot.data() as PublicVoucherDocument),
        id: snapshot.id
      });
    });
  }

  async upsert(data: PublicVoucherDocument): Promise<void> {
    const { id, ...payload } = data;
    await setDoc(doc(db, this.collectionName, id), payload, { merge: true });
  }

  async remove(eventId: string): Promise<void> {
    await deleteDoc(doc(db, this.collectionName, eventId));
  }
}
