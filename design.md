# Design rules

Conventions that aren't obvious from reading `src/lib/zinc.css` alone —
decisions worth preserving so future edits stay consistent. See `AGENTS.md`
for repo layout/build instructions; this file is about *design* rules.

## Cursors

- **Enabled, interactive elements get `cursor: pointer`** (the hand). Applies
  to buttons, link-buttons (`a[role="button"]`), checkboxes, radios,
  switches, range, color, and file-picker controls.
- **Disabled elements get `cursor: default`** — never `pointer` (implies it's
  still clickable) and never `not-allowed` (implies a blocked action rather
  than an unavailable one). `default` is the deliberate house style.
- Because `cursor: pointer` is frequently set via an attribute selector
  (e.g. `input[type="submit"]`, `[data-variant]`) whose specificity can beat
  a plain `:disabled`/`[disabled]` rule, don't rely on `:disabled` alone to
  win the cascade. `zinc.css` has one consolidated override (search
  "disabled state" in the Buttons section) that mirrors every
  cursor-setting selector at matching-or-higher specificity so it always
  applies last/highest. When adding a new interactive element with its own
  `cursor: pointer` rule, add its disabled selector to that block too —
  don't assume the global `:disabled` rule will catch it.

## Hover/active state must not leak into disabled

- Disabled native form controls (`button`, `input`, `select`, `textarea`)
  **still match `:hover` and `:active`** in real browsers — disabling a
  control does not suppress those pseudo-classes. Any `:hover`/`:active`
  rule that changes background/color/transform must explicitly exclude
  disabled state (`:not(:disabled)`), or the disabled element will visibly
  react to a mouse the user can't use it with.
- `<a>` has no native `disabled` attribute/state. Link-buttons use
  `aria-disabled="true"` instead, guarded the same way
  (`:not([aria-disabled="true"])` on hover/active rules) and additionally
  get `pointer-events: none` so they can't be hovered/clicked/focused by
  mouse at all. Always pair `role="button"` + `aria-disabled="true"` when
  disabling a link, e.g.:
  ```html
  <a role="button" href="#" aria-disabled="true">Disabled link</a>
  ```

## Fieldset

- `fieldset[disabled]` natively disables all descendant controls; `zinc.css`
  doesn't need to do anything extra for the controls themselves (the
  standard `:disabled` styling applies).
- The **first `<legend>` child of a disabled fieldset stays enabled** per
  the HTML spec (any controls inside that first legend remain interactive)
  and is *not* dimmed — this is deliberate native behavior, don't fight it
  with CSS opacity overrides on the legend.

## Testing disabled state

- `tests/disabled-states.html` exercises every element type that supports a
  disabled state (all text-like inputs, textarea, select/option/optgroup,
  checkbox, radio, switch, range, color, file, buttons, link-buttons,
  fieldset) enabled vs. disabled side by side. Extend this file — don't
  create a parallel one — when adding a new disableable element or variant.
  `tests/buttons.html` remains the source of truth for the full
  button variant/size/element-type matrix.

## Variants

- **An explicit `data-variant` always wins.** Element defaults that set button
  colors (`input[type="submit"]`, `input[type="button"]`, `input[type="reset"]`,
  `a[role="button"]`, and `button[type="reset"]` / `input[type="reset"]` as
  secondary) carry `:where(:not([data-variant]))`. Without it the element
  selector (0,1,1) outranks `[data-variant="…"]` (0,1,0) and the variant is
  silently ignored. `:where()` adds no specificity, so markup without a
  variant resolves exactly as before. Mirror it when adding a new element
  default, in the base rule and in its hover rule alike.

## Accessibility floor

- **Contrast targets: 4.5:1 for text, 3:1 for the focus ring** (WCAG AA).
  Every accent has a light and a dark shade, and each must clear the targets
  on its own mode's `--bg` and `--surface`, on the `aside` callout tint, and
  under button text (`--on-accent` on `--accent` and on `--accent-press`).
  `pnpm run contrast` measures all of it for every accent in both modes,
  compares against a baseline release (`--before`, default `v0.0.0-pre.5`),
  and exits 1 on a failure. Run it after touching any color token.
- **Control boundaries clear 3:1** (WCAG 1.4.11). Fields, checkbox, radio,
  switch and range tracks, the color input and the select chevron use
  `--line-strong`, 3:1 or better on `--bg` and `--surface` in both modes
  (`pnpm run contrast` checks it). Decorative rules (hr, tables, cards,
  fieldset, details, code, kbd, footer, choice cards, progress, meter) keep
  the softer `--line`.
- **Danger is a token pair, never a hex.** `--danger` and `--on-danger` are a
  `light-dark()` pair like the accents, and clear 4.5:1 as text on `--bg` and
  `--surface` and under the button label. `--danger-press` darkens in light
  and lightens in dark, so it is set in both dark blocks like `--accent-press`.
- **Type floor: nothing under 14px (`0.875rem`).** Secondary reading text
  (`small`, `figcaption`, `caption`, labels, `footer`) sits at 15px
  (`0.9375rem`). Mono text sized in `em` (`code`, `kbd`, `samp`) uses
  `max(…em, 0.875rem)` so it can't shrink under the floor inside small text.
  `sub`/`sup` are the one exception (0.72em, set by typographic convention).
- **Links never rely on color alone.** A link keeps a resting underline at
  60% of its color, and hover completes it. Nav links stay accent-colored, so
  they never pass for headings, and drop the resting underline (hover adds
  it; the current page is text-colored with an accent underline). Footer
  links share the footer's muted color, so the underline is their only cue
  and stays full strength. Both nav and footer link rules skip
  `a[role="button"]`: a link-button keeps its button colors (an accent hover
  color on an accent fill would make the label vanish).
- **Hover only on things you can click.** Table rows don't tint on hover: a
  hover state promises an action, so it belongs on links, buttons and
  controls.
- **Focus is a 2px solid accent ring at 2px offset.** Text fields swap the
  outline for an accent border plus a 1px ring and a soft halo; every other
  control keeps the plain ring. Choice cards move the ring onto the card
  instead of the input inside it. Never set `border-radius` in the global
  `:focus-visible` rule: it overrides each element's own radius (a button
  would jump from 6px to 3px corners).

## Motion

- **Durations and easing.** Color and hover fades run 120–150ms with `ease`.
  Movement (the switch thumb, the summary marker) runs 200ms with
  `--ease-out`; the switch track's color change rides along at 200ms. A
  button press is `translateY(1px)` over 60ms. Animate
  transform and opacity, never layout properties (`left`, `top`, `width`,
  `height`). The one exception is the details content's `block-size` (see
  below): CSS has no transform-based way to reveal native disclosure content.
- **Dialog enter and exit.** Opening fades the dialog in and scales it up from
  `scale(0.96)` over 180ms with `--ease-out`, starting from `@starting-style`.
  The backdrop fades along with it. Closing is faster, 120ms. It runs only inside
  `@supports (overlay: auto)` (Chromium), where `display` and `overlay`
  transition with `allow-discrete`, so the dialog stays in the top layer until
  it has faded. Other browsers close at once, as they did before. A dialog
  scales from its center, because modals are exempt from trigger origins. The
  closed state skips `:popover-open`, because a `dialog[popover]` that is
  showing has no `[open]` and would otherwise turn invisible. A popover dialog
  appears at once and fades out. A `<dialog open>` in the markup fades in on
  page load.
- **Details open and close.** `::details-content` grows from `block-size: 0`
  to `auto` and fades in over 200ms with `--ease-out`, then reverses on close.
  `content-visibility` transitions with `allow-discrete`, so the content stays
  painted until it has collapsed. `interpolate-size: allow-keywords` sits on
  `details` (it inherits). The whole block is gated on
  `@supports (interpolate-size: allow-keywords) and selector(::details-content)`.
  A browser that has `::details-content` without `interpolate-size` (Safari,
  for now) would otherwise fade the content while its height snaps. Behind the
  gate, it snaps exactly as before. The content keeps `overflow-y: clip` while
  open, so it can't paint outside the growing box. Horizontal overflow is
  left visible.
- **Hover is for fine pointers.** Every `:hover` rule sits inside
  `@media (hover: hover) and (pointer: fine)`, because touch browsers keep
  `:hover` stuck after a tap. `:active` stays ungated.
- **Keyboard focus never animates.** Focus styles land at once (text fields set
  `transition-duration: 0s` while focused); blur may fade out.
- **No smooth scrolling.** `scroll-behavior: smooth` animated Tab-focus
  scrolling for up to a second, so jumps are instant.
- **Reduced motion.** The kill switch also covers `*::before`, `*::after`,
  `::backdrop` and `::file-selector-button`, and sets the iteration count to 1.
  zinc deliberately kills color fades too. Anything new that animates must be
  covered by it. A newer pseudo-element gets its own rule (as
  `::details-content` does), never a place in an existing selector list: a
  browser that doesn't know it drops the whole list. Lightning CSS keeps those
  rules apart in `zinc.min.css`. Enter/exit motion (dialog, details) also sits
  inside `@media (prefers-reduced-motion: no-preference)`, so reduced motion
  never declares it at all.
- **Hover never outranks state.** A hover rule must not beat checked or
  selected styles. For example, the choice-card hover condition is wrapped in
  `:where()`, so a checked card keeps its accent border while hovered.
