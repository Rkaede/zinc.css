# AGENTS.md

This file provides guidance to coding agents (Claude Code, etc.) when working with code in this repository.

> **AGENTS.md is the source of truth.** `CLAUDE.md` is a symlink to this file — edit
> `AGENTS.md` only, never the symlink, and keep all guidance here.

## What this is

`zinc.css` is a **classless** CSS framework for AI agents: the pages agents write
(reports, dashboards, forms that ask the user questions) are plain semantic HTML, and
zinc styles them. An agent skill, `html-zinc`, goes with it; the docs home page gives
the prompt that installs it. It styles semantic HTML tags directly
(`<button>`, `<article>`, `<aside>`, etc.) so users write plain markup with no class
names and no build step on their end. The entire framework is a single hand-authored
stylesheet. There is no JavaScript runtime, no preprocessor, and no component library —
the deliverable is one CSS file.

## Branches

The docs site lives in `docs/` on the same branch as the library, so a stylesheet
change and its documentation land together. There is no separate docs branch.

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
- `docs/` — the documentation site: static HTML pages styled by zinc itself, linking
  `../src/lib/zinc.css` so `pnpm run dev` shows live edits. Two pages: the home page
  (`index.html`: why classless, the getting-started prompt for the skill, the examples
  with the patterns each one shows, install by hand, theming, browsers) and
  `elements.html`. `docs/docs.js` generates each demo's code block from the demo
  (`<figure data-demo>`) and wires up copy buttons; `docs/docs.css` holds the little
  docs-only chrome. Like the framework, the site uses no `class` attributes.
  `docs/theme.js` + `docs/theme.css` add the Theme button and popover (top right, on
  every docs and example page) that set and store `data-mode`, `data-accent` and
  `data-paper`. `docs/debug.js` + `docs/debug.css` add a Debug panel (bottom right) for
  trying layout options (contents as a list, headings above content, section spacing,
  rules between sub-sections off); docs-only overrides, never part of zinc. Every page's
  head carries the same inline script that applies both before paint.
- `docs/examples/` — whole realistic pages (reports, a dashboard, a triage board, forms),
  the kinds of page an agent writes. They stand in for pattern docs: the home page
  lists each with the patterns it shows, so keep that list true when an example
  changes. Their content is invented: never paste real conversations, people,
  projects, emails or links into them. The same goes for demo content anywhere in
  `docs/`.
- `build-docs.js` — `pnpm run build:docs`: runs `pnpm run build`, copies `docs/` to
  `dist/docs/`, puts the built `zinc.css` at `dist/docs/zinc.css` and rewrites every
  page's stylesheet link to it, so `dist/docs/` is a self-contained static site.
  Neither `docs/` nor `dist/` is in the npm package (the `files` whitelist).
- `scripts/contrast.mjs` — `pnpm run contrast`: reads the color tokens from
  `src/lib/zinc.css` and prints a before/after WCAG contrast table for every accent in
  both modes (baseline: the `v0.0.0-pre.5` tag). It also checks the control borders
  (`--line-strong`) and the danger pair in each mode. It reads rules inside `@layer`
  blocks and evaluates hex, `rgb()`, `oklch()`, `oklab()` and `color-mix()` in `srgb` or
  `oklab`; any other color syntax is a parse error (exit 2), so teach the script before
  using one. Exits 1 if a check fails.
- Root-level `zinc.css` / `zinc.min.css`, plus `dist/`, `temp/`, `node_modules/`, are gitignored
  and generated; never edit them by hand.
- `.agents/skills/` (real files), `.claude/skills/` (relative symlinks to them) and
  `skills-lock.json` are Emil Kowalski's design and animation skills, installed from
  emilkowalski/skills with `npx skills add`. They're agent tooling, not part of the
  build or the npm package. Use `review-animations` and `find-animation-opportunities`
  before changing transitions or interactive states.

## Commands

```bash
pnpm run build   # src/lib/zinc.css → zinc.css + zinc.min.css (repo root)
pnpm run build:docs   # build, then copy docs/ into dist/docs/ as a self-contained site
pnpm run dev      # serve the repo, opens tests/ for visual QA (docs at /docs/)
pnpm run contrast   # before/after contrast: every accent × mode, plus control borders and danger (exits 1 on a failure)
```

There are no tests, linter, or typecheck in the traditional sense — `tests/` is for
manual visual QA, not automated checks. The one automated check is `pnpm run contrast`;
run it after touching any color token. Run `pnpm run dev` and check pages in `tests/`
and `docs/` in light/dark, on beige, and across the three accents.

## How the stylesheet is organized

`src/lib/zinc.css` is divided into banner-commented sections (search for `/* =====`):
Tokens (`:root`) → Base → Typography → Media → Tables → Forms → Buttons →
Components via semantic tags. Keep edits in the matching section.

The whole file sits inside one cascade layer, `@layer zinc { … }`, opened after the
header comment and closed on the last line (its contents are not indented). That
makes any unlayered author CSS win over zinc whatever its specificity, so a page's own
`<style>` or the docs' `docs.css`, `theme.css` and `debug.css` never need to outweigh
zinc's selectors. Keep every new rule inside the layer. One side effect: zinc's
`!important` declarations (`[hidden]`, reduced motion) now beat unlayered `!important`.

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
- **Accents** are swapped by `:root[data-accent="electric|forest|violet"]`. Each
  sets `--accent` and `--on-accent` as `light-dark(light shade, dark shade)` pairs, so
  accents need no entries in the dark blocks. `light-dark()` resolves from the used
  `color-scheme`, which is why a forced `data-mode` pins it. Derived accent shades
  (`--accent-press`, `--accent-soft`, `--accent-faint`) still come from `color-mix()` so
  they follow whatever `--accent` is; `--accent-press` darkens in light and lightens in
  dark (set in the dark blocks).
- **Mixes run in Oklab**: every `color-mix()` is `in oklab`, so a press shade or a tint
  keeps its color's hue (sRGB drifts a saturated blue toward purple). Use `oklab`, not
  `oklch`, for mixes: a polar mix with a near-neutral like `--surface` interpolates hue
  and tints toward the neutral's own faint green. The base tokens stay hex.
- **Danger** is `--danger` and `--on-danger`, a `light-dark(light, dark)` pair like the
  accents, so it needs no entries in the dark blocks. `--danger-press` is derived with
  `color-mix()` like `--accent-press`: darker in `:root`, lighter in both dark blocks.
  Never hard-code a red.
- **Paper**: the default page is white. `data-paper="beige"` on `<html>` or `<body>`
  swaps the light neutrals for a green-beige paper (`:root:where([data-paper="beige"],
  :has(> body[data-paper="beige"]))`, kept at `:root` weight so the dark blocks still
  win) and gives `<article>` a fill instead of its hairline (a rule at the end of the
  file). `--line-card` is the outline of choice cards and the article: firmer than
  `--line` on white, equal to it on beige. `pnpm run contrast` only measures the white
  page; check beige by hand after changing its neutrals.
- **Accent is state**: the accent marks only focus, checked controls, chosen options
  and progress. Links and buttons are ink (`--ink`, `--on-ink`, `--ink-press`).
- **`--line-strong`** is the neutral for control boundaries (form fields, checkbox,
  radio, switch and range tracks, color input, select chevron), at 3:1 or better on
  `--bg` and `--surface`. Like the other neutrals it is defined in `:root` and in both
  dark blocks. `--line` stays for decorative rules.
- **User-facing API** (documented in README): theme hooks `data-mode` / `data-accent` /
  `data-paper` on `<html>`; variant hooks `data-variant` / `data-size`, `data-form`, and
  `role="button"` / `role="switch"` / `role="list"` / `role="radiogroup"` on elements;
  tunable tokens (`--accent`, `--radius`, `--width`, `--measure`, `--gutter`, `--rail`,
  fonts).
  Treat these as a public contract — renaming a token or attribute is a breaking change.

## Conventions

- Classless is the core constraint: **never introduce a class selector** for styling.
  Opt-in variants use `data-*` attributes or ARIA roles, never classes.
- Modern CSS is used intentionally (`@layer`, `color-mix()` in Oklab, `:user-invalid`,
  `:focus-visible`, logical properties, `text-wrap: balance`). Match the existing approach rather than
  adding fallbacks or polyfills.
- When adding or changing a styled element, also document it: the elements page for
  an element, an example (and its line on the home page) for a page-level pattern, and
  the README for a token. Every claim and default there must match `src/lib/zinc.css`.
