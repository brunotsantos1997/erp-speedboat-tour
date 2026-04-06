import { useState, useEffect } from 'react';
import { VoucherTermsRepository } from '../core/repositories/VoucherTermsRepository';
import { createVoucherTermsDraft } from '../core/domain/configurationTemplates';

export const useVoucherTermsViewModel = () => {
  const [terms, setTerms] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsInitialSetup, setNeedsInitialSetup] = useState(false);
  const repository = VoucherTermsRepository.getInstance();

  useEffect(() => {
    repository.get()
      .then((data) => {
        if (!data) {
          const draft = createVoucherTermsDraft();
          setTerms(draft.terms);
          setNeedsInitialSetup(true);
          setError('Os termos do voucher ainda nao foram cadastrados. Revise o modelo sugerido e salve para publicar o voucher.');
        }
      })
      .catch((loadError) => {
        console.error('Error loading voucher terms:', loadError);
        setError('Falha ao carregar termos do voucher.');
      })
      .finally(() => setIsLoading(false));

    const unsubscribe = repository.subscribe((data) => {
      if (data) {
        setTerms(data.terms);
        setNeedsInitialSetup(false);
        setError(null);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, [repository]);

  const saveTerms = async (content: string) => {
    try {
      await repository.update({ id: 'default', terms: content });
      setTerms(content);
      setNeedsInitialSetup(false);
      setError(null);
    } catch (saveError) {
      console.error('Error saving voucher terms:', saveError);
      throw saveError;
    }
  };

  return {
    terms,
    isLoading,
    error,
    needsInitialSetup,
    saveTerms
  };
};
