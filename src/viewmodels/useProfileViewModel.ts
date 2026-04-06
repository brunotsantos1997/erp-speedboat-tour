import { useCallback } from 'react';
import type { User } from '../core/domain/User';
import { ProfileService } from '../core/services/auth/ProfileService';

/**
 * Keeps the ViewModel as a thin orchestration layer while profile persistence
 * and identity-sensitive rules live in dedicated auth services.
 */
export const useProfileViewModel = () => {
  const updateProfile = useCallback(
    async (
      currentUser: User,
      userId: string,
      data: {
        name?: string;
        email?: string;
        newPassword?: string;
        oldPassword?: string;
      },
      onUserUpdated: (updates: Partial<User>) => void
    ): Promise<void> => {
      const updates = await ProfileService.updateProfile(currentUser, userId, data);
      if (currentUser.id === userId && Object.keys(updates).length > 0) {
        onUserUpdated(updates);
      }
    },
    []
  );

  const updateCalendarSettings = useCallback(
    async (
      currentUser: User,
      userId: string,
      settings: { calendarId?: string; autoSync: boolean },
      onUserUpdated: (updates: Partial<User>) => void
    ): Promise<void> => {
      const updates = await ProfileService.updateCalendarSettings(currentUser, userId, settings);
      if (currentUser.id === userId) {
        onUserUpdated(updates);
      }
    },
    []
  );

  const updateCompletedTours = useCallback(
    async (
      currentUser: User,
      tourId: string,
      onUserUpdated: (updates: Partial<User>) => void
    ): Promise<void> => {
      const updates = await ProfileService.updateCompletedTours(currentUser, tourId);
      onUserUpdated(updates);
    },
    []
  );

  const resetTours = useCallback(
    async (currentUser: User, onUserUpdated: (updates: Partial<User>) => void): Promise<void> => {
      const updates = await ProfileService.resetTours(currentUser);
      onUserUpdated(updates);
    },
    []
  );

  return {
    updateProfile,
    updateCalendarSettings,
    updateCompletedTours,
    resetTours,
  };
};
