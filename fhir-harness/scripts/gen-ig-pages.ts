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
import { basename, join, posix, relative, resolve, sep } from "node:path";
import { compareRoute } from "../../cat-harness/scripts/route-authority.ts";
import { IG_API_HUB_SCRIPT, IG_API_HUB_TEMPLATE, IG_API_VIEW_SCRIPT, igApiHubData, igApiHubFragment, igApiServed, igApiViewData, igApiViews } from "./ig-api-views.ts";
import { igFooterData } from "./ig-footer.ts";
import { JSON_VIEW_SCRIPT, VIEW_PAGE, examplesPage, hasJsonView, historyPage, jsonViewData, mappingsPage, mdText, packageEntries, profileJsonViewData, resourceFacts, resourceTabs, testingPage, type TabPageData } from "./resource-views.ts";
import { isDirectoryReadme } from "../../cat-harness/schemas/kg-node.js";

import { IgMenuSchema, type IgMenu, type IgMenuGroup, menuHref, menuItemCount } from "../schemas/ig-menu.js";
import {
  IgChromeSchema,
  chromeCss,
  chromeFileFor,
  tokenOf,
  type IgChrome,
} from "../schemas/ig-chrome.js";
import { readIgIdentity, statusOf, type IgIdentity } from "../schemas/ig-identity.js";
import { renderedPath, withRendersFrontMatter } from "../../cat-harness/scripts/viewer-declarations.js";
import {
  declarationPathIn,
  directoriesForGraph,
  instanceRootsIn,
  readDeclaration,
  repoRootFor,
} from "../../cat-harness/schemas/cat-harness.js";

import {
  FhirArtifactIndexSchema,
  materializationCensus,
  sidecarCensus,
  byCategory,
  type FhirArtifact,
  type FhirArtifactIndex,
  type Representation,
} from "../schemas/fhir-artifact-index.js";

/** `--name value`, or undefined. */
function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const INSTANCE_ARG = arg("--instance");
if (!INSTANCE_ARG) {
  console.error("usage: gen-ig-pages.ts --instance <dir> --label <name> [--chrome-owner <instance>] [--index <index.json>] [--out <dir>] [--summary] [--check]");
  process.exit(2);
}
const INSTANCE = resolve(process.cwd(), INSTANCE_ARG);
/**
 * The instance's IDENTITY: the `name` its declaration gives, and only
 * without one the directory's name. The two differ in a separated IG
 * repository, where every IG keeps its data under `smart-base/` (owner,
 * 2026-10-02, choosing the plan's layout) but must still publish under its
 * own name. Keyed on the directory, every such IG would publish under
 * `/smart-base/` and collide once one site subscribes to several (bean
 * `rbz3`, measured on the litlfred/smart-trust rehearsal: 2,153 pages
 * changed by the rename alone).
 */
const INSTANCE_NAME = readDeclaration(INSTANCE)?.name ?? basename(INSTANCE);
/**
 * `--index` renders from an index OTHER than the instance's committed one,
 * e.g. one derived from a restored IG Publisher AST by
 * `ast-to-artifact-index.ts`. The instance still supplies the menu and the
 * chrome; only the artefact list comes from the named file.
 */
const INDEX_ARG = arg("--index");
const INDEX = INDEX_ARG ? resolve(process.cwd(), INDEX_ARG) : join(INSTANCE, "fhir-artifact-index", "index.json");
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
/**
 * `--compiled-data <dir>`: where a COMPILED index's files are served, as a
 * path from the docs root (e.g. `../ast-data` beside `docs/`). When set, each
 * artefact page whose materialization is a compiled copy gets a resource
 * section its browser fills from that file: the narrative and the JSON, by
 * the shared loader `assets/ast-resource.js` (skill `visualizer-loading`).
 * The page keeps identity, layout and the pointer; the content is fetched,
 * never baked in. Absent means the files are not served, so no page points
 * at them.
 */
const COMPILED_DATA = arg("--compiled-data")?.replace(/\/+$/, "");
const AST_LOADER = join(import.meta.dir, "templates", "ig-pages", "ast-resource.js");

/** `--out` writes the pages somewhere other than the instance's committed `docs/`. */
const OUT_ARG = arg("--out");
const OUT = OUT_ARG ? resolve(process.cwd(), OUT_ARG) : join(INSTANCE, "docs");
/** The pages' shared stylesheets, under the docs root (one copy each, linked from every page). */
const PAGES_CSS = "assets/ig-pages.css";
const CHROME_CSS = "assets/ig-chrome.css";
/**
 * The Publisher-style footer (#1901): one loader and one data file per IG,
 * linked from every page that wears the fixture, never copied into each.
 */
const IG_FOOTER_SCRIPT = "assets/ig-footer.js";
const IG_FOOTER_DATA = "assets/ig-footer.json";
const IG_FOOTER_LOADER = join(import.meta.dir, "templates", "ig-pages", "ig-footer.js");
const igApiServable = () => igApiServed(INSTANCE);

/** The IG API view pages' Liquid template (`liquid-templates`: a file of this directory, beside its writer). */
const IG_API_VIEW_TEMPLATE = join(import.meta.dir, "templates", "ig-pages", "ig-api-view.liquid");
/** Their one shared loader, copied to `docs/assets/` (bean `680p`, `visualizer-loading`). */
const IG_API_VIEW_LOADER = join(import.meta.dir, "templates", "ig-pages", "ig-api-view.js");
/** The IG API hub page's template and loader — the Publisher's hub page, replicated. */
const IG_API_HUB_LOADER = join(import.meta.dir, "templates", "ig-pages", "ig-api-hub.js");
/** The JSON view pages' template and loader — the Publisher's `<Name>.json.html`. */
const JSON_VIEW_TEMPLATE = join(import.meta.dir, "templates", "ig-pages", "json-view.liquid");
const JSON_VIEW_LOADER = join(import.meta.dir, "templates", "ig-pages", "resource-json.js");
/** The text-only tab pages' template — history, testing, a logical model's examples. */
const TAB_PAGE_TEMPLATE = join(import.meta.dir, "templates", "ig-pages", "tab-page.liquid");
const MAPPINGS_TEMPLATE = join(import.meta.dir, "templates", "ig-pages", "mappings.liquid");
/** An artefact page's IG API section: its template and the loader that builds it from the OpenAPI sidecar. */
const IG_API_OPENAPI_BODY = readFileSync(join(import.meta.dir, "templates", "ig-pages", "ig-api-openapi.liquid"), "utf8");
const IG_API_OPENAPI_LOADER = join(import.meta.dir, "templates", "ig-pages", "ig-api-openapi.js");
const IG_API_OPENAPI_SCRIPT = "assets/ig-api-openapi.js";

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

/**
 * The sentence the banner's publish box opens with. A FLAG, because which
 * publisher an IG mirrors is the caller's to say: fhir-harness knows no
 * particular one (`fhir-harness/AGENTS.md`), so the default names none.
 */
const PUBLISH_NOTE_ARG = arg("--publish-note");
/**
 * The publish box's sentence for an index. A page drawn from the IG Publisher
 * AST cache (`source.kind` `output`) does NOT mirror a published guide, so
 * the default says what it is instead; a caller's `--publish-note` still wins.
 */
const publishNoteFor = (ix: FhirArtifactIndex): string =>
  PUBLISH_NOTE_ARG ??
  (ix.source.kind === "output"
    ? "This page is built from an IG Publisher AST cache, provisional until a full Publisher run."
    : "This page mirrors a published FHIR Implementation Guide.");

/**
 * What the IG calls its per-artefact JSON sidecars (JSON Schema, displays,
 * OpenAPI, JSON-LD). Some publishers brand them; this layer does not, so the
 * label is the caller's and the default is plain.
 */
const SIDECAR_LABEL = arg("--sidecar-label") ?? "IG API";
/**
 * The hub page's name on this site: the Publisher's own, read from the URL the
 * hub was ingested from (`dak-api` for WHO's DAK overlay), so the replica
 * keeps the published name without this layer writing any IG's name down.
 */
const hubPage = (ix: FhirArtifactIndex): string => basename(new URL(ix.igApiHub!.url).pathname).replace(/\.html$/, "");

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
 * THIS IG's identity and status, from `ig-identity.json` beside its own index.
 *
 * Not the chrome's: the chrome is the template chain's and every IG building
 * with it wears it (`folio-ig-chrome/v2`). Absent -> no status is stated and
 * no watermark is drawn, which is the third state rather than "published".
 */
const IDENTITY: IgIdentity | undefined = (() => {
  for (const d of directoriesForGraph(INSTANCE, "fhir-artifact-index")) {
    const found = readIgIdentity(d);
    if (found) return found;
  }
  return undefined;
})();

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
function igBanner(ix: FhirArtifactIndex): string {
  const title = ix.packageId ?? IDENTITY?.id ?? INSTANCE_NAME;
  const canonical = ix.canonicalBase ?? IDENTITY?.canonical ?? "";
  const status = statusFor(ix);
  const label = [ix.version ?? IDENTITY?.version, status].filter(Boolean).join(" — ");
  return [
    `<div class="${CHROME_SCOPE.slice(1)}">`,
    `  <div class="st-ig-bar"><a href="${esc(canonical)}">${esc(title)}</a></div>`,
    status !== undefined
      ? `  <div id="ig-status" class="ig-status-${esc(status)}">`
      : `  <div id="ig-status">`,
    `    <p><span class="st-ig-title">${esc(LABEL)}</span><br/><span>${esc(label)}</span></p>`,
    `  </div>`,
    `  <p id="publish-box">${esc(publishNoteFor(ix))} ` +
      `The authoritative version is at <a href="${esc(canonical)}">${esc(canonical)}</a>.</p>`,
    `</div>`,
  ].join("\n");
}

/**
 * The IG's publication status — from ITS OWN `ig-identity.json`, and only when
 * that file names this index's package. Another IG's `draft` is not a fact
 * about this one, and `undefined` draws no watermark rather than a wrong one.
 */
function statusFor(ix: FhirArtifactIndex): string | undefined {
  return statusOf(IDENTITY, ix.packageId);
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
 * What the uncategorised bucket is called — on its section
 * and, if it ever outgrows the index, its page. Never "Other": the IG HAS a
 * literal "Other" category (`byCategory`), and a coined second one put two
 * sections named "Other" on smart-trust's index, the second holding the IG's
 * own ImplementationGuide resource.
 */
const UNCATEGORISED = "Uncategorised";

/**
 * A category's own page name, sanitised the same way an artefact's is.
 *
 * Categories are free text out of the IG (`Requirements: Formal Requirements`,
 * `Terminology: Value Sets`), so the colon and the spaces have to go before
 * this is a filename. Uses `pageName`'s character class rather than a second
 * one, because two sanitisers are two answers to "what is a safe name".
 */
function categoryName(label: string | undefined): string {
  return (label ?? UNCATEGORISED).replace(/[^A-Za-z0-9._-]/g, "_");
}

/**
 * The index's in-page anchor for a category: a stable fragment a link or the
 * rail's "On this page" can point at. (The in-page Contents box that once
 * linked here is gone — owner, 2026-10-02, #1901: the TOC lives only in the
 * left-hand rail.)
 *
 * The uncategorised bucket gets its own id rather than `Other`'s: the IG HAS a
 * literal "Other" category (see `byCategory`), and two sections answering to
 * one fragment would send a link to whichever came first.
 */
function categoryAnchor(label: string | undefined): string {
  return label === undefined ? "cat--uncategorised" : `cat-${categoryName(label)}`;
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
 * NONE carries an IG API sidecar, so none would have had an artefact page to link
 * to. The summary reports the sidecar count it actually finds, so a future
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
#ig-footer{margin-top:2.5rem;font-size:.85rem}
#ig-footer p{margin:.4rem 0}
#ig-footer .ig-footer-band{background:var(--footer-bg-color,transparent);color:var(--footer-text-color,inherit);padding:.5rem 1rem;border-top:1px solid rgba(128,128,128,.35)}
#ig-footer .ig-footer-band a{color:var(--footer-hyperlink-text-color,inherit)}
`;
// The footer's band reads the mirrored chrome's `--footer-*` tokens, the
// Publisher's own footer colours; without an ingested chrome it falls back to
// the theme's, never to a hand-typed palette.
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

/** The footer's opening tag, up to where a page's prev/next attributes go. */
const FOOTER_TAG = `<footer id="ig-footer"`;

function shell(
  title: string,
  description: string,
  body: string,
  nav: NavRole = { kind: "index" },
  chrome: ChromeChoice = "fixture",
  data: Record<string, unknown> = {},
): string {
  const fm = [
    "---",
    `title: ${yamlScalar(title)}`,
    `description: ${yamlScalar(description)}`,
    ...navFrontMatter(nav),
    // Page variables for a Liquid template, as JSON flow mappings — YAML is a
    // superset of JSON, so one line per key needs no YAML emitter.
    ...Object.entries(data).map(([k, v]) => `${k}: ${JSON.stringify(v)}`),
    "---",
    "",
  ].join("\n");
  // The remaining styling — the handful of rules just-the-docs has no opinion
  // about, and the mirrored chrome — is LINKED, from one stylesheet each
  // under the instance's `assets/` (bean `680p`). It was inlined into every
  // page: 3.1 KB x 2,153 pages = 6.7 MB of smart-trust's 12.2 MB of generated
  // pages (measured 2026-10-01), the same bytes 2,153 times. `relative_url`
  // keeps the link right under any baseurl, staging previews included.
  // The chrome is mirrored only when it was actually ingested. Absent, the
  // page renders as an ordinary folio page: a mirror nobody could build is
  // reported by the build, never faked with a hand-typed palette.
  const wearsChrome = chrome === "fixture" && CHROME !== undefined;
  const link = (file: string) => `<link rel="stylesheet" href="{{ '/${INSTANCE_NAME}/${file}' | relative_url }}">`;
  const links = `${link(PAGES_CSS)}${wearsChrome ? `\n${link(CHROME_CSS)}` : ""}`;
  const banner = wearsChrome ? `${igBanner(IX)}\n\n` : "";
  // The footer is drawn by its loader from the IG's own metadata; the page
  // carries an empty <footer> and, set later for the pages in reading order,
  // its previous and next pages (`FOOTER_TAG`). The data file and the index
  // are found from the loader's own URL, so ~3,200 pages do not each repeat
  // two more URLs. On every fixture page, chrome
  // or not: it is the IG's facts, not the mirrored styling.
  const footer =
    chrome === "fixture"
      ? // In the chrome's scope when the page wears it, which is where the
        // mirrored `--footer-*` tokens are defined.
        `\n\n${FOOTER_TAG}${wearsChrome ? ` class="${CHROME_SCOPE.slice(1)}"` : ""}></footer>\n` +
        `<script src="{{ '/${INSTANCE_NAME}/${IG_FOOTER_SCRIPT}' | relative_url }}" defer></script>`
      : "";
  return `${fm}${links}\n\n${banner}${body.trim()}${footer}\n`;
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
  const sc = sidecarCensus(ix.artifacts);
  // The Publisher's order, as `byCategory` returns it — the same traversal the
  // sidebar's category pages are numbered by, so the two cannot disagree.
  const ordered = [...byCategory(ix.artifacts).entries()];

  const stat = (v: string | number, label: string) =>
    `<div class="st-stat"><b>${esc(String(v))}</b><span>${label}</span></div>`;

  const sections = ordered
    .map(([label, list]) => {
      const name = label ?? UNCATEGORISED;
      const id = ` id="${categoryAnchor(label)}"`;
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
          `<details markdown="1"${id}>`,
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
        `<details markdown="1"${id}>`,
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

  // An index derived from the IG Publisher's AST (`ast-to-artifact-index.ts`,
  // source kind `output`) is a BUILD's view, not the published IG's: say so
  // first, because a reader comparing it with the live IG will see artefacts
  // the published site does not have yet.
  const fromBuild = ix.source.kind === "output";
  const intro = fromBuild
    ? [
        `> **Built from the IG Publisher AST cache**${ix.source.revision ? ` of \`${mdCell(ix.source.revision.slice(0, 12))}\`` : ""},`,
        `> not from the published IG. The AST is a cache: its indices, dependencies and`,
        `> versions are provisional until a full IG Publisher run, and it may list artefacts`,
        `> the published site does not have yet.`,
        ``,
        `The artefact index of the ${LABEL} Implementation Guide, derived from its build output.`,
        `Every artefact is held here as a compiled copy.`,
      ]
    : [
        `The artefact index of the ${LABEL} Implementation Guide, rebuilt from what the IG`,
        `publishes. Most of it is catalogued **by reference**: the index records where each artefact`,
        `lives and holds none of its bytes. An artefact page marked ${stateTag({ materialization: { state: "referenced" } } as FhirArtifact)}`,
        `is not a broken one — it means upstream, not here.`,
      ];
  const body = [
    ...intro,
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
    ...(fromBuild
      ? [
          `This index was **derived** from the IG Publisher's AST, the build's own record of every`,
          `resource it produced, and each artefact records the AST file it came from. It was not read`,
          `back from the published IG, so where the two disagree, the published IG is the authority.`,
        ]
      : [
          `No FHIR IG publishes an artefact-index document. What looks like one —`,
          `\`ValueSets.schema.json\` at the published root — is a JSON *Schema* describing the shape of an`,
          `enumeration response, carrying an \`example\` that happens to hold the list. So this index was`,
          `**reconstructed**, and every part of it records which published file it came out of.`,
        ]),
    ``,
    `| | |`,
    `|---|---|`,
    ...provRows,
    ``,
    `## ${SIDECAR_LABEL} surface`,
    ``,
    // NOT DETERMINED is a third state, never a zero: an index that cannot see
    // the sidecars (an AST-derived one, `sidecarApi: "unknown"`) must not print
    // "0 of its artefacts", which reads as "the IG publishes none".
    ...(ix.sidecarApi === "unknown"
      ? [
          `Not determined: this index cannot see whether the IG publishes a ${SIDECAR_LABEL}`,
          `beside its artefacts${fromBuild ? " (the AST records the FHIR build only)" : ""}. Absent here does not mean absent.`,
        ]
      : [
          `The IG publishes its ${SIDECAR_LABEL} for ${sc.schema} of its artefacts. The four sidecars are issued`,
          `independently — every ValueSet gets all four, the logical models get two — which is why they`,
          `are counted separately rather than as one "has ${SIDECAR_LABEL}" tally.`,
          ``,
          `<div class="st-grid">`,
          stat(sc.schema, "JSON Schema"),
          stat(sc.displays, "displays"),
          stat(sc.openapi, "OpenAPI"),
          stat(sc.jsonld, "JSON-LD"),
          `</div>`,
        ]),
    ``,
    // Linked only when the hub page is written — the same two conditions.
    ...(ix.igApiHub?.localPath && igApiServable().ok ? [`The IG's own [${SIDECAR_LABEL} hub](${hubPage(ix)}.html) lists them as the Publisher's \`${hubPage(ix)}.html\` does.`, ``] : []),
    `## Every artefact, by category`,
    ``,
    `Grouped and ordered as the IG's own \`artifacts.html\` groups them, with each artefact's name and`,
    `description. Its canonical URL, published representations and whether it is held here are on`,
    `its own page.`,
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
    `All ${ix.count} artefacts of the ${LABEL} IG ${ix.version ?? ""}, ${fromBuild ? "derived from its IG Publisher AST cache" : "reconstructed from its published output"}.`,
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
  // The Publisher's two columns (#1901): the name, linked to the artefact's
  // page, and its description. The technical columns this table carried —
  // canonical URL, published representations, materialization — are on that
  // page already, so dropping them here loses nothing; the key stays under the
  // name because two artefacts can share a title and the key is what tells them apart.
  return [
    `| Artefact | Description |`,
    `|---|---|`,
    ...list.map((a) => {
      const nm = a.title ?? a.name ?? a.id;
      const linked = `[${mdCell(nm)}](${base}/artifact/${pageName(a)}.html)`;
      // `mdText`, not `mdCell`: a FHIR description is markdown, and a stray
      // `*` or `<` in one would otherwise restyle or swallow the row.
      const desc = a.description ? mdText(a.description).replace(/\r?\n+/g, " ") : "";
      return `| ${linked}<br>\`${mdCell(a.key)}\` | ${desc} |`;
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
  const name = label ?? UNCATEGORISED;
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
    `The ${list.length} ${LABEL} artefacts in the ${name} category, with their descriptions.`,
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

/**
 * The resource itself, for an artefact held as a compiled copy and served
 * under `--compiled-data`: a pointer the shared loader fills in the browser,
 * a visible loading state, and the raw file for a reader without JavaScript.
 * The served tree mirrors the AST directory, so the file's path is its
 * `localPath` with the AST directory's own name dropped.
 */
function compiledResourceSection(a: FhirArtifact): string[] {
  const m = a.materialization;
  if (!COMPILED_DATA || m.state !== "materialized" || m.purpose !== "compiled" || !m.localPath) return [];
  // `artifact/Name.html` → the docs root is `../`.
  const src = `../${COMPILED_DATA}/${m.localPath.replace(/^[^/]+\//, "")}`;
  // The narrative is the Publisher's XHTML, whose relative links name the
  // Publisher's own pages. The loader keeps one that names a page THIS site has
  // (`ast-pages.json`, the same `Type-id` names) and sends the rest to the
  // published IG, read off this artefact's own published page.
  const html = a.published.html?.url;
  const published = html ? html.slice(0, html.lastIndexOf("/") + 1) : undefined;
  return [
    `## Resource`,
    ``,
    `<div class="ast-resource" data-ast-src="${esc(src)}" data-ast-pages="../assets/ast-pages.json"${published ? ` data-ast-published="${esc(published)}"` : ""}>`,
    `<p class="ast-state">Loading the resource from the IG Publisher AST cache…</p>`,
    `<noscript><p>This section loads in the browser. The resource is <a href="${esc(src)}">its JSON in the AST cache</a>.</p></noscript>`,
    `</div>`,
    `<script src="../assets/ast-resource.js" defer></script>`,
    ``,
  ];
}

function artifactPage(ix: FhirArtifactIndex, a: FhirArtifact): string {
  const name = a.title ?? a.name ?? a.id;
  // THE IG API SECTION — what the IG's post-processing appends to a
  // ValueSet's Publisher page ("API Information", "Endpoints"), built in the
  // browser from the OpenAPI sidecar in the served graph (bean `680p`). Only
  // for a ValueSet: the generator skips logical models, so the Publisher's
  // StructureDefinition pages carry none, and a section here would be a
  // difference from the standard render rather than a match.
  const openapi =
    a.resourceType === "ValueSet" && a.sidecars?.openapi?.localPath && igApiServable().ok
      ? { src: `../${a.sidecars.openapi.localPath}`, script: `../${IG_API_OPENAPI_SCRIPT}` }
      : undefined;

  const apiRows = (["schema", "displays", "openapi", "jsonld"] as const).map((k) => {
    const r = a.sidecars?.[k];
    const label = { schema: "JSON Schema", displays: "Displays", openapi: "OpenAPI", jsonld: "JSON-LD" }[k];
    if (!r) return `| ${label} | *not published for this artefact* | |`;
    const view = (k === "schema" || k === "jsonld") && r.localPath ? ` · [view](${mdCell(r.localPath.split("/").pop()!)}.html)` : "";
    const held = r.localPath ? `\`${mdCell(r.localPath)}\`${view}` : "*by reference*";
    return `| ${label} | <${mdCell(r.url)}> | ${held} |`;
  });

  const stats = [
    `<div class="st-stat"><b>${esc(a.resourceType)}</b><span>resource type</span></div>`,
    `<div class="st-stat"><b>${esc(a.version ?? "—")}</b><span>version</span></div>`,
    `<div class="st-stat"><b>${esc(a.category ?? "—")}</b><span>category</span></div>`,
    ...(a.sidecars?.codeCount !== undefined
      ? [`<div class="st-stat"><b>${a.sidecars.codeCount}</b><span>codes</span></div>`]
      : []),
    ...(a.sidecars?.propertyCount !== undefined
      ? [`<div class="st-stat"><b>${a.sidecars.propertyCount}</b><span>properties</span></div>`]
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
        ? a.materialization.purpose === "compiled" && a.materialization.inputs
          ? // A compiled copy (an IG Publisher AST) is regenerated by the BUILD,
            // not by an ingest; and it is a cache, so it says what it was built
            // from and that it stands only until a full Publisher run.
            `compiled copy of \`${mdCell(a.materialization.inputs.sourceRevision.slice(0, 12))}\` by ${mdCell(a.materialization.inputs.toolchain)} — a cache, provisional until a full IG Publisher run`
          : `${mdCell(a.materialization.purpose ?? "")} copy, regenerable by re-running the ingest`
        : "upstream, not held here"
    } |`,
    ``,
    ...compiledResourceSection(a),
    // The sidecar table is worth a screen when there ARE sidecars. On the 655
    // artefacts with none it was four rows of "*not published for this
    // artefact*", which is noise dressed as information — so the absence is
    // stated in one line instead, and it is STATED rather than omitted,
    // because a missing section reads as "nobody looked".
    ...(a.sidecars
      ? [
          `## ${SIDECAR_LABEL}`,
          ``,
          `The four sidecars are published independently, so an absent one is a fact about the`,
          `IG rather than a gap in this index.`,
          ``,
          `| Sidecar | Published at | Held locally |`,
          `|---|---|---|`,
          ...apiRows,
          ``,
        ]
      : [
          `## ${SIDECAR_LABEL}`,
          ``,
          ...(ix.sidecarApi === "unknown"
            ? [`Not determined: this index cannot see whether a ${SIDECAR_LABEL} sidecar is published for this artefact.`]
            : [
                `No ${SIDECAR_LABEL} sidecar is published for this artefact. That is a fact about the IG,`,
                `not a gap in this index — sidecars are published per artefact, and`,
                `${ix.artifacts.filter((x) => x.sidecars).length} of ${ix.count} carry one.`,
              ]),
          ``,
        ]),
  ].join("\n");

  return shell(
    `${name} — ${LABEL} artefact`,
    `${a.key} in the ${LABEL} IG, with its canonical URL, published representations and ${SIDECAR_LABEL} sidecars.`,
    openapi ? `${body}\n\n${IG_API_OPENAPI_BODY}` : body,
    { kind: "leaf" },
    "fixture",
    openapi ? { ig_api_openapi: openapi } : {},
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
    ...(group.href ? [`This section's own page: [${mdCell(group.label)}](${menuHref(menu, { href: group.href })}).`, ``] : []),
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
pages.set(PAGES_CSS, `${CSS.trim()}\n`);
if (CHROME !== undefined) pages.set(CHROME_CSS, `${chromeStyles(CHROME).trim()}\n`);

// THE VIEWER DECLARATION (#1767, stage C3). The index page says which
// directory it renders and which Tool drew it, so `harness-tiles` finds this
// page as the `fhir-artifact-index` kind's viewer for this instance, the same
// way every other kind's viewer is found (`viewer-declarations.ts`). The
// directories come from the instance's own declaration; an instance that
// declares none (a scratch one) gets no declaration rather than a guessed one.
{
  const rendered = directoriesForGraph(INSTANCE, "fhir-artifact-index").map((d) => renderedPath(repoRootFor(INSTANCE), d));
  pages.set("index.md", withRendersFrontMatter(pages.get("index.md")!, rendered, "ig-pages"));
}

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
// The shared loader, published once beside the pages (never inlined in each)
// and only when a page points at it.
if ([...pages.values()].some((p) => p.includes("data-ast-src="))) {
  pages.set(join("assets", "ast-resource.js"), readFileSync(AST_LOADER, "utf8"));
  pages.set(
    join("assets", "ast-pages.json"),
    `${JSON.stringify(ix.artifacts.map((a) => `${pageName(a)}.html`).sort())}\n`,
  );
}

// THE IG API VIEW PAGES — the Publisher's `<Name>.schema.json.html` and
// `<Name>.jsonld.html` (bean `jut3`'s parity table: 33 on smart-trust). Each is
// the raw file, published beside its page so Raw and Download resolve where
// the Publisher's do, plus a page that is the Liquid template over data
// `ig-api-views.ts` computed. The file's text is fetched in the browser by one
// shared loader, never copied into the page (bean `680p`). An IG with no IG API
// overlay writes none of these.
//
// The pages FETCH from the served artefact-index graph (owner, 2026-10-01:
// publish the graph directory rather than copy its files beside the pages).
// That needs two declarations, and without either the pages would link data
// that is not on the site — so they are not written, and the run says why.
const igApiViewTemplate = readFileSync(IG_API_VIEW_TEMPLATE, "utf8");
const igApiServing = igApiServable();
let igApiViewCount = 0;
if (igApiServing.ok === false && ix.artifacts.some((a) => igApiViews(a).length > 0)) {
  console.log(`  IG API view pages NOT written: ${igApiServing.why}`);
}
for (const a of igApiServing.ok ? ix.artifacts : []) {
  for (const v of igApiViews(a)) {
    const data = igApiViewData(a, v, "../", Boolean(ix.package?.localPath));
    igApiViewCount += 1;
    pages.set(
      join("artifact", `${v.file}.md`),
      shell(
        `${data.artifact.title} — ${v.label}`,
        `The ${v.label} sidecar of ${a.key}, from the IG's ${SIDECAR_LABEL}.`,
        igApiViewTemplate,
        { kind: "leaf" },
        "fixture",
        { ig_api: data },
      ),
    );
  }
}
if (igApiViewCount > 0) pages.set(IG_API_VIEW_SCRIPT, readFileSync(IG_API_VIEW_LOADER, "utf8"));

// THE JSON VIEW PAGES — the Publisher's `<Name>.json.html` (672 on
// smart-trust). Each reads its resource out of the IG's package.tgz, held in
// the served graph, in the browser; no resource is copied (bean `680p`).
// Without a held package, or a served graph, none is written and the run says so.
let jsonViewCount = 0;
if (ix.artifacts.some(hasJsonView)) {
  if (!ix.package?.localPath) console.log("  JSON view pages NOT written: the index holds no package (re-ingest with --materialize-package)");
  else if (!igApiServing.ok) console.log(`  JSON view pages NOT written: ${igApiServing.why}`);
  else {
    const template = readFileSync(JSON_VIEW_TEMPLATE, "utf8");
    for (const a of ix.artifacts.filter(hasJsonView)) {
      const extra = igApiViews(a).map((v) => ({ label: v.label, href: `${v.file}.html`, active: false }));
      const data = jsonViewData(a, ix.package.localPath, extra);
      pages.set(
        join("artifact", `${pageName(a)}.json.md`),
        shell(`${a.title ?? a.name ?? a.id} — JSON`, `The JSON representation of ${a.key}.`, template, { kind: "leaf" }, "fixture", { json_view: data }),
      );
      jsonViewCount += 1;
    }
    pages.set(JSON_VIEW_SCRIPT, readFileSync(JSON_VIEW_LOADER, "utf8"));
  }
}

// THE TAB PAGES — `.change.history` (672 on smart-trust), `-testing` (69) and a
// logical model's `.profile.history`, `.profile.json` and `-examples` — from
// the resource itself, read out of the same held package at generation time.
// Each states only what the Publisher's states; a page whose Publisher form
// would list data this build cannot (tests, examples) is not written.
const tabCounts = { history: 0, testing: 0, profileHistory: 0, profileJson: 0, examples: 0, mappings: 0 };
if (ix.package?.localPath && igApiServing.ok) {
  const entries = packageEntries(join(INSTANCE, ix.package.localPath));
  const resources = [...entries.values()].map((b) => JSON.parse(b.toString("utf8")) as Record<string, unknown>);
  const hasTests = resources.some((r) => r.resourceType === "TestPlan" || r.resourceType === "TestScript");
  const claimed = new Set(resources.flatMap((r) => ((r.meta as { profile?: string[] } | undefined)?.profile ?? [])));
  const tabTemplate = readFileSync(TAB_PAGE_TEMPLATE, "utf8");
  const mappingsTemplate = readFileSync(MAPPINGS_TEMPLATE, "utf8");
  const igStructures = new Set(resources.filter((r) => r.resourceType === "StructureDefinition" && typeof r.url === "string").map((r) => r.url as string));
  const jsonTemplate = readFileSync(JSON_VIEW_TEMPLATE, "utf8");
  const tabPage = (file: string, title: string, p: TabPageData | undefined, count: keyof typeof tabCounts) => {
    if (!p) return;
    const data = { ...p, heading: mdText(p.heading), status: p.status, sections: p.sections.map((x) => ({ ...x, text: mdText(x.text) })) };
    pages.set(join("artifact", file), shell(title, `${p.heading}.`, tabTemplate, { kind: "leaf" }, "fixture", { tab_page: data }));
    tabCounts[count] += 1;
  };
  for (const a of ix.artifacts) {
    const raw = entries.get(`package/${a.resourceType}-${a.id}.json`);
    if (!raw) continue;
    const f = resourceFacts(JSON.parse(raw.toString("utf8")));
    const stem = pageName(a);
    const igApiTabs = igApiViews(a).map((v) => ({ label: v.label, href: `${v.file}.html`, active: false }));
    const name = a.title ?? a.name ?? a.id;
    if (a.resourceType === "StructureDefinition") {
      const tabs = resourceTabs(a, igApiTabs, true);
      // The definitions page is the Publisher's (it needs hl7.fhir.r5.core's
      // base-type text, which this build cannot hold — bean wnhh), so each
      // mapping row links an element's definition THERE.
      const defsAt = `${a.published?.json?.url.replace(/[^/]*$/, "") ?? ""}${stem}-definitions.html#`;
      const m = mappingsPage(JSON.parse(raw.toString("utf8")), f, resourceTabs(a, igApiTabs, true, "Mappings"), igStructures, (p) => `${defsAt}${p}`);
      if (m) {
        const esc = (t: { rows: Array<{ label: string; value: string }> }) => ({ ...t, rows: t.rows.map((r) => ({ ...r, label: mdText(r.label), value: mdText(r.value) })) });
        const data = { ...m, heading: mdText(m.heading), intro: mdText(m.intro), inIg: m.inIg.map(esc), toOther: m.toOther.map(esc), other: m.other.map(esc) };
        pages.set(join("artifact", `${stem}-mappings.md`), shell(`${name} — mappings`, `${m.heading}.`, mappingsTemplate, { kind: "leaf" }, "fixture", { mappings: data }));
        tabCounts.mappings += 1;
      }
      tabPage(`${stem}.profile.history.md`, `${name} — change history`, historyPage(a, f, tabs), "profileHistory");
      tabPage(`${stem}-examples.md`, `${name} — examples`, examplesPage(f, tabs, f.url !== undefined && claimed.has(f.url)), "examples");
      const pj = profileJsonViewData(a, f, ix.package.localPath, resourceTabs(a, igApiTabs, true, "JSON"));
      if (pj) {
        pages.set(join("artifact", `${stem}.profile.json.md`), shell(`${name} — JSON profile`, `The JSON representation of ${a.key}.`, jsonTemplate, { kind: "leaf" }, "fixture", { json_view: { ...pj, heading: mdText(pj.heading), intro: pj.intro && mdText(pj.intro) } }));
        tabCounts.profileJson += 1;
      }
    } else if (hasJsonView(a)) {
      tabPage(`${stem}.change.history.md`, `${name} — change history`, historyPage(a, f, resourceTabs(a, igApiTabs, true)), "history");
    }
    tabPage(`${stem}-testing.md`, `${name} — testing`, testingPage(f, resourceTabs(a, igApiTabs, true), hasTests), "testing");
  }
}
if ([...pages.values()].some((p) => p.includes("data-ig-api-openapi-src"))) pages.set(IG_API_OPENAPI_SCRIPT, readFileSync(IG_API_OPENAPI_LOADER, "utf8"));

// THE IG API HUB — the Publisher's hub page, as its own page under the same
// name (owner, 2026-10-01: "replicate dak-api.html seperately"). The hub fragment is held
// in the served graph and fetched; what is computed here is where each of its
// links should go on THIS site, because the Publisher's relative links assume
// its flat layout.
if (ix.igApiHub?.localPath && igApiServing.ok) {
  const hub = igApiHubData(ix, igApiHubFragment(INSTANCE, ix.igApiHub.localPath), "");
  pages.set(
    `${hubPage(ix)}.md`,
    shell(
      `${SIDECAR_LABEL} Documentation Hub`,
      `The ${LABEL} IG's ${SIDECAR_LABEL} hub: its logical models, ValueSet schemas, JSON-LD vocabularies and enumeration endpoints.`,
      readFileSync(IG_API_HUB_TEMPLATE, "utf8"),
      { kind: "leaf" },
      "fixture",
      { hub },
    ),
  );
  pages.set(IG_API_HUB_SCRIPT, readFileSync(IG_API_HUB_LOADER, "utf8"));
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

// THE FOOTER'S DATA, once per IG, from the IG's own package when it is held
// (`ig-footer.ts` says which field comes from where), and the footer's
// <prev | next> through the index's reading order: the index, then every
// artefact page in the order the index lists them — the Publisher's own
// order through `artifacts.html`.
{
  // Held means ON DISK: an index can name a package its checkout does not
  // carry (a scratch copy, a sparse clone), and then the footer says less
  // rather than the run failing.
  const pkgPath = ix.package?.localPath ? join(INSTANCE, ix.package.localPath) : undefined;
  const held = pkgPath && existsSync(pkgPath) ? packageEntries(pkgPath) : undefined;
  const json = (name: string | undefined) => (name && held?.has(name) ? (JSON.parse(held.get(name)!.toString("utf8")) as Record<string, unknown>) : undefined);
  const igEntry = held ? [...held.keys()].find((k) => /^package\/ImplementationGuide-[^/]+\.json$/.test(k)) : undefined;
  pages.set(IG_FOOTER_DATA, `${JSON.stringify(igFooterData(json("package/package.json"), json(igEntry), ix), null, 2)}\n`);
  pages.set(IG_FOOTER_SCRIPT, readFileSync(IG_FOOTER_LOADER, "utf8"));

  const order = ["index.md", ...[...byCategory(ix.artifacts).values()].flat().map((a) => join("artifact", `${pageName(a)}.md`))];
  const href = (from: string, to: string): string => {
    // `index.md` is served as its directory, so a link to it ends in `/`.
    const rel = posix.relative(posix.dirname(from), to.replace(/\.md$/, ".html"));
    return to === "index.md" ? rel.replace(/index\.html$/, "") || "./" : rel;
  };
  order.forEach((page, i) => {
    const text = pages.get(page);
    if (text === undefined) return;
    const attrs = [
      i > 0 ? ` data-prev="${esc(href(page, order[i - 1]!))}"` : "",
      i < order.length - 1 ? ` data-next="${esc(href(page, order[i + 1]!))}"` : "",
    ].join("");
    pages.set(page, text.replace(FOOTER_TAG, `${FOOTER_TAG}${attrs}`));
  });
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

/**
 * The declared id of the directory these pages are written to, or `undefined`
 * when `--out` points somewhere no declaration names. Keyed by ID so that moving
 * the pages to `cat/fhir-harness/ig-docs` (bean lbz8) is a declaration edit
 * (`storage: { branch, keyedBy: "route" }`), not a change here.
 */
function docsDirectoryId(): string | undefined {
  const norm = (p: string) => resolve(p).replace(/\/+$/, "");
  return readDeclaration(INSTANCE)?.directories?.find((d) => norm(join(INSTANCE, d.path)) === norm(OUT))?.id;
}

if (CHECK) {
  // Compared against whichever copy the declaration says is authoritative — the
  // checkout today, both while the same pages live on main and on
  // cat/fhir-harness/ig-docs, and the branch after the cutover (bean lbz8).
  // The resolver is the one `uml:overview:check` uses (`route-authority.ts`,
  // #2053). A branch it cannot reach is UNKNOWN: neither stale nor a pass.
  const repoRoot = repoRootFor(INSTANCE);
  const id = docsDirectoryId();
  const outRel = relative(repoRoot, OUT).split(sep).join("/");
  const verdict = id === undefined
    ? undefined
    : compareRoute(id, new Map([...pages].map(([rel, text]) => [`${outRel}/${rel.split(sep).join("/")}`, text])), repoRoot);
  if (verdict?.state === "unknown") {
    console.error(`COULD NOT DETERMINE whether ${INSTANCE_NAME}'s IG pages are current: ${verdict.reason}`);
    console.error(`  authority: ${verdict.authority} — nothing was compared, so this is not a pass.`);
    process.exit(4);
  }
  for (const d of verdict?.drift ?? []) console.error(`drift: ${d} differs between the checkout and the branch`);
  const have = committed();
  const stale: string[] = [];
  if (verdict?.authority === "branch") {
    // The branch is replaced wholesale by a publish, so an orphan is the
    // publisher's to sweep; only content is compared here.
    stale.push(...verdict.stale.map((p) => p.slice(outRel.length + 1)));
  } else {
    for (const [rel, html] of pages) if (have.get(rel) !== html) stale.push(rel);
    for (const rel of have.keys()) if (!pages.has(rel)) stale.push(`${rel} (orphan — no artefact produces it)`);
  }
  stale.push(...(verdict?.drift ?? []).map((p) => `${p} (drift between the checkout and the branch)`));
  if (stale.length > 0) {
    console.error(`✗ ${stale.length} page(s) stale or orphaned:`);
    for (const s of stale.slice(0, 10)) console.error(`    ${s}`);
    if (stale.length > 10) console.error(`    …and ${stale.length - 10} more`);
    console.error(`  Run \`bun run ${INSTANCE_NAME}:pages\`. These pages are generated; never edit them.`);
    process.exit(1);
  }
  console.log(`✓ ${INSTANCE_NAME} docs are current — ${pages.size} page(s) over ${ix.count} artefacts${verdict ? `, read from ${verdict.authority === "both" ? "both copies (the checkout decides)" : `the ${verdict.authority}`}` : ""}`);
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
  const sc = sidecarCensus(ix.artifacts);
  console.log(`${INSTANCE_NAME}/docs: ${pages.size} page(s)`);
  console.log(`  index over ${ix.count} artefacts in ${byCategory(ix.artifacts).size} categories`);
  // Counted from the page map, never as `pages.size - 1`. That expression was
  // right while the index was the only non-artefact page and quietly became
  // wrong the moment a category page joined it — it reported 675 artefact
  // pages over a corpus of 674.
  // One per ARTEFACT: the IG API view pages and their raw files share the
  // directory and are counted on their own line.
  const artefactPages = [...pages.keys()].filter((k) => k.startsWith("artifact/") && k.endsWith(".md") && !VIEW_PAGE.test(k)).length;
  const categoryPages = [...pages.keys()].filter((k) => k.startsWith("category/")).length;
  console.log(`  ${artefactPages} artefact page(s) — one per artefact; ${sc.schema} carry a ${SIDECAR_LABEL} schema`);
  console.log(`  ${igApiViewCount} IG API view page(s) — one per held JSON Schema or JSON-LD sidecar, file fetched client-side`);
  console.log(`  ${jsonViewCount} JSON view page(s) — resource read client-side from the held package.tgz`);
  console.log(`  tab pages: ${tabCounts.history} change history, ${tabCounts.testing} testing, ${tabCounts.profileHistory} profile history, ${tabCounts.profileJson} profile JSON, ${tabCounts.examples} examples, ${tabCounts.mappings} mappings`);
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
    const status = statusFor(ix);
    console.log(
      status === undefined
        ? `  status NOT determined — ${IDENTITY ? `ig-identity.json names ${IDENTITY.id}, not ${ix.packageId ?? "this IG"}` : "no ig-identity.json beside the index"}; no watermark drawn`
        : `  status "${status}" — from ig-identity.json (${IDENTITY!.readFrom}, read ${IDENTITY!.readAt})`,
    );
    console.log(
      `  chrome mirrored on every page — ${CHROME.tokens.length} token(s) over ` +
        `${CHROME.layers.length} template layer(s), ${CHROME.rules.length} rule(s); the chrome is ${CHROME.id} ${CHROME.version}`,
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
