# zinc.css

**A classless CSS framework for semantic HTML.**

Documentation lives in [`docs/`](./docs/): run `pnpm run dev` and open `/docs/`, or
serve the repo root with any local server and open `docs/index.html`.

Drop in one stylesheet and every semantic element is styled — no class names,
no build step, no configuration. Write plain markup; `zinc.css` sets it as one
calm column of text, with section labels in the margin and colour kept for what
you focus, check or choose.

```html
<!-- one line. that's the install. -->
<link rel="stylesheet" href="zinc.css" />

<h1>Hello, world</h1>
<p>No classes. <a href="#">Just markup.</a></p>
<button>It styles itself</button>
```

### From a CDN

No download, no `npm install` — just point a `<link>` at jsDelivr or unpkg:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/zinc.css/zinc.css" />
<!-- or the minified build -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/zinc.css/zinc.min.css" />

<!-- unpkg works the same way -->
<link rel="stylesheet" href="https://unpkg.com/zinc.css/zinc.css" />
```

Pin a version once you're past prototyping (e.g. `zinc.css@0.1.0-next.0/zinc.css`) —
an unpinned URL always serves `latest`, which is fine for a demo but can
change under you in production.

---

### Fonts

`zinc.css` uses the reader's own system faces (`ui-sans-serif` and
`ui-monospace`), so the stylesheet is the only request. To use a web font,
load it yourself and set the font tokens:

```css
:root {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}
```

## Theming

Set hooks on the `<html>` element — no classes anywhere.

| Hook          | Values                            | Effect                                                         |
| ------------- | --------------------------------- | -------------------------------------------------------------- |
| `data-mode`   | `light` · `dark`                  | Force a color scheme (omit to follow the system)               |
| `data-accent` | `electric` · `forest` · `violet`  | Pick the accent color (each has a light and a dark shade)      |
| `data-paper`  | `beige`                           | A pale green-beige paper instead of the white page (light mode) |

```html
<html data-mode="dark" data-accent="forest" data-paper="beige"></html>
```

`data-paper` also works on `<body>`. The accent marks state only — focus,
checked controls, chosen options, progress bars. Links and buttons are ink.
Every built-in accent meets WCAG AA in both modes, as text and as a fill.

### Tune the tokens

Override any of these on `:root` to rebrand without touching the framework:

```css
:root {
  --accent: light-dark(#0f766e, #2dd4bf); /* brand color: light shade, dark shade */
  --on-accent: light-dark(#ffffff, #0c0c0d); /* text on accent fills */
  --danger: light-dark(#b93a2c, #f2877a); /* destructive actions, errors */
  --radius: 8px; /* corner radius of controls */
  --width: 42rem; /* the text column */
  --measure: 38rem; /* where running text wraps, about 75 characters */
  --gutter: clamp(1.25rem, 5vw, 2.5rem); /* page padding */
  --rail: 11rem; /* the margin that holds section labels on a wide screen */
  --font-sans: ui-sans-serif, system-ui, sans-serif;
  --font-mono: ui-monospace, monospace;
  --font-display: var(--font-sans);
}
```

One color works in both modes; `light-dark()` gives each mode its own shade. Keep
accent text at 4.5:1 on the page background and `--on-accent` at 4.5:1 on the
accent.

The full token set (type sizes, layout, neutrals, control borders, code panel) is
documented at the top of [`zinc.css`](./src/lib/zinc.css).

## Page structure

Build a page from `<section>` elements, each starting with an `<h2>`. From 56rem
wide, each `<h2>` moves into a left margin as a short label that stays in view
while its section scrolls past, so keep them to one to three words and put the
sentence under it. Below 56rem it is an ordinary heading.

- In the page `<header>`, a `<p>` before the `<h1>` is a small line of context,
  and the first `<p>` after it is the lede, set a size larger.
- A `<dl>` of `<div>` groups is a row of key figures: a large number with a
  small label under it. A plain `<dl>` of `<dt>`/`<dd>` pairs is a ruled fact sheet.
- `<ul role="list">` or `<ol role="list">` is a list of entries: no markers, a
  hairline between entries.
- `<menu>` of `<li>` is a toolbar; a `<label>` that wraps a field sits on one
  line with it.

## Optional variant hooks

A few **attributes** opt into
variants:

```html
<!-- button variants -->
<button>Primary</button>
<button data-variant="secondary">Secondary</button>
<button data-variant="outline">Outline</button>
<button data-variant="ghost">Ghost</button>
<button data-variant="danger">Danger</button>

<!-- button sizes -->
<button data-size="sm">Small</button>
<button data-size="lg">Large</button>

<!-- segmented group -->
<div role="group">
  <button data-variant="secondary">Day</button>
  <button data-variant="secondary">Week</button>
  <button data-variant="secondary">Month</button>
</div>

<!-- a link that looks like a button -->
<a role="button" href="#">Get started</a>
<a role="button" data-variant="outline" href="#">Learn more</a>

<!-- a toggle switch -->
<input type="checkbox" role="switch" />

<!-- a segmented control: the chosen segment takes the accent -->
<div role="radiogroup" aria-label="Decision">
  <label><input type="radio" name="call" value="keep" /><span>Keep</span></label>
  <label><input type="radio" name="call" value="drop" /><span>Drop</span></label>
</div>
```

## Cards & callouts

Two semantic elements carry visual emphasis:

```html
<!-- a card: a hairline outline (a lighter sheet on the beige paper) -->
<article>
  <header><h3>Key finding</h3></header>
  <p>Evidence or implication.</p>
  <footer>Source · confidence</footer>
</article>

<!-- a note: a tinted block pressed into the page -->
<aside>
  <p>The one thing to remember.</p>
</aside>
```

Cards are emphasis, not structure. Build pages from `<section>` elements with
headings — tables, lists, and prose sit directly in the section — and save
`<article>` for the panel that deserves the spotlight: a top recommendation, a
key finding, a group of evidence cards. If everything is a card, nothing is.
Don't nest `<article>` elements.

## Choice cards & question forms

Wrap a radio or checkbox and a `<span>` in a `<label>` to get a large, tappable
choice card. The title goes in `<strong>` and an optional description in
`<small>`. A plain `<label><input> text</label>` (no `<span>`) stays a normal
inline control.

```html
<label>
  <input type="radio" name="plan" value="team" />
  <span><strong>Team</strong><small>Shared billing, up to 20 seats</small></span>
</label>
```

Add `data-form="questions"` to a `<form>` to lay it out as a questionnaire.
Each `<fieldset>` is one question, and its `<legend>` is the question text. An
optional `<p>` under the legend is a hint.

- Questions are numbered automatically.
- Each question is separated by a rule.
- The question number turns red when a required question is left empty.
- A trailing `<footer>` becomes a sticky action bar.

```html
<form data-form="questions">
  <fieldset>
    <legend>Which plan fits?<abbr title="required">*</abbr></legend>
    <p>You can change this later.</p>
    <label><input type="radio" name="plan" value="solo" required />
      <span><strong>Solo</strong><small>One seat</small></span></label>
    <label><input type="radio" name="plan" value="team" />
      <span><strong>Team</strong><small>Up to 20 seats</small></span></label>
  </fieldset>
  <footer><button type="submit">Continue</button></footer>
</form>
```
