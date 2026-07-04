/*
 * Frontend renderer + projection bridge for generated JS runtime cards.
 *
 * The backend (chathost ArtifactExtractor over <hypercard:card:v2> blocks)
 * publishes a ChatWidgetInstance with widgetName "inventory.codeCard" and
 * props { title, name, artifact:{id,data}, runtime:{pack}, card:{id,code} }.
 *
 * The widget is a compact launcher chip — it does NOT show the generated
 * code (raw code in chat is noise; the message text's block is stripped by
 * InventoryChatMessages). Actions: ▶ Open executes the card as a surface
 * window via the existing createInventoryCardAdapter path; ✏️ Edit opens the
 * code in the runtime-surface code editor (same flow as Stacks & Cards'
 * registry section).
 *
 * On mount it registers the card's code into the os-scripting
 * runtimeSurfaceRegistry (`registerRuntimeSurface(card.id, code, pack)`) —
 * replacing the dead os-chat artifactProjectionMiddleware — so any live
 * RuntimeSurfaceSessionHost live-injects it and later-opened surface windows
 * inject it during ensureSession.
 *
 * ChatProvider's Redux Provider uses an isolated context (ChatReduxContext),
 * so useDispatch() here still binds to the DESKTOP store — openWindow works.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { defineWidget, type WidgetProps } from '@go-go-golems/chat-provider';
import { openWindow } from '@go-go-golems/os-core/desktop-core';
import { buildArtifactOpenWindowPayload, openCodeEditor, registerRuntimeSurface } from '@go-go-golems/os-scripting';

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

  const editCode = useCallback(() => {
    if (surfaceId && code) {
      openCodeEditor(dispatch, { ownerAppId: 'inventory', surfaceId }, code, pack || undefined);
    }
  }, [dispatch, surfaceId, code, pack]);

  const valid = Boolean(surfaceId && code && pack);

  return (
    <div className="inventory-card inventory-code-card" data-part="inventory-code-card" data-status={status}>
      <div className="inventory-code-card-row">
        <span className="inventory-code-card-icon" aria-hidden>🃏</span>
        <span className="inventory-code-card-name" title={windowTitle}>{displayName}</span>
        <span className="inventory-code-card-pack">{pack || '—'}</span>
        <span className="inventory-code-card-spacer" />
        <button type="button" className="inventory-code-card-open" disabled={!valid || !openPayload} onClick={openSurface}>
          ▶ Open
        </button>
        <button type="button" className="inventory-code-card-edit" disabled={!surfaceId || !code} onClick={editCode}>
          ✏️ Edit
        </button>
      </div>
      {registerError ? <div className="inventory-code-card-error">register failed: {registerError}</div> : null}
      {!valid ? <div className="inventory-code-card-error">incomplete card (needs card.id, card.code, runtime.pack)</div> : null}
    </div>
  );
}

export const inventoryCodeCardWidget = defineWidget('inventory.codeCard', InventoryCodeCard);
