#!/usr/bin/env bun
/**
 * Derive a `folio-fhir-artifact-index/v1` from a restored IG Publisher AST,
 * and compare it with an index ingested from the published IG.
 *
 * @module fhir-harness/scripts/ast-to-artifact-index
 * @covers fhir-artifact-index
 *
 * ## Why
 *
 * `gen-ig-pages.ts` renders an IG's reader-facing pages from its artefact
 * index, and until now the only index was the one ingested from the IG's
 * PUBLISHED output (`gh-pages`). An AST restored with `ig-cache.sh restore`
 * holds the same artefacts straight from the build, so converting it to the
 * same index shape lets the SAME renderer draw the site from the AST — one
 * renderer, two sources — and the comparison below says exactly where the two
 * disagree. That is the full AST pipeline under test: restore → validity →
 * index → pages (bean wnhh, owner 2026-10-02).
 *
 * It is also what a separated IG repository needs: it can render its own
 * site from its own AST without ingesting its own published output first.
 *
 * ## What the AST does NOT carry, and what is done about it
 *
 * - **Category.** The Publisher assigns the editorial grouping when it writes
 *   `artifacts.html`; the AST stops before that. {@link publisherCategory}
 *   applies the Publisher's DEFAULT grouping by resource type. An IG that
 *   regroups artefacts by hand will differ, and {@link compareIndexes} names
 *   every artefact where it does — the difference is reported, never hidden.
 * - **Where it is published.** A canonical URL is an identity, not an
 *   address. `--published-base` supplies the address; without it no
 *   `published` representation is claimed.
 *
 * Every artefact is `materialized` with purpose `compiled`, and carries the
 * manifest's `inputs`, so the index says what it was built from. Nothing here
 * marks the AST authoritative: its manifest says `authority: "cache"`, and
 * the pages drawn from it are a cache's until a full Publisher run.
 *
 * Nothing here may know about WHO (fhir-harness/AGENTS.md).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { AST_GATES, readAst, type Ast, type AstResource } from "./ig-ast";
import {
  FHIR_ARTIFACT_INDEX_SCHEMA_TAG,
  FhirArtifactIndexSchema,
  type FhirArtifact,
  type FhirArtifactIndex,
  type PublishedFormats,
} from "../schemas/fhir-artifact-index.js";

/** The fields of a FHIR resource the index reads. */
interface ResourceJson {
  resourceType?: string;
  id?: string;
  url?: string;
  version?: string;
  name?: string;
  title?: string;
  description?: string;
  kind?: string;
  type?: string;
  derivation?: string;
}

/**
 * The IG Publisher's DEFAULT `artifacts.html` grouping for a resource, or
 * undefined where the Publisher writes no artefact page (the IG itself).
 *
 * The labels are the Publisher's own; an IG that sets `groupingId` by hand is
 * the case this cannot see, and {@link compareIndexes} reports it.
 */
export function publisherCategory(r: ResourceJson): string | undefined {
  switch (r.resourceType) {
    case "ImplementationGuide":
      return undefined;
    case "StructureDefinition":
      if (r.kind === "logical") return "Structures: Logical Models";
      if (r.type === "Extension" && r.derivation === "constraint") return "Structures: Extension Definitions";
      if (r.derivation === "constraint") {
        return r.kind === "resource" ? "Structures: Resource Profiles" : "Structures: Data Type Profiles";
      }
      return "Structures: Logical Models";
    case "CodeSystem":
      return "Terminology: Code Systems";
    case "ValueSet":
      return "Terminology: Value Sets";
    case "ConceptMap":
      return "Terminology: Concept Maps";
    case "NamingSystem":
      return "Terminology: Naming Systems";
    case "ActorDefinition":
      return "Requirements: Actor Definitions";
    case "Requirements":
      return "Requirements: Formal Requirements";
    case "CapabilityStatement":
      return "Behavior: Capability Statements";
    case "SearchParameter":
      return "Behavior: Search Parameters";
    case "OperationDefinition":
      return "Behavior: Operation Definitions";
    default:
      return "Other";
  }
}

/** The Publisher's per-resource file stem: `<Type>-<id>`. */
const stem = (type: string, id: string): string => `${type}-${id}`;

function publishedFor(base: string | undefined, type: string, id: string, hasPage: boolean): PublishedFormats {
  if (!base) return {};
  const at = (ext: string) => ({ url: `${base.replace(/\/+$/, "")}/${stem(type, id)}.${ext}` });
  return hasPage
    ? { json: at("json"), xml: at("xml"), ttl: at("ttl"), html: at("html") }
    : { json: at("json"), xml: at("xml"), ttl: at("ttl") };
}

/** `undefined` for null, empty, or whitespace-only: the index's strings are non-empty. */
const nonEmpty = (s: string | null | undefined): string | undefined => (s && s.trim() ? s : undefined);

export interface AstIndexOptions {
  /** The index's `id`: the instance directory name. */
  instanceId: string;
  /** Where the IG is PUBLISHED (not its canonical base). Optional: absent means no `published` URL is claimed. */
  publishedBase?: string;
  /** Path of the AST as recorded in `localPath`, relative to the IG root. Default `output-ast`. */
  astPath?: string;
  /**
   * The keys (`Type/id`) the PUBLISHED IG actually has. When given, an
   * artefact outside it gets no `published` URL: the AST can hold artefacts
   * newer than the last publish (smart-trust's Ireland participant,
   * 2026-10-02), and a link composed for one of those resolves for nobody.
   * Absent means not known, and every artefact is linked as before.
   */
  publishedKeys?: ReadonlySet<string>;
}

/** A cross-version extension URL: `http://hl7.org/fhir/<ver>/StructureDefinition/extension-<Type>.<field>`. */
const XVER = /^http:\/\/hl7\.org\/fhir\/[\d.]+\/StructureDefinition\/extension-([A-Za-z]+)\.([A-Za-z]+)$/;

/**
 * The fields of a resource type the target FHIR version lacks, read back from
 * its cross-version extensions.
 *
 * An R4 IG cannot hold an R5 `ActorDefinition`, so the Publisher writes it as
 * a `Basic` whose `code` names the type and whose `url`, `title`,
 * `description`… sit in `extension-ActorDefinition.<field>` extensions. The
 * manifest still calls it an ActorDefinition. Without this, smart-base's 63
 * personas and skills lost their canonical, title and category (2026-10-02).
 * Top-level fields win; only absent ones are filled.
 */
export function withCrossVersionFields(json: ResourceJson & { extension?: unknown }, manifestType: string): ResourceJson {
  if (json.resourceType === manifestType || !Array.isArray(json.extension)) return json;
  const out: ResourceJson & Record<string, unknown> = { ...json, resourceType: manifestType };
  for (const e of json.extension as { url?: string; [k: string]: unknown }[]) {
    const m = e.url ? XVER.exec(e.url) : null;
    if (!m || m[1] !== manifestType) continue;
    const field = m[2]!;
    if (out[field] !== undefined) continue;
    const valueKey = Object.keys(e).find((k) => k.startsWith("value"));
    const v = valueKey ? e[valueKey] : undefined;
    if (typeof v === "string") out[field] = v;
  }
  return out;
}

/** Read one AST resource file, or undefined when it is missing or unparseable. */
function readResource(ast: Ast, r: AstResource): ResourceJson | undefined {
  const p = join(ast.dir, r.file);
  if (!existsSync(p)) return undefined;
  try {
    return withCrossVersionFields(JSON.parse(readFileSync(p, "utf-8")) as ResourceJson, r.resourceType);
  } catch {
    return undefined;
  }
}

export interface AstIndexResult {
  index: FhirArtifactIndex;
  /** Manifest entries whose resource file was missing or unreadable — never silently dropped. */
  unreadable: string[];
}

/** Build the artefact index an AST describes. */
export function astToArtifactIndex(ast: Ast, opts: AstIndexOptions): AstIndexResult {
  const m = ast.manifest;
  const astPath = opts.astPath ?? "output-ast";
  const inputs = m.inputs?.sourceRevision
    ? { toolchain: m.inputs.toolchain, sourceRevision: m.inputs.sourceRevision, ...(m.inputs.inputDigest ? { inputDigest: m.inputs.inputDigest } : {}) }
    : undefined;

  const unreadable: string[] = [];
  const artifacts: FhirArtifact[] = [];
  let ig: ResourceJson | undefined;

  for (const r of m.resources) {
    const json = readResource(ast, r);
    if (!json) {
      unreadable.push(`${r.resourceType}/${r.id}`);
      continue;
    }
    if (r.resourceType === "ImplementationGuide") ig = json;
    const category = publisherCategory(json);
    const isPublished = !opts.publishedKeys || opts.publishedKeys.has(`${r.resourceType}/${r.id}`);
    const published = isPublished ? publishedFor(opts.publishedBase, r.resourceType, r.id, category !== undefined) : {};
    const localPath = `${astPath}/${r.file}`;
    const provenance = {
      ...(published.html ? { upstream: published.html.url } : {}),
      local: r.source ?? localPath,
    };
    // The index keys every artefact `<resourceType>/<id>`. The AST manifest
    // keys a canonical resource `<url>|<version>` instead, so its key is NOT
    // reused: doing so made all 70 canonical artefacts look added AND removed
    // in the first smart-trust parity run (2026-10-02).
    const key = `${r.resourceType}/${r.id}`;
    // A resource with no canonical URL (Endpoint, Organization, an example)
    // has no `title` and its `name` is free text, not a computable name. The
    // Publisher's artefact list shows such a resource under its id with that
    // text as the description, and so does the ingested index; follow it, so
    // a difference reported below is a real one and not a naming convention.
    const canonicalResource = nonEmpty(json.url) !== undefined;
    // The Publisher's list shows an untitled canonical resource under its
    // `name` (smart-base's `LinkIdExt`), and an instance under its id.
    const title = nonEmpty(json.title) ?? (canonicalResource ? nonEmpty(json.name) : r.id);
    const description = nonEmpty(json.description) ?? (canonicalResource ? undefined : nonEmpty(json.name)?.replace(/\s+/g, " ").trim());
    const name = canonicalResource ? nonEmpty(json.name) : undefined;
    artifacts.push({
      key,
      resourceType: r.resourceType,
      id: r.id,
      ...(name ? { name } : {}),
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      ...(nonEmpty(json.url) ? { canonical: json.url } : {}),
      ...(nonEmpty(json.version) ? { version: json.version } : {}),
      ...(category ? { category } : {}),
      published,
      materialization: inputs
        ? {
            state: "materialized",
            provenance,
            localPath,
            purpose: "compiled",
            gates: AST_GATES,
            inputs,
            ...(m.generatedAt ? { materializedAt: m.generatedAt } : {}),
          }
        : {
            // No source revision recorded: the compiled copy cannot say what it
            // was built from, so it is not claimed as materialized.
            state: "unknown",
            provenance,
            note: "the AST manifest records no sourceRevision, so this compiled copy cannot be tied to its inputs",
          },
    });
  }

  artifacts.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  const canonicalBase = ig?.url ? ig.url.replace(/\/ImplementationGuide\/[^/]+$/, "") : undefined;
  const packageId = nonEmpty(ig?.id);
  const index = FhirArtifactIndexSchema.parse({
    $schema: FHIR_ARTIFACT_INDEX_SCHEMA_TAG,
    id: opts.instanceId,
    title: `${packageId ?? opts.instanceId} — artefact index (from the IG Publisher AST cache)`,
    ...(packageId ? { packageId } : {}),
    ...(nonEmpty(ig?.version) ? { version: ig!.version } : {}),
    ...(canonicalBase ? { canonicalBase } : {}),
    source: {
      kind: "output",
      of: astPath,
      ...(inputs ? { revision: inputs.sourceRevision } : {}),
      readAt: (m.generatedAt ?? new Date().toISOString()).slice(0, 10),
    },
    provenance: {},
    // The AST is the FHIR build; whether a sidecar API sits beside it is not
    // something the AST can tell.
    sidecarApi: "unknown",
    count: artifacts.length,
    artifacts,
  });
  return { index, unreadable };
}

// ── parity ─────────────────────────────────────────────────────────────────

export type FieldName = "title" | "description" | "canonical" | "version" | "category" | "name";
const COMPARED: FieldName[] = ["title", "description", "canonical", "version", "category", "name"];

export interface IndexComparison {
  /** In the AST index, not in the published one. */
  onlyInAst: string[];
  /** In the published index, not in the AST one. */
  onlyInPublished: string[];
  /**
   * Same key, a compared field differs in what a READER sees:
   * `{key, field, ast, published}`.
   */
  differs: { key: string; field: FieldName; ast?: string; published?: string }[];
  /**
   * Same text once whitespace runs and Markdown link markup are normalised:
   * the published HTML collapses `"Issuer.  The"` to one space and renders
   * `[governance](x.html)` as `governance`, so the source and the page say
   * the same thing. Counted, never hidden.
   */
  equivalent: { field: FieldName; count: number }[];
  /** The field is in the AST and absent from the published index: the AST is the richer source. */
  astRicher: { field: FieldName; count: number }[];
  /** Keys present in both with every compared field equal (or equivalent). */
  identical: number;
}

/** What a reader sees: Markdown links reduced to their text, whitespace runs to one space. */
export function readerText(s: string): string {
  return s.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/\s+/g, " ").trim();
}

/** Where an AST-derived index and a published-output index disagree. */
export function compareIndexes(ast: FhirArtifactIndex, published: FhirArtifactIndex): IndexComparison {
  const a = new Map(ast.artifacts.map((x) => [x.key, x]));
  const p = new Map(published.artifacts.map((x) => [x.key, x]));
  const onlyInAst = [...a.keys()].filter((k) => !p.has(k)).sort();
  const onlyInPublished = [...p.keys()].filter((k) => !a.has(k)).sort();
  const differs: IndexComparison["differs"] = [];
  const equivalent = new Map<FieldName, number>();
  const astRicher = new Map<FieldName, number>();
  const bump = (m: Map<FieldName, number>, f: FieldName) => m.set(f, (m.get(f) ?? 0) + 1);
  let identical = 0;
  for (const [k, x] of a) {
    const y = p.get(k);
    if (!y) continue;
    let same = true;
    for (const f of COMPARED) {
      const av = x[f] ?? undefined;
      const pv = y[f] ?? undefined;
      if (av === pv) continue;
      if (av !== undefined && pv === undefined) {
        bump(astRicher, f);
        continue;
      }
      if (av !== undefined && pv !== undefined && readerText(av) === readerText(pv)) {
        bump(equivalent, f);
        continue;
      }
      same = false;
      differs.push({ key: k, field: f, ast: av, published: pv });
    }
    if (same) identical++;
  }
  const list = (m: Map<FieldName, number>) => [...m].map(([field, count]) => ({ field, count }));
  return { onlyInAst, onlyInPublished, differs, equivalent: list(equivalent), astRicher: list(astRicher), identical };
}

/** A short human summary, one line per category of difference. */
export function summarise(c: IndexComparison): string {
  const byField = new Map<FieldName, number>();
  for (const d of c.differs) byField.set(d.field, (byField.get(d.field) ?? 0) + 1);
  const fmt = (xs: { field: FieldName; count: number }[]) => xs.map((x) => `${x.field} ${x.count}`).join(", ") || "none";
  return [
    `identical or equivalent: ${c.identical}`,
    `only in AST (${c.onlyInAst.length}): ${c.onlyInAst.join(", ") || "none"}`,
    `only in published (${c.onlyInPublished.length}): ${c.onlyInPublished.join(", ") || "none"}`,
    `equivalent once whitespace/markup normalised: ${fmt(c.equivalent)}`,
    `AST carries, published lacks: ${fmt(c.astRicher)}`,
    `real differences: ${[...byField].map(([f, n]) => `${f} ${n}`).join(", ") || "none"}`,
  ].join("\n");
}

// ── CLI ────────────────────────────────────────────────────────────────────

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

if (import.meta.main) {
  const astDir = arg("--ast");
  const instanceId = arg("--instance-id");
  if (!astDir || !instanceId) {
    console.error(
      "usage: ast-to-artifact-index.ts --ast <output-ast dir> --instance-id <id> " +
        "[--published-base <url>] [--out <index.json>] [--compare <published index.json>] [--report <json>]",
    );
    process.exit(2);
  }
  const ast = readAst(resolve(astDir));
  const cmp = arg("--compare");
  const pub = cmp ? FhirArtifactIndexSchema.parse(JSON.parse(readFileSync(resolve(cmp), "utf-8"))) : undefined;
  const { index, unreadable } = astToArtifactIndex(ast, {
    instanceId,
    publishedBase: arg("--published-base"),
    ...(pub ? { publishedKeys: new Set(pub.artifacts.map((a) => a.key)) } : {}),
  });
  if (unreadable.length) {
    console.error(`! ${unreadable.length} manifest entr${unreadable.length === 1 ? "y has" : "ies have"} no readable resource file:`);
    for (const k of unreadable.slice(0, 10)) console.error(`    ${k}`);
  }
  const out = arg("--out");
  if (out) {
    mkdirSync(dirname(resolve(out)), { recursive: true });
    writeFileSync(resolve(out), JSON.stringify(index, null, 2) + "\n");
    console.log(`wrote ${index.count} artefacts → ${out}`);
  }
  if (pub) {
    const c = compareIndexes(index, pub);
    console.log(`AST ${index.count} vs published ${pub.count}`);
    console.log(summarise(c));
    const report = arg("--report");
    if (report) {
      mkdirSync(dirname(resolve(report)), { recursive: true });
      writeFileSync(resolve(report), JSON.stringify({ ast: index.count, published: pub.count, ...c }, null, 2) + "\n");
    }
  }
  if (unreadable.length) process.exit(3);
}
