/*
 * Inventory-specific ChatMessages adapter.
 *
 * react-chat now owns generic timeline iteration, widget/tool rendering, and
 * unknown-kind fallback. This file supplies inventory-specific message body
 * rendering: markdown, thinking traces, and HyperCard artifact stripping.
 */
import { useMemo, useState, type RefObject } from 'react';
import { ChatMessages, type TimelineEntityRenderer } from '@go-go-golems/chat-overlay';
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

const MessageRenderer: TimelineEntityRenderer = ({ entity }) => {
  const localEntity = entity as TimelineEntityLike;
  const role = localEntity.props.role;
  if (role === 'thinking') {
    return <ThinkingBlock entity={localEntity} />;
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
      <MessageBody entity={localEntity} />
    </div>
  );
};

export function InventoryChatMessages({ bottomRef }: { bottomRef?: RefObject<HTMLDivElement | null> }) {
  return <ChatMessages bottomRef={bottomRef} renderers={{ message: MessageRenderer }} />;
}
