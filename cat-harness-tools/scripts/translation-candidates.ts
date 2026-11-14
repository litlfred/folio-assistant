#!/usr/bin/env bun
/**
 * Collect candidate translations from open, self-hosted engines, and fill each
 * EMPTY `msgstr` with the first good one, `#, fuzzy`.
 *
 * @module scripts/translation-candidates
 * @covers translation-sources
 *
 *   bun run cat translation:candidates --instance <layer root> --engine opus-mt
 *   bun run cat translation:candidates --instance <layer root> \
 *     --engine opus-mt,libretranslate --url http://localhost:5000
 *
 * The owner, 2026-11-14: an open machine-translation step with no freemium
 * API quota, whose output is several CANDIDATES per string for a reviewer to
 * choose among on the translation review page. Each engine is a source
 * (`scripts/lib/translation-sources/`); every candidate goes through the one
 * writer, `addCandidates` (`scripts/lib/translation-candidates.ts`), which
 * appends to `<locale>/<catalogue>.candidates.json`
 * (`translation-candidates/v1`), drops a candidate whose placeholders do not
 * round-trip, fills an empty `msgstr` with the first good candidate as
 * `#, fuzzy`, never overwrites a non-empty one, and records the source on the
 * translation node without ever setting `official`.
 *
 * Engines (`--engine`, comma-separated, tried in that order for the fill):
 *   - `opus-mt`: Helsinki-NLP Marian models (CC-BY 4.0) on this machine,
 *     through `translation/opus_mt_runner.py` (shared with `translate-pot.ts`),
 *     or `--runner "<cmd>"`.
 *   - `libretranslate`: a LibreTranslate you host (`--url`, default
 *     `http://localhost:5000`). The hosted libretranslate.com is refused.
 *
 * Paid services (DeepL, Google Cloud Translation, Azure Translator, Amazon
 * Translate) are not engines here; see `translation-sources/index.ts`.
 *
 * Options: `--locale es,fr` (default every locale directory) · `--only
 * <catalogue>` · `--init` to start a `.po` from each template that has none ·
 * `--no-create-node` to record candidates without filling a catalogue that has
 * no node · `--no-mask` to send placeholders as they are · `--batch <n>` ·
 * `--dry-run`.
 *
 * Exit 0 something was recorded (or would be) · 3 nothing was · 2 could not
 * determine (no declaration, bad options) · 1 an engine failed.
 */
import { spawn } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { instanceDirectories } from "../schemas/kg/cat-harness.js";
import { CANDIDATES_SUFFIX } from "./lib/translation-adjudication.ts";
import { entriesToTranslate, maskPlaceholders, poFromPot, splitWhitespace, unmaskPlaceholders, type Skipped } from "./lib/machine-translation.ts";
import { addCandidates, type AddCandidatesReport, type CandidateInput } from "./lib/translation-candidates.ts";
import { sourceFor, type CandidateSourceAdapter, type CommandRunner } from "./lib/translation-sources/index.ts";

const SOURCE_LOCALE = "en";

/** `translation/opus_mt_runner.py`, shared with `translate-pot.ts`: the default OPUS-MT runner, run isolated (`python3 -I`). */
const BUNDLED_RUNNER = fileURLToPath(new URL("./translation/opus_mt_runner.py", import.meta.url));

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const runCommand: CommandRunner = (argv, stdin) =>
  new Promise((ok, fail) => {
    const p = spawn(argv[0]!, argv.slice(1), { stdio: ["pipe", "pipe", "inherit"] });
    let out = "";
    p.stdout.on("data", (d: Buffer) => (out += d.toString("utf-8")));
    p.on("error", fail);
    p.on("close", (code) => (code === 0 ? ok(out) : fail(new Error(`runner exited ${code}`))));
    p.stdin.end(stdin);
  });

/** Every catalogue under a locale directory (`.po`, and with `init` also a lone `.pot`), without extension. */
function cataloguesIn(localeDir: string, init: boolean): { catalogues: string[]; potOnly: string[] } {
  const catalogues = new Set<string>();
  const potOnly: string[] = [];
  const walk = (d: string) => {
    for (const n of readdirSync(d).sort()) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) walk(p);
      else if (n.endsWith(".po") || n.endsWith(".pot")) {
        const name = relative(localeDir, p).replace(/\.pot?$/, "").split(sep).join("/");
        const hasPo = existsSync(join(localeDir, `${name}.po`));
        const hasPot = existsSync(join(localeDir, `${name}.pot`));
        if (!hasPot) continue; // a hand-authored catalogue (a glossary): no template, not a pair
        if (hasPo || init) catalogues.add(name);
        else if (n.endsWith(".pot")) potOnly.push(name);
      }
    }
  };
  walk(localeDir);
  return { catalogues: [...catalogues].sort(), potOnly };
}

export interface RunOptions {
  root: string;
  /** The `translation-sources` directory, relative to `root`. */
  translations: string;
  sources: CandidateSourceAdapter[];
  locales?: string[];
  only?: string;
  batch?: number;
  init?: boolean;
  createNode?: boolean;
  /** Mask placeholders before translation (default true). */
  mask?: boolean;
  dryRun?: boolean;
  now?: () => Date;
  log?: (s: string) => void;
}

export interface CatalogueReport extends AddCandidatesReport {
  /** Entries not asked for (plural). */
  skipped: Skipped[];
}

/** Ask every source for every wanted entry of every catalogue. Exported for the tests. */
export async function collectCandidates(o: RunOptions): Promise<{ reports: CatalogueReport[]; potOnly: string[] }> {
  const tdir = join(o.root, o.translations);
  const log = o.log ?? (() => {});
  const now = o.now ?? (() => new Date());
  const reports: CatalogueReport[] = [];
  const potOnly: string[] = [];
  const locales = (o.locales ?? readdirSync(tdir).filter((n) => statSync(join(tdir, n)).isDirectory()).sort()).filter((l) => l !== SOURCE_LOCALE);
  for (const locale of locales) {
    const ldir = join(tdir, locale);
    if (!existsSync(ldir)) continue;
    const found = cataloguesIn(ldir, o.init === true);
    potOnly.push(...found.potOnly.map((n) => `${locale}/${n}.pot`));
    for (const catalogue of found.catalogues) {
      if (o.only !== undefined && catalogue !== o.only) continue;
      const poPath = join(ldir, `${catalogue}.po`);
      const po = existsSync(poPath) ? readFileSync(poPath, "utf-8") : poFromPot(readFileSync(join(ldir, `${catalogue}.pot`), "utf-8"), locale);
      const { wanted, skipped } = entriesToTranslate(po);
      const inputs: CandidateInput[] = [];
      for (const source of o.sources) {
        const at = now().toISOString();
        const src = { ...source.source(locale), at };
        const size = Math.max(1, o.batch ?? 16);
        for (let i = 0; i < wanted.length; i += size) {
          const chunk = wanted.slice(i, i + size);
          const masks = chunk.map((w) => {
            const core = splitWhitespace(w.msgid).core;
            return o.mask === false ? { masked: core, tokens: new Map<string, string>() } : maskPlaceholders(core);
          });
          const out = await source.translate(masks.map((m) => m.masked), SOURCE_LOCALE, locale);
          if (out.length !== chunk.length) throw new Error(`${source.id}: ${out.length} strings back for ${chunk.length} sent`);
          chunk.forEach((w, k) => {
            inputs.push({ ...(w.msgctxt !== undefined ? { msgctxt: w.msgctxt } : {}), msgid: w.msgid, text: unmaskPlaceholders(out[k]!, masks[k]!.tokens), source: src });
          });
        }
      }
      const r = addCandidates(inputs, {
        root: o.root,
        translations: o.translations,
        locale,
        catalogue,
        init: o.init === true,
        ...(o.createNode === false ? { createNode: false } : {}),
        ...(o.dryRun ? { dryRun: true } : {}),
        now,
      });
      reports.push({ ...r, skipped });
      if (r.added || r.filled.length) {
        log(`  ${locale}/${catalogue}: ${r.added} candidate(s) → ${catalogue}${CANDIDATES_SUFFIX}, ${r.filled.length} empty msgstr filled (fuzzy)${r.initialised ? ", catalogue started" : ""}${r.nodeCreated ? ", node created" : ""}`);
      }
    }
  }
  return { reports, potOnly };
}

async function main(): Promise<number> {
  const root = resolve(arg("--instance") ?? arg("--root") ?? ".");
  const tdir = instanceDirectories(root).find((d) => (d.graphTypologies ?? []).includes("translation-sources"));
  if (!tdir) {
    console.error(`translation-candidates: ${root} declares no translation-sources directory. This is NOT a pass.`);
    return 2;
  }
  const ids = (arg("--engine") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (ids.length === 0) {
    console.error("translation-candidates: --engine <opus-mt|libretranslate>[,…] is required.");
    return 2;
  }
  let sources: CandidateSourceAdapter[];
  try {
    sources = ids.map((id) =>
      sourceFor(id, {
        runner: arg("--runner")?.split(/\s+/).filter(Boolean) ?? ["python3", "-I", BUNDLED_RUNNER],
        run: runCommand,
        url: arg("--url") ?? "http://localhost:5000",
      }),
    );
  } catch (e) {
    console.error(`translation-candidates: ${(e as Error).message}`);
    return 2;
  }
  const dryRun = process.argv.includes("--dry-run");
  let result: Awaited<ReturnType<typeof collectCandidates>>;
  try {
    result = await collectCandidates({
      root,
      translations: tdir.path.replace(/\/+$/, ""),
      sources,
      ...(arg("--locale") ? { locales: arg("--locale")!.split(",").map((s) => s.trim()).filter(Boolean) } : {}),
      ...(arg("--only") ? { only: arg("--only")! } : {}),
      batch: Number(arg("--batch") ?? 16),
      init: process.argv.includes("--init"),
      createNode: !process.argv.includes("--no-create-node"),
      mask: !process.argv.includes("--no-mask"),
      dryRun,
      log: (s) => console.log(s),
    });
  } catch (e) {
    console.error(`translation-candidates: ${(e as Error).message}`);
    return 1;
  }
  const added = result.reports.reduce((n, r) => n + r.added, 0);
  const filled = result.reports.reduce((n, r) => n + r.filled.length, 0);
  const would = dryRun ? "would be " : "";
  console.log(`\n${added} candidate(s) ${would}recorded; ${filled} empty msgstr ${would}filled as fuzzy.`);
  const notes = result.reports.filter((r) => r.refused || r.noFill);
  if (notes.length) {
    console.log(`\nCatalogues not changed (${notes.length}):`);
    for (const r of notes) console.log(`  ${r.locale}/${r.catalogue}: ${r.refused ?? r.noFill}`);
  }
  const left = result.reports.flatMap((r) => [...r.skipped, ...r.rejected].map((s) => ({ ...s, where: `${r.locale}/${r.catalogue}` })));
  if (left.length) {
    console.log(`\nNot recorded (${left.length}):`);
    for (const s of left) console.log(`  ${s.where} ${s.msgctxt ? `[${s.msgctxt}] ` : ""}${JSON.stringify(s.msgid.slice(0, 80))}: ${s.reason}`);
  }
  if (result.potOnly.length) console.log(`\n${result.potOnly.length} template(s) have no .po beside them (--init starts them).`);
  return added + filled > 0 ? 0 : 3;
}

if (import.meta.main) process.exit(await main());
