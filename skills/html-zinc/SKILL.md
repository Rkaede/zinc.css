---
name: html-zinc
description: Use when a user asks for an HTML report, browser-opened HTML UI, visual answer, recommendation board, comparison page, dashboard, or when another skill needs to present findings as a self-contained static HTML artifact using Zinc classless CSS and semantic HTML instead of utility classes. Also use when you need to ask the user several questions (decisions, preferences, missing requirements) and a browser form they answer and paste back would be clearer than chat.
---

# HTML Zinc

A static HTML page styled by zinc, a classless stylesheet. Semantic HTML only: no `class`, `style` attribute, `<style>` block, framework or build step. If the page seems to need CSS, simplify the structure.

To ask the user several questions instead, follow [references/html-zinc-questions.md](references/html-zinc-questions.md).

## Page

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{title}}</title>
  <link rel="icon" href="data:,">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/zinc.css@0.0.0-pre.7/zinc.css">
</head>
<body>
  <header>
    <p>{{what this covers}} · {{date the data is from}}</p>
    <h1>{{title}}</h1>
    <p>{{lede: the answer, one or two sentences}}</p>
  </header>
  <main>
    <section>
      <h2>{{Label}}</h2>
      <p>{{the finding}}</p>
      {{evidence}}
    </section>
  </main>
  <footer><p>{{source and when generated}}</p></footer>
</body>
</html>
```

- **Lede**: the answer in 40 words or fewer. Someone who stops there has the conclusion.
- **Sections**: two to seven, in the order the reader needs them: key figures, what to do, evidence, then "Method" if a footer line is not enough. Each opens with an `<h2>` of one to three words in sentence case, with no count or punctuation, then a sentence stating its finding. Use `<h3>` for closely related sub-findings.
- Put tables, lists and prose straight in the section, with no wrappers.

## Pick the element

| Content | Markup |
| --- | --- |
| Up to four headline numbers, when the answer is numbers | `<dl>` of `<div><dt>Label</dt><dd>153</dd></div>` |
| Up to eight label/value pairs about one thing | `<dl>` of `<dt>`/`<dd>`, never a two-column table |
| A few things that each need a sentence | `<ul role="list">`; each `<li>` opens with its subject in `<strong>` |
| Short points | `<ul>` |
| Rows compared across two or more columns | `<table>` with short headers |
| A few options side by side (plans, vendors) | `<table>`, one column per option; zinc has no grid or cards |
| Steps | `<ol>`, each item opening with a bold instruction |
| Long or optional detail | `<details>` with a counted `<summary>` ("38 slow queries") |
| One caveat the reader must not miss | `<aside>` opening with a bold lead-in; at most one |
| One thing that deserves a spotlight | `<article>`; at most one, often none, never nested |
| Graph, sequence or branching flow | Mermaid `<pre class="mermaid">` plus its CDN module script |

## Rules

- Say it once: no "Summary" section, and no section restating the lede.
- Fold any table or list over about eight rows, and anything optional, into `<details>`; the sentence above carries the takeaway.
- A list item with more than one line goes in `role="list"`. Who, when, status and IDs go in one `<small>` line joined with ` · `. `<small>` is one short line, never a paragraph.
- Three or more parallel items are a list, not a sentence.
- Leave out empty sections. Sort by what needs doing first, else largest first.
- Statuses as words (Yes, No, Partial), not icons. Paths, commands and identifiers in `<code>`; a command to run in `<pre><code>`.
- Exact numbers with units. No instructions on how to use the page.

## Forms and controls

- A `<fieldset>` and `<legend>` per group of fields. A `<label for>` before each field; a label wraps its checkbox or radio.
- An on/off setting is `<input type="checkbox" role="switch">`.
- The main button is a plain `<button>`; others take `data-variant="secondary"`, `"outline"`, `"ghost"` or `"danger"`.
- A row of actions or filters is a `<menu>` with one `<li>` per control.

For worked examples of these patterns, and for more controls on an interactive page, read [references/html-zinc-scaffold.md](references/html-zinc-scaffold.md). Only when you need them.

## Write and check

If the user named a file, write it there. Otherwise:

```bash
python3 <skill-dir>/scripts/write-html-report.py --slug <topic> < page.html
```

It writes `<temp>/html-zinc/<slug>-<time>.html`, opens it and prints the path. `--zinc-css <path>` inlines a local zinc build in place of the CDN link.

Then check it, unless the user or the task says not to:

1. Serve the folder over http in the background, for example `python3 -m http.server 8000 --bind 127.0.0.1 --directory <folder>`. Browser automation tools often block `file://`.
2. Screenshot the page at 1280×900 and 390×844 with whatever browser tool you have.
3. Fix overflow, unreadable tables, missing styling, console errors, and entries that run together. Rewrite and recheck.

Report the file path and the URL, and leave the server running.
