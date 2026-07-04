/*
 * Frontend renderer + projection bridge for generated JS runtime cards.
 *
 * The backend (chathost ArtifactExtractor over <hypercard:card:v2> blocks)
 * publishes a ChatWidgetInstance with widgetName "inventory.codeCard" and
 * props { title, name, artifact:{id,data}, runtime:{pack}, card:{id,code} }.
 *
 * This widget is the old-chat "proposal card" (HypercardCardRenderer parity):
 * it does NOT execute inline. On mount it registers the card's code into the
 * os-scripting runtimeSurfaceRegistry (`registerRuntimeSurface(card.id, code,
 * pack)`) — replacing the dead os-chat artifactProjectionMiddleware — so any
 * live RuntimeSurfaceSessionHost live-injects it and later-opened surface
 * windows inject it during ensureSession. "Open" launches the surface window
 * through the existing createInventoryCardAdapter path; the card also becomes
 * visible in the Stacks & Cards manager via the generated-cards section.
 *
 * ChatProvider's Redux Provider uses an isolated context (ChatReduxContext),
 * so useDispatch() here still binds to the DESKTOP store — openWindow works.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { defineWidget, type WidgetProps } from '@go-go-golems/chat-provider';
import { openWindow } from '@go-go-golems/os-core/desktop-core';
import { buildArtifactOpenWindowPayload, registerRuntimeSurface } from '@go-go-golems/os-scripting';

interface CodeCardProps {
  title?: string;
  name?: string;
  artifact?: { id?: string; data?: Record<string, unknown> };
  runtime?: { pack?: string };
  card?: { id?: string; code?: string };
}

function InventoryCodeCard({ props, status }: WidgetProps) {
  const dispatch = useDispatch();
  const card = (props ?? {}) as CodeCardProps;
  const [codeExpanded, setCodeExpanded] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const surfaceId = card.card?.id?.trim() ?? '';
  const code = card.card?.code ?? '';
  const pack = card.runtime?.pack?.trim() ?? '';
  const artifactId = card.artifact?.id?.trim() || surfaceId;
  const displayName = card.name?.trim() || card.title?.trim() || 'Generated card';
  const windowTitle = card.title?.trim() || displayName;

  // Projection bridge: make the generated surface injectable into runtime
  // sessions. Idempotent (registry keyed by surfaceId, last write wins).
  useEffect(() => {
    if (!surfaceId || !code || !pack) {
      return;
    }
    try {
      registerRuntimeSurface(surfaceId, code, pack);
      setRegisterError(null);
    } catch (err) {
      setRegisterError(err instanceof Error ? err.message : String(err));
    }
  }, [surfaceId, code, pack]);

  const openPayload = useMemo(
    () =>
      surfaceId
        ? buildArtifactOpenWindowPayload({
            artifactId,
            title: windowTitle,
            bundleId: 'inventory',
            runtimeSurfaceId: surfaceId,
          })
        : undefined,
    [artifactId, windowTitle, surfaceId],
  );

  const openSurface = useCallback(() => {
    if (openPayload) {
      dispatch(openWindow(openPayload));
    }
  }, [dispatch, openPayload]);

  const valid = Boolean(surfaceId && code && pack);
  const codeLines = code.split('\n');
  const preview = codeExpanded ? code : codeLines.slice(0, 8).join('\n') + (codeLines.length > 8 ? '\n…' : '');

  return (
    <div className="inventory-card inventory-code-card" data-part="inventory-code-card" data-status={status}>
      <div className="inventory-card-header">
        <span className="inventory-card-title">🃏 {displayName}</span>
        <span className="inventory-card-subtitle">
          {pack ? `runtime: ${pack}` : 'runtime: —'}
          {surfaceId ? ` · card: ${surfaceId}` : ''}
        </span>
      </div>
      <div className="inventory-code-card-body">
        <pre className="inventory-code-card-code" data-expanded={codeExpanded}>{preview}</pre>
        {codeLines.length > 8 ? (
          <button type="button" className="inventory-code-card-toggle" onClick={() => setCodeExpanded((v) => !v)}>
            {codeExpanded ? '▲ collapse' : `▼ show all ${codeLines.length} lines`}
          </button>
        ) : null}
      </div>
      <div className="inventory-card-footer inventory-code-card-actions">
        <button type="button" className="inventory-code-card-open" disabled={!valid || !openPayload} onClick={openSurface}>
          ▶ Open
        </button>
        {registerError ? <span className="inventory-code-card-error">register failed: {registerError}</span> : null}
        {!valid ? <span className="inventory-code-card-error">incomplete card (needs card.id, card.code, runtime.pack)</span> : null}
      </div>
    </div>
  );
}

export const inventoryCodeCardWidget = defineWidget('inventory.codeCard', InventoryCodeCard);
