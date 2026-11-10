/* zinc.css docs: the Debug panel, on every docs and example page. Each
   control sets an attribute on <html> (styled in debug.css) and is stored,
   so the head script on the next page applies it before paint. */
{
  const KEY = "zinc-docs-debug";
  const root = document.documentElement;
  // key: stored name and ?key= URL parameter; attr: the data-* on <html>
  const OPTIONS = [
    { key: "toc", attr: "debugToc", on: "list", label: "Contents as a list", hint: "“On this page” links in one column" },
    { key: "labels", attr: "debugLabels", on: "above", label: "Headings above content", hint: "Wide windows (56rem+) put them in the margin" },
    { key: "spacing", attr: "debugSpacing", label: "Section spacing", choices: ["tight", "compact", "default", "spacious"] },
    // zinc rules sub-sections by default, so this switch starts on and stores "off"
    { key: "rules", attr: "debugRules", off: "off", label: "Rules between sub-sections", hint: "A hairline above each nested section" },
  ];

  function save() {
    const stored = {};
    for (const o of OPTIONS) if (root.dataset[o.attr]) stored[o.key] = root.dataset[o.attr];
    try {
      if (Object.keys(stored).length) localStorage.setItem(KEY, JSON.stringify(stored));
      else localStorage.removeItem(KEY);
    } catch {}
  }

  function set(option, value) {
    if (value) root.dataset[option.attr] = value;
    else delete root.dataset[option.attr];
    save();
  }

  function switchControl(option) {
    const label = document.createElement("label");
    label.innerHTML = `<input type="checkbox" role="switch" /> <span>${option.label}<small>${option.hint}</small></span>`;
    const input = label.querySelector("input");
    const value = root.dataset[option.attr];
    input.checked = option.off ? value !== option.off : value === option.on;
    input.addEventListener("change", () => set(option, option.off ? (input.checked ? "" : option.off) : (input.checked ? option.on : "")));
    return label;
  }

  // a choice is a segmented control; "default" removes the attribute
  function choiceControl(option) {
    const wrap = document.createElement("div");
    wrap.innerHTML = `<span>${option.label}</span><span role="radiogroup" aria-label="${option.label}"></span>`;
    const group = wrap.lastElementChild;
    const current = root.dataset[option.attr] || "default";
    for (const choice of option.choices) {
      const label = document.createElement("label");
      label.innerHTML = `<input type="radio" name="debug-${option.key}" /><span>${choice[0].toUpperCase() + choice.slice(1)}</span>`;
      const input = label.querySelector("input");
      input.value = choice === "default" ? "" : choice;
      input.checked = choice === current;
      input.addEventListener("change", () => set(option, input.value));
      group.append(label);
    }
    return wrap;
  }

  const panel = document.createElement("details");
  panel.dataset.debugPanel = "";
  panel.innerHTML = "<summary>Debug</summary><fieldset></fieldset>";
  const fieldset = panel.querySelector("fieldset");
  for (const option of OPTIONS) fieldset.append(option.choices ? choiceControl(option) : switchControl(option));
  document.body.append(panel);
}
