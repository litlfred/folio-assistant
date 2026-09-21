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

/**
 * The ONLY styling these pages carry, and it is deliberately tiny.
 *
 * The first version shipped ~100 lines: body font, colours, a `--col` wrap
 * width, a full dark-mode variable set, table borders, link colours. Every one
 * of those duplicated or FOUGHT just-the-docs, which already supplies
 * typography, tables, links, the colour scheme and its dark mode. A page that
 * re-declares `body { ... }` inside a themed site is a standalone document
 * wearing front matter — which is exactly what the owner asked to stop:
 * *"i want the input/page(s)/ content to be rendered viajustthedocs
 * pipeline."*
 *
 * What is left is what the theme has no opinion about: the two
 * materialization tags, which carry MEANING in their colour (held vs
 * referenced) and would otherwise be two words a reader must hold in their
 * head, and the census grid.
 *
 * `currentColor` and the theme's own `--*` custom properties are used wherever
 * possible so these follow the reader's scheme instead of pinning a palette.
 */
const CSS = `
.st-tag{display:inline-block;padding:.05rem .4rem;border-radius:3px;font-size:.75rem;
  font-weight:600;white-space:nowrap;border:1px solid currentColor}
.st-held{color:#0d6e5e}
.st-ref{color:#6b5b95}
.st-grid{display:flex;flex-wrap:wrap;gap:.75rem;margin:1rem 0}
.st-stat{flex:1 1 8rem;border:1px solid rgba(128,128,128,.35);border-radius:6px;padding:.5rem .7rem}
.st-stat b{display:block;font-size:1.25rem;line-height:1.2}
.st-stat span{font-size:.75rem;opacity:.75}
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
  // The remaining styling rides inside the page rather than in a `<head>` this
  // file no longer owns. It is now the handful of rules just-the-docs has no
  // opinion about; everything the theme already provides was removed rather
  // than overridden.
  return `${fm}<style>${CSS}</style>\n\n${body.trim()}\n`;
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
  // Separated by a middot. The old stylesheet gave `.reps` a flex gap; with
  // that gone the four links rendered as one word -- `jsonxmlttlhtml` -- which
  // reads as a broken link rather than as four working ones. A separator in
  // the MARKUP survives the stylesheet being deleted, which is the whole point
  // of having deleted it.
  return out.length ? out.join(" · ") : "—";
}

function indexPage(ix: FhirArtifactIndex): string {
  const census = materializationCensus(ix.artifacts);
  const dak = dakOverlayCensus(ix.artifacts);
  const cats = byCategory(ix.artifacts);
  // Deterministic: named categories by name, the uncategorised bucket last.
  const ordered = [...cats.entries()].sort(([a], [b]) =>
    a === undefined ? 1 : b === undefined ? -1 : a.localeCompare(b),
  );

  const stat = (v: string | number, label: string) =>
    `<div class="st-stat"><b>${esc(String(v))}</b><span>${label}</span></div>`;

  const sections = ordered
    .map(([label, list]) => {
      const name = label ?? "Other";
      if (list.length > INLINE_LIMIT) {
        // Too many to inline; say so and say where they are, rather than
        // rendering a table nobody can read or silently dropping them.
        return [
          `<details>`,
          `<summary><strong>${esc(name)}</strong> — ${list.length}</summary>`,
          ``,
          `${list.length} artefacts, too many to list here. None carries a DAK API sidecar,`,
          `so none has an artefact page; they are reachable from the IG's own`,
          `\`artifacts.html\`.`,
          ``,
          `</details>`,
        ].join("\n");
      }
      const rows = list.map((a) => {
        const nm = a.title ?? a.name ?? a.id;
        // `.html`, not a trailing slash. This site sets no `permalink`, so
        // Jekyll's default emits `artifact/Name.html` -- a directory-style
        // link would 404 on every one of the 19 artefact pages, and it would
        // 404 only once BUILT, which no check on the source could see.
        const linked = a.dak ? `[${mdCell(nm)}](./artifact/${pageName(a)}.html)` : mdCell(nm);
        const canonical = a.canonical ? `\`${mdCell(a.canonical)}\`` : "*no canonical URL*";
        return `| ${linked}<br>\`${mdCell(a.key)}\` | ${canonical} | ${mdCell(repLinks(a))} | ${stateTag(a)} |`;
      });
      return [
        `<details>`,
        `<summary><strong>${esc(name)}</strong> — ${list.length}</summary>`,
        ``,
        `| Artefact | Canonical URL | Published as | Bytes |`,
        `|---|---|---|---|`,
        ...rows,
        ``,
        `</details>`,
      ].join("\n");
    })
    .join("\n\n");

  const provRows = [
    ...Object.entries(ix.provenance).map(
      ([k, v]) => `| ${mdCell(k)} | \`${mdCell(Array.isArray(v) ? v.join(", ") : String(v))}\` |`,
    ),
    `| source | \`${mdCell(ix.source.kind)}\` — \`${mdCell(ix.source.of)}\` (read ${mdCell(ix.source.readAt)}) |`,
    `| canonical base | \`${mdCell(ix.canonicalBase ?? "not established")}\` |`,
  ];

  const body = [
    `The artefact index of the WHO SMART Trust Implementation Guide, rebuilt from what the IG`,
    `publishes. Most of it is catalogued **by reference**: the index records where each artefact`,
    `lives and holds none of its bytes. A ${stateTag({ materialization: { state: "referenced" } } as FhirArtifact)} row`,
    `is not a broken one — it means upstream, not here.`,
    ``,
    `<div class="st-grid">`,
    stat(ix.count, "artefacts indexed"),
    stat(census.referenced, "referenced — bytes upstream"),
    stat(census.materialized, "materialized here"),
    stat(ix.version ?? "—", "IG version"),
    stat((ix.fhirVersion ?? []).join(", ") || "—", "FHIR version"),
    `</div>`,
    ``,
    `## Where this came from`,
    ``,
    `No FHIR IG publishes an artefact-index document. What looks like one —`,
    `\`ValueSets.schema.json\` at the published root — is a JSON *Schema* describing the shape of an`,
    `enumeration response, carrying an \`example\` that happens to hold the list. So this index was`,
    `**reconstructed**, and every part of it records which published file it came out of.`,
    ``,
    `| | |`,
    `|---|---|`,
    ...provRows,
    ``,
    `## DAK API surface`,
    ``,
    `The IG publishes a DAK API for ${dak.schema} of its artefacts. The four sidecars are issued`,
    `independently — every ValueSet gets all four, the logical models get two — which is why they`,
    `are counted separately rather than as one "has DAK" tally.`,
    ``,
    `<div class="st-grid">`,
    stat(dak.schema, "JSON Schema"),
    stat(dak.displays, "displays"),
    stat(dak.openapi, "OpenAPI"),
    stat(dak.jsonld, "JSON-LD"),
    `</div>`,
    ``,
    `## Every artefact, by category`,
    ``,
    `Grouped as the IG's own \`artifacts.html\` groups them. An artefact with a DAK API sidecar links`,
    `through to its own page; the rest link out to the published representations.`,
    ``,
    sections,
    ``,
  ].join("\n");

  return shell(
    "WHO SMART Trust — artefact index",
    `All ${ix.count} artefacts of the WHO SMART Trust IG ${ix.version ?? ""}, reconstructed from its published output.`,
    body,
  );
}

/**
 * One artefact, as MARKDOWN.
 *
 * Headings are `##`, prose is prose, and the two fact tables are markdown
 * tables — so the theme's typography, its dark mode, its anchor links and its
 * table styling all apply, and the page is searchable by just-the-docs'
 * own index rather than being an opaque blob of HTML it copied through.
 *
 * `mdCell` is not fussiness: a markdown table row is delimited by `|`, so a
 * canonical URL or a description containing one silently splits the row into
 * an extra column. Escaping it is the difference between a table and a
 * corrupted one, and the corruption looks like a rendering bug rather than
 * like data.
 */
function mdCell(v: string): string {
  return v.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

/** The materialization state, as the one span whose COLOUR carries meaning. */
function stateTag(a: FhirArtifact): string {
  return a.materialization.state === "materialized"
    ? `<span class="st-tag st-held">materialized</span>`
    : `<span class="st-tag st-ref">referenced</span>`;
}

function artifactPage(ix: FhirArtifactIndex, a: FhirArtifact): string {
  const name = a.title ?? a.name ?? a.id;

  const dakRows = (["schema", "displays", "openapi", "jsonld"] as const).map((k) => {
    const r = a.dak?.[k];
    const label = { schema: "JSON Schema", displays: "Displays", openapi: "OpenAPI", jsonld: "JSON-LD" }[k];
    if (!r) return `| ${label} | *not published for this artefact* | |`;
    const held = r.localPath ? `\`${mdCell(r.localPath)}\`` : "*by reference*";
    return `| ${label} | <${mdCell(r.url)}> | ${held} |`;
  });

  const stats = [
    `<div class="st-stat"><b>${esc(a.resourceType)}</b><span>resource type</span></div>`,
    `<div class="st-stat"><b>${esc(a.version ?? "—")}</b><span>version</span></div>`,
    `<div class="st-stat"><b>${esc(a.category ?? "—")}</b><span>category</span></div>`,
    ...(a.dak?.codeCount !== undefined
      ? [`<div class="st-stat"><b>${a.dak.codeCount}</b><span>codes</span></div>`]
      : []),
    ...(a.dak?.propertyCount !== undefined
      ? [`<div class="st-stat"><b>${a.dak.propertyCount}</b><span>properties</span></div>`]
      : []),
  ].join("");

  const body = [
    // `../` from `artifact/Name.html` is the mount root, which the server
    // resolves to its `index.html`.
    `[← all ${ix.count} artefacts](../)`,
    ``,
    `## ${name}`,
    ``,
    `\`${a.key}\``,
    ``,
    ...(a.description ? [a.description, ``] : []),
    `<div class="st-grid">${stats}</div>`,
    ``,
    `## Identity and bytes are different questions`,
    ``,
    `| | |`,
    `|---|---|`,
    `| Canonical URL | ${a.canonical ? `\`${mdCell(a.canonical)}\`` : "*none — examples and instances have no canonical URL*"} |`,
    `| Published | ${mdCell(repLinks(a))} |`,
    `| Materialization | ${stateTag(a)} — ${
      a.materialization.state === "materialized"
        ? `${mdCell(a.materialization.purpose ?? "")} copy, regenerable by re-running the ingest`
        : "upstream, not held here"
    } |`,
    ``,
    `## DAK API`,
    ``,
    `The four sidecars are published independently, so an absent one is a fact about the`,
    `IG rather than a gap in this index.`,
    ``,
    `| Sidecar | Published at | Held locally |`,
    `|---|---|---|`,
    ...dakRows,
    ``,
  ].join("\n");

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
