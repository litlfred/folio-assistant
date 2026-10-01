/**
 * The DAK sidecar VIEW pages — the Publisher's `<Name>.schema.json.html` and
 * `<Name>.jsonld.html` — as data for a Liquid template (bean `jut3`, P0).
 *
 * WHO's DAK post-processing (smart-base) publishes two sidecars per artefact
 * that a reader can open as a page: a JSON Schema and a JSON-LD vocabulary.
 * The Publisher's page for each is a tab bar, a heading, Raw and Download
 * links, and the file. This module computes everything that page shows;
 * `templates/dak-view.liquid` arranges it and Jekyll renders it
 * (`liquid-templates`: computation in the generator, layout in the template).
 *
 * Here, in smart-trust, and not in fhir-harness: a DAK is WHO's, and the bare
 * FHIR layer may not know about it.
 */
import { basename } from "node:path";
import { artifactPageName, type FhirArtifact } from "../../folio-assistant-core/schemas/fhir-artifact-index.js";

/** The two sidecars the Publisher renders a page for, in its tab order. */
export const DAK_VIEW_KINDS = [
  { key: "schema", label: "JSON Schema" },
  { key: "jsonld", label: "JSON-LD" },
] as const;

export interface DakView {
  /** The raw file's name, published beside the page (`ValueSet-Actors.schema.json`). */
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

/**
 * The file as the Publisher's page DISPLAYS it. Its page fetches the file and
 * shows `JSON.stringify(parsed, null, 2)` — which is not always the file's own
 * text: JavaScript orders integer-like keys first, so a schema whose
 * `properties` holds `"1"` and `"resourceType"` displays them swapped
 * (3 of smart-trust's 33 files, measured 2026-10-01). Computing it the same
 * way is what makes the two pages show the same thing.
 */
export function displayText(raw: string): string {
  return JSON.stringify(JSON.parse(raw), null, 2);
}

/** A backtick fence longer than any backtick run in `text`, so the text cannot close it. */
export function fenceFor(text: string): string {
  const longest = Math.max(0, ...(text.match(/`+/g) ?? []).map((m) => m.length));
  return "`".repeat(Math.max(3, longest + 1));
}

export interface DakViewData {
  label: string;
  file: string;
  artifact: { title: string; page: string };
  tabs: Array<{ label: string; href: string; active: boolean }>;
  text: string;
  fence: string;
}

/**
 * Everything one view page shows. Tabs follow the Publisher's order: the
 * artefact's narrative, its XML / JSON / TTL (the Publisher's copies — under
 * P2 this site renders none of them), then each DAK view, the current one
 * active.
 */
export function dakViewData(a: FhirArtifact, view: DakView, raw: string): DakViewData {
  const page = `${artifactPageName(a)}.html`;
  const reps = (["xml", "json", "ttl"] as const).flatMap((k) => {
    const url = a.published?.[k]?.url;
    return url ? [{ label: k.toUpperCase(), href: url, active: false }] : [];
  });
  const text = displayText(raw);
  return {
    label: view.label,
    file: view.file,
    artifact: { title: a.title ?? a.name ?? a.id, page },
    tabs: [
      { label: "Narrative Content", href: page, active: false },
      ...reps,
      ...dakViews(a).map((v) => ({ label: v.label, href: `${v.file}.html`, active: v.file === view.file })),
    ],
    text,
    fence: fenceFor(text),
  };
}
