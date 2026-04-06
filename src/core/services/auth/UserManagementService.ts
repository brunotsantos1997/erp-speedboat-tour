import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import type { User, UserCommissionSettings, UserRole, UserStatus } from '../../domain/User';
import { db } from '../../../lib/firebase';

const ensureManagementPermission = (currentUser: User, message: string) => {
  if (currentUser.role === 'SELLER') {
    throw new Error(message);
  }
};

export const UserManagementService = {
  async getAllUsers(currentUser: User): Promise<User[]> {
    ensureManagementPermission(currentUser, 'Voce nao tem permissao para listar usuarios.');

    const snapshot = await getDocs(collection(db, 'profiles'));
    return snapshot.docs.map((document) => ({
      ...(document.data() as User),
      id: document.id,
    }));
  },

  async updateUserStatus(currentUser: User, userId: string, status: UserStatus): Promise<void> {
    ensureManagementPermission(currentUser, 'Voce nao tem permissao para alterar o status de usuarios.');
    await updateDoc(doc(db, 'profiles', userId), { status });
  },

  async updateUserRole(currentUser: User, userId: string, role: UserRole): Promise<void> {
    ensureManagementPermission(currentUser, 'Voce nao tem permissao para alterar cargos.');
    await updateDoc(doc(db, 'profiles', userId), { role });
  },

  async updateUserCommissionSettings(
    currentUser: User,
    userId: string,
    settings: UserCommissionSettings
  ): Promise<void> {
    ensureManagementPermission(currentUser, 'Voce nao tem permissao para alterar comissoes.');
    await updateDoc(doc(db, 'profiles', userId), { commissionSettings: settings });
  },
};
