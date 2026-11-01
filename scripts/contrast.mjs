#!/usr/bin/env node
/* Contrast report for src/lib/zinc.css: every accent × mode, before vs after.
   Resolves the color tokens and the :focus-visible ring the way the cascade
   does (:root, then the accent theme and any forced mode), evaluates var(),
   light-dark() and color-mix(), and measures WCAG 2 contrast ratios:
     link/bg       --accent on --bg                                 >= 4.5
     link/surface  --accent on --surface                            >= 4.5
     link/aside    --accent on --accent-soft over --bg (callout)    >= 4.5
     on/accent     --on-accent on --accent (button text)            >= 4.5
     on/press      --on-accent on --accent-press (button hover)     >= 4.5
     ring          focus ring on --bg and --surface, the lower      >= 3
   Translucent colors are composited over their background first. Also warns if
   the two dark blocks differ, since AGENTS.md says to keep them in sync.

   Usage:  node scripts/contrast.mjs [--before <git-ref|file>] [--after <file>]
   --before defaults to the git ref v0.0.0-pre.5 (the last release before the
   accessibility fixes, read with git show); --after to src/lib/zinc.css.
   Exit code: 1 if any "after" check fails, 2 on a usage or parse error, else 0. */
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = 'src/lib/zinc.css';
const WORKING_TREE = join(ROOT, SRC);
const DEFAULT_BEFORE = 'v0.0.0-pre.5';
const USAGE = 'usage: node scripts/contrast.mjs [--before <git-ref|file>] [--after <file>]';
const MODES = ['light', 'dark'];

// WCAG 2 ----------------------------------------------------------------------
function linear(v) {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance({ r, g, b }) {
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

function hexOf({ r, g, b, a }) {
  const channels = a < 1 ? [r, g, b, a * 255] : [r, g, b];
  return '#' + channels.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}

// composite fg over an opaque bg in gamma-encoded sRGB
function over(fg, bg) {
  if (bg.a < 1) throw new Error(`background ${hexOf(bg)} is translucent`);
  if (fg.a >= 1) return fg;
  const mixed = (k) => fg.a * fg[k] + (1 - fg.a) * bg[k];
  return { r: mixed('r'), g: mixed('g'), b: mixed('b'), a: 1 };
}

function ratio(fg, bg) {
  const [hi, lo] = [luminance(over(fg, bg)), luminance(bg)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const CHECKS = [
  { id: 'link/bg', min: 4.5, run: (c) => ratio(c.accent, c.bg) },
  { id: 'link/surface', min: 4.5, run: (c) => ratio(c.accent, c.surface) },
  { id: 'link/aside', min: 4.5, run: (c) => ratio(c.accent, over(c.soft, c.bg)) },
  { id: 'on/accent', min: 4.5, run: (c) => ratio(c.onAccent, over(c.accent, c.bg)) },
  { id: 'on/press', min: 4.5, run: (c) => ratio(c.onAccent, over(c.press, c.bg)) },
  { id: 'ring', min: 3, run: (c) => Math.min(ratio(c.ring, c.bg), ratio(c.ring, c.surface)) },
];

// color evaluator -------------------------------------------------------------
const NAMED = new Map([
  ['transparent', { r: 0, g: 0, b: 0, a: 0 }],
  ['white', { r: 255, g: 255, b: 255, a: 1 }],
  ['black', { r: 0, g: 0, b: 0, a: 1 }],
]);
const PERCENT = /^[+-]?(\d+\.?\d*|\.\d+)%$/;

function unsupported(expr) {
  return new Error(`unsupported color expression: ${expr}`);
}

// fn(args) with the closing paren at the very end, else null
function parseCall(s) {
  const open = s.indexOf('(');
  if (open < 1 || !/^[\w-]+$/.test(s.slice(0, open))) return null;
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    if (s[i] === '(') depth++;
    else if (s[i] === ')' && --depth === 0) {
      return i === s.length - 1 ? { fn: s.slice(0, open).toLowerCase(), args: s.slice(open + 1, i) } : null;
    }
  }
  return null;
}

function parseHex(s) {
  if (!/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(s)) throw unsupported(s);
  let h = s.slice(1);
  if (h.length <= 4) h = [...h].map((ch) => ch + ch).join('');
  const byte = (i) => parseInt(h.slice(i, i + 2), 16);
  return { r: byte(0), g: byte(2), b: byte(4), a: h.length === 8 ? byte(6) / 255 : 1 };
}

// rgb(r, g, b), rgba(r, g, b, a) and rgb(r g b / a); channels and alpha may be percentages
function parseRgb(args, expr) {
  const [channels, alpha, ...extra] = splitTop(args, /\//);
  const vals = [...splitTop(channels, /[\s,]/).filter(Boolean), ...(alpha === undefined ? [] : [alpha])];
  if (extra.length || vals.length < 3 || vals.length > 4) throw unsupported(expr);
  const num = (v, scale) => (v.endsWith('%') ? (Number(v.slice(0, -1)) / 100) * scale : Number(v));
  const [r, g, b] = vals.slice(0, 3).map((v) => num(v, 255));
  const a = vals.length === 4 ? num(vals[3], 1) : 1;
  if ([r, g, b, a].some(Number.isNaN)) throw unsupported(expr);
  const clamp = (v, max) => Math.min(max, Math.max(0, v));
  return { r: clamp(r, 255), g: clamp(g, 255), b: clamp(b, 255), a: clamp(a, 1) };
}

// CSS Color 5 color-mix(in srgb, ...): premultiplied alpha, percentages normalised
function colorMix([space, ...stops], expr, evaluate) {
  if (!/^in\s+srgb$/i.test(space) || stops.length !== 2) throw unsupported(expr);
  const [a, b] = stops.map((stop) => {
    let pct = null;
    const rest = [];
    for (const token of splitTop(stop, /\s/).filter(Boolean)) {
      if (PERCENT.test(token) && pct === null) pct = parseFloat(token);
      else rest.push(token);
    }
    if (rest.length !== 1) throw unsupported(expr);
    return { color: evaluate(rest[0]), pct };
  });
  let [p1, p2] = [a.pct, b.pct];
  if (p1 === null && p2 === null) p1 = p2 = 50;
  else if (p1 === null) p1 = 100 - p2;
  else if (p2 === null) p2 = 100 - p1;
  const sum = p1 + p2;
  if (p1 < 0 || p2 < 0 || p1 > 100 || p2 > 100 || sum === 0) throw unsupported(expr);
  const alpha = (p1 * a.color.a + p2 * b.color.a) / sum;
  const channel = (k) =>
    alpha === 0 ? 0 : (p1 * a.color[k] * a.color.a + p2 * b.color[k] * b.color.a) / sum / alpha;
  // a sum under 100% scales the result's alpha down by that fraction
  return { r: channel('r'), g: channel('g'), b: channel('b'), a: sum < 100 ? (alpha * sum) / 100 : alpha };
}

// ctx: { props: Map of custom properties, mode: 'light' | 'dark' }
function evalColor(expr, ctx, depth = 0) {
  if (depth > 16) throw new Error(`custom properties nest too deeply (circular var()?): ${expr}`);
  const s = expr.trim();
  const evaluate = (e) => evalColor(e, ctx, depth + 1);
  if (s.startsWith('#')) return parseHex(s);
  if (NAMED.has(s.toLowerCase())) return { ...NAMED.get(s.toLowerCase()) };
  const call = parseCall(s);
  if (!call) throw unsupported(s);
  const args = splitTop(call.args, /,/);
  switch (call.fn) {
    case 'var': {
      const [name, ...fallback] = args;
      if (ctx.props.has(name)) return evaluate(ctx.props.get(name));
      if (fallback.length) return evaluate(fallback.join(','));
      throw new Error(`undefined custom property ${name}`);
    }
    case 'light-dark': {
      if (args.length !== 2) throw unsupported(s);
      return evaluate(ctx.mode === 'dark' ? args[1] : args[0]);
    }
    case 'color-mix':
      return colorMix(args, s, evaluate);
    case 'rgb':
    case 'rgba':
      return parseRgb(call.args, s);
    default:
      throw unsupported(s);
  }
}

// stylesheet scanner ----------------------------------------------------------
// index just past the string that opens at s[i]
function skipString(s, i) {
  for (let j = i + 1; j < s.length; j++) {
    if (s[j] === '\\') j++;
    else if (s[j] === s[i]) return j + 1;
  }
  return s.length;
}

function stripComments(css) {
  let out = '';
  for (let i = 0; i < css.length; i++) {
    if (css[i] === '"' || css[i] === "'") {
      const end = skipString(css, i);
      out += css.slice(i, end);
      i = end - 1;
    } else if (css.startsWith('/*', i)) {
      const end = css.indexOf('*/', i + 2);
      if (end === -1) break;
      out += ' ';
      i = end + 1;
    } else {
      out += css[i];
    }
  }
  return out;
}

// split at sep characters that sit outside brackets and strings; parts come back trimmed
function splitTop(s, sep) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"' || c === "'") i = skipString(s, i) - 1;
    else if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') depth--;
    else if (depth === 0 && sep.test(c)) {
      parts.push(s.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(s.slice(start).trim());
  return parts;
}

// the { prelude, body } blocks at one nesting level; statements like @import are skipped
function parseRules(css) {
  const rules = [];
  let start = 0;
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === '"' || c === "'") {
      i = skipString(css, i) - 1;
    } else if (c === ';') {
      start = i + 1;
    } else if (c === '{') {
      let depth = 1;
      let j = i + 1;
      for (; j < css.length && depth > 0; j++) {
        if (css[j] === '"' || css[j] === "'") j = skipString(css, j) - 1;
        else if (css[j] === '{') depth++;
        else if (css[j] === '}') depth--;
      }
      if (depth > 0) throw new Error('unbalanced { in stylesheet');
      rules.push({ prelude: css.slice(start, i).trim().replace(/\s+/g, ' '), body: css.slice(i + 1, j - 1) });
      i = j - 1;
      start = j;
    }
  }
  return rules;
}

function parseDecls(body) {
  const decls = [];
  for (const chunk of splitTop(body, /;/)) {
    const colon = chunk.indexOf(':');
    if (colon < 1) continue;
    const name = chunk.slice(0, colon).trim();
    const value = chunk.slice(colon + 1).replace(/!important\s*$/i, '').replace(/\s+/g, ' ').trim();
    decls.push([name.startsWith('--') ? name : name.toLowerCase(), value]);
  }
  return decls;
}

const ACCENT_RULE = /^:root\[data-accent=(["']?)([\w-]+)\1\]$/;
const MODE_RULE = /^:root\[data-mode=(["']?)(light|dark)\1\]$/;
const DARK_MEDIA = /^@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)$/i;
const DARK_AUTO_RULE = /^:root:not\(\[data-mode=(["']?)light\1\]\)$/;
const OUTLINE_WIDTH = /^([+-]?(\d+\.?\d*|\.\d+)[a-z%]*|thin|medium|thick)$/i;
const OUTLINE_STYLE = /^(auto|none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset)$/i;

// the color of an outline shorthand: the token that is neither a width nor a line style
function outlineColor(value) {
  const isColor = (t) => t && !OUTLINE_WIDTH.test(t) && !OUTLINE_STYLE.test(t);
  return splitTop(value, /\s/).find(isColor) ?? 'currentColor';
}

// the selectors the checks read; any other rule is ignored
function classify(selector, inDarkMedia) {
  if (inDarkMedia) return DARK_AUTO_RULE.test(selector) ? { kind: 'darkAuto' } : null;
  if (selector === ':root') return { kind: 'root' };
  if (selector === ':focus-visible') return { kind: 'focus' };
  const accent = ACCENT_RULE.exec(selector);
  if (accent) return { kind: 'accent', name: accent[2] };
  const mode = MODE_RULE.exec(selector);
  return mode ? { kind: 'mode', name: mode[2] } : null;
}

// the custom properties and focus ring that the checks depend on
function parseStylesheet(css) {
  const model = { rules: [], accents: [], darkAuto: new Map(), darkManual: new Map(), ring: null };
  const visit = (text, inDarkMedia) => {
    for (const { prelude, body } of parseRules(text)) {
      if (prelude.startsWith('@')) {
        if (!inDarkMedia && DARK_MEDIA.test(prelude)) visit(body, true);
        continue;
      }
      const rule = classify(prelude, inDarkMedia);
      if (!rule) continue;
      if (parseRules(body).length) throw new Error(`nested rules inside ${prelude} are not supported`);
      const decls = parseDecls(body);
      const props = new Map(decls.filter(([name]) => name.startsWith('--')));
      if (rule.kind === 'darkAuto') {
        props.forEach((value, name) => model.darkAuto.set(name, value));
      } else if (rule.kind === 'focus') {
        for (const [name, value] of decls) {
          if (name === 'outline-color') model.ring = value;
          else if (name === 'outline') model.ring = outlineColor(value);
        }
      } else {
        model.rules.push({ ...rule, props });
        if (rule.kind === 'accent' && !model.accents.includes(rule.name)) model.accents.push(rule.name);
        if (rule.kind === 'mode' && rule.name === 'dark') {
          props.forEach((value, name) => model.darkManual.set(name, value));
        }
      }
    }
  };
  visit(stripComments(css), false);
  if (!model.ring) throw new Error('no :focus-visible rule with an outline color');
  return model;
}

// the custom properties that apply in one state: :root first (lower specificity),
// then the accent theme and forced mode, which tie, so source order decides
function propsFor(model, mode, accent) {
  const props = new Map();
  const applies = (rule) =>
    (rule.kind === 'accent' && rule.name === accent) || (rule.kind === 'mode' && rule.name === mode);
  for (const rule of [...model.rules.filter((r) => r.kind === 'root'), ...model.rules.filter(applies)]) {
    rule.props.forEach((value, name) => props.set(name, value));
  }
  return props;
}

function measure(model, mode, accent) {
  if (!model.accents.includes(accent)) return null;
  const ctx = { props: propsFor(model, mode, accent), mode };
  const get = (name) => evalColor(`var(${name})`, ctx);
  const colors = {
    accent: get('--accent'),
    onAccent: get('--on-accent'),
    press: get('--accent-press'),
    soft: get('--accent-soft'),
    bg: get('--bg'),
    surface: get('--surface'),
    ring: evalColor(model.ring, ctx),
  };
  return { colors, values: CHECKS.map((check) => check.run(colors)) };
}

function syncWarning(model, side) {
  const keys = new Set([...model.darkAuto.keys(), ...model.darkManual.keys()]);
  const differing = [...keys].filter((k) => model.darkAuto.get(k) !== model.darkManual.get(k));
  return differing.length
    ? `warning: ${side}: the two dark blocks differ on ${differing.join(', ')} (AGENTS.md: keep them in sync)`
    : null;
}

// input ---------------------------------------------------------------------
const GIT = { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] };

function show(ref, file) {
  try {
    return execFileSync('git', ['show', `${ref}:${file}`], GIT);
  } catch (err) {
    throw new Error(`git show ${ref}:${file} failed: ${String(err.stderr || err.message).trim()}`);
  }
}

function versionOf(packageJson) {
  try {
    return JSON.parse(packageJson).version;
  } catch {
    return undefined;
  }
}

// a file path wins over a git ref (refs only where allowRef is set)
function load(spec, allowRef) {
  const file = resolve(spec);
  if (statSync(file, { throwIfNoEntry: false })?.isFile()) {
    const css = readFileSync(file, 'utf8');
    if (file !== WORKING_TREE) return { css, label: spec };
    const version = versionOf(readFileSync(join(ROOT, 'package.json'), 'utf8')) ?? '?';
    return { css, label: `${version} (working tree)` };
  }
  if (!allowRef) throw new Error(`file not found: ${spec}`);
  if (spec.startsWith('-')) throw new Error(`not a git ref: ${spec}`);
  let version;
  try {
    version = versionOf(show(spec, 'package.json'));
  } catch {
    // an old ref without package.json still has a stylesheet to read
  }
  return { css: show(spec, SRC), label: version ? `${version} (${spec})` : spec };
}

function parseArgs(argv) {
  const opts = { before: DEFAULT_BEFORE, after: WORKING_TREE };
  for (let i = 0; i < argv.length; i++) {
    const [flag, inline] = argv[i].split(/=(.*)/s);
    if (flag === '--help' || flag === '-h') return null;
    if (flag !== '--before' && flag !== '--after') throw new Error(`unknown argument ${argv[i]}\n${USAGE}`);
    const value = inline ?? argv[++i];
    if (!value || value.startsWith('--')) throw new Error(`${flag} needs a value\n${USAGE}`);
    opts[flag.slice(2)] = value;
  }
  return opts;
}

// output --------------------------------------------------------------------
function table(rows) {
  const widths = rows[0].map((_, i) => Math.max(...rows.map((row) => row[i].length)));
  return rows.map((row) => row.map((cell, i) => cell.padEnd(widths[i])).join('  ').trimEnd());
}

function num(n) {
  return n === undefined ? 'n/a' : n.toFixed(2);
}

function pair(before, after) {
  return before === undefined || before === after ? after : `${before} → ${after}`;
}

function hexIn(run, key) {
  return run ? hexOf(run.colors[key]) : undefined;
}

function main(argv) {
  const opts = parseArgs(argv);
  if (!opts) return console.log(USAGE);

  const sides = {};
  for (const [side, spec] of [['before', opts.before], ['after', opts.after]]) {
    const { css, label } = load(spec, side === 'before');
    try {
      sides[side] = { label, model: parseStylesheet(css) };
    } catch (err) {
      throw new Error(`${side} (${label}): ${err.message}`);
    }
  }
  const accents = sides.after.model.accents;
  if (!accents.length) throw new Error(`after (${sides.after.label}): no :root[data-accent="…"] rules`);

  const measureSide = (side, mode, accent) => {
    try {
      return measure(sides[side].model, mode, accent);
    } catch (err) {
      throw new Error(`${side} (${sides[side].label}), ${mode}/${accent}: ${err.message}`);
    }
  };

  const out = [
    'zinc.css contrast: before → after, every accent × mode',
    `  before   ${sides.before.label}`,
    `  after    ${sides.after.label}`,
    '  targets  text 4.5:1 (link/*, on/*), focus ring 3:1 (WCAG 2 AA); ✓/✗ judge the after value',
  ];
  for (const side of ['before', 'after']) {
    const warning = syncWarning(sides[side].model, side);
    if (warning) out.push('', warning);
  }

  const failures = [];
  for (const mode of MODES) {
    const rows = [['accent', '--accent', ...CHECKS.map((check) => check.id)]];
    let neutrals;
    for (const accent of accents) {
      const before = measureSide('before', mode, accent);
      const after = measureSide('after', mode, accent);
      neutrals ??= ['bg', 'surface'].map((key) => pair(hexIn(before, key), hexIn(after, key)));
      const cells = CHECKS.map((check, i) => {
        const ok = after.values[i] >= check.min;
        if (!ok) failures.push({ mode, accent, check, value: after.values[i] });
        return `${num(before?.values[i])}→${num(after.values[i])} ${ok ? '✓' : '✗'}`;
      });
      rows.push([accent, `${hexIn(before, 'accent') ?? 'n/a'} → ${hexIn(after, 'accent')}`, ...cells]);
    }
    out.push('', `${mode}   --bg ${neutrals[0]}   --surface ${neutrals[1]}`, ...table(rows));
  }

  const total = MODES.length * accents.length * CHECKS.length;
  out.push('');
  if (failures.length) {
    out.push(`after: ${failures.length} of ${total} checks fail`);
    for (const { mode, accent, check, value } of failures) {
      out.push(`  ${mode}/${accent} ${check.id}: ${value.toFixed(2)} (needs ${check.min})`);
    }
  } else {
    out.push(`after: all ${total} checks pass`);
  }
  console.log(out.join('\n'));
  process.exitCode = failures.length ? 1 : 0;
}

try {
  main(process.argv.slice(2));
} catch (err) {
  console.error(`contrast: ${err.message}`);
  process.exitCode = 2;
}
