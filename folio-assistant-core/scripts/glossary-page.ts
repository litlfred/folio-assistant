/**
 * The glossary/ page, and the SKOS JSON-LD behind it.
 *
 * Owner, 2026-09-23: *"it should be part of general pracice w/ glossary/ page.
 * check harnesses"*, and *"put glossary into folio-assistant-core"*. So this is
 * core's, and it reads every instance in the repository rather than one:
 *
 * - every `glossary` directory (core's kind): each `*.glossary.json`, validated
 *   as `folio-glossary/v1`, becomes SKOS JSON-LD at
 *   `docs/assets/glossary/<instance>--<scheme>.skos.jsonld` and rows on the page;
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
 * `--check` writes nothing and fails when a document does not validate or the
 * committed output is stale. That is `check:glossary`, and it is a gate.
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
import { GlossarySchema, toSkos, termIri, type Glossary, type LangText } from "../schemas/glossary.ts";
import { ASSET_TYPES, EXTRACTED_PREFIX, assetTypeTitle, extract, type AssetType } from "./glossary-extract.ts";

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
  instance: string;
  ns: string;
  file: string;
  glossary: Glossary;
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
          glossaries.push({ instance: decl.name, ns: instanceNs(decl.name, decl.stub), file: rel, glossary: r.data });
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
  const nsOf = new Map<string, string>();
  for (const root of instanceRootsIn(repo)) {
    const decl = readDeclaration(root);
    if (decl) nsOf.set(decl.name, instanceNs(decl.name, decl.stub));
  }
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

/** The page's size, rounded so that stating it does not move it. */
function sizeLabel(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function renderPage(c: ReturnType<typeof collect>): string {
  // Two passes: the page states its own size, so it is rendered once to
  // measure and once to say so. The size is rounded to 0.1 MB, which the
  // few bytes of the statement itself cannot move.
  const draft = renderWith(c, "…");
  return renderWith(c, sizeLabel(Buffer.byteLength(draft, "utf-8")));
}

function renderWith(c: ReturnType<typeof collect>, size: string): string {
  const rows = c.glossaries
    .flatMap((s) => s.glossary.terms.map((t) => ({ s, t, label: first(t.prefLabel) })))
    .sort(
      (a, b) =>
        a.label.localeCompare(b.label, "en", { sensitivity: "base" }) ||
        (a.label < b.label ? -1 : a.label > b.label ? 1 : 0) ||
        `${a.s.instance}/${a.s.glossary.id}/${a.t.id}`.localeCompare(`${b.s.instance}/${b.s.glossary.id}/${b.t.id}`, "en"),
    );
  // A label that does not start with a letter (a digit, a quote) goes under
  // one heading of its own rather than inventing a letter for it.
  const letterOf = (label: string) => {
    const L = label.normalize("NFD")[0]!.toUpperCase();
    return /[A-Z]/.test(L) ? L : "#";
  };
  const byLetter = new Map<string, typeof rows>();
  for (const r of rows) {
    const L = letterOf(r.label);
    byLetter.set(L, [...(byLetter.get(L) ?? []), r]);
  }
  const letters = [...byLetter.keys()].sort((a, b) => (a === "#" ? -1 : b === "#" ? 1 : a.localeCompare(b, "en")));
  const anchor = (L: string) => (L === "#" ? "letter-0-9" : `letter-${L}`);
  const shown = (L: string) => (L === "#" ? "0–9" : L);
  const link = (u: string) => `<a href="${esc(u)}">${esc(u.replace(/^https?:\/\//, ""))}</a>`;
  const sourceLink = (src: string) => {
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(src)) return link(src);
    const path = src.split("#", 2)[0]!;
    return `<a href="${esc(`${BLOB}/${path}`)}"><code>${esc(src)}</code></a>`;
  };
  const term = ({ s, t, label }: (typeof rows)[number]) => {
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
    // a 2,000-term page does not say every label twice.
    const hidden = [...(t.altLabel ?? []), ...(t.notation && !code && t.notation !== label && t.notation !== frag ? [t.notation] : [])]
      .join(" ")
      .toLowerCase();
    // An extracted term's IRI is in its scheme's SKOS and not repeated here:
    // at this size it was the largest single cost per row, and the row's own
    // anchor is the link a reader shares. An authored term shows it, because
    // that is the IRI somebody will cite.
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
  };
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
  const authoredSchemes = c.glossaries.filter((s) => !s.extracted);
  const extractedSchemes = c.glossaries.filter((s) => s.extracted);
  const skos = (s: GlossarySource) => `<a href="{{ '/${skosAsset(s)}' | relative_url }}">SKOS</a>`;
  const extractedTable = (() => {
    if (!extractedSchemes.length) return "<p>No KG asset carried an extractable term.</p>";
    const instances = [...new Set(extractedSchemes.map((s) => s.instance))];
    const cell = (inst: string, type: AssetType) => {
      const s = extractedSchemes.find((x) => x.instance === inst && x.extracted === type);
      return s ? `<td>${s.glossary.terms.length} · ${skos(s)}</td>` : "<td>—</td>";
    };
    const total = (type: AssetType) => extractedSchemes.filter((s) => s.extracted === type).reduce((k, s) => k + s.glossary.terms.length, 0);
    return [
      `<div style="overflow-x:auto"><table>`,
      `<thead><tr><th>instance</th>${ASSET_TYPES.map((t) => `<th>${esc(assetTypeTitle(t))}</th>`).join("")}</tr></thead>`,
      `<tbody>`,
      ...instances.map((i) => `<tr><td>${esc(i)}</td>${ASSET_TYPES.map((t) => cell(i, t)).join("")}</tr>`),
      `<tr><td><strong>total</strong></td>${ASSET_TYPES.map((t) => `<td><strong>${total(t)}</strong></td>`).join("")}</tr>`,
      `</tbody></table></div>`,
    ].join("\n");
  })();
  const sources = [
    ...authoredSchemes.map(
      (s) =>
        `<li><strong>${esc(s.glossary.title)}</strong> (${s.instance}, ${s.glossary.terms.length} terms${s.glossary.members?.length ? `, ${s.glossary.members.length} external members` : ""}) · <a href="{{ '/${skosAsset(s)}' | relative_url }}">SKOS JSON-LD</a> · <code>${esc(s.file)}</code></li>`,
    ),
    ...c.ledgers.map(
      (l) =>
        `<li><strong>Swimlane roles</strong> (${l.instance}, ${l.terms} terms) · <a href="{{ '/cat-harness/docs-auto/glossary/glossary/' | relative_url }}">rendered here</a> · <code>${esc(l.path)}</code></li>`,
    ),
    ...c.external.map((e) => `<li><strong>${esc(e.title ?? e.id)}</strong> (external SKOS, referenced by ${e.instance}) · ${link(e.url)}</li>`),
  ];
  const ledgerTerms = c.ledgers.reduce((k, l) => k + l.terms, 0);
  return `---
layout: default
title: Glossary
nav_order: 90
permalink: /glossary/
---
<!-- Generated by folio-assistant-core/scripts/glossary-page.ts. Do not hand-edit: \`check:glossary\` fails on the difference. -->

# Glossary

Every term the instances in this repository define or carry, as W3C SKOS. Terms link to the external concepts they match rather than copying them. ${rows.length} terms: **${n.authored} authored** in ${authoredSchemes.length} glossar${authoredSchemes.length === 1 ? "y" : "ies"}, and **${n.extracted} extracted** from knowledge-graph assets in ${extractedSchemes.length} generated schemes, plus the sources below.

<table>
<thead><tr><th>state</th><th>what it means</th><th>terms</th></tr></thead>
<tbody>
<tr><td>authored</td><td>A person wrote or approved the definition.</td><td>${n.authored}</td></tr>
<tr><td>candidate, extracted</td><td>Lifted from a knowledge-graph asset's own title and description, verbatim, and not curated. The definition is the asset's text, the source links to the asset, and an asset with no description gives a term with none. A person promotes one by authoring it.</td><td>${n.extracted}</td></tr>
<tr><td>could-not-extract</td><td>The source names a term the extractor could not read, and says why.</td><td>${n.couldNotExtract}</td></tr>
</tbody>
</table>

**Size:** this page holds ${rows.length} terms and is ${size} before compression, fetched in one request. There is no search index: the filter below runs over the page itself, and the A–Z bar jumps within it. The SKOS files in the sources are the machine-readable form.

<label for="fa-gloss-q">Filter terms</label>
<input id="fa-gloss-q" type="search" autocomplete="off" style="min-height:44px;width:100%;max-width:32rem">
<label for="fa-gloss-s">Show</label>
<select id="fa-gloss-s" style="min-height:44px">
<option value="">all terms</option>
<option value="authored">authored only</option>
<option value="extracted">extracted only</option>
</select>
<p aria-live="polite"><span id="fa-gloss-n">${rows.length}</span> shown</p>

${letters.length ? `<nav aria-label="Letters">${letters.map((L) => `<a href="#${anchor(L)}">${shown(L)}</a>`).join(" ")}</nav>` : ""}

${letters
  .map((L) => `<h2 id="${anchor(L)}">${shown(L)}</h2>\n<dl class="fa-gloss">\n${byLetter.get(L)!.map(term).join("\n")}\n</dl>`)
  .join("\n\n")}

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
<script>
(function(){var q=document.getElementById("fa-gloss-q"),s=document.getElementById("fa-gloss-s"),n=document.getElementById("fa-gloss-n");if(!q)return;
function run(){var v=q.value.trim().toLowerCase(),w=s?s.value:"",k=0;
document.querySelectorAll("dt[data-fa-gloss]").forEach(function(dt){var st=dt.getAttribute("data-fa-state"),dd=dt.nextElementSibling;
var ok=(!w||(w==="extracted"?st==="extracted":st!=="extracted"))&&(!v||(dt.textContent+" "+dt.getAttribute("data-fa-gloss")+" "+(dd?dd.textContent:"")).toLowerCase().indexOf(v)>=0);
dt.hidden=!ok;if(dd)dd.hidden=!ok;if(ok)k++;});n.textContent=k;}
q.addEventListener("input",run);if(s)s.addEventListener("change",run);})();
</script>
`;
}

/** Every file this generator owns, path → content. */
export function outputs(c: ReturnType<typeof collect>): Map<string, string> {
  const out = new Map<string, string>([[PAGE, renderPage(c)]]);
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
  const orphans = [...filesUnder(ASSETS), ...filesUnder(generatedDir())].filter((p) => !files.has(p));
  const stale = [...files].filter(([p, s]) => !existsSync(p) || readFileSync(p, "utf-8") !== s).map(([p]) => p);
  const n = counts(c);
  const summary = `${n.authored} authored + ${n.extracted} extracted terms, ${c.glossaries.length} scheme(s), ${c.ledgers.length} swimlane ledger(s), ${c.external.length} external scheme(s)`;
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
  console.log(`Wrote ${relative(REPO, PAGE)} (${sizeLabel(Buffer.byteLength(files.get(PAGE)!, "utf-8"))}), ${c.glossaries.length} SKOS file(s) and ${c.glossaries.filter((s) => s.extracted).length} extracted scheme(s): ${summary}.`);
}
