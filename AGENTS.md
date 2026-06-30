# AGENTS.md

This file provides guidance to coding agents (Claude Code, etc.) when working with code in this repository.

> **AGENTS.md is the source of truth.** `CLAUDE.md` is a symlink to this file — edit
> `AGENTS.md` only, never the symlink, and keep all guidance here.

## What this is

`zinc.css` is a **classless** CSS framework: it styles semantic HTML tags directly
(`<button>`, `<article>`, `<aside>`, etc.) so users write plain markup with no class
names and no build step on their end. The entire framework is a single hand-authored
stylesheet. There is no JavaScript runtime, no preprocessor, and no component library —
the deliverable is one CSS file.

## Branches

`main` and `develop` (this branch) carry **only the library** — no docs site, no
showcase, no build-site tooling. The multi-page docs site (`src/website/`,
`build-site.js`, plus the `build:site`/`dev`/`preview:site` pnpm scripts and the
`http-server` devDependency) lives on a separate local-only `website` branch and is not
present here. Check out `website` to work on the site or to visually validate a
stylesheet change against the showcase — its `package.json` has the full script set.

## Layout

- `src/lib/zinc.css` — **the framework. The only source of truth.** Everything is
  authored here by hand.
- `build.js` — minifies `src/lib/zinc.css` → `dist/zinc.css` + `dist/zinc.min.css` via
  Lightning CSS. The build does not transform structure, only minifies.
- `dist/`, `temp/`, `node_modules/` are gitignored. `dist/` is generated; never edit it
  by hand.

## Commands

```bash
pnpm run build   # src/lib/zinc.css → dist/zinc.css + dist/zinc.min.css
```

There are no tests, linter, or typecheck on this branch. Validation is visual and
requires the `website` branch (see above): `pnpm run dev` there serves the repo and
opens the showcase, where changes can be checked in light/dark and across the five
accents.

## How the stylesheet is organized

`src/lib/zinc.css` is divided into banner-commented sections (search for `/* =====`):
Tokens (`:root`) → Base → Typography → Media → Tables → Forms → Buttons →
Components via semantic tags. Keep edits in the matching section.

### Token & theming architecture (read before changing colors/spacing)

All design decisions flow through CSS custom properties on `:root`. Concrete element
rules should reference these tokens, not hard-coded values.

- **Light is the default** in `:root`. Dark mode is applied two ways, both of which must
  be kept in sync when editing dark neutrals: the system path
  `@media (prefers-color-scheme: dark) :root:not([data-mode="light"])` and the manual
  override `:root[data-mode="dark"]`. Editing one without the other is the most common
  bug here.
- **Accents** are swapped by `:root[data-accent="electric|hot|amber|forest|violet"]`, each setting
  `--accent` + `--on-accent`. Derived accent shades (`--accent-press`, `--accent-soft`,
  `--accent-faint`) are computed with `color-mix()` so they follow whatever `--accent` is.
- **User-facing API** (documented in README): theme hooks `data-mode` / `data-accent` on
  `<html>`; variant hooks `data-variant` / `data-size` and `role="button"` / `role="switch"`
  on elements; tunable tokens (`--accent`, `--radius`, `--width`, `--gutter`, fonts).
  Treat these as a public contract — renaming a token or attribute is a breaking change.

## Conventions

- Classless is the core constraint: **never introduce a class selector** for styling.
  Opt-in variants use `data-*` attributes or ARIA roles, never classes.
- Modern CSS is used intentionally (`color-mix()`, `:user-invalid`, `:focus-visible`,
  logical properties, `text-wrap: balance`). Match the existing approach rather than
  adding fallbacks or polyfills.
- When adding or changing a styled element, also add it to the showcase on the
  `website` branch (`src/website/components.html`) so it's visible and documented.
