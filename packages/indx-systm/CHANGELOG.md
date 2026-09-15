# Changelog

All notable changes to @indxsearch/systm will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.10.1] - 2026-09-15

### Changed

- Chat family: no borders. `ChatPanel` loses its outline and the rules above the composer and
  the hints; the `Composer` becomes a quiet field one tone below the panel. Regions are told
  apart by tone and spacing. 2.10.0 was published before this change.

## [2.10.0] - 2026-09-15

### Added

- Chat family, promoted from the components-gallery mockup: `ChatPanel` (header /
  scrolling thread / composer / hints frame, with `Kbd` and `defaultChatHints`),
  `UserMessage` and `AssistantMessage`, `Composer` (Enter sends, Shift+Enter breaks
  the line, grows to `maxLines`, Send becomes Stop while `streaming`), `CitationRef`
  (inline numbered mark) and `CitationList` (numbered chips with a source-type icon),
  `StreamStatus`, `Suggestions` and `AnswerActions` (Copy + Ask a follow-up). First
  used by the docs assistant in indx-docs. Not yet in Blazor.

## [2.9.0] - 2026-09-12

### Added

- `Alert`, `AlertTitle`, `AlertDescription`: an in-page callout with variants
  `default` / `info` / `success` / `warning` / `destructive`, a default icon per
  variant (`icon` overrides, `null` suppresses), and `role="alert"` for
  warning/destructive. No shadow; the variant colours the icon, title and a 2px
  start edge. Ported to Blazor.
- Tokens `--CLightBlue` and `--CWarning` in globals.css, matching the Blazor side.

## [2.8.0] - 2026-09-11

### Added

- `Breadcrumbs`: page trail where each step is a link and may carry an
  independent context switcher (`switcher`: current value, options, and an
  optional `action` entry such as "New team…" that runs instead of selecting).
  Sizes `micro` and `default`; step icons render at 14px. Ported to Blazor.
- `NavigationMenu`: Radix navigation menu with Systm styling (`NavigationMenu`,
  `NavigationMenuList`, `NavigationMenuItem`, `NavigationMenuTrigger`,
  `NavigationMenuContent`, `NavigationMenuLink`). Not yet in Blazor.

## [2.7.0] - 2026-09-08

### Added

- `Spinner`: two new animations — `analytics` (8×5 grid; the viewBox ratio is
  respected, so non-7×5 spinners size correctly) and `flag`.

## 2.6.1

### Patch Changes

- Accessibility and range-handling fixes.

  - `Button`: a disabled link button no longer navigates — it renders without `href`, with `aria-disabled="true"` and `tabIndex={-1}`, and swallows clicks. Native buttons pass `disabled` through. The dev-only warning now uses `import.meta.env.DEV`, so `process.env` no longer leaks into browser bundles.
  - `Slider`: a degenerate range (`max <= min` or a non-finite bound) renders a disabled track instead of handing react-range impossible values.
  - `Tabs`: proper `role="tab"` / `aria-controls` wiring with roving `tabIndex`, arrow-key navigation that wraps, and focus follows the selected tab.
  - `DatePicker`: trigger is labelled by the field label and current value, the calendar supports arrow / Home / End / PageUp / PageDown keyboard navigation, focus moves with the highlighted day, and Escape returns focus to the trigger.
  - `Table`: typing fix.

## [2.6.0] - 2026-09-04

### Added

- `Spinner`: nineteen new animations — accelerate, accordion,
  circle-open-close, circle-rotate, clock, coffee, hourglass, loop, pacman,
  pong, sliders, smile-wink, snake, snake-eight, spark, spectrum,
  speedometer, terminal, wi-fi (all listed in `spinnerNames`).
- Keyframe generator understands Figma export quirks: `<defs>`/clipPath
  rects and white cutouts are stripped, and `rotate()`/axis-aligned
  `matrix()` rect transforms are folded into grid coordinates.

## [2.5.0] - 2026-09-03

### Added

- `Spinner`: preloaders on the pixl 7x5 grid, played as hard-cut keyframes
  (terminal-spinner style). Ships `grow`, `pulse`, `rotate`, `rowing`; props
  `name`, `size` (number or CSS length, pixl 7:5 ratio), `color` (defaults to
  `currentColor`), `delay` (ms per frame override). Works as Button
  `iconLeft`/`iconRight`. Honors `prefers-reduced-motion` by freezing on the
  first frame. `spinnerNames` exports the available names.
- Spinner keyframes are authored as SVG files in `spinners/<name>/keyframes/`
  and compiled by `npm run generate:spinners` (runs automatically on build).

## [2.4.0] - 2026-08-27

### Added

- `Tabs`: `scrollable` prop — horizontally scrollable tab strip with scroll-aware fade edges.

### Changed

- Chart design refinements.

## [2.3.0] - 2026-06-18

### Added

- `Select`: `SelectOption` gains an optional `icon` (`React.ReactNode`), rendered
  in both the trigger (selected value) and the menu items. Backward-compatible —
  existing options without an icon are unchanged.

### Compatibility

- React ^19.0.0 · additive, no breaking changes. Keeps parity with the
  `Indx.Systm.Blazor` `SelectField` (per-option `Icon`).

## [2.2.0] - 2026-06-17

### Added

- `Chip`: optional leading `icon` and a `size` variant (`default` | `large`) so
  icon chips have room to breathe.

### Compatibility

- React ^19.0.0 · stable release, no breaking changes. Not cloud-bound — usable
  independently of the IndxCloudApi version.

## [2.0.0] - 2026-05-12

### Changed

- Version bump to align with the indx-react monorepo v5 release
- No breaking changes to components or CSS API

### Compatibility

- React ^19.0.0
- React DOM ^19.0.0
