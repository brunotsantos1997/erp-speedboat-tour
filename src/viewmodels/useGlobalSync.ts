import { useEffect, useRef, useCallback } from 'react';
import type { EventType } from '../core/domain/types';
import { logger } from '../core/common/Logger';
import { eventRepository } from '../core/repositories/EventRepository';
import { useAuth } from '../contexts/auth/useAuth';
import { useEventSync } from './useEventSync';

const INITIAL_SYNC_LOOKAHEAD_DAYS = 7;
const SYNC_DEBOUNCE_MS = 5000;
const QUEUE_PROCESS_DELAY_MS = 2000;
const BATCH_DELAY_MS = 1000;
const BATCH_SIZE = 5;

type SyncedSnapshot = {
  signature: string;
  googleId?: string;
  lastSyncAt: number;
};

const buildSyncSignature = (event: EventType) =>
  JSON.stringify({
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
    products: event.products?.map((product) => ({
      name: product.name,
      isCourtesy: product.isCourtesy,
    })),
  });

const isWithinInitialSyncWindow = (event: EventType) => {
  const eventDate = new Date(`${event.date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const limitDate = new Date(today);
  limitDate.setDate(today.getDate() + INITIAL_SYNC_LOOKAHEAD_DAYS);

  return eventDate >= today && eventDate <= limitDate;
};

const wait = (delayMs: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, delayMs);
  });

export const useGlobalSync = () => {
  const { currentUser } = useAuth();
  const { syncEvent, deleteFromGoogle } = useEventSync();
  const latestEventsRef = useRef<Record<string, EventType>>({});
  const syncedSnapshotsRef = useRef<Record<string, SyncedSnapshot>>({});
  const syncQueueRef = useRef<string[]>([]);
  const queuedIdsRef = useRef(new Set<string>());
  const isProcessingQueueRef = useRef(false);
  const isFirstLoadRef = useRef(true);
  const queueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearQueueTimer = useCallback(() => {
    if (queueTimerRef.current) {
      clearTimeout(queueTimerRef.current);
      queueTimerRef.current = null;
    }
  }, []);

  const enqueueEvent = useCallback((eventId: string) => {
    if (queuedIdsRef.current.has(eventId)) {
      return;
    }

    queuedIdsRef.current.add(eventId);
    syncQueueRef.current.push(eventId);
  }, []);

  const processSyncQueue = useCallback(async () => {
    if (isProcessingQueueRef.current || syncQueueRef.current.length === 0) {
      return;
    }

    isProcessingQueueRef.current = true;
    clearQueueTimer();

    try {
      while (syncQueueRef.current.length > 0) {
        const batch = syncQueueRef.current.splice(0, BATCH_SIZE);
        batch.forEach((eventId) => queuedIdsRef.current.delete(eventId));

        const failedIds: string[] = [];

        await Promise.all(
          batch.map(async (eventId) => {
            const event = latestEventsRef.current[eventId];
            if (!event) {
              return;
            }

            try {
              await syncEvent(event);
              syncedSnapshotsRef.current[eventId] = {
                signature: buildSyncSignature(event),
                googleId: event.googleCalendarEventIds?.[currentUser?.id ?? ''],
                lastSyncAt: Date.now(),
              };
            } catch (error) {
              failedIds.push(eventId);
              logger.error('Global sync failed for event', error as Error, {
                eventId,
                operation: 'useGlobalSync.processSyncQueue',
              });
            }
          })
        );

        failedIds.forEach((eventId) => enqueueEvent(eventId));

        if (syncQueueRef.current.length > 0) {
          await wait(BATCH_DELAY_MS);
        }
      }
    } finally {
      isProcessingQueueRef.current = false;
    }
  }, [clearQueueTimer, currentUser?.id, enqueueEvent, syncEvent]);

  const scheduleQueueProcessing = useCallback(() => {
    clearQueueTimer();
    queueTimerRef.current = setTimeout(() => {
      void processSyncQueue();
    }, QUEUE_PROCESS_DELAY_MS);
  }, [clearQueueTimer, processSyncQueue]);

  useEffect(() => {
    if (!currentUser?.id || !currentUser.calendarSettings?.autoSync || !currentUser.calendarSettings.calendarId) {
      latestEventsRef.current = {};
      syncedSnapshotsRef.current = {};
      syncQueueRef.current = [];
      queuedIdsRef.current.clear();
      isFirstLoadRef.current = true;
      clearQueueTimer();
      return;
    }

    const unsubscribe = eventRepository.subscribe((events: EventType[]) => {
      const currentIds = new Set(events.map((event) => event.id));

      for (const [eventId, snapshot] of Object.entries(syncedSnapshotsRef.current)) {
        if (currentIds.has(eventId)) {
          continue;
        }

        if (snapshot.googleId) {
          void deleteFromGoogle(snapshot.googleId);
        }

        delete syncedSnapshotsRef.current[eventId];
        delete latestEventsRef.current[eventId];
      }

      events.forEach((event) => {
        latestEventsRef.current[event.id] = event;

        const snapshot = syncedSnapshotsRef.current[event.id];
        const currentSignature = buildSyncSignature(event);
        const currentGoogleId = event.googleCalendarEventIds?.[currentUser.id];

        if (snapshot && currentGoogleId && snapshot.googleId !== currentGoogleId) {
          snapshot.googleId = currentGoogleId;
        }

        const shouldQueueOnFirstLoad =
          isFirstLoadRef.current &&
          isWithinInitialSyncWindow(event) &&
          (!snapshot || snapshot.signature !== currentSignature);
        const shouldQueueOnUpdate =
          !isFirstLoadRef.current &&
          (!snapshot ||
            (snapshot.signature !== currentSignature && Date.now() - snapshot.lastSyncAt > SYNC_DEBOUNCE_MS));

        if (shouldQueueOnFirstLoad || shouldQueueOnUpdate) {
          enqueueEvent(event.id);
        }
      });

      isFirstLoadRef.current = false;

      if (syncQueueRef.current.length > 0) {
        scheduleQueueProcessing();
      }
    });

    return () => {
      clearQueueTimer();
      unsubscribe();
    };
  }, [
    clearQueueTimer,
    currentUser?.calendarSettings?.autoSync,
    currentUser?.calendarSettings?.calendarId,
    currentUser?.id,
    deleteFromGoogle,
    enqueueEvent,
    scheduleQueueProcessing,
  ]);
};
