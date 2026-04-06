// src/ui/contexts/useToastContext.ts
import { useContext } from 'react';
import { ToastContext } from './ToastContext';

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};
