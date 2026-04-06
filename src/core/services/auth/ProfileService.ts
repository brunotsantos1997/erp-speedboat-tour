import DOMPurify from 'dompurify';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail as firebaseUpdateEmail,
  updatePassword as firebaseUpdatePassword,
  updateProfile as firebaseUpdateProfile,
} from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import type { User } from '../../domain/User';
import { auth, db } from '../../../lib/firebase';
import { assertStrongPassword } from './PasswordPolicy';

type ProfileUpdateInput = {
  name?: string;
  email?: string;
  newPassword?: string;
  oldPassword?: string;
};

const canEditProfile = (currentUser: User, userId: string) =>
  currentUser.id === userId ||
  currentUser.role === 'OWNER' ||
  currentUser.role === 'SUPER_ADMIN';

const requireEditableProfile = (currentUser: User, userId: string) => {
  if (!canEditProfile(currentUser, userId)) {
    throw new Error('Voce nao tem permissao para atualizar este perfil.');
  }
};

const requireAuthenticatedTargetUser = () => {
  if (!auth.currentUser) {
    throw new Error('Usuario autenticado nao encontrado.');
  }

  return auth.currentUser;
};

export const ProfileService = {
  async updateProfile(
    currentUser: User,
    userId: string,
    data: ProfileUpdateInput
  ): Promise<Partial<User>> {
    requireEditableProfile(currentUser, userId);

    const isEditingSelf = currentUser.id === userId;
    if (!isEditingSelf && (data.email || data.newPassword)) {
      throw new Error(
        'Alteracoes de email e senha de outro usuario exigem backend administrativo e nao podem ser feitas pelo cliente.'
      );
    }

    const updates: Partial<User> = {};
    const profileRef = doc(db, 'profiles', userId);

    if (data.name) {
      updates.name = DOMPurify.sanitize(data.name);

      if (isEditingSelf) {
        const firebaseUser = requireAuthenticatedTargetUser();
        await firebaseUpdateProfile(firebaseUser, { displayName: updates.name });
      }
    }

    if (data.email) {
      const firebaseUser = requireAuthenticatedTargetUser();
      if (!data.oldPassword) {
        throw new Error('Senha atual e obrigatoria para alterar o e-mail.');
      }

      const sanitizedEmail = DOMPurify.sanitize(data.email);
      const credential = EmailAuthProvider.credential(firebaseUser.email || '', data.oldPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await firebaseUpdateEmail(firebaseUser, sanitizedEmail);
      updates.email = sanitizedEmail;
    }

    if (data.newPassword) {
      const firebaseUser = requireAuthenticatedTargetUser();
      if (!data.oldPassword) {
        throw new Error('Senha atual e obrigatoria para alterar a senha.');
      }

      assertStrongPassword(data.newPassword);
      const credential = EmailAuthProvider.credential(firebaseUser.email || '', data.oldPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await firebaseUpdatePassword(firebaseUser, data.newPassword);
    }

    if (Object.keys(updates).length > 0) {
      await updateDoc(profileRef, updates);
    }

    return updates;
  },

  async updateCalendarSettings(
    currentUser: User,
    userId: string,
    settings: { calendarId?: string; autoSync: boolean }
  ): Promise<Partial<User>> {
    requireEditableProfile(currentUser, userId);
    await updateDoc(doc(db, 'profiles', userId), { calendarSettings: settings });
    return { calendarSettings: settings };
  },

  async updateCompletedTours(currentUser: User, tourId: string): Promise<Partial<User>> {
    const updatedTours = [...(currentUser.completedTours ?? []), tourId];
    await updateDoc(doc(db, 'profiles', currentUser.id), { completedTours: updatedTours });
    return { completedTours: updatedTours };
  },

  async resetTours(currentUser: User): Promise<Partial<User>> {
    await updateDoc(doc(db, 'profiles', currentUser.id), { completedTours: [] });
    return { completedTours: [] };
  },
};
