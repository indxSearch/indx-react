# Changelog

All notable changes to @indxsearch/systm will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
