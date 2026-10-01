#!/usr/bin/env bun
/**
 * Render ANY FHIR IG instance's reader-facing pages from its artefact index.
 *
 * @module fhir-harness/scripts/gen-ig-pages
 * @covers fhir-artifact-index
 *
 * ## Why it lives in fhir-harness
 *
 * This was `smart-trust/scripts/gen-smart-trust-pages.ts`. Nothing in it was
 * about smart-trust except the instance directory, a display label and the
 * instance that owns the template chrome: it reads `fhir-artifact-index/`
 * (`index.json`, optionally `menu.json`), which every ingested IG holds in the
 * same shape. Owner, 2026-10-01 (#1767): *"push generic stuff as much as
 * possible into fhir-harness first"* — so the second IG to want pages
 * (smart-base, for its `/smart-base/` landing page) reuses this rather than
 * copying it, and the generator travels with the layer that owns the index's
 * pipeline when the smart-* instances leave for their own repositories.
 *
 * ## Why this exists
 *
 * `fhir-artifact-index` is registered `renderable: false`, so an instance
 * whose only declared graph of that kind is the index publishes its artefacts
 * at no URL. The owner found it by asking where `/smart-trust` was. Only two
 * of this repository's graph kinds are renderable (`docs` and `folio`); this
 * generator writes an instance's `docs/` from its index.
 *
 * **The URL the owner expected is the right one.** `withRoutes` in
 * `cat-harness/scripts/mount-instance-docs.ts` publishes an instance at
 * `/<kind>/<instance>/` for every renderable kind AND once at `/<instance>/`,
 * its themed root.
 *
 * ## Generated from the index, never transcribed
 *
 * Every artefact, count, canonical URL and link on these pages is read out of
 * `<instance>/fhir-artifact-index/index.json`. Hand-writing them would produce
 * pages that agree with the index exactly once. `--check` keeps that from
 * happening quietly, and it is wired into the gate set per instance.
 *
 * ## What the pages say, and what they refuse to imply
 *
 * **A referenced artefact is not a broken one.** Following `gen-iris-pages.ts`,
 * no row is greyed out: a row stating **referenced** reads as "upstream, not
 * here", which is the actual state and the whole point of cataloguing by
 * reference.
 *
 * **Two link targets, never conflated.** An artefact's canonical URL is its
 * IDENTITY; its published URL is where bytes are served. A WHO IG is canonical
 * at one host and published at another, so composing either from the other
 * would write a link that resolves for nobody. Both come from the index.
 *
 * **The banner's identity is the INDEX's, never the chrome's.** `chrome.json`
 * is ingested once, at the chrome owner, from ONE IG's template chain; its
 * tokens and rules are the TEMPLATE's and hold for every IG built on it, but
 * its `id`/`version`/`status` are that one IG's. Bean `bamf` found smart-base's
 * chrome describing `smart.who.int.trust` 1.8.0. So the banner names the
 * index's `packageId`, `version` and `canonicalBase`, and takes `status` from
 * the chrome ONLY when the chrome's `id` is this IG's — otherwise the status
 * is not determined and no watermark is drawn, rather than another IG's draft
 * status being asserted of this one.
 *
 * **No WHO logo.** Same instruction the who-iris pages follow: until published
 * under WHO, colour carries the identity and the wordmark is set in type.
 *
 * Usage:
 *   bun run fhir-harness/scripts/gen-ig-pages.ts --instance <dir> --label "<IG display name>"
 *     [--chrome-owner <instance>] [--summary] [--check]
 *
 * `--summary` puts the instance's own declaration — its description and every
 * declared graph with its viewer — above the artefact index, via the
 * `harness_details.html` include (with `instance=`), which reads `site.data.harness` at build
 * time. It is how an instance that holds MORE than an IG's artefacts (smart-base:
 * a library, methodologies, voices) gets a landing page that says so without a
 * word of it being typed here.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { isDirectoryReadme } from "../../cat-harness/schemas/kg-node.js";

import { IgMenuSchema, type IgMenu, type IgMenuGroup, menuHref, menuItemCount } from "../schemas/ig-menu.js";
import {
  IgChromeSchema,
  chromeCss,
  chromeFileFor,
  tokenOf,
  type IgChrome,
} from "../schemas/ig-chrome.js";
import {
  declarationPathIn,
  directoriesForGraph,
  instanceRootsIn,
  repoRootFor,
} from "../../cat-harness/schemas/cat-harness.js";

import {
  FhirArtifactIndexSchema,
  materializationCensus,
  dakOverlayCensus,
  byCategory,
  type FhirArtifact,
  type FhirArtifactIndex,
  type Representation,
} from "../../folio-assistant-core/schemas/fhir-artifact-index.js";

/** `--name value`, or undefined. */
function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const INSTANCE_ARG = arg("--instance");
if (!INSTANCE_ARG) {
  console.error("usage: gen-ig-pages.ts --instance <dir> --label <name> [--chrome-owner <instance>] [--summary] [--check]");
  process.exit(2);
}
const INSTANCE = resolve(process.cwd(), INSTANCE_ARG);
const INSTANCE_NAME = basename(INSTANCE);
const INDEX = join(INSTANCE, "fhir-artifact-index", "index.json");
/**
 * The IG's OWN navigation, ingested from its `sushi-config.yaml`.
 *
 * OPTIONAL, and its absence is a third state rather than "this IG has no
 * menu": `ingest-ig-menu.ts` needs the upstream source checkout, which is not
 * on every machine. Absent → the menu sections are not written and the build
 * SAYS so; it does not quietly render a site with no navigation and call it
 * complete.
 */
const MENU = join(INSTANCE, "fhir-artifact-index", "menu.json");
const OUT = join(INSTANCE, "docs");

/**
 * The instance that OWNS the template chrome, or none.
 *
 * Named rather than walked to, and `schemas/ig-chrome.ts` §`chromeFileFor`
 * carries why: `smart-trust` needs `smart-ig` while `smart-base` needs
 * `fhir-harness`, so there is no `needs` path between them to walk. Widening
 * the walk until one matched would settle a layering question — `nsbb`'s —
 * inside a stylesheet loader. A FLAG rather than a constant now that the
 * generator is generic: fhir-harness has no business naming a WHO instance.
 */
const CHROME_OWNER = arg("--chrome-owner");

/**
 * The IG's display name — `WHO SMART Trust`. Not in the index (whose `title`
 * is the package id plus "— artefact index"), so it is the one string a
 * caller supplies; the package id stands in when none is given.
 */
const LABEL_ARG = arg("--label");

/** Whether the index page opens with the instance's own declaration. */
const SUMMARY = process.argv.includes("--summary");

/** The declaration's `name`, or `undefined` when a directory is not an instance. */
function declaredName(root: string): string | undefined {
  const decl = declarationPathIn(root);
  if (decl === undefined) return undefined;
  try {
    return (JSON.parse(readFileSync(decl, "utf8")) as { name?: string }).name;
  } catch {
    // Unparseable is "could not determine", never "not smart-base": returning
    // a name here would make a broken sibling silently supply the chrome.
    return undefined;
  }
}

/**
 * The IG's chrome, ingested from its template chain — OPTIONAL, like the menu.
 *
 * Absent is a third state rather than "this IG has no chrome":
 * `ingest-ig-chrome.ts` needs three upstream checkouts, which are on no CI
 * runner. Absent -> the pages render without WHO's palette and the build SAYS
 * so, rather than quietly shipping unstyled pages and calling them a mirror.
 */
function loadChrome(): IgChrome | undefined {
  if (CHROME_OWNER === undefined) return undefined;
  const file = chromeFileFor(repoRootFor(INSTANCE), CHROME_OWNER, {
    instanceRootsIn,
    declarationNameOf: declaredName,
    directoriesForGraph: (root, graph) => directoriesForGraph(root, graph),
    exists: existsSync,
    join,
  });
  if (file === undefined) return undefined;
  const parsed = IgChromeSchema.safeParse(JSON.parse(readFileSync(file, "utf8")));
  if (!parsed.success) {
    console.error(`the committed IG chrome does not validate — refusing to style from it:`);
    for (const i of parsed.error.issues.slice(0, 5)) console.error(`  ${i.path.join(".")}: ${i.message}`);
    process.exit(1);
  }
  return parsed.data;
}

const CHROME = loadChrome();

/**
 * Where the mirrored chrome applies.
 *
 * SCOPED, never `:root`. The IG Publisher can put WHO's palette on `:root`
 * because every document it builds is the IG's; ours are folio pages that
 * happen to carry a mirror, and a bare `:root` block would repaint the whole
 * site the moment one of these pages loaded.
 */
const CHROME_SCOPE = ".st-ig";

/**
 * The IG's own status banner — the blue bar and, while it is a draft, the
 * watermark.
 *
 * **The VALUES are WHO's; the MARKUP is ours, and the difference is the ask.**
 * The owner wanted our pages to mirror the WHO IG *"except navar menu is now
 * on LHS"* — so reproducing the template's Bootstrap `.navbar-inverse` would
 * rebuild the very top bar that was moved. What is mirrored is the palette and
 * the watermark; what is ours is a header element that consumes them.
 *
 * `#ig-status`'s class comes from the IG's OWN `status` (`draft` here), read
 * from `sushi-config.yaml` by the ingest, exactly as the template's
 * `fragment-pagebegin.html` does it. Nothing here decides that smart-trust is
 * a draft.
 */
function igBanner(chrome: IgChrome, ix: FhirArtifactIndex): string {
  const title = ix.packageId ?? chrome.id;
  const canonical = ix.canonicalBase ?? chrome.canonical;
  const status = statusFor(chrome, ix);
  const label = [ix.version ?? chrome.version, status].filter(Boolean).join(" — ");
  return [
    `<div class="${CHROME_SCOPE.slice(1)}">`,
    `  <div class="st-ig-bar"><a href="${esc(canonical)}">${esc(title)}</a></div>`,
    status !== undefined
      ? `  <div id="ig-status" class="ig-status-${esc(status)}">`
      : `  <div id="ig-status">`,
    `    <p><span class="st-ig-title">${esc(LABEL)}</span><br/><span>${esc(label)}</span></p>`,
    `  </div>`,
    `  <p id="publish-box">This page mirrors a published WHO Implementation Guide. ` +
      `The authoritative version is at <a href="${esc(canonical)}">${esc(canonical)}</a>.</p>`,
    `</div>`,
  ].join("\n");
}

/**
 * The IG's publication status — from the chrome only when the chrome was
 * ingested from THIS IG. See the module doc: another IG's `draft` is not a
 * fact about this one, and `undefined` draws no watermark rather than a wrong one.
 */
function statusFor(chrome: IgChrome, ix: FhirArtifactIndex): string | undefined {
  return ix.packageId !== undefined && chrome.id === ix.packageId ? chrome.status : undefined;
}

/**
 * The chrome's stylesheet, plus the handful of rules OUR markup needs.
 *
 * `chromeCss` emits the ingested tokens and the mirrored rules. The three
 * added here style elements the template has no equivalent of, and every
 * colour in them is `var(--…)` off an ingested token rather than a literal —
 * a hex typed here would be exactly the transcription this whole pipeline
 * exists to avoid.
 */
function chromeStyles(chrome: IgChrome): string {
  const bar = tokenOf(chrome, "--navbar-bg-color") ? "var(--navbar-bg-color)" : "currentColor";
  const ink = tokenOf(chrome, "--ig-status-text-color") ? "var(--ig-status-text-color)" : "currentColor";
  return (
    chromeCss(chrome, CHROME_SCOPE) +
    `${CHROME_SCOPE} .st-ig-bar{background:${bar};padding:.5rem .8rem;border-radius:4px 4px 0 0}\n` +
    `${CHROME_SCOPE} .st-ig-bar a{color:#fff;font-weight:600;text-decoration:none}\n` +
    `${CHROME_SCOPE} .st-ig-title{font-size:12pt;font-weight:bold;color:${ink}}\n`
  );
}

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
 * A category's own page name, sanitised the same way an artefact's is.
 *
 * Categories are free text out of the IG (`Requirements: Formal Requirements`,
 * `Terminology: Value Sets`), so the colon and the spaces have to go before
 * this is a filename. Uses `pageName`'s character class rather than a second
 * one, because two sanitisers are two answers to "what is a safe name".
 */
function categoryName(label: string | undefined): string {
  return (label ?? "Other").replace(/[^A-Za-z0-9._-]/g, "_");
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
/**
 * Where a page sits in the LEFT-HAND NAV — three roles, not a depth number.
 *
 * It was `depth = 0 | 1`, and one number was carrying two different facts: a
 * CATEGORY page and an ARTEFACT page both passed `1`, so the `nav_exclude`
 * written for the 674 leaves swept out the 7 category pages with them. The
 * sidebar showed exactly ONE smart-trust row — the index — and the structure
 * this index is grouped by was invisible in the one place a reader navigates
 * from.
 *
 * The comment that justified it was right about the leaves and wrong about the
 * sections: *"674 artefacts would bury the sidebar's real structure"* — the
 * categories ARE that structure. Two facts, two values, so the next person
 * cannot accidentally exclude one by describing the other.
 */
type NavRole =
  /** The front door. Carries the children. */
  | { kind: "index" }
  /** One of the 7 categories — a listed child of the index. */
  | { kind: "section"; order: number }
  /** One of the 674 artefacts. Excluded: a leaf per artefact buries the rest. */
  | { kind: "leaf" };

/**
 * The index page's title, and the string a section names as its `parent`.
 *
 * just-the-docs matches a child to its parent BY TITLE, so these two cannot be
 * written independently — one constant, referenced twice, or a re-titled index
 * silently orphans all 7 sections and the sidebar quietly flattens.
 */
let LABEL = LABEL_ARG ?? INSTANCE_NAME;
/**
 * With `--summary` the index page IS the instance's landing page, so it carries
 * the IG's name alone; without it, it is the artefact index and says so.
 */
const titleFor = (label: string): string => (SUMMARY ? label : `${label} — artefact index`);
let INDEX_TITLE = titleFor(LABEL);

function navFrontMatter(nav: NavRole): string[] {
  switch (nav.kind) {
    case "index":
      return ["has_children: true"];
    case "section":
      return [`parent: ${yamlScalar(INDEX_TITLE)}`, `nav_order: ${nav.order}`];
    case "leaf":
      // Still excluded, and for the reason the original comment gave: 674
      // leaves would bury the sidebar. Unchanged behaviour, now stated of the
      // case it was actually meant for.
      return ["nav_exclude: true"];
  }
}

/**
 * Whether a page carries the IG chrome.
 *
 * Owner, 2026-09-23, on the navbar: *"etc... common fixture unless explicty
 * removed in harness visualtion."* The same rule governs the chrome, and it is
 * a DEFAULT-ON parameter rather than a list of pages that opt in — the two are
 * not the same thing. A list of opted-in pages makes every page added later
 * silently bare, and nobody notices, because a missing fixture looks exactly
 * like a page that was never meant to have one. Default-on inverts that: a
 * page without the chrome had to say so.
 */
type ChromeChoice = "fixture" | "removed";

function shell(
  title: string,
  description: string,
  body: string,
  nav: NavRole = { kind: "index" },
  chrome: ChromeChoice = "fixture",
): string {
  const fm = [
    "---",
    `title: ${yamlScalar(title)}`,
    `description: ${yamlScalar(description)}`,
    ...navFrontMatter(nav),
    "---",
    "",
  ].join("\n");
  // The remaining styling rides inside the page rather than in a `<head>` this
  // file no longer owns. It is now the handful of rules just-the-docs has no
  // opinion about; everything the theme already provides was removed rather
  // than overridden.
  // The chrome is mirrored only when it was actually ingested. Absent, the
  // page renders as an ordinary folio page: a mirror nobody could build is
  // reported by the build, never faked with a hand-typed palette.
  const wearsChrome = chrome === "fixture" && CHROME !== undefined;
  const style = wearsChrome ? `${CSS}\n${chromeStyles(CHROME!)}` : CSS;
  const banner = wearsChrome ? `${igBanner(CHROME!, IX)}\n\n` : "";
  return `${fm}<style>${style}</style>\n\n${banner}${body.trim()}\n`;
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
        // OVER THE INLINE LIMIT — the category gets its own page.
        //
        // This block used to read "None carries a DAK API sidecar, so none has
        // an artefact page; they are reachable from the IG's own
        // `artifacts.html`." Both halves stopped being true when every
        // artefact started getting a page, and a sentence sending the reader
        // upstream for pages this site now publishes is worse than no
        // sentence. The owner's INLINE_LIMIT ruling still holds — the index
        // came to 524KB with one category 90% of it — so the list moves to a
        // page of its own rather than inline.
        return [
          `<details markdown="1">`,
          `<summary><strong>${esc(name)}</strong> — ${list.length}</summary>`,
          ``,
          `${list.length} artefacts — too many to list here without the index becoming`,
          `unreadable. Every one has its own page: **[browse all ${list.length}](./category/${categoryName(label)}.html)**.`,
          ``,
          `</details>`,
        ].join("\n");
      }
      // `markdown="1"`, or the table inside prints as rows of pipes. Kramdown
      // does not parse Markdown inside an HTML block unless told to, so the
      // whole artefact table shipped as raw text on the live index — found by
      // `check:escaped-markup`'s leaked-table scan (bean `7w1a`, 2026-09-24).
      return [
        `<details markdown="1">`,
        `<summary><strong>${esc(name)}</strong> — ${list.length}</summary>`,
        ``,
        ...artifactTable(list, "."),
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
    `The artefact index of the ${LABEL} Implementation Guide, rebuilt from what the IG`,
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

  // The instance's own declaration, ABOVE the index, when asked for. A Liquid
  // include rather than text written here: the description and the viewer
  // links are harness-tiles' answer (`site.data.harness`), and a second copy
  // of them in this page would be a second answer free to drift.
  const summary = SUMMARY
    ? `{% include harness_details.html instance=${yamlScalar(INSTANCE_NAME)} %}\n\n## Artefact index\n\n`
    : "";
  return shell(
    INDEX_TITLE,
    `All ${ix.count} artefacts of the ${LABEL} IG ${ix.version ?? ""}, reconstructed from its published output.`,
    summary + body,
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
/**
 * The artefact table, shared by the index and by a category page.
 *
 * `base` is the prefix an `artifact/…` link needs from the page being written
 * — `.` from `index.md`, `..` from `category/X.md`. Passed rather than derived
 * so a third caller at a third depth cannot silently inherit the wrong one.
 *
 * **`.html`, never a trailing slash.** This site sets no `permalink`, so
 * Jekyll's default emits `artifact/Name.html`; a directory-style link 404s on
 * every row, and only once BUILT, which no check on the source can see. That
 * defect shipped once already (issue #824) and the only test that catches it
 * reads the href out of the page and resolves it back to a file.
 */
function artifactTable(list: FhirArtifact[], base: string): string[] {
  return [
    `| Artefact | Canonical URL | Published as | Bytes |`,
    `|---|---|---|---|`,
    ...list.map((a) => {
      const nm = a.title ?? a.name ?? a.id;
      const linked = `[${mdCell(nm)}](${base}/artifact/${pageName(a)}.html)`;
      const canonical = a.canonical ? `\`${mdCell(a.canonical)}\`` : "*no canonical URL*";
      return `| ${linked}<br>\`${mdCell(a.key)}\` | ${canonical} | ${mdCell(repLinks(a))} | ${stateTag(a)} |`;
    }),
  ];
}

/**
 * One category, listed in full, for a category too large to inline.
 *
 * Exists so that "too many to list here" can point somewhere instead of
 * pointing upstream. Before this, the 604-artefact `Other` bucket told the
 * reader to go to the IG's own `artifacts.html` — a sentence that was true
 * only while those artefacts had no pages here.
 */
/**
 * `order` is the category's position in `byCategory`, passed in rather than
 * derived here: the index page already iterates that map to build its own
 * sections, so the sidebar and the page body are ordered by ONE traversal and
 * cannot disagree about which category comes first.
 */
function categoryPage(ix: FhirArtifactIndex, label: string | undefined, list: FhirArtifact[], order: number): string {
  const name = label ?? "Other";
  const body = [
    `[← all ${ix.count} artefacts](../)`,
    ``,
    `## ${name}`,
    ``,
    `${list.length} of the ${ix.count} artefacts in this IG. Listed here rather than on the`,
    `index because a table this size makes the front page unreadable.`,
    ``,
    ...artifactTable(list, ".."),
    ``,
  ].join("\n");

  return shell(
    `${name} — ${LABEL}`,
    `The ${list.length} ${LABEL} artefacts in the ${name} category, with canonical URLs and published representations.`,
    body,
    { kind: "section", order },
  );
}

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
    // The sidecar table is worth a screen when there ARE sidecars. On the 655
    // artefacts with none it was four rows of "*not published for this
    // artefact*", which is noise dressed as information — so the absence is
    // stated in one line instead, and it is STATED rather than omitted,
    // because a missing section reads as "nobody looked".
    ...(a.dak
      ? [
          `## DAK API`,
          ``,
          `The four sidecars are published independently, so an absent one is a fact about the`,
          `IG rather than a gap in this index.`,
          ``,
          `| Sidecar | Published at | Held locally |`,
          `|---|---|---|`,
          ...dakRows,
          ``,
        ]
      : [
          `## DAK API`,
          ``,
          `No DAK API sidecar is published for this artefact. That is a fact about the IG,`,
          `not a gap in this index — sidecars are published per artefact, and`,
          `${ix.artifacts.filter((x) => x.dak).length} of ${ix.count} carry one.`,
          ``,
        ]),
  ].join("\n");

  return shell(
    `${name} — ${LABEL} artefact`,
    `${a.key} in the ${LABEL} IG, with its canonical URL, published representations and DAK API sidecars.`,
    body,
    { kind: "leaf" },
  );
}

/**
 * One page per top-level menu group — which is how the IG's TOP BAR becomes a
 * LEFT-HAND nav.
 *
 * The owner, 2026-09-23: *"navar menu is now on LHS"*. just-the-docs builds
 * its sidebar from the PAGES in the collection, so an entry in it has to be a
 * page; there is no per-folio hook for a bare external link. A page per group
 * is therefore the mechanism, not a workaround — and it is the honest one,
 * because each group genuinely has something to say: the list of its members
 * and where they are published.
 *
 * **Every link points UPSTREAM, and that is not a shortfall.** These pages are
 * published by the IG Publisher and this repository does not hold them — the
 * gh-pages harvest kept 674 FHIR artefacts and none of the narrative pages
 * (measured: 0 of 12 menu labels matched an artefact title). A page here that
 * pretended to hold `system-actors.html` would be fabricating content; one
 * that links to the canonical copy is a navigation aid, which is what a menu
 * is.
 */
function menuGroupPage(menu: IgMenu, group: IgMenuGroup, order: number): string {
  const rows = group.items.map((it) => `- [${mdCell(it.label)}](${menuHref(menu, it)})`);
  const body = [
    `[← all ${menu.groups.length} sections](../)`,
    ``,
    ...(group.items.length > 0
      ? rows
      : [
          // A group the config declares with no children. Stated, because an
          // empty list and a page that failed to render look the same.
          `*${mdCell(group.label)} carries no sub-items in \`sushi-config.yaml\`.*`,
        ]),
    ``,
    ...(group.href ? [`This section's own page: [${mdCell(group.label)}](${menuHref(menu, group)}).`, ``] : []),
    `Published by the IG at \`${menu.canonical}\`. This repository holds the IG's`,
    `artefacts, not its narrative pages, so every link above leaves for the canonical copy.`,
  ].join("\n");
  return shell(
    `${group.label} — ${LABEL}`,
    `The ${group.items.length} page(s) the ${LABEL} IG publishes under ${group.label}.`,
    body,
    { kind: "section", order },
  );
}

/** A filename-safe slug, on the same rule `categoryName` uses. */
function menuName(label: string): string {
  return label.replace(/[^A-Za-z0-9._-]/g, "_");
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
const IX = ix;
if (LABEL_ARG === undefined && ix.packageId) {
  LABEL = ix.packageId;
  INDEX_TITLE = titleFor(LABEL);
}

const pages = new Map<string, string>();
// WRITTEN AS `.md`, LINKED AS `.html` — and the mismatch is correct. Jekyll
// renders `index.md` to `index.html`, so every in-page href above keeps
// pointing at the URL that will exist. Writing `.html` here instead would ask
// Jekyll to copy the file verbatim, which is the behaviour this change exists
// to stop.
pages.set("index.md", indexPage(ix));

// EVERY artefact, not only the sidecar-bearing ones. The owner's call,
// 2026-09-22: full parity with the Publisher's 673 artefact pages, against a
// recommendation to render only the 70 conformance artefacts and leave the 604
// Endpoint/Organization registry rows as index rows. Recorded because the
// trade-off is real and the reasoning should not have to be reconstructed:
// 454 of those 604 carry no `description`, so their pages are a title and four
// upstream links.
for (const a of ix.artifacts) {
  pages.set(join("artifact", `${pageName(a)}.md`), artifactPage(ix, a));
}

// A page for each category too large to inline, so "too many to list here"
// points somewhere. Driven by the SAME `INLINE_LIMIT` comparison the index
// makes — one threshold, read twice, rather than two that can disagree.
// THE IG'S MENU, FIRST IN THE SIDEBAR — it is the IG's own ordering of itself,
// and the artefact categories are this repository's view on top of it.
let sectionOrder = 0;
let menu: IgMenu | undefined;
if (existsSync(MENU)) {
  const m = IgMenuSchema.safeParse(JSON.parse(readFileSync(MENU, "utf8")));
  if (!m.success) {
    console.error("the committed IG menu does not validate — refusing to render nav from it:");
    for (const i of m.error.issues.slice(0, 5)) console.error(`  ${i.path.join(".")}: ${i.message}`);
    process.exit(1);
  }
  menu = m.data;
  for (const group of menu.groups) {
    sectionOrder += 1;
    pages.set(join("menu", `${menuName(group.label)}.md`), menuGroupPage(menu, group, sectionOrder));
  }
}

for (const [label, list] of byCategory(ix.artifacts)) {
  if (list.length > INLINE_LIMIT) {
    sectionOrder += 1;
    pages.set(join("category", `${categoryName(label)}.md`), categoryPage(ix, label, list, sectionOrder));
  }
}

function committed(): Map<string, string> {
  const out = new Map<string, string>();
  const walk = (dir: string, prefix = ""): void => {
    if (!existsSync(dir)) return;
    for (const e of readdirSync(dir, { withFileTypes: true }).sort((x, y) => x.name.localeCompare(y.name))) {
      if (e.name.startsWith(".")) continue;
      const rel = prefix ? join(prefix, e.name) : e.name;
      // The directory's own README is written by `subgraph-readmes`, not by
      // this generator, so it is neither one of these pages nor an orphan.
      if (!e.isDirectory() && isDirectoryReadme(rel)) continue;
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
    console.error(`  Run \`bun run ${INSTANCE_NAME}:pages\`. These pages are generated; never edit them.`);
    process.exit(1);
  }
  console.log(`✓ ${INSTANCE_NAME} docs are current — ${pages.size} page(s) over ${ix.count} artefacts`);
} else {
  // Rebuilt wholesale so a removed artefact cannot leave a page behind — all
  // but the directory's README, which another generator owns and is carried
  // across the rebuild unchanged.
  const readme = join(OUT, "README.md");
  const keptReadme = existsSync(readme) ? readFileSync(readme, "utf8") : undefined;
  if (existsSync(OUT)) rmSync(OUT, { recursive: true });
  if (keptReadme !== undefined) {
    mkdirSync(OUT, { recursive: true });
    writeFileSync(readme, keptReadme);
  }
  for (const [rel, html] of pages) {
    const abs = join(OUT, rel);
    mkdirSync(join(abs, ".."), { recursive: true });
    writeFileSync(abs, html);
  }
  const dak = dakOverlayCensus(ix.artifacts);
  console.log(`${INSTANCE_NAME}/docs: ${pages.size} page(s)`);
  console.log(`  index over ${ix.count} artefacts in ${byCategory(ix.artifacts).size} categories`);
  // Counted from the page map, never as `pages.size - 1`. That expression was
  // right while the index was the only non-artefact page and quietly became
  // wrong the moment a category page joined it — it reported 675 artefact
  // pages over a corpus of 674.
  const artefactPages = [...pages.keys()].filter((k) => k.startsWith("artifact/")).length;
  const categoryPages = [...pages.keys()].filter((k) => k.startsWith("category/")).length;
  console.log(`  ${artefactPages} artefact page(s) — one per artefact; ${dak.schema} carry a DAK schema`);
  console.log(`  ${categoryPages} category page(s) — categories over ${INLINE_LIMIT}, listed off the index`);
  // THE MENU IS REPORTED EITHER WAY. An unreported page is a page nothing
  // checks, and an absent menu reported as silence is indistinguishable from
  // an IG that publishes no navigation — which this one plainly does.
  if (menu) {
    console.log(
      `  ${menu.groups.length} menu section(s) — the IG's own top bar, ${menuItemCount(menu)} item(s), ` +
        `from ${menu.source.path} @ ${menu.source.ref.slice(0, 8)}`,
    );
  } else {
    console.log("  0 menu section(s) — COULD NOT DETERMINE: no menu.json.");
    console.log("    Run `ingest-ig-menu.ts --source <ig-repo>`; this is not an IG without navigation.");
  }
  // THE CHROME, SAID OUT LOUD EITHER WAY. Its absence is the same third state
  // the menu's is: unstyled pages and "we mirrored it" look identical from a
  // build log that only mentions the chrome when it is there.
  if (CHROME) {
    const conflicted = CHROME.conflicts.length;
    if (statusFor(CHROME, ix) === undefined) {
      console.log(
        `  status NOT determined — the chrome was ingested from ${CHROME.id}, not ${ix.packageId ?? "this IG"}; ` +
          `no watermark drawn`,
      );
    }
    console.log(
      `  chrome mirrored on every page — ${CHROME.tokens.length} token(s) over ` +
        `${CHROME.layers.length} template layer(s), ${CHROME.rules.length} rule(s); the chrome's own IG is ${CHROME.id} (status "${CHROME.status}")`,
    );
    for (const l of CHROME.layers) console.log(`    ${l.package} ${l.version} @ ${l.ref.slice(0, 8)}`);
    if (conflicted > 0) {
      console.log(`    ${conflicted} upstream defect(s) mirrored verbatim and recorded, not corrected:`);
      for (const c of CHROME.conflicts) {
        console.log(`      ${c.kind} ${c.token} — ${c.sites.map((x) => `${x.package}="${x.value}"`).join(" vs ")}`);
      }
    }
  } else {
    console.log(
      CHROME_OWNER === undefined
        ? "  chrome NOT applied — no --chrome-owner given."
        : "  chrome NOT applied — COULD NOT DETERMINE: no chrome.json.",
    );
    console.log("    Run `ingest-ig-chrome.ts --ig <ig> --layer <base> --layer <next>`; the pages are unstyled, not a mirror.");
  }
}
