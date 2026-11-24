/* zinc.css docs: progressive extras. Without JavaScript the pages still read
   and every demo still renders; only the generated markup and the copy
   button are missing. (The Theme button is theme.js.) */
{
  /* 1. Demos: each <figure data-demo> is the one source of its markup. Its
     innerHTML is dedented and shown in a <pre><code> placed after it. */
  const BOOLEAN = /\s(checked|disabled|required|open|selected|multiple|hidden|readonly|novalidate|autofocus|data-numbers|data-chosen)=""/g;
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

  /* 4. The examples filmstrip: the arrow buttons scroll it a card at a time
     and are disabled at each end. Their row stays hidden without JavaScript;
     the strip still scrolls by its scrollbar, a swipe or the keyboard. */
  for (const strip of document.querySelectorAll("ul[data-strip]")) {
    const row = strip.nextElementSibling;
    const buttons = row?.querySelectorAll("button[data-strip-step]") ?? [];
    if (!buttons.length) continue;
    row.hidden = false;
    const step = (button) => Number(button.dataset.stripStep);
    const updateEnds = () => {
      const max = strip.scrollWidth - strip.clientWidth;
      for (const button of buttons) {
        button.disabled = step(button) < 0 ? strip.scrollLeft <= 1 : strip.scrollLeft >= max - 1;
      }
    };
    let queued = false;
    strip.addEventListener("scroll", () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; updateEnds(); });
    }, { passive: true });
    addEventListener("resize", updateEnds, { passive: true });
    for (const button of buttons) {
      button.addEventListener("click", () => {
        const card = strip.querySelector("li");
        const distance = card.offsetWidth + parseFloat(getComputedStyle(strip).columnGap);
        const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
        strip.scrollBy({ left: step(button) * distance, behavior: calm ? "auto" : "smooth" });
      });
    }
    updateEnds();
  }
}
