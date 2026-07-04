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
