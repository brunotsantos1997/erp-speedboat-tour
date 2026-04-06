import { useState, useEffect, useCallback } from 'react';
import type { CompanyData } from '../core/domain/types';
import { CompanyDataRepository } from '../core/repositories/CompanyDataRepository';
import { createCompanyDataDraft } from '../core/domain/configurationTemplates';

export const useCompanyDataViewModel = () => {
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsInitialSetup, setNeedsInitialSetup] = useState(false);

  const repository = CompanyDataRepository.getInstance();

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (isMounted) {
        setIsLoading(true);
      }

      try {
        const data = await repository.get();
        if (!isMounted) {
          return;
        }

        if (!data) {
          setCompanyData(createCompanyDataDraft());
          setNeedsInitialSetup(true);
          setError('A configuracao da empresa ainda nao foi cadastrada. Preencha os dados e salve para liberar os modulos publicos e financeiros.');
        }
      } catch {
        if (isMounted) {
          setError('Falha ao carregar dados da empresa.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    const unsubscribe = repository.subscribe((data) => {
      if (!isMounted) {
        return;
      }

      if (data) {
        setCompanyData(data);
        setNeedsInitialSetup(false);
        setError(null);
      }
      setIsLoading(false);
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
        setNeedsInitialSetup(false);
        setError(null);
        return updatedData;
      } catch (updateError) {
        setError('Falha ao atualizar dados da empresa.');
        throw updateError;
      }
    },
    [companyData, repository]
  );

  return {
    companyData,
    isLoading,
    error,
    needsInitialSetup,
    updateCompanyData
  };
};
