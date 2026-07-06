/* React binding for inventoryChatDebugStore. */
import { useChatDebugEntries } from '@go-go-golems/chat-provider';
import { inventoryChatDebugStore, type InventoryChatDebugEntry } from './inventoryChatDebugStore';

export function useInventoryChatDebugEvents(convId: string): InventoryChatDebugEntry[] {
  return useChatDebugEntries(inventoryChatDebugStore, convId);
}
