/*
 * Detached Event Viewer and Timeline Debug windows for the react-chat Inventory
 * chat path. These replace the legacy os-chat EventViewerWindow /
 * TimelineDebugWindow, which read the SEM/proto timeline. They are rebuilt on
 * chat-provider's ChatDebugEvent stream (collected per-conversation in
 * inventoryChatDebugStore) plus the sessionstream snapshot endpoint.
 *
 * See design-doc/06 §7 (Debug strategy) and §11 Phase C.
 */
import { useCallback, useMemo, useState } from 'react';
import { useInventoryChatDebugEvents } from './useInventoryChatDebugEvents';
import { inventoryChatDebugStore, type ChatDebugEvent } from './inventoryChatDebugStore';
import './inventory-chat.css';

type FrameFilter = 'all' | 'raw-ws' | 'parsed-frame' | 'ws-lifecycle' | 'snapshot' | 'ui-event';

function summarizeEvent(event: ChatDebugEvent): string {
  switch (event.type) {
    case 'raw-ws':
      return `${event.size}b ${event.preview}`;
    case 'parsed-frame':
      return `${String(event.name ?? event.frameType ?? '')} ord=${String(event.ordinal ?? '')}`;
    case 'ws-lifecycle':
      return event.event;
    case 'snapshot':
      return `entities=${event.entityCount} dropped=${event.droppedCount} ord=${String(event.ordinal ?? '')}`;
    case 'ui-event':
      return `${String(event.name ?? '')} adapter=${event.adapterName ?? ''}`;
    default:
      return '';
  }
}

export function InventoryEventViewerWindow({ convId }: { convId: string }) {
  const events = useInventoryChatDebugEvents(convId);
  const [filter, setFilter] = useState<FrameFilter>('all');
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = useMemo(
    () => events.map((e, i) => ({ e, i })).filter(({ e }) => filter === 'all' || e.type === filter).reverse(),
    [events, filter],
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
        <span>{filtered.length} frames</span>
        <button type="button" data-part="btn" onClick={() => inventoryChatDebugStore.clear(convId)}>
          Clear
        </button>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {filtered.length === 0 ? (
          <div className="inventory-debug-row">no frames captured for this conversation yet</div>
        ) : (
          filtered.map(({ e, i }) => (
            <div className="inventory-debug-row" key={i}>
              <span className="inventory-debug-row-type">{e.type}</span>
              <span
                style={{ cursor: 'pointer' }}
                onClick={() => setExpanded(expanded === i ? null : i)}
              >
                {summarizeEvent(e)}
              </span>
              {expanded === i ? <pre className="inventory-debug-pre">{JSON.stringify(e, null, 2)}</pre> : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface SnapshotEntity {
  id?: string;
  kind?: string;
  [key: string]: unknown;
}

export function InventoryTimelineDebugWindow({ convId, apiBasePrefix }: { convId: string; apiBasePrefix: string }) {
  const events = useInventoryChatDebugEvents(convId);
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
  const lastSnapshotEvent = useMemo(
    () => [...events].reverse().find((e) => e.type === 'snapshot'),
    [events],
  );

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
        {lastSnapshotEvent && lastSnapshotEvent.type === 'snapshot' ? (
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
