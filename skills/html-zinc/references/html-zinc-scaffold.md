# HTML Zinc Patterns

Worked examples of the patterns SKILL.md names. Read only the one you need.

## Key figures

Up to four headline numbers, each a `<div>` holding a `<dt>` label and a `<dd>` value. Use them when the answer is a set of numbers: an audit, a health check, a benchmark. Follow them with a `<small>` line that says what was counted. A page whose answer is a list of things to do has no key figures.

```html
<dl>
  <div><dt>Tests passing</dt><dd>412</dd></div>
  <div><dt>Flaky tests</dt><dd>9</dd></div>
  <div><dt>Median run</dt><dd>3m 40s</dd></div>
</dl>
```

The lede gives the verdict in words ("The suite is healthy, apart from nine flaky tests in checkout"), and the figures put numbers to it.

## Fact sheet

The attributes of one thing, or one total broken into a few parts, as up to about eight label and value pairs: scope, versions, settings, counts by category. A `<dl>` of plain `<dt>`/`<dd>` pairs keeps each value next to its label. Do not use a two-column table for this. Rows that are each a separate thing (messages, files, findings, a long ranking) are a table or an entry list, not a fact sheet.

```html
<dl>
  <dt>Branch</dt><dd>main at 4f2c1a9</dd>
  <dt>Runner</dt><dd>Node 22 on macOS</dd>
</dl>
```

## Entry list

A few things of the same kind that each need a sentence: messages that need a reply, findings, tasks, sources. One `<li>` per entry in a `<ul role="list">`. Start each with the name in `<strong>` (and a link where there is one, with its title as the source gives it), then a `<p>` that says why it matters. An entry with no name, such as a finding, starts with its claim in `<strong>`, kept to one short sentence. Sort by what needs doing first, and go straight into the list: it needs no sentence of introduction when the lede has given the count. Past a dozen entries, or when an entry needs no sentence of its own, use a table.

```html
<ul role="list">
  <li>
    <strong>Dana Ortiz</strong> · <a href="…">Re: contract renewal, signed copy</a>
    <p>She needs the signed copy by Friday.</p>
  </li>
</ul>
```

## Folded detail

Anything over about eight short rows (fewer when the rows are long), and anything the reader may want but does not need in order to act: the full list, a sample, raw output, source excerpts. State the takeaway in the sentence above, and put the count in the `<summary>`.

```html
<p>38 queries took longer than a second. Nine of them are the same join on <code>orders</code>.</p>
<details>
  <summary>38 slow queries</summary>
  <table>…</table>
</details>
```

## Comparison

Use a `<table>` for rows of the same kind in two or more columns, and whenever the reader compares across columns. Keep header labels to a word or two and cell text short. Name the pick in the lede or in the sentence above the table, not in a callout after it. Up to about eight rows can stay open.

## Steps and timelines

Use an `<ol>` for next steps, plans, histories and roadmaps. Open each item with a bold instruction or milestone, then one sentence. A command the reader will run goes in `<pre><code>` inside the item.

## Before and after

Use one table with a "Before" and an "After" column, or two `<h3>` subsections in one section. Do not build a pair of cards.

## Process flow

Use Mermaid for real graphs, sequences, and branching flows. Add the module to the `<head>`:

```html
<script type="module">
  import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
  mermaid.initialize({ startOnLoad: true, theme: "neutral", securityLevel: "loose" });
</script>
```

Then the diagram:

```html
<section>
  <h2>Flow</h2>
  <pre class="mermaid">
    flowchart LR
      A[Input] --> B[Decision]
      B --> C[Output]
  </pre>
</section>
```

Use an ordered list or a table when Mermaid's layout would obscure the story.

## Controls on a custom page

A report is static. If the user asks for a page they act on (triage, filters, bulk decisions) and the Questions mode does not fit, use these, which zinc styles:

- A row of filters or actions is a `<menu>` with one `<li>` per control. A `<label>` that wraps a field puts the two on one line.
- One choice from a few on one line is `<span role="radiogroup" aria-label="…">` holding `<label><input type="radio" name="…" value="…"><span>Text</span></label>` segments. Give the "no choice yet" option `value=""`.
- A decision per entry goes inside the entry's `<li>` in an entry list.
