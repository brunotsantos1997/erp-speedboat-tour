import { doc, getDoc, setDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { BusinessHours, CompanyData, DayOfWeek } from '../domain/types';
import type { User } from '../domain/User';
import { createCompanyDataDraft } from '../domain/configurationTemplates';

const BUSINESS_DAYS: DayOfWeek[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday'
];

const ensureBusinessHours = (data: CompanyData): CompanyData => {
  const draft = createCompanyDataDraft(data.id);
  const businessHours = { ...(data.businessHours || ({} as BusinessHours)) };

  BUSINESS_DAYS.forEach((day) => {
    businessHours[day] = {
      ...draft.businessHours[day],
      ...businessHours[day]
    };
  });

  return {
    ...draft,
    ...data,
    businessHours
  };
};

export class CompanyDataRepository {
  private static instance: CompanyDataRepository;
  private docId = 'default';
  private collectionName = 'company_data';
  private data: CompanyData | null = null;
  private unsubscribe: Unsubscribe | null = null;
  private currentUser: User | null = null;
  private listeners: ((data: CompanyData | null) => void)[] = [];

  private constructor() {}

  public static getInstance(): CompanyDataRepository {
    if (!CompanyDataRepository.instance) {
      CompanyDataRepository.instance = new CompanyDataRepository();
    }
    return CompanyDataRepository.instance;
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
        ? ensureBusinessHours({ ...(docSnap.data() as CompanyData), id: docSnap.id })
        : null;
      this.notifyListeners();
    });
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.data));
  }

  subscribe(listener: (data: CompanyData | null) => void) {
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

  async get(): Promise<CompanyData | undefined> {
    if (this.data) return this.data;

    const docRef = doc(db, this.collectionName, this.docId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return undefined;
    }

    this.data = ensureBusinessHours({ ...(docSnap.data() as CompanyData), id: docSnap.id });
    this.notifyListeners();
    return this.data;
  }

  async update(updatedData: CompanyData): Promise<CompanyData> {
    if (!this.currentUser || (this.currentUser.role !== 'OWNER' && this.currentUser.role !== 'SUPER_ADMIN')) {
      throw new Error('Voce nao tem permissao para alterar as configuracoes da empresa.');
    }

    const normalizedData = ensureBusinessHours(updatedData);
    const { id, ...data } = normalizedData;
    const docRef = doc(db, this.collectionName, this.docId);

    await setDoc(docRef, data, { merge: true });

    this.data = normalizedData;
    this.notifyListeners();
    return normalizedData;
  }
}

export const companyDataRepository = CompanyDataRepository.getInstance();
