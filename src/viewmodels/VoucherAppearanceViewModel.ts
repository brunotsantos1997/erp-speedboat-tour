import { useState, useEffect, useCallback } from 'react';
import type { VoucherAppearanceData } from '../core/repositories/VoucherAppearanceRepository';
import { VoucherAppearanceRepository } from '../core/repositories/VoucherAppearanceRepository';

const isAllowedWatermarkUrl = (value: string) =>
  /^(https?:\/\/|\/)[^\s]+$/i.test(value.trim());

export const useVoucherAppearanceViewModel = () => {
  const [appearanceData, setAppearanceData] = useState<VoucherAppearanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const repository = VoucherAppearanceRepository.getInstance();

  useEffect(() => {
    repository.get().catch(() => setError('Falha ao carregar aparencia do voucher.'));

    const unsubscribe = repository.subscribe((data) => {
      setAppearanceData(data);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [repository]);

  const updateWatermarkUrl = useCallback(
    async (watermarkImageUrl: string) => {
      const trimmedUrl = watermarkImageUrl.trim();

      if (!trimmedUrl) {
        throw new Error('Informe uma URL publica ou caminho relativo da aplicacao.');
      }

      if (!isAllowedWatermarkUrl(trimmedUrl)) {
        throw new Error('Use uma URL publica iniciando com http(s):// ou um caminho relativo iniciando com /.');
      }

      try {
        const updatedData: VoucherAppearanceData = {
          id: appearanceData?.id || 'default',
          watermarkImageUrl: trimmedUrl,
          watermarkImageBase64: null
        };
        await repository.update(updatedData);
        setAppearanceData(updatedData);
        setError(null);
        return trimmedUrl;
      } catch (updateError) {
        setError('Falha ao atualizar marca d\'agua.');
        throw updateError;
      }
    },
    [appearanceData, repository]
  );

  const clearWatermark = useCallback(async () => {
    const updatedData: VoucherAppearanceData = {
      id: appearanceData?.id || 'default',
      watermarkImageUrl: null,
      watermarkImageBase64: null
    };

    await repository.update(updatedData);
    setAppearanceData(updatedData);
    setError(null);
  }, [appearanceData, repository]);

  return {
    appearanceData,
    isLoading,
    error,
    hasLegacyBase64Watermark: Boolean(appearanceData?.watermarkImageBase64 && !appearanceData?.watermarkImageUrl),
    updateWatermarkUrl,
    clearWatermark
  };
};
