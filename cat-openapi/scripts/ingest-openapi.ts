#!/usr/bin/env bun
/**
 * Ingest the OpenAPI documents an instance's `cat-openapi.config.json` names
 * into its `openapi` directory — each document VERBATIM, with a
 * `<id>.source.json` recording where it came from.
 *
 * @module cat-openapi/scripts/ingest-openapi
 * @covers openapi
 *
 * Usage:
 *   bun run cat-openapi/scripts/ingest-openapi.ts --instance smart-trust --source <checkout>
 *   bun run cat-openapi/scripts/ingest-openapi.ts --instance smart-trust --check
 *
 * `--source` is a local checkout of the document's repository (one config may
 * name several documents from one repository; documents from different
 * repositories take one run each, with `--only <id>`). The commit recorded is
 * the checkout's `HEAD`, so the provenance names the bytes actually read.
 *
 * ## `--check` needs no source, and that is the point
 *
 * It verifies what is COMMITTED: every configured document is present, parses
 * as OpenAPI 3, and matches its provenance's hash, size, title, version and
 * operation count — and no document is held that the config does not name.
 * Whether upstream has moved since is a different question, answered by
 * re-running the ingest against a fresh checkout; a gate that needed the
 * network to pass would report "could not determine" on every CI run.
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join, posix, relative, resolve } from "node:path";
import {
  OPENAPI_SOURCE_SCHEMA_TAG,
  OpenApiConfigSchema,
  OpenApiDocumentSchema,
  OpenApiProvenanceSchema,
  operationsOf,
  type OpenApiConfig,
  type OpenApiProvenance,
} from "../schemas/openapi.ts";

export const CONFIG_FILE = "cat-openapi.config.json";

/** The instance's config, parsed. Throws naming the file when it is absent or invalid. */
export function readConfig(instanceRoot: string): OpenApiConfig {
  const p = join(instanceRoot, CONFIG_FILE);
  if (!existsSync(p)) throw new Error(`${p}: no ${CONFIG_FILE} — this instance does not instantiate cat-openapi`);
  const r = OpenApiConfigSchema.safeParse(JSON.parse(readFileSync(p, "utf8")));
  if (!r.success) throw new Error(`${p}: ${r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
  return r.data;
}

/**
 * The directory the config names, resolved through the instance's own
 * declaration — never a path written in the config, so moving the directory
 * is one edit to `<instance>.json` and nothing else.
 */
export function openapiDir(instanceRoot: string, config: OpenApiConfig): string {
  const decl = join(instanceRoot, `${basename(resolve(instanceRoot))}.json`);
  const d = JSON.parse(readFileSync(decl, "utf8")) as { directories?: Array<{ id: string; path: string; graphKinds?: string[] }> };
  const entry = d.directories?.find((x) => x.id === config.directory);
  if (!entry) throw new Error(`${decl}: no directory with id "${config.directory}" (named by ${CONFIG_FILE})`);
  if (!entry.graphKinds?.includes("openapi")) throw new Error(`${decl}: directory "${config.directory}" is not of graph kind "openapi"`);
  return join(instanceRoot, entry.path);
}

const sha256 = (b: Buffer): string => createHash("sha256").update(b).digest("hex");

/** The openapi directory, instance-relative and in POSIX form — what a materialization's `localPath` is relative to. */
export const localDirOf = (instanceRoot: string, dir: string): string => relative(instanceRoot, dir).split("\\").join("/");

/**
 * The provenance a document's bytes yield. `source.commit` is the caller's;
 * `localDir` is the openapi directory, instance-relative (`openapi/`).
 *
 * The materialization gates are stated, never defaulted to `permitted`: a
 * `working` copy may not claim `sourceLoss` permitted (the schema refuses
 * it), and nobody has read the API's licence, so `copyright` is `unknown`
 * with that said — the same answers the IG ingest gives its sidecars.
 */
export function provenanceFor(id: string, bytes: Buffer, source: OpenApiProvenance["source"], localDir: string): OpenApiProvenance {
  const doc = OpenApiDocumentSchema.parse(JSON.parse(bytes.toString("utf8")));
  const file = `${id}.openapi.json`;
  const upstream = `https://github.com/${source.repository}/blob/${source.commit}/${source.path}`;
  return OpenApiProvenanceSchema.parse({
    $schema: OPENAPI_SOURCE_SCHEMA_TAG,
    id,
    file,
    source,
    bytes: bytes.length,
    openapi: doc.openapi,
    title: doc.info.title,
    version: doc.info.version,
    operations: operationsOf(doc).length,
    materialization: {
      $schema: "folio-materialization/v1",
      state: "materialized",
      provenance: { upstream },
      localPath: posix.join(localDir, file),
      bytes: bytes.length,
      purpose: "working",
      fixity: { algorithm: "sha256", digest: sha256(bytes) },
      upstreamVersion: source.commit,
      gates: {
        size: { verdict: "permitted", basis: `One OpenAPI document of ${bytes.length.toLocaleString("en")} bytes.` },
        restrictions: { verdict: "permitted", basis: `Read from the public repository ${source.repository}; no access control on the source.` },
        retention: { verdict: "permitted", basis: "Working copy, regenerable by re-running the ingest against the recorded commit." },
        sourceLoss: { verdict: "unknown", basis: "Not established. The source is a git commit, which persists while the repository does; nobody has stated how long that is." },
        copyright: { verdict: "unknown", basis: "Not established. The API description's licence has not been read for this ingest." },
      },
    },
  });
}

/** Problems with what is committed; empty means it is consistent. */
export function checkCommitted(instanceRoot: string): string[] {
  const config = readConfig(instanceRoot);
  const dir = openapiDir(instanceRoot, config);
  const problems: string[] = [];
  const wanted = new Set<string>();
  for (const d of config.documents) {
    const file = join(dir, `${d.id}.openapi.json`);
    const prov = join(dir, `${d.id}.source.json`);
    wanted.add(basename(file)).add(basename(prov));
    if (!existsSync(file) || !existsSync(prov)) {
      problems.push(`${d.id}: not ingested — run the ingest with --source`);
      continue;
    }
    const recorded = OpenApiProvenanceSchema.safeParse(JSON.parse(readFileSync(prov, "utf8")));
    if (!recorded.success) {
      problems.push(`${prov}: ${recorded.error.issues[0]?.message}`);
      continue;
    }
    let actual: OpenApiProvenance;
    try {
      actual = provenanceFor(d.id, readFileSync(file), recorded.data.source, localDirOf(instanceRoot, dir));
    } catch (e) {
      problems.push(`${file}: ${(e as Error).message}`);
      continue;
    }
    if (JSON.stringify(actual) !== JSON.stringify(recorded.data)) problems.push(`${d.id}: the committed document does not match its provenance (${prov})`);
    const { repository, path } = recorded.data.source;
    if (repository !== d.source.repository || path !== d.source.path) problems.push(`${d.id}: provenance names ${repository}:${path}, the config ${d.source.repository}:${d.source.path}`);
  }
  for (const f of existsSync(dir) ? readdirSync(dir) : []) {
    if (/\.(openapi|source)\.json$/.test(f) && !wanted.has(f)) problems.push(`${join(dir, f)}: held, but ${CONFIG_FILE} names no such document`);
  }
  return problems;
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

if (import.meta.main) {
  const instance = arg("instance");
  if (!instance) {
    console.error("usage: ingest-openapi.ts --instance <dir> (--source <checkout> [--only <id>] | --check)");
    process.exit(2);
  }
  const root = resolve(instance);
  if (process.argv.includes("--check")) {
    const problems = checkCommitted(root);
    for (const p of problems) console.error(`✗ ${p}`);
    if (problems.length) process.exit(1);
    console.log(`✓ ${instance}: every OpenAPI document the config names is held and matches its provenance`);
    process.exit(0);
  }
  const source = arg("source");
  if (!source) {
    console.error("--source <checkout> is required to ingest (or pass --check)");
    process.exit(2);
  }
  const only = arg("only");
  const config = readConfig(root);
  const dir = openapiDir(root, config);
  mkdirSync(dir, { recursive: true });
  const commit = execFileSync("git", ["-C", source, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  for (const d of config.documents) {
    if (only && d.id !== only) continue;
    const bytes = readFileSync(join(source, d.source.path));
    const prov = provenanceFor(d.id, bytes, { ...d.source, commit }, localDirOf(root, dir));
    writeFileSync(join(dir, prov.file), bytes);
    writeFileSync(join(dir, `${d.id}.source.json`), `${JSON.stringify(prov, null, 2)}\n`);
    console.log(`${d.id}: ${prov.title} ${prov.version} — ${prov.operations} operations, ${prov.bytes} bytes from ${d.source.repository}@${commit.slice(0, 7)}`);
  }
}
