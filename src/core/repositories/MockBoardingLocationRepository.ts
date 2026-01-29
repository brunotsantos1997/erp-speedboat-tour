// src/core/repositories/MockBoardingLocationRepository.ts
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
import type { BoardingLocation } from '../domain/types';

export class MockBoardingLocationRepository {
  private static instance: MockBoardingLocationRepository;
  private locations: BoardingLocation[] = [];
  private collectionName = 'boarding_locations';
  private unsubscribe: Unsubscribe | null = null;
  private isInitialized = false;

  private constructor() {
    this.initListener();
  }

  public static getInstance(): MockBoardingLocationRepository {
    if (!MockBoardingLocationRepository.instance) {
      MockBoardingLocationRepository.instance = new MockBoardingLocationRepository();
    }
    return MockBoardingLocationRepository.instance;
  }

  private initListener() {
    const q = query(collection(db, this.collectionName));
    this.unsubscribe = onSnapshot(q, (snapshot) => {
      this.locations = snapshot.docs.map(doc => ({
        ...doc.data() as BoardingLocation,
        id: doc.id
      }));
      this.isInitialized = true;
    });
  }

  dispose() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.isInitialized = false;
    this.locations = [];
  }

  async getAll(): Promise<BoardingLocation[]> {
    if (this.isInitialized) {
      return this.locations.filter(l => !l.isArchived);
    }

    const querySnapshot = await getDocs(collection(db, this.collectionName));
    this.locations = querySnapshot.docs.map(doc => ({
      ...doc.data() as BoardingLocation,
      id: doc.id
    }));
    this.isInitialized = true;
    return this.locations.filter(l => !l.isArchived);
  }

  async add(location: Omit<BoardingLocation, 'id'>): Promise<BoardingLocation> {
    const docRef = await addDoc(collection(db, this.collectionName), location);
    return { id: docRef.id, ...location };
  }

  async update(location: BoardingLocation): Promise<BoardingLocation> {
    const { id, ...data } = location;
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, data as any);
    return location;
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, { isArchived: true });
  }
}

export const boardingLocationRepository = MockBoardingLocationRepository.getInstance();
