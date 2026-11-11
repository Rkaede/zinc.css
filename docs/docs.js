/* zinc.css docs: progressive extras. Without JavaScript the pages still read
   and every demo still renders; only the generated markup and the copy
   button are missing. (The Theme button is theme.js.) */
{
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

  /* 3. A <button data-copy> copies the code block just before it, such as
     the getting-started prompt. It stays hidden without JavaScript. */
  for (const button of document.querySelectorAll("button[data-copy]")) {
    const pre = button.closest("p, menu")?.previousElementSibling;
    if (!pre?.matches("pre") || !navigator.clipboard) continue;
    const label = button.textContent;
    button.hidden = false;
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(pre.textContent);
        button.textContent = "Copied";
      } catch {
        button.textContent = "Couldn’t copy";
      }
      setTimeout(() => (button.textContent = label), 2000);
    });
  }
}
