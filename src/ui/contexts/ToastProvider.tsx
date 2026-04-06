// src/ui/contexts/ToastProvider.tsx
import React from 'react';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/Toast';
import { ToastContext } from './ToastContext';

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toastMessage, showToast, hideToast } = useToast();

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toastMessage && <Toast message={toastMessage} onClose={hideToast} />}
    </ToastContext.Provider>
  );
};
