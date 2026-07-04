/*
 * React binding for inventoryChatDebugStore. Subscribes a component to the
 * per-conversation debug event ring buffer via useSyncExternalStore.
 */
import { useCallback, useSyncExternalStore } from 'react';
import { inventoryChatDebugStore, type InventoryChatDebugEntry } from './inventoryChatDebugStore';

export function useInventoryChatDebugEvents(convId: string): InventoryChatDebugEntry[] {
  const subscribe = useCallback(
    (listener: () => void) => inventoryChatDebugStore.subscribe(convId, listener),
    [convId],
  );
  const getSnapshot = useCallback(() => inventoryChatDebugStore.getSnapshot(convId), [convId]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
