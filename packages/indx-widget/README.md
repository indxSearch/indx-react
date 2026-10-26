# @indxsearch/widget

Indx search, filters and the assistant (Search or ask) as one HTML element, for any site:
[intrface](../indx-intrface) packaged as a web component, laid out as indx.co's own search
(indx-web-v4, `SearchAskDemo`): the field and the results on a framed surface, and beside them a
column that switches between Filters and the Assistant. The field judges what is typed, a question
gets a prompt to ask, and the assistant answers from the dataset's records, puts its filters on the
list and takes follow-ups. Under 800px the column becomes two buttons under the field. For teams that are not on React, for trials, and for the plug-ins.
A team that wants its own look builds on intrface or the HTTP API instead.

```html
<script src="https://your-indx-server/widget/widget.js"></script>

<!-- a search page -->
<indx-search team="acme" dataset="products" key="(a Search key)"
             title-field="name" text-field="category" filters="category,brand"
             link="/products/{id}"></indx-search>

<!-- a field in the header that opens the search over the page (also Ctrl+K / Cmd+K) -->
<indx-search mode="overlay" team="acme" dataset="products" key="(a Search key)"
             title-field="name" link="/products/{id}" placeholder="Search products"></indx-search>
```

| Attribute | |
|---|---|
| `team`, `dataset` | Required. |
| `key` | A **Search** key, the only kind that belongs in a browser. |
| `url` | The Indx server. Left out: the server the script came from. |
| `mode` | `page` (default): a block with the field, filters and results. `overlay`: a field that opens the search over the page. |
| `title-field`, `text-field`, `image-field`, `price-field` | What a result shows: a title (the link), a line of text, an image beside it, a price. |
| `chip-fields` | Fields shown as chips under the title, comma separated (lists, and lists stored as text, are split). |
| `examples` | Questions the assistant offers to start from, separated by `\|`. |
| `link` | Where a result leads: a template with fields in braces (`/products/{id}`), or a field holding a URL. |
| `filters` | Fields to filter on, comma separated; each must be Facetable. The Filters panel shows with them; the Assistant with Search or ask on for the dataset. |
| `theme` | `light` (default), `dark`, or `auto` (follows the visitor's system). The page decides, not the visitor's computer. |
| `placeholder`, `source` | The overlay field's text; the statistics source (default `widget`). |

The page's own website must be in the server's list (Admin, Settings, Websites) to call it from a browser.

The widget reports what intrface does: a session per page load, `source=widget`, and a select when a
result is chosen. A purchase or an add to cart: `IndxSearch.convert(documentKey, 'order')`.

It renders in a shadow root, so the page's CSS does not reach it and its own does not reach the
page. It uses the page's typeface; everything else is intrface's look.

## Building

`npm run build` writes `dist/widget.js`, one classic script with React, systm, intrface and their
styles inside (about 140 KB compressed). `npm run copy-to-server` puts it in
`IndxServer/wwwroot/widget/`, where the server serves it.
