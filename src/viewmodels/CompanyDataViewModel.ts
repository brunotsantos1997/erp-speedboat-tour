// src/viewmodels/CompanyDataViewModel.ts
import { useState, useEffect, useCallback } from 'react';
import type { CompanyData } from '../core/domain/types';
import { CompanyDataRepository } from '../core/repositories/CompanyDataRepository';

export const useCompanyDataViewModel = () => {
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const repository = CompanyDataRepository.getInstance();

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (isMounted) {
        setIsLoading(true);
      }
      await repository.get().catch(() => {
        if (isMounted) {
          setError('Falha ao carregar dados da empresa.');
        }
      });
    };
    
    fetchData();

    const unsubscribe = repository.subscribe((data) => {
      if (isMounted) {
        setCompanyData(data);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [repository]);

  const updateCompanyData = useCallback(
    async (data: Partial<Omit<CompanyData, 'id'>>) => {
      if (!companyData) return;

      try {
        const updatedData: CompanyData = { ...companyData, ...data };
        await repository.update(updatedData);
        setCompanyData(updatedData);
        return updatedData;
      } catch (e) {
        setError('Falha ao atualizar dados da empresa.');
        throw e;
      }
    },
    [companyData, repository]
  );

  return {
    companyData,
    isLoading,
    error,
    updateCompanyData,
  };
};
