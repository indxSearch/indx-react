# Spinner keyframes

Preloader animations on the pixl 7x5 grid, authored as SVG files (export from
Figma exactly like pixl icons) and compiled into the `Spinner` component.

```
spinners/
  <name>/
    1.svg           one SVG per frame, played in natural sort order
    2.svg           (a keyframes/ subfolder also works)
    ...
    config.json     optional: { "delay": 120, "pingpong": true }
                    delay — ms per frame (default 100)
                    pingpong — play frames forward then back (1,2,3,2 loop)
```

- Frames play with hard cuts (terminal-spinner style), no tweening.
- Both merged `<path>`s and individual `<rect>`s are understood.
- An SVG with no `<path>`/`<rect>` is a blank frame.
- Fill colors in the SVGs are ignored; the component draws with its `color` prop.
- The folder name becomes the `name` prop value: `<Spinner name="dots" />`.

After adding or changing frames, run:

```bash
npm run generate:spinners
```

(also runs automatically before `npm run build`). It regenerates
`src/components/Spinner/spinners.generated.ts` and `.css` — never edit those by
hand.
