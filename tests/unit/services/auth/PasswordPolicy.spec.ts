import { describe, it, expect } from 'vitest';
import { assertStrongPassword } from '../../../../src/core/services/auth/PasswordPolicy';

describe('PasswordPolicy', () => {
  it('should throw an error for passwords shorter than 8 characters', () => {
    expect(() => assertStrongPassword('short')).toThrow('A senha deve ter pelo menos 8 caracteres.');
  });

  it('should throw an error for passwords without an uppercase letter', () => {
    expect(() => assertStrongPassword('nouppercase1!')).toThrow('A senha deve conter pelo menos uma letra maiúscula.');
  });

  it('should throw an error for passwords without a lowercase letter', () => {
    expect(() => assertStrongPassword('NOLOWERCASE1!')).toThrow('A senha deve conter pelo menos uma letra minúscula.');
  });

  it('should throw an error for passwords without a number', () => {
    expect(() => assertStrongPassword('NoNumbers!')).toThrow('A senha deve conter pelo menos um número.');
  });

  it('should throw an error for passwords without a special character', () => {
    expect(() => assertStrongPassword('NoSpecialChar1')).toThrow('A senha deve conter pelo menos um caractere especial.');
  });

  it('should not throw an error for a strong password', () => {
    expect(() => assertStrongPassword('StrongPassword1!')).not.toThrow();
  });

  it('should pass with a different strong password', () => {
    expect(() => assertStrongPassword('P@ssw0rd2023')).not.toThrow();
  });
});
