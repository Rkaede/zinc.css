#!/usr/bin/env node
/* Build the docs site into dist/docs/, a self-contained static site.
   Run through `pnpm run build:docs`, which runs `pnpm run build` first so
   the built zinc.css at the repo root is current. Copies docs/ as it is,
   puts that zinc.css at dist/docs/zinc.css, and points every page's
   stylesheet <link> at it in place of the relative path to src/lib/. */
import { cp, copyFile, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, posix, relative, sep } from 'node:path';

const SRC = 'docs';
const OUT = 'dist/docs';
const CSS = 'zinc.css';
const OUT_CSS = join(OUT, CSS);
// only a real <link> tag matches, never escaped markup in a code block
const LINK = /(<link\b[^>]*\bhref=")(?:\.\.\/)+src\/lib\/zinc\.css(")/g;

await rm(OUT, { recursive: true, force: true });
await cp(SRC, OUT, { recursive: true });
await copyFile(CSS, OUT_CSS);

let pages = 0;
const left = [];
for (const entry of await readdir(OUT, { recursive: true })) {
  if (!entry.endsWith('.html')) continue;
  const file = join(OUT, entry);
  const href = relative(dirname(file), OUT_CSS).split(sep).join(posix.sep);
  const html = await readFile(file, 'utf8');
  const out = html.replace(LINK, `$1${href}$2`);
  if (/<link\b[^>]*src\/lib\/zinc\.css/.test(out)) left.push(entry);
  await writeFile(file, out);
  pages++;
}

if (left.length) {
  console.error(`build-docs: stylesheet link not rewritten in ${left.join(', ')}`);
  process.exit(1);
}
console.log(`${OUT}: ${pages} pages, stylesheet at ${OUT_CSS}`);
