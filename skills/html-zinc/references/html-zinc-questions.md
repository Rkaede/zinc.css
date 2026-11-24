# HTML Zinc Questions

Use this when you need the user's answers before continuing: decisions, preferences, missing requirements. The page is a form. The user answers it in the browser, presses **Copy answers**, and pastes a plain-text summary back into the chat.

## Workflow

1. Draft the questions. Ask only what blocks the work: usually 3–8 questions. Each question must be answerable without scrolling back to the chat. Put the context it needs in the legend or the hint.
2. Write the page from the template below. Always end with the "Anything else I should know?" textarea.
3. Write and open it with the `--questions` flag, which inlines the copy/draft script:

   ```bash
   python3 <skill-dir>/scripts/write-html-report.py --questions --slug <topic>-questions < questions.html
   ```

   Keep the template's pinned `zinc.css@0.0.0-pre.7` link. Earlier releases have no choice-card, numbered-question or sticky-footer styles, so the options would render as plain inline radios and checkboxes.

4. Serve it over http and check it at desktop and mobile widths, as in "Write and check" in SKILL.md. The options should be bordered cards, each legend should have a numbered badge, and the buttons should stick to the bottom of the window. Report the URL.
5. Tell the user the page is open and **stop**: wait for their pasted answers. Do not guess the answers or carry on with the task in the meantime.
6. The pasted text lists each question with `→` answers, headed by `form: <id>`. Match it by the question text, not only the number.

## Template

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Questions: {{topic}}</title>
    <link rel="icon" href="data:," />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/zinc.css@0.0.0-pre.7/zinc.css" />
    <style>:root { --width: 46rem; }</style>
  </head>
  <body>
    <main>
      <header>
        <h1>{{A few questions before I …}}</h1>
        <p>{{One sentence of context: what you're doing and why you need these answers.}}</p>
      </header>

      <form data-form="questions" data-form-id="{{short-stable-id}}">

        <!-- Single choice: radio cards. Put the recommended option first and say so. -->
        <fieldset>
          <legend>{{Question?}}<abbr title="required">*</abbr></legend>
          <label><input type="radio" name="{{q1}}" value="{{a}}" required>
            <span><strong>{{Option title}}</strong>
            <small>Recommended. {{One line on the trade-off.}}</small></span></label>
          <label><input type="radio" name="{{q1}}" value="{{b}}">
            <span><strong>{{Option title}}</strong>
            <small>{{One line on the trade-off.}}</small></span></label>
          <!-- Optional "Other": the text field lives inside the card's span. -->
          <label><input type="radio" name="{{q1}}" value="other">
            <span><strong>Something else</strong>
            <input type="text" name="{{q1}}-other" aria-label="Describe" placeholder="Describe…"></span></label>
        </fieldset>

        <!-- Multiple choice: checkbox cards, same markup. -->
        <fieldset>
          <legend>{{Question?}}</legend>
          <p>Pick as many as apply.</p>
          <label><input type="checkbox" name="{{q2}}" value="{{a}}">
            <span><strong>{{Option}}</strong><small>{{Optional detail}}</small></span></label>
          <label><input type="checkbox" name="{{q2}}" value="{{b}}">
            <span><strong>{{Option}}</strong></span></label>
        </fieldset>

        <!-- Short text -->
        <fieldset>
          <legend>{{Question?}}</legend>
          <label for="{{q3}}">{{Field label}}</label>
          <input type="text" id="{{q3}}" name="{{q3}}" placeholder="{{e.g. example}}">
        </fieldset>

        <!-- Yes / no: a switch. The answer copies as Yes or No. -->
        <fieldset>
          <legend>{{Yes/no question?}}</legend>
          <label><input type="checkbox" role="switch" name="{{q4}}"> {{Yes, statement of the yes case}}</label>
        </fieldset>

        <!-- Scale: a range with a live readout. Say what the ends mean in the hint. -->
        <fieldset>
          <legend>{{How important is …?}}</legend>
          <p>1 = {{low end}}, 5 = {{high end}}.</p>
          <label for="{{q5}}">{{Label}}: <output for="{{q5}}">3</output> / 5</label>
          <input type="range" id="{{q5}}" name="{{q5}}" min="1" max="5" value="3">
        </fieldset>

        <!-- Always last. -->
        <fieldset>
          <legend>Anything else I should know?</legend>
          <label for="notes">Notes, constraints, or examples</label>
          <textarea id="notes" name="notes" placeholder="Optional"></textarea>
        </fieldset>

        <footer>
          <button type="submit">Copy answers</button>
          <button type="reset">Start over</button>
        </footer>
      </form>
    </main>
  </body>
</html>
```

## Rules

- One `<fieldset>` per question, directly inside the form. The `<legend>` is the question, and the numbering is automatic, so don't number it yourself.
- Choice cards need the exact shape `<label><input> <span><strong>…</strong><small>…</small></span></label>`. Without the `<span>`, the label renders as a plain inline checkbox.
- Radios in a group share one `name`. Put `required` on the first radio (or on a text field) to make the question required, and add `<abbr title="required">*</abbr>` to its legend. Leave most questions optional.
- Give every field a `name`. Drafts are saved by name.
- Give options titles that stand alone in the pasted summary: the copied answer is the `<strong>` text.
- `data-form-id` should be short and stable, e.g. `auth-setup`. It keys the saved draft and heads the pasted answers.
- No `class` attributes, and no scripts of your own. The `--questions` flag supplies the only script.
- Do not add instructions on how to use the page beyond the one-sentence header context. The button says what it does.
