/**
 * `site.data.fhir` for a just-the-docs render of ONE implementation guide —
 * the IG Publisher's Jekyll variables, populated by the layer that owns them.
 *
 * Owner, 2026-09-30 (bean `bamf`, issue #1564): *"{{ site.data...}} is declared
 * for fhir-harness only"* and *"those are made available ... in justthedocs
 * pipeline w/ fhir harness responsible for declaring/populate fhir metadata
 * jekyll tooling"*. fhir-harness declares `site.data` as a pass-through Liquid
 * prefix (`fhir-harness.json`), so the platform leaves `{{ site.data.fhir.… }}`
 * for Jekyll; this writes what Jekyll then reads. It is the metadata half of
 * `ig-publisher-reduction` P0.
 *
 * ## One IG per site
 *
 * Jekyll has ONE `_data/`, so `site.data.fhir` describes one IG — as it does
 * under the Publisher, whose build is one IG. This renders for one IG root.
 *
 * ## Only what it can source
 *
 * There is no Publisher-written `_data/fhir.json` in this repository to copy a
 * schema from, and a field written from memory would be a guess wearing the
 * clothes of a fact. So it writes:
 *
 * - `ig.*` — fields of the ImplementationGuide RESOURCE (`id`, `url`, `name`,
 *   `title`, `version`, `status`, `publisher`, `fhirVersion`), which is what
 *   the Publisher's `site.data.fhir.ig` is;
 * - `packageId` and `canonical`.
 *
 * Every other field is left out and LISTED in the result's `undetermined`, never
 * written as an empty string: Jekyll prints an empty string and an absent value
 * identically, so writing `""` would hide the gap.
 *
 * ## Sources, in authority order
 *
 * 1. `sushi-config.yaml` at the IG root — what the Publisher itself reads.
 * 2. `fhir-artifact-index/index.json` — read from a published IG; carries
 *    `packageId`, `version`, `fhirVersion`, `canonicalBase`, but not `id`,
 *    `name` or `publisher`.
 *    `fhir-artifact-index/ig-identity.json` supplies `status` ONLY when it
 *    names the same package. It used to come from `chrome.json`, which
 *    measured 2026-09-30 described `smart.who.int.trust` 1.8.0 under
 *    smart-base's `smart.who.int.base` 0.3.0; stage D (#1767) keyed the chrome
 *    by its template and gave each IG an identity file of its own.
 *
 * Usage:
 *   bun run fhir-harness/scripts/ig-site-data.ts --ig <IG root> --out <site>/_data/fhir.json [--check]
 *
 * @module fhir-harness/scripts/ig-site-data
 */

import { IG_IDENTITY_FILENAME, readIgIdentity, statusOf } from "../schemas/ig-identity.js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { parse as parseYaml } from "yaml";

/** The ImplementationGuide resource fields the Publisher exposes as `site.data.fhir.ig`. */
export interface IgResourceFields {
  id?: string;
  url?: string;
  name?: string;
  title?: string;
  version?: string;
  status?: string;
  publisher?: string;
  fhirVersion?: string[];
}

export interface FhirSiteData {
  packageId?: string;
  canonical?: string;
  ig: IgResourceFields;
}

export interface IgSiteDataResult {
  data: FhirSiteData;
  /** Which file each written field came from. */
  provenance: Record<string, string>;
  /** Fields a Publisher build would have and this could not source. */
  undetermined: string[];
  /** Sources read and deliberately not used, with why. */
  refused: string[];
}

const ALL_IG_FIELDS: Array<keyof IgResourceFields> = ["id", "url", "name", "title", "version", "status", "publisher", "fhirVersion"];

const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v : undefined);

function readJson(p: string): Record<string, unknown> | undefined {
  try {
    return JSON.parse(readFileSync(p, "utf-8")) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

/** Compute `site.data.fhir` for the IG at `igRoot`. Throws when no source exists. */
export function igSiteData(igRoot: string): IgSiteDataResult {
  const ig: IgResourceFields = {};
  const data: FhirSiteData = { ig };
  const provenance: Record<string, string> = {};
  const refused: string[] = [];
  const set = (field: string, value: unknown, from: string) => {
    if (value === undefined) return;
    const [head, tail] = field.split(".");
    if (tail) (data as unknown as Record<string, Record<string, unknown>>)[head!]![tail] = value;
    else (data as unknown as Record<string, unknown>)[head!] = value;
    provenance[field] = from;
  };

  const sushiPath = join(igRoot, "sushi-config.yaml");
  const indexPath = join(igRoot, "fhir-artifact-index", "index.json");

  if (existsSync(sushiPath)) {
    const s = (parseYaml(readFileSync(sushiPath, "utf-8")) ?? {}) as Record<string, unknown>;
    const from = "sushi-config.yaml";
    const id = str(s.id);
    const canonical = str(s.canonical);
    set("ig.id", id, from);
    set("ig.name", str(s.name), from);
    set("ig.title", str(s.title), from);
    set("ig.version", str(s.version), from);
    set("ig.status", str(s.status), from);
    const pub = s.publisher;
    set("ig.publisher", str(pub) ?? str((pub as { name?: unknown } | undefined)?.name), from);
    const fv = s.fhirVersion;
    set("ig.fhirVersion", Array.isArray(fv) ? fv.map(String) : str(fv) ? [String(fv)] : undefined, from);
    set("canonical", canonical, from);
    // SUSHI's own rule: packageId defaults to id.
    set("packageId", str(s.packageId) ?? id, from);
    if (canonical && id) set("ig.url", `${canonical}/ImplementationGuide/${id}`, from);
  } else if (existsSync(indexPath)) {
    const idx = readJson(indexPath);
    if (!idx) throw new Error(`${indexPath} is not valid JSON`);
    const from = "fhir-artifact-index/index.json";
    set("packageId", str(idx.packageId), from);
    set("canonical", str(idx.canonicalBase), from);
    set("ig.version", str(idx.version), from);
    if (Array.isArray(idx.fhirVersion)) set("ig.fhirVersion", idx.fhirVersion.map(String), from);
    // Status is THIS IG's own fact, read from its own sushi-config into
    // `ig-identity.json` beside the index. The chrome is the template chain's
    // (`folio-ig-chrome/v2`) and states no IG's status at all.
    const identity = readIgIdentity(join(igRoot, "fhir-artifact-index"));
    if (identity) {
      const status = statusOf(identity, data.packageId);
      if (status !== undefined) {
        set("ig.status", status, `fhir-artifact-index/${IG_IDENTITY_FILENAME}`);
      } else {
        refused.push(
          `fhir-artifact-index/${IG_IDENTITY_FILENAME} names ${identity.id} ${identity.version ?? ""}`.trim() +
            `, not ${data.packageId ?? "this IG"} — its status is another IG's`,
        );
      }
    }
  } else {
    throw new Error(`no sushi-config.yaml or fhir-artifact-index/index.json under ${igRoot}: nothing to populate site.data.fhir from`);
  }

  const undetermined = [
    ...ALL_IG_FIELDS.filter((f) => ig[f] === undefined).map((f) => `ig.${f}`),
    ...(["packageId", "canonical"] as const).filter((f) => data[f] === undefined),
  ];
  return { data, provenance, undetermined, refused };
}

export function describeSiteData(r: IgSiteDataResult): string {
  const lines = [`site.data.fhir: ${Object.keys(r.provenance).length} field(s) written`];
  if (r.undetermined.length) lines.push(`  undetermined (not written): ${r.undetermined.join(", ")}`);
  for (const x of r.refused) lines.push(`  refused: ${x}`);
  return lines.join("\n");
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const opt = (k: string) => {
    const i = args.indexOf(k);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const igRoot = opt("--ig");
  const out = opt("--out");
  if (!igRoot || !out) {
    console.error("usage: ig-site-data.ts --ig <IG root> --out <site>/_data/fhir.json [--check]");
    process.exit(2);
  }
  const r = igSiteData(resolve(igRoot));
  const text = JSON.stringify(r.data, null, 2) + "\n";
  if (args.includes("--check")) {
    const current = existsSync(out) ? readFileSync(out, "utf-8") : undefined;
    if (current !== text) {
      console.error(`✗ ${out} is stale or missing — run without --check`);
      process.exit(1);
    }
    console.log(describeSiteData(r));
    process.exit(0);
  }
  mkdirSync(dirname(resolve(out)), { recursive: true });
  writeFileSync(out, text);
  console.log(describeSiteData(r));
  console.log(`wrote ${out}`);
}
