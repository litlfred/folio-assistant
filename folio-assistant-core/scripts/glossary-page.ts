/**
 * The glossary/ page, and the SKOS JSON-LD behind it.
 *
 * Owner, 2026-09-23: *"it should be part of general pracice w/ glossary/ page.
 * check harnesses"*, and *"put glossary into folio-assistant-core"*. So this is
 * core's, and it reads every instance in the repository rather than one:
 *
 * - every `glossary` directory (core's kind): each `*.glossary.json`, validated
 *   as `folio-glossary/v1`, becomes SKOS JSON-LD at
 *   `docs/assets/glossary/<instance>--<scheme>.skos.jsonld` and rows on the page,
 *   where `<instance>` is the instance that OWNS the scheme's sources
 *   ({@link schemeOwner}), not the one declaring the directory;
 * - every `swimlane-glossary` directory (the harness's ledger): counted and
 *   linked to the page that already renders it, never copied, because a
 *   second rendering of the same terms is a second answer free to drift;
 * - every `remoteGraphs` entry with `graphKinds: ["glossary"]`: an external
 *   SKOS scheme, listed with its link. Referenced, never held;
 * - every KG asset with a title and a description (skills, Tools, BPMN
 *   activities, DMN decisions, documented schema fields), extracted by
 *   `glossary-extract.ts` into one `candidate` scheme per asset type per
 *   instance (bean `lqo9`, piece 1 as posed). Those schemes are GENERATED:
 *   written under core's glossary directory at
 *   `generated/<instance>/<type>.glossary.json`, beside the authored files and
 *   never over them, and the page shows them apart from authored terms.
 *
 * ## Why this, and not a `docs-auto` type
 *
 * The owner framed piece 1 as one `docs-auto` auto-doc-type
 * (`cat-harness/docs-auto/glossary/<path>`), and `gen-docs-auto.ts` has that
 * mechanism. It does not fit what was asked on 2026-09-23 (*"everything
 * extracted to glosasay / skos?"*): a docs-auto type returns `AutoDocItem[]`,
 * one row per artefact FILE for one sub-graph page, and emits no SKOS. The
 * extracted terms are per ELEMENT (one diagram holds dozens of activities),
 * need IRIs in the owning instance's namespace, and must land in the SKOS
 * this page already publishes. `index/skills` and `index/processes` already
 * list the same artefacts per sub-graph, so a docs-auto glossary type over
 * them would be a third rendering. The existing docs-auto `glossary` type
 * stays what it is: the swimlane ledger per sub-graph, linked from here.
 *
 * ## One index, one page per asset type
 *
 * Owner, 2026-09-24: *"Split per asset type"*. Extraction took the one page
 * from 9 KB to 1.4 MB. `glossary/` is now the index (authored terms, counts,
 * sources, and a link to every asset type's page) and `glossary/<type>/`
 * holds that type's extracted candidates from every instance. A term is on
 * exactly one page, and each page has a size budget ({@link PAGE_BUDGET})
 * that it states and `--check` enforces. The SKOS files are unchanged.
 *
 * `--check` writes nothing and fails when a document does not validate, the
 * committed output is stale, or a page is over its budget. That is
 * `check:glossary`, and it is a gate.
 *
 * Search: the page carries a filter box over its own terms, and the site's
 * search indexes the page like any other. A cross-instance search index is
 * bean `4pm8`'s and not built here.
 *
 * Usage:  bun run folio-assistant-core/scripts/glossary-page.ts [--check]
 *
 * @module folio-assistant-core/scripts/glossary-page
 * @covers glossary, swimlane-glossary, docs — it reads every instance's glossary
 *   directory and links the harness's ledger without copying it
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

import {
  instanceDirectoryForGraph,
  instanceRootsIn,
  readDeclaration,
  repoRootFor,
  resolveDirectories,
  forgeLocation,
} from "../../cat-harness/schemas/cat-harness.ts";
import { withInlineCode } from "../../cat-harness/schemas/inline-code.ts";
import { instanceNamespace } from "../../cat-harness/schemas/instance-repositories.ts";
import { GlossarySchema, schemeIri, toSkos, termIri, type AutomatedMatch, type Glossary, type LangText } from "../schemas/glossary.ts";
import { addressBook } from "../../cat-harness/schemas/prov-jsonld.ts";
import { ASSET_TYPES, EXTRACTED_PREFIX, assetTypeTitle, assetTypeWhat, extract, type AssetType } from "./glossary-extract.ts";
import { termState, type SchemeState, type TermStateAnswer } from "../../cat-harness/scripts/check-term-mapping.ts";
import { GLOSSARY_SUBDIR, potPath, sourceText, templateName, translationsDir } from "./glossary-pot.ts";
import { parsePo } from "../../cat-harness/content/pipeline/po-inject.ts";

const CORE = resolve(import.meta.dir, "..");
const REPO = repoRootFor(CORE);
// declared-path-literal: the platform site the page publishes to, which is
// cat-harness's `docs/`; core owns the page, the harness owns the site.
const SITE = join(REPO, "cat-harness", "docs");
const PAGE = join(SITE, "glossary", "index.md");
const ASSETS = join(SITE, "assets", "glossary");
/**
 * Where extracted schemes are written: `generated/` inside core's own
 * `glossary` directory, the convention `schemas/generated/` set. Resolved from
 * the declaration, never spelled as a path.
 */
function generatedDir(): string {
  const dir = instanceDirectoryForGraph(CORE, "glossary");
  if (dir === undefined) throw new Error("folio-assistant-core declares no glossary directory to write extracted schemes into");
  return join(dir, "generated");
}
/** Where a reader follows a `source` to. The forge the repository is published on; the same base `gen-docs-auto.ts` links with. */
const FORGE = "https://github.com/litlfred/folio-assistant";
/** A file's page on the forge — in its submodule's own repository when it sits in one. */
const blobUrl = (path: string): string => {
  const at = forgeLocation(path, FORGE);
  return `${at.repoUrl}/blob/main/${at.path}`;
};

export interface GlossarySource {
  /**
   * The instance that OWNS the scheme: the one whose root holds its source
   * assets, which is not always the one whose `glossary` directory holds the
   * file (owner, 2026-09-24; see {@link schemeOwner}).
   */
  instance: string;
  ns: string;
  file: string;
  glossary: Glossary;
  /** The instance whose declared `glossary` directory holds the file. Absent for an extracted scheme. */
  declaredBy?: string;
  /** Set for a scheme `glossary-extract.ts` generated: which asset type it holds. */
  extracted?: AssetType;
}
export interface Findings {
  invalid: string[];
}

/**
 * The instance's namespace: bean `lqo9` puts a term's IRI there, never in the
 * asset. The rule is `instanceNamespace` (`schemas/instance-repositories.ts`),
 * shared with the `owner/repo → IRI` map so the two cannot disagree (bean `6rmv`).
 */
export function instanceNs(name: string, stub?: string, decl?: { iriBase?: string; version?: string }): string {
  return instanceNamespace({ name, stub, iriBase: decl?.iriBase, version: decl?.version });
}

// ── Who owns a term ─────────────────────────────────────────────
//
// Owner, 2026-09-24: *"make sure all glossary terms properly localed to ihris
// so [no] collision w/ other subgraphs. general rule/skill"*. A scheme and its
// terms live in the namespace of the instance that owns the SOURCE ASSET: in a
// folio with sub-instances that is the sub-instance, never the root, even when
// the `glossary/` directory is declared at the root. `glossary-extract.ts`
// already mints extracted terms that way; this is the same rule for authored
// schemes, checked by `glossary.test.ts` for both.

/**
 * A term or scheme `source` that names a file or directory in the repository,
 * without its anchor. `undefined` for an IRI, and for prose: a scheme's
 * `source` is dcterms:source, which may be a sentence ("Skills of
 * cat-harness"), and a sentence is held by no instance.
 */
export function repoPathOf(src: string | undefined, repo: string = REPO): string | undefined {
  if (!src || /^[a-z][a-z0-9+.-]*:\/\//i.test(src)) return undefined;
  const path = src.split("#", 2)[0]!;
  return path && existsSync(resolve(repo, path)) ? path : undefined;
}

/** Every instance root, longest first, so a path resolves to the MOST specific instance holding it. The repository root's instance comes last. */
export function instanceOwners(repo: string = REPO): Array<{ root: string; name: string; ns: string }> {
  const out: Array<{ root: string; name: string; ns: string }> = [];
  for (const root of instanceRootsIn(repo)) {
    const decl = readDeclaration(root);
    if (decl) out.push({ root: resolve(root), name: decl.name, ns: instanceNs(decl.name, decl.stub, decl) });
  }
  return out.sort((a, b) => b.root.length - a.root.length);
}

/** The instance whose root holds a repository path. */
export function ownerOfPath(repo: string, path: string, owners = instanceOwners(repo)): string | undefined {
  const p = resolve(repo, path);
  return owners.find((o) => p === o.root || p.startsWith(`${o.root}/`) || p.startsWith(`${o.root}\\`))?.name;
}

/**
 * The instance that owns an authored scheme.
 *
 * 1. The scheme's own `source`, when it is a repository path: the instance
 *    that DEFINES the scheme. A code list extended by several packages is the
 *    defining instance's, and each term's `source` still names the package
 *    that contributed it.
 * 2. Otherwise the one instance whose root holds every term's `source`.
 * 3. No repository source at all: the instance whose directory holds the file.
 *
 * Terms sourced in several instances with no defining `source` have no one
 * owner, and that is an error rather than a guess: split the scheme per
 * instance, or name the instance that defines it.
 */
export function schemeOwner(
  repo: string,
  g: Glossary,
  declaredBy: string,
  owners = instanceOwners(repo),
): { owner: string } | { error: string } {
  const defining = repoPathOf(g.source, repo);
  if (defining) {
    const o = ownerOfPath(repo, defining, owners);
    return o ? { owner: o } : { error: `its source ${defining} is in no instance` };
  }
  const held = new Set<string>();
  for (const t of g.terms) {
    const path = repoPathOf(t.source, repo);
    if (!path) continue;
    const o = ownerOfPath(repo, path, owners);
    if (!o) return { error: `term "${t.id}" has source ${path}, which is in no instance` };
    held.add(o);
  }
  if (held.size > 1) {
    return {
      error: `its terms are sourced in ${held.size} instances (${[...held].sort().join(", ")}) and the scheme names no defining source; split it per instance, or set the scheme's source to the instance that defines it`,
    };
  }
  return { owner: [...held][0] ?? declaredBy };
}

/**
 * The terms a schema DEFINES, as an ordered glossary — or `undefined` when it
 * defines none.
 *
 * A schema defines terms when its `$defs` entries carry `uses`: the authored,
 * ordered relation bootstrap's `graph.schema.json` publishes (terms v3, owner
 * 2026-09-29). Read here, from the published schema, rather than copied into
 * a glossary file: one text, one place, and the glossary cannot drift from it.
 *
 * `authored`, not `candidate`, and that is not an extractor promoting its own
 * output: the text is a definition a person wrote and approved in the schema's
 * source, and this only reads it out. The order is kept (`ordered`) because
 * the owner asked for logical rather than alphabetical order — each term is
 * defined only by terms above it.
 */
/**
 * The concepts an instance's declared VOCABULARY already mints, by local name:
 * `Node` → `<ns>Node`. Read from the asset whose `role` is `vocabulary`
 * (bootstrap's `ns.jsonld`), each `@id` expanded through that file's own
 * `@context`. Empty when the instance declares none, or it cannot be read —
 * the glossary then mints its own IRIs, as before.
 */
export function vocabularyConcepts(root: string, decl: { assets?: unknown }): Map<string, string> {
  const out = new Map<string, string>();
  const assets = Array.isArray(decl.assets) ? (decl.assets as Array<{ role?: unknown; src?: unknown }>) : [];
  const vocab = assets.find((a) => a.role === "vocabulary" && typeof a.src === "string");
  if (!vocab) return out;
  let doc: { "@context"?: Record<string, unknown>; "@graph"?: Array<{ "@id"?: unknown }> };
  try {
    doc = JSON.parse(readFileSync(join(root, vocab.src as string), "utf-8"));
  } catch {
    return out;
  }
  const ctx = doc["@context"] ?? {};
  for (const n of doc["@graph"] ?? []) {
    const id = typeof n["@id"] === "string" ? n["@id"] : undefined;
    const m = id ? /^([A-Za-z][\w.-]*):([A-Za-z][\w]*)$/.exec(id) : null;
    const base = m ? ctx[m[1]!] : undefined;
    if (m && typeof base === "string") out.set(m[2]!, `${base}${m[2]}`);
  }
  return out;
}

export function termsOfSchema(
  abs: string,
  rel: string,
  decl: { name: string; title?: string; version?: string },
  concepts: ReadonlyMap<string, string> = new Map(),
): Glossary | undefined {
  let doc: { $id?: string; $defs?: Record<string, { description?: string; uses?: unknown; isDefinedBy?: unknown }> };
  try {
    doc = JSON.parse(readFileSync(abs, "utf-8"));
  } catch {
    return undefined;
  }
  const defs = Object.entries(doc.$defs ?? {});
  if (!defs.some(([, v]) => Array.isArray(v.uses))) return undefined;
  const id = (key: string) => key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  const label = (key: string) => key.replace(/([a-z])([A-Z])/g, "$1 $2");
  const absolute = (iri: unknown): string | undefined => {
    if (typeof iri !== "string") return undefined;
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(iri)) return iri;
    return doc.$id && iri.startsWith("#") ? `${doc.$id}${iri === "#" ? "" : iri}` : undefined;
  };
  return {
    $schema: "folio-glossary/v1",
    id: "terms",
    title: `${decl.title ?? decl.name} terms`,
    description:
      `The terms ${decl.title ?? decl.name} defines, in order: each is defined only by terms above it, and never itself. ` +
      `Read from the schema that defines them, ${rel}, so this glossary cannot say anything that schema does not.`,
    ...(decl.version ? { hasVersion: decl.version } : {}),
    source: rel,
    ordered: true,
    terms: defs.map(([key, v]) => ({
      id: id(key),
      prefLabel: label(key),
      ...(v.description ? { definition: v.description } : {}),
      ...(Array.isArray(v.uses) && v.uses.length ? { requires: (v.uses as string[]).map(id) } : {}),
      ...(absolute(v.isDefinedBy) ? { isDefinedBy: absolute(v.isDefinedBy)! } : {}),
      // The vocabulary's own IRI when it defines this term, so there is one
      // concept per term (owner, 2026-09-30, "one SKOS", option A).
      ...(concepts.has(key.replace(/\s+/g, "")) ? { iri: concepts.get(key.replace(/\s+/g, ""))! } : {}),
      source: `${rel}#/$defs/${key}`,
      status: "authored" as const,
    })),
  };
}

/** Every glossary document, swimlane ledger and external scheme in the repository. */
export function collect(repo: string = REPO): {
  glossaries: GlossarySource[];
  ledgers: { instance: string; path: string; terms: number }[];
  external: { instance: string; id: string; url: string; title?: string }[];
  findings: Findings;
} {
  const glossaries: GlossarySource[] = [];
  const ledgers: { instance: string; path: string; terms: number }[] = [];
  const external: { instance: string; id: string; url: string; title?: string }[] = [];
  const findings: Findings = { invalid: [] };
  const owners = instanceOwners(repo);
  const nsOf = new Map(owners.map((o) => [o.name, o.ns] as const));
  // No two instances may resolve to one namespace: every IRI minted in it
  // would be ambiguous about which sub-graph it belongs to.
  const byNs = new Map<string, string[]>();
  for (const o of owners) byNs.set(o.ns, [...(byNs.get(o.ns) ?? []), o.name]);
  for (const [ns, names] of byNs) {
    if (names.length > 1) findings.invalid.push(`namespace collision: ${names.sort().join(", ")} all resolve to ${ns}`);
  }
  for (const root of instanceRootsIn(repo)) {
    const decl = readDeclaration(root);
    if (!decl) continue;
    const dirs = resolveDirectories([{ name: decl.name, root, own: true }]).filter((d) => d.own);
    for (const d of dirs) {
      if (!existsSync(d.absPath)) continue;
      const kinds = d.graphKinds ?? [];
      if (kinds.includes("glossary")) {
        for (const f of readdirSync(d.absPath).filter((f) => f.endsWith(".glossary.json")).sort()) {
          const p = join(d.absPath, f);
          const rel = relative(repo, p).split("\\").join("/");
          let raw: unknown;
          try {
            raw = JSON.parse(readFileSync(p, "utf-8"));
          } catch (e) {
            findings.invalid.push(`${rel}: not valid JSON (${e instanceof Error ? e.message : String(e)})`);
            continue;
          }
          const r = GlossarySchema.safeParse(raw);
          if (!r.success) {
            findings.invalid.push(`${rel}: ${r.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
            continue;
          }
          if (r.data.id.startsWith(EXTRACTED_PREFIX)) {
            findings.invalid.push(`${rel}: scheme id "${r.data.id}" uses the "${EXTRACTED_PREFIX}" prefix, which is reserved for extracted schemes`);
            continue;
          }
          const own = schemeOwner(repo, r.data, decl.name, owners);
          if ("error" in own) {
            findings.invalid.push(`${rel}: scheme "${r.data.id}" has no one owning instance: ${own.error}`);
            continue;
          }
          glossaries.push({ instance: own.owner, ns: nsOf.get(own.owner)!, file: rel, glossary: r.data, declaredBy: decl.name });
        }
      }
      if (kinds.includes("schemas")) {
        for (const f of readdirSync(d.absPath).filter((f) => f.endsWith(".schema.json")).sort()) {
          const p = join(d.absPath, f);
          const rel = relative(repo, p).split("\\").join("/");
          const g = termsOfSchema(p, rel, decl, vocabularyConcepts(root, decl));
          if (!g) continue;
          const r = GlossarySchema.safeParse(g);
          if (!r.success) {
            findings.invalid.push(`${rel}: its terms do not form a glossary: ${r.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
            continue;
          }
          const owner = ownerOfPath(repo, rel, owners) ?? decl.name;
          glossaries.push({ instance: owner, ns: nsOf.get(owner)!, file: rel, glossary: r.data, declaredBy: decl.name });
        }
      }
      if (kinds.includes("swimlane-glossary")) {
        // The directory's own ledger, and any it HOSTS one level down under a
        // guest's stub (`cat-harness/glossary/bootstrap/` since 2026-09-30,
        // bean `xsqm`). Each file names its `instance`, so a hosted ledger is
        // credited to its subject, not to the directory's declarer.
        const found = [join(d.absPath, "glossary-ledger.json")];
        if (existsSync(d.absPath)) {
          for (const e of readdirSync(d.absPath, { withFileTypes: true })) {
            if (e.isDirectory()) found.push(join(d.absPath, e.name, "glossary-ledger.json"));
          }
        }
        for (const ledger of found.filter((f) => existsSync(f))) {
          const l = JSON.parse(readFileSync(ledger, "utf-8")) as { instance?: string; concepts?: Record<string, unknown> };
          ledgers.push({ instance: l.instance ?? decl.name, path: relative(repo, ledger), terms: Object.keys(l.concepts ?? {}).length });
        }
      }
    }
    for (const g of decl.remoteGraphs ?? []) {
      if (g.graphKinds.includes("glossary")) external.push({ instance: decl.name, id: g.id, url: g.url, title: g.title });
    }
  }
  // Extracted schemes, in the OWNING instance's namespace. Derived here on
  // every run rather than read back from the committed files, so the page,
  // the SKOS and the scheme files are one derivation and `--check` compares
  // all three against it.
  const ex = extract(repo);
  findings.invalid.push(...ex.collisions.map((c) => `extracted IRI collision: ${c}`));
  const gen = relative(repo, generatedDir()).split("\\").join("/");
  for (const s of ex.schemes) {
    glossaries.push({
      instance: s.instance,
      ns: nsOf.get(s.instance) ?? instanceNs(s.instance),
      file: `${gen}/${s.instance}/${s.glossary.id}.glossary.json`,
      glossary: s.glossary,
      extracted: s.type,
    });
  }
  // No two schemes, in any instance, may mint one scheme IRI.
  const bySchemeIri = new Map<string, string[]>();
  for (const s of glossaries) {
    const iri = schemeIri(s.ns, s.glossary);
    bySchemeIri.set(iri, [...(bySchemeIri.get(iri) ?? []), s.file]);
  }
  for (const [iri, files] of bySchemeIri) {
    if (files.length > 1) findings.invalid.push(`scheme IRI collision: ${files.join(", ")} all mint ${iri}`);
  }
  return { glossaries, ledgers, external, findings };
}

// `{` too: the page is Jekyll source, and a `{{` or `{%` in an extracted
// description would be read as Liquid and break the site build.
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/{/g, "&#123;");
const first = (t: LangText): string => (typeof t === "string" ? t : (t.en ?? Object.values(t)[0]!));

/** The asset file a scheme's SKOS is published at, under the site. */
export function skosAsset(s: GlossarySource): string {
  return `assets/glossary/${s.instance}--${s.glossary.id}.skos.jsonld`;
}


/** The generated scheme file an extracted scheme is written to. */
export function extractedFile(s: GlossarySource): string {
  return join(generatedDir(), s.instance, `${s.glossary.id}.glossary.json`);
}

/** Terms by state, for the page's counts. `extracted` is every term of an extracted scheme. */
export function counts(c: ReturnType<typeof collect>): { authored: number; extracted: number; couldNotExtract: number; candidate: number } {
  const all = c.glossaries.flatMap((s) => s.glossary.terms.map((t) => ({ s, t })));
  return {
    authored: all.filter(({ t }) => t.status === "authored").length,
    extracted: all.filter(({ s }) => s.extracted).length,
    candidate: all.filter(({ t }) => t.status === "candidate").length,
    couldNotExtract: all.filter(({ t }) => t.status === "could-not-extract").length,
  };
}

/** A size, rounded so that stating it does not move it. */
function sizeLabel(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

// ── The pages ──────────────────────────────────────────────────
//
// Owner, 2026-09-24: *"Split per asset type"*. Extraction (bean `lqo9`) took
// the page from 9 KB to 1.4 MB in one request. So the index keeps the
// authored terms, the counts and the sources, and every extracted term moves
// to the page of its asset type. A term is on exactly one page: authored on
// the index, extracted on its type's. The SKOS files do not change.

/**
 * An asset type whose page outgrew its budget is split by the FIRST LETTER of
 * each term's label into fixed ranges, one page each.
 *
 * Measured 2026-10-02: `kg-schema-fields` was 1,042,497 bytes against its
 * 1 MiB budget on `main`, and every PR adding schema fields tipped it over.
 * Splitting by instance does not help, because one instance (cat-harness)
 * holds 1,613 of 1,841 terms. The ranges are FIXED rather than balanced, so
 * a term's URL does not move when other terms are added. The type's own URL
 * stays and becomes a landing page linking its parts.
 */
export const LETTER_PARTS: Readonly<Partial<Record<AssetType, readonly string[]>>> = {
  "kg-schema-fields": ["a-e", "f-l", "m-r", "s-z"],
};

/** A label's first letter, upper-case, or `#` for a label that starts with no letter. */
export function letterOf(label: string): string {
  const L = label.normalize("NFD")[0]!.toUpperCase();
  return /[A-Z]/.test(L) ? L : "#";
}

/** The part of a split type a label belongs to. A label with no leading letter goes to the first part. */
export function partOfLabel(type: AssetType, label: string): string {
  const parts = LETTER_PARTS[type]!;
  const L = letterOf(label).toLowerCase();
  return parts.find((r) => L >= r[0]! && L <= r[r.length - 1]!) ?? parts[0]!;
}

/** One part of a split asset type's page: `<type>/<range>`. */
export type PartKey = `${AssetType}/${string}`;
/** Which page a term is on: `index` for an authored scheme's, else its asset type, or a part of it. */
export type PageKey = "index" | AssetType | PartKey;
export function isPart(k: PageKey): k is PartKey {
  return k.includes("/");
}
function splitPart(k: PartKey): [AssetType, string] {
  const i = k.indexOf("/");
  return [k.slice(0, i) as AssetType, k.slice(i + 1)];
}
/** Every page, index first, each split type followed by its parts. A page exists for every asset type even when it holds no term, so the index can link each one. */
export const PAGE_KEYS: readonly PageKey[] = [
  "index",
  ...ASSET_TYPES.flatMap((t): PageKey[] => [t, ...(LETTER_PARTS[t] ?? []).map((r) => `${t}/${r}` as PartKey)]),
];

/**
 * The most a page may weigh before compression, in bytes. A budget, stated on
 * the page and pinned by `glossary.test.ts`: when a page outgrows it, the
 * answer is a finer split, not a larger number.
 */
export const PAGE_BUDGET: Readonly<Record<"index" | "type", number>> = { index: 64 * 1024, type: 1024 * 1024 };
export function budgetOf(k: PageKey): number {
  return k === "index" ? PAGE_BUDGET.index : PAGE_BUDGET.type;
}

/** The URL segment of an asset type's page: its scheme id without the extracted prefix. */
export function typeSlug(t: AssetType): string {
  return t.slice(EXTRACTED_PREFIX.length);
}
export function pageOf(s: GlossarySource): PageKey {
  return s.extracted ?? "index";
}
export function pagePath(k: PageKey): string {
  if (k === "index") return PAGE;
  if (isPart(k)) {
    const [t, r] = splitPart(k);
    return join(dirname(PAGE), typeSlug(t), r, "index.md");
  }
  return join(dirname(PAGE), typeSlug(k), "index.md");
}
export function permalinkOf(k: PageKey): string {
  if (k === "index") return "/glossary/";
  if (isPart(k)) {
    const [t, r] = splitPart(k);
    return `/glossary/${typeSlug(t)}/${r}/`;
  }
  return `/glossary/${typeSlug(k)}/`;
}
export function pageTitle(k: PageKey): string {
  if (k === "index") return "Glossary";
  if (isPart(k)) {
    const [t, r] = splitPart(k);
    return `Glossary: ${assetTypeTitle(t)}, ${r.toUpperCase().replace("-", "–")}`;
  }
  return `Glossary: ${assetTypeTitle(k)}`;
}

type Row = { s: GlossarySource; t: Glossary["terms"][number]; label: string };

/** The terms on one page, sorted by label. */
export function rowsOn(c: ReturnType<typeof collect>, k: PageKey): Row[] {
  if (isPart(k)) {
    const [t, r] = splitPart(k);
    return rowsOn(c, t).filter((row) => partOfLabel(t, row.label) === r);
  }
  return c.glossaries
    .filter((s) => pageOf(s) === k)
    .flatMap((s) => s.glossary.terms.map((t) => ({ s, t, label: first(t.prefLabel) })))
    .sort(
      (a, b) =>
        a.label.localeCompare(b.label, "en", { sensitivity: "base" }) ||
        (a.label < b.label ? -1 : a.label > b.label ? 1 : 0) ||
        `${a.s.instance}/${a.s.glossary.id}/${a.t.id}`.localeCompare(`${b.s.instance}/${b.s.glossary.id}/${b.t.id}`, "en"),
    );
}

const link = (u: string) => `<a href="${esc(u)}">${esc(u.replace(/^https?:\/\//, ""))}</a>`;
const sourceLink = (src: string) => {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(src)) return link(src);
  const path = src.split("#", 2)[0]!;
  return `<a href="${esc(blobUrl(path))}"><code>${esc(src)}</code></a>`;
};
const pageLink = (k: PageKey, text: string) => `<a href="{{ '${permalinkOf(k)}' | relative_url }}">${esc(text)}</a>`;
const skosLink = (s: GlossarySource) => `<a href="{{ '/${skosAsset(s)}' | relative_url }}">SKOS</a>`;

/** A term's anchor on its page, which is also its key for a per-term mapping mark. */
function anchorOf(s: GlossarySource, id: string): string {
  return `${s.instance}--${s.glossary.id}--${id}`;
}

function termEntry({ s, t, label }: Row, marks?: ReadonlyMap<string, string>): string {
  const iri = t.iri ?? termIri(s.ns, s.glossary, t.id);
  const matches = (["exactMatch", "closeMatch", "broadMatch", "narrowMatch"] as const).flatMap((m) =>
    (t[m] ?? []).map((u) => `<li>${m}: ${link(u)}</li>`),
  );
  // Extracted is said in words, not only by colour: a candidate is never
  // presented as a definition (bean `lqo9`).
  const status =
    t.status === "authored"
      ? ""
      : ` <span class="fa-gloss-status">${s.extracted ? `${t.status}, extracted` : t.status}</span>`;
  // The code is shown when it tells the reader something the label and the
  // source anchor do not; a skill's code IS its label, and a diagram
  // element's code is the anchor already on the source.
  const frag = t.source?.split("#", 2)[1];
  const code = t.notation && t.notation !== label && t.notation !== frag ? ` <code>${esc(t.notation)}</code>` : "";
  const definition = t.definition
    ? `<p>${linkTermCodes(s, t.id, withInlineCode(first(t.definition), esc))}</p>`
    : t.reason
      ? `<p>${linkTermCodes(s, t.id, withInlineCode(t.reason, esc))}</p>`
      : s.extracted
        ? `<p><em>The asset carries no description.</em></p>`
        : `<p><em>No definition yet.</em></p>`;
  // The filter reads the visible text; this attribute carries only what is
  // searchable and NOT shown (alternative labels, a code the row hides), so
  // a page of a thousand terms does not say every label twice.
  const hidden = [...(t.altLabel ?? []), ...(t.notation && !code && t.notation !== label && t.notation !== frag ? [t.notation] : [])]
    .join(" ")
    .toLowerCase();
  // An extracted term's IRI is in its scheme's SKOS and not repeated here:
  // it was the largest single cost per row, and the row's own anchor is the
  // link a reader shares. An authored term shows it, because that is the IRI
  // somebody will cite.
  const meta = s.extracted
    ? `${esc(assetTypeTitle(s.extracted))} of ${esc(s.instance)}`
    : `${esc(s.glossary.title)} · <code>${esc(iri)}</code>`;
  return [
    `<dt id="${esc(`${s.instance}--${s.glossary.id}--${t.id}`)}" data-fa-state="${s.extracted ? "extracted" : t.status}" data-fa-gloss="${esc(hidden)}">`,
    `${withInlineCode(label, esc)}${code}${status}`,
    `</dt>`,
    `<dd>`,
    definition,
    ...(t.requires?.length
      ? [
          `<p class="fa-gloss-uses">Uses: ${t.requires
            .map((r) => `<a href="#${esc(`${s.instance}--${s.glossary.id}--${r}`)}">${esc(labelOf(s, r))}</a>`)
            .join(", ")}</p>`,
        ]
      : []),
    `<p class="fa-gloss-meta">${meta}${t.isDefinedBy ? ` · defined by ${link(t.isDefinedBy)}` : ""}${t.source ? ` · source ${sourceLink(t.source)}` : ""}</p>`,
    ...(matches.length ? [`<ul class="fa-gloss-matches">${matches.join("")}</ul>`] : []),
    ...(marks?.has(anchorOf(s, t.id)) ? [marks.get(anchorOf(s, t.id))!] : []),
    `</dd>`,
  ].join("\n");
}

/**
 * What `check:term-mapping` found, read from the harness instance that wrote it.
 *
 * Bean `7wou`. The page SHOWS the three states; it does not compute them —
 * a second implementation of "is this term already somebody's concept" would
 * be free to disagree with the gate's, and the reader would have no way to
 * tell which was right.
 *
 * The path is resolved through `instanceOwners`, not written down: the file
 * belongs to the instance DECLARED as `cat-harness`, and hardcoding
 * `cat-harness/test/results/` is how a consumer stops finding it the moment
 * the layout moves. Core may read it — core declares `needs: ["cat-harness"]`,
 * so this is the permitted direction.
 *
 * **Absent returns `undefined`, and the page then says the check has not
 * run.** Rendering "0 mapped" over a file nobody wrote would be `dh4f`
 * exactly: could-not-determine presented as a determined empty.
 */
export function mappingStates(repo: string = REPO): SchemeState[] | undefined {
  const harness = instanceOwners(repo).find((o) => o.name === "cat-harness");
  if (!harness) return undefined;
  const file = join(harness.root, "test", "results", "term-mapping.qa-results.json");
  if (!existsSync(file)) return undefined;
  try {
    const d = JSON.parse(readFileSync(file, "utf-8")) as {
      families?: Record<string, { entries?: SchemeState[] }>;
    };
    const rows = Object.values(d.families ?? {}).flatMap((f) => f.entries ?? []);
    return rows.length ? rows : undefined;
  } catch {
    // A result that will not parse is `check:term-mapping`'s finding, not
    // this page's. Saying it twice would make one defect look like two.
    return undefined;
  }
}

/**
 * `\`x\`` in prose written for a terminal, rendered as `<code>` in HTML.
 *
 * The reason strings come from `check-term-mapping`, which writes for a
 * console. Dropped into a raw `<td>`, kramdown leaves markdown alone inside
 * block HTML, so the backticks would appear literally on the page — bean
 * `mylx`, "raw markdown backticks show in rendered text", already open
 * against six pages. Escaped FIRST, so the conversion cannot smuggle markup
 * in from a reason string.
 */
export function codeSpans(text: string): string {
  return esc(text).replace(/`([^`]+)`/g, "<code>$1</code>");
}

/**
 * The mapping block for one scheme, or for every scheme on the index.
 *
 * Says all three states with their counts, and the REASON whenever a target
 * is undetermined — that reason is the whole difference between "checked,
 * no match" and "nobody asked", and it is stated once per target rather than
 * repeated on 2 605 identical rows.
 */
export function mappingBlock(states: SchemeState[] | undefined, schemes: readonly string[]): string {
  if (!states) {
    return [
      `<p class="fa-gloss-mapping fa-gloss-mapping--unrun">`,
      `<strong>Not checked.</strong> No <code>term-mapping</code> result is committed, so whether `,
      `these terms already exist in an authoritative vocabulary is <em>unknown</em> — which is not `,
      `the same as “none do”. Run <code>bun run term:mapping</code>.`,
      `</p>`,
    ].join("");
  }
  const mine = states.filter((s) => schemes.includes(s.scheme));
  if (!mine.length) return "";
  const byTarget = new Map<string, SchemeState[]>();
  for (const s of mine) byTarget.set(s.target, [...(byTarget.get(s.target) ?? []), s]);
  const rows = [...byTarget.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([target, list]) => {
      const sum = (k: "mapped" | "unmapped" | "undetermined") =>
        list.reduce((n, s) => n + s[k], 0);
      const reason = list.find((s) => s.reason)?.reason;
      return [
        `<tr>`,
        `<td><code>${esc(target)}</code></td>`,
        `<td>${sum("mapped")}</td>`,
        `<td>${sum("unmapped")}</td>`,
        `<td>${sum("undetermined")}</td>`,
        `<td>${reason ? codeSpans(reason) : "—"}</td>`,
        `</tr>`,
      ].join("");
    });
  return [
    `<table class="fa-gloss-mapping">`,
    `<caption>Already somebody else's concept? — <code>check:term-mapping</code>, bean <code>7wou</code></caption>`,
    `<thead><tr><th>target</th><th>mapped</th><th>unmapped</th><th>undetermined</th><th>why undetermined</th></tr></thead>`,
    `<tbody>${rows.join("")}</tbody>`,
    `</table>`,
    `<p class="fa-gloss-mapping-note"><strong>Undetermined is never “no match”.</strong> `,
    `A vocabulary that could not be reached has said nothing, and the column above keeps that `,
    `apart from a checked miss. The counts are reported and not graded: an unmapped candidate may `,
    `be a term this corpus is right to coin.</p>`,
  ].join("\n");
}

/** A term on a page, as the per-term mapping marks need it. */
export interface TermKey {
  /** The entry's anchor, which keys its mark. */
  anchor: string;
  scheme: string;
  term: string;
}

/** One target's part of a term's mark. Never a grade: a state, and what it matched. */
function markPart(target: string, a: TermStateAnswer): string {
  const t = `<code>${esc(target)}</code>`;
  switch (a.state) {
    case "mapped": {
      const to = a.concepts.length ? `, to ${a.concepts.map((u) => `<code>${esc(u)}</code>`).join(", ")}` : "";
      return a.exact
        ? `${t} mapped, exact${to}`
        : `${t} mapped by concept only (the same concept under a label that is not its authorised one)${to}`;
    }
    case "unmapped":
      return `${t} unmapped`;
    case "undetermined":
      return `${t} undetermined (the reason is in the table above)`;
    case "unknown":
      return `${t} cannot be told from the committed result: ${codeSpans(a.why)}`;
  }
}

/**
 * Each term's mapping state on a page: a stated default per target, and a
 * mark on every term that differs from it.
 *
 * Bean `5yhm`, Done-when "the glossary page reports mapped / unmapped /
 * undetermined per term, and grades none of them". A mark on EVERY entry
 * does not fit: the schema-fields page was 1,019,726 bytes against its
 * 1 MiB budget when this was written, about 15 bytes of room per term, and
 * the generator refuses to raise a budget. So the page says once what holds
 * for every unmarked term, and marks only the terms for which it does not
 * hold. That still states every term's state, which is what the bean asks.
 *
 * A default is stated ONLY when every term not mapped on that target is in
 * one state, and only when that state is `unmapped` or `undetermined`. With
 * no such state, every entry carries its own mark for that target. `unknown`
 * is never a default, because a default for "the record cannot say" would
 * read as a finding.
 *
 * Absent states (no committed result) give no note and no marks. The mapping
 * table already says "Not checked", and marking terms against a result
 * nobody wrote would be `dh4f`.
 */
export function perTermMapping(
  states: readonly SchemeState[] | undefined,
  terms: readonly TermKey[],
): { note: string; marks: Map<string, string> } {
  const marks = new Map<string, string>();
  if (!states || !terms.length) return { note: "", marks };
  const targets = [...new Set(states.map((s) => s.target))].sort();
  const parts = new Map<string, string[]>();
  const said: string[] = [];
  const seen = new Set<string>();
  const shared = new Set<string>();
  for (const k of terms) {
    const key = `${k.scheme}\0${k.term}`;
    if (seen.has(key)) shared.add(key);
    seen.add(key);
  }
  for (const target of targets) {
    // The record keys a term by (scheme, id) and not by instance, because a
    // scheme id such as `kg-tools` is shared by every instance's extraction.
    // Ids do not collide today (0 of 2876 checked when this was written), but
    // if two entries on one page ever share a key, the record cannot say
    // which of them it meant, so both are `unknown` rather than both badged.
    const answers = terms.map((k): TermStateAnswer =>
      shared.has(`${k.scheme}\0${k.term}`)
        ? { state: "unknown", why: `two entries share the id \`${k.term}\` in scheme \`${k.scheme}\`` }
        : termState(states, k.scheme, target, k.term),
    );
    const rest = new Set(answers.filter((a) => a.state !== "mapped").map((a) => a.state));
    const only = rest.size === 1 ? [...rest][0] : undefined;
    const dflt = only === "unmapped" || only === "undetermined" ? only : undefined;
    said.push(
      dflt
        ? `<strong>${dflt}</strong> on <code>${esc(target)}</code>`
        : rest.size
          ? `in no single state on <code>${esc(target)}</code>, so each entry states its own`
          : `<strong>mapped</strong> on <code>${esc(target)}</code>, and each entry says to what`,
    );
    answers.forEach((a, i) => {
      if (a.state === dflt) return;
      const key = terms[i]!.anchor;
      parts.set(key, [...(parts.get(key) ?? []), markPart(target, a)]);
    });
  }
  for (const [key, p] of parts) marks.set(key, `<p class="fa-gloss-mapstate">Mapping: ${p.join(" · ")}</p>`);
  const n = marks.size;
  const note = [
    `<p class="fa-gloss-mapping-perterm"><strong>Per term.</strong> `,
    `Every term on this page is ${said.join(", and ")}, unless its entry says otherwise. `,
    `${n === 0 ? "No entry says otherwise." : n === 1 ? "1 entry says otherwise." : `${n} entries say otherwise.`}`,
    `</p>`,
  ].join("");
  return { note, marks };
}

/** The actor that runs `check:term-mapping`: kind `system`, "exercises no judgement". */
export const MATCHING_AGENT = "ci-pipeline";

/** `scheme\0term`, the key the mapping record uses. */
const recordKey = (scheme: string, term: string) => `${scheme}\0${term}`;
/** `instance\0scheme`, the key one SKOS document is written under. */
export const sourceKey = (s: Pick<GlossarySource, "instance" | "glossary">) => `${s.instance}\0${s.glossary.id}`;

/**
 * Every mapped candidate's automated matches, resolved to absolute IRIs and
 * grouped by the SKOS document they go into. Owner ruling 2026-10-02.
 *
 * The record names a concept by its external URI where it has one, and
 * otherwise as `<scheme>:<id>`. That second form is not an IRI: `platform:`
 * would expand as a URI scheme nobody owns. So it is resolved to the authored
 * term's own IRI. If the scheme id is held by more than one instance (today
 * `platform` is held by two), the value is left OUT and reported. The
 * `linked-data` voice's rule is that an invented address is worse than none
 * (`ld-link-is-the-node-release-address`).
 *
 * The same holds for the candidate itself. The record keys it by
 * (scheme, id) and not by instance, so a key held by two extracted schemes
 * cannot be placed. It is reported, never published into both.
 *
 * `exactMatch` goes only to the record's `exactConcepts`. Every other
 * matched concept is `closeMatch`.
 */
export function automatedMatches(
  states: readonly SchemeState[] | undefined,
  glossaries: readonly GlossarySource[],
): { bySource: Map<string, AutomatedMatch[]>; unresolved: string[] } {
  const bySource = new Map<string, AutomatedMatch[]>();
  const unresolved: string[] = [];
  if (!states) return { bySource, unresolved };

  const candidatesAt = new Map<string, GlossarySource[]>();
  const authoredIri = new Map<string, string[]>();
  for (const s of glossaries) {
    for (const t of s.glossary.terms) {
      if (t.status === "authored") {
        const k = `${s.glossary.id}:${t.id}`;
        authoredIri.set(k, [...(authoredIri.get(k) ?? []), t.iri ?? termIri(s.ns, s.glossary, t.id)]);
      } else {
        const k = recordKey(s.glossary.id, t.id);
        candidatesAt.set(k, [...(candidatesAt.get(k) ?? []), s]);
      }
    }
  }
  const absolute = (u: string) => /^[a-z][a-z0-9+.-]*:\/\//i.test(u);
  const resolveConcept = (u: string, where: string): string | undefined => {
    if (absolute(u)) return u;
    const hits = [...new Set(authoredIri.get(u) ?? [])];
    if (hits.length === 1) return hits[0];
    unresolved.push(
      `${where}: concept \`${u}\` ${hits.length ? `names ${hits.length} authored terms` : "names no authored term"}, so it has no single IRI`,
    );
    return undefined;
  };

  // Merged across targets: one candidate may match on `skos` and on `fhir`.
  const merged = new Map<string, { source: GlossarySource; m: AutomatedMatch }>();
  for (const row of states) {
    for (const mt of row.mappedTerms) {
      const where = `\`${row.scheme}\`/\`${mt.term}\` on \`${row.target}\``;
      const sources = candidatesAt.get(recordKey(row.scheme, mt.term)) ?? [];
      if (sources.length !== 1) {
        unresolved.push(`${where}: ${sources.length} candidate entries carry this key, so the record cannot place it`);
        continue;
      }
      const source = sources[0]!;
      const exactSet = new Set(mt.exactConcepts ?? []);
      const k = `${sourceKey(source)}\0${mt.term}`;
      const entry = merged.get(k) ?? { source, m: { term: mt.term, exactMatch: [], closeMatch: [] } };
      for (const u of mt.concepts) {
        const iri = resolveConcept(u, where);
        if (iri) (exactSet.has(u) ? entry.m.exactMatch : entry.m.closeMatch).push(iri);
      }
      merged.set(k, entry);
    }
  }
  for (const { source, m } of merged.values()) {
    if (!m.exactMatch.length && !m.closeMatch.length) continue;
    bySource.set(sourceKey(source), [...(bySource.get(sourceKey(source)) ?? []), m]);
  }
  return { bySource, unresolved };
}

/**
 * The matching agent's release address, or `undefined` when it has none.
 * Asked only when there is something to publish, because the address book
 * walks every diagram in the checkout.
 */
export function matchingAgentIri(repo: string = REPO): string | undefined {
  const a = addressBook(repo).resolve("agent", MATCHING_AGENT);
  return "iri" in a ? a.iri : undefined;
}

/**
 * A description's inline code that names ANOTHER term of the same scheme
 * becomes a link to that term's entry (bean `qgjh`). Role descriptions say
 * "Inherits `reviewer`" — the reviewer is on the page, with an anchor, and the
 * relation the sentence states could not be followed.
 *
 * Exact id only, and the same scheme only: the anchor is
 * `instance--scheme--id`, so a word that merely looks like a term in another
 * scheme (`adjudication` is a PERMISSION, not a role) has no anchor it could
 * honestly point at, and stays code. A term never links to itself.
 */
export function linkTermCodes(s: GlossarySource, self: string, html: string): string {
  const ids = new Set(s.glossary.terms.map((x) => x.id));
  return html.replace(/<code>([^<]+)<\/code>/g, (whole, text: string) => {
    const id = text.replace(/&amp;/g, "&");
    if (id === self || !ids.has(id)) return whole;
    const anchor = esc(`${s.instance}--${s.glossary.id}--${id}`);
    // On a split type the target may be on another part, so the link names
    // its page; on any other page it stays a same-page anchor.
    if (s.extracted && LETTER_PARTS[s.extracted]) {
      const page = permalinkOf(`${s.extracted}/${partOfLabel(s.extracted, labelOf(s, id))}`);
      return `<a href="{{ '${page}' | relative_url }}#${anchor}">${whole}</a>`;
    }
    return `<a href="#${anchor}">${whole}</a>`;
  });
}

/** A term's label, by its local id within its scheme. */
function labelOf(s: GlossarySource, id: string): string {
  const t = s.glossary.terms.find((x) => x.id === id);
  return t ? first(t.prefLabel) : id;
}

/**
 * An ORDERED scheme, in its own order: a numbered list where the reader meets
 * each term after the terms its definition uses (owner, 2026-09-29: "logical
 * rather than alphabetical order"). Its terms are not repeated under the A–Z
 * bar — a term is on the page once.
 */
function orderedBlock(s: GlossarySource): string {
  const rows: Row[] = s.glossary.terms.map((t) => ({ s, t, label: first(t.prefLabel) }));
  return `### ${esc(s.glossary.title)}

${esc(s.glossary.description ?? "")} ${skosLink(s)}.

<dl class="fa-gloss fa-gloss-ordered">
${rows.map((r, i) => termEntry(r).replace(/^(<dt [^>]*>\n)/, `$1<span class="fa-gloss-n">${i + 1}.</span> `)).join("\n")}
</dl>`;
}

/** The filter box, the A–Z bar and the terms under their letters: the same on every page. */
function termsBlock(rows: Row[], marks?: ReadonlyMap<string, string>): string {
  // A label that does not start with a letter (a digit, a quote) goes under
  // one heading of its own rather than inventing a letter for it (`letterOf`).
  const byLetter = new Map<string, Row[]>();
  for (const r of rows) {
    const L = letterOf(r.label);
    byLetter.set(L, [...(byLetter.get(L) ?? []), r]);
  }
  const letters = [...byLetter.keys()].sort((a, b) => (a === "#" ? -1 : b === "#" ? 1 : a.localeCompare(b, "en")));
  const anchor = (L: string) => (L === "#" ? "letter-0-9" : `letter-${L}`);
  const shown = (L: string) => (L === "#" ? "0–9" : L);
  if (!rows.length) return "<p>No terms on this page.</p>";
  return `<label for="fa-gloss-q">Filter terms</label>
<input id="fa-gloss-q" type="search" autocomplete="off" style="min-height:44px;width:100%;max-width:32rem">
<p aria-live="polite"><span id="fa-gloss-n">${rows.length}</span> shown</p>

<nav aria-label="Letters">${letters.map((L) => `<a href="#${anchor(L)}">${shown(L)}</a>`).join(" ")}</nav>

${letters
  .map((L) => `<h2 id="${anchor(L)}">${shown(L)}</h2>\n<dl class="fa-gloss">\n${byLetter.get(L)!.map((r) => termEntry(r, marks)).join("\n")}\n</dl>`)
  .join("\n\n")}`;
}

const FILTER_SCRIPT = `<script>
(function(){var q=document.getElementById("fa-gloss-q"),n=document.getElementById("fa-gloss-n");if(!q)return;
function run(){var v=q.value.trim().toLowerCase(),k=0;
document.querySelectorAll("dt[data-fa-gloss]").forEach(function(dt){var dd=dt.nextElementSibling;
var ok=!v||(dt.textContent+" "+dt.getAttribute("data-fa-gloss")+" "+(dd?dd.textContent:"")).toLowerCase().indexOf(v)>=0;
dt.hidden=!ok;if(dd)dd.hidden=!ok;if(ok)k++;});n.textContent=k;}
q.addEventListener("input",run);})();
</script>`;

/**
 * The writer, named once, for every file this generator owns.
 *
 * It is emitted in THREE forms because three readers ask the question three
 * ways, and none of them reads the other two: {@link GENERATED} is the HTML
 * comment a person sees in the page source, {@link GENERATED_FM} is the
 * `generated:` front-matter key `check:reference-direction` reads, and
 * `_generated` in {@link outputs} is the JSON form of the same fact. The
 * comment was the only one until bean `ws99`, and it sits BELOW the front
 * matter — correct information in the one place the checker cannot read, so
 * every page and every JSON file this writes was being graded as authored
 * prose. No count here on purpose: {@link outputs} is what says how many
 * there are, and a number restated in a comment is a claim that goes stale
 * the next time a scheme is added.
 */
const GENERATED_BY = "folio-assistant-core/scripts/glossary-page.ts";

const GENERATED = `<!-- Generated by ${GENERATED_BY}. Do not hand-edit: \`check:glossary\` fails on the difference. -->`;

/** The same fact as a front-matter key, in the form the docs mirrors already use. */
const GENERATED_FM = `generated: ${GENERATED_BY} — do not hand-edit; run \`bun run glossary:page\``;

/** The same fact for a JSON file, as a top-level `_generated`. */
const GENERATED_JSON = `${GENERATED_BY} — do not hand-edit; run \`bun run glossary:page\``;

/**
 * Render with the page's own size in it. Two passes: the page states its own
 * size, so it is rendered once to measure and once to say so. The size is
 * rounded, which the few bytes of the statement itself cannot move.
 */
function sized(render: (size: string) => string): string {
  return render(sizeLabel(Buffer.byteLength(render("…"), "utf-8")));
}

/**
 * A split asset type's own URL: what the type is, where it comes from, and a
 * link to each part with its term count. It holds no terms itself.
 */
export function renderLandingPage(c: ReturnType<typeof collect>, type: AssetType): string {
  const parts = LETTER_PARTS[type]!;
  const schemes = c.glossaries.filter((s) => s.extracted === type);
  const from = schemes.length
    ? schemes.map((s) => `${esc(s.instance)} ${s.glossary.terms.length} (${skosLink(s)})`).join(" · ")
    : "no instance";
  const total = rowsOn(c, type).length;
  const items = parts.map((r) => {
    const k = `${type}/${r}` as PartKey;
    return `<li>${pageLink(k, r.toUpperCase().replace("-", "–"))}: ${rowsOn(c, k).length} terms</li>`;
  });
  return `---
layout: default
${GENERATED_FM}
title: "${pageTitle(type)}"
parent: Glossary
has_children: true
nav_order: ${ASSET_TYPES.indexOf(type) + 1}
permalink: ${permalinkOf(type)}
---
${GENERATED}

# ${pageTitle(type)}

Candidate terms extracted from ${assetTypeWhat(type)}. Each is the asset's own text, verbatim and not curated, and carries the badge "candidate, extracted". A person promotes one by authoring it. Authored terms, the counts and the sources are on the ${pageLink("index", "glossary index")}.

From: ${from}.

**Split by first letter.** ${total} terms are too many for one page within its budget of ${sizeLabel(PAGE_BUDGET.type)}, so they are on ${parts.length} pages by the first letter of the label. The ranges are fixed, so a term's address does not move as terms are added. A label that does not start with a letter is on the first page.

<ul>
${items.join("\n")}
</ul>
`;
}

/** One asset type's page, or one part of a split type: its extracted terms, from every instance. */
export function renderTypePage(c: ReturnType<typeof collect>, key: AssetType | PartKey): string {
  if (!isPart(key) && LETTER_PARTS[key]) return renderLandingPage(c, key);
  const type = isPart(key) ? splitPart(key)[0] : key;
  const rows = rowsOn(c, key);
  const schemes = c.glossaries.filter((s) => s.extracted === type);
  const from = schemes.length
    ? schemes.map((s) => `${esc(s.instance)} ${s.glossary.terms.length} (${skosLink(s)})`).join(" · ")
    : "no instance";
  const states = mappingStates();
  const perTerm = perTermMapping(
    states,
    rows.map((r) => ({ anchor: anchorOf(r.s, r.t.id), scheme: r.s.glossary.id, term: r.t.id })),
  );
  return sized(
    (size) => `---
layout: default
${GENERATED_FM}
title: "${pageTitle(key)}"
${isPart(key) ? `parent: "${pageTitle(type)}"\ngrand_parent: Glossary\nnav_order: ${LETTER_PARTS[type]!.indexOf(splitPart(key)[1]) + 1}` : `parent: Glossary\nnav_order: ${ASSET_TYPES.indexOf(type) + 1}`}
permalink: ${permalinkOf(key)}
---
${GENERATED}

# ${pageTitle(key)}

Candidate terms extracted from ${assetTypeWhat(type)}. Each is the asset's own text, verbatim and not curated, and carries the badge "candidate, extracted". A person promotes one by authoring it. Authored terms, the counts and the sources are on the ${pageLink("index", "glossary index")}.

From: ${from}.

${isPart(key) ? `One of ${LETTER_PARTS[type]!.length} pages of this type, split by the first letter of the label: ${pageLink(type, "all parts")}.\n\n` : ""}**Size:** this page holds ${rows.length} terms and is ${size} before compression, fetched in one request, within its budget of ${sizeLabel(budgetOf(key))}. There is no search index: the filter below runs over this page, and the A–Z bar jumps within it.

${mappingBlock(states, [...new Set(rows.map((r) => r.s.glossary.id))])}
${perTerm.note}

${termsBlock(rows, perTerm.marks)}

${FILTER_SCRIPT}
`,
  );
}

/** The index: authored terms, the counts, the sources, and a link to every asset type's page. */
export function renderIndex(c: ReturnType<typeof collect>, typePages: ReadonlyMap<AssetType | PartKey, string> = typePagesOf(c)): string {
  const typeBytes = (t: AssetType) =>
    [t, ...(LETTER_PARTS[t] ?? []).map((r) => `${t}/${r}` as PartKey)].reduce((n, k) => n + Buffer.byteLength(typePages.get(k) ?? "", "utf-8"), 0);
  const rows = rowsOn(c, "index");
  // Ordered schemes are shown in their own order, ahead of the A–Z list.
  const ordered = c.glossaries.filter((s) => pageOf(s) === "index" && s.glossary.ordered);
  // schema.org's DefinedTermSet carries the AUTHORED terms only. It is what a
  // search engine reads as "this site defines X", and an extracted candidate
  // is not a definition anybody curated. Every term, candidates included, is
  // in the SKOS files, whose `skos:note` says which is which.
  const ld = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name: "Glossary",
    hasDefinedTerm: rows
      .filter(({ t }) => t.status === "authored")
      .map(({ s, t, label }) => ({
        "@type": "DefinedTerm",
        "@id": t.iri ?? termIri(s.ns, s.glossary, t.id),
        name: label,
        ...(t.definition ? { description: first(t.definition) } : {}),
        ...(t.notation ? { termCode: t.notation } : {}),
      })),
  };
  const n = counts(c);
  const total = c.glossaries.reduce((k, s) => k + s.glossary.terms.length, 0);
  const authoredSchemes = c.glossaries.filter((s) => !s.extracted);
  const extractedSchemes = c.glossaries.filter((s) => s.extracted);
  const typeTotal = (type: AssetType) => extractedSchemes.filter((s) => s.extracted === type).reduce((k, s) => k + s.glossary.terms.length, 0);
  const pagesTable = (indexSize: string) =>
    [
      `<div style="overflow-x:auto"><table>`,
      `<thead><tr><th>page</th><th>holds</th><th>terms</th><th>size</th></tr></thead>`,
      `<tbody>`,
      `<tr><td>this page</td><td>authored terms, counts and sources</td><td>${rows.length}</td><td>${indexSize}</td></tr>`,
      ...ASSET_TYPES.map(
        (t) =>
          `<tr><td>${pageLink(t, assetTypeTitle(t))}</td><td>candidates, extracted</td><td>${typeTotal(t)}</td><td>${sizeLabel(typeBytes(t))}</td></tr>`,
      ),
      `</tbody></table></div>`,
    ].join("\n");
  const extractedTable = (() => {
    if (!extractedSchemes.length) return "<p>No KG asset carried an extractable term.</p>";
    const instances = [...new Set(extractedSchemes.map((s) => s.instance))];
    const cell = (inst: string, type: AssetType) => {
      const s = extractedSchemes.find((x) => x.instance === inst && x.extracted === type);
      return s ? `<td>${s.glossary.terms.length} · ${skosLink(s)}</td>` : "<td>—</td>";
    };
    return [
      `<div style="overflow-x:auto"><table>`,
      `<thead><tr><th>instance</th>${ASSET_TYPES.map((t) => `<th>${pageLink(t, assetTypeTitle(t))}</th>`).join("")}</tr></thead>`,
      `<tbody>`,
      ...instances.map((i) => `<tr><td>${esc(i)}</td>${ASSET_TYPES.map((t) => cell(i, t)).join("")}</tr>`),
      `<tr><td><strong>total</strong></td>${ASSET_TYPES.map((t) => `<td><strong>${typeTotal(t)}</strong></td>`).join("")}</tr>`,
      `</tbody></table></div>`,
    ].join("\n");
  })();
  const sources = [
    ...authoredSchemes.map(
      (s) =>
        `<li><strong>${esc(s.glossary.title)}</strong> (${s.instance}, ${s.glossary.terms.length} term${s.glossary.terms.length === 1 ? "" : "s"}${s.glossary.members?.length ? `, ${s.glossary.members.length} external members` : ""}) · <a href="{{ '/${skosAsset(s)}' | relative_url }}">SKOS JSON-LD</a> · <code>${esc(s.file)}</code></li>`,
    ),
    // `swimlane-glossary`, not `glossary`. `docs-auto` names its sub-page
    // after the DECLARED ID, and this href carried the wrong one — a third
    // instance of `bsay`'s class, found because repointing the declaration
    // made `check:wireframes` name it. A composed path is not resolved by
    // anything, so the link 404ed on the published glossary the whole time.
    ...c.ledgers.map(
      (l) =>
        `<li><strong>Swimlane roles</strong> (${l.instance}, ${l.terms} terms) · <a href="{{ '/cat-harness/docs-auto/glossary/swimlane-glossary/' | relative_url }}">rendered here</a> · <code>${esc(l.path)}</code></li>`,
    ),
    ...c.external.map((e) => `<li><strong>${esc(e.title ?? e.id)}</strong> (external SKOS, referenced by ${e.instance}) · ${link(e.url)}</li>`),
  ];
  const ledgerTerms = c.ledgers.reduce((k, l) => k + l.terms, 0);
  return sized(
    (size) => `---
layout: default
${GENERATED_FM}
title: Glossary
nav_order: 90
has_children: true
permalink: /glossary/
---
${GENERATED}

# Glossary

Every term the instances in this repository define or carry, as W3C SKOS. Terms link to the external concepts they match rather than copying them. ${total} terms: **${n.authored} authored** in ${authoredSchemes.length} glossar${authoredSchemes.length === 1 ? "y" : "ies"}, on this page, and **${n.extracted} extracted** from knowledge-graph assets in ${extractedSchemes.length} generated schemes, one page per asset type, plus the sources below.

<table>
<thead><tr><th>state</th><th>what it means</th><th>terms</th></tr></thead>
<tbody>
<tr><td>authored</td><td>A person wrote or approved the definition.</td><td>${n.authored}</td></tr>
<tr><td>candidate, extracted</td><td>Lifted from a knowledge-graph asset's own title and description, verbatim, and not curated. The definition is the asset's text, the source links to the asset, and an asset with no description gives a term with none. A person promotes one by authoring it.</td><td>${n.extracted}</td></tr>
<tr><td>could-not-extract</td><td>The source names a term the extractor could not read, and says why.</td><td>${n.couldNotExtract}</td></tr>
</tbody>
</table>

## Already somebody else's concept?

Extracted candidates are minted from this repository's own assets and are not, by themselves, checked against any vocabulary. \`check:term-mapping\` asks whether each already exists as a concept somebody is authoritative for — SKOS for what a term MEANS, FHIR for a clinical code's operational semantics — and the two are separate questions with separate answers.

${mappingBlock(mappingStates(), [...new Set(c.glossaries.map((g) => g.glossary.id))])}

## Pages

Each term is on exactly one page. Extracted candidates are split by asset type, so that no page is fetched at the size of all of them (owner, 2026-09-24).

${pagesTable(size)}

**Size:** this page holds ${rows.length} terms and is ${size} before compression, within its budget of ${sizeLabel(PAGE_BUDGET.index)}; each asset type's page has a budget of ${sizeLabel(PAGE_BUDGET.type)}. There is no search index: the filter on each page runs over that page, and its A–Z bar jumps within it. The SKOS files in the sources are the machine-readable form.

## Authored terms

${ordered.length ? `${ordered.map(orderedBlock).join("\n\n")}\n\n### Every other authored term, A–Z\n\n` : ""}${termsBlock(rows.filter((r) => !r.s.glossary.ordered))}

## Sources

### Authored

<ul>
${sources.join("\n")}
</ul>

### Extracted from knowledge-graph assets

Generated by \`folio-assistant-core/scripts/glossary-extract.ts\` into \`${esc(relative(REPO, generatedDir()).split("\\").join("/"))}/<instance>/<type>.glossary.json\`, one scheme per asset type per instance, each term's IRI in the namespace of the instance that holds the asset. BPMN lanes and roles are not extracted again: the ${ledgerTerms} swimlane-role terms above already carry them, with every lane name as an alternative label.

${extractedTable}

<script type="application/ld+json">
${JSON.stringify(ld, null, 1)}
</script>
${FILTER_SCRIPT}
`,
  );
}

// ── Per-locale pages — bean `c592` ───────────────────────────────
//
// Owner, 2026-09-30: *"do full translation, show it all works, do the builds,
// all machinery/tools/skills/assets."* The templates (`glossary-pot.ts`) sit in
// the declared translation-sources directory, one per scheme per locale; a
// translator's `.po` beside a template is what this reads. Nothing is
// translated until a `.po` exists, and an entry with no translation renders
// its SOURCE text marked untranslated — never silently English, and never
// omitted, which would make a partial translation read as a complete one.
//
// Every `.po` here is UNOFFICIAL until a person signs it off (issue #206), so
// every page says so in its front matter (`translation_status: unverified`),
// as the other translated pages do.

/** A locale's translations for one scheme: source text → translation. */
export type SchemeTranslations = ReadonlyMap<string, string>;

/**
 * Every locale that has at least one glossary `.po`, with its translations
 * per template name. Reads the SAME paths `glossary-pot.ts` writes, through
 * its own `potPath`, so the reader cannot look somewhere the writer does not.
 */
export function readGlossaryTranslations(dir: string = translationsDir()): Map<string, Map<string, SchemeTranslations>> {
  const out = new Map<string, Map<string, SchemeTranslations>>();
  if (!existsSync(dir)) return out;
  for (const locale of readdirSync(dir).sort()) {
    const sub = join(dir, locale, GLOSSARY_SUBDIR);
    if (!existsSync(sub)) continue;
    for (const f of readdirSync(sub).filter((x) => x.endsWith(".po")).sort()) {
      const name = f.slice(0, -".po".length);
      // Only a .po beside its template counts: an orphan .po translates
      // nothing the page shows, and `glossary:pot:check` reports it.
      if (!existsSync(potPath(dir, locale, name))) continue;
      const m = parsePo(readFileSync(join(sub, f), "utf-8"));
      const byScheme = out.get(locale) ?? new Map<string, SchemeTranslations>();
      byScheme.set(name, m);
      out.set(locale, byScheme);
    }
  }
  return out;
}

/** Where a locale's glossary page is written. */
export function localePagePath(locale: string): string {
  return join(SITE, locale, "glossary", "index.md");
}

/** The text in a locale, or the source marked untranslated. */
function inLocale(src: string, t: SchemeTranslations | undefined): { text: string; translated: boolean } {
  const v = t?.get(src);
  return v ? { text: v, translated: true } : { text: src, translated: false };
}

/**
 * The locale page's own words — headings, table labels, the status line — as
 * gettext msgids (`ui-string` entries in the `glossary-page` template), the
 * pattern `kg-viewer-strings.ts` set for the KG viewer. The page is translated
 * chrome and all, or it marks what is not.
 */
export const LOCALE_PAGE_STRINGS = {
  // Bean `7wou`. The source page gained this section on 2026-09-30 and the
  // five locale pages did not, which `translation:drift:check` caught as
  // 9 headings against 8 — correctly, and it is reader-visible: a section
  // a reader in that language could not reach. Added as msgids rather than
  // recorded in KNOWN_DRIFT, because these pages are GENERATED from this
  // file and a generated page's missing section is a generator gap, not a
  // translator's backlog.
  mapping: "Already somebody else's concept?",
  mappingIntro:
    "Extracted candidates are minted from this repository's own assets and are not, by themselves, checked against any vocabulary. `check:term-mapping` asks whether each already exists as a concept somebody is authoritative for — SKOS for what a term MEANS, FHIR for a clinical code's operational semantics — and the two are separate questions with separate answers.",
  // The same shape as `pagesNote`: the table below is counts, scheme ids and
  // column labels the generator writes in the source language. Saying so is
  // the policy this page already follows for the extracted pages — never
  // silently English, never omitted.
  mappingTableNote: "The table's labels are in the source language: it reports counts per scheme, computed by the gate rather than authored here.",
  pages: "Pages",
  pagesNote: "Extracted candidates are not translated: they are lifted verbatim from knowledge-graph assets and uncurated. Their pages are in the source language.",
  authored: "Authored terms",
  everyOther: "Every other authored term, A–Z",
  sources: "Sources",
  sourcesAuthored: "Authored",
  sourcesExtracted: "Extracted from knowledge-graph assets",
  term: "term",
  altLabels: "alternative labels",
  definition: "definition",
  untranslated: "untranslated",
  status: "These translations are unofficial: drafted by an agent and not yet signed off by a person (issue #206). Text marked untranslated is the source, shown rather than hidden.",
  fullyTranslated: "authored terms fully translated",
  sourcePage: "The glossary in the source language, with every extracted term",
} as const;

/** The template the locale page's strings live in, beside the schemes' templates. */
export const LOCALE_PAGE_TEMPLATE = "glossary-page";

/** One locale's glossary page: the SOURCE page's structure, every authored term translated where a .po says so. */
export function renderLocalePage(
  c: ReturnType<typeof collect>,
  locale: string,
  byScheme: ReadonlyMap<string, SchemeTranslations>,
  locales: readonly string[],
): string {
  const esc = (x: string) => x.replace(/\|/g, "\\|").replace(/\n/g, " ");
  const ui = byScheme.get(LOCALE_PAGE_TEMPLATE);
  const u = (k: keyof typeof LOCALE_PAGE_STRINGS) => inLocale(LOCALE_PAGE_STRINGS[k], ui);
  const untr = u("untranslated").text;
  const mark = (x: { text: string; translated: boolean }) => (x.translated ? esc(x.text) : `${esc(x.text)} _(${untr})_`);
  const rawTitle = [...byScheme.values()].map((m) => m.get("glossary")).find((v) => v) ?? "Glossary";
  // The term is lower-case in running text; as a title its first letter is
  // capitalised in the locale's own rules (a no-op for scripts without case).
  const titleTerm = rawTitle.charAt(0).toLocaleUpperCase(locale) + rawTitle.slice(1);
  let terms = 0;
  let translated = 0;
  const table = (s: GlossarySource): string[] => {
    const t = byScheme.get(templateName(s));
    const out = [`| ${mark(u("term"))} | ${mark(u("altLabels"))} | ${mark(u("definition"))} |`, "|---|---|---|"];
    for (const term of s.glossary.terms.filter((x) => x.status === "authored")) {
      const label = inLocale(sourceText(term.prefLabel), t);
      const alts = (term.altLabel ?? []).map((x) => inLocale(x, t));
      const def = term.definition ? inLocale(sourceText(term.definition), t) : undefined;
      terms++;
      if (label.translated && (!def || def.translated) && alts.every((x) => x.translated)) translated++;
      out.push(`| **${mark(label)}** | ${alts.map(mark).join("; ") || "—"} | ${def ? mark(def) : "—"} |`);
    }
    return out;
  };
  const schemes = [...c.glossaries]
    .filter((g) => !g.extracted && g.glossary.terms.some((t) => t.status === "authored"))
    .sort((x, y) => templateName(x).localeCompare(templateName(y)));
  // The SOURCE page's structure (translation-drift compares it): ordered
  // schemes each under their own ###, then every other authored term together.
  const ordered = schemes.filter((s) => s.glossary.ordered);
  const rest = schemes.filter((s) => !s.glossary.ordered);
  const body: string[] = [];
  for (const s of ordered) body.push(`### ${esc(s.glossary.title)}`, "", ...table(s), "");
  if (ordered.length) body.push(`### ${mark(u("everyOther"))}`, "");
  for (const s of rest) body.push(`**${esc(s.glossary.title)}**`, "", ...table(s), "");
  const L = [
    "---",
    "layout: default",
    `title: "${titleTerm.replace(/"/g, '\\"')}"`,
    `lang: ${locale}`,
    "nav_exclude: true",
    GENERATED_FM,
    "translation_status: unverified",
    "translation_source: glossary/index.md",
    `available_locales: [${["en", ...locales].map((l) => `"${l}"`).join(", ")}]`,
    `description: "${locale}: ${translated}/${terms} — ${u("fullyTranslated").text.replace(/"/g, "'")}"`,
    "---",
    "",
    GENERATED,
    "",
    `# ${esc(titleTerm)}`,
    "",
    `**${translated} / ${terms}** ${mark(u("fullyTranslated"))}. ${mark(u("status"))}`,
    "",
    // Before `## Pages`, because `translation-drift` compares the ORDER of
    // headings and not merely their number: re-levelling or re-ordering one
    // keeps the count identical and is still drift (measured on this gate,
    // twice, which is why it records the full shape).
    `## ${mark(u("mapping"))}`,
    "",
    `${mark(u("mappingIntro"))}`,
    "",
    `${mark(u("mappingTableNote"))}`,
    "",
    mappingBlock(mappingStates(), [...new Set(c.glossaries.map((g) => g.glossary.id))]),
    "",
    `## ${mark(u("pages"))}`,
    "",
    `${mark(u("pagesNote"))} [${mark(u("sourcePage"))}]({{ '/glossary/' | relative_url }}).`,
    "",
    `## ${mark(u("authored"))}`,
    "",
    ...body,
    `## ${mark(u("sources"))}`,
    "",
    `### ${mark(u("sourcesAuthored"))}`,
    "",
    ...schemes.map((s) => `- \`${templateName(s)}\` — ${esc(s.file)}`),
    "",
    `### ${mark(u("sourcesExtracted"))}`,
    "",
    `[${mark(u("sourcePage"))}]({{ '/glossary/' | relative_url }})`,
    "",
  ];
  return L.join("\n") + "\n";
}

/**
 * Every asset type's pages, rendered: the type's own page, then its parts if
 * it is split. The index reads their sizes, a split type's being its parts'
 * total.
 */
export function typePagesOf(c: ReturnType<typeof collect>): Map<AssetType | PartKey, string> {
  return new Map(PAGE_KEYS.filter((k): k is AssetType | PartKey => k !== "index").map((k) => [k, renderTypePage(c, k)] as const));
}

/** Every glossary page, keyed by page, index first. */
export function renderPages(c: ReturnType<typeof collect>): Map<PageKey, string> {
  const types = typePagesOf(c);
  return new Map<PageKey, string>([["index", renderIndex(c, types)], ...types]);
}
/**
 * A scheme with every translated label and definition folded in as
 * per-language text (`{ en: source, fr: … }`), which `toSkos` already emits as
 * language-tagged `skos:prefLabel` / `skos:definition` (bean c592). Only what
 * a `.po` translates is added; the source stays `en`. Alternative labels stay
 * source-only: `altLabel` is a plain string list in `folio-glossary/v1`.
 */
export function withTranslations(
  s: GlossarySource,
  translations: ReadonlyMap<string, ReadonlyMap<string, SchemeTranslations>>,
): Glossary {
  const name = templateName(s);
  const per = [...translations].map(([loc, m]) => [loc, m.get(name)] as const).filter(([, m]) => m !== undefined) as [string, SchemeTranslations][];
  if (per.length === 0) return s.glossary;
  const lang = (t: LangText): LangText => {
    const src = sourceText(t);
    const extra = Object.fromEntries(per.map(([loc, m]) => [loc, m.get(src)]).filter(([, v]) => v));
    return Object.keys(extra).length ? { en: src, ...extra } : t;
  };
  return {
    ...s.glossary,
    terms: s.glossary.terms.map((t) =>
      t.status !== "authored" ? t : { ...t, prefLabel: lang(t.prefLabel), ...(t.definition ? { definition: lang(t.definition) } : {}) },
    ),
  };
}

/** Every file this generator owns, path → content. */
export function outputs(
  c: ReturnType<typeof collect>,
  translations: ReadonlyMap<string, ReadonlyMap<string, SchemeTranslations>> = readGlossaryTranslations(),
  mapping: { states: readonly SchemeState[] | undefined; agent: () => string | undefined } = {
    states: mappingStates(),
    agent: () => matchingAgentIri(),
  },
  unresolved: string[] = [],
): Map<string, string> {
  const out = new Map<string, string>([...renderPages(c)].map(([k, page]) => [pagePath(k), page] as const));
  // Automated matches go into each scheme's SKOS (owner, 2026-10-02), in a
  // named graph marked as a program's work. See `toSkos`.
  const auto = automatedMatches(mapping.states, c.glossaries);
  unresolved.push(...auto.unresolved);
  const agent = auto.bySource.size ? mapping.agent() : undefined;
  // One page per locale that has a translation (bean c592).
  const locales = [...translations.keys()];
  for (const [locale, byScheme] of translations) out.set(localePagePath(locale), renderLocalePage(c, locale, byScheme, locales));
  for (const s of c.glossaries) {
    // `_generated` SECOND, not first: `@context` and `$schema` each have a
    // reader that looks for them at the head — a JSON-LD processor and every
    // validator of `folio-glossary/v1` — so the declaration goes after them.
    // `declaresGenerated` parses rather than matching the first key (`ws99`),
    // which is what makes that free. On the SKOS side `_generated` is an
    // UNMAPPED term: the `@context` declares `skos` and `dcterms` and no
    // `@vocab`, so a JSON-LD processor drops it and the graph is unchanged.
    const matches = auto.bySource.get(sourceKey(s));
    const skos = toSkos(
      s.extracted ? s.glossary : withTranslations(s, translations),
      s.ns,
      matches ? { matches, agent } : undefined,
    );
    const { "@context": context, ...skosRest } = skos;
    out.set(join(SITE, skosAsset(s)), `${JSON.stringify({ "@context": context, _generated: GENERATED_JSON, ...skosRest }, null, 2)}\n`);
    if (s.extracted) {
      const { $schema, ...rest } = s.glossary;
      out.set(extractedFile(s), `${JSON.stringify({ $schema, _generated: GENERATED_JSON, ...rest }, null, 2)}\n`);
    }
  }
  return out;
}

/** Files under a directory, recursively. */
function filesUnder(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? filesUnder(join(dir, e.name)) : [join(dir, e.name)],
  );
}

if (import.meta.main) {
  const check = process.argv.includes("--check");
  const c = collect();
  if (c.findings.invalid.length) {
    console.error(`✗ ${c.findings.invalid.length} glossary document(s) do not validate as folio-glossary/v1:`);
    for (const f of c.findings.invalid) console.error(`  ${f}`);
    process.exit(1);
  }
  const unresolved: string[] = [];
  const files = outputs(c, undefined, undefined, unresolved);
  // Reported, never fatal: a match the record cannot place is left out of the
  // SKOS rather than invented, and this says which and why.
  for (const u of unresolved) console.warn(`! automated match not published: ${u}`);
  // Stale output: a scheme removed or renamed leaves its old SKOS behind, and
  // an asset type or instance that stops contributing leaves its generated
  // scheme. Both directories are this generator's alone.
  // The glossary's own pages directory is this generator's too: a page for
  // an asset type that is no longer extracted is an orphan.
  // Each locale's glossary directory is this generator's own too (bean c592):
  // a locale whose last .po is removed leaves an orphan page.
  const localeDirs = readdirSync(SITE, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(join(SITE, e.name, "glossary", "index.md")))
    .map((e) => join(SITE, e.name, "glossary"));
  const orphans = [...filesUnder(ASSETS), ...filesUnder(generatedDir()), ...filesUnder(dirname(PAGE)), ...localeDirs.flatMap(filesUnder)]
    .filter((p) => !files.has(p));
  const stale = [...files].filter(([p, s]) => !existsSync(p) || readFileSync(p, "utf-8") !== s).map(([p]) => p);
  const n = counts(c);
  const summary = `${n.authored} authored + ${n.extracted} extracted terms, ${c.glossaries.length} scheme(s), ${c.ledgers.length} swimlane ledger(s), ${c.external.length} external scheme(s)`;
  const over = PAGE_KEYS.filter((k) => Buffer.byteLength(files.get(pagePath(k))!, "utf-8") > budgetOf(k));
  for (const k of over) {
    console.error(`✗ over budget: ${relative(REPO, pagePath(k))} is ${sizeLabel(Buffer.byteLength(files.get(pagePath(k))!, "utf-8"))}, budget ${sizeLabel(budgetOf(k))}. Split it further; do not raise the budget.`);
  }
  if (over.length) process.exit(1);
  if (check) {
    if (stale.length || orphans.length) {
      for (const p of stale) console.error(`✗ stale: ${relative(REPO, p)}`);
      for (const p of orphans) console.error(`✗ orphan: ${relative(REPO, p)}`);
      console.error("Run `bun run glossary:page` and commit the result.");
      process.exit(1);
    }
    console.log(`✓ glossary page current: ${summary}`);
    process.exit(0);
  }
  for (const [p, s] of files) {
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, s);
  }
  // An orphan is this generator's own output for a scheme that is gone.
  for (const p of orphans) rmSync(p);
  const sizes = PAGE_KEYS.map((k) => `${relative(REPO, pagePath(k))} ${sizeLabel(Buffer.byteLength(files.get(pagePath(k))!, "utf-8"))}`).join(", ");
  console.log(`Wrote ${PAGE_KEYS.length} page(s) (${sizes}), ${c.glossaries.length} SKOS file(s) and ${c.glossaries.filter((s) => s.extracted).length} extracted scheme(s): ${summary}.`);
}
