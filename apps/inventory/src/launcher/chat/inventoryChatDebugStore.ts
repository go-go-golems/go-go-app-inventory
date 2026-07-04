/*
 * Per-conversation debug event store for the react-chat Inventory window.
 *
 * chat-provider's ChatProvider is mounted per window, so its Redux store is not
 * reachable from a *detached* Event Viewer / Timeline Debug window. Those
 * windows still need the raw/parsed sessionstream frames for a conversation.
 *
 * This module is a tiny external store, keyed by convId, fed by the chat
 * window's `onDebugEvent` handler and read via useSyncExternalStore from any
 * window (chat inline Debug panel, Event Viewer, Timeline Debug). Buffers are
 * bounded rings so a long-running conversation cannot grow unbounded.
 *
 * See ticket WESEN-OS-STOCKTAKE-2026-07 design-doc/06 §7 (Debug strategy).
 */
import type { ChatDebugEvent } from '@go-go-golems/chat-provider';

const MAX_EVENTS_PER_CONV = 500;

type Buffer = {
  events: ChatDebugEvent[];
  listeners: Set<() => void>;
  // A monotonically increasing snapshot handle so useSyncExternalStore can
  // cache; we hand out the array reference and replace it on every push.
};

const buffers = new Map<string, Buffer>();

function getBuffer(convId: string): Buffer {
  let buf = buffers.get(convId);
  if (!buf) {
    buf = { events: [], listeners: new Set() };
    buffers.set(convId, buf);
  }
  return buf;
}

function emit(buf: Buffer): void {
  for (const listener of buf.listeners) {
    listener();
  }
}

export const inventoryChatDebugStore = {
  push(convId: string, event: ChatDebugEvent): void {
    const buf = getBuffer(convId);
    // Replace the array reference so getSnapshot returns a new identity.
    const next = buf.events.concat(event);
    buf.events = next.length > MAX_EVENTS_PER_CONV ? next.slice(next.length - MAX_EVENTS_PER_CONV) : next;
    emit(buf);
  },

  clear(convId: string): void {
    const buf = buffers.get(convId);
    if (!buf) {
      return;
    }
    buf.events = [];
    emit(buf);
  },

  getSnapshot(convId: string): ChatDebugEvent[] {
    return getBuffer(convId).events;
  },

  subscribe(convId: string, listener: () => void): () => void {
    const buf = getBuffer(convId);
    buf.listeners.add(listener);
    return () => {
      buf.listeners.delete(listener);
    };
  },
};

export type { ChatDebugEvent };
