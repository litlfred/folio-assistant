#!/usr/bin/env bun
/**
 * Render smart-trust's reader-facing pages from the artefact index.
 *
 * @module smart-trust/scripts/gen-smart-trust-pages
 *
 * ## Why this exists
 *
 * `fhir-artifact-index` is registered `renderable: false`, and `smart-trust/`
 * declared exactly one directory of exactly that kind — so 674 ingested
 * artefacts were reachable at no URL. The owner found it by asking where
 * `/smart-trust` was. Only two of this repository's graph kinds are renderable
 * (`docs` and `folio`), and `who-iris/` publishes because it declares a
 * `docs/` directory alongside its `catalogue/`. This generator writes the
 * equivalent for smart-trust.
 *
 * **The URL the owner expected is the right one.** `withRoutes` in
 * `cat-harness/scripts/mount-instance-docs.ts` publishes an instance at
 * `/<kind>/<instance>/` for every renderable kind AND once at `/<instance>/`,
 * its themed root. A `docs` graph here therefore serves both
 * `/docs/smart-trust/` and `/smart-trust/`.
 *
 * ## Generated from the index, never transcribed
 *
 * Every artefact, count, canonical URL and link on these pages is read out of
 * `smart-trust/fhir-artifact-index/index.json`. Hand-writing them would
 * produce pages that agree with the index exactly once — on the day they were
 * written. `--check` is what keeps that from happening quietly, and it is
 * wired into the gate set.
 *
 * That is the same discipline the index itself carries: `smart-trust/AGENTS.md`
 * says nothing under the graph is authored, and this directory is no different.
 *
 * ## What the pages say, and what they refuse to imply
 *
 * **A referenced artefact is not a broken one.** 655 of the 674 are
 * `referenced` — the index knows where they live and holds none of their
 * bytes. Following `gen-iris-pages.ts`, no row is greyed out: a disabled-looking
 * row reads as "broken", while a row stating **referenced** reads as "upstream,
 * not here", which is the actual state and the whole point of cataloguing by
 * reference.
 *
 * **Two link targets, never conflated.** An artefact's canonical URL
 * (`http://smart.who.int/trust/...`) is its IDENTITY; its published URL
 * (`https://worldhealthorganization.github.io/smart-trust/...`) is where bytes
 * are served. smart-trust is canonical at one host and published at another,
 * so composing either from the other would write a link that resolves for
 * nobody. Both come from the index.
 *
 * **No WHO logo.** Same instruction the who-iris pages follow: until published
 * under WHO, colour carries the identity and the wordmark is set in type. A
 * replica carrying the real mark is indistinguishable from the real thing.
 *
 * Usage:
 *   bun run smart-trust/scripts/gen-smart-trust-pages.ts
 *   bun run smart-trust/scripts/gen-smart-trust-pages.ts --check
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  FhirArtifactIndexSchema,
  materializationCensus,
  dakOverlayCensus,
  byCategory,
  type FhirArtifact,
  type FhirArtifactIndex,
  type Representation,
} from "../../folio-assistant-core/schemas/fhir-artifact-index.js";

const INSTANCE = resolve(import.meta.dir, "..");
const INDEX = join(INSTANCE, "fhir-artifact-index", "index.json");
const OUT = join(INSTANCE, "docs");

const CHECK = process.argv.includes("--check");

/** HTML-escape. Every string on these pages comes from an upstream IG, so none of it is trusted markup. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** A filesystem-safe page name for an artefact key (`ValueSet/Actors` -> `ValueSet-Actors`). */
function pageName(a: FhirArtifact): string {
  return `${a.resourceType}-${a.id}`.replace(/[^A-Za-z0-9._-]/g, "_");
}

/**
 * Above this many artefacts a category is SUMMARISED and linked out rather
 * than listed inline.
 *
 * The owner's call, 2026-09-21, on measuring the first build: the index page
 * came to 524KB and one category was 90% of it.
 *
 * **The number is not load-bearing, and that is the point.** smart-trust's
 * categories measure 604, 29, 15, 14, 5, 5, 1 — a 20x gap between the largest
 * and the next. Any threshold in 30..603 separates them identically, so 100 is
 * a round number inside a wide gap rather than a tuned constant. If a future
 * IG lands a category near the boundary, the right response is to look at that
 * distribution, not to nudge this.
 *
 * What makes linking out lossless HERE, checked rather than assumed: every one
 * of smart-trust's 604 `Other` artefacts is an Endpoint or an Organization and
 * NONE carries a DAK overlay, so none would have had an artefact page to link
 * to. The summary reports the DAK count it actually finds, so a future
 * category that does carry sidecars says so instead of hiding them.
 */
const INLINE_LIMIT = 100;

const CSS = `
:root {
  --ink: #17242e; --muted: #5c6b77; --edge: #d5dde3; --surface: #ffffff;
  --wash: #f6f9fb; --accent: #0a6e8c; --accent-deep: #08516a;
  --held: #0d6e5e; --ref: #6b5b95; --col: 1180px;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --ink: #e8eef2; --muted: #9fb0bc; --edge: #2c3a45; --surface: #111a20;
    --wash: #16212a; --accent: #57b6d4; --accent-deep: #8ed2e8;
    --held: #5fc7ae; --ref: #b3a3dd;
  }
}
:root[data-theme="dark"] {
  --ink: #e8eef2; --muted: #9fb0bc; --edge: #2c3a45; --surface: #111a20;
  --wash: #16212a; --accent: #57b6d4; --accent-deep: #8ed2e8;
  --held: #5fc7ae; --ref: #b3a3dd;
}
* { box-sizing: border-box; }
body {
  margin: 0; background: var(--surface); color: var(--ink);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
    Arial, "Noto Sans", sans-serif;
  font-size: 16px; line-height: 1.55;
}
.wrap { max-width: var(--col); margin: 0 auto; padding: 0 16px; }
a { color: var(--accent); }
a:hover, a:focus { text-decoration: underline; }
code, .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: .9em; }
header.top { background: var(--accent-deep); color: #fff; padding: 22px 0; }
header.top .wrap { display: flex; flex-wrap: wrap; gap: 10px; align-items: baseline; justify-content: space-between; }
header.top h1 { margin: 0; font-size: 1.35rem; letter-spacing: .01em; }
header.top a { color: #dff1f8; }
.sub { color: #cfe6f0; font-size: .92rem; }
.banner {
  background: var(--wash); border-bottom: 1px solid var(--edge);
  padding: 12px 0; font-size: .92rem; color: var(--muted);
}
main { padding: 24px 0 64px; }
h2 { font-size: 1.12rem; margin: 30px 0 10px; }
h3 { font-size: 1rem; margin: 22px 0 8px; }
p { margin: 8px 0; }
.lede { font-size: 1.02rem; max-width: 72ch; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; margin: 16px 0 6px; }
.stat { border: 1px solid var(--edge); border-radius: 8px; padding: 12px 14px; background: var(--wash); }
.stat b { display: block; font-size: 1.5rem; line-height: 1.2; font-variant-numeric: tabular-nums; }
.stat span { color: var(--muted); font-size: .84rem; }
table { border-collapse: collapse; width: 100%; margin: 10px 0 4px; font-size: .93rem; }
th, td { text-align: left; padding: 7px 9px; border-bottom: 1px solid var(--edge); vertical-align: top; }
th { color: var(--muted); font-weight: 600; font-size: .82rem; text-transform: uppercase; letter-spacing: .04em; }
tbody tr:hover { background: var(--wash); }
.tag { display: inline-block; font-size: .74rem; padding: 1px 7px; border-radius: 999px; border: 1px solid currentColor; white-space: nowrap; }
.tag.held { color: var(--held); }
.tag.ref { color: var(--ref); }
.reps a { margin-right: 8px; white-space: nowrap; }
details { border: 1px solid var(--edge); border-radius: 8px; margin: 12px 0; background: var(--surface); }
details > summary {
  cursor: pointer; padding: 11px 14px; font-weight: 600;
  display: flex; justify-content: space-between; gap: 12px; align-items: baseline;
}
details > summary .n { color: var(--muted); font-weight: 400; font-variant-numeric: tabular-nums; }
details[open] > summary { border-bottom: 1px solid var(--edge); }
.inner { padding: 0 14px 10px; overflow-x: auto; }
.prov { border: 1px solid var(--edge); border-radius: 8px; padding: 12px 14px; background: var(--wash); }
.prov dt { font-weight: 600; font-size: .86rem; margin-top: 8px; }
.prov dd { margin: 2px 0 0; color: var(--muted); }
footer { border-top: 1px solid var(--edge); color: var(--muted); font-size: .86rem; padding: 18px 0 40px; }
.back { display: inline-block; margin-bottom: 8px; }
@media (max-width: 640px) { header.top h1 { font-size: 1.1rem; } .wrap { padding: 0 16px; } }
`;

/**
 * A page for the JUST-THE-DOCS pipeline: front matter, then the body.
 *
 * ## Why this stopped emitting finished HTML
 *
 * Owner, 2026-09-21: *"i want the input/page(s)/ content to be rendered
 * viajustthedocs pipeline. use metadataetc fro IG publisher to populate the
 * variables jekyl processes."*
 *
 * These pages were `<!doctype html>` documents with their own `<head>`,
 * copied into `_site` AFTER Jekyll by `mount-instance-docs.ts` — so they
 * inherited **nothing**: no sidebar, no language bar, no QA badges, no search.
 * `hw9g` had to inject a navigation rail into them precisely because the
 * pipeline never saw them. Composed instead, they are ordinary folio pages and
 * the rail is unnecessary here (it stays necessary for `who-iris`, which is a
 * deliberate replica of somebody else's site).
 *
 * ## The body is still HTML, and that is the MVP line
 *
 * kramdown passes raw HTML through, so front matter alone converts these into
 * real pages without rewriting every emitter in one go. What that buys is the
 * chrome; what it does not buy is markdown semantics — no automatic heading
 * anchors, no table-of-contents, and `{{ }}` in a body would be read as Liquid.
 * Converting each body to markdown is the parity work the owner asked to be
 * taken "until rendering parity-ish", and it can now happen page by page
 * against a site that already renders.
 *
 * ## Titles and description come from the INDEX
 *
 * "use metadata … to populate the variables jekyl processes" — `title` and
 * `description` are the index's own, never typed here, which is the same rule
 * the rest of this generator follows.
 */
function shell(title: string, description: string, body: string, depth = 0): string {
  const fm = [
    "---",
    `title: ${yamlScalar(title)}`,
    `description: ${yamlScalar(description)}`,
    // `nav_exclude` on the artefact pages: 674 artefacts would bury the
    // sidebar's real structure under one instance's leaves. The index page is
    // the front door and stays listed.
    ...(depth === 0 ? [] : ["nav_exclude: true"]),
    "---",
    "",
  ].join("\n");
  // The stylesheet rides INSIDE the page rather than in a `<head>` this file
  // no longer owns. just-the-docs supplies the chrome; these classes (`lede`,
  // `mono`, `back`, the census tables) are the BODY's own and it still needs
  // them. Dropping it was the first draft, and it would have quietly unstyled
  // every table on 20 pages while lint reported only an unused variable.
  return `${fm}<style>${CSS}</style>\n${body}\n`;
}

/**
 * A YAML scalar that survives a colon, a quote or a leading dash in a title.
 *
 * Front matter is parsed before anything else reads the page, so an unquoted
 * `Foo: bar` does not render wrong — it fails the BUILD, with an error naming
 * YAML rather than the artefact whose name carried the colon.
 */
function yamlScalar(v: string): string {
  return `"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function repLinks(a: FhirArtifact): string {
  const out: string[] = [];
  for (const k of ["json", "xml", "ttl", "html"] as const) {
    const r: Representation | undefined = a.published[k];
    if (r) out.push(`<a href="${esc(r.url)}">${k}</a>`);
  }
  return out.length ? out.join("") : `<span class="mono">&mdash;</span>`;
}

function indexPage(ix: FhirArtifactIndex): string {
  const census = materializationCensus(ix.artifacts);
  const dak = dakOverlayCensus(ix.artifacts);
  const cats = byCategory(ix.artifacts);
  // Deterministic: named categories by name, the uncategorised bucket last.
  const ordered = [...cats.entries()].sort(([a], [b]) =>
    a === undefined ? 1 : b === undefined ? -1 : a.localeCompare(b),
  );

  const stats = `
<div class="grid">
  <div class="stat"><b>${ix.count}</b><span>artefacts indexed</span></div>
  <div class="stat"><b>${census.referenced}</b><span>referenced &mdash; bytes upstream</span></div>
  <div class="stat"><b>${census.materialized}</b><span>materialized here</span></div>
  <div class="stat"><b>${ix.version ?? "&mdash;"}</b><span>IG version</span></div>
  <div class="stat"><b>${(ix.fhirVersion ?? []).join(", ") || "&mdash;"}</b><span>FHIR version</span></div>
</div>`;

  const prov = `
<h2>Where this came from</h2>
<p class="lede">No FHIR IG publishes an artefact-index document. What looks like one &mdash;
<code>ValueSets.schema.json</code> at the published root &mdash; is a JSON <em>Schema</em> describing the
shape of an enumeration response, carrying an <code>example</code> that happens to hold the list.
So this index was <strong>reconstructed</strong>, and every part of it records which published file it came out of.</p>
<div class="prov"><dl>
${Object.entries(ix.provenance)
  .map(
    ([k, v]) =>
      `<dt>${esc(k)}</dt><dd class="mono">${esc(Array.isArray(v) ? v.join(", ") : String(v))}</dd>`,
  )
  .join("\n")}
<dt>source</dt><dd class="mono">${esc(ix.source.kind)} &mdash; ${esc(ix.source.of)} (read ${esc(ix.source.readAt)})</dd>
<dt>canonical base</dt><dd class="mono">${esc(ix.canonicalBase ?? "not established")}</dd>
</dl></div>`;

  const dakSection = `
<h2>DAK API surface</h2>
<p class="lede">The IG publishes a DAK API for ${dak.schema} of its artefacts. The four sidecars are
issued independently &mdash; every ValueSet gets all four, the logical models get two &mdash; which is why they are
counted separately rather than as one &ldquo;has DAK&rdquo; tally.</p>
<div class="grid">
  <div class="stat"><b>${dak.schema}</b><span>JSON Schema</span></div>
  <div class="stat"><b>${dak.displays}</b><span>displays</span></div>
  <div class="stat"><b>${dak.openapi}</b><span>OpenAPI</span></div>
  <div class="stat"><b>${dak.jsonld}</b><span>JSON-LD</span></div>
  <div class="stat"><b>${(ix.contexts ?? []).length}</b><span>JSON-LD contexts</span></div>
</div>
${
  (ix.contexts ?? []).length
    ? `<table><thead><tr><th>Context</th><th>Published at</th></tr></thead><tbody>
${(ix.contexts ?? [])
  .map((c) => `<tr><td class="mono">${esc(c.id)}</td><td><a href="${esc(c.representation.url)}">${esc(c.representation.url)}</a></td></tr>`)
  .join("\n")}
</tbody></table>`
    : ""
}`;

  // Resolved from provenance + the source base, never composed from a guess:
  // `provenance.artifactsHtml` names the file the categories were read out of,
  // and `source.of` is where that file is published.
  const upstreamArtifacts = ix.provenance.artifactsHtml
    ? `${ix.source.of.replace(/\/$/, "")}/${ix.provenance.artifactsHtml}`
    : undefined;

  const sections = ordered
    .map(([cat, list]) => {
      const label = cat ?? "Not listed on the IG's artefact page";
      if (list.length > INLINE_LIMIT) {
        const byType = new Map<string, number>();
        for (const a of list) byType.set(a.resourceType, (byType.get(a.resourceType) ?? 0) + 1);
        const withDak = list.filter((a) => a.dak).length;
        const types = [...byType.entries()]
          .sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]))
          .map(([t, n]) => `<tr><td>${esc(t)}</td><td style="text-align:right">${n}</td></tr>`)
          .join("\n");
        return `<details>
  <summary><span>${esc(label)}</span><span class="n">${list.length}</span></summary>
  <div class="inner">
  <p class="lede">These ${list.length} are <strong>summarised rather than listed</strong>: over
  ${INLINE_LIMIT} in one category, and ${
    withDak === 0
      ? "none of them carries a DAK API sidecar, so none has an artefact page here to link to"
      : `${withDak} of them carry a DAK API sidecar &mdash; those appear under their own categories above`
  }. They are instance data of the trust network rather than definitional artefacts.</p>
  <table>
    <thead><tr><th>Resource type</th><th style="text-align:right">Count</th></tr></thead>
    <tbody>
${types}
    </tbody>
  </table>
  <p>Read them upstream, where the IG documents them in full:${
    upstreamArtifacts
      ? `\n  <a href="${esc(upstreamArtifacts)}">${esc(upstreamArtifacts)}</a>.`
      : " the IG published no artefact page, so there is nowhere to link."
  }
  Every one is also in this instance's <code>fhir-artifact-index/index.json</code>, with its canonical
  URL and published representations &mdash; that file is the index, this page is only a reading of it.</p>
  </div>
</details>`;
      }
      const rows = [...list]
        .sort((a, b) => a.key.localeCompare(b.key))
        .map((a) => {
          const name = a.title ?? a.name ?? a.id;
          const linked = a.dak
            ? `<a href="./artifact/${esc(pageName(a))}.html">${esc(name)}</a>`
            : esc(name);
          const state =
            a.materialization.state === "materialized"
              ? `<span class="tag held">materialized</span>`
              : `<span class="tag ref">referenced</span>`;
          return `<tr>
  <td>${linked}<br><span class="mono" style="color:var(--muted)">${esc(a.key)}</span></td>
  <td class="mono">${a.canonical ? esc(a.canonical) : "<span style='color:var(--muted)'>no canonical URL</span>"}</td>
  <td class="reps">${repLinks(a)}</td>
  <td>${state}</td>
</tr>`;
        })
        .join("\n");
      return `<details>
  <summary><span>${esc(label)}</span><span class="n">${list.length}</span></summary>
  <div class="inner">
  <table>
    <thead><tr><th>Artefact</th><th>Canonical URL</th><th>Published as</th><th>Bytes</th></tr></thead>
    <tbody>
${rows}
    </tbody>
  </table>
  </div>
</details>`;
    })
    .join("\n");

  const body = `
<p class="lede">The artefact index of the WHO SMART Trust Implementation Guide, rebuilt from what the IG
publishes. Most of it is catalogued <strong>by reference</strong>: the index records where each artefact
lives and holds none of its bytes. A <span class="tag ref">referenced</span> row is not a broken one &mdash;
it means upstream, not here.</p>
${stats}
${prov}
${dakSection}
<h2>Every artefact, by category</h2>
<p class="lede">Grouped as the IG's own <code>artifacts.html</code> groups them. An artefact with a DAK API
sidecar links through to its own page; the rest link out to the published representations.</p>
${sections}
`;
  return shell(
    "WHO SMART Trust — artefact index",
    `All ${ix.count} artefacts of the WHO SMART Trust IG ${ix.version ?? ""}, reconstructed from its published output.`,
    body,
  );
}

function artifactPage(ix: FhirArtifactIndex, a: FhirArtifact): string {
  const name = a.title ?? a.name ?? a.id;
  const dakRows = (["schema", "displays", "openapi", "jsonld"] as const)
    .map((k) => {
      const r = a.dak?.[k];
      const label = { schema: "JSON Schema", displays: "Displays", openapi: "OpenAPI", jsonld: "JSON-LD" }[k];
      if (!r) return `<tr><td>${label}</td><td colspan="2" style="color:var(--muted)">not published for this artefact</td></tr>`;
      return `<tr>
  <td>${label}</td>
  <td><a href="${esc(r.url)}">${esc(r.url)}</a></td>
  <td class="mono">${r.localPath ? esc(r.localPath) : "<span style='color:var(--muted)'>by reference</span>"}</td>
</tr>`;
    })
    .join("\n");

  const counts: string[] = [];
  if (a.dak?.codeCount !== undefined) counts.push(`<div class="stat"><b>${a.dak.codeCount}</b><span>codes</span></div>`);
  if (a.dak?.propertyCount !== undefined) counts.push(`<div class="stat"><b>${a.dak.propertyCount}</b><span>properties</span></div>`);

  const body = `
<a class="back" href="../index.html">&larr; all ${ix.count} artefacts</a>
<h2 style="margin-top:6px">${esc(name)}</h2>
<p class="mono" style="color:var(--muted)">${esc(a.key)}</p>
${a.description ? `<p class="lede">${esc(a.description)}</p>` : ""}
<div class="grid">
  <div class="stat"><b>${esc(a.resourceType)}</b><span>resource type</span></div>
  <div class="stat"><b>${esc(a.version ?? "&mdash;")}</b><span>version</span></div>
  <div class="stat"><b>${esc(a.category ?? "&mdash;")}</b><span>category</span></div>
  ${counts.join("\n  ")}
</div>

<h3>Identity and bytes are different questions</h3>
<table><tbody>
<tr><td style="width:12rem">Canonical URL</td><td class="mono">${a.canonical ? esc(a.canonical) : "<span style='color:var(--muted)'>none &mdash; examples and instances have no canonical URL</span>"}</td></tr>
<tr><td>Published</td><td class="reps">${repLinks(a)}</td></tr>
<tr><td>Materialization</td><td>${
    a.materialization.state === "materialized"
      ? `<span class="tag held">materialized</span> &mdash; ${esc(a.materialization.purpose ?? "")} copy, regenerable by re-running the ingest`
      : `<span class="tag ref">referenced</span> &mdash; upstream, not held here`
  }</td></tr>
</tbody></table>

<h3>DAK API</h3>
<p class="lede">The four sidecars are published independently, so an absent one is a fact about the IG
rather than a gap in this index.</p>
<table>
<thead><tr><th>Sidecar</th><th>Published at</th><th>Held locally</th></tr></thead>
<tbody>
${dakRows}
</tbody></table>
`;
  return shell(
    `${name} — WHO SMART Trust artefact`,
    `${a.key} in the WHO SMART Trust IG, with its canonical URL, published representations and DAK API sidecars.`,
    body,
    1,
  );
}

// ── Build ──────────────────────────────────────────────────────────────
if (!existsSync(INDEX)) {
  console.error(`could not determine: no artefact index at ${INDEX}`);
  console.error("  Nothing was rendered, and this is NOT a clean run. Run `bun run ingest:ig` first.");
  process.exit(2);
}

const parsed = FhirArtifactIndexSchema.safeParse(JSON.parse(readFileSync(INDEX, "utf8")));
if (!parsed.success) {
  console.error("the committed artefact index does not validate — refusing to render pages from it:");
  for (const i of parsed.error.issues.slice(0, 5)) console.error(`  ${i.path.join(".")}: ${i.message}`);
  process.exit(1);
}
const ix = parsed.data;

const pages = new Map<string, string>();
// WRITTEN AS `.md`, LINKED AS `.html` — and the mismatch is correct. Jekyll
// renders `index.md` to `index.html`, so every in-page href above keeps
// pointing at the URL that will exist. Writing `.html` here instead would ask
// Jekyll to copy the file verbatim, which is the behaviour this change exists
// to stop.
pages.set("index.md", indexPage(ix));
for (const a of ix.artifacts) {
  if (!a.dak) continue;
  pages.set(join("artifact", `${pageName(a)}.md`), artifactPage(ix, a));
}

function committed(): Map<string, string> {
  const out = new Map<string, string>();
  const walk = (dir: string, prefix = ""): void => {
    if (!existsSync(dir)) return;
    for (const e of readdirSync(dir, { withFileTypes: true }).sort((x, y) => x.name.localeCompare(y.name))) {
      if (e.name.startsWith(".")) continue;
      const rel = prefix ? join(prefix, e.name) : e.name;
      if (e.isDirectory()) walk(join(dir, e.name), rel);
      else out.set(rel, readFileSync(join(dir, e.name), "utf8"));
    }
  };
  walk(OUT);
  return out;
}

if (CHECK) {
  const have = committed();
  const stale: string[] = [];
  for (const [rel, html] of pages) if (have.get(rel) !== html) stale.push(rel);
  for (const rel of have.keys()) if (!pages.has(rel)) stale.push(`${rel} (orphan — no artefact produces it)`);
  if (stale.length > 0) {
    console.error(`✗ ${stale.length} page(s) stale or orphaned:`);
    for (const s of stale.slice(0, 10)) console.error(`    ${s}`);
    if (stale.length > 10) console.error(`    …and ${stale.length - 10} more`);
    console.error("  Run `bun run smart-trust:pages`. These pages are generated; never edit them.");
    process.exit(1);
  }
  console.log(`✓ smart-trust docs are current — ${pages.size} page(s) over ${ix.count} artefacts`);
} else {
  // Rebuilt wholesale so a removed artefact cannot leave a page behind.
  if (existsSync(OUT)) rmSync(OUT, { recursive: true });
  for (const [rel, html] of pages) {
    const abs = join(OUT, rel);
    mkdirSync(join(abs, ".."), { recursive: true });
    writeFileSync(abs, html);
  }
  const dak = dakOverlayCensus(ix.artifacts);
  console.log(`smart-trust/docs: ${pages.size} page(s)`);
  console.log(`  index over ${ix.count} artefacts in ${byCategory(ix.artifacts).size} categories`);
  console.log(`  ${pages.size - 1} artefact page(s) — the DAK-covered ones (schema=${dak.schema})`);
}
