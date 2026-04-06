// src/viewmodels/VoucherAppearanceViewModel.ts
import { useState, useEffect, useCallback } from 'react';
import type { VoucherAppearanceData } from '../core/repositories/VoucherAppearanceRepository';
import { VoucherAppearanceRepository } from '../core/repositories/VoucherAppearanceRepository';

export const useVoucherAppearanceViewModel = () => {
  const [appearanceData, setAppearanceData] = useState<VoucherAppearanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const repository = VoucherAppearanceRepository.getInstance();

  useEffect(() => {
    repository.get().catch(() => setError('Falha ao carregar aparência do voucher.'));

    const unsubscribe = repository.subscribe((data) => {
      setAppearanceData(data);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [repository]);

  const updateWatermark = useCallback(
    async (file: File) => {
      if (!appearanceData) return;

      try {
        // TODO: Implement upload to Firebase Storage and get URL
        // For now, keep base64 as fallback during migration
        const base64Image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
        });

        // Store both for backward compatibility during migration
        const updatedData: VoucherAppearanceData = { 
          ...appearanceData, 
          watermarkImageUrl: null, // Will be updated when storage upload is implemented
          watermarkImageBase64: base64Image 
        };
        await repository.update(updatedData);
        setAppearanceData(updatedData);
        return base64Image;
      } catch (e) {
        setError('Falha ao atualizar marca d\'água.');
        throw e;
      }
    },
    [appearanceData, repository]
  );

  return {
    appearanceData,
    isLoading,
    error,
    updateWatermark,
  };
};
