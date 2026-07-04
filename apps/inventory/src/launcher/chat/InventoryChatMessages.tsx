/*
 * Inventory chat message list — local replacement for chat-overlay's
 * ChatMessages. Renders assistant/user text as markdown, thinking traces as
 * collapsible blocks, strips <hypercard:*> artifact blocks from message text
 * (their widgets render separately) with a "building card" placeholder while
 * a block is still streaming, and keeps widget/tool_call rendering on the
 * chat-provider outlets. Unknown kinds render collapsed instead of dropped.
 */
import { useMemo, useState, type RefObject } from 'react';
import { useChatSelector, selectTimelineEntities, WidgetOutlet, ToolCallOutlet } from '@go-go-golems/chat-provider';
import { Markdown } from './markdown';
import { stripHypercardBlocks } from './hypercardBlocks';

interface TimelineEntityLike {
  id: string;
  kind: string;
  version?: number;
  props: Record<string, unknown>;
}

function ThinkingBlock({ entity }: { entity: TimelineEntityLike }) {
  const streaming = Boolean(entity.props.streaming);
  const [open, setOpen] = useState(streaming);
  const content = String(entity.props.content ?? '');
  return (
    <div className="inv-thinking" data-state={open ? 'open' : 'closed'}>
      <button type="button" className="inv-thinking-summary" onClick={() => setOpen((v) => !v)}>
        {open ? '▼' : '▶'} 💭 Thinking{streaming ? '…' : ''}
      </button>
      {open ? (
        <div className="inv-thinking-body">
          <Markdown text={content} />
          {streaming ? <span className="cursor-blink">▌</span> : null}
        </div>
      ) : null}
    </div>
  );
}

function MessageBody({ entity }: { entity: TimelineEntityLike }) {
  const content = String(entity.props.content ?? '');
  const streaming = Boolean(entity.props.streaming);
  const { text, building, buildingTag } = useMemo(() => stripHypercardBlocks(content), [content]);
  return (
    <div className="mt-0.5">
      <Markdown text={text} />
      {building ? (
        <div className="inv-card-buildup" data-part="card-buildup">
          <span className="inv-card-buildup-spinner" aria-hidden>🃏</span>
          Building {buildingTag === 'card' ? 'card' : buildingTag ?? 'artifact'}…
        </div>
      ) : streaming ? (
        <span className="cursor-blink">▌</span>
      ) : null}
    </div>
  );
}

function MessageEntity({ entity }: { entity: TimelineEntityLike }) {
  const role = entity.props.role;
  if (role === 'thinking') {
    return <ThinkingBlock entity={entity} />;
  }
  const isUser = role === 'user';
  return (
    <div
      className={[
        'px-2 py-1.5 text-xs',
        isUser ? 'border-l-2 border-mac-black bg-mac-gray-5 text-mac-gray-1' : 'text-mac-black',
      ].join(' ')}
    >
      <span className="text-mac-gray-3 text-[10px] uppercase mr-1">{isUser ? 'you' : 'assistant'}</span>
      <MessageBody entity={entity} />
    </div>
  );
}

function UnknownEntity({ entity }: { entity: TimelineEntityLike }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="text-xs" style={{ padding: '2px 8px' }}>
      <span onClick={() => setExpanded((v) => !v)} style={{ cursor: 'pointer' }} className="text-mac-gray-3" title={entity.id}>
        {expanded ? '▼' : '▶'} [{entity.kind}]
      </span>
      {expanded ? (
        <pre className="whitespace-pre-wrap break-words" style={{ margin: '2px 0 0' }}>
          {JSON.stringify(entity.props, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}

export function InventoryChatMessages({ bottomRef }: { bottomRef?: RefObject<HTMLDivElement | null> }) {
  const entities = useChatSelector(selectTimelineEntities) as TimelineEntityLike[];

  if (entities.length === 0) {
    return (
      <div className="text-mac-gray-3 text-xs italic">
        No messages yet. Type something below.
        <div ref={bottomRef} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entities.map((entity) => {
        if (entity.kind === 'widget') {
          return (
            <WidgetOutlet
              key={entity.id}
              instanceId={String(entity.props.instanceId || entity.id)}
              widgetName={String(entity.props.widgetName || 'unknown')}
              status={String(entity.props.status || 'READY')}
              props={(entity.props.props as Record<string, unknown>) || {}}
            />
          );
        }
        if (entity.kind === 'tool_call') {
          return (
            <ToolCallOutlet
              key={entity.id}
              toolCallId={String(entity.props.toolCallId || entity.id)}
              toolName={String(entity.props.toolName || 'unknown')}
              status={String(entity.props.status || 'requested')}
              input={entity.props.input}
              result={entity.props.result}
              error={entity.props.error as string | undefined}
            />
          );
        }
        if (entity.kind === 'message') {
          return <MessageEntity key={entity.id} entity={entity} />;
        }
        return <UnknownEntity key={entity.id} entity={entity} />;
      })}
      <div ref={bottomRef} />
    </div>
  );
}
