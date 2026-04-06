// src/core/repositories/TourTypeRepository.ts
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
import type { TourType } from '../domain/types';
import type { User } from '../domain/User';

export class TourTypeRepository {
  private static instance: TourTypeRepository;
  private collectionName = 'tour_types';

  private constructor() {}

  public static getInstance(): TourTypeRepository {
    if (!TourTypeRepository.instance) {
      TourTypeRepository.instance = new TourTypeRepository();
    }
    return TourTypeRepository.instance;
  }

  initialize(_user?: User) {}

  subscribe(callback: (data: TourType[]) => void): Unsubscribe {
    const q = query(collection(db, this.collectionName));
    return onSnapshot(q, (snapshot) => {
      const tourTypes = snapshot.docs.map(doc => ({
        ...doc.data() as TourType,
        id: doc.id
      }));
      callback(tourTypes.filter(t => !t.isArchived));
    });
  }

  dispose() {}

  async getAll(): Promise<TourType[]> {
    const querySnapshot = await getDocs(collection(db, this.collectionName));
    return querySnapshot.docs
      .map(doc => ({
        ...doc.data() as TourType,
        id: doc.id
      }))
      .filter(t => !t.isArchived);
  }

  async add(tourType: Omit<TourType, 'id'>): Promise<TourType> {
    const docRef = await addDoc(collection(db, this.collectionName), tourType);
    return { id: docRef.id, ...tourType };
  }

  async update(tourType: TourType): Promise<TourType> {
    const { id, ...data } = tourType;
    const docRef = doc(db, this.collectionName, id);

    await updateDoc(docRef, data);

    return tourType;
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);

    await updateDoc(docRef, { isArchived: true });
  }
}

export const tourTypeRepository = TourTypeRepository.getInstance();
