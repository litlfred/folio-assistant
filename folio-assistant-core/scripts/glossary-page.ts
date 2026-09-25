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
} from "../../cat-harness/schemas/cat-harness.ts";
import { LEGACY_FOLIO_NS } from "../../cat-harness/schemas/namespaces.ts";
import { GlossarySchema, schemeIri, toSkos, termIri, type Glossary, type LangText } from "../schemas/glossary.ts";
import { ASSET_TYPES, EXTRACTED_PREFIX, assetTypeTitle, assetTypeWhat, extract, type AssetType } from "./glossary-extract.ts";

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
const BLOB = "https://github.com/litlfred/folio-assistant/blob/main";

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

/** The instance's namespace, `<stem><stub>/ns#`: bean `lqo9` puts a term's IRI there, never in the asset. */
/** The platform's publication root, read from the namespace registry rather than written again here. */
const NS_STEM = LEGACY_FOLIO_NS.replace(/ns#$/, "");
export function instanceNs(name: string, stub?: string): string {
  return `${NS_STEM}${stub ?? name}/ns#`;
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
    if (decl) out.push({ root: resolve(root), name: decl.name, ns: instanceNs(decl.name, decl.stub) });
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
      if (kinds.includes("swimlane-glossary")) {
        const ledger = join(d.absPath, "glossary-ledger.json");
        if (existsSync(ledger)) {
          const l = JSON.parse(readFileSync(ledger, "utf-8")) as { concepts?: Record<string, unknown> };
          ledgers.push({ instance: decl.name, path: relative(repo, ledger), terms: Object.keys(l.concepts ?? {}).length });
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

/** Which page a term is on: `index` for an authored scheme's, else its asset type. */
export type PageKey = "index" | AssetType;
/** Every page, index first. A page exists for every asset type even when it holds no term, so the index can link each one. */
export const PAGE_KEYS: readonly PageKey[] = ["index", ...ASSET_TYPES];

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
  return k === "index" ? PAGE : join(dirname(PAGE), typeSlug(k), "index.md");
}
export function permalinkOf(k: PageKey): string {
  return k === "index" ? "/glossary/" : `/glossary/${typeSlug(k)}/`;
}
export function pageTitle(k: PageKey): string {
  return k === "index" ? "Glossary" : `Glossary: ${assetTypeTitle(k)}`;
}

type Row = { s: GlossarySource; t: Glossary["terms"][number]; label: string };

/** The terms on one page, sorted by label. */
export function rowsOn(c: ReturnType<typeof collect>, k: PageKey): Row[] {
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
  return `<a href="${esc(`${BLOB}/${path}`)}"><code>${esc(src)}</code></a>`;
};
const pageLink = (k: PageKey, text: string) => `<a href="{{ '${permalinkOf(k)}' | relative_url }}">${esc(text)}</a>`;
const skosLink = (s: GlossarySource) => `<a href="{{ '/${skosAsset(s)}' | relative_url }}">SKOS</a>`;

function termEntry({ s, t, label }: Row): string {
  const iri = termIri(s.ns, s.glossary, t.id);
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
    ? `<p>${esc(first(t.definition))}</p>`
    : t.reason
      ? `<p>${esc(t.reason)}</p>`
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
    `${esc(label)}${code}${status}`,
    `</dt>`,
    `<dd>`,
    definition,
    `<p class="fa-gloss-meta">${meta}${t.source ? ` · source ${sourceLink(t.source)}` : ""}</p>`,
    ...(matches.length ? [`<ul class="fa-gloss-matches">${matches.join("")}</ul>`] : []),
    `</dd>`,
  ].join("\n");
}

/** The filter box, the A–Z bar and the terms under their letters: the same on every page. */
function termsBlock(rows: Row[]): string {
  // A label that does not start with a letter (a digit, a quote) goes under
  // one heading of its own rather than inventing a letter for it.
  const letterOf = (label: string) => {
    const L = label.normalize("NFD")[0]!.toUpperCase();
    return /[A-Z]/.test(L) ? L : "#";
  };
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
  .map((L) => `<h2 id="${anchor(L)}">${shown(L)}</h2>\n<dl class="fa-gloss">\n${byLetter.get(L)!.map(termEntry).join("\n")}\n</dl>`)
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

const GENERATED = `<!-- Generated by folio-assistant-core/scripts/glossary-page.ts. Do not hand-edit: \`check:glossary\` fails on the difference. -->`;

/**
 * Render with the page's own size in it. Two passes: the page states its own
 * size, so it is rendered once to measure and once to say so. The size is
 * rounded, which the few bytes of the statement itself cannot move.
 */
function sized(render: (size: string) => string): string {
  return render(sizeLabel(Buffer.byteLength(render("…"), "utf-8")));
}

/** One asset type's page: its extracted terms, from every instance. */
export function renderTypePage(c: ReturnType<typeof collect>, type: AssetType): string {
  const rows = rowsOn(c, type);
  const schemes = c.glossaries.filter((s) => s.extracted === type);
  const from = schemes.length
    ? schemes.map((s) => `${esc(s.instance)} ${s.glossary.terms.length} (${skosLink(s)})`).join(" · ")
    : "no instance";
  return sized(
    (size) => `---
layout: default
title: "${pageTitle(type)}"
parent: Glossary
nav_order: ${ASSET_TYPES.indexOf(type) + 1}
permalink: ${permalinkOf(type)}
---
${GENERATED}

# ${pageTitle(type)}

Candidate terms extracted from ${assetTypeWhat(type)}. Each is the asset's own text, verbatim and not curated, and carries the badge "candidate, extracted". A person promotes one by authoring it. Authored terms, the counts and the sources are on the ${pageLink("index", "glossary index")}.

From: ${from}.

**Size:** this page holds ${rows.length} terms and is ${size} before compression, fetched in one request, within its budget of ${sizeLabel(budgetOf(type))}. There is no search index: the filter below runs over this page, and the A–Z bar jumps within it.

${termsBlock(rows)}

${FILTER_SCRIPT}
`,
  );
}

/** The index: authored terms, the counts, the sources, and a link to every asset type's page. */
export function renderIndex(c: ReturnType<typeof collect>, typePages: ReadonlyMap<AssetType, string> = typePagesOf(c)): string {
  const rows = rowsOn(c, "index");
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
        "@id": termIri(s.ns, s.glossary, t.id),
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
          `<tr><td>${pageLink(t, assetTypeTitle(t))}</td><td>candidates, extracted</td><td>${typeTotal(t)}</td><td>${sizeLabel(Buffer.byteLength(typePages.get(t) ?? "", "utf-8"))}</td></tr>`,
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
    ...c.ledgers.map(
      (l) =>
        `<li><strong>Swimlane roles</strong> (${l.instance}, ${l.terms} terms) · <a href="{{ '/cat-harness/docs-auto/glossary/glossary/' | relative_url }}">rendered here</a> · <code>${esc(l.path)}</code></li>`,
    ),
    ...c.external.map((e) => `<li><strong>${esc(e.title ?? e.id)}</strong> (external SKOS, referenced by ${e.instance}) · ${link(e.url)}</li>`),
  ];
  const ledgerTerms = c.ledgers.reduce((k, l) => k + l.terms, 0);
  return sized(
    (size) => `---
layout: default
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

## Pages

Each term is on exactly one page. Extracted candidates are split by asset type, so that no page is fetched at the size of all of them (owner, 2026-09-24).

${pagesTable(size)}

**Size:** this page holds ${rows.length} terms and is ${size} before compression, within its budget of ${sizeLabel(PAGE_BUDGET.index)}; each asset type's page has a budget of ${sizeLabel(PAGE_BUDGET.type)}. There is no search index: the filter on each page runs over that page, and its A–Z bar jumps within it. The SKOS files in the sources are the machine-readable form.

## Authored terms

${termsBlock(rows)}

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

/** Every asset type's page, rendered. The index reads their sizes. */
export function typePagesOf(c: ReturnType<typeof collect>): Map<AssetType, string> {
  return new Map(ASSET_TYPES.map((t) => [t, renderTypePage(c, t)] as const));
}

/** Every glossary page, keyed by page, index first. */
export function renderPages(c: ReturnType<typeof collect>): Map<PageKey, string> {
  const types = typePagesOf(c);
  return new Map<PageKey, string>([["index", renderIndex(c, types)], ...types]);
}
/** Every file this generator owns, path → content. */
export function outputs(c: ReturnType<typeof collect>): Map<string, string> {
  const out = new Map<string, string>([...renderPages(c)].map(([k, page]) => [pagePath(k), page] as const));
  for (const s of c.glossaries) {
    out.set(join(SITE, skosAsset(s)), `${JSON.stringify(toSkos(s.glossary, s.ns), null, 2)}\n`);
    if (s.extracted) out.set(extractedFile(s), `${JSON.stringify(s.glossary, null, 2)}\n`);
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
  const files = outputs(c);
  // Stale output: a scheme removed or renamed leaves its old SKOS behind, and
  // an asset type or instance that stops contributing leaves its generated
  // scheme. Both directories are this generator's alone.
  // The glossary's own pages directory is this generator's too: a page for
  // an asset type that is no longer extracted is an orphan.
  const orphans = [...filesUnder(ASSETS), ...filesUnder(generatedDir()), ...filesUnder(dirname(PAGE))].filter((p) => !files.has(p));
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
