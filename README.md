# 🏖️ zinc.css

**A classless CSS framework for semantic HTML.**

Drop in one stylesheet and every semantic element looks sharp — no class names,
no build step, no configuration. Write plain markup; `zinc.css` brings the
sunshine.

```html
<!-- one line. that's the install. -->
<link rel="stylesheet" href="zinc.css" />

<h1>Hello, world</h1>
<p>No classes. <a href="#">Just markup.</a></p>
<button>It styles itself</button>
```

---

### Fonts (optional but recommended)

`zinc.css` defaults to **Space Grotesk** for display and body text, and
**Space Mono** for code — with safe system fallbacks if you skip this step.

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
/>
```

## Theming

Set hooks on the `<html>` element — no classes anywhere.

| Hook          | Values                                             | Effect                                           |
| ------------- | -------------------------------------------------- | ------------------------------------------------ |
| `data-mode`   | `light` · `dark`                                   | Force a color scheme (omit to follow the system) |
| `data-accent` | `electric` · `hot` · `amber` · `forest` · `violet` | Pick the accent color                            |

```html
<html data-mode="dark" data-accent="electric"></html>
```

### Tune the tokens

Override any of these on `:root` to rebrand without touching the framework:

```css
:root {
  --accent: #0d9488; /* your brand color */
  --radius: 9px; /* global corner radius */
  --width: 72rem; /* max content width */
  --gutter: 2.5rem; /* page padding */
  --font-sans: "Space Grotesk", system-ui, sans-serif;
  --font-mono: "Space Mono", monospace;
  --font-display: var(--font-sans);
}
```

The full token set (neutrals, surfaces, shadows, code panel) is documented at
the top of [`zinc.css`](./src/lib/zinc.css).

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

<!-- a toggle switch -->
<input type="checkbox" role="switch" />
```
