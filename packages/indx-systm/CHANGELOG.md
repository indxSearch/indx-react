# Changelog

## 2.14.1

### Patch Changes

- 45100c9: NavigationMenu: the panel is already under its trigger the first time it opens. The offset was measured into state, so it arrived a render after the panel was visible and the panel was seen sliding in from the start edge. It is now written straight to the element in a layout effect, and the transition is suppressed for an open and for a reflow while open, so only a move from one trigger to the next animates.

## 2.14.0

### Minor Changes

- c7dabbc: NavigationMenu: the shared panel opens under the trigger that opened it, clamped so it never leaves the menu. `align` now moves the list only, which is the layout choice it always was. A menu whose dropdown is not the edge-most item no longer drops its panel at the far edge, detached from the button it belongs to. `panelAlign="start"` or `"end"` pins the panel to an edge instead, which is the old behaviour.
- 712b613: SaveBar: the Save / Cancel row of a page that edits a working copy. It sits after the content and sticks to the bottom of the window while that content is taller than the screen. Render it only while there is something to save. `aside` holds secondary actions such as export and import.

## 2.13.0

### Minor Changes

- e3e02c9: Breadcrumbs: `overflow="truncate"` keeps the trail on one line for headers. Labels ellipsize, ancestors give way before the current page, and a step with an icon collapses to the icon and its switcher. The default stays `wrap`.
- ab084ad: Table: with `scrollable`, `bleedEnd` lets the frame reach into the gutter on its end side, so a table that has to scroll runs to the edge of the screen. The start side stays at the page margin, where a pinned first column belongs.
- 5e505fe: Table: `scrollable` puts the table in a frame that scrolls sideways, so a wide table never makes the page scroll, and `stickyFirstColumn` keeps the first column in place inside it. New `Truncate` component: one line that ellipsizes and shrinks inside flex and grid, with `side="start"` to cut the beginning and keep the end, for nested names, paths and URLs. New `Disclosure` component: a row that opens onto a section, with `aria-expanded`, rendered only while open. `TableCell` takes `colSpan`.
- e3e02c9: Tabs: `variant="button"` fills the active tab like a primary Button. Items take `disabled` with a `title` for the reason (rendered as `aria-disabled`, skipped by the arrow keys), and a `badge`. A scrollable bar now reveals the active tab when it is selected from outside, and no longer scrolls the page when doing so. Items with an `href` turn the bar into a nav of links with `aria-current="page"`, with `renderLink` for router links and `aria-label` to name it. With `scrollable`, `bleed` lets the bar reach out into the gutter beside it, so the edge fade sits in the gutter and the tabs scroll into it; without it the fade is a fixed-slope gradient that slides in from outside the frame.

## 2.12.1

### Patch Changes

- 7cc279d: InputField shrinks inside flex rows and grid columns: the wrapper has `min-width: 0` and the input fills it (`width: 100%`, `box-sizing: border-box`). App-level overrides on the wrapper and input are no longer needed.

## 2.12.0

### Minor Changes

- 39b7a38: NavigationMenu: `size="large"` (matches Button large, 21px icons), `align="end"` to pin the list and panel to the end edge, `panelWidth`, vertical orientation for mobile menus, and an `icon` prop on `NavigationMenuLink` so a top-level link matches a trigger beside it.

## 2.11.1

### Patch Changes

- a93c907: The hourglass spinner turns clockwise, with redrawn keyframes.

All notable changes to @indxsearch/systm will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.11.0] - 2026-09-16

### Added

- `Tabs`: an optional `icon` per item, shown before the label. It inherits the tab's colour
  through `currentColor`, so a selected tab's icon follows its label, and it is hidden from
  assistive technology since the label already names the tab. The tab sizes the icon — 21 on
  large tabs (pixl's own default), 14 on micro and default, both multiples of the pixl grid —
  unless the icon carries a size of its own, so the call site is just the icon. The Blazor port
  takes it the way `Button` and `Chip` do, as a `RenderFragment<int>` given the same size.

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
