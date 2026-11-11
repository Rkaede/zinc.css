/* zinc.css docs: the Theme button, top right on every docs and example page.
   It opens a popover that sets zinc's three theme hooks on <html> and stores
   them, so the head script on the next page applies them before paint.
   Without JavaScript there is no button; ?mode=, ?accent= and ?paper= still
   work on any page. */
{
  const KEY = "zinc-docs-theme";
  const root = document.documentElement;
  // the first choice of each hook is zinc's default: no attribute at all
  const HOOKS = [
    { key: "mode", label: "Mode", choices: ["system", "light", "dark"] },
    { key: "accent", label: "Accent", choices: ["electric", "forest", "violet"] },
    { key: "paper", label: "Paper", choices: ["white", "beige"] },
  ];
  const home = new URL("index.html", document.currentScript.src);
  const onExample = /\/examples\/[^/]+$/.test(location.pathname);
  const title = (word) => word[0].toUpperCase() + word.slice(1);

  const button = document.createElement("button");
  button.type = "button";
  button.dataset.themeButton = "";
  button.dataset.variant = "secondary";
  button.dataset.size = "sm";
  button.setAttribute("popovertarget", "zinc-theme");
  button.innerHTML = `<span aria-hidden="true">◐</span> Theme`;

  const popover = document.createElement("div");
  popover.id = "zinc-theme";
  popover.popover = "auto";
  popover.dataset.themePopover = "";
  popover.setAttribute("role", "dialog");
  popover.setAttribute("aria-label", "Theme");

  for (const hook of HOOKS) {
    const row = document.createElement("div");
    row.innerHTML = `<span>${hook.label}</span><span role="radiogroup" aria-label="${hook.label}"></span>`;
    const current = root.dataset[hook.key] || hook.choices[0];
    for (const [i, choice] of hook.choices.entries()) {
      const label = document.createElement("label");
      label.innerHTML = `<input type="radio" name="zinc-theme-${hook.key}" /><span>${title(choice)}</span>`;
      const input = label.querySelector("input");
      input.value = i ? choice : "";
      input.checked = choice === current;
      input.addEventListener("change", () => set(hook.key, input.value));
      row.lastElementChild.append(label);
    }
    popover.append(row);
  }

  // the markup for the current theme, to copy into a page of your own
  const markup = document.createElement("p");
  markup.innerHTML = "<code></code>";
  popover.append(markup);
  if (onExample) {
    const back = document.createElement("p");
    back.innerHTML = `<a href="${home}">zinc.css docs</a>`;
    popover.append(back);
  }

  function show() {
    const attrs = HOOKS.filter((h) => root.dataset[h.key]).map((h) => ` data-${h.key}="${root.dataset[h.key]}"`);
    markup.firstChild.textContent = `<html${attrs.join("")}>`;
  }

  function set(key, value) {
    if (value) root.dataset[key] = value;
    else delete root.dataset[key];
    const stored = {};
    for (const h of HOOKS) if (root.dataset[h.key]) stored[h.key] = root.dataset[h.key];
    try {
      if (Object.keys(stored).length) localStorage.setItem(KEY, JSON.stringify(stored));
      else localStorage.removeItem(KEY);
    } catch {}
    show();
  }

  show();
  document.body.append(button, popover);
}
