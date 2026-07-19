/**
 * Markdown — a small, dependency-free renderer for AI chat output.
 * Renders to React elements (never raw HTML injection). Covers the subset
 * LLMs actually emit: headings, bold/italic, inline code, fenced code blocks,
 * bullet/ordered lists, links and paragraphs. Safe for streaming (tolerates
 * an unclosed code fence mid-stream).
 */
import React from 'react';

const INLINE = /(\*\*([^*]+)\*\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)\s]+)\))|(\*([^*]+)\*)/g;

function renderInline(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  INLINE.lastIndex = 0;
  while ((m = INLINE.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<strong key={key++} className="font-bold text-on-surface">{m[2]}</strong>);
    else if (m[3]) out.push(<code key={key++} className="px-1 py-0.5 rounded bg-on-surface/10 text-[0.85em] font-mono">{m[4]}</code>);
    else if (m[5]) out.push(<a key={key++} href={m[7]} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">{m[6]}</a>);
    else if (m[8]) out.push(<em key={key++} className="italic">{m[9]}</em>);
    last = INLINE.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export const Markdown: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.replace(/\r/g, '').split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.trim().startsWith('```')) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) { code.push(lines[i]); i++; }
      i++; // skip closing fence (if present)
      blocks.push(
        <pre key={key++} className="overflow-x-auto rounded-xl bg-on-surface/[0.06] border border-on-surface/10 p-3 text-[12px] leading-relaxed">
          <code className="font-mono whitespace-pre">{code.join('\n')}</code>
        </pre>
      );
      continue;
    }

    // Heading (#, ##, ###)
    const h = line.match(/^(#{1,3})\s+(.*)/);
    if (h) {
      const size = h[1].length === 1 ? 'text-[15px]' : 'text-sm';
      blocks.push(<p key={key++} className={`font-bold text-on-surface ${size} mt-1`}>{renderInline(h[2])}</p>);
      i++;
      continue;
    }

    // Unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*]\s+/, '')); i++; }
      blocks.push(
        <ul key={key++} className="list-disc pl-5 space-y-1">
          {items.map((it, k) => <li key={k}>{renderInline(it)}</li>)}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*\d+\.\s+/, '')); i++; }
      blocks.push(
        <ol key={key++} className="list-decimal pl-5 space-y-1">
          {items.map((it, k) => <li key={k}>{renderInline(it)}</li>)}
        </ol>
      );
      continue;
    }

    // Blank line
    if (line.trim() === '') { i++; continue; }

    // Paragraph (gather consecutive plain lines)
    const para: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !lines[i].trim().startsWith('```') &&
      !/^#{1,3}\s/.test(lines[i])
    ) { para.push(lines[i]); i++; }
    blocks.push(<p key={key++}>{renderInline(para.join(' '))}</p>);
  }

  return <div className="space-y-2 text-sm leading-relaxed text-on-surface">{blocks}</div>;
};
