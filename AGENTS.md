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
`build-site.js`, plus the `build:site`/`preview:site` pnpm scripts) lives on a separate
local-only `website` branch and is not present here. Check out `website` to work on the
site or to see a stylesheet change against the curated showcase — `tests/` here (see
below) covers QA, but `website`'s showcase is the polished, documented reference.

## Layout

- `src/lib/zinc.css` — **the framework. The only source of truth.** Everything is
  authored here by hand.
- `build.js` — minifies `src/lib/zinc.css` → `zinc.css` + `zinc.min.css` **at the repo
  root** (not `dist/`) via Lightning CSS, so the published npm package has them at its
  top level — no extra path segment in CDN URLs (e.g.
  `cdn.jsdelivr.net/npm/zinc.css/zinc.css`). The build does not transform structure,
  only minifies.
- `tests/` — internal QA pages (not docs or copy-paste examples) that exhaustively
  exercise every variant/size/state of one part of the framework per file, for catching
  regressions while editing `src/lib/zinc.css`. `pnpm run dev` serves the repo and opens
  this folder.
- `scripts/contrast.mjs` — `pnpm run contrast`: reads the color tokens from
  `src/lib/zinc.css` and prints a before/after WCAG contrast table for every accent in
  both modes (baseline: the `v0.0.0-pre.5` tag). Exits 1 if a check fails.
- Root-level `zinc.css` / `zinc.min.css`, plus `temp/`, `node_modules/`, are gitignored
  and generated; never edit them by hand.
- `.agents/skills/` (real files), `.claude/skills/` (relative symlinks to them) and
  `skills-lock.json` are Emil Kowalski's design and animation skills, installed from
  emilkowalski/skills with `npx skills add`. They're agent tooling, not part of the
  build or the npm package. Use `review-animations` and `find-animation-opportunities`
  before changing transitions or interactive states.

## Commands

```bash
pnpm run build   # src/lib/zinc.css → zinc.css + zinc.min.css (repo root)
pnpm run dev      # serve the repo, opens tests/ for visual QA
pnpm run contrast   # before/after contrast table, every accent × mode (exits 1 on a failure)
```

There are no tests, linter, or typecheck in the traditional sense — `tests/` is for
manual visual QA, not automated checks. The one automated check is `pnpm run contrast`;
run it after touching any color token. Run `pnpm run dev` and check pages in `tests/`
in light/dark and across the five accents.

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
  bug here. Both dark blocks also set `color-scheme: dark`, and `:root[data-mode="light"]`
  pins `color-scheme: light`, so native controls and `light-dark()` follow `data-mode`
  rather than the system.
- **Accents** are swapped by `:root[data-accent="electric|hot|amber|forest|violet"]`. Each
  sets `--accent` and `--on-accent` as `light-dark(light shade, dark shade)` pairs, so
  accents need no entries in the dark blocks. `light-dark()` resolves from the used
  `color-scheme`, which is why a forced `data-mode` pins it. Derived accent shades
  (`--accent-press`, `--accent-soft`, `--accent-faint`) still come from `color-mix()` so
  they follow whatever `--accent` is; `--accent-press` darkens in light and lightens in
  dark (set in the dark blocks).
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
