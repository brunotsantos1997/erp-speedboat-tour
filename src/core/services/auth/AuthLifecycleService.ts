import { initializeRepositories, disposeRepositories } from '../../contexts/auth/repositoryLifecycle';
import { db } from '../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { User } from '../../core/domain/User';

export const AuthLifecycleService = {
  async initializeUserSession(firebaseUserUid: string): Promise<User | null> {
    const profileRef = doc(db, 'profiles', firebaseUserUid);
    const profileSnap = await getDoc(profileRef);

    if (profileSnap.exists()) {
      const profileData = profileSnap.data() as User;
      if (profileData.status === 'APPROVED') {
        const user = { ...profileData, id: firebaseUserUid };
        initializeRepositories(user);
        return user;
      } else {
        // User not approved, do not initialize repositories
        return null;
      }
    } else {
      // Profile not found, do not initialize repositories
      return null;
    }
  },

  disposeUserSession(): void {
    disposeRepositories();
  },
};
