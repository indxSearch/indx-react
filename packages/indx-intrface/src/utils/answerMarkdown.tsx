import React from 'react';
import styles from '../components/AskPanel.module.css';

/**
 * The markdown an answer model writes, rendered without a dependency and without HTML: every piece
 * becomes a React element, so an answer cannot inject markup. Covers what answers from records
 * use: paragraphs, headings, lists, fenced code (with an unclosed fence while it streams), inline
 * code, bold, italics, http(s) links, and [n] as a citation mark.
 */

type Cite = (n: number) => React.ReactNode;

const INLINE = /(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(\*[^*\n]+\*|_[^_\n]+_)|(\[[^\]\n]+\]\(https?:\/\/[^)\s]+\))|(\[\d+\])/g;

function inline(text: string, cite: Cite, key: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index! > last) out.push(text.slice(last, m.index));
    const k = `${key}-${i++}`;
    const [token, code, bold, italic, link, ref] = m;
    if (code) out.push(<code key={k} className={styles.inlineCode}>{code.slice(1, -1)}</code>);
    else if (bold) out.push(<strong key={k}>{inline(bold.slice(2, -2), cite, k)}</strong>);
    else if (italic) out.push(<em key={k}>{inline(italic.slice(1, -1), cite, k)}</em>);
    else if (link) {
      const [, label, href] = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(link)!;
      out.push(<a key={k} href={href} target="_blank" rel="noopener noreferrer">{label}</a>);
    } else if (ref) out.push(<React.Fragment key={k}>{cite(Number(ref.slice(1, -1)))}</React.Fragment>);
    else out.push(token);
    last = m.index! + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

type Block =
  | { kind: 'code'; lang: string; text: string }
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'paragraph'; text: string };

function blocks(md: string): Block[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out: Block[] = [];
  let para: string[] = [];
  const flush = () => { if (para.length) { out.push({ kind: 'paragraph', text: para.join(' ') }); para = []; } };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const fence = /^\s*```\s*([\w+#-]*)\s*$/.exec(line);
    if (fence) {
      flush();
      const code: string[] = [];
      // Up to the closing fence, or the end of what has arrived: a block still streaming.
      for (i++; i < lines.length && !/^\s*```\s*$/.test(lines[i]!); i++) code.push(lines[i]!);
      out.push({ kind: 'code', lang: fence[1] ?? '', text: code.join('\n') });
      continue;
    }
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) { flush(); out.push({ kind: 'heading', level: heading[1]!.length, text: heading[2]! }); continue; }
    const item = /^\s*(?:([-*+])|(\d+)[.)])\s+(.*)$/.exec(line);
    if (item) {
      flush();
      const ordered = !!item[2];
      const prev = out[out.length - 1];
      if (prev?.kind === 'list' && prev.ordered === ordered) prev.items.push(item[3]!);
      else out.push({ kind: 'list', ordered, items: [item[3]!] });
      continue;
    }
    if (line.trim() === '') { flush(); continue; }
    // A line that continues a list item (indented) belongs to it.
    const prev = out[out.length - 1];
    if (para.length === 0 && prev?.kind === 'list' && /^\s{2,}\S/.test(line)) {
      prev.items[prev.items.length - 1] += ' ' + line.trim();
      continue;
    }
    para.push(line.trim());
  }
  flush();
  return out;
}

/** Renders an answer's markdown, with `cite(n)` for each [n]. */
export function answerMarkdown(answer: string, cite: Cite): React.ReactNode {
  return blocks(answer).map((b, i) => {
    const key = `b${i}`;
    switch (b.kind) {
      case 'code':
        return (
          <pre key={key} className={styles.codeBlock} data-lang={b.lang || undefined}>
            <code>{b.text}</code>
          </pre>
        );
      case 'heading':
        return <p key={key} className={styles.heading}>{inline(b.text, cite, key)}</p>;
      case 'list': {
        const List = b.ordered ? 'ol' : 'ul';
        return (
          <List key={key} className={styles.list}>
            {b.items.map((it, j) => <li key={j}>{inline(it, cite, `${key}-${j}`)}</li>)}
          </List>
        );
      }
      default:
        return <p key={key} className={styles.paragraph}>{inline(b.text, cite, key)}</p>;
    }
  });
}
