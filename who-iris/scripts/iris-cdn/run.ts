/**
 * The IRIS CDN Exporter's runner — what `.github/workflows/iris-cdn.yml`
 * calls. One mode per process in `processes/`:
 *
 *   bun scripts/iris-cdn/run.ts initial-load --release <dir> --budget <json-or-file>
 *   bun scripts/iris-cdn/run.ts nightly      --release <dir>
 *   bun scripts/iris-cdn/run.ts reconcile    --release <dir>
 *   bun scripts/iris-cdn/run.ts verify       --release <dir> [--revert-on-failure]
 *   bun scripts/iris-cdn/run.ts revert       --release <dir>
 *
 * `<dir>` is a checkout of the release-history git repository on Cloudflare
 * Artifacts. This script writes files into `<dir>` (or creates a `git revert`
 * commit in `revert` mode); the workflow commits and pushes.
 *
 * Bytes go to R2 under `sha256/<aa>/<digest>`, and only when that key is not
 * already there (the no-churn rule). The BagIt payload manifest maps each
 * logical path (`records/<handle>.json`, `bitstreams/<item>/<name>`,
 * `graph/<partition>`) to its digest, so the manifest in git is the index of
 * what R2 holds.
 */
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash, type webcrypto } from "node:crypto";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { S3Client } from "bun";
import { diffManifests, isEmptyDiff, itemManifest, itemManifestPath, parsePayloadManifest, sha256Hex, tagFiles, type PayloadEntry } from "./bag.ts";
import { didWebUrl, importPrivateJwk, signDetached, verifyDetached, type DidDocument } from "./signing.ts";
import {
  allContainers,
  allItems,
  bitstreamContentUrl,
  changedSince,
  collectionItemsPage,
  extractBitstreamsFromItem,
  IRIS_API,
  metadataSha,
  withdrawnOrHidden,
  type Fetcher,
} from "./rest-feed.ts";
import { buildIrisDataset } from "../build-iris-oxigraph.ts";

const USER_AGENT = "who-iris-cdn-exporter (+https://github.com/litlfred/who-iris)";

/** Canonical JSON: keys sorted at every depth, two-space indent, LF, trailing newline. */
export function canonicalJson(value: unknown): string {
  const sort = (v: unknown): unknown =>
    Array.isArray(v) ? v.map(sort) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v as object).sort().map((k) => [k, sort((v as Record<string, unknown>)[k])])) : v;
  return JSON.stringify(sort(value), null, 2) + "\n";
}

function containerRefOf(raw: unknown): { uuid?: string; handle?: string | null; name?: string } | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const obj = raw as Record<string, unknown>;
  const out: { uuid?: string; handle?: string | null; name?: string } = {};
  if (typeof obj.uuid === "string") out.uuid = obj.uuid;
  if (typeof obj.handle === "string" || obj.handle === null) out.handle = obj.handle as string | null;
  if (typeof obj.name === "string") out.name = obj.name;
  return Object.keys(out).length > 0 ? out : undefined;
}

/**
 * HAL `_links` carry request-specific URLs; they are not part of the record.
 * When `_embedded` carries `owningCollection` or `parentCommunity`, their
 * `{ uuid, handle, name }` identifier is lifted onto the record so the
 * Oxigraph graph builder can link items → collections → communities.
 */
export function recordOf(item: Record<string, unknown>): Record<string, unknown> {
  const { _links, _embedded, ...rest } = item;
  const out: Record<string, unknown> = { ...rest };
  if (_embedded && typeof _embedded === "object") {
    const emb = _embedded as Record<string, unknown>;
    const owning = containerRefOf(emb.owningCollection);
    if (owning && out.owningCollection === undefined) out.owningCollection = owning;
    const parent = containerRefOf(emb.parentCommunity);
    if (parent && out.parentCommunity === undefined) out.parentCommunity = parent;
  }
  return out;
}

const politeFetch: Fetcher = async (url) => {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } });
    if ((res.status === 429 || res.status === 503) && attempt < 5) {
      await Bun.sleep(2 ** attempt * 1000);
      continue;
    }
    return res;
  }
};

export interface Store {
  has(digest: string): Promise<boolean>;
  put(digest: string, bytes: Uint8Array, contentType: string): Promise<void>;
  get?(digest: string): Promise<Uint8Array>;
}

const keyOf = (digest: string): string => `sha256/${digest.slice(0, 2)}/${digest}`;

function r2Store(): Store {
  const need = (k: string): string => {
    const v = process.env[k];
    if (!v) throw new Error(`${k} is not set`);
    return v;
  };
  const client = new S3Client({
    accessKeyId: need("R2_ACCESS_KEY_ID"),
    secretAccessKey: need("R2_SECRET_ACCESS_KEY"),
    endpoint: `https://${need("CLOUDFLARE_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    bucket: need("R2_BUCKET"),
  });
  return {
    has: (d) => client.file(keyOf(d)).exists(),
    put: async (d, bytes, type) => {
      await client.write(keyOf(d), bytes, { type });
    },
    get: async (d) => new Uint8Array(await client.file(keyOf(d)).arrayBuffer()),
  };
}

interface State {
  cursor: string;
}

function readJson<T>(path: string, fallback: T): T {
  return existsSync(path) ? (JSON.parse(readFileSync(path, "utf-8")) as T) : fallback;
}

/** The payload manifest of the last published release, as entries. */
export function heldEntries(release: string): Map<string, PayloadEntry> {
  const out = new Map<string, PayloadEntry>();
  const sizes = readJson<Record<string, number>>(join(release, "state", "sizes.json"), {});
  const mf = join(release, "manifest-sha256.txt");
  if (!existsSync(mf)) return out;
  for (const [path, sha256] of parsePayloadManifest(readFileSync(mf, "utf-8"))) out.set(path, { path, sha256, bytes: sizes[path] ?? 0 });
  return out;
}

async function storeBytes(store: Store, bytes: Uint8Array, type: string, counts: { stored: number; skipped: number }): Promise<string> {
  const digest = sha256Hex(bytes);
  if (await store.has(digest)) counts.skipped++;
  else {
    await store.put(digest, bytes, type);
    counts.stored++;
  }
  return digest;
}

/*
 * IRIS values become path segments of the release (`records/<handle>.json`,
 * `bitstreams/<handle>/<bundle>/<name>`) and parts of API URLs. Each is
 * checked by value and refused, never repaired: a refused item or file is
 * listed in the report and left out of the release.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HANDLE = /^[0-9]+\/[0-9]+$/;

/** A DSpace uuid, or the reason it is refused. */
export function uuidProblem(v: unknown): string | null {
  return typeof v === "string" && UUID.test(v) ? null : `not a uuid: ${JSON.stringify(v)}`;
}

/** A handle (`prefix/suffix`, digits only), or the reason it is refused. */
export function handleProblem(v: unknown): string | null {
  return typeof v === "string" && HANDLE.test(v) ? null : `not a handle: ${JSON.stringify(v)}`;
}

/** One path segment (a bundle or file name), or the reason it is refused. */
export function segmentProblem(v: unknown): string | null {
  if (typeof v !== "string" || v === "" || v === "." || v === "..") return `not a path segment: ${JSON.stringify(v)}`;
  if (/[\/\\\u0000-\u001f\u007f]/.test(v)) return `path segment holds a separator or control character: ${JSON.stringify(v)}`;
  return null;
}

/** The item's handle as a path, or `uuid/<uuid>` when IRIS gives none. Throws on a malformed value. */
export function itemKey(handle: unknown, uuid: unknown): string {
  if (handle !== undefined && handle !== null) {
    const p = handleProblem(handle);
    if (p) throw new Error(p);
    return handle as string;
  }
  const p = uuidProblem(uuid);
  if (p) throw new Error(p);
  return `uuid/${uuid as string}`;
}

export type BinaryFetcher = (url: string) => Promise<{ ok: boolean; status: number; headers?: { get(name: string): string | null }; arrayBuffer(): Promise<ArrayBuffer> }>;

const defaultBinaryFetch: BinaryFetcher = (url) => fetch(url, { headers: { "User-Agent": USER_AGENT } });

async function ingestItem(
  uuid: string,
  entries: Map<string, PayloadEntry>,
  store: Store,
  report: Report,
  opts: { fetcher?: Fetcher; binaryFetcher?: BinaryFetcher; api?: string; recordCache?: Map<string, Uint8Array> } = {},
): Promise<void> {
  const fetcher = opts.fetcher ?? politeFetch;
  const binFetch = opts.binaryFetcher ?? defaultBinaryFetch;
  const api = opts.api ?? IRIS_API;

  const bad = uuidProblem(uuid);
  if (bad) {
    report.quarantined.push(`item ${bad}`);
    return;
  }
  const res = await fetcher(`${api}/core/items/${uuid}?embed=bundles/bitstreams&embed=owningCollection`);
  if (!res.ok) throw new Error(`item ${uuid}: HTTP ${res.status}`);
  const item = (await res.json()) as Record<string, unknown>;
  let handle: string;
  try {
    handle = itemKey(item.handle, uuid);
  } catch (e) {
    report.quarantined.push(`item ${uuid}: ${(e as Error).message}`);
    return;
  }

  const bitstreams = await extractBitstreamsFromItem(fetcher, item as Parameters<typeof extractBitstreamsFromItem>[1], api);
  const recObj = recordOf(item);
  if (bitstreams.length > 0 && recObj.bitstreams === undefined) {
    recObj.bitstreams = bitstreams;
  }

  const record = new TextEncoder().encode(canonicalJson(recObj));
  const path = `records/${handle}.json`;
  report.uuids[uuid] = path;
  report.touched.add(handle);
  report.metadataSha[uuid] = metadataSha(item.metadata);
  const recSha = await storeBytes(store, record, "application/json", report.objects);
  opts.recordCache?.set(recSha, record);
  entries.set(path, { path, sha256: recSha, bytes: record.byteLength });

  for (const bs of bitstreams) {
    const refused = segmentProblem(bs.bundle) ?? segmentProblem(bs.name) ?? uuidProblem(bs.uuid);
    if (refused) {
      report.quarantined.push(`item ${uuid} bitstream: ${refused}`);
      continue;
    }
    const bpath = `bitstreams/${handle}/${bs.bundle}/${bs.name}`;
    const held = entries.get(bpath);
    if (held && report.md5[bpath] === bs.checkSum.value) continue; // unchanged upstream: not fetched again
    const r = await binFetch(bitstreamContentUrl(bs.uuid, api));
    if (!r.ok) throw new Error(`bitstream ${bs.uuid}: HTTP ${r.status}`);
    const bytes = new Uint8Array(await r.arrayBuffer());
    if (bs.checkSum.checkSumAlgorithm === "MD5" && createHash("md5").update(bytes).digest("hex") !== bs.checkSum.value) {
      report.quarantined.push(bpath);
      continue;
    }
    entries.set(bpath, { path: bpath, sha256: await storeBytes(store, bytes, r.headers?.get("content-type") ?? "application/octet-stream", report.objects), bytes: bytes.byteLength });
    report.md5[bpath] = bs.checkSum.value;
  }
}

/** Communities and collections, re-read in full; unchanged ones write nothing new. */
async function ingestContainers(
  entries: Map<string, PayloadEntry>,
  store: Store,
  report: Report,
  opts: { fetcher?: Fetcher; api?: string; recordCache?: Map<string, Uint8Array>; preloadedCollections?: Record<string, unknown>[] } = {},
): Promise<void> {
  const fetcher = opts.fetcher ?? politeFetch;
  const api = opts.api ?? IRIS_API;
  for (const kind of ["communities", "collections"] as const) {
    const list = kind === "collections" && opts.preloadedCollections
      ? opts.preloadedCollections
      : await allContainers(fetcher, kind, { api });
    for (const obj of list) {
      let handle: string;
      try {
        handle = itemKey(obj.handle, obj.uuid);
      } catch (e) {
        report.quarantined.push(`${kind}: ${(e as Error).message}`);
        continue;
      }
      const bytes = new TextEncoder().encode(canonicalJson(recordOf(obj)));
      const path = `records/${kind}/${handle}.json`;
      const digest = await storeBytes(store, bytes, "application/json", report.objects);
      opts.recordCache?.set(digest, bytes);
      if (entries.get(path)?.sha256 !== digest) report.containersChanged++;
      entries.set(path, { path, sha256: digest, bytes: bytes.byteLength });
    }
  }
}

/**
 * Call_Rebuild / Call_BuildGraph: rebuild the 2-Tier Oxigraph N-Quads dataset
 * over the exported records (`records/**.json`), with sorted deterministic
 * output so unchanged partitions keep their exact SHA-256 and are skipped by
 * `storeBytes`.
 */
export async function rebuildGraph(
  entries: Map<string, PayloadEntry>,
  store: Store,
  report: Report,
  recordCache: ReadonlyMap<string, Uint8Array> = new Map(),
): Promise<void> {
  const recordEntries = [...entries.values()].filter((e) => e.path.startsWith("records/") && e.path.endsWith(".json"));
  if (recordEntries.length === 0) return;

  const workDir = mkdtempSync(join(tmpdir(), "iris-cdn-graph-"));
  const recordsDir = join(workDir, "records");
  const outDir = join(workDir, "out");
  try {
    for (const e of recordEntries) {
      const rel = e.path.slice("records/".length);
      const bytes = recordCache.get(e.sha256) ?? (store.get ? await store.get(e.sha256) : undefined);
      if (!bytes) continue;
      const dest = join(recordsDir, rel);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, bytes);
    }
    if (!existsSync(recordsDir)) return;
    await buildIrisDataset(outDir, { recordsDir });
    for (const fname of readdirSync(outDir).sort()) {
      const full = join(outDir, fname);
      const bytes = new Uint8Array(readFileSync(full));
      const gpath = `graph/${fname}`;
      const contentType = fname.endsWith(".json")
        ? "application/json"
        : fname.endsWith(".gz")
          ? "application/gzip"
          : "application/n-quads";
      const digest = await storeBytes(store, bytes, contentType, report.objects);
      if (entries.get(gpath)?.sha256 !== digest) report.graphPartitionsChanged++;
      entries.set(gpath, { path: gpath, sha256: digest, bytes: bytes.byteLength });
    }
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

export interface Report {
  mode: string;
  changedItems: number;
  objects: { stored: number; skipped: number };
  quarantined: string[];
  withdrawn: string[];
  md5: Record<string, string>;
  /** item uuid → its record path; the weekly listing is by uuid. */
  uuids: Record<string, string>;
  /** item uuid → hash of its metadata as last ingested (the weekly check). */
  metadataSha: Record<string, string>;
  containersChanged: number;
  graphPartitionsChanged: number;
  /** handles of items ingested this run; only these can need a new item signature. */
  touched: Set<string>;
  itemsSigned: number;
  batchesCompleted?: number;
  batchesRemaining?: number;
}

/**
 * Task_StateBudget (`processes/iris-cdn-initial-load.bpmn`):
 * Scope, rate limit and upstream denominators. A budget with no denominator
 * is refused.
 */
export interface InitialLoadBudget {
  totalItemsUpstream: number;
  totalFilesUpstream: number;
  totalBytesUpstream: number;
  maxRequestsPerSecond: number;
  maxBatchesPerRun?: number;
  pageSize?: number;
}

export interface BatchSpec {
  id: string;
  collectionUuid: string;
  collectionKey: string;
  page: number;
  size: number;
  status: "pending" | "done";
  itemsIngested?: number;
}

export interface InitialLoadCheckpoint {
  budget: InitialLoadBudget;
  batches: BatchSpec[];
  cursor: string;
}

export function parseBudget(input: unknown): InitialLoadBudget {
  let obj: unknown = input;
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) throw new Error("Task_StateBudget: --budget is empty");
    const text = existsSync(trimmed) ? readFileSync(trimmed, "utf-8") : trimmed;
    try {
      obj = JSON.parse(text);
    } catch {
      throw new Error(`Task_StateBudget: --budget is neither a readable JSON file nor valid JSON: ${trimmed}`);
    }
  }
  if (!obj || typeof obj !== "object") {
    throw new Error("Task_StateBudget: budget must be a JSON object stating upstream denominators and maxRequestsPerSecond");
  }
  const b = obj as Record<string, unknown>;
  const posNum = (k: string): number => {
    const v = b[k];
    if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) {
      throw new Error(`Task_StateBudget: budget.${k} must be a positive number (a budget with no denominator is a preference, not a limit)`);
    }
    return v;
  };
  const totalItemsUpstream = posNum("totalItemsUpstream");
  const totalFilesUpstream = posNum("totalFilesUpstream");
  const totalBytesUpstream = posNum("totalBytesUpstream");
  const maxRequestsPerSecond = posNum("maxRequestsPerSecond");

  let maxBatchesPerRun: number | undefined;
  if (b.maxBatchesPerRun !== undefined) {
    if (typeof b.maxBatchesPerRun !== "number" || !Number.isInteger(b.maxBatchesPerRun) || b.maxBatchesPerRun < 1) {
      throw new Error("Task_StateBudget: budget.maxBatchesPerRun must be a positive integer");
    }
    maxBatchesPerRun = b.maxBatchesPerRun;
  }
  let pageSize = 100;
  if (b.pageSize !== undefined) {
    if (typeof b.pageSize !== "number" || !Number.isInteger(b.pageSize) || b.pageSize < 1) {
      throw new Error("Task_StateBudget: budget.pageSize must be a positive integer");
    }
    pageSize = b.pageSize;
  }
  return {
    totalItemsUpstream,
    totalFilesUpstream,
    totalBytesUpstream,
    maxRequestsPerSecond,
    ...(maxBatchesPerRun !== undefined ? { maxBatchesPerRun } : {}),
    pageSize,
  };
}

/**
 * Task_PlanBatches: one batch per collection, with large collections split by
 * page. Deterministic order by collection handle/uuid.
 */
export async function planInitialLoadBatches(
  fetcher: Fetcher,
  collections: readonly Record<string, unknown>[],
  budget: InitialLoadBudget,
  api = IRIS_API,
): Promise<BatchSpec[]> {
  const size = budget.pageSize ?? 100;
  const valid: { uuid: string; key: string }[] = [];
  for (const c of collections) {
    if (uuidProblem(c.uuid)) continue;
    try {
      valid.push({ uuid: c.uuid as string, key: itemKey(c.handle, c.uuid) });
    } catch {
      continue;
    }
  }
  valid.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));

  const batches: BatchSpec[] = [];
  for (const c of valid) {
    const first = await collectionItemsPage(fetcher, c.uuid, 0, size, api);
    const pages = Math.max(1, first.totalPages);
    for (let page = 0; page < pages; page++) {
      batches.push({
        id: `${c.key}:p${page}`,
        collectionUuid: c.uuid,
        collectionKey: c.key,
        page,
        size,
        status: "pending",
      });
    }
  }
  return batches;
}

let signer: { key: webcrypto.CryptoKey; kid: string } | null = null;
async function getSigner(): Promise<{ key: webcrypto.CryptoKey; kid: string }> {
  if (signer) return signer;
  const did = process.env.IRIS_CDN_DID;
  const jwk = process.env.IRIS_CDN_SIGNING_JWK;
  if (!did || !jwk) throw new Error("IRIS_CDN_DID and IRIS_CDN_SIGNING_JWK must be set to sign");
  signer = { key: await importPrivateJwk(JSON.parse(jwk)), kid: `${did}#${process.env.IRIS_CDN_KEY_ID ?? "release-1"}` };
  return signer;
}

export function resetSignerForTest(): void {
  signer = null;
}

/**
 * A detached JWS on each touched library item's own manifest. An item whose
 * manifest bytes did not change keeps its existing signature: ES256 is
 * randomised, so re-signing would change bytes for nothing.
 */
async function signItems(entries: Map<string, PayloadEntry>, store: Store, report: Report): Promise<void> {
  for (const handle of [...report.touched].sort()) {
    const text = itemManifest(handle, entries.values());
    const mpath = itemManifestPath(handle);
    const bytes = new TextEncoder().encode(text);
    if (entries.get(mpath)?.sha256 === sha256Hex(bytes) && entries.has(`${mpath}.jws`)) continue;
    const { key, kid } = await getSigner();
    const jws = new TextEncoder().encode((await signDetached(text, key, kid)) + "\n");
    entries.set(mpath, { path: mpath, sha256: await storeBytes(store, bytes, "text/plain", report.objects), bytes: bytes.byteLength });
    entries.set(`${mpath}.jws`, { path: `${mpath}.jws`, sha256: await storeBytes(store, jws, "application/jose", report.objects), bytes: jws.byteLength });
    report.itemsSigned++;
  }
}

/** Sign changed items, write the bag, and sign the release only if the payload changed. */
export async function publish(release: string, previous: Map<string, PayloadEntry>, next: Map<string, PayloadEntry>, store: Store, report: Report): Promise<boolean> {
  await signItems(next, store, report);
  const prevMap = new Map([...previous].map(([p, e]) => [p, e.sha256]));
  const nextMap = new Map([...next].map(([p, e]) => [p, e.sha256]));
  const diff = diffManifests(prevMap, nextMap);
  console.log(JSON.stringify({ added: diff.added.length, changed: diff.changed.length, removed: diff.removed.length, unchanged: diff.unchanged }));
  if (isEmptyDiff(diff)) return false;
  const tags = tagFiles([...next.values()], { "Source-Organization": "WHO IRIS (ingested copy)", "External-Identifier": "https://iris.who.int" });
  for (const [name, text] of Object.entries(tags)) writeFileSync(join(release, name), text);
  const { key, kid } = await getSigner();
  writeFileSync(join(release, "tagmanifest-sha256.txt.jws"), (await signDetached(tags["tagmanifest-sha256.txt"], key, kid)) + "\n");
  mkdirSync(join(release, "state"), { recursive: true });
  writeFileSync(join(release, "state", "sizes.json"), canonicalJson(Object.fromEntries([...next].map(([p, e]) => [p, e.bytes]))));
  return true;
}

/**
 * Task_Revert (`processes/iris-cdn-sign-publish.bpmn`):
 * Revert `HEAD` in the release git repository so the previous verified release
 * remains the one served, and its cursor in `state/cursor.json` is restored.
 */
export function revertRelease(release: string, opts: { push?: boolean } = {}): { revertedCommit: string; headCommit: string; pushed: boolean } {
  const git = (...args: string[]): string =>
    execFileSync("git", ["-C", release, ...args], { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  let revertedCommit: string;
  try {
    revertedCommit = git("rev-parse", "HEAD");
    git("rev-parse", "--verify", "HEAD~1");
  } catch {
    throw new Error(`Task_Revert: ${release} has no parent commit (HEAD~1) to revert to`);
  }
  git(
    "-c", "user.name=who-iris CDN exporter",
    "-c", "user.email=iris-cdn@users.noreply.github.com",
    "revert", "--no-edit", "HEAD",
  );
  const headCommit = git("rev-parse", "HEAD");
  let pushed = false;
  if (opts.push !== false) {
    try {
      const remotes = git("remote");
      if (remotes.split(/\s+/).includes("origin")) {
        const env: NodeJS.ProcessEnv = { ...process.env };
        if (process.env.ARTIFACTS_TOKEN) {
          env.GIT_CONFIG_COUNT = "1";
          env.GIT_CONFIG_KEY_0 = "http.extraHeader";
          env.GIT_CONFIG_VALUE_0 = `Authorization: Bearer ${process.env.ARTIFACTS_TOKEN}`;
        }
        execFileSync("git", ["-C", release, "push", "origin", "HEAD"], { env, stdio: ["ignore", "pipe", "pipe"] });
        pushed = true;
      }
    } catch {
      pushed = false;
    }
  }
  return { revertedCommit, headCommit, pushed };
}

/**
 * Task_Verify: check the tag files against the tag manifest, then the
 * signature against the key resolved from did:web — never from the package.
 * Exits non-zero on `failed` and on `unknown`, so the workflow does not
 * treat an unverifiable release as published. When `revertOnFailure` is true,
 * runs `revertRelease(release)` before exiting non-zero.
 */
export async function checkRelease(
  release: string,
  opts: { did?: string; anchorJwk?: string; didDocFetcher?: (url: string) => Promise<DidDocument | null> } = {},
): Promise<{ state: "verified" | "failed" | "unknown"; reason?: string; kid?: string; chain?: string }> {
  const tmPath = join(release, "tagmanifest-sha256.txt");
  const jwsPath = join(release, "tagmanifest-sha256.txt.jws");
  if (!existsSync(tmPath) || !existsSync(jwsPath)) {
    return { state: "failed", reason: "tagmanifest-sha256.txt or tagmanifest-sha256.txt.jws is missing" };
  }
  const tm = readFileSync(tmPath, "utf-8");
  for (const [name, digest] of tm.split("\n").filter(Boolean).map((l) => l.split(/\s+/) as [string, string]).map(([d, n]) => [n, d])) {
    const p = join(release, name);
    if (!existsSync(p) || sha256Hex(readFileSync(p)) !== digest) {
      return { state: "failed", reason: `tag file ${name} does not match the tag manifest` };
    }
  }
  const jws = readFileSync(jwsPath, "utf-8").trim();
  const did = opts.did ?? process.env.IRIS_CDN_DID;
  const anchor = opts.anchorJwk ?? process.env.IRIS_CDN_TRUST_ANCHOR_JWK;
  if (!did || !anchor) {
    return { state: "unknown", reason: "IRIS_CDN_DID and IRIS_CDN_TRUST_ANCHOR_JWK must both be set to verify" };
  }
  let doc: DidDocument | null = null;
  try {
    if (opts.didDocFetcher) {
      doc = await opts.didDocFetcher(didWebUrl(did));
    } else {
      const res = await fetch(didWebUrl(did), { headers: { "User-Agent": USER_AGENT }, redirect: "error" });
      if (res.ok) doc = (await res.json()) as DidDocument;
    }
  } catch {
    doc = null;
  }
  if (doc && doc.id !== did) doc = null;
  return verifyDetached(tm, jws, doc, { anchors: [JSON.parse(anchor)], expectDid: did });
}

async function verify(release: string, noRevert = false): Promise<void> {
  const verdict = await checkRelease(release);
  console.log(JSON.stringify(verdict));
  if (verdict.state !== "verified") {
    if (!noRevert && existsSync(join(release, ".git"))) {
      try {
        const rev = revertRelease(release);
        console.log(JSON.stringify({ action: "reverted", ...rev }));
      } catch (e) {
        console.error(JSON.stringify({ action: "revert-failed", error: (e as Error).message }));
      }
    }
    process.exit(1);
  }
}

/**
 * Execute `initial-load` (`processes/iris-cdn-initial-load.bpmn`):
 * plans batches by collection, checkpoints after each batch in
 * `state/initial-load.json`, skips completed batches on restart, rebuilds the
 * Oxigraph graph, signs and publishes the release, and writes
 * `state/cursor.json` once all batches finish.
 */
export async function runInitialLoad(opts: {
  release: string;
  budget: InitialLoadBudget;
  fetcher?: Fetcher;
  binaryFetcher?: BinaryFetcher;
  store?: Store;
  api?: string;
}): Promise<Report> {
  const { release, budget } = opts;
  const fetcher = opts.fetcher ?? politeFetch;
  const binaryFetcher = opts.binaryFetcher ?? defaultBinaryFetch;
  const store = opts.store ?? r2Store();
  const api = opts.api ?? IRIS_API;

  const statePath = join(release, "state", "cursor.json");
  const checkpointPath = join(release, "state", "initial-load.json");
  const md5Path = join(release, "state", "md5.json");
  const uuidsPath = join(release, "state", "uuids.json");
  const metaPath = join(release, "state", "metadata-sha.json");

  const previous = heldEntries(release);
  const next = new Map(previous);
  const recordCache = new Map<string, Uint8Array>();
  const report: Report = {
    mode: "initial-load",
    changedItems: 0,
    objects: { stored: 0, skipped: 0 },
    quarantined: [],
    withdrawn: [],
    md5: readJson(md5Path, {}),
    uuids: readJson(uuidsPath, {}),
    metadataSha: readJson(metaPath, {}),
    containersChanged: 0,
    graphPartitionsChanged: 0,
    touched: new Set(),
    itemsSigned: 0,
    batchesCompleted: 0,
    batchesRemaining: 0,
  };

  const saveState = (cp: InitialLoadCheckpoint): void => {
    mkdirSync(join(release, "state"), { recursive: true });
    writeFileSync(md5Path, canonicalJson(report.md5));
    writeFileSync(uuidsPath, canonicalJson(report.uuids));
    writeFileSync(metaPath, canonicalJson(report.metadataSha));
    writeFileSync(checkpointPath, canonicalJson(cp));
  };

  let checkpoint: InitialLoadCheckpoint;
  let preloadedCollections: Record<string, unknown>[] | undefined;
  if (existsSync(checkpointPath)) {
    checkpoint = JSON.parse(readFileSync(checkpointPath, "utf-8")) as InitialLoadCheckpoint;
    checkpoint.budget = budget;
  } else {
    preloadedCollections = await allContainers(fetcher, "collections", { api });
    const batches = await planInitialLoadBatches(fetcher, preloadedCollections, budget, api);
    checkpoint = { budget, batches, cursor: "" };
    saveState(checkpoint);
  }

  await ingestContainers(next, store, report, { fetcher, api, recordCache, preloadedCollections });

  const minDelayMs = budget.maxRequestsPerSecond >= 1000 ? 0 : Math.floor(1000 / budget.maxRequestsPerSecond);
  const maxBatches = budget.maxBatchesPerRun ?? Number.POSITIVE_INFINITY;
  let processedThisRun = 0;

  for (const batch of checkpoint.batches) {
    if (batch.status === "done") continue;
    if (processedThisRun >= maxBatches) break;

    const page = await collectionItemsPage(fetcher, batch.collectionUuid, batch.page, batch.size, api);
    for (const it of page.items) {
      if (minDelayMs > 0) await Bun.sleep(minDelayMs);
      await ingestItem(it.uuid, next, store, report, { fetcher, binaryFetcher, api, recordCache });
      report.changedItems++;
      if (!checkpoint.cursor || Date.parse(it.lastModified) > Date.parse(checkpoint.cursor)) {
        checkpoint.cursor = it.lastModified;
      }
    }
    batch.status = "done";
    batch.itemsIngested = page.items.length;
    processedThisRun++;
    report.batchesCompleted = (report.batchesCompleted ?? 0) + 1;
    // Task_Checkpoint: persist after every batch so a stopped run resumes cleanly
    saveState(checkpoint);
  }

  report.batchesRemaining = checkpoint.batches.filter((b) => b.status === "pending").length;

  await rebuildGraph(next, store, report, recordCache);
  await publish(release, previous, next, store, report);
  saveState(checkpoint);

  if (report.batchesRemaining === 0 && checkpoint.cursor) {
    writeFileSync(statePath, canonicalJson({ cursor: checkpoint.cursor }));
  }
  return report;
}

async function main(): Promise<void> {
  const [mode, ...rest] = process.argv.slice(2);
  const relIdx = rest.indexOf("--release");
  const release = relIdx >= 0 ? rest[relIdx + 1] : undefined;
  if (!release || !existsSync(release)) throw new Error("--release <checkout of the Cloudflare git repository> is required");
  if (mode === "verify") return verify(release, rest.includes("--no-revert"));
  if (mode === "revert") {
    const rev = revertRelease(release);
    console.log(canonicalJson({ mode: "revert", ...rev }));
    return;
  }
  if (mode === "initial-load") {
    const bIdx = rest.indexOf("--budget");
    const rawBudget = bIdx >= 0 ? rest[bIdx + 1] : process.env.IRIS_CDN_BUDGET;
    if (!rawBudget) {
      throw new Error("Task_StateBudget: initial-load requires --budget <json-or-file> (or IRIS_CDN_BUDGET)");
    }
    const budget = parseBudget(rawBudget);
    const report = await runInitialLoad({ release, budget });
    const { md5: _md5, uuids: _u, metadataSha: _m, touched: _t, ...summary } = report;
    console.log(canonicalJson(summary));
    return;
  }

  const statePath = join(release, "state", "cursor.json");
  const md5Path = join(release, "state", "md5.json");
  const uuidsPath = join(release, "state", "uuids.json");
  const withdrawnPath = join(release, "state", "withdrawn.json");
  const metaPath = join(release, "state", "metadata-sha.json");
  const store = r2Store();
  const previous = heldEntries(release);
  const next = new Map(previous);
  const recordCache = new Map<string, Uint8Array>();
  const report: Report = {
    mode,
    changedItems: 0,
    objects: { stored: 0, skipped: 0 },
    quarantined: [],
    withdrawn: [],
    md5: readJson(md5Path, {}),
    uuids: readJson(uuidsPath, {}),
    metadataSha: readJson(metaPath, {}),
    containersChanged: 0,
    graphPartitionsChanged: 0,
    touched: new Set(),
    itemsSigned: 0,
  };
  const saveState = (): void => {
    mkdirSync(join(release, "state"), { recursive: true });
    writeFileSync(md5Path, canonicalJson(report.md5));
    writeFileSync(uuidsPath, canonicalJson(report.uuids));
    writeFileSync(metaPath, canonicalJson(report.metadataSha));
  };

  if (mode === "nightly") {
    const state = readJson<State>(statePath, { cursor: "" });
    if (!state.cursor) throw new Error("no cursor: run the initial load first");
    const changed = await changedSince(politeFetch, state.cursor);
    report.changedItems = changed.length;
    for (const it of changed) await ingestItem(it.uuid, next, store, report, { recordCache });
    await ingestContainers(next, store, report, { recordCache });
    if (changed.length > 0 || report.containersChanged > 0) {
      await rebuildGraph(next, store, report, recordCache);
    }
    const changedAnything = await publish(release, previous, next, store, report);
    if (changed.length > 0) state.cursor = changed[changed.length - 1].lastModified;
    if (changedAnything || changed.length > 0) {
      saveState();
      writeFileSync(statePath, canonicalJson(state));
    }
  } else if (mode === "reconcile") {
    const listing = await allItems(politeFetch);
    const listed = new Set(listing.keys());
    // Throws above the 1% guard: a short listing is not a mass withdrawal.
    const missing = withdrawnOrHidden(Object.keys(report.uuids), listed);
    // Metadata edited without moving lastModified: re-ingest exactly those.
    for (const [uuid, sha] of listing) {
      if (sha !== null && report.uuids[uuid] && report.metadataSha[uuid] !== sha) await ingestItem(uuid, next, store, report, { recordCache });
    }
    await ingestContainers(next, store, report, { recordCache });
    const withdrawn = readJson<Record<string, string>>(withdrawnPath, {});
    for (const uuid of missing) {
      const res = await politeFetch(`${IRIS_API}/core/items/${uuid}`);
      if (res.status === 404 || res.status === 401 || res.status === 403) {
        withdrawn[uuid] = res.status === 404 ? "gone" : "private";
        report.withdrawn.push(uuid);
      } else if (res.ok) {
        await ingestItem(uuid, next, store, report, { recordCache }); // the record carries `withdrawn: true` itself
        if (((await res.json()) as { withdrawn?: boolean }).withdrawn) report.withdrawn.push(uuid);
      } else throw new Error(`re-check ${uuid}: HTTP ${res.status}`);
    }
    // Withdrawn items keep their record and bytes in the manifest: a citation may point at them.
    if (report.withdrawn.length > 0) writeFileSync(withdrawnPath, canonicalJson(withdrawn));
    if (report.touched.size > 0 || report.containersChanged > 0 || report.withdrawn.length > 0) {
      await rebuildGraph(next, store, report, recordCache);
    }
    if ((await publish(release, previous, next, store, report)) || report.withdrawn.length > 0) saveState();
  } else {
    throw new Error(`unknown mode ${mode}: expected initial-load, nightly, reconcile, verify, or revert`);
  }
  const { md5: _md5, uuids: _u, metadataSha: _m, touched: _t, ...summary } = report;
  console.log(canonicalJson(summary));
}

if (import.meta.main) await main();
