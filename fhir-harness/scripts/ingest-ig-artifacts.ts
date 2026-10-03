#!/usr/bin/env bun
/**
 * Reconstruct a published FHIR IG's artefact index.
 *
 * @module folio-assistant-core/scripts/ingest-ig-artifacts
 *
 * ```sh
 * bun run folio-assistant-core/scripts/ingest-ig-artifacts.ts \
 *   --source /path/to/gh-pages --kind gh-pages --id smart-trust \
 *   --base https://worldhealthorganization.github.io/smart-trust \
 *   --out smart-trust --materialize-sidecars
 * ```
 *
 * `--check` re-runs the ingest and exits non-zero if the committed index
 * differs, which is what makes this graph a regenerable one rather than a
 * snapshot nobody can re-derive.
 *
 * ## Why this reads four files and trusts none of them alone
 *
 * No IG publishes an artefact index — see the module doc on
 * `folio-assistant-core/schemas/fhir-artifact-index.ts`. What it publishes is
 * four partial views, and the coverage gaps between them are not incidental.
 * Measured on smart-trust v1.8.0:
 *
 * | file | entries | holds |
 * |---|---|---|
 * | `canonicals.json` | 70 | definitional artefacts only — with canonical URL, version, name |
 * | `package.tgz` -> `package/.index.json` | 674 | everything, including 453 Endpoints and 151 Organizations |
 * | `artifacts.html` | 676 | every artefact's editorial CATEGORY and human title — available nowhere else |
 * | `package.manifest.json` | 1 | package id, version, FHIR version, build date |
 *
 * `canonicals.json` is missing 604 of the 674. `.index.json` has all of them
 * but no titles, no categories, no canonical URLs, and a truncated
 * `"type": "["` on every Organization. `artifacts.html` is the only source of
 * a category. So the ingest merges, and records in `provenance` which files it
 * actually had — an IG missing one of them yields a thinner index, not a
 * guessed one.
 */
import { createHash } from "node:crypto";
import { readFileSync, existsSync, mkdirSync, writeFileSync, copyFileSync, statSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";
import { gunzipSync } from "node:zlib";
import {
  FHIR_ARTIFACT_INDEX_SCHEMA_TAG,
  FhirArtifactIndexSchema,
  materializationCensus,
  sidecarCensus,
  type FhirArtifact,
  type FhirArtifactIndex,
  type Representation,
  type UnboundSidecar,
  type IgSourceKind,
} from "../schemas/fhir-artifact-index.js";

/** The IG publisher's per-artefact representations, by extension. */
const FORMATS = ["json", "xml", "ttl", "html"] as const;

/**
 * Minimal gzip+tar reader, enough for `package.tgz`.
 *
 * Inlined rather than taken as a dependency because it reads exactly one file
 * out of one archive shape the IG publisher emits, and a tar library would be
 * a supply-chain surface for 40 lines of header arithmetic.
 */
function readFromTgz(tgzPath: string, wanted: string): string | undefined {
  const buf = gunzipSync(readFileSync(tgzPath));
  let off = 0;
  while (off + 512 <= buf.length) {
    const name = buf.toString("utf8", off, off + 100).replace(/\0.*$/, "");
    if (!name) break;
    const sizeField = buf.toString("utf8", off + 124, off + 136).replace(/\0.*$/, "").trim();
    const size = parseInt(sizeField, 8) || 0;
    const body = off + 512;
    if (name === wanted || name === `./${wanted}`) return buf.toString("utf8", body, body + size);
    off = body + Math.ceil(size / 512) * 512;
  }
  return undefined;
}

/** Strip tags and collapse whitespace — for the description cell of `artifacts.html`. */
function textOf(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
}

interface HtmlEntry { key: string; title?: string; description?: string; category: string }

/**
 * Parse `artifacts.html` into category -> artefacts.
 *
 * The `title` attribute on each link carries `ResourceType/id` verbatim, which
 * is the index's own `key` format — so the category join is on an identifier
 * the IG publisher wrote, not one this script composed from a filename.
 */
function parseArtifactsHtml(html: string): HtmlEntry[] {
  const out: HtmlEntry[] = [];
  // Sections are `<a name="N"> </a> <h3>Category </h3>` up to the next anchor.
  const sections = html.split(/<a name="\d+">/).slice(1);
  for (const section of sections) {
    const h3 = /<h3[^>]*>([^<]+)<\/h3>/.exec(section);
    if (!h3) continue;
    const category = h3[1].trim();
    const rowRe = /<tr>\s*<td[^>]*>\s*<a href="([^"]+)"(?:\s+title="([^"]*)")?[^>]*>([\s\S]*?)<\/a>\s*<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/g;
    let m: RegExpExecArray | null;
    while ((m = rowRe.exec(section)) !== null) {
      const [, href, titleAttr, linkText, descCell] = m;
      // Prefer the publisher's own `ResourceType/id`; fall back to the filename.
      const key = titleAttr?.includes("/") ? titleAttr : basename(href).replace(/\.html$/, "").replace("-", "/");
      out.push({ key, title: textOf(linkText) || undefined, description: textOf(descCell) || undefined, category });
    }
  }
  return out;
}

function rep(dir: string, base: string, file: string, local?: string): Representation | undefined {
  const abs = join(dir, file);
  if (!existsSync(abs)) return undefined;
  const r: Representation = { url: `${base.replace(/\/$/, "")}/${file}` };
  if (local) { r.localPath = local; r.bytes = statSync(abs).size; }
  return r;
}

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function main(): void {
  const source = arg("source");
  const out = arg("out");
  const check = process.argv.includes("--check");
  const materializeSidecars = process.argv.includes("--materialize-sidecars");
  // Where materialised sidecars land, under `fhir-artifact-index/`. A flag,
  // because this layer names no publisher's layout; an instance that already
  // holds them elsewhere (WHO's smart-* use `dak/`) passes its own.
  const sidecarDir = arg("sidecar-dir") ?? "sidecars";
  const materializePackage = process.argv.includes("--materialize-package");
  const USAGE =
    "usage: ingest-ig-artifacts.ts --source <dir> --out <dir> [--id <id>] " +
    "[--base <url>] [--kind gh-pages|output] [--materialize-sidecars] [--sidecar-dir <dir>] " +
    "[--api-hub-page <file>] [--api-hub-markers <START>,<END>] [--api-placeholder <NAME>] [--check]";

  // A MISINVOCATION AND "NOTHING HERE TO CHECK" ARE DIFFERENT, and printing one
  // usage string for both is why `ingest:ig:check` read as a broken script for
  // as long as it did.
  //
  // Measured 2026-09-22: the registered `ingest:ig:check` ended in a dangling
  // `--source` with no value, so every run printed the line above and exited 2.
  // It escaped the "no check script is unrun" test because that covers
  // `check:*`-prefixed scripts only, and no workflow invokes it — a registered
  // script nobody runs, which would have failed if anybody had.
  //
  // The dangling flag is fixed in `package.json`. What is fixed HERE is the
  // report: with `--out` naming an index whose `source.of` is a REMOTE URL,
  // there is no local directory to diff against, and saying so is a different
  // statement from "you typed the command wrong". `--check` cannot pass over
  // nothing either — a checker with no input that exited 0 would be the `dh4f`
  // shape, a clean run over a corpus it never saw.
  if (!source && out && check) {
    const idxPath = join(out, "fhir-artifact-index", "index.json");
    const of = existsSync(idxPath)
      ? (JSON.parse(readFileSync(idxPath, "utf8")) as Partial<FhirArtifactIndex>).source?.of
      : undefined;
    console.error(
      of
        ? `--check needs a local IG build to compare against, and none was given.\n` +
          `  ${idxPath} records its source as ${of}\n` +
          `  — a REMOTE build, so there is nothing on disk to diff. Fetch it and pass\n` +
          `  --source <dir>, or run this where the IG output lives. Not a pass: a\n` +
          `  checker with no input cannot report a clean corpus.`
        : `--check needs --source <dir>, and ${idxPath} records no source to name one.\n${USAGE}`,
    );
    process.exit(1);
  }
  if (!source || !out) {
    console.error(USAGE);
    process.exit(2);
  }

  // `id`, `base` and `kind` default to what the COMMITTED index already
  // records about itself. An index carries its own `source.of`, `source.kind`
  // and `id`, so re-deriving it needs only the source bytes — and a checker
  // that restated them on the command line could disagree with the file it is
  // checking, which is the one thing a checker must not do.
  const committedPath = join(out, "fhir-artifact-index", "index.json");
  const committed: Partial<FhirArtifactIndex> = existsSync(committedPath)
    ? JSON.parse(readFileSync(committedPath, "utf8"))
    : {};
  const id = arg("id") ?? committed.id;
  const base = arg("base") ?? committed.source?.of;
  const kind = (arg("kind") ?? committed.source?.kind ?? "gh-pages") as IgSourceKind;
  if (!id || !base) {
    console.error("--id and --base are required when no committed index exists at " + committedPath);
    process.exit(2);
  }

  // THREE outcomes, not two. A source that is not present means the index
  // could not be re-derived — which is never the same as "the index is
  // current". Exit 2 is that third state, and it is why this check is not
  // wired into a gate that would read a missing clone as a pass.
  if (!existsSync(source)) {
    console.error(`could not determine: source not present at ${source}`);
    console.error(check ? "  the committed index was NOT verified" : "  nothing was ingested");
    process.exit(2);
  }

  const provenance: FhirArtifactIndex["provenance"] = {};
  const read = (f: string): string | undefined => (existsSync(join(source, f)) ? readFileSync(join(source, f), "utf8") : undefined);

  // ── package.manifest.json — the IG's own identity ──────────────────────
  const manifestRaw = read("package.manifest.json");
  const manifest = manifestRaw ? JSON.parse(manifestRaw) : {};
  if (manifestRaw) provenance.packageManifest = "package.manifest.json";

  // ── canonicals.json — the definitional spine ──────────────────────────
  const canonicalsRaw = read("canonicals.json");
  const canonicals: Array<Record<string, string>> = canonicalsRaw ? JSON.parse(canonicalsRaw) : [];
  if (canonicalsRaw) provenance.canonicals = "canonicals.json";

  // ── package.tgz -> .index.json — everything else ───────────────────────
  let pkgFiles: Array<Record<string, string>> = [];
  if (existsSync(join(source, "package.tgz"))) {
    const idxRaw = readFromTgz(join(source, "package.tgz"), "package/.index.json");
    if (idxRaw) { pkgFiles = JSON.parse(idxRaw).files ?? []; provenance.packageIndex = "package.tgz!package/.index.json"; }
  }

  // ── artifacts.html — the only source of a category ─────────────────────
  const htmlRaw = read("artifacts.html");
  const htmlEntries = htmlRaw ? parseArtifactsHtml(htmlRaw) : [];
  if (htmlRaw) provenance.artifactsHtml = "artifacts.html";
  const htmlByKey = new Map(htmlEntries.map((e) => [e.key, e]));
  // First appearance on the page: the Publisher's own order (see `listedAt`).
  const htmlPosition = new Map<string, number>();
  htmlEntries.forEach((e, i) => { if (!htmlPosition.has(e.key)) htmlPosition.set(e.key, i); });

  // ── IG API detection ──────────────────────────────────────────────────
  // Keyed off the ENUMERATION SCHEMAS at the published root. Never off the
  // presence of `openapi/`, which in smart-trust holds the DDCC Gateway API —
  // a domain API that merely lives there.
  const enumerations = readdirSync(source).filter((f) => /^[A-Za-z]+\.schema\.json$/.test(f)).sort();
  const sidecarApi = enumerations.length > 0 ? "present" : "absent";
  if (enumerations.length) provenance.sidecarEnumerations = enumerations;

  // ── Merge into one artefact per key ───────────────────────────────────
  const byKey = new Map<string, FhirArtifact>();
  const ensure = (resourceType: string, rid: string): FhirArtifact => {
    const key = `${resourceType}/${rid}`;
    let a = byKey.get(key);
    if (!a) {
      const stem = `${resourceType}-${rid}`;
      const published: FhirArtifact["published"] = {};
      for (const f of FORMATS) {
        const r = rep(source, base, `${stem}.${f}`);
        if (r) published[f] = r;
      }
      a = { key, resourceType, id: rid, published, materialization: { state: "referenced", provenance: { upstream: `${base.replace(/\/$/, "")}/${stem}.html` } } };
      byKey.set(key, a);
    }
    return a;
  };

  for (const f of pkgFiles) if (f.resourceType && f.id) ensure(f.resourceType, f.id);
  for (const c of canonicals) {
    if (!c.type || !c.id) continue;
    const a = ensure(c.type, c.id);
    if (c.url) a.canonical = c.url;
    if (c.version) a.version = c.version;
    if (c.name) a.name = c.name;
  }
  for (const [key, e] of htmlByKey) {
    const [resourceType, ...rest] = key.split("/");
    if (!resourceType || rest.length === 0) continue;
    const a = ensure(resourceType, rest.join("/"));
    a.category = e.category;
    a.listedAt = htmlPosition.get(key);
    if (e.title) a.title = e.title;
    if (e.description) a.description = e.description;
  }

  /**
   * The five materialisation gates for an IG API sidecar.
   *
   * `size.basis` is MEASURED from this IG's own surface at ingest time. It was
   * a hardcoded sentence quoting smart-trust's 332K/71 files and 7.1M corpus,
   * which every other IG's index would then have asserted about itself — a
   * basis that is wrong for its subject is worse than none, because it reads
   * as though somebody checked.
   */
  const apiGates = (): NonNullable<FhirArtifact["materialization"]["gates"]> => ({
    size: {
      verdict: "permitted",
      basis:
        `The IG API surface materialised here is ${apiBytes().toLocaleString()} bytes across ` +
        `${apiFiles} file(s), measured from ${base} at ingest. The full resource corpus is left by reference.`,
    },
    restrictions: { verdict: "permitted", basis: "Published openly on the IG's public Pages site; no access control on the source." },
    retention: { verdict: "permitted", basis: "Working copy, regenerable by re-running this ingest against the same source revision." },
    sourceLoss: { verdict: "unknown", basis: "Not established. The IG is actively published; no statement has been made about how long a given version's Pages build remains reachable." },
    copyright: { verdict: "unknown", basis: "Not established. The IG's content licensing has not been read for this ingest." },
  });
  let apiFiles = 0;
  let apiByteTotal = 0;
  const apiBytes = (): number => apiByteTotal;

  // ── DAK overlay ───────────────────────────────────────────────────────
  //
  // RESOLVED THROUGH THE ENUMERATION, not composed from the artefact's id.
  //
  // The first version keyed sidecars off `<ResourceType>-<id>`, and that held
  // for smart-trust only because its ids happen to equal the published stems.
  // smart-immunizations names a Logical Model's sidecar after the model's
  // TITLE — `StructureDefinition-IMMZ_C4_Create_client_record` for the
  // artefact `StructureDefinition/IMMZC4` — so ten of its 198 schemas bound to
  // nothing and the census came out ten short, in silence.
  //
  // So the enumeration's own `example.schemas[]` is the map, tried in
  // descending order of authority:
  //
  //   1. the canonical URL it carries (`valueSetUrl` / `logicalModelUrl`)
  //   2. the filename stem, which is what the old code assumed
  //   3. the title, against an artefact's `title` or `name`
  //
  // Each is a fact the PUBLISHER wrote down; none is a guess about layout. The
  // asymmetry is real and no single field can carry it: smart-immunizations
  // fills `valueSetUrl` on 190 of 191 ValueSets and `logicalModelUrl` on NONE
  // of 11 Logical Models, though its own schema declares that field.
  //
  // Anything still unbound is RECORDED in `sidecarsUnbound`, never dropped — the
  // defect above was invisible precisely because nothing recorded it.
  //
  // `dak/` sits inside the declared graph directory rather than beside it, so
  // one declaration covers the index and the bytes it points at.
  interface EnumEntry {
    filename?: string;
    title?: string;
    valueSetUrl?: string;
    logicalModelUrl?: string;
    codeCount?: number;
    propertyCount?: number;
  }
  const graphDir = join(out, "fhir-artifact-index");
  const sidecarsDir = join(graphDir, sidecarDir);
  const materialized: Array<[string, string]> = [];
  const unbound: UnboundSidecar[] = [];
  const materializedStems = new Map<string, string>();
  /** `<sidecar-dir>/<basename>` → the source file it was copied from, for fixity. */
  const materializedFrom = new Map<string, string>();
  /** Sidecars published twice with different bytes — the root copy is the one read. */
  const divergentSidecars: string[] = [];

  const byCanonical = new Map<string, FhirArtifact>();
  const byStem = new Map<string, FhirArtifact>();
  const byTitle = new Map<string, FhirArtifact>();
  for (const a of byKey.values()) {
    if (a.canonical) byCanonical.set(a.canonical, a);
    byStem.set(`${a.resourceType}-${a.id}`, a);
    if (a.title) byTitle.set(a.title, a);
    if (a.name) byTitle.set(a.name, a);
  }

  /** Attach the four sidecars named by `stem`, materialising if asked. Returns whether any landed. */
  const attach = (a: FhirArtifact, stem: string, counts?: EnumEntry): boolean => {
    // THE ROOT COPY FIRST, `schemas/` only as a fallback. Measured 2026-10-01
    // on litlfred/smart-trust gh-pages 9bd9643: all 52 schema, displays and
    // OpenAPI sidecars exist in BOTH places and EVERY pair differs. The root
    // copy is what smart-base's current generator writes (Coding-shaped
    // values), what the IG's own `dak-api.html`, its artefact pages' Endpoints
    // section and its `.schema.json.html` view pages all link, and what a
    // reader of the published IG therefore sees; `schemas/` holds an older
    // format (IRI-string enums) under the same `$id`. An IG that publishes only
    // under `schemas/` (the shape this ingest was first written against) is
    // still read. Each divergent pair is reported, never silently picked.
    const candidates = (name: string) => [name, `schemas/${name}`];
    const sidecars: Array<[keyof NonNullable<FhirArtifact["sidecars"]>, string[]]> = [
      ["schema", candidates(`${stem}.schema.json`)],
      ["displays", candidates(`${stem}.displays.json`)],
      ["openapi", candidates(`${stem}.openapi.json`)],
      ["jsonld", [`${stem}.jsonld`]],
    ];
    let any = false;
    for (const [slot, paths] of sidecars) {
      const file = paths.find((f) => existsSync(join(source, f)));
      if (file === undefined) continue;
      const shadow = paths.find((f) => f !== file && existsSync(join(source, f)));
      if (shadow && !readFileSync(join(source, shadow)).equals(readFileSync(join(source, file)))) {
        divergentSidecars.push(`${file} ≠ ${shadow}`);
      }
      const local = materializeSidecars ? join("fhir-artifact-index", sidecarDir, basename(file)) : undefined;
      const r = rep(source, base, file, local);
      if (!r) continue;
      a.sidecars = a.sidecars ?? {};
      (a.sidecars as Record<string, unknown>)[slot] = r;
      if (materializeSidecars) {
        materialized.push([file, basename(file)]);
        // The copy into `dak/` happens at the end of the run, long after the
        // materialization records are built — so fixity is taken from the
        // SOURCE, and this is what maps a recorded `localPath` back to it.
        materializedFrom.set(basename(file), file);
      }
      apiFiles += 1;
      apiByteTotal += r.bytes ?? statSync(join(source, file)).size;
      any = true;
    }
    if (any && counts?.codeCount !== undefined) a.sidecars = { ...a.sidecars, codeCount: counts.codeCount };
    if (any && counts?.propertyCount !== undefined) a.sidecars = { ...a.sidecars, propertyCount: counts.propertyCount };
    // Gates are assigned AFTER every sidecar has landed, not here: `apiGates`
    // reads running totals, so building them mid-loop gave each artefact a
    // different "measured" surface — 14 files on the first, hundreds on the
    // last. A basis that varies per row is not a measurement.
    if (any) materializedStems.set(a.key, stem);
    return any;
  };

  if (sidecarApi === "present") {
    // Pass 1 — the enumerations, which are authoritative about what exists.
    for (const enumFile of enumerations) {
      let entries: EnumEntry[] = [];
      try {
        entries = JSON.parse(readFileSync(join(source, enumFile), "utf8"))?.example?.schemas ?? [];
      } catch {
        entries = [];
      }
      for (const e of entries) {
        if (!e?.filename) continue;
        // An enumeration lists ITSELF. That is not an artefact and not a gap.
        if (enumerations.includes(e.filename)) continue;
        const stem = e.filename.replace(/\.schema\.json$/, "");
        const canonical = e.valueSetUrl ?? e.logicalModelUrl;
        const a =
          (canonical ? byCanonical.get(canonical) : undefined) ??
          byStem.get(stem) ??
          (e.title ? byTitle.get(e.title) : undefined);
        if (!a) {
          unbound.push({
            filename: e.filename,
            ...(e.title ? { title: e.title } : {}),
            enumeration: enumFile,
            reason: `no artefact matched by canonical URL (${canonical ?? "not given"}), stem (${stem}) or title`,
          });
          continue;
        }
        attach(a, stem, e);
      }
    }
    // Pass 2 — artefacts no enumeration mentioned, by their own stem. This is
    // what covers an IG publishing sidecars it does not enumerate.
    for (const a of byKey.values()) {
      if (a.sidecars) continue;
      attach(a, `${a.resourceType}-${a.id}`);
    }
    // One measurement, taken once, applied to every materialised node.
    const gates = apiGates();
    // Keys only: the stem used to compose `localPath` and no longer does —
    // the path is read from the sidecar that actually attached.
    for (const key of materializedStems.keys()) {
      const a = byKey.get(key);
      if (!a) continue;
      // LOCALPATH MUST NAME A SIDECAR THAT ACTUALLY LANDED.
      //
      // It was hardcoded to `${stem}.schema.json`, while `materializedStems`
      // is set when ANY of the four sidecars lands. An artefact publishing
      // only a `.jsonld` therefore got a materialization pointing at a schema
      // file that was never written — a record asserting bytes that are not
      // there, which `check-materialized-fixity` reports as `absent`.
      //
      // Measured 2026-09-22 on smart-immunizations: `IMMZ.D.DE19` and
      // `IMMZ.Z.VS`, both `sidecars: { jsonld }` only, both declaring a
      // `.schema.json` that does not exist and never did. 198 schema files on
      // disk against 200 materialized claims.
      //
      // Preference order matches what a consumer wants first — the schema is
      // the richest sidecar — but the path is now READ from what attached
      // rather than composed from a stem and a hope.
      const landed = ["schema", "displays", "openapi", "jsonld"]
        .map((slot) => (a.sidecars as Record<string, { localPath?: string }> | undefined)?.[slot]?.localPath)
        .find((p): p is string => typeof p === "string");
      if (landed === undefined) {
        // Nothing materialised after all. Leaving the node `referenced` is the
        // true answer; claiming `materialized` with no path would be the same
        // defect one step along.
        continue;
      }
      a.materialization = {
        state: "materialized",
        provenance: a.materialization.provenance,
        localPath: landed,
        purpose: "working",
        // FIXITY AT MATERIALISE TIME, which is the only moment it can be
        // recorded as a fact rather than observed later as a baseline.
        // `materialization.ts` already said "the fixity data already exists …
        // nothing reads them as fixity today"; nothing WROTE them here either,
        // which is why 217 artefacts needed backfilling.
        ...(() => {
          const from = materializedFrom.get(basename(landed));
          if (from === undefined) return {};
          return {
            fixity: {
              algorithm: "sha256" as const,
              digest: createHash("sha256").update(readFileSync(join(source, from))).digest("hex"),
            },
          };
        })(),
        gates,
      };
    }
  }

  // ── JSON-LD contexts, indexed at IG level ─────────────────────────────
  const contexts: FhirArtifactIndex["contexts"] = [];
  const ctxDir = join(source, "tng-context");
  if (existsSync(ctxDir)) {
    for (const f of readdirSync(ctxDir).filter((n) => n.endsWith(".jsonld")).sort()) {
      const local = materializeSidecars ? join("fhir-artifact-index", sidecarDir, "contexts", f) : undefined;
      const r = rep(source, base, `tng-context/${f}`, local);
      if (r) { contexts.push({ id: `tng-context/${f.replace(/\.jsonld$/, "")}`, representation: r }); if (materializeSidecars) materialized.push([`tng-context/${f}`, join("contexts", f)]); }
    }
  }

  // ── The IG API hub, a fragment of the IG's hub page ───────────────────
  // The hub is generated AFTER the Publisher, into a page whose source holds
  // only a placeholder, so the published page is the one place it exists.
  // Held verbatim between its own markers: a page fetches it (bean `680p`)
  // instead of retyping prose that the IG's own post-processing owns.
  //
  // The page's name, its two markers and the source placeholder are the
  // post-processor's, never this layer's (bean `d313`): flags with generic
  // defaults, and an IG that publishes a hub under other names (WHO's DAK
  // overlay: `dak-api.html`, `DAK_API_HUB_START/END`, `DAK_API_CONTENT`)
  // passes its own.
  const [HUB_START, HUB_END] = (arg("api-hub-markers") ?? "IG_API_HUB_START,IG_API_HUB_END").split(",").map((m) => `<!-- ${m.trim()} -->`);
  const hubFile = arg("api-hub-page") ?? "ig-api.html";
  const hubPlaceholder = arg("api-placeholder") ?? "IG_API_CONTENT";
  // Named after the hub page, so WHO's stays `dak-api-hub.json` and a generic
  // IG's is `ig-api-hub.json`, with no name of either written here.
  const hubDataFile = `${hubFile.replace(/\.html$/, "")}-hub.json`;
  let hub: { fragment: string; rep: Representation & { placeholder: string } } | undefined;
  const hubPage = join(source, hubFile);
  if (materializeSidecars && sidecarApi === "present" && existsSync(hubPage)) {
    const html = readFileSync(hubPage, "utf8");
    const a = html.indexOf(HUB_START);
    const b = html.indexOf(HUB_END);
    if (a >= 0 && b > a) {
      // Held as DATA — a JSON node carrying the HTML — never as an `.html`
      // file: published in the served graph, an `.html` fragment is a page
      // with no <body>, which the staging banner refuses (and rightly: it is
      // not a page). Measured on PR #1766's staging job, 2026-10-01.
      const url = `${base.replace(/\/$/, "")}/${hubFile}`;
      const fragment = `${JSON.stringify({ from: url, between: [HUB_START, HUB_END], html: html.slice(a, b + HUB_END.length) }, null, 2)}\n`;
      hub = {
        fragment,
        rep: { url, localPath: join("fhir-artifact-index", sidecarDir, hubDataFile), bytes: Buffer.byteLength(fragment), placeholder: `<!-- ${hubPlaceholder} -->` },
      };
    } else {
      console.log(`  ${hubFile} carries no ${HUB_START} … ${HUB_END} pair — no hub held`);
    }
  }

  // ── Canonical base ────────────────────────────────────────────────────
  // Taken from the IG's OWN canonical by stripping the resource segments the
  // publisher appends — never composed from the Pages URL, which is a
  // different namespace: smart-trust publishes at
  // worldhealthorganization.github.io and is canonical at smart.who.int.
  const igCanonical = canonicals.find((c) => c.type === "ImplementationGuide")?.url;
  const canonicalBase = igCanonical?.replace(/\/ImplementationGuide\/.*$/, "");

  const artifacts = [...byKey.values()].sort((a, b) => a.key.localeCompare(b.key));
  const index: FhirArtifactIndex = {
    $schema: FHIR_ARTIFACT_INDEX_SCHEMA_TAG,
    id,
    title: manifest.name ? `${manifest.name} — artefact index` : `${id} — artefact index`,
    ...(manifest.name ? { packageId: manifest.name } : {}),
    ...(manifest.version ? { version: manifest.version } : {}),
    ...(manifest.fhirVersion ? { fhirVersion: manifest.fhirVersion } : {}),
    ...(canonicalBase ? { canonicalBase } : {}),
    ...(manifest.date ? { builtAt: manifest.date } : {}),
    source: { kind, of: base, readAt: new Date().toISOString().slice(0, 10) },
    provenance,
    sidecarApi,
    ...(contexts.length ? { contexts } : {}),
    ...(hub ? { igApiHub: hub.rep } : {}),
    ...(materializePackage ? (() => {
      const r = rep(source, base, "package.tgz", join("fhir-artifact-index", "package.tgz"));
      return r ? { package: r } : {};
    })() : {}),
    ...(unbound.length ? { sidecarsUnbound: unbound } : {}),
    count: artifacts.length,
    artifacts,
  };

  const parsed = FhirArtifactIndexSchema.safeParse(index);
  if (!parsed.success) {
    console.error("the reconstructed index does not validate:");
    console.error(JSON.stringify(parsed.error.issues.slice(0, 10), null, 2));
    process.exit(1);
  }

  const outFile = committedPath;
  const serialized = `${JSON.stringify(index, null, 2)}\n`;

  if (check) {
    if (!existsSync(outFile)) { console.error(`--check: ${outFile} does not exist`); process.exit(1); }
    const onDisk = readFileSync(outFile, "utf8");
    // `readAt` moves every run by design; comparing it would make --check always fail.
    const strip = (s: string): string => s.replace(/"readAt": "[^"]*"/, '"readAt": "<ignored>"');
    if (strip(onDisk) !== strip(serialized)) { console.error(`--check: ${outFile} is stale — re-run without --check`); process.exit(1); }
    console.log(`ok: ${outFile} is current (${index.count} artefacts)`);
    return;
  }

  mkdirSync(graphDir, { recursive: true });
  writeFileSync(outFile, serialized);
  if (materializeSidecars && materialized.length) {
    mkdirSync(join(sidecarsDir, "contexts"), { recursive: true });
    for (const [from, to] of materialized) copyFileSync(join(source, from), join(sidecarsDir, to));
  }
  if (hub) writeFileSync(join(graphDir, sidecarDir, hubDataFile), hub.fragment);
  if (materializePackage && existsSync(join(source, "package.tgz"))) copyFileSync(join(source, "package.tgz"), join(graphDir, "package.tgz"));

  const census = materializationCensus(artifacts);
  const sidecarCounts = sidecarCensus(artifacts);
  console.log(`${outFile}: ${index.count} artefacts`);
  console.log(`  sidecarApi: ${sidecarApi}; provenance: ${Object.keys(provenance).join(", ") || "none"}`);
  console.log(`  materialization: ${Object.entries(census).map(([k, v]) => `${k}=${v}`).join(" ")}`);
  console.log(`  sidecars: ${Object.entries(sidecarCounts).map(([k, v]) => `${k}=${v}`).join(" ")}`);
  if (divergentSidecars.length > 0) {
    console.log(`  ${divergentSidecars.length} sidecar(s) published twice with different bytes; the root copy was read:`);
    for (const d of divergentSidecars.slice(0, 5)) console.log(`    ${d}`);
    if (divergentSidecars.length > 5) console.log(`    …and ${divergentSidecars.length - 5} more`);
  }
  console.log(`  contexts: ${contexts.length}`);
  if (hub) console.log(`  IG API hub: ${hub.rep.bytes} bytes from ${hubFile}`);
  if (unbound.length) {
    console.log(`  UNBOUND sidecars: ${unbound.length} — listed by an enumeration, matched to no artefact:`);
    for (const u of unbound.slice(0, 5)) console.log(`    ${u.filename}${u.title ? ` (${u.title})` : ""}`);
    if (unbound.length > 5) console.log(`    …and ${unbound.length - 5} more; all are recorded in the index`);
  }
}

main();
