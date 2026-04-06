import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../../lib/firebase';

export const PasswordResetService = {
  requestPasswordReset(email: string) {
    return sendPasswordResetEmail(auth, email);
  },
};
