/**
 * The JSON VIEW pages — the Publisher's `<Name>.json.html` — as data for a
 * Liquid template (bean `jut3`, P0; owner 2026-10-01).
 *
 * The Publisher's page is a tab bar, a heading, a status line, Raw and
 * Download links, and the resource as `JSON.stringify(parsed, null, 2)`, which
 * its own script fetches. Ours fetches too, but from the IG's `package.tgz`
 * held in the served artefact-index graph — one archive, cached by the
 * browser, read with a gzip+tar reader in `templates/ig-pages/resource-json.js` —
 * instead of copying 672 resource files (bean `680p`, `visualizer-loading`).
 *
 * Generic: nothing here knows whose IG it is. A caller that renders more tabs
 * (a DAK overlay) passes them in.
 */
import { artifactPageName, type FhirArtifact } from "../../folio-assistant-core/schemas/fhir-artifact-index.js";

/** Where the generator publishes the loader, under the instance's docs root. */
export const JSON_VIEW_SCRIPT = "assets/resource-json.js";

/**
 * Whether the Publisher writes a `<Name>.json.html` for this artefact.
 * Measured on smart-trust 2026-10-01: every artefact except the
 * ImplementationGuide (no view at all) and StructureDefinitions (which get
 * `.profile.json.html` instead — the profile tabs, a different page kind).
 */
export function hasJsonView(a: FhirArtifact): boolean {
  return a.resourceType !== "ImplementationGuide" && a.resourceType !== "StructureDefinition" && a.published?.json !== undefined;
}

export interface Tab {
  label: string;
  href: string;
  active: boolean;
}

export interface JsonViewData {
  heading: string;
  /** The package, relative to the page, and the entry to read from it. */
  package: string;
  entry: string;
  /** The Publisher's published `.json` — the Raw and Download target. */
  raw: string;
  rawName: string;
  tabs: Tab[];
  script: string;
}

/**
 * @param packagePath the package's instance-relative path (`fhir-artifact-index/package.tgz`)
 * @param extraTabs   tabs after TTL, in the Publisher's order (a DAK overlay's views)
 */
export function jsonViewData(a: FhirArtifact, packagePath: string, extraTabs: Tab[] = []): JsonViewData {
  const stem = artifactPageName(a);
  const pub = (k: "xml" | "json" | "ttl") => a.published?.[k]?.url;
  const tabs: Tab[] = [
    { label: "Narrative Content", href: `${stem}.html`, active: false },
    ...(pub("xml") ? [{ label: "XML", href: pub("xml")!, active: false }] : []),
    { label: "JSON", href: `${stem}.json.html`, active: true },
    ...(pub("ttl") ? [{ label: "TTL", href: pub("ttl")!, active: false }] : []),
    ...extraTabs,
  ];
  return {
    heading: `${a.title ?? a.name ?? a.id} - JSON Representation`,
    package: `../${packagePath}`,
    entry: `package/${a.resourceType}-${a.id}.json`,
    raw: pub("json")!,
    rawName: `${stem}.json`,
    tabs,
    script: `../${JSON_VIEW_SCRIPT}`,
  };
}
