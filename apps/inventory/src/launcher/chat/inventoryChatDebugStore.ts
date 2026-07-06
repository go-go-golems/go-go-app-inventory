/* Shared per-conversation debug event store for inventory chat windows. */
import {
  createChatDebugEventStore,
  type ChatDebugEntry,
  type ChatDebugEvent,
  type ChatDebugFamily,
} from '@go-go-golems/chat-provider';

export const inventoryChatDebugStore = createChatDebugEventStore({ maxEntriesPerConversation: 1000 });

export type InventoryChatDebugEntry = ChatDebugEntry;
export type InventoryDebugFamily = ChatDebugFamily;
export type { ChatDebugEvent };
