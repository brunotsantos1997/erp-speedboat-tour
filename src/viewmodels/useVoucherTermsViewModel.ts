// src/viewmodels/useVoucherTermsViewModel.ts
import { useState, useEffect } from 'react';

const VOUCHER_TERMS_KEY = 'voucherTerms';

export const useVoucherTermsViewModel = () => {
  const [terms, setTerms] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading from a repository
    const savedTerms = localStorage.getItem(VOUCHER_TERMS_KEY);
    if (savedTerms) {
      setTerms(savedTerms);
    }
    setIsLoading(false);
  }, []);

  const saveTerms = async (content: string) => {
    // Simulate saving to a repository
    localStorage.setItem(VOUCHER_TERMS_KEY, content);
    setTerms(content);
    return Promise.resolve();
  };

  return {
    terms,
    isLoading,
    saveTerms,
  };
};
