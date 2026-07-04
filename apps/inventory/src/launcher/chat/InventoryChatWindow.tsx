/*
 * Inventory chat window on @go-go-golems/chat-provider + chat-overlay.
 *
 * Replaces the legacy @go-go-golems/os-chat ChatConversationWindow, which spoke
 * the old SEM transport (/chat, /ws?conv_id=, /api/timeline, /api/chat/profiles)
 * and 404'd against the new chathost backend. This window speaks the
 * chatapp/sessionstream contract under <basePrefix>/api/chat/*, exactly like the
 * launcher Assistant window (apps/os-launcher/src/app/assistantModule.tsx).
 *
 * Chrome reproduces the reference screenshot: title, connection badge, profile
 * selector, Events / Timeline / Copy Conv ID / Debug buttons, message counter,
 * "How can I help?" empty state, starter suggestions, composer, footer.
 *
 * See ticket WESEN-OS-STOCKTAKE-2026-07 design-doc/06.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChatProvider,
  useChatClient,
  useChatSelector,
  selectOverlay,
  selectTimelineEntities,
  type ChatProviderConfig,
  type WidgetDefinition,
} from '@go-go-golems/chat-provider';
import { ChatComposer, useStickyScrollFollow } from '@go-go-golems/chat-overlay';
import { InventoryChatMessages } from './InventoryChatMessages';
import { inventoryChatDebugStore } from './inventoryChatDebugStore';
import { useInventoryChatDebugEvents } from './useInventoryChatDebugEvents';
import { useInventoryProfiles } from './useInventoryProfiles';
import './inventory-chat.css';

export interface InventoryChatWindowProps {
  convId: string;
  apiBasePrefix: string;
  starterSuggestions: string[];
  widgets?: WidgetDefinition[];
  onOpenEventViewer: (convId: string) => void;
  onOpenTimelineDebug: (convId: string) => void;
}

async function copyTextToClipboard(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  throw new Error('clipboard unavailable');
}

function InventoryEmptyState() {
  return (
    <div className="inventory-chat-empty" data-part="empty">
      <div className="inventory-chat-empty-emoji" aria-hidden>💬</div>
      <div className="inventory-chat-empty-title">How can I help?</div>
      <div className="inventory-chat-empty-sub">Ask a question, request data, or try one of the suggestions below.</div>
    </div>
  );
}

function InventoryDebugPanel({ convId }: { convId: string }) {
  const overlay = useChatSelector(selectOverlay);
  const entities = useChatSelector(selectTimelineEntities);
  const entries = useInventoryChatDebugEvents(convId);
  const recent = entries.slice(-25).reverse();

  return (
    <div className="inventory-chat-debug-panel" data-part="debug-panel">
      <div className="inventory-debug-toolbar">
        <strong>Debug</strong>
        <span>ws: {overlay.wsStatus || '—'}</span>
        <span>run: {overlay.runStatus || '—'}</span>
        <span>entities: {entities.length}</span>
        <span>frames: {entries.length}</span>
        <button type="button" data-part="btn" onClick={() => inventoryChatDebugStore.clear(convId)}>
          Clear
        </button>
      </div>
      <div className="inventory-debug-section-title">Overlay</div>
      <pre className="inventory-debug-pre">{JSON.stringify(overlay, null, 2)}</pre>
      <div className="inventory-debug-section-title">Recent frames</div>
      {recent.length === 0 ? (
        <div className="inventory-debug-row">no frames yet</div>
      ) : (
        recent.map((entry) => (
          <div className="inventory-debug-row" key={entry.id}>
            <span className="inventory-debug-row-type">{entry.event.type}</span>
            <span>{entry.summary}</span>
          </div>
        ))
      )}
    </div>
  );
}

function InventoryChatChrome({
  convId,
  apiBasePrefix,
  starterSuggestions,
  profile,
  onProfileChange,
  onOpenEventViewer,
  onOpenTimelineDebug,
}: {
  convId: string;
  apiBasePrefix: string;
  starterSuggestions: string[];
  profile: string | null;
  onProfileChange: (slug: string | null) => void;
  onOpenEventViewer: (convId: string) => void;
  onOpenTimelineDebug: (convId: string) => void;
}) {
  const client = useChatClient();
  const overlay = useChatSelector(selectOverlay);
  const entities = useChatSelector(selectTimelineEntities);
  const [debugOpen, setDebugOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const { profiles, defaultSlug, loading: profilesLoading } = useInventoryProfiles(apiBasePrefix);

  const isStreaming = overlay.runStatus === 'streaming';
  const connected = overlay.wsStatus === 'connected';
  const isEmpty = entities.length === 0;

  const scroll = useStickyScrollFollow({
    enabled: true,
    contentVersion: `${overlay.runStatus}:${overlay.wsStatus}`,
    resetKey: overlay.sessionId,
  });

  useEffect(() => {
    client.connect().catch(() => {
      // surfaced via overlay.wsStatus / overlay.error
    });
  }, [client]);

  // Once the profile list arrives, adopt the default selection if the user has
  // not chosen one yet. Profile is bound at session creation (design-doc/06 §5).
  useEffect(() => {
    if (profile === null && defaultSlug) {
      onProfileChange(defaultSlug);
    }
  }, [defaultSlug, profile, onProfileChange]);

  const copyConvId = useCallback(() => {
    copyTextToClipboard(overlay.sessionId || convId)
      .then(() => setCopyStatus('copied'))
      .catch(() => setCopyStatus('error'))
      .finally(() => setTimeout(() => setCopyStatus('idle'), 1300));
  }, [convId, overlay.sessionId]);

  const sendSuggestion = useCallback(
    (text: string) => {
      client.send(text).catch(() => {
        // surfaced via overlay.error
      });
    },
    [client],
  );

  const profileLocked = entities.length > 0; // changing profile after first message needs a new session

  return (
    <div className="inventory-chat-window" data-part="inventory-chat-window">
      <div className="inventory-chat-header" data-part="header">
        <span className="inventory-chat-title">💬 Inventory Chat</span>
        <span className="inventory-chat-conn" data-connected={connected}>
          {connected ? 'connected' : overlay.wsStatus || 'connecting'}
        </span>
        <label className="inventory-chat-profile">
          Profile
          <select
            value={profile ?? ''}
            disabled={profilesLoading || profiles.length === 0 || profileLocked}
            title={profileLocked ? 'Start a new chat to change profile' : undefined}
            onChange={(e) => onProfileChange(e.target.value || null)}
          >
            {profiles.length === 0 ? (
              <option value="">{profilesLoading ? 'Loading…' : 'Default (default)'}</option>
            ) : (
              profiles.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.displayName}
                  {p.isDefault ? ' (default)' : ''}
                </option>
              ))
            )}
          </select>
        </label>
        <div className="inventory-chat-header-actions">
          <button type="button" data-part="btn" onClick={() => onOpenEventViewer(convId)}>
            🧭 Events
          </button>
          <button type="button" data-part="btn" onClick={() => onOpenTimelineDebug(convId)}>
            🧱 Timeline
          </button>
          <button type="button" data-part="btn" onClick={copyConvId} title={convId}>
            {copyStatus === 'copied' ? '✅ Copied' : copyStatus === 'error' ? '⚠ Copy failed' : '📋 Copy Conv ID'}
          </button>
          <button
            type="button"
            data-part="btn"
            data-state={debugOpen ? 'active' : undefined}
            onClick={() => setDebugOpen((v) => !v)}
          >
            {debugOpen ? '🔍 Debug ON' : '🔍 Debug'}
          </button>
        </div>
        <div className="inventory-chat-counters">
          <span>{entities.length} messages</span>
        </div>
      </div>

      {overlay.error ? <div className="chat-overlay-error-bar">{String(overlay.error)}</div> : null}

      <div
        ref={scroll.containerRef}
        onScroll={scroll.onScroll}
        onWheel={scroll.onWheel}
        className="chat-overlay-messages-scroll"
      >
        {isEmpty ? <InventoryEmptyState /> : <InventoryChatMessages bottomRef={scroll.tailRef} />}
      </div>

      {isEmpty && starterSuggestions.length > 0 ? (
        <div className="inventory-chat-suggestions" data-part="suggestions">
          {starterSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              className="inventory-chat-suggestion"
              disabled={isStreaming}
              onClick={() => sendSuggestion(s)}
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      {debugOpen ? <InventoryDebugPanel convId={convId} /> : null}

      <ChatComposer disabled={isStreaming} />
      <div className="inventory-chat-footer" data-part="footer">Streaming via sessionstream</div>
    </div>
  );
}

export function InventoryChatWindow({
  convId,
  apiBasePrefix,
  starterSuggestions,
  widgets,
  onOpenEventViewer,
  onOpenTimelineDebug,
}: InventoryChatWindowProps) {
  const [profile, setProfile] = useState<string | null>(null);
  const profileRef = useRef<string | null>(profile);
  profileRef.current = profile;

  const config = useMemo<ChatProviderConfig>(
    () => ({
      basePrefix: apiBasePrefix,
      sessionStorageKey: `inventory.chat.session.${convId}`,
      createSessionBody: () => ({
        sessionId: convId,
        profile: profileRef.current ?? undefined,
      }),
      onDebugEvent: (event) => inventoryChatDebugStore.push(convId, event),
      widgets,
    }),
    [apiBasePrefix, convId, widgets],
  );

  return (
    <ChatProvider config={config}>
      <InventoryChatChrome
        convId={convId}
        apiBasePrefix={apiBasePrefix}
        starterSuggestions={starterSuggestions}
        profile={profile}
        onProfileChange={setProfile}
        onOpenEventViewer={onOpenEventViewer}
        onOpenTimelineDebug={onOpenTimelineDebug}
      />
    </ChatProvider>
  );
}
