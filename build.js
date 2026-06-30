#!/usr/bin/env node
/* Build src/lib/zinc.css → repo root with Lightning CSS.
   Emits an unminified zinc.css and a minified zinc.min.css at the project
   root, so the published npm package has them at its top level (no dist/
   segment in CDN URLs like jsdelivr.net/npm/zinc.css/zinc.css).
   https://lightningcss.dev/ */
import { readFile, writeFile } from 'node:fs/promises';
import { transform } from 'lightningcss';

const SRC = 'src/lib/zinc.css';

const css = await readFile(SRC);

for (const [out, minify] of [
  ['zinc.css', false],
  ['zinc.min.css', true],
]) {
  const { code } = transform({ filename: SRC, code: css, minify });
  await writeFile(out, code);
  console.log(
    `${out}: ${css.length} → ${code.length} bytes ` +
      `(${Math.round((1 - code.length / css.length) * 100)}% smaller)`,
  );
}
