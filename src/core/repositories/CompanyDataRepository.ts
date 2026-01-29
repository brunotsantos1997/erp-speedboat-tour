// src/core/repositories/CompanyDataRepository.ts
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { CompanyData } from '../domain/types';

export class CompanyDataRepository {
  private static instance: CompanyDataRepository;
  private docId = 'default';
  private collectionName = 'company_data';

  private constructor() {}

  public static getInstance(): CompanyDataRepository {
    if (!CompanyDataRepository.instance) {
      CompanyDataRepository.instance = new CompanyDataRepository();
    }
    return CompanyDataRepository.instance;
  }

  async get(): Promise<CompanyData | undefined> {
    const docRef = doc(db, this.collectionName, this.docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...docSnap.data() as CompanyData, id: docSnap.id };
    }

    return {
      id: this.docId,
      cnpj: '00.000.000/0001-00',
      phone: '(00) 00000-0000',
      appName: 'BoatManager',
      reservationFeePercentage: 30,
      businessHours: {
        sunday: { startTime: '08:00', endTime: '18:00', isClosed: true },
        monday: { startTime: '08:00', endTime: '18:00', isClosed: false },
        tuesday: { startTime: '08:00', endTime: '18:00', isClosed: false },
        wednesday: { startTime: '08:00', endTime: '18:00', isClosed: false },
        thursday: { startTime: '08:00', endTime: '18:00', isClosed: false },
        friday: { startTime: '08:00', endTime: '18:00', isClosed: false },
        saturday: { startTime: '08:00', endTime: '18:00', isClosed: true },
      },
      eventIntervalMinutes: 30,
    };
  }

  async update(updatedData: CompanyData): Promise<CompanyData> {
    const { id, ...data } = updatedData;
    const docRef = doc(db, this.collectionName, this.docId);
    await setDoc(docRef, data, { merge: true });
    return updatedData;
  }
}
