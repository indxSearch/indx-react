# Millum search app

> **Target:** IndxCloudApi v2, powered by IndxSearchLib v5 alpha.

Search interface for the **millum** dataset, built on `@indxsearch/intrface`.

Mirrors the structure of `apps/demo` but without the text/hybrid tabs — single text-search layout only.

## Getting Started

### Configuration

Create a `.env.local` in this directory:

```env
VITE_INDX_URL=http://your-indx-url.website.com
VITE_INDX_TOKEN=your-bearer-token-here
```

### Development

From the monorepo root:

```bash
npm run dev:millum
```

Then open [http://localhost:3002](http://localhost:3002).

### Build

```bash
npm run build:millum
```

## Project Structure

```
apps/millum/
├── src/
│   ├── main.tsx          # Entry point
│   ├── App.tsx           # Fields + filters + result rendering
│   ├── SearchClient.tsx  # Provider + layout (no tabs)
│   └── globals.css       # Global styles
├── index.html
├── vite.config.ts        # Dev server on port 3002
└── .env.local
```

## License

See the root LICENSE file.
