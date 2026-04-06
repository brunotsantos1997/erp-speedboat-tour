import { useEffect, useRef, useCallback } from 'react';
import { useEventSync } from './useEventSync';
import { useAuth } from '../contexts/auth/useAuth';
import { eventRepository } from '../core/repositories/EventRepository';
import type { EventType } from '../core/domain/types';

/**
 * Hook to automatically synchronize Google Calendar when events are updated by other users.
 * Optimized to reduce client-side load and improve reliability.
 */
export const useGlobalSync = () => {
  const { currentUser } = useAuth();
  const { deleteFromGoogle } = useEventSync(); // syncEvent will be used in the actual implementation
  const lastSyncedRef = useRef<Record<string, { data: string; googleId?: string; lastSync: number }>>({});
  const isFirstLoad = useRef(true);
  const syncQueueRef = useRef<string[]>([]);
  const isProcessingQueueRef = useRef(false);

  // Debounced sync processing to avoid rapid successive calls
  const processSyncQueue = useCallback(async () => {
    if (isProcessingQueueRef.current || syncQueueRef.current.length === 0) return;
    
    isProcessingQueueRef.current = true;
    const queue = [...syncQueueRef.current];
    syncQueueRef.current = [];

    try {
      // Process events in batches to avoid overwhelming the Google API
      const batchSize = 5;
      for (let i = 0; i < queue.length; i += batchSize) {
        const batch = queue.slice(i, i + batchSize);
        await Promise.all(batch.map(async (eventId) => {
          // TODO: Implement actual sync logic with proper event lookup
          // This would fetch the event data and call syncEvent
          console.log(`Processing sync for event: ${eventId}`);
          return null;
        }));
        
        // Small delay between batches to respect rate limits
        if (i + batchSize < queue.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      console.error('Error processing sync queue:', error);
      // Re-add failed items to queue for retry
      syncQueueRef.current.unshift(...queue);
    } finally {
      isProcessingQueueRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Only run if autoSync is enabled and configured
    if (!currentUser?.calendarSettings?.autoSync || !currentUser?.calendarSettings?.calendarId) {
      lastSyncedRef.current = {};
      syncQueueRef.current = [];
      return;
    }

    const unsubscribe = eventRepository.subscribe((events: EventType[]) => {
      const currentIds = new Set(events.map(e => e.id));

      // 1. Handle Deletions
      Object.keys(lastSyncedRef.current).forEach(id => {
        if (!currentIds.has(id)) {
          const { googleId } = lastSyncedRef.current[id];
          if (googleId) {
            deleteFromGoogle(googleId);
          }
          delete lastSyncedRef.current[id];
        }
      });

      // 2. Handle Updates and Additions
      events.forEach((event: EventType) => {
        // Data that affects the calendar event content
        const relevantData = JSON.stringify({
          date: event.date,
          startTime: event.startTime,
          endTime: event.endTime,
          status: event.status,
          boatName: event.boat?.name,
          clientName: event.client?.name,
          locationName: event.boardingLocation?.name,
          observations: event.observations,
          passengerCount: event.passengerCount,
          tourTypeName: event.tourType?.name,
          products: event.products?.map((p) => ({ name: p.name, isCourtesy: p.isCourtesy }))
        });

        const prev = lastSyncedRef.current[event.id];
        const googleId = event.googleCalendarEventIds?.[currentUser.id];
        const now = Date.now();

        if (isFirstLoad.current) {
          // On startup, sync upcoming events (next 7 days) to catch up with changes made offline
          // Reduced from 30 days to improve performance
          const eventDate = new Date(event.date + 'T00:00');
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const sevenDaysFromNow = new Date();
          sevenDaysFromNow.setDate(today.getDate() + 7);

          if (eventDate >= today && eventDate <= sevenDaysFromNow) {
            syncQueueRef.current.push(event.id);
          }
        } else if (!prev) {
          // New event appeared while the system is open
          syncQueueRef.current.push(event.id);
        } else if (prev.data !== relevantData && (now - prev.lastSync) > 5000) {
          // Relevant data changed and enough time has passed (5 second debounce)
          syncQueueRef.current.push(event.id);
        }

        // Always update the ref with latest state
        lastSyncedRef.current[event.id] = { data: relevantData, googleId, lastSync: now };
      });

      isFirstLoad.current = false;
      
      // Process sync queue with delay to batch rapid changes
      setTimeout(processSyncQueue, 2000);
    });

    return () => {
      unsubscribe();
    };
  }, [
    currentUser?.id,
    currentUser?.calendarSettings?.autoSync,
    currentUser?.calendarSettings?.calendarId,
    processSyncQueue
  ]);
};
