/*
 * Per-conversation debug event store for the react-chat Inventory window.
 *
 * chat-provider's ChatProvider is mounted per window, so its Redux store is not
 * reachable from a *detached* Event Viewer / Timeline Debug window. Those
 * windows still need the raw/parsed sessionstream frames for a conversation.
 *
 * This module is a tiny external store, keyed by convId, fed by the chat
 * window's `onDebugEvent` handler and read via useSyncExternalStore from any
 * window (chat inline Debug panel, Event Viewer, Timeline Debug).
 *
 * Performance techniques from the old os-chat debug eventBus (ticket
 * WESEN-OS-ASSISTANT-PARITY-2026-07 §4.1): bounded ring buffer, ingest-time
 * one-line summaries, monotonic `evt-<n>` ids usable directly as React keys.
 */
import type { ChatDebugEvent } from '@go-go-golems/chat-provider';

const MAX_EVENTS_PER_CONV = 1000;

export interface InventoryChatDebugEntry {
  /** Monotonic id, stable React key. */
  id: string;
  /** Monotonic sequence number. */
  seq: number;
  /** Ingest timestamp (ms epoch). */
  at: number;
  /** One-line summary computed at ingest time. */
  summary: string;
  event: ChatDebugEvent;
}

let seqCounter = 0;

function summarize(event: ChatDebugEvent): string {
  switch (event.type) {
    case 'ws-lifecycle':
      return `ws ${event.event}`;
    case 'raw-ws':
      return `raw ${event.size}B ${event.preview.slice(0, 100)}`;
    case 'parsed-frame': {
      const name = event.name ? ` ${event.name}` : '';
      const ord = event.ordinal !== undefined && event.ordinal !== null ? ` #${event.ordinal}` : '';
      return `${String(event.frameType ?? 'frame')}${name}${ord}`;
    }
    case 'snapshot':
      return `snapshot entities=${event.entityCount} dropped=${event.droppedCount}`;
    case 'ui-event': {
      const adapter = event.adapterName ? ` via ${event.adapterName}` : '';
      return `ui ${String(event.name ?? '')}${adapter}`;
    }
    default:
      return String((event as { type?: unknown }).type ?? 'event');
  }
}

type Buffer = {
  entries: InventoryChatDebugEntry[];
  listeners: Set<() => void>;
};

const buffers = new Map<string, Buffer>();

function getBuffer(convId: string): Buffer {
  let buf = buffers.get(convId);
  if (!buf) {
    buf = { entries: [], listeners: new Set() };
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
    seqCounter += 1;
    const entry: InventoryChatDebugEntry = {
      id: `evt-${seqCounter}`,
      seq: seqCounter,
      at: Date.now(),
      summary: summarize(event),
      event,
    };
    // Replace the array reference so getSnapshot returns a new identity.
    const next = buf.entries.concat(entry);
    buf.entries = next.length > MAX_EVENTS_PER_CONV ? next.slice(next.length - MAX_EVENTS_PER_CONV) : next;
    emit(buf);
  },

  clear(convId: string): void {
    const buf = buffers.get(convId);
    if (!buf) {
      return;
    }
    buf.entries = [];
    emit(buf);
  },

  getSnapshot(convId: string): InventoryChatDebugEntry[] {
    return getBuffer(convId).entries;
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
