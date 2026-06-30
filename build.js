#!/usr/bin/env node
/* Build src/lib/zinc.css → dist/ with Lightning CSS.
   Emits an unminified dist/zinc.css and a minified dist/zinc.min.css.
   https://lightningcss.dev/ */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { transform } from 'lightningcss';

const SRC = 'src/lib/zinc.css';
const OUT_DIR = 'dist';

const css = await readFile(SRC);

await mkdir(OUT_DIR, { recursive: true });

for (const [out, minify] of [
  [`${OUT_DIR}/zinc.css`, false],
  [`${OUT_DIR}/zinc.min.css`, true],
]) {
  const { code } = transform({ filename: SRC, code: css, minify });
  await writeFile(out, code);
  console.log(
    `${out}: ${css.length} → ${code.length} bytes ` +
      `(${Math.round((1 - code.length / css.length) * 100)}% smaller)`,
  );
}
