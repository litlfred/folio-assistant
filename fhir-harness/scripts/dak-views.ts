/**
 * The DAK sidecar VIEW pages — the Publisher's `<Name>.schema.json.html` and
 * `<Name>.jsonld.html` — as data for a Liquid template (bean `jut3`, P0).
 *
 * WHO's DAK post-processing (smart-base) publishes two sidecars per artefact
 * that a reader can open as a page: a JSON Schema and a JSON-LD vocabulary.
 * The Publisher's page for each is a tab bar, a heading, Raw and Download
 * links, and the file. This module computes the page's data;
 * `templates/dak-view.liquid` arranges it and Jekyll renders it
 * (`liquid-templates`: computation in the generator, layout in the template).
 * The file itself is fetched in the browser by `templates/dak-view.js`, as the
 * Publisher's page does — never baked into the page (bean `680p`).
 *
 * Beside `gen-ig-pages.ts`, which already renders the DAK overlay's sidecar
 * table, because a generic generator cannot import from an instance above it.
 * That is a TENSION, not a settled placement: fhir-harness's one rule is that
 * it knows nothing of WHO, and the DAK API is WHO's post-processing. The
 * rendering is driven entirely by `a.sidecars` being present, so an IG without the
 * overlay gets none of it; moving the overlay into smart-base as a pluggable
 * renderer is the layering fix (recorded on bean `jut3`).
 */
import { readFileSync } from "node:fs";
import { hasJsonView } from "./resource-views.ts";
import { basename, join } from "node:path";
import { artifactPageName, type FhirArtifact, type FhirArtifactIndex } from "../schemas/fhir-artifact-index.js";
import { declarationPathIn } from "../../cat-harness/schemas/cat-harness.js";

/** The two sidecars the Publisher renders a page for, in its tab order. */
export const DAK_VIEW_KINDS = [
  { key: "schema", label: "JSON Schema" },
  { key: "jsonld", label: "JSON-LD" },
] as const;

export interface DakView {
  /** The file's name (`ValueSet-Actors.schema.json`) — the page is `<file>.html`. */
  file: string;
  /** Repository-relative path of the held copy, from the index. */
  localPath: string;
  label: (typeof DAK_VIEW_KINDS)[number]["label"];
}

/** The view pages one artefact has: a held schema and/or JSON-LD sidecar. A referenced-only sidecar has no bytes here, so no page. */
export function dakViews(a: FhirArtifact): DakView[] {
  return DAK_VIEW_KINDS.flatMap(({ key, label }) => {
    const r = a.sidecars?.[key];
    return r?.localPath ? [{ file: basename(r.localPath), localPath: r.localPath, label }] : [];
  });
}

export interface DakViewData {
  label: string;
  file: string;
  /** Where the file is fetched from: the SERVED artefact-index graph, relative to the page — never a copy beside it (bean `680p`). */
  src: string;
  artifact: { title: string; page: string };
  tabs: Array<{ label: string; href: string; active: boolean }>;
  /** The shared loader, relative to the page. */
  script: string;
}

/** Where the generator publishes the loader, under the instance's docs root; pages sit one level down in `artifact/`. */
export const DAK_VIEW_SCRIPT = "assets/dak-view.js";

/**
 * Everything one view page shows. Tabs follow the Publisher's order: the
 * artefact's narrative, its XML / JSON / TTL (the Publisher's copies — under
 * P2 this site renders none of them), then each DAK view, the current one
 * active.
 */
/**
 * @param servedFrom the page's path to the instance root's served data — `../`
 *   from `artifact/`, so a `localPath` of `fhir-artifact-index/dak/X` is fetched
 *   at `../fhir-artifact-index/dak/X`.
 */
export function dakViewData(a: FhirArtifact, view: DakView, servedFrom = "../", jsonViews = false): DakViewData {
  const page = `${artifactPageName(a)}.html`;
  // JSON is this site's own view where the Publisher writes one
  // (`resource-views.ts`); XML and Turtle stay the Publisher's (P2).
  const reps = (["xml", "json", "ttl"] as const).flatMap((k) => {
    const url = a.published?.[k]?.url;
    if (!url) return [];
    // Only when this site WRITES the JSON view (`jsonViews`: the IG's package
    // is held and served); otherwise the tab would link a page that is not there.
    return [{ label: k.toUpperCase(), href: k === "json" && jsonViews && hasJsonView(a) ? `${page.replace(/\.html$/, "")}.json.html` : url, active: false }];
  });
  return {
    label: view.label,
    file: view.file,
    src: `${servedFrom}${view.localPath}`,
    artifact: { title: a.title ?? a.name ?? a.id, page },
    tabs: [
      { label: "Narrative Content", href: page, active: false },
      ...reps,
      ...dakViews(a).map((v) => ({ label: v.label, href: `${v.file}.html`, active: v.file === view.file })),
    ],
    script: `../${DAK_VIEW_SCRIPT}`,
  };
}

/**
 * Where each link in the hub fragment goes on this site. The Publisher's are
 * relative to its flat root; here an artefact page is under `artifact/` and a
 * DAK file is in the served graph. Anything neither — `openapi/index.html`,
 * the enumeration schemas, the two `*-enumeration.html` pages the Publisher
 * never wrote — keeps the Publisher's copy, absolute, so a dead link upstream
 * stays visibly the Publisher's rather than becoming a broken one here.
 */
export function dakHubLinks(artifacts: readonly FhirArtifact[], publishedAt: string, fragment: string): Record<string, string> {
  const pagesByName = new Set(artifacts.map((a) => `${artifactPageName(a)}.html`));
  const held = new Map<string, string>();
  for (const a of artifacts) {
    for (const r of Object.values(a.sidecars ?? {})) {
      if (typeof r === "object" && r && "localPath" in r && r.localPath) held.set(r.localPath.split("/").pop()!, r.localPath);
    }
  }
  const upstream = publishedAt.replace(/\/+$/, "");
  const out: Record<string, string> = {};
  for (const [, h] of fragment.matchAll(/href="([^"]+)"/g)) {
    if (/^[a-z][a-z0-9+.-]*:|^\/|^#/i.test(h) || h in out) continue;
    out[h] = pagesByName.has(h) ? `artifact/${h}` : held.has(h) ? held.get(h)! : `${upstream}/${h}`;
  }
  return out;
}

/**
 * Whether an instance's DAK files are on the site for a page to fetch: its
 * artefact-index directory is declared `served`, and its docs directory is
 * the composed instance root — so a page one level down reaches the served
 * data as `../<path>` (bean `680p`).
 */
export function dakServed(instanceRoot: string): { ok: true } | { ok: false; why: string } {
  // Found as the file whose stem equals its own `name`, never as
  // `<directory>.json`: in a separated IG repository the directory is
  // `smart-base/` and the declaration is still `smart-trust.json` (bean `rbz3`).
  const at = declarationPathIn(instanceRoot);
  if (at === undefined) return { ok: false, why: `${basename(instanceRoot)}/ holds no instance declaration` };
  let d: { directories?: { path?: string; graphKinds?: string[]; served?: boolean; instanceRoot?: boolean; composed?: boolean }[] };
  try {
    d = JSON.parse(readFileSync(at, "utf8"));
  } catch {
    return { ok: false, why: `${basename(at)} could not be read` };
  }
  const dirs = d.directories ?? [];
  const index = dirs.find((x) => x.graphKinds?.includes("fhir-artifact-index"));
  const docs = dirs.find((x) => x.path === "docs/");
  if (!index?.served) return { ok: false, why: "its fhir-artifact-index directory is not declared `served`" };
  if (!(docs?.instanceRoot && docs.composed)) return { ok: false, why: "its docs/ is not the composed instance root, so `../` does not reach the served data" };
  return { ok: true };
}

/** The hub's HTML, from the JSON node the ingest holds it in (`{ from, between, html }`). */
export function dakHubFragment(instanceRoot: string, localPath: string): string {
  return (JSON.parse(readFileSync(join(instanceRoot, localPath), "utf8")) as { html: string }).html;
}

/** Where smart-base's post-processing writes the hub into `dak-api.html` (`generate_dak_api_hub.py`, `comment_marker`). */
export const DAK_API_PLACEHOLDER = "<!-- DAK_API_CONTENT -->";
/** The hub's loader, published under the instance's docs root by `gen-ig-pages`. */
export const DAK_HUB_SCRIPT = "assets/dak-hub.js";
/** The hub's template, shared by the standalone hub page and the IG site's own `dak-api` page. */
export const DAK_HUB_TEMPLATE = join(import.meta.dir, "templates", "ig-pages", "dak-api.liquid");

/**
 * The hub's page data, for a page at `prefix` from the instance root (`""`
 * for the docs root, `"../"` one level down — the IG site at `ig/`). Every
 * relative path is rebased by the same prefix; the Publisher's absolute URLs
 * are left alone.
 */
export function dakHubData(ix: FhirArtifactIndex, fragment: string, prefix: string) {
  const rebase = (h: string) => (/^[a-z][a-z0-9+.-]*:|^\/|^#/i.test(h) ? h : `${prefix}${h}`);
  const links = Object.fromEntries(Object.entries(dakHubLinks(ix.artifacts, ix.source.of, fragment)).map(([k, v]) => [k, rebase(v)]));
  return { src: rebase(ix.dakApiHub!.localPath!), published: ix.dakApiHub!.url, links, script: rebase(DAK_HUB_SCRIPT) };
}

/**
 * The fill that makes the IG site's own `dak-api` page what the Publisher
 * published: its source holds only {@link DAK_API_PLACEHOLDER}, and
 * smart-base's post-processing writes the hub there. Undefined, with nothing
 * filled, when the instance holds no hub or does not serve its graph.
 */
export function dakHubFill(instanceRoot: string): { marker: string; body: string; data: Record<string, unknown> } | undefined {
  let ix: FhirArtifactIndex;
  try {
    ix = JSON.parse(readFileSync(join(instanceRoot, "fhir-artifact-index", "index.json"), "utf8"));
  } catch {
    return undefined;
  }
  if (!ix.dakApiHub?.localPath || !dakServed(instanceRoot).ok) return undefined;
  const fragment = dakHubFragment(instanceRoot, ix.dakApiHub.localPath);
  return { marker: DAK_API_PLACEHOLDER, body: readFileSync(DAK_HUB_TEMPLATE, "utf8"), data: { hub: dakHubData(ix, fragment, "../") } };
}
