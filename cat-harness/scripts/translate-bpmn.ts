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
 * ## `--check` — the gate its sibling already had
 *
 * `render-bpmn` has `render:bpmn:check`, which fails when an SVG is stale, and
 * `AGENTS.md` records at length why: a generated artefact with no staleness
 * check drifts silently and the published site serves the old one. This script
 * had **no counterpart**, so adding a diagram and not re-extracting cost
 * nothing at the time and was discovered only when somebody ran extract by
 * hand. Measured that way on 2026-09-19 (bean `0hd6`): **twelve of thirty-two
 * diagrams had no `.pot` at all**, the whole CRDM cluster among them. A `.pot`
 * is a translator's INPUT, so those diagrams were not merely untranslated —
 * they were invisible to whoever does the translating, because nothing in the
 * translations tree said they existed.
 *
 * **One wrinkle, and without it the check is useless:** the ONLY difference
 * between two runs over an unchanged diagram is the `POT-Creation-Date`
 * header — measured, 32 files regenerated, every one differing in that line
 * and nothing else. A naive byte comparison therefore fails always. The
 * comparison excludes that header, exactly as a lockfile check ignores its own
 * timestamp.
 *
 * **Three states, not two.** A `.pot` that is absent is STALE; one that
 * differs is STALE; one that cannot be READ is reported as such and fails,
 * never as a pass. "Could not determine" is never rendered green.
 *
 * ## What it gates on, and what it only reports
 *
 * A locale that has NEVER carried a workflow template is not out of date —
 * it has not opted in. Measured 2026-09-19: `fr` holds 20 of them, and `ar`,
 * `es`, `ru` and `zh` hold **none**, carrying only `kg-viewer.pot` and a
 * handful of `.po`. Gating on all five would demand 128 templates for
 * locales that have no workflow coverage anywhere else — inventing a diff
 * nobody asked for, and misreporting how far those locales have actually
 * got.
 *
 * So a locale with a `workflows/` tree GATES, and one without is reported as
 * NOT A TARGET with its count. That is the same shape as `kg-audit`'s
 * coverage criteria: legitimate instances exist, so it must not gate — and it
 * must not be silent either, because a locale scanned and found empty,
 * reported as clean, is the `dh4f` defect (a consumer scans nothing and
 * reports a clean run over it).
 *
 * Usage:
 *   bun run translate-bpmn --extract [--locale fr]
 *   bun run translate-bpmn --check   [--locale fr]
 *   bun run translate-bpmn --inject --locale fr
 *
 * Injection writes `translations/<locale>/workflows/<name>.bpmn`. Rendering it
 * is `bun run render:bpmn` territory and is deliberately a separate step: the
 * renderer drives headless Chromium, and an extract/inject run should not.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolveDirectories } from "../schemas/cat-harness.js";
import { workflowFiles } from "./known-skills.js";
import { basename, dirname, join, relative, resolve } from "node:path";
import { extractBpmn, injectBpmn } from "../content/pipeline/bpmn-translate.js";
import { formatPot } from "../content/pipeline/pot-extract.js";
import { parsePo } from "../content/pipeline/po-inject.js";

const root = resolve(import.meta.dir, "..");
const argv = process.argv.slice(2);

function flag(name: string): string | undefined {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? undefined : argv[i + 1];
}
const wantExtract = argv.includes("--extract");
const wantInject = argv.includes("--inject");
const wantCheck = argv.includes("--check");
const locale = flag("locale");

if (!wantExtract && !wantInject && !wantCheck) {
  console.error("Nothing to do. Pass --extract, --check, or --inject --locale <code>.");
  process.exit(2);
}
if (wantInject && !locale) {
  console.error("--inject needs --locale <code>.");
  process.exit(2);
}

// ABSOLUTE paths from every declared knowledge-graph directory. A diagram in
// a topical directory is as translatable as one under `skills/`, and a
// translator who is never shown it has no way to know it was skipped.
const diagrams = workflowFiles(root).filter((f) => f.endsWith(".bpmn"));
if (diagrams.length === 0) {
  console.error("No .bpmn files in any declared knowledge-graph directory.");
  process.exit(2);
}

/**
 * The declared home of `.pot` / `.po` sources, read rather than written down.
 *
 * `harness.json` declares it as the `translation-sources` graph; this module
 * had the literal `translations` in five places, which `check:declared-paths`
 * caught the moment two more were added. Resolved once here so relocating the
 * tree is a declaration edit, not a sweep — and so this script and
 * `translate-kg-viewer` cannot disagree about where a translator's files are.
 *
 * Falls back to the convention when nothing declares it: an instance with no
 * declaration still has a `translations/`, and refusing to run over one would
 * be worse than assuming the default the schema already supplies.
 */
function translationsRoot(): string {
  const d = resolveDirectories([{ name: "(local)", root, own: true }]).find((x) =>
    x.graphKinds.includes("translation-sources"),
  );
  // declared-path-literal: the base case for an instance that declares
  // nothing. Reading a declaration to learn the fallback for having no
  // declaration is not a thing that can be done; the schema's own
  // DEFAULT_DIRECTORIES supplies the same convention.
  return d?.absPath ?? join(root, "translations");
}
const TRANSLATIONS = translationsRoot();

/**
 * Where a diagram's template lives — ONE answer, for the writer and the
 * checker alike.
 *
 * Two copies of this join is how a check passes over a file the extractor
 * never wrote, which is the shape of the defect this whole module exists to
 * close.
 */
function potPathFor(file: string, loc: string): string {
  return join(TRANSLATIONS, loc, "workflows", `${basename(file, ".bpmn")}.pot`);
}

/**
 * A `.pot` with its creation timestamp blanked, for comparison only.
 *
 * Never written back: the header is real metadata a translator's tooling
 * reads. It is excluded from the COMPARISON because it is the one line that
 * changes on every run regardless of content.
 */
function withoutTimestamp(text: string): string {
  return text.replace(/^"POT-Creation-Date:.*$/m, '"POT-Creation-Date: <ignored>\\n"');
}

/** Locales that already have a translations directory. */
function knownLocales(): string[] {
  const dir = TRANSLATIONS;
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

if (wantCheck) {
  const targets = locale ? [locale] : knownLocales();
  if (targets.length === 0) {
    console.error("No locales found under translations/ and none given with --locale.");
    process.exit(2);
  }
  console.log(`Checking ${diagrams.length} diagram(s) against: ${targets.join(", ")}\n`);

  // A locale GATES once it carries at least one workflow template; before
  // that it is reported, not demanded. `--locale` is an explicit request, so
  // naming one opts it in.
  const gating = new Set(
    targets.filter((loc) => locale === loc || existsSync(join(TRANSLATIONS, loc, "workflows"))),
  );

  const missing: string[] = [];
  const stale: string[] = [];
  const unreadable: string[] = [];
  const notTarget = new Map<string, number>();

  for (const file of diagrams) {
    const entries = extractBpmn(readFileSync(file, "utf-8"), relative(root, file));
    for (const loc of targets) {
      const out = potPathFor(file, loc);
      const label = relative(root, out);
      if (!gating.has(loc)) {
        notTarget.set(loc, (notTarget.get(loc) ?? 0) + 1);
        continue;
      }
      if (!existsSync(out)) {
        missing.push(label);
        continue;
      }
      let onDisk: string;
      try {
        onDisk = readFileSync(out, "utf-8");
      } catch {
        // NOT a pass. An unreadable template is a template nobody can rely
        // on, and reporting it as up to date is the one answer this check
        // must never give.
        unreadable.push(label);
        continue;
      }
      const fresh = formatPot(entries, { projectName: basename(file, ".bpmn"), locale: loc });
      if (withoutTimestamp(onDisk) !== withoutTimestamp(fresh)) stale.push(label);
    }
  }

  const bad = missing.length + stale.length + unreadable.length;
  console.log(`  gating on: ${[...gating].sort().join(", ") || "(none)"}`);
  console.log(`  ${missing.length ? "✗" : "✓"} ${String(missing.length).padStart(3)}  never extracted`);
  console.log(`  ${stale.length ? "✗" : "✓"} ${String(stale.length).padStart(3)}  out of date`);
  if (unreadable.length) console.log(`  ✗ ${String(unreadable.length).padStart(3)}  could not be read`);
  for (const [loc, n] of [...notTarget].sort()) {
    console.log(`  · ${String(n).padStart(3)}  ${loc} — not a workflow-translation target yet, so not demanded`);
  }

  if (missing.length) {
    console.log("\nNEVER EXTRACTED — the diagram is invisible to whoever translates:");
    for (const m of missing) console.log(`  ✗ ${m}`);
  }
  if (stale.length) {
    console.log("\nOUT OF DATE — the diagram changed since the template was written:");
    for (const m of stale) console.log(`  ✗ ${m}`);
  }
  if (unreadable.length) {
    console.log("\nCOULD NOT BE READ — reported, never counted as up to date:");
    for (const m of unreadable) console.log(`  ✗ ${m}`);
  }

  if (bad) {
    console.log(`\n${bad} template(s) need regenerating: bun run translate-bpmn --extract`);
    process.exit(1);
  }
  console.log("\nEvery diagram has a current .pot in every locale.");
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
    const xml = readFileSync(file, "utf-8");
    const rel = relative(root, file);
    const entries = extractBpmn(xml, rel);
    total += entries.length;
    for (const loc of targets) {
      const out = potPathFor(file, loc);
      mkdirSync(dirname(out), { recursive: true });
      const fresh = formatPot(entries, { projectName: basename(file, ".bpmn"), locale: loc });
      // Written only when the CONTENT changed. `POT-Creation-Date` differs on
      // every run, so an unconditional write reports all 32 files as modified
      // after an extract that changed nothing — and a diff where everything
      // moved is a diff nobody reads. Skipping the no-op write is what makes
      // `git status` after an extract say what actually changed, which is how
      // the `.beans/` → `beans/` drift in 18 of these was spotted at all.
      const prior = existsSync(out) ? readFileSync(out, "utf-8") : undefined;
      if (prior !== undefined && withoutTimestamp(prior) === withoutTimestamp(fresh)) continue;
      writeFileSync(out, fresh);
    }
    console.log(`  ${relative(root, file).padEnd(48)} ${String(entries.length).padStart(3)} msgid(s)`);
  }
  console.log(`\n${total} translatable string(s) across ${diagrams.length} diagram(s).`);
  console.log("A .pot is a translator's input; nothing is translated until a .po sits beside it.");
}

if (wantInject) {
  const loc = locale!;
  const poDir = join(TRANSLATIONS, loc, "workflows");
  const outDir = join(TRANSLATIONS, loc, "workflows");
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
    const xml = readFileSync(file, "utf-8");
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, basename(file)), injectBpmn(xml, translations));
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
