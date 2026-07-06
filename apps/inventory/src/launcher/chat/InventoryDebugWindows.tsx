/*
 * Detached Event Viewer and Timeline Debug windows for the inventory chat path.
 * Reusable devtool UI now comes from react-chat; this file keeps only the
 * inventory adapter logic for event store wiring and REST snapshot seeding.
 */
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  createEmptyTimelineMirror,
  type TimelineMirrorState,
} from '@go-go-golems/chat-provider';
import {
  ChatEventViewerFromStore,
  ChatTimelineDebug,
  foldTimelineMutationsFromDebugEntries,
  latestDebugEntrySeq,
  seedTimelineMirrorFromSnapshot,
} from '@go-go-golems/chat-overlay/devtools';
import { inventoryChatDebugStore } from './inventoryChatDebugStore';
import { useInventoryChatDebugEvents } from './useInventoryChatDebugEvents';
import './inventory-chat.css';

type TimelineMirrorSeed = {
  mirror: TimelineMirrorState;
  seq: number;
};

type SnapshotFetchState = 'idle' | 'loading' | 'error';

export function InventoryEventViewerWindow({ convId }: { convId: string }) {
  return (
    <ChatEventViewerFromStore
      conversationId={convId}
      store={inventoryChatDebugStore}
      defaultHiddenFamilies={['raw']}
    />
  );
}

export function InventoryTimelineDebugWindow({ convId, apiBasePrefix }: { convId: string; apiBasePrefix: string }) {
  const entries = useInventoryChatDebugEvents(convId);
  const [base, setBase] = useState<TimelineMirrorSeed>(() => ({ mirror: createEmptyTimelineMirror(), seq: 0 }));
  const [fetchState, setFetchState] = useState<SnapshotFetchState>('idle');
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchSnapshot = useCallback(() => {
    setFetchState('loading');
    setFetchError(null);
    fetch(`${apiBasePrefix}/api/chat/sessions/${encodeURIComponent(convId)}`, { headers: { Accept: 'application/json' } })
      .then(async (res) => {
        if (!res.ok) throw new Error(`snapshot returned ${res.status}`);
        return res.json();
      })
      .then((body: { entities?: Array<Record<string, unknown>> }) => {
        const snapshotEntries = inventoryChatDebugStore.getSnapshot(convId);
        setBase({
          mirror: seedTimelineMirrorFromSnapshot(Array.isArray(body.entities) ? body.entities : []),
          seq: latestDebugEntrySeq(snapshotEntries),
        });
        setFetchState('idle');
      })
      .catch((err: unknown) => {
        setFetchError(err instanceof Error ? err.message : String(err));
        setFetchState('error');
      });
  }, [apiBasePrefix, convId]);

  useEffect(() => {
    fetchSnapshot();
  }, [fetchSnapshot]);

  const folded = useMemo(() => foldTimelineMutationsFromDebugEntries(base.mirror, entries, base.seq), [base, entries]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '4px 8px', borderBottom: '1px solid #ddd', background: '#f8f9fa' }}>
        <button type="button" onClick={fetchSnapshot} disabled={fetchState === 'loading'} style={controlBtnStyle} title="Re-seed from the server snapshot">
          {fetchState === 'loading' ? '⏳' : '🔄'} Refresh
        </button>
        {fetchState === 'error' && fetchError ? (
          <span style={{ fontSize: 11, color: '#dc2626' }}>snapshot fetch failed: {fetchError}</span>
        ) : null}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ChatTimelineDebug conversationId={convId} timeline={folded.mirror} />
      </div>
    </div>
  );
}

const controlBtnStyle: CSSProperties = {
  padding: '2px 8px',
  fontSize: 11,
  borderRadius: 3,
  border: '1px solid #ccc',
  background: '#f0f0f0',
  color: '#555',
  cursor: 'pointer',
};
