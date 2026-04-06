// src/ui/contexts/ModalContext.ts
import React, { createContext } from 'react';

export interface ModalContextType {
  confirm: (title: string, message: string) => Promise<boolean>;
  showAlert: (title: string, message: React.ReactNode) => Promise<void>;
}

export const ModalContext = createContext<ModalContextType | undefined>(undefined);
