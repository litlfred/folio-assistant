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
 * rendering is driven entirely by `a.dak` being present, so an IG without the
 * overlay gets none of it; moving the overlay into smart-base as a pluggable
 * renderer is the layering fix (recorded on bean `jut3`).
 */
import { basename } from "node:path";
import { artifactPageName, type FhirArtifact } from "../../folio-assistant-core/schemas/fhir-artifact-index.js";

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
    const r = a.dak?.[key];
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
export function dakViewData(a: FhirArtifact, view: DakView, servedFrom = "../"): DakViewData {
  const page = `${artifactPageName(a)}.html`;
  const reps = (["xml", "json", "ttl"] as const).flatMap((k) => {
    const url = a.published?.[k]?.url;
    return url ? [{ label: k.toUpperCase(), href: url, active: false }] : [];
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
    for (const r of Object.values(a.dak ?? {})) {
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
