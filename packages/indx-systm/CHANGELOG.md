# Changelog

## 2.23.0

### Minor Changes

- ScoreMeter: a score from 0 to 1 as a row of small cells lit up to it, with a thin tick at each threshold and its name on hover; the cells strengthen as the score passes the ticks, the full ink past every one. Compact, for a line of text.
- ShimmerText: text a highlight sweeps across, for a line that says something is about to happen, such as "Thinking" or "For a quick answer, type a bit more". `active={false}` holds it still, and it is still for anyone who has asked for reduced motion.
- Chart: the hover box sits beside the hovered bar or point, to its right where it fits and else to its left, at the pointer's height, rather than above or below it over what it describes.
- RadarChart: its box is only a line's height taller than the shape above and below, where it kept the side labels' room on every side.
- Sidebar items take `badgeTitle` and a `trailing` icon with its `trailingTitle` (the lab mark of an experimental section), and the viewer's rail is kept in a cookie of the storage key's name too, so a server-rendered page can draw it from the first frame.
- Button: `aria-disabled="true"` reads as off, as `disabled` does, so an item that is there but not yet usable looks it.
- ab22891: Sheet, a panel the height of the window over the page from its right or left edge, with a header, a body that scrolls and an optional footer; the focus stays inside and goes back to what opened it. Resizable, two panes with a handle the reader drags or moves with the arrow keys, its size kept with `storageKey`. Reasoning, the chat's "Thinking…" row that folds to "Thought for 4s" once the answer begins.
- ee2c6be: Chat: `ToolStep` and `ToolSteps` show what an assistant did on its way to an answer, one line per step with what came of it (`meta`). A running step has the same spinner as `StreamStatus`, a finished one the tool's icon, a failed one the error mark. With `detail` the row opens to show what went in and what came back. `ChatPanel` now shows a Latest button over the thread while it is scrolled up from the newest turn; `jumpToLatest={false}` leaves it out.
- 975a6fc: Combobox: a Select you can type into, for a list too long to scroll. Closed it is a Select; open, a search box sits over the options. Typing narrows them, labels that start with what was typed first; the arrows move the highlight, Enter chooses and Escape closes, and the field gets its focus back. Pass `search` for a search of your own.
- 3aef120: CommandPalette: a jump menu over the page, opened with Cmd or Ctrl and K (`shortcut`). Typing narrows it, the arrows move the highlight, Enter chooses and Escape closes. It shows the `items` it is given for the `query`, listed under their `group`; the host does the searching.
- 42a4481: EmptyState: what a list or a page shows while it has nothing yet. A large icon in a quiet tone, a title, a line saying what would be here and how it gets here, and optional `actions`. `size="compact"` sits inside a tab or a section.
- 0aa041a: Kbd is a component of its own: a filled key cap with no outline, the page's font small and medium, after shadcn's. CommandPalette and the chat hints draw their keys with it; it is still exported where it was.
- 0245481: Popover: `role="menu"` makes it a menu, its ghost Buttons full width with the arrows moving between them, and `PopoverDivider` separates groups. The panel takes the raised surface tone (`--lv2`, `--lv1` in dark mode) instead of `--lv3`, keeps 8px from the window's edge, and sets `aria-haspopup` on the trigger.
- 4aa88f7: systm can render inside a shadow root. `PortalContainerProvider` names where the floating parts (Modal, Select, Tooltip, Popover, DatePicker, the Breadcrumbs' switchers) render, so they stay inside the root instead of going to `document.body`; without it nothing changes. `@indxsearch/systm/styles.shadow.css` is the stylesheet for a shadow root, its tokens and page rules on `:host`.
- b2a34bd: Sidebar: the side column of an app, groups of Buttons with the open one primary. Cmd or Ctrl and B, or the button at its foot, folds it to a rail of icons, where each item names itself in a Tooltip and a badge is a dot; `storageKey` keeps the viewer's choice. A group with `collapsible` opens and closes under its title. At 768px and narrower it is a drawer over the page, opened by the host (`open`, `onOpenChange`) and closed by Escape, a press beside it or a choice.
- 08dcd53: TagsInput: a list of short values edited as chips in one field. A separator (`;` and `,` by default, set with `separators`) or Enter makes a chip, a paste makes one per part, Backspace takes the last chip back to be mended, and a value already there is not added twice.
- 8aab4c1: Toast: `toast()` and `toast.error()` show a brief notice at the window's lower right, and `<Toaster />` shows them. A notice stays four seconds and a failure eight, the pointer on one holds it, and it may carry one action ("Undo"). No motion: it is simply there, and then not.
- 3635b41: TreeCanvas is a board: drag it or scroll with two fingers to pan, pinch or Ctrl/Cmd and the wheel to zoom at the pointer, with zoom in, zoom out, fit and the zoom shown in its corner, and the arrows, + - and 0 from the keyboard. It opens fitted to the tree. Handles mark where the edges leave and arrive, and a dashed edge leads to a node kept only as the way down to a match. `pattern` lays a systm pattern behind it, such as `'grid-12'`, which follows the pan and the zoom. `pan={false}` makes it a still picture. `zoom` is now the zoom it opens at; left out, it fits.
- 9b63f48: `Waffle`: hovering a cell names its segment in a tooltip beside it, with its share, and a cell or a legend entry under the pointer dims the other segments, so which is which can be browsed from either side. A segment also takes an `icon`, a small graphic before its label in the legend and the tooltip, about the text's height: a pixl icon at 14, or a flag.

## 2.22.0

### Minor Changes

- a848bf1: `BarMeter` `shape="ring"`: the same bars around a circle, from the top clockwise, with the value in the middle and the label beneath. `size` sets the diameter, 72px by default; 48 is the smallest that holds a short value and fits a Stat as its value, and from 96 the ceiling joins the value on a second line. `label` is now optional in both shapes.
- 1bcaa7f: `BarMeter` `segments`: the row as shares of a whole instead of a level, each segment its share of the bars in a tone of its own, its name and share above it and a hairline between. Holders by kind, documents by type. A segment under 8 % of the row gets no head, the last one apart, and `labels="legend"` lists all segments under the bars instead. `value` and `max` are optional, since the segments are the whole.
- 79f891e: `BarMeter` `zones`: levels from which the filled bars change colour, cool blue when idle, teal when fine, a warning from 70 % and the signal red from 85 %, in both shapes. One bar in each zone's colour marks where it starts, so the thresholds are seen before they are reached; `color` overrides them.
- 029a381: `BarMeter`: a level against its ceiling as a row of bars, the filled ones in the ink and the rest dim, with a label above and the value and ceiling below. For CPU pressure, memory in use, a quota: where ProgressBar is a percentage on its way to done, this goes up and down. `color` paints the filled bars, for a level past a threshold.
- a8c906a: `BarSlider`: a slider that is its own row. The fill runs from the left edge to the value and spans the full height, the label sits inside at the left, the value at the right, and the handle is a thin line at the fill's edge. Sized like a Button (`default` 40px, `micro` 30px), so a stack of settings lines up with fields. `stepMarks` draws a dot per step on the track, `format` shapes the value shown.
- c946a3c: `Chart`: `yAxis` ("left" or "right") puts round ticks on the value axis, each with a faint gridline, and widens the range to them; `yFormat` sets their text, compact by default (1.2k, 3M). `references` are levels to read the data against, a threshold, an average, a quota: each a dashed line with its label in a tag at the right, in the ink or in a colour such as the signal red for a limit. A reference outside the data pulls the range out to include it.
- 1e09a2a: `Chart`: `fill` per series. `solid` is the series colour, flat on a bar and faint under a line, so a single series reads as an area; `hatch`, `dots` and `checker` are drawn in the colour on the 2px pixel grid, so two or three series tell apart in one tone. A bar is solid unless told otherwise; a line stays a wire unless given an area. The legend shows a patterned series' pattern.
- f684405: `Chart`: `low` and `high` on a line series, one value per point, draw a band behind the line, faint in the series colour or in its pattern when `fill` is one; the tooltip adds the range under the value, named by `rangeLabel`. Latency as the median with its p5 to p95 spread, a forecast with its margin.
- 6e9b5f5: `Chart`: `stacked` puts a bar chart's series on top of each other in one bar per label, in series order from the baseline, so the bar's height is the total; the range follows the totals and the tooltip lists each part and the total.
- 7a0fa0c: `Chart`: `step` on a line series holds the value flat until the next point and then jumps, for a record count or a quota that changes on a date. `signal` on a reference makes it a limit: whatever lies above it is drawn in the signal red, bars and points alike.
- 24d1515: `GroupedBars`: thin bars in labelled groups across the width, a group a day and a bar an hour, or a group a week and a bar a day. A hairline marks where each group starts with its name and a figure above; a band under each group takes its colour when it is highlighted, so one group stands out; the sample labels sit under the bands, as many as fit; hover reads a bar.
- 2eb549c: `Heatmap`: a grid of pixel cells toned by value, columns of `rows` cells filled top to bottom then the next column, zero the empty tone and the rest four steps up to the ink, with column labels beneath and row labels at the left, and on hover the cell outlined with its `format` text in a tooltip beside it. `calendarCells(from, to, valueOf)` lays days out as weeks across and weekdays down, Monday first, with month labels. For days a dataset woke, searches by hour and weekday, any count per cell of a regular grid.
- 9f9190f: `RadarChart`: a shape across a few dimensions, an axis a dimension with its name at the end and faint rings for the scale, a series as a polygon through its values with the Chart's square markers and a solid or patterned fill, several series with a legend, a max and a format per axis for dimensions in their own units, and hover on the nearest axis listing every series' value. For comparing profiles: a dataset this month against last.
- e542d87: `RadialChart`: bars around a clock face from the top clockwise, around a hollow centre that can hold a Stat. One series, a bar a sample with its length the value, a thin guide a sample to the rim and a dashed line at the start; several `series` sharing each sample's slot, each in its colour, with a legend; or `groups`, the rose, a wedge per group with its radius the value over a dim wedge, the name and value upright in it. `inverse` hangs the bars from the rim, growing inward over the ticks, a dial with its reading in the centre. Hover reads a bar by its angle, with `format` for the tooltip. The hours of a day, searches and asks by hour, a handful of kinds compared.
- 9e71991: `ScrubSlider`: a slider with no end. A ruler of ticks scrolls under a fixed handle, one step per tick as far as the drag goes, with a number field at the right that shows the value and takes one typed. `min` and `max` are optional bounds; arrow keys step, Shift steps ten.
- 0e126c1: `SegmentedControl`: one choice from a few, side by side with the chosen cell filled like a primary Button and the rest on the faint surface tone and touching, the button Tabs look with no gap and without the navigation, for the period of a chart, the interval of a graph, the type of a view. A cell is a word, an icon, or both; `size` micro (24px) or default (30px); `stretch` shares the width; a cell may carry a badge as a Tab does; arrow keys move between cells.
- 3dcb304: `Stat` `figure`: a graphic under the label, the value and foot beside it, for a BarMeter ring that carries the number. `value` is optional when a figure does.
- 13eb480: `Stat`: a `labelIcon`, a pixl icon before the label in the label's tone, for a row of tiles read at a glance.
- ce4a08f: `ToggleSwitch` takes `marks`: a 0 on the track when off and a | when on, the marks of a power switch, drawn in whole pixels.
- 373382a: `TreeCanvas`: a hierarchy as a horizontal tree of pills, a node its name and a count, children fanned out to the right on soft connectors, the chosen node and the path to it lit, the rest collapsed until opened. For a catalogue's categories. Arrow keys move between nodes, right opens and left closes; a node with many children shows the first fifty and a step to the rest; a list view gives the same tree as nested rows for a phone.
- c659761: `Waffle`: shares of a whole as a grid of pixel squares, each segment its share of the cells filled column by column from the left, the first in the ink and the rest down the tone ladder, with a legend beneath. `columns`, `rows` and `cell` set the shape (20 by 5 at 4px by default, so a cell is a percent); the ladder has four steps, so a fifth segment, or one that means something, takes a `color`. Where a pie would be, this is the pixel version.

### Patch Changes

- b6456d0: `Stat`: three rows, the label at the top, the value in the middle and the foot at the bottom. The middle takes the height the other two leave and centres what it holds, so in a `StatGroup` the labels line up at the top, the feet at the bottom, and a ring, a number and a chip sit on one middle line. A foot without a figure now spans the tile's width.

## 2.21.1

### Patch Changes

- Alert, Modal, Select and Breadcrumbs draw their icons at 14px. Pixel icons are a 7×5 grid and are only sharp at a multiple of seven, so at 12 or 16px they looked uneven on a standard (1x) screen.

## 2.21.0

### Minor Changes

- bac9b80: SearchField has a built-in Clear button. It shows while the field holds text and puts the focus back in the field. Turn it off with `clearable={false}`. SearchInput keeps its own Clear, which also resets the filters.
- Three new spinners for search: `searching`, a glint moving around the lens of a magnifying glass; `search-as-you-type`, a text cursor stepping forward and leaving typed characters behind it; and `blinking-cursor`, a text cursor blinking in place. The `terminal` spinner has a third frame. `<Spinner name="searching" />`.
- f1bb38b: New `typing` spinner, drawn from the pixl `typing` icon: keystrokes land above and below a row of keys in short bursts, with a pause between words. `<Spinner name="typing" />`.

### Patch Changes

- ffda712: The `analytics` spinner is 7×5 like every other spinner. It drew at 8×5, so it came out wider than the rest and showed an extra bar at the right edge on every other frame.
- Every Button variant now has the same 1px border, transparent where none shows. A button that changed variant used to move by a pixel, so a ghost tab jumped when it became the selected one.

## 2.20.0

### Minor Changes

- f9400f4: New `CodeCopy`: a one-line command with a copy button, like the install line on a package page. Give it `code` and it shows the text in a monospace field as tall as a default Button, so it sits in a row of buttons. After a copy the icon turns into a check for two seconds and screen readers hear "Copied". It also copies on a plain http page, where the browser's clipboard API is not available. A long command scrolls sideways instead of wrapping.

  New `--font-mono` token for code, commands and keys: Geist Mono, falling back to the system's monospace font. The app loads the Geist Mono face itself, for example with `@fontsource/geist-mono`.

### Patch Changes

- 1533dad: SearchInput shows what the search is doing. A blue chip counts the active filters. A Nearest chip appears when nothing matched your words directly and the list holds the nearest results instead; its tooltip says so. A No results chip appears when a search returns nothing. There is one Clear button, and it now resets the query and the filters together, so it also shows on an empty search with filters set. `showStatus={false}` hides the chips.

  SearchField leaves room for what sits on its right, such as a Clear button or chips, so typed text no longer runs underneath them.

  The search icon lights up only while the input has focus. Clicking Clear used to light it for a moment.

## 2.19.0

### Minor Changes

- ToggleSwitch: a new `variant="positive"` for settings where on versus off should be seen at a glance. When on, the track turns green in light mode and teal in dark mode. The colour is the new `--CPositive` token, so a theme can change it in one place. The default ToggleSwitch is unchanged.

## 2.18.0

### Minor Changes

- Select: a new `variant="ghost"` for a view setting in a toolbar rather than a form field. No border or background, styled like a ghost Button, and as wide as its widest option, so the chosen value never clips and the field keeps its width as the choice changes. The default stays the bordered field.

## 2.17.0

### Minor Changes

- 34c676b: Tabs: `badgeTone: 'info'` on an item shows its badge in the info blue that Chart markers use, for a count that is information rather than a call to act. The default stays the signal colour.

## 2.16.0

### Minor Changes

- `Chart` reads well on any screen and can mark events. Axis labels thin out to as many as fit, always keeping the newest point's label, and point markers step back when points crowd together, so a 90-day chart on a phone is readable. A tap now opens the tooltip on touch screens, and a sideways drag moves along the line. New `markers` prop: a small square under a point for something that happened there, a release or a config change, with the text in that point's tooltip. `Sparkline` gains `lastIsPartial`, which dashes the last segment so a day or hour that is still running does not read as a drop.
- c2443e5: New `Sparkline`: a tiny display-only graph for putting a trend next to a number, such as searches over the last hours or documents added per day. Line or bar, no axis, legend, tooltip or interaction. It takes its colour from whatever it sits in and fills the width it is given, so it drops into a card or a table cell without configuration. Bars are laid out with CSS, so `gap` is real pixels at any width and any number of bars; it defaults to 1. `Chart` is unchanged and remains the one to use when you want any of the chrome.

## 2.15.0

### Minor Changes

- Slider: a new `stepMarks` prop draws a small vertical bar (2 by 8 px) at every step, ends included, so a stepped slider shows where it will snap. `"below"` puts the bars in a row 10 px under the track and reserves the room for it; `"inline"` draws them across the track and takes no extra height. Without the prop nothing changes. A slider with more than 50 steps draws none, since that many bars would run together into a solid band.

### Patch Changes

- 401b272: SaveBar: only as wide as its buttons, hugging the start edge, with a gap on the left, right and bottom, so the content it sticks over stays visible along the edges instead of being cut off by a full-width band. The background is very slightly see-through with a light blur behind it, which keeps the bar readable over a busy table while showing that something continues underneath. A browser without `backdrop-filter` gets the plain page tone, as before. The aside now sits after the message rather than at the far edge, since there is no width to spread across. `--savebar-gap` sets the gap; `--savebar-bg` still overrides the background outright.

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
