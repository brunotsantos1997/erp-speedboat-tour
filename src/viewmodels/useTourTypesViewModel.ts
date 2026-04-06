// src/viewmodels/useTourTypesViewModel.ts
import { useState, useEffect } from 'react';
import { tourTypeRepository } from '../core/repositories/TourTypeRepository';
import type { TourType } from '../core/domain/types';
import { logger } from '../core/common/Logger';

export const useTourTypesViewModel = () => {
  const [tourTypes, setTourTypes] = useState<TourType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    tourTypeRepository.getAll().catch((err: unknown) => {
      logger.error('Failed to load tour types', err as Error, { operation: 'getAllTourTypes' });
      setError(err instanceof Error ? err.message : 'Erro ao carregar tipos de passeio');
    });

    const unsubscribe = tourTypeRepository.subscribe((data) => {
      setTourTypes(data);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const addTourType = async (name: string, color: string) => {
    try {
      await tourTypeRepository.add({ name, color, isArchived: false });
    } catch (err: unknown) {
      logger.error('Failed to add tour type', err as Error, { name, color, operation: 'addTourType' });
      setError(err instanceof Error ? err.message : 'Erro ao adicionar tipo de passeio');
    }
  };

  const updateTourType = async (tourType: TourType) => {
    try {
      await tourTypeRepository.update(tourType);
    } catch (err: unknown) {
      logger.error('Failed to update tour type', err as Error, { tourTypeId: tourType.id, operation: 'updateTourType' });
      setError(err instanceof Error ? err.message : 'Erro ao atualizar tipo de passeio');
    }
  };

  const deleteTourType = async (id: string) => {
    try {
      await tourTypeRepository.delete(id);
    } catch (err: unknown) {
      logger.error('Failed to delete tour type', err as Error, { tourTypeId: id, operation: 'deleteTourType' });
      setError(err instanceof Error ? err.message : 'Erro ao excluir tipo de passeio');
    }
  };

  return {
    tourTypes,
    isLoading,
    error,
    addTourType,
    updateTourType,
    deleteTourType,
    refresh: () => {},
  };
};
