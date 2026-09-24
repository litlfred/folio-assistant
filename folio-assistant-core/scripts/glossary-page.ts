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
 *   SKOS scheme, listed with its link. Referenced, never held.
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
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

import {
  instanceRootsIn,
  readDeclaration,
  repoRootFor,
  resolveDirectories,
} from "../../cat-harness/schemas/cat-harness.ts";
import { LEGACY_FOLIO_NS } from "../../cat-harness/schemas/namespaces.ts";
import { GlossarySchema, toSkos, termIri, type Glossary, type LangText } from "../schemas/glossary.ts";

const CORE = resolve(import.meta.dir, "..");
const REPO = repoRootFor(CORE);
// declared-path-literal: the platform site the page publishes to, which is
// cat-harness's `docs/`; core owns the page, the harness owns the site.
const SITE = join(REPO, "cat-harness", "docs");
const PAGE = join(SITE, "glossary", "index.md");
const ASSETS = join(SITE, "assets", "glossary");

export interface GlossarySource {
  instance: string;
  ns: string;
  file: string;
  glossary: Glossary;
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
  return { glossaries, ledgers, external, findings };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const first = (t: LangText): string => (typeof t === "string" ? t : (t.en ?? Object.values(t)[0]!));

/** The asset file a scheme's SKOS is published at, under the site. */
export function skosAsset(s: GlossarySource): string {
  return `assets/glossary/${s.instance}--${s.glossary.id}.skos.jsonld`;
}

export function renderPage(c: ReturnType<typeof collect>): string {
  const rows = c.glossaries
    .flatMap((s) => s.glossary.terms.map((t) => ({ s, t, label: first(t.prefLabel) })))
    .sort((a, b) => a.label.localeCompare(b.label, "en", { sensitivity: "base" }));
  const byLetter = new Map<string, typeof rows>();
  for (const r of rows) {
    const L = r.label[0]!.toUpperCase();
    byLetter.set(L, [...(byLetter.get(L) ?? []), r]);
  }
  const letters = [...byLetter.keys()];
  const link = (u: string) => `<a href="${esc(u)}">${esc(u.replace(/^https?:\/\//, ""))}</a>`;
  const term = ({ s, t, label }: (typeof rows)[number]) => {
    const iri = termIri(s.ns, s.glossary, t.id);
    const matches = (["exactMatch", "closeMatch", "broadMatch", "narrowMatch"] as const).flatMap((m) =>
      (t[m] ?? []).map((u) => `<li>${m}: ${link(u)}</li>`),
    );
    const status = t.status === "authored" ? "" : ` <span class="fa-gloss-status">${t.status}</span>`;
    return [
      `<dt id="${esc(`${s.instance}--${s.glossary.id}--${t.id}`)}" data-fa-gloss="${esc(`${label} ${t.altLabel?.join(" ") ?? ""} ${t.notation ?? ""}`.toLowerCase())}">`,
      `${esc(label)}${t.notation ? ` <code>${esc(t.notation)}</code>` : ""}${status}`,
      `</dt>`,
      `<dd>`,
      t.definition ? `<p>${esc(first(t.definition))}</p>` : t.reason ? `<p>${esc(t.reason)}</p>` : `<p><em>No definition yet.</em></p>`,
      `<p class="fa-gloss-meta">${esc(s.glossary.title)} · <code>${esc(iri)}</code>${t.source ? ` · source <code>${esc(t.source)}</code>` : ""}</p>`,
      matches.length ? `<ul class="fa-gloss-matches">${matches.join("")}</ul>` : "",
      `</dd>`,
    ].join("\n");
  };
  const ld = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name: "Glossary",
    hasDefinedTerm: rows.map(({ s, t, label }) => ({
      "@type": "DefinedTerm",
      "@id": termIri(s.ns, s.glossary, t.id),
      name: label,
      ...(t.definition ? { description: first(t.definition) } : {}),
      ...(t.notation ? { termCode: t.notation } : {}),
    })),
  };
  const sources = [
    ...c.glossaries.map(
      (s) =>
        `<li><strong>${esc(s.glossary.title)}</strong> (${s.instance}, ${s.glossary.terms.length} terms${s.glossary.members?.length ? `, ${s.glossary.members.length} external members` : ""}) · <a href="{{ '/${skosAsset(s)}' | relative_url }}">SKOS JSON-LD</a> · <code>${esc(s.file)}</code></li>`,
    ),
    ...c.ledgers.map(
      (l) =>
        `<li><strong>Swimlane roles</strong> (${l.instance}, ${l.terms} terms) · <a href="{{ '/cat-harness/docs-auto/glossary/glossary/' | relative_url }}">rendered here</a> · <code>${esc(l.path)}</code></li>`,
    ),
    ...c.external.map((e) => `<li><strong>${esc(e.title ?? e.id)}</strong> (external SKOS, referenced by ${e.instance}) · ${link(e.url)}</li>`),
  ];
  return `---
layout: default
title: Glossary
nav_order: 90
permalink: /glossary/
---
<!-- Generated by folio-assistant-core/scripts/glossary-page.ts. Do not hand-edit: \`check:glossary\` fails on the difference. -->

# Glossary

Every term the instances in this repository define, as W3C SKOS. Terms link to the external concepts they match rather than copying them. ${rows.length} terms from ${c.glossaries.length} glossar${c.glossaries.length === 1 ? "y" : "ies"}, plus the sources below.

<label for="fa-gloss-q">Filter terms</label>
<input id="fa-gloss-q" type="search" autocomplete="off" style="min-height:44px;width:100%;max-width:32rem">
<p aria-live="polite"><span id="fa-gloss-n">${rows.length}</span> shown</p>

${letters.length ? `<nav aria-label="Letters">${letters.map((L) => `<a href="#letter-${L}">${L}</a>`).join(" ")}</nav>` : ""}

${letters
  .map((L) => `<h2 id="letter-${L}">${L}</h2>\n<dl class="fa-gloss">\n${byLetter.get(L)!.map(term).join("\n")}\n</dl>`)
  .join("\n\n")}

## Sources

<ul>
${sources.join("\n")}
</ul>

<script type="application/ld+json">
${JSON.stringify(ld, null, 1)}
</script>
<script>
(function(){var q=document.getElementById("fa-gloss-q"),n=document.getElementById("fa-gloss-n");if(!q)return;
q.addEventListener("input",function(){var v=q.value.trim().toLowerCase(),k=0;
document.querySelectorAll("dt[data-fa-gloss]").forEach(function(dt){var ok=!v||dt.getAttribute("data-fa-gloss").indexOf(v)>=0||(dt.nextElementSibling&&dt.nextElementSibling.textContent.toLowerCase().indexOf(v)>=0);
dt.hidden=!ok;if(dt.nextElementSibling)dt.nextElementSibling.hidden=!ok;if(ok)k++;});n.textContent=k;});})();
</script>
`;
}

/** Every file this generator owns, path → content. */
export function outputs(c: ReturnType<typeof collect>): Map<string, string> {
  const out = new Map<string, string>([[PAGE, renderPage(c)]]);
  for (const s of c.glossaries) out.set(join(SITE, skosAsset(s)), `${JSON.stringify(toSkos(s.glossary, s.ns), null, 2)}\n`);
  return out;
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
  // Stale assets: a scheme removed or renamed leaves its old SKOS behind.
  const orphans = existsSync(ASSETS)
    ? readdirSync(ASSETS).map((f) => join(ASSETS, f)).filter((p) => !files.has(p))
    : [];
  const stale = [...files].filter(([p, s]) => !existsSync(p) || readFileSync(p, "utf-8") !== s).map(([p]) => p);
  if (check) {
    if (stale.length || orphans.length) {
      for (const p of stale) console.error(`✗ stale: ${relative(REPO, p)}`);
      for (const p of orphans) console.error(`✗ orphan: ${relative(REPO, p)}`);
      console.error("Run `bun run glossary:page` and commit the result.");
      process.exit(1);
    }
    console.log(`✓ glossary page current: ${c.glossaries.reduce((n, s) => n + s.glossary.terms.length, 0)} terms, ${c.glossaries.length} scheme(s), ${c.ledgers.length} swimlane ledger(s), ${c.external.length} external scheme(s)`);
    process.exit(0);
  }
  for (const [p, s] of files) {
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, s);
  }
  // An orphan is this generator's own output for a scheme that is gone.
  for (const p of orphans) rmSync(p);
  console.log(`Wrote ${relative(REPO, PAGE)} and ${c.glossaries.length} SKOS file(s).`);
}
