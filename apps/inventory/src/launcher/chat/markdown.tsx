/*
 * Markdown rendering for inventory chat messages (micromark + GFM). micromark
 * escapes raw HTML by default, so model output cannot inject markup.
 * Mirror of the launcher's chat/markdown.tsx (federation boundary forbids
 * sharing; Phase 6 dedupes into react-chat).
 */
import { useMemo } from 'react';
import { micromark } from 'micromark';
import { gfm, gfmHtml } from 'micromark-extension-gfm';

export function renderMarkdownHtml(text: string): string {
  try {
    return micromark(text, { extensions: [gfm()], htmlExtensions: [gfmHtml()] });
  } catch {
    const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<pre>${escaped}</pre>`;
  }
}

export function Markdown({ text }: { text: string }) {
  const html = useMemo(() => renderMarkdownHtml(text), [text]);
  return <div className="inv-md" dangerouslySetInnerHTML={{ __html: html }} />;
}
