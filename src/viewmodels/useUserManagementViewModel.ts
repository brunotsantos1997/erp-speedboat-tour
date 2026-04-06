// src/viewmodels/useUserManagementViewModel.ts
import { useCallback } from 'react';
import { db } from '../lib/firebase';
import {
  doc,
  getDocs,
  updateDoc,
  collection,
} from 'firebase/firestore';
import type { User, UserRole, UserStatus, UserCommissionSettings } from '../core/domain/User';

/**
 * Gerencia operações administrativas de usuários:
 * listagem, alteração de status, role e configurações de comissão.
 *
 * Recebe o currentUser como parâmetro para não depender do AuthContext,
 * facilitando testes unitários.
 */
export const useUserManagementViewModel = () => {
  const getAllUsers = useCallback(async (currentUser: User): Promise<User[]> => {
    // Verificação básica de permissão - o enforcement real é feito server-side
    if (currentUser.role === 'SELLER') {
      throw new Error('Você não tem permissão para listar usuários.');
    }

    // As regras do Firestore já fazem o enforcement server-side,
    // filtrando apenas usuários que o currentUser tem permissão para ler
    const querySnapshot = await getDocs(collection(db, 'profiles'));
    
    return querySnapshot.docs.map((d) => ({
      ...d.data() as User,
      id: d.id,
    }));
  }, []);

  const updateUserStatus = useCallback(
    async (
      currentUser: User,
      userId: string,
      status: UserStatus
    ): Promise<void> => {
      // Verificação básica de permissão - o enforcement real é feito server-side
      if (currentUser.role === 'SELLER') {
        throw new Error('Você não tem permissão para alterar o status de usuários.');
      }

      // As regras do Firestore farão o enforcement server-side das hierarquias
      const profileRef = doc(db, 'profiles', userId);
      await updateDoc(profileRef, { status });
    },
    []
  );

  const updateUserRole = useCallback(
    async (
      currentUser: User,
      userId: string,
      role: UserRole
    ): Promise<void> => {
      // Verificação básica de permissão - o enforcement real é feito server-side
      if (currentUser.role === 'SELLER') {
        throw new Error('Você não tem permissão para alterar cargos.');
      }

      // As regras do Firestore farão o enforcement server-side das hierarquias
      const profileRef = doc(db, 'profiles', userId);
      await updateDoc(profileRef, { role });
    },
    []
  );

  const updateUserCommissionSettings = useCallback(
    async (
      currentUser: User,
      userId: string,
      settings: UserCommissionSettings
    ): Promise<void> => {
      // Verificação básica de permissão - o enforcement real é feito server-side
      if (currentUser.role === 'SELLER') {
        throw new Error('Você não tem permissão para alterar comissões.');
      }

      // As regras do Firestore farão o enforcement server-side das hierarquias
      const profileRef = doc(db, 'profiles', userId);
      await updateDoc(profileRef, { commissionSettings: settings });
    },
    []
  );

  return {
    getAllUsers,
    updateUserStatus,
    updateUserRole,
    updateUserCommissionSettings,
  };
};
