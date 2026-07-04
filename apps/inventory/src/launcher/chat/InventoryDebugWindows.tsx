/*
 * Detached Event Viewer and Timeline Debug windows for the react-chat Inventory
 * chat path. These replace the legacy os-chat EventViewerWindow /
 * TimelineDebugWindow, which read the SEM/proto timeline. They are rebuilt on
 * chat-provider's ChatDebugEvent stream (collected per-conversation in
 * inventoryChatDebugStore) plus the sessionstream snapshot endpoint.
 *
 * Retrofit (ticket WESEN-OS-ASSISTANT-PARITY-2026-07 Phase 4): ingest-time
 * summaries + stable evt-N keys (from the store), pausedRef-gated ingestion
 * (events dropped BEFORE setState while paused), and lazy per-expanded-row
 * JSON. The launcher assistant windows carry the fuller rebuild (family
 * pills, timeline mirror); these stay lean until Phase 6 dedupes both into
 * react-chat.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { inventoryChatDebugStore, type InventoryChatDebugEntry } from './inventoryChatDebugStore';
import './inventory-chat.css';

type FrameFilter = 'all' | 'raw-ws' | 'parsed-frame' | 'ws-lifecycle' | 'snapshot' | 'ui-event';

export function InventoryEventViewerWindow({ convId }: { convId: string }) {
  // Old os-chat pattern: component-level buffer fed by a subscription whose
  // callback reads pause state via a ref, so pausing drops events before any
  // render work; the subscription only re-runs on convId.
  const [entries, setEntries] = useState<InventoryChatDebugEntry[]>(() => inventoryChatDebugStore.getSnapshot(convId));
  const [filter, setFilter] = useState<FrameFilter>('all');
  const [paused, setPaused] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    setEntries(inventoryChatDebugStore.getSnapshot(convId));
    setExpandedId(null);
  }, [convId]);

  useEffect(() => {
    return inventoryChatDebugStore.subscribe(convId, () => {
      if (pausedRef.current) return;
      setEntries(inventoryChatDebugStore.getSnapshot(convId));
    });
  }, [convId]);

  const togglePause = useCallback(() => {
    setPaused((p) => {
      const next = !p;
      if (!next) {
        setEntries(inventoryChatDebugStore.getSnapshot(convId));
      }
      return next;
    });
  }, [convId]);

  const visible = useMemo(
    () => (filter === 'all' ? entries : entries.filter((entry) => entry.event.type === filter)).slice().reverse(),
    [entries, filter],
  );

  return (
    <div className="inventory-debug-window inventory-chat-window" data-part="event-viewer">
      <div className="inventory-debug-toolbar">
        <strong>🧭 Event Viewer</strong>
        <span title={convId}>conv {convId.slice(0, 8)}</span>
        <label>
          Filter{' '}
          <select value={filter} onChange={(e) => setFilter(e.target.value as FrameFilter)}>
            <option value="all">all</option>
            <option value="raw-ws">raw-ws</option>
            <option value="parsed-frame">parsed-frame</option>
            <option value="ws-lifecycle">ws-lifecycle</option>
            <option value="snapshot">snapshot</option>
            <option value="ui-event">ui-event</option>
          </select>
        </label>
        <span>{visible.length} frames</span>
        <button type="button" data-part="btn" onClick={togglePause}>
          {paused ? '▶ Resume' : '⏸ Pause'}
        </button>
        <button type="button" data-part="btn" onClick={() => inventoryChatDebugStore.clear(convId)}>
          Clear
        </button>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {visible.length === 0 ? (
          <div className="inventory-debug-row">no frames captured for this conversation yet</div>
        ) : (
          visible.map((entry) => (
            <div className="inventory-debug-row" key={entry.id}>
              <span className="inventory-debug-row-type">{entry.event.type}</span>
              <span
                style={{ cursor: 'pointer' }}
                onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
              >
                {entry.summary}
              </span>
              {expandedId === entry.id ? <ExpandedEntry entry={entry} /> : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// JSON serialization happens HERE — only for the single expanded row.
function ExpandedEntry({ entry }: { entry: InventoryChatDebugEntry }) {
  const json = useMemo(() => JSON.stringify(entry.event, null, 2), [entry]);
  return <pre className="inventory-debug-pre">{json}</pre>;
}

interface SnapshotEntity {
  id?: string;
  kind?: string;
  [key: string]: unknown;
}

export function InventoryTimelineDebugWindow({ convId, apiBasePrefix }: { convId: string; apiBasePrefix: string }) {
  const entries = useInventoryEntries(convId);
  const [entities, setEntities] = useState<SnapshotEntity[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSnapshot = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`${apiBasePrefix}/api/chat/sessions/${encodeURIComponent(convId)}`, {
      headers: { Accept: 'application/json' },
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`snapshot returned ${res.status}`);
        }
        return res.json();
      })
      .then((body: { entities?: SnapshotEntity[] }) => {
        setEntities(Array.isArray(body.entities) ? body.entities : []);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });
  }, [apiBasePrefix, convId]);

  // Latest projected snapshot as seen live over the websocket, from the store.
  const lastSnapshotEvent = useMemo(() => {
    for (let i = entries.length - 1; i >= 0; i -= 1) {
      const event = entries[i].event;
      if (event.type === 'snapshot') {
        return event;
      }
    }
    return null;
  }, [entries]);

  return (
    <div className="inventory-debug-window inventory-chat-window" data-part="timeline-debug">
      <div className="inventory-debug-toolbar">
        <strong>🧱 Timeline Debug</strong>
        <span title={convId}>conv {convId.slice(0, 8)}</span>
        <button type="button" data-part="btn" onClick={fetchSnapshot} disabled={loading}>
          {loading ? 'Loading…' : 'Fetch snapshot'}
        </button>
      </div>
      {error ? <div className="chat-overlay-error-bar">{error}</div> : null}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <div className="inventory-debug-section-title">Live snapshot (last observed over ws)</div>
        {lastSnapshotEvent ? (
          <pre className="inventory-debug-pre">{JSON.stringify(lastSnapshotEvent.entities, null, 2)}</pre>
        ) : (
          <div className="inventory-debug-row">no live snapshot observed yet</div>
        )}
        <div className="inventory-debug-section-title">Fetched snapshot (REST)</div>
        {entities === null ? (
          <div className="inventory-debug-row">click “Fetch snapshot” to load entities from the server</div>
        ) : entities.length === 0 ? (
          <div className="inventory-debug-row">snapshot has no entities</div>
        ) : (
          entities.map((entity, idx) => (
            <div className="inventory-debug-row" key={entity.id ?? idx}>
              <span className="inventory-debug-row-type">{entity.kind ?? 'entity'}</span>
              <pre className="inventory-debug-pre">{JSON.stringify(entity, null, 2)}</pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Local subscription helper (mirrors useInventoryChatDebugEvents; kept here to
// avoid a circular import when this file is consumed standalone in tests).
function useInventoryEntries(convId: string): InventoryChatDebugEntry[] {
  const [entries, setEntries] = useState<InventoryChatDebugEntry[]>(() => inventoryChatDebugStore.getSnapshot(convId));
  useEffect(() => {
    setEntries(inventoryChatDebugStore.getSnapshot(convId));
    return inventoryChatDebugStore.subscribe(convId, () => {
      setEntries(inventoryChatDebugStore.getSnapshot(convId));
    });
  }, [convId]);
  return entries;
}
