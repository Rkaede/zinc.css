/* zinc.css docs: progressive extras. Without JavaScript the pages still read
   and every demo still renders; only the generated markup and the theme
   switcher are missing. */
{
  const KEY = "zinc-docs-theme";
  const root = document.documentElement;
  const HOOKS = ["mode", "accent", "paper"];

  /* 1. Demos: each <figure data-demo> is the one source of its markup. Its
     innerHTML is dedented and shown in a <pre><code> placed after it. */
  const BOOLEAN = /\s(checked|disabled|required|open|selected|multiple|hidden|readonly|novalidate|autofocus)=""/g;
  const dedent = (html) => {
    const lines = html.replace(/^\s*\n/, "").replace(/\s+$/, "").split("\n");
    const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
    return lines.map((l) => l.slice(indent)).join("\n");
  };
  for (const demo of document.querySelectorAll("figure[data-demo]")) {
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.textContent = dedent(demo.innerHTML.replace(BOOLEAN, " $1"));
    pre.append(code);
    demo.after(pre);
  }

  /* 2. <button commandfor command="show-modal"> opens a dialog natively in
     current browsers; this covers the ones without invoker commands. */
  if (!("command" in HTMLButtonElement.prototype)) {
    document.addEventListener("click", (event) => {
      const button = event.target.closest("button[commandfor]");
      const dialog = button && document.getElementById(button.getAttribute("commandfor"));
      if (dialog && button.getAttribute("command") === "show-modal") dialog.showModal();
    });
  }

  /* 3. Theme switcher (theming page): sets the hooks on <html>, shows the
     markup, and stores the choice so every docs page picks it up. */
  const picker = document.querySelector("form[data-theme-picker]");
  if (picker) {
    const markup = document.querySelector("pre[data-theme-markup]");
    const DEFAULTS = { mode: "system", accent: "electric", paper: "white" };
    const show = () => {
      const attrs = HOOKS.filter((k) => root.dataset[k]).map((k) => ` data-${k}="${root.dataset[k]}"`);
      markup.firstElementChild.textContent = `<html lang="en"${attrs.join("")}>`;
    };
    const apply = () => {
      const stored = {};
      for (const k of HOOKS) {
        const value = picker.elements[k].value;
        if (value && value !== DEFAULTS[k]) root.dataset[k] = stored[k] = value;
        else delete root.dataset[k];
      }
      try {
        if (Object.keys(stored).length) localStorage.setItem(KEY, JSON.stringify(stored));
        else localStorage.removeItem(KEY);
      } catch {}
      show();
    };
    for (const k of HOOKS) picker.elements[k].value = root.dataset[k] || DEFAULTS[k];
    picker.addEventListener("change", apply);
    picker.addEventListener("reset", () => setTimeout(apply));
    picker.hidden = markup.hidden = false;
    show();
  }

  /* 4. The example pages read ?mode, ?accent and ?paper but not the stored
     theme, so links to them carry the current hooks along. */
  const params = new URLSearchParams();
  for (const k of HOOKS) if (root.dataset[k]) params.set(k, root.dataset[k]);
  if (params.size) {
    for (const a of document.querySelectorAll('a[href*="examples/"], main a[href$=".html"]')) {
      const url = new URL(a.href, location.href);
      if (/\/examples\/(?!index\.html)[\w-]+\.html$/.test(url.pathname) && !url.search) {
        url.search = params;
        a.href = url;
      }
    }
  }
}
