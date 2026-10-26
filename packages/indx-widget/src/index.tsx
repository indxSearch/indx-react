import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { PortalContainerProvider } from '@indxsearch/systm';
import systmCss from '@indxsearch/systm/styles.shadow.css?inline';
import intrfaceCss from '@indxsearch/intrface/styles.css?inline';
import widgetCss from './widget.css?inline';
import { Widget, type WidgetConfig } from './Widget';
import { convert } from './registry';

/**
 * <indx-search>: Indx search, filters and Search or ask in any page, intrface inside a custom
 * element. It renders into its own shadow root, so the page's CSS does not reach it and its styles
 * do not reach the page; systm's floating parts (the overlay, a select) render inside it too.
 *
 *   <script src="https://search.example.com/widget/widget.js"></script>
 *   <indx-search team="acme" dataset="products" key="(a Search key)"></indx-search>
 *
 * The server is where the script came from, unless `url` names another.
 */

// Read while the script runs: afterwards document.currentScript is gone.
const scriptOrigin = (() => {
  const script = document.currentScript as HTMLScriptElement | null;
  try { return script?.src ? new URL(script.src).origin : window.location.origin; }
  catch { return window.location.origin; }
})();

/**
 * The page decides light or dark, not the visitor's computer: a shop with a white page shows a
 * white search. systm's dark tokens come under `prefers-color-scheme: dark`; here they apply to
 * `theme="dark"` always and to `theme="auto"` with the system's dark mode. Rewritten from systm's
 * own rule, so the values never drift from it.
 */
export function themed(css: string): string {
  return css.replace(/@media\s*\(prefers-color-scheme:\s*dark\)\s*\{\s*:host\s*\{([^}]*)\}\s*\}/g,
    (_, tokens: string) => `:host([theme="dark"]){${tokens}}@media (prefers-color-scheme: dark){:host([theme="auto"]){${tokens}}}`);
}

const attributes = ['url', 'team', 'dataset', 'key', 'mode', 'source', 'placeholder', 'theme',
  'title-field', 'image-field', 'price-field', 'text-field', 'link', 'filters'] as const;

class IndxSearchElement extends HTMLElement {
  static observedAttributes = [...attributes];
  private root?: Root;
  private mount?: HTMLDivElement;

  connectedCallback() {
    const shadow = this.shadowRoot ?? this.attachShadow({ mode: 'open' });
    if (!this.mount) {
      const style = document.createElement('style');
      style.textContent = `${themed(systmCss)}\n${intrfaceCss}\n${widgetCss}`;
      this.mount = document.createElement('div');
      shadow.append(style, this.mount);
    }
    // The page's own typeface, so the search reads as part of the page.
    const font = getComputedStyle(this).fontFamily;
    if (font) this.style.setProperty('--font-family', font);
    this.root ??= createRoot(this.mount);
    this.render();
  }

  disconnectedCallback() {
    this.root?.unmount();
    this.root = undefined;
  }

  attributeChangedCallback() {
    if (this.root) this.render();
  }

  private render() {
    const missing = ['team', 'dataset'].filter(a => !this.getAttribute(a));
    if (missing.length > 0) {
      console.warn(`<indx-search> needs ${missing.join(' and ')}.`);
      return;
    }
    this.root!.render(
      <PortalContainerProvider container={this.shadowRoot}>
        <Widget {...this.config()} />
      </PortalContainerProvider>,
    );
  }

  private config(): WidgetConfig {
    const a = (name: string) => this.getAttribute(name)?.trim() || undefined;
    return {
      url: (a('url') ?? scriptOrigin).replace(/\/$/, ''),
      team: a('team')!,
      dataset: a('dataset')!,
      token: a('key'),
      mode: a('mode') === 'overlay' ? 'overlay' : 'page',
      source: a('source') ?? 'widget',
      placeholder: a('placeholder'),
      titleField: a('title-field'),
      imageField: a('image-field'),
      priceField: a('price-field'),
      textField: a('text-field'),
      link: a('link'),
      filters: (a('filters') ?? '').split(',').map(f => f.trim()).filter(Boolean),
    };
  }
}

if (!customElements.get('indx-search')) customElements.define('indx-search', IndxSearchElement);

/** The page's handle on the widget: `IndxSearch.convert(documentKey, 'order')` after a purchase. */
(window as unknown as { IndxSearch: unknown }).IndxSearch = { convert };
