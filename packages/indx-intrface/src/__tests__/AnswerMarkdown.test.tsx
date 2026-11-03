import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { answerMarkdown } from '../utils/answerMarkdown';

// How an answer's markdown is shown: every piece an element, never HTML from the text.

const cite = (n: number) => <sup data-cite={n}>{n}</sup>;
const show = (md: string) => render(<div>{answerMarkdown(md, cite)}</div>).container;

describe('answerMarkdown', () => {
  it('renders a fenced code block whole, with its line breaks', () => {
    const c = show('Combine them:\n\n```csharp\nvar a = 1;\nvar b = 2;\n```\n\nThat is all [2].');
    expect(c.querySelector('pre code')!.textContent).toBe('var a = 1;\nvar b = 2;');
    expect(c.querySelector('pre')!.getAttribute('data-lang')).toBe('csharp');
    expect(c.querySelector('[data-cite="2"]')).toBeTruthy();
  });

  it('shows a code block that is still streaming', () => {
    const c = show('Like this:\n```json\n{ "text": "pika');
    expect(c.querySelector('pre code')!.textContent).toBe('{ "text": "pika');
  });

  it('renders lists, headings, inline code, bold and italics', () => {
    const c = show('## Steps\n- Open **Synonyms** [1]\n- Set `Searchable` to *true*\n\n1. one\n2. two');
    expect(c.querySelectorAll('ul li').length).toBe(2);
    expect(c.querySelectorAll('ol li').length).toBe(2);
    expect(c.querySelector('strong')!.textContent).toBe('Synonyms');
    expect(c.querySelector('code')!.textContent).toBe('Searchable');
    expect(c.querySelector('em')!.textContent).toBe('true');
    expect(c.textContent).toContain('Steps');
    expect(c.querySelector('li [data-cite="1"]')).toBeTruthy();
  });

  it('links http and https only, and never turns text into markup', () => {
    const c = show('See [the docs](https://docs.indx.co) or [this](javascript:alert(1)). <img src=x onerror=alert(1)>');
    const links = c.querySelectorAll('a');
    expect(links.length).toBe(1);
    expect(links[0]!.getAttribute('href')).toBe('https://docs.indx.co');
    expect(links[0]!.getAttribute('rel')).toContain('noopener');
    expect(c.querySelector('img')).toBeNull();
    expect(c.textContent).toContain('<img src=x onerror=alert(1)>');
  });
});
