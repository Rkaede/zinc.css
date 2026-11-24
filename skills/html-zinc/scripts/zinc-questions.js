// zinc-questions.js: behaviour for <form data-form="questions"> pages.
// Inlined into the page by `write-html-report.py --questions`; do not hand-copy.
//
// - Submit ("Copy answers") validates required questions, then copies a
//   plain-text Q/A summary to the clipboard for pasting back into the chat.
// - Answers are kept as a draft in localStorage, so a reload loses nothing.
// - Typing in an "Other" field selects its choice; <output for="x"> mirrors x.
// - A <details> preview of the copied text is appended after the form.
(() => {
  const form = document.querySelector('form[data-form="questions"]');
  if (!form) return;
  const formId = form.dataset.formId || location.pathname.split("/").pop();
  const title = (document.querySelector("h1")?.textContent || document.title).replace(/\s+/g, " ").trim();
  const storeKey = "zinc-questions:" + formId;
  const CHOICE = 'input[type="radio"], input[type="checkbox"]:not([role="switch"])';

  // Visible text of a node, minus nested fields, descriptions and the * marker.
  const text = (el) => {
    const clone = el.cloneNode(true);
    clone.querySelectorAll("input, textarea, select, abbr, small").forEach((n) => n.remove());
    return clone.textContent.replace(/\s+/g, " ").trim();
  };

  function answersFor(fs) {
    const out = [];
    fs.querySelectorAll(CHOICE).forEach((input) => {
      if (!input.checked) return;
      const label = input.closest("label");
      const strong = label?.querySelector("strong");
      let answer = strong ? text(strong) : label ? text(label) : input.value;
      const other = label?.querySelector('span input:not([type="radio"]):not([type="checkbox"]), span textarea');
      if (other && other.value.trim()) answer += ": " + other.value.trim();
      out.push(answer);
    });
    fs.querySelectorAll('input[role="switch"]').forEach((sw) => out.push(sw.checked ? "Yes" : "No"));
    fs.querySelectorAll('input[type="range"]').forEach((r) => out.push(`${r.value} / ${r.max || 100}`));
    fs.querySelectorAll("select").forEach((s) => {
      const picked = [...s.selectedOptions].filter((o) => o.value).map((o) => o.textContent.trim());
      out.push(...picked);
    });
    fs.querySelectorAll('textarea, input:not([type]), input[type="text"], input[type="email"], input[type="url"], input[type="number"], input[type="date"], input[type="time"]').forEach((f) => {
      if (f.closest("label span")) return; // "Other" fields are folded into their choice above
      if (f.value.trim()) out.push(f.value.trim());
    });
    return out;
  }

  function serialize() {
    const lines = [`## Answers: ${title}`, `form: ${formId}`, ""];
    form.querySelectorAll(":scope > fieldset").forEach((fs, i) => {
      const legend = fs.querySelector(":scope > legend");
      const answers = answersFor(fs);
      lines.push(`${i + 1}. ${legend ? text(legend) : "Question"}`);
      if (answers.length === 0) lines.push("   → (no answer)");
      answers.forEach((a) => lines.push(`   → ${a.replace(/\n/g, "\n     ")}`));
      lines.push("");
    });
    return lines.join("\n").trimEnd() + "\n";
  }

  async function copy(str) {
    try {
      await navigator.clipboard.writeText(str);
      return true;
    } catch {
      const ta = Object.assign(document.createElement("textarea"), { value: str });
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.append(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    }
  }

  // Draft persistence: a per-viewer convenience; the page works without it.
  const named = () => [...form.elements].filter((e) => e.name);
  function save() {
    try {
      const data = named().map((e) => [e.name, e.value, e.type === "radio" || e.type === "checkbox" ? e.checked : null]);
      localStorage.setItem(storeKey, JSON.stringify(data));
    } catch {}
  }
  function restore() {
    try {
      const data = JSON.parse(localStorage.getItem(storeKey) || "null");
      if (!Array.isArray(data)) return;
      const els = named();
      data.forEach(([name, value, checked]) => {
        const el = els.find((e) => e.name === name && (checked === null || e.value === value));
        if (!el) return;
        if (checked === null) el.value = value;
        else el.checked = checked;
      });
    } catch {}
  }

  // Status line in the footer, and the preview after the form.
  const footer = form.querySelector(":scope > footer");
  let status = footer?.querySelector("output");
  if (footer && !status) {
    status = document.createElement("output");
    status.setAttribute("aria-live", "polite");
    footer.append(status);
  }
  const details = document.createElement("details");
  details.innerHTML = "<summary>Preview what gets copied</summary><pre><code></code></pre>";
  form.after(details);
  const preview = details.querySelector("code");

  function refresh() {
    form.querySelectorAll("output[for]").forEach((o) => {
      const src = document.getElementById(o.htmlFor[0]);
      if (src) o.value = src.value;
    });
    preview.textContent = serialize();
  }

  form.addEventListener("input", (e) => {
    const t = e.target;
    const choice = t.closest("label span") && t.closest("label")?.querySelector(":scope > input");
    if (choice && t.value) choice.checked = true;
    if (status) status.value = "";
    refresh();
    save();
  });
  form.addEventListener("reset", () => {
    try { localStorage.removeItem(storeKey); } catch {}
    if (status) status.value = "";
    setTimeout(refresh);
  });
  // Native validation runs before submit fires, so required questions are enforced.
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const ok = await copy(serialize());
    if (status) status.value = ok ? "Copied. Paste it into the chat." : "Couldn't copy. Use the preview below instead.";
    if (!ok) details.open = true;
  });

  restore();
  refresh();
})();
