import { useCallback } from 'react';
import type { User, UserCommissionSettings, UserRole, UserStatus } from '../core/domain/User';
import { UserManagementService } from '../core/services/auth/UserManagementService';

/**
 * Admin ViewModel kept intentionally thin so role checks and Firestore writes
 * stay in auth services instead of leaking Firebase access into the UI layer.
 */
export const useUserManagementViewModel = () => {
  const getAllUsers = useCallback(
    async (currentUser: User): Promise<User[]> => UserManagementService.getAllUsers(currentUser),
    []
  );

  const updateUserStatus = useCallback(
    async (currentUser: User, userId: string, status: UserStatus): Promise<void> => {
      await UserManagementService.updateUserStatus(currentUser, userId, status);
    },
    []
  );

  const updateUserRole = useCallback(
    async (currentUser: User, userId: string, role: UserRole): Promise<void> => {
      await UserManagementService.updateUserRole(currentUser, userId, role);
    },
    []
  );

  const updateUserCommissionSettings = useCallback(
    async (currentUser: User, userId: string, settings: UserCommissionSettings): Promise<void> => {
      await UserManagementService.updateUserCommissionSettings(currentUser, userId, settings);
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
