#!/usr/bin/env bun
/**
 * BPMN diagram translation — extract strings, and inject them back per locale.
 *
 * Bean `8xx6`. `content/pipeline/bpmn-translate.ts` is the round-trip; this is
 * the orchestration around it.
 *
 * ## What exists, and what this does not pretend to
 *
 * Measured 2026-09-18 before building: `translations/<locale>/` holds `.po`
 * files for `index` and `agent-onboarding` and NOTHING for any diagram, and
 * `docs/fr/` contains a single page that embeds no diagram at all. So:
 *
 *   - EXTRACT has a real consumer today — a translator needs a `.pot` before
 *     there can be a `.po`, and none exists for any of the 19 diagrams.
 *   - INJECT has no input yet. It is built, and it SKIPS a locale that has no
 *     `.po` rather than failing: "not translated yet" is the ordinary state of
 *     nearly every diagram, not an error.
 *   - PAGE WIRING is genuinely blocked and is not attempted here. No
 *     translated page references a workflow SVG, so a locale render would
 *     produce a file nothing links to — present but unreferenced, which is the
 *     mirror of the dangling references gated by `check:workflow-refs`.
 *
 * Usage:
 *   bun run translate-bpmn --extract [--locale fr]
 *   bun run translate-bpmn --inject --locale fr
 *
 * Injection writes `translations/<locale>/workflows/<name>.bpmn`. Rendering it
 * is `bun run render:bpmn` territory and is deliberately a separate step: the
 * renderer drives headless Chromium, and an extract/inject run should not.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { extractBpmn, injectBpmn } from "../content/pipeline/bpmn-translate.js";
import { formatPot } from "../content/pipeline/pot-extract.js";
import { parsePo } from "../content/pipeline/po-inject.js";

const root = resolve(import.meta.dir, "..");
const WF = join(root, "skills", "workflows");
const argv = process.argv.slice(2);

function flag(name: string): string | undefined {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? undefined : argv[i + 1];
}
const wantExtract = argv.includes("--extract");
const wantInject = argv.includes("--inject");
const locale = flag("locale");

if (!wantExtract && !wantInject) {
  console.error("Nothing to do. Pass --extract or --inject --locale <code>.");
  process.exit(2);
}
if (wantInject && !locale) {
  console.error("--inject needs --locale <code>.");
  process.exit(2);
}

const diagrams = readdirSync(WF).filter((f) => f.endsWith(".bpmn")).sort();
if (diagrams.length === 0) {
  console.error(`No .bpmn files under ${WF}.`);
  process.exit(2);
}

/** Locales that already have a translations directory. */
function knownLocales(): string[] {
  const dir = join(root, "translations");
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

if (wantExtract) {
  const targets = locale ? [locale] : knownLocales();
  if (targets.length === 0) {
    console.error("No locales found under translations/ and none given with --locale.");
    process.exit(2);
  }
  console.log(`Extracting ${diagrams.length} diagram(s) for: ${targets.join(", ")}\n`);
  let total = 0;
  for (const file of diagrams) {
    const xml = readFileSync(join(WF, file), "utf-8");
    const rel = `skills/workflows/${file}`;
    const entries = extractBpmn(xml, rel);
    total += entries.length;
    for (const loc of targets) {
      const outDir = join(root, "translations", loc, "workflows");
      mkdirSync(outDir, { recursive: true });
      const out = join(outDir, `${basename(file, ".bpmn")}.pot`);
      writeFileSync(out, formatPot(entries, { projectName: basename(file, ".bpmn"), locale: loc }));
    }
    console.log(`  ${file.padEnd(38)} ${String(entries.length).padStart(3)} msgid(s)`);
  }
  console.log(`\n${total} translatable string(s) across ${diagrams.length} diagram(s).`);
  console.log("A .pot is a translator's input; nothing is translated until a .po sits beside it.");
}

if (wantInject) {
  const loc = locale!;
  const poDir = join(root, "translations", loc, "workflows");
  const outDir = join(root, "translations", loc, "workflows");
  let injected = 0;
  const skipped: string[] = [];

  console.log(`Injecting ${loc}\n`);
  for (const file of diagrams) {
    const stem = basename(file, ".bpmn");
    const po = join(poDir, `${stem}.po`);
    if (!existsSync(po)) {
      // The ordinary state, not a failure. Say so per diagram rather than
      // reporting a clean run that produced nothing.
      skipped.push(stem);
      continue;
    }
    const translations = parsePo(readFileSync(po, "utf-8"));
    const xml = readFileSync(join(WF, file), "utf-8");
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, file), injectBpmn(xml, translations));
    injected++;
    console.log(`  ✓ ${stem.padEnd(38)} ${translations.size} translation(s)`);
  }

  if (skipped.length) {
    console.log(`\n${skipped.length} diagram(s) have no ${loc} .po yet — nothing injected for them:`);
    console.log(`  ${skipped.join(", ")}`);
  }
  console.log(
    `\n${injected} diagram(s) written to translations/${loc}/workflows/.` +
      (injected ? "\nRender them with `bun run render:bpmn` once the output path is wired." : ""),
  );
}
