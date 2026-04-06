import { useCallback } from 'react';
import { PasswordResetService } from '../core/services/auth/PasswordResetService';

export const usePasswordResetViewModel = () => {
  const requestPasswordReset = useCallback(async (email: string): Promise<void> => {
    await PasswordResetService.requestPasswordReset(email);
  }, []);

  return {
    requestPasswordReset,
  };
};
