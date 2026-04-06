export const assertStrongPassword = (password: string) => {
  if (password.length < 8) {
    throw new Error('A senha deve ter pelo menos 8 caracteres.');
  }

  if (!/[A-Z]/.test(password)) {
    throw new Error('A senha deve conter pelo menos uma letra maiuscula.');
  }

  if (!/[a-z]/.test(password)) {
    throw new Error('A senha deve conter pelo menos uma letra minuscula.');
  }

  if (!/\d/.test(password)) {
    throw new Error('A senha deve conter pelo menos um numero.');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    throw new Error('A senha deve conter pelo menos um caractere especial.');
  }
};
