#!/usr/bin/env bun
/**
 * The exported graph, once per locale — and the core graph never learns they exist.
 *
 * @module scripts/kg-locale-export
 *
 * Owner, 2026-09-21: *"we should also build the json/jsonld for the rendered
 * result of the translations. no reason that is english only"*. Bean `jmpb`.
 *
 * `kg-export.ts` contained ONE occurrence of the string `locale`. A `.po` was
 * injected into a diagram and an SVG rendered per locale, but the graph a
 * machine consumes was produced once, in the language the assets were authored
 * in — so every translated string this repository holds was invisible to
 * anything reading the data rather than the picture.
 *
 * ## Two rulings, and the second is the one that would have been got wrong
 *
 * **One document per locale.** Not language maps, not `@language` in the
 * published `@context`. Per-locale files are simple to serve and cacheable;
 * language maps are native JSON-LD but would need a binding added to the
 * context, and this repository has already paid for a prefix bound in the
 * context and emitted by nothing (`fd6i`, where `skos:` sat declared and
 * unused while prose claimed the graph spoke eight vocabularies).
 *
 * **THE CORE GRAPH MUST NOT REFERENCE ITS TRANSLATIONS.** The obvious
 * implementation hangs a `hasTranslation` / `availableLocales` / `seeAlso` off
 * each node. Refused: the core would then carry an edge per locale per node,
 * growing with the translation effort, and bootstrap's graph would gain
 * references to artefacts it does not own and cannot validate.
 *
 * So the arrow runs ONE WAY — a per-locale document references the core, never
 * the reverse, and the core is complete with no translation existing. Same
 * relation `board-diagram-interchange` states for a board and its folio. What
 * discovers the translations instead is the filesystem, exactly as the
 * language bar already does. **`localeDocumentsUnreferenced` is what makes
 * that checked rather than intended.**
 *
 * ## A catalogue is scoped to the ASSET it was extracted from
 *
 * The first version read every `.po` under a locale and translated any string
 * the merged map carried. Run against the real corpus it reported *"1
 * applicable msgid, 40 substitutions"* in three locales — and the msgid was
 * **`"yes"` → `"oui"`, from `index.po`, a docs page.** The 40 hits were
 * `name` on BPMN sequence flows: a gateway's `yes`/`no` branch labels.
 *
 * `oui` is the right French for that label, which is exactly why the defect is
 * worth naming: the result LOOKED right. What was wrong is the provenance —
 * a translation authored for a table cell in `docs/index.md` was applied to
 * the knowledge graph, and the report then said diagram translation was under
 * way in three locales while **no diagram catalogue exists in any of them**.
 *
 * So a `.po` is read only when its stem is the stem of an asset this graph
 * PROJECTS — today, a `.bpmn` this instance owns. That is provenance, not a
 * path: hardcoding `workflows/` would break the day the layout moves, and
 * `check:declared-paths` would be right to flag it.
 *
 * Residual and accepted: a msgid from diagram A applies to an identical string
 * on a node from diagram B. That is not a new assumption — `kg-export`
 * already DEDUPES lane-derived `Role` nodes by lane name across every diagram,
 * so one English phrase meaning one thing corpus-wide is the existing model.
 *
 * Identity-bearing keys are excluded on top of that ({@link IDENTITY_KEYS}),
 * because a `@id`, a `notation` or a `sourceKind` colliding with a msgid would
 * be rewritten into something no link resolves to. A blocklist of what must
 * never move, not an allowlist of what may: an allowlist is a second answer to
 * "what did the extractor extract", stale the first time a node kind gains a
 * field.
 *
 * ## Fall-through, and why the language tag is per VALUE
 *
 * `parsePo` takes only non-empty `msgstr` and skips fuzzy entries, *"to avoid
 * injecting uncertain translations"* — so an untranslated string is absent
 * from the map and the source survives. That is already the behaviour
 * everywhere translation happens here, and a second answer in the data would
 * mean a string that falls through in a rendered diagram and vanishes in the
 * graph describing the same diagram.
 *
 * Which is exactly why a blanket `"@language": "fr"` on the document is
 * **wrong**: it would assert French over every string that fell through. A
 * translated value carries `{"@value", "@language"}`; a fall-through stays a
 * plain string under the document's declared source language. Fall-through is
 * then visible IN THE DATA rather than inferable from a coverage number.
 *
 * ## Measured before building, and it changes what gets emitted
 *
 * 2026-09-22: **58 of the 62 `.pot` templates are BPMN diagrams, and none of
 * them has a `.po` in any of the five locales.** The `.po` files that exist
 * are docs pages, and `glossary.po` is not a translation at all — its own
 * header says so; it is terminology input for `translation-block-qa`.
 *
 * So the graph's translatable surface has ZERO translations today, and
 * `cat-harness.jsonld` is 2.0 MB. Emitting five byte-identical copies would
 * publish 10 MB to say nothing — `6tkl`, an artefact whose correctness cannot
 * be told from doing nothing.
 *
 * **A locale is emitted when it has at least one translation that applies to
 * this graph, and every locale is REPORTED either way** — so the zero is loud
 * rather than a missing file, which is the third-state rule. `--all-locales`
 * forces emission for the reading where a consumer would rather have a 0 %
 * document than a 404.
 *
 * Usage:
 *   bun run cat-harness/scripts/kg-locale-export.ts [--instance ROOT] [--out-dir DIR]
 *   bun run cat-harness/scripts/kg-locale-export.ts --check
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";

import { parsePo } from "../content/pipeline/po-inject.js";
import { readHarnessConfig } from "../schemas/harness-config.js";
import { repoRootFor, resolveDirectories } from "../schemas/cat-harness.js";
import { buildExport, exportIdentity } from "./kg-export.js";

const ROOT = resolve(import.meta.dir, "..");

/**
 * Keys whose value is an identity or a machine token, never prose.
 *
 * A BLOCKLIST of the things that must not move, not an allowlist of what may:
 * an allowlist is a second answer to "what does the extractor extract", and it
 * goes stale the first time a node kind gains a field. The catalogue decides
 * what is translatable; this decides what is not eligible whatever the
 * catalogue says.
 *
 * `notation` is here because it is the CODE a concept is cited by (`lqo9`),
 * and `sourceKind` because `bpmn-lane` is a provenance token that happens to
 * read like English.
 */
const IDENTITY_KEYS: ReadonlySet<string> = new Set([
  "@id",
  "@type",
  "@context",
  "notation",
  "source",
  "sourceKind",
  "nodeKind",
  "bpmnType",
  "workPlanOp",
  "layer",
  "$schema",
]);

/**
 * An IRI or a prefixed name is a LINK, whatever key it sits under.
 *
 * Two forms, both of which appear in this graph: `https://…` and `skos:Concept`
 * / `cat:Role`. The whitespace test is what keeps prose out — *"Note: this
 * happens"* has a colon and a space, an IRI never does — so a sentence is
 * never mistaken for a link and left untranslated.
 */
export function isIri(s: string): boolean {
  if (/\s/.test(s)) return false;
  return /^[A-Za-z][A-Za-z0-9+.-]*:/.test(s);
}

/**
 * The instance's declared translations root — ONE answer, shared with
 * `translate-bpmn`.
 *
 * Resolved from the declaration rather than spelled, because two copies of
 * this join is how a check passes over a directory the writer never used.
 */
export function translationsRootFor(instanceRoot: string): string {
  const d = resolveDirectories([{ name: "(local)", root: instanceRoot, own: true }]).find((x) =>
    x.graphKinds.includes("translation-sources"),
  );
  // declared-path-literal: the base case for an instance that declares
  // nothing. Reading a declaration to learn the fallback for having no
  // declaration cannot be done; `DEFAULT_DIRECTORIES` supplies this same
  // convention, and `translate-bpmn.ts` falls back identically.
  return d?.absPath ?? join(instanceRoot, "translations");
}

/** Every locale directory under the instance's translations root. */
export function knownLocales(instanceRoot: string): string[] {
  const dir = translationsRootFor(instanceRoot);
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

/**
 * Stems of the assets this graph PROJECTS — today, the instance's diagrams.
 *
 * A stem rather than a path, because that is the join a `.po` offers: the
 * extractor writes `<stem>.pot` beside the asset's own name.
 */
export function projectedStems(instanceRoot: string): Set<string> {
  const out = new Set<string>();
  const walk = (dir: string): void => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.name.startsWith(".") || e.name === "node_modules") continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".bpmn")) out.add(basename(e.name, ".bpmn"));
    }
  };
  walk(instanceRoot);
  return out;
}

/**
 * The catalogues under one locale that apply to THIS graph, merged.
 *
 * Scoped by provenance — see the header on `"yes"` → `"oui"`. A `.po` whose
 * stem names no asset this graph projects is skipped, however many
 * translations it carries, because it was authored against a different
 * artefact and a coincidental msgid match is not a translation of this one.
 *
 * Recursive, because the diagram catalogues sit one level down while the page
 * catalogues sit at the top, and the stem test — not the depth — is what
 * decides. Later files override earlier for the same msgid, the order
 * `mergePoSources` documents.
 *
 * `.pot` is deliberately NOT read: a template carries empty `msgstr`s by
 * definition, so reading one would add nothing and would make "this locale has
 * catalogues" indistinguishable from "this locale has translations" — the
 * exact distinction the report below exists to make.
 */
export function catalogueFor(instanceRoot: string, locale: string): Map<string, string> {
  const dir = join(translationsRootFor(instanceRoot), locale);
  const stems = projectedStems(instanceRoot);
  const out = new Map<string, string>();
  const walk = (d: string): void => {
    let entries;
    try {
      entries = readdirSync(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".po") && stems.has(basename(e.name, ".po"))) {
        for (const [k, v] of parsePo(readFileSync(p, "utf-8"))) out.set(k, v);
      }
    }
  };
  walk(dir);
  return out;
}

export interface LocaleReport {
  readonly locale: string;
  /** Non-empty `msgstr` entries this locale carries, across every `.po`. */
  readonly catalogue: number;
  /** ...of those, matched against a string in THIS graph. */
  readonly applicable: number;
  /** Values actually rewritten — a msgid may appear on several nodes. */
  readonly substitutions: number;
  /** Written, or reported and skipped for having nothing to say. */
  readonly emitted: boolean;
}

export interface LocaleExport {
  readonly doc: Record<string, unknown>;
  readonly report: LocaleReport;
}

/**
 * Translate one already-built core document.
 *
 * Takes the core rather than building it, so N locales cost ONE export rather
 * than N — and, more importantly, so every locale is provably a projection of
 * the SAME core rather than of N separate builds that could differ.
 */
export function translateDocument(
  core: Record<string, unknown>,
  locale: string,
  catalogue: Map<string, string>,
  sourceLocale: string,
): LocaleExport {
  let substitutions = 0;
  const hit = new Set<string>();

  const walk = (value: unknown, key: string | undefined): unknown => {
    if (typeof value === "string") {
      if (key !== undefined && IDENTITY_KEYS.has(key)) return value;
      if (isIri(value)) return value;
      const t = catalogue.get(value);
      if (t === undefined) return value;
      hit.add(value);
      substitutions += 1;
      // The tag rides the VALUE, never the document: a blanket
      // `"@language": "<locale>"` would assert this language over every string
      // that fell through, and fall-through is the normal case here.
      return { "@value": t, "@language": locale };
    }
    if (Array.isArray(value)) return value.map((v) => walk(v, key));
    if (value !== null && typeof value === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = walk(v, k);
      return out;
    }
    return value;
  };

  // `@context` is walked with its own key so `IDENTITY_KEYS` catches it: a
  // context maps terms to IRIs, and rewriting one would repoint every
  // property in the document.
  const doc = walk(core, undefined) as Record<string, unknown>;
  // The document says what language its UNTAGGED strings are in. That is the
  // source language, not this locale — which is the whole point of tagging
  // per value above.
  (doc as { sourceLanguage?: string }).sourceLanguage = sourceLocale;

  return {
    doc,
    report: {
      locale,
      catalogue: catalogue.size,
      applicable: hit.size,
      substitutions,
      emitted: false,
    },
  };
}

/**
 * Does any node in the CORE document mention a translation?
 *
 * The owner's constraint, checked rather than intended. It looks for the three
 * shapes the ruling names — a translation property on a node, a locale-
 * suffixed `@id`, a locale key in the `@context` — because "we did not add
 * one" is not a property a future change preserves.
 */
export function localeDocumentsUnreferenced(
  core: Record<string, unknown>,
  locales: readonly string[],
): string[] {
  const bad: string[] = [];
  const BANNED_KEYS = new Set(["hasTranslation", "availableLocales", "translationOf", "translations"]);
  const walk = (value: unknown, path: string): void => {
    if (Array.isArray(value)) {
      value.forEach((v, i) => walk(v, `${path}[${i}]`));
      return;
    }
    if (value === null || typeof value !== "object") return;
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (BANNED_KEYS.has(k)) bad.push(`${path}.${k}: the core graph must not reference its translations`);
      if (locales.includes(k)) bad.push(`${path}.${k}: a locale key in the core document`);
      if (k === "@id" && typeof v === "string") {
        for (const l of locales) {
          // `.<locale>.jsonld` and `/<locale>/` are the two spellings a
          // per-locale `@id` would take. Matched on the SUFFIX rather than
          // anywhere in the string, so `bootstrap/ns#Role` is not read as a
          // locale because some locale code appears inside a word.
          if (v.endsWith(`.${l}.jsonld`) || v.includes(`.${l}.jsonld#`)) {
            bad.push(`${v}: a per-locale @id in the core document`);
          }
        }
      }
      walk(v, `${path}.${k}`);
    }
  };
  walk(core, "$");
  return bad;
}

export interface LocaleBuild {
  readonly stub: string;
  readonly sourceLanguage: string;
  readonly locales: LocaleReport[];
  readonly docs: Map<string, Record<string, unknown>>;
  /** Findings from {@link localeDocumentsUnreferenced}. */
  readonly coreProblems: string[];
  /** Node `@id`s that differ between the core and any locale. UNDETERMINED is a finding. */
  readonly idDrift: string[];
}

export async function buildLocaleExports(opts: {
  instanceRoot?: string;
  baseUrl?: string;
  allLocales?: boolean;
} = {}): Promise<LocaleBuild> {
  const instanceRoot = resolve(opts.instanceRoot ?? ROOT);
  const id = exportIdentity({ baseUrl: opts.baseUrl, instanceRoot: opts.instanceRoot });
  const core = (await buildExport({ baseUrl: opts.baseUrl, instanceRoot: opts.instanceRoot })) as unknown as Record<
    string,
    unknown
  >;
  // `config.translation.defaultLocale`, NOT `config.defaultLocale` — `tsc`
  // caught the second spelling, and it would have been the `dh4f` shape: a
  // read of a field that is not there, reporting the fallback as if it had
  // been declared. It happens to be `"en"` in this instance, so nothing here
  // would have looked wrong; a folio declaring another source language would
  // have had every locale document claim English fall-through.
  const sourceLanguage = readHarnessConfig(instanceRoot)?.translation?.defaultLocale ?? "en";

  const locales = knownLocales(instanceRoot);
  const coreProblems = localeDocumentsUnreferenced(core, locales);

  const coreIds = new Set(
    ((core["@graph"] as Record<string, unknown>[] | undefined) ?? []).map((n) => n["@id"] as string),
  );

  const reports: LocaleReport[] = [];
  const docs = new Map<string, Record<string, unknown>>();
  const idDrift: string[] = [];

  for (const locale of locales) {
    const catalogue = catalogueFor(instanceRoot, locale);
    const { doc, report } = translateDocument(core, locale, catalogue, sourceLanguage);
    const emitted = opts.allLocales === true || report.applicable > 0;
    reports.push({ ...report, emitted });
    if (!emitted) continue;
    docs.set(locale, doc);

    // A translation is not a new term, so every `@id` must be the core's.
    // Asserted per locale rather than trusted from the walk, because the walk
    // is the thing that could break it.
    for (const n of (doc["@graph"] as Record<string, unknown>[] | undefined) ?? []) {
      const nid = n["@id"];
      if (typeof nid !== "string" || !coreIds.has(nid)) {
        idDrift.push(`${locale}: ${String(nid)}`);
      }
    }
  }

  return { stub: id.stub, sourceLanguage, locales: reports, docs, coreProblems, idDrift };
}

/** `<stub>.<locale>.jsonld`, beside the core document. */
export function localeDocPath(stub: string, locale: string): string {
  return `${stub}.${locale}.jsonld`;
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const arg = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i !== -1 ? argv[i + 1] : undefined;
  };
  const check = argv.includes("--check");
  const instanceRoot = arg("--instance");
  const baseUrl = arg("--base-url") ?? process.env.KG_BASE_URL;
  const allLocales = argv.includes("--all-locales");
  const outDir = arg("--out-dir") ?? join(repoRootFor(ROOT), "_kg");

  const build = await buildLocaleExports({ instanceRoot, baseUrl, allLocales });

  console.log(`${build.stub} graph per locale — source language ${build.sourceLanguage}`);
  if (build.locales.length === 0) {
    // `6tkl`: a per-locale build over no locales asserts nothing, and
    // reporting it clean would be a pass over an empty set.
    console.error(
      `\nNo locale directories under ${relative(repoRootFor(ROOT), translationsRootFor(resolve(instanceRoot ?? ROOT)))} — refusing to call that clean.`,
    );
    process.exit(2);
  }
  for (const r of build.locales) {
    const note = r.emitted
      ? `${r.substitutions} substitution(s) from ${r.applicable} applicable msgid(s)`
      : r.catalogue === 0
        ? "no translations at all — reported, not emitted"
        : `${r.catalogue} translation(s), NONE applying to this graph — reported, not emitted`;
    console.log(`  ${r.emitted ? "✓" : "·"} ${r.locale.padEnd(4)} ${note}`);
  }

  for (const p of build.coreProblems) console.error(`  CORE REFERENCES A TRANSLATION: ${p}`);
  for (const d of build.idDrift) console.error(`  @id DRIFT: ${d}`);

  const bad = build.coreProblems.length + build.idDrift.length;
  if (check) {
    if (bad === 0) {
      console.log(
        `\ncore graph references no translation; ${build.docs.size} locale document(s) would be written, ` +
          `${build.locales.length - build.docs.size} reported and skipped`,
      );
    }
    process.exit(bad === 0 ? 0 : 1);
  }
  if (bad > 0) process.exit(1);

  mkdirSync(outDir, { recursive: true });
  for (const [locale, doc] of build.docs) {
    const out = join(outDir, localeDocPath(build.stub, locale));
    writeFileSync(out, `${JSON.stringify(doc, null, 2)}\n`);
    console.log(`  → ${relative(repoRootFor(ROOT), out)}`);
  }
  if (build.docs.size === 0) {
    console.log(`\nNothing written: no locale carries a translation applying to this graph.`);
    console.log(`  Pass --all-locales to emit a source-language copy per locale anyway.`);
  }
}
