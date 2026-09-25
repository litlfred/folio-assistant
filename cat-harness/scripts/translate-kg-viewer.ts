#!/usr/bin/env bun
/**
 * The knowledge-graph viewer's chrome, extracted and checked.
 *
 * Bean `xcyh`. `scripts/kg-viewer-strings.ts` is the table; this is the
 * orchestration around it, and it is deliberately the same shape as
 * `scripts/translate-bpmn.ts`: extract from the SOURCE, write
 * `translations/<locale>/<stem>.pot`, and let the artefact's own generator do
 * the injecting. Two spellings of one concept is the drift this repository
 * keeps paying for, so this borrows `formatPot` and `parsePo` rather than
 * growing a second gettext implementation.
 *
 * ## There is no `--inject`, and that is the difference from BPMN
 *
 * A diagram is injected by writing a translated copy of the `.bpmn`. The
 * viewer has no copy to write: `bun run kg:viewer` reads every locale's `.po`
 * and embeds the catalogues in the one page it emits, so **generating the page
 * IS the injection**. A separate `--inject` would produce a second artefact
 * nothing serves.
 *
 * Usage:
 *   bun run translate-kg-viewer --extract [--locale fr]
 *   bun run translate-kg-viewer --check
 *
 * ## What `--check` fails on, and what it only reports
 *
 * It fails on **drift**: a `.pot` that no longer matches the table, a
 * translation that dropped a `{placeholder}` the runtime will substitute into,
 * or an entry for a string the viewer no longer says. Each of those is a
 * defect in a file somebody already wrote.
 *
 * It reports, without failing, on **coverage**: a string with no translation
 * yet. The page falls back to English per string, so a partial catalogue is
 * the ordinary state of a translation in progress rather than a broken build —
 * the same reasoning that keeps `skill-in-role-or-process` off the gate in
 * `kg-audit`.
 *
 * @module scripts/translate-kg-viewer
 * @covers translation-sources
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { formatPot } from "../content/pipeline/pot-extract.js";
import { parsePo, parsePoEntries } from "../content/pipeline/po-inject.js";
import { directoryForGraph } from "../schemas/cat-harness.js";
import {
  STRINGS_SOURCE,
  UI_STRINGS,
  localeName,
  potEntries,
} from "./kg-viewer-strings.js";

const root = resolve(import.meta.dir, "..");

/**
 * The declared `translation-sources` graph — where a translator's `.pot` and
 * `.po` live. Falls back to the convention because extraction CREATES the
 * tree for a locale that has none yet.
 *
 * declared-path-literal: the convention fallback, stated at the call site
 * rather than inside `directoriesForGraph` so the choice is visible.
 */
function translationsRoot(repoRoot: string): string {
  return directoryForGraph(repoRoot, "translation-sources") ?? join(repoRoot, "translations");
}
const argv = process.argv.slice(2);

function flag(name: string): string | undefined {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? undefined : argv[i + 1];
}

const wantExtract = argv.includes("--extract");
const wantCheck = argv.includes("--check");
const locale = flag("locale");

if (!wantExtract && !wantCheck) {
  console.error("Nothing to do. Pass --extract [--locale <code>] or --check.");
  process.exit(2);
}

/** Every `{placeholder}` a string carries, as a sorted list. */
function placeholders(s: string): string[] {
  return [...s.matchAll(/\{([a-zA-Z][\w]*)\}/g)].map((m) => m[1]).sort();
}

/** Locales that already have a translations directory. */
function knownLocales(): string[] {
  const dir = translationsRoot(root);
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

const sourceText = readFileSync(join(root, STRINGS_SOURCE), "utf-8");
const entries = potEntries(sourceText);
const sourceHash = createHash("sha256").update(sourceText).digest("hex").slice(0, 12);

// ── --extract ───────────────────────────────────────────────────

if (wantExtract) {
  const targets = locale ? [locale] : knownLocales();
  if (targets.length === 0) {
    console.error("No locales found under translations/ and none given with --locale.");
    process.exit(2);
  }
  console.log(`Extracting ${entries.length} string(s) from ${STRINGS_SOURCE} for: ${targets.join(", ")}\n`);
  for (const loc of targets) {
    const outDir = join(translationsRoot(root), loc);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(
      join(outDir, "kg-viewer.pot"),
      formatPot(entries, { projectName: "kg-viewer", locale: loc }),
    );

    // A .po that exists gets a manifest refreshed beside it, so the node the
    // content model addresses carries today's coverage and today's source
    // hash rather than the ones it had when somebody last remembered.
    const po = join(outDir, "kg-viewer.po");
    let coverage = "";
    if (existsSync(po)) {
      const parsed = parsePo(readFileSync(po, "utf-8"));
      const translated = UI_STRINGS.filter((s) => (parsed.get(s.en) ?? "") !== "").length;
      writeFileSync(join(outDir, "kg-viewer.ts"), manifest(loc, translated));
      coverage = `  (po: ${translated}/${UI_STRINGS.length}, manifest refreshed)`;
    }
    console.log(`  translations/${loc}/kg-viewer.pot${coverage}`);
  }
  console.log("\nA .pot is a translator's input; nothing is translated until a .po sits beside it.");
}

/**
 * The TranslationNode manifest that makes a `.po` a node rather than a file.
 *
 * **Coverage is read from the `.po`, never asserted.** A stub with every
 * msgid and no msgstr is the ordinary state here, and the node says 0% rather
 * than implying a translation that does not exist — `translation_status`
 * reads this, and a node that flattered itself would flatter every report
 * downstream of it.
 */
function manifest(loc: string, translated: number): string {
  const pct = Math.round((translated / UI_STRINGS.length) * 100);
  const state = translated === 0
    ? "Not yet translated: the .po carries every msgid with an empty msgstr, " +
      "awaiting a translator. The page falls back to the English msgid string " +
      "by string, so nothing renders blank in the meantime."
    : "Unofficial until a person signs it off, which the .po header declares " +
      "and the page itself tells the reader.";
  return `import type { TranslationNode } from "../../schemas/translation";

/**
 * ${localeName(loc)} (${loc}) translation of the knowledge-graph viewer's chrome.
 *
 * Generated by \`bun run translate-kg-viewer --extract\`. The source is the
 * string table in \`${STRINGS_SOURCE}\`, not the page the generator emits —
 * see that module for why a generated artefact is never the translation
 * source.
 *
 * The graph's own content is NOT covered by this node: node names,
 * descriptions and property names come from the corpus and reach the page in
 * whatever language the corpus is written in.
 */
const node: TranslationNode = {
  label: "trans:${loc}/kg-viewer",
  locale: ${JSON.stringify(loc)},
  sourceFile: ${JSON.stringify(STRINGS_SOURCE)},
  sourceHash: ${JSON.stringify(sourceHash)},
  potFile: "translations/${loc}/kg-viewer.pot",
  poFile: "translations/${loc}/kg-viewer.po",
  status: {
    locale: ${JSON.stringify(loc)},
    official: false,
    generator: "folio-assistant translate-kg-viewer",
  },
  coverage: { translated: ${translated}, total: ${UI_STRINGS.length}, pct: ${pct} },
  title: "${localeName(loc)} — knowledge-graph viewer interface",
  description:
    "Interface strings for the knowledge-graph viewer. ${state}",
};
export default node;
`;
}

// ── --check ─────────────────────────────────────────────────────

if (wantCheck) {
  const table = new Map(UI_STRINGS.map((s) => [s.en, s]));
  const failures: string[] = [];
  const notes: string[] = [];
  let seen = 0;

  for (const loc of knownLocales()) {
    const dir = join(translationsRoot(root), loc);
    const po = join(dir, "kg-viewer.po");
    const pot = join(dir, "kg-viewer.pot");
    if (!existsSync(po) && !existsSync(pot)) continue;
    seen++;

    // The POT is derived. If it does not match the table, it was not
    // re-extracted after the table changed, and a translator is working from
    // a document that no longer describes the page.
    if (!existsSync(pot)) {
      failures.push(`${loc}: no kg-viewer.pot — run --extract`);
    } else {
      const potIds = new Set(
        parsePoEntries(readFileSync(pot, "utf-8")).map((e) => e.msgid),
      );
      const missing = [...table.keys()].filter((id) => !potIds.has(id));
      const extra = [...potIds].filter((id) => !table.has(id));
      if (missing.length || extra.length) {
        failures.push(
          `${loc}: kg-viewer.pot is stale — ${missing.length} string(s) missing, ` +
            `${extra.length} no longer said by the page. Run --extract.`,
        );
      }
    }

    if (!existsSync(po)) {
      notes.push(`${loc}: template only, no translations yet`);
      continue;
    }

    const poText = readFileSync(po, "utf-8");
    const parsed = parsePo(poText);
    let translated = 0;
    for (const [id, msgstr] of parsed) {
      const entry = table.get(id);
      if (entry === undefined) {
        failures.push(`${loc}: translates a string the page no longer says — "${id.slice(0, 48)}…"`);
        continue;
      }
      if (msgstr === "") continue;
      translated++;
      const want = placeholders(id).join(",");
      const got = placeholders(msgstr).join(",");
      if (want !== got) {
        failures.push(
          `${loc}: placeholder mismatch — "${id.slice(0, 40)}…" expects {${want || "none"}}, ` +
            `translation has {${got || "none"}}`,
        );
      }
    }
    const pct = Math.round((translated / UI_STRINGS.length) * 100);
    notes.push(`${loc}: ${translated}/${UI_STRINGS.length} (${pct}%) — ${localeName(loc)}`);
  }

  console.log(`${UI_STRINGS.length} string(s) in ${STRINGS_SOURCE} (source hash ${sourceHash})\n`);
  if (seen === 0) {
    console.log("No locale carries a kg-viewer catalogue yet. Nothing to check, and that is not a failure.");
  }
  for (const n of notes) console.log(`  ${n}`);
  if (failures.length > 0) {
    console.error(`\n${failures.length} problem(s):`);
    for (const f of failures) console.error(`  ✗ ${f}`);
    console.error(
      "\nCoverage below 100% is NOT among these — the page falls back to English " +
        "per string and says the translation is partial. These are drift.",
    );
    process.exit(1);
  }
  console.log("\n✓ No drift: every catalogue matches the table, placeholders intact.");
}
