#!/usr/bin/env bun
/**
 * MATERIALISE one chosen part of a subscribed Knowledge Graph — a subgraph,
 * or a single asset — at the subscription's pin, through the five gates of
 * `Process_MaterializeRemote`, and record what was decided.
 *
 * @module folio-assistant-core/scripts/kg-materialize
 * @covers substrate-snapshot — the parts each subscription holds, under its snapshot directory
 *
 * Issue #1719, epic bean `fnx4`, slices 5 and 6 of
 * `cat-harness/docs/proposals/kg-subscriptions.md`. Slice 4 (`kg:subscribe`)
 * wrote the choice and the pin; this is the verb that makes bytes arrive.
 *
 * ## Why it lives in core, not beside `kg-subscribe.ts`
 *
 * The record it writes embeds `MaterializationSchema`, which is core's, and
 * cat-harness needs only bootstrap: a writer in `cat-harness/scripts/` would
 * import up the dependency arrow, the edge `check:partition` fails on and the
 * one bean `bf5l` removed from `intake.ts`. Core needs cat-harness, so from
 * here both halves are reachable and both edges point down. The precedent is
 * `sample-import-run.ts`, which drives a large-datasets process from here.
 * The LAYOUT and a structural reader stay in cat-harness
 * (`partDirOf`, `treeDigest`, `partRecordsIn`), so the subscriptions page
 * draws a record without importing this file.
 *
 * ## `sync-remote-skills`, generalised
 *
 * The same three moves: pin a 40-character SHA, write the bytes as they were,
 * record a sha256 per file. Two things are added, because a subgraph is not
 * a skill package:
 *
 * - **The five gates.** A skill sync answers none of them; a subscription may
 *   reach any substrate, so every copy goes through the process the owner
 *   asked to be shared (*"should share common subprocess"*). `size` is
 *   MEASURED, against `maxBytes`; the other four are a person's, read from a
 *   decisions file ({@link KgDecisionsSchema}). A gate the file does not
 *   answer is `unknown`, and `unknown` on any gate keeps the part
 *   referenced — `Gateway_Gates`: *"An unanswered gate counts as a refusal."*
 * - **A tree digest**, so a file ADDED under a held subgraph is caught, the
 *   one edit `check:materialized-fixity`'s per-file walk cannot see.
 *
 * ## What it refuses before any byte moves, and says why
 *
 * - a subscription that does not exist, or whose snapshot is missing or at
 *   another pin (re-subscribe first);
 * - a subgraph the subscription did not CHOOSE (`subgraphs`), or that the
 *   cached snapshot does not DECLARE — the two are separate refusals, because
 *   their remedies are different people's;
 * - an asset when the asset policy is not `on-demand` or `all`, or whose path
 *   lies outside every directory the snapshot declares;
 * - a held part at a different pin: moving it is `refresh-materialized`.
 *
 * ## Four outcomes, and could-not-determine is never one of the clean ones
 *
 * `materialized` (bytes plus record), `stayed-referenced` (a record that says
 * which gate stopped it, so the next caller does not re-litigate it),
 * `refused` (no record: the request itself was not valid), and
 * `could-not-determine` (the fetch failed: NOTHING is written, because a
 * record would claim a fact about bytes nobody read).
 *
 * ## The fetch
 *
 * Shallow, blobless, one commit; then a no-cone SPARSE checkout of exactly the
 * part's path and the root licence, so only those blobs arrive. Injectable
 * ({@link PartFetcher}), so every judgement is tested over fixtures. The
 * bytes land in a temporary directory first: measuring is not materialising,
 * and nothing under the instance changes unless all five gates pass.
 *
 * ## Metadata mode — `--nodes <subscription> <subgraph-path>` (bean `c1m4`)
 *
 * Owner ruling 2026-10-03: *"add a metadata mode"*. It fetches ONE file, the
 * subgraph's published `index.hydrated.jsonld` (`kg-export.md` §"Named
 * subgraphs"), so "every node of `skills/sdlc`" arrives as graph metadata
 * without a byte of the subgraph itself. The byte copy above and its five
 * gates are unchanged; this is a second verb beside it, not a branch inside it.
 *
 * - **Where.** `<docs>/subgraph/<HARNESS>/<path>/index.hydrated.jsonld` in the
 *   subscribed repository, at the pin. `<docs>` is the snapshot's declared
 *   `docs` directory and `<HARNESS>` the snapshot's declaration name — read
 *   from the cached declaration, the way `gen-subgraph-jsonld` reads its own,
 *   never spelled. Fetched through the same injectable {@link PartFetcher}, so
 *   the pin check (`FETCH_HEAD` must be the pinned SHA) is the same code.
 * - **The root is refused, by design.** A harness root publishes
 *   `index.jsonld` only: a deep hydrated file there is the monolith `f233`
 *   forbids. A root request is REFUSED with a pointer at `index.jsonld`; it is
 *   never read as an empty subgraph.
 * - **Validated before it lands.** `SubgraphHydratedSchema`, and the root
 *   `@id` must be the subgraph asked for (`…/subgraph/<HARNESS>/<path>/`), so a
 *   file published under the wrong path cannot be held as the right one.
 * - **Held** at `<snapshot dir>/<subscription>/nodes/<path>/` (`nodesDirOf`),
 *   the file plus a `nodes.json` record (`KgNodesRecordSchema`) carrying its
 *   sha256, which `--check` re-hashes offline.
 * - **The same four outcomes.** `materialized`; `stayed-referenced` when the
 *   size cap stops it (a record saying so, no file); `refused` for a request
 *   or a file that is not valid — no record; `could-not-determine` when the
 *   fetch failed — NOTHING written.
 *
 * **The gates, decided: only `size` applies, and it applies as a cap.** The
 * four person gates exist because a copy of somebody else's CONTENT can carry
 * a licence, a restriction, a retention duty, or be the last copy there is.
 * This file is none of those. It is a description of content — node ids,
 * types, labels, links — that the substrate itself PUBLISHES on its site for
 * anyone to read, and every heavy body in it is a pointer
 * (`gen-subgraph-jsonld` refuses a literal over 16 KiB). Holding it moves no
 * licensed bytes, so there is no copyright or restriction question; it is
 * re-fetchable from the pin at any time, so there is no source-loss or
 * retention question. Asking a person four questions whose answer is fixed
 * would train them to answer without reading. `size` stays, MEASURED against
 * `maxBytes` (`--max-bytes`, default {@link DEFAULT_MAX_BYTES}) and checked
 * BEFORE the bytes are parsed, because a hydrated file is generated and a
 * generator can be wrong. The record is therefore not a
 * `MaterializationSchema` record: that schema demands all five gates, and
 * filling four with answers nobody gave is the fabrication it forbids.
 *
 * Choosing (`subscriptions[].subgraphs`) is NOT required in metadata mode: a
 * subscription already holds the substrate's root declaration as metadata,
 * and this is more of the same layer. The path must lie under a directory the
 * snapshot declares.
 *
 * Usage:
 *   bun run kg:materialize <subscription> <subgraph> [--decisions <file.json>] [--instance <dir>] [--dry-run]
 *   bun run kg:materialize <subscription> --asset <path> [--decisions <file.json>] [--instance <dir>] [--dry-run]
 *   bun run kg:materialize --nodes <subscription> <subgraph-path> [--max-bytes <n>] [--instance <dir>] [--dry-run]
 *   bun run kg:materialize:check
 */
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve } from "node:path";

import { findDeclarationFile, instanceRootsIn, repoRootFor, type Subscription } from "../../cat-harness/schemas/cat-harness.ts";
import { SUBGRAPH_HYDRATED_FILE, SUBGRAPH_INDEX_FILE, SubgraphHydratedSchema, type SubgraphHydratedNode } from "../../cat-harness/schemas/subgraph-manifest.ts";
import { SubstrateSnapshotSchema, type SubstrateSnapshot } from "../../cat-harness/schemas/substrate-snapshot.ts";
import {
  NODES_RECORD_FILE,
  nodesDirOf,
  PART_RECORD_FILE,
  PART_TREE,
  partDirOf,
  partRecordsIn,
  safeRelPath,
  sha256File,
  snapshotDirOf,
  SNAPSHOT_SUFFIX,
  treeDigest,
  treeEntries,
} from "../../cat-harness/scripts/kg-subscribe.ts";
import { LICENCE_NAMES, git, shallowFetch, upstreamLicence } from "../../cat-harness/scripts/sync-remote-skills.ts";
import {
  DEFAULT_MAX_BYTES,
  KG_NODES_RECORD_SCHEMA,
  KG_PART_RECORD_SCHEMA,
  KgDecisionsSchema,
  KgMaterializationRecordSchema,
  KgNodesRecordSchema,
  type KgDecisions,
  type KgMaterializationRecord,
  type KgNodesRecord,
  type KgPartRecord,
} from "../schemas/kg-materialization.ts";
import type { Gate, Gates } from "../schemas/materialization.ts";

const REPO = resolve(import.meta.dir, "..", "..");
const DEFAULT_INSTANCE = join(REPO, "cat-harness");

// ── The fetcher ─────────────────────────────────────────────────────────────

/**
 * What a fetcher leaves behind: `part` is a directory holding the subgraph's
 * contents (`kind: "tree"`) or the one asset file under its own name
 * (`kind: "blob"`). `root` is removed by the caller.
 */
export interface FetchedPart {
  kind: "tree" | "blob" | "submodule";
  root: string;
  part: string;
  /** The upstream licence, when the part does not carry its own. */
  licence?: { name: string; file: string; upstreamPath: string };
  /** Files in the whole repository at the pin — the size gate's denominator, where it is known. */
  collectionFiles?: number;
}

/**
 * Fetch one path of a repository at a commit. `undefined`: the commit holds
 * no such path (a determinate answer). Throwing: the bytes were not read
 * (could-not-determine). Injectable, so tests need no network.
 */
export type PartFetcher = (repository: string, ref: string, path: string) => FetchedPart | undefined | Promise<FetchedPart | undefined>;

/** The real fetcher: shallow, blobless, one commit, then a sparse checkout of exactly `path` and the root licence. */
export const gitPartFetcher: PartFetcher = (repository, ref, path) => {
  const repo = shallowFetch(`https://github.com/${repository}.git`, ref, { blobless: true, prefix: "kg-materialize-" });
  try {
    const head = git(["rev-parse", "FETCH_HEAD"], repo).trim();
    if (head !== ref) throw new Error(`the remote served ${head} for ${ref}`);
    // Trees only, so this costs no blob: the entry's type, and the denominator.
    const entry = git(["ls-tree", "FETCH_HEAD", "--", path], repo).trim();
    if (!entry) return undefined;
    const type = entry.split(/\s+/)[1];
    const collectionFiles = git(["ls-tree", "-r", "--name-only", "FETCH_HEAD"], repo).split("\n").filter(Boolean).length;
    const out = mkdtempSync(join(tmpdir(), "kg-materialize-part-"));
    if (type === "commit") return { kind: "submodule", root: out, part: out, collectionFiles };
    const kind = type === "tree" ? "tree" : "blob";
    git(["sparse-checkout", "set", "--no-cone", kind === "tree" ? `/${path}/` : `/${path}`, "/LICENSE*", "/LICENCE*", "/COPYING*"], repo);
    git(["checkout", "-q", "FETCH_HEAD"], repo);
    const part = join(out, "part");
    if (kind === "tree") cpSync(join(repo, path), part, { recursive: true, verbatimSymlinks: true });
    else {
      mkdirSync(part);
      cpSync(join(repo, path), join(part, basename(path)), { verbatimSymlinks: true });
    }
    // A subgraph carrying its own licence needs no other; otherwise the
    // root's travels with the copy, as `sync-remote-skills` does for a skill.
    const own = kind === "tree" ? upstreamLicence(repo, join(repo, path)) : undefined;
    const rootName = own ? undefined : LICENCE_NAMES.find((n) => existsSync(join(repo, n)));
    let licence: FetchedPart["licence"];
    if (rootName) {
      cpSync(join(repo, rootName), join(out, rootName));
      licence = { name: rootName, file: join(out, rootName), upstreamPath: rootName };
    }
    return { kind, root: out, part, ...(licence ? { licence } : {}), collectionFiles };
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
};

// ── Resolving the request against the subscription and its snapshot ─────────

interface Resolved {
  instanceRoot: string;
  snapshotDir: string;
  sub: Subscription;
  snap: SubstrateSnapshot;
  part: KgPartRecord;
  partDir: string;
}

type Resolution = { ok: true; r: Resolved } | { ok: false; reason: string };

/** The substrate's declared directories as `{id, path}`, read from the snapshot's own bytes. */
export function declaredDirectories(snap: SubstrateSnapshot): { id: string; path: string }[] {
  const raw = JSON.parse(snap.raw) as { directories?: { id: string; path: string }[] };
  return (raw.directories ?? []).map((d) => ({ id: d.id, path: d.path.replace(/\/+$/, "") }));
}

function readSnapshot(snapshotDir: string, sub: Subscription): { ok: true; snap: SubstrateSnapshot } | { ok: false; reason: string } {
  const file = join(snapshotDir, `${sub.id}${SNAPSHOT_SUFFIX}`);
  if (!existsSync(file)) return { ok: false, reason: `subscription \`${sub.id}\` has no cached snapshot — run \`bun run kg:subscribe ${sub.repository}@${sub.ref}\`` };
  const parsed = SubstrateSnapshotSchema.safeParse(JSON.parse(readFileSync(file, "utf8")));
  if (!parsed.success) return { ok: false, reason: `the snapshot of \`${sub.id}\` does not parse: ${parsed.error.issues[0]?.message}` };
  if (parsed.data.ref !== sub.ref || parsed.data.repository !== sub.repository) {
    return { ok: false, reason: `the snapshot of \`${sub.id}\` is of ${parsed.data.repository}@${parsed.data.ref.slice(0, 12)}, and the subscription pins ${sub.repository}@${sub.ref.slice(0, 12)} — re-subscribe` };
  }
  return { ok: true, snap: parsed.data };
}

type SubscriptionResolution =
  | { ok: true; instanceRoot: string; snapshotDir: string; sub: Subscription; snap: SubstrateSnapshot }
  | { ok: false; reason: string };

/** The subscription, its snapshot directory and its snapshot AT THE PIN — the prefix both modes share. */
function resolveSubscription(opts: { instance?: string; subscription: string }): SubscriptionResolution {
  const instanceRoot = resolve(opts.instance ?? DEFAULT_INSTANCE);
  const declName = findDeclarationFile(instanceRoot);
  if (!declName) return { ok: false, reason: `${instanceRoot} carries no instance declaration` };
  const raw = JSON.parse(readFileSync(join(instanceRoot, declName), "utf8")) as Record<string, unknown>;
  const sub = ((raw["subscriptions"] ?? []) as Subscription[]).find((s) => s.id === opts.subscription);
  if (!sub) return { ok: false, reason: `${declName} has no subscription \`${opts.subscription}\` — subscribe first (\`bun run kg:subscribe\`)` };
  const snapshotDir = snapshotDirOf(instanceRoot, raw);
  if (!snapshotDir) return { ok: false, reason: `${declName} declares no \`substrate-snapshot\` directory to hold materialised parts in` };
  const s = readSnapshot(snapshotDir, sub);
  if (!s.ok) return s;
  return { ok: true, instanceRoot, snapshotDir, sub, snap: s.snap };
}

export function resolveRequest(opts: { instance?: string; subscription: string; subgraph?: string; asset?: string }): Resolution {
  const rs = resolveSubscription(opts);
  if (!rs.ok) return rs;
  const { instanceRoot, snapshotDir, sub, snap } = rs;
  const dirs = declaredDirectories(snap);

  if ((opts.subgraph === undefined) === (opts.asset === undefined)) {
    return { ok: false, reason: "name exactly one part: a subgraph id, or `--asset <path>`" };
  }
  if (opts.subgraph !== undefined) {
    const id = opts.subgraph;
    const chosen = (sub.subgraphs ?? []).includes(id);
    const declared = dirs.find((d) => d.id === id);
    if (!chosen) {
      return {
        ok: false,
        reason:
          `subgraph \`${id}\` is not chosen by subscription \`${sub.id}\` (chosen: ${(sub.subgraphs ?? []).map((g) => `\`${g}\``).join(", ") || "none"}). ` +
          `Choosing is the subscriber's decision: add it to \`subscriptions[].subgraphs\` first`,
      };
    }
    if (!declared) {
      return {
        ok: false,
        reason: `subgraph \`${id}\` is chosen, but the cached snapshot of ${sub.repository}@${sub.ref.slice(0, 12)} does not declare it (declared: ${dirs.map((d) => `\`${d.id}\``).join(", ") || "none"})`,
      };
    }
    const p = safeRelPath(declared.path);
    if (!p.ok) return { ok: false, reason: `subgraph \`${id}\` is declared at a path that cannot be materialised: ${p.why}` };
    const part: KgPartRecord = { kind: "subgraph", id, path: p.path };
    return { ok: true, r: { instanceRoot, snapshotDir, sub, snap, part, partDir: partDirOf(snapshotDir, sub.id, part) } };
  }
  const policy = sub.assets?.policy ?? "none";
  if (policy !== "on-demand" && policy !== "all") {
    return { ok: false, reason: `subscription \`${sub.id}\` has asset policy \`${policy}\`; an asset is fetched only under \`on-demand\` or \`all\`` };
  }
  const p = safeRelPath(opts.asset!);
  if (!p.ok) return { ok: false, reason: `asset ${p.why}` };
  const under = dirs.find((d) => p.path.startsWith(`${d.path}/`));
  if (!under) {
    return {
      ok: false,
      reason: `asset \`${p.path}\` lies outside every directory the snapshot declares (${dirs.map((d) => `\`${d.path}/\``).join(", ") || "none"}), so it is not part of the substrate's graph`,
    };
  }
  const part: KgPartRecord = { kind: "asset", path: p.path };
  return { ok: true, r: { instanceRoot, snapshotDir, sub, snap, part, partDir: partDirOf(snapshotDir, sub.id, part) } };
}

// ── The gates ────────────────────────────────────────────────────────────────

const PERSON_GATES = ["restrictions", "copyright", "retention", "sourceLoss"] as const;

function personGates(d: KgDecisions | undefined): Record<(typeof PERSON_GATES)[number], Gate> {
  const out = {} as Record<(typeof PERSON_GATES)[number], Gate>;
  for (const k of PERSON_GATES) {
    const g = d?.gates?.[k];
    out[k] = g
      ? { ...g, ...(g.decidedBy || !d?.decidedBy ? {} : { decidedBy: d.decidedBy }) }
      : { verdict: "unknown", basis: `not answered: the decisions file states no verdict for \`${k}\`, and an unanswered gate counts as a refusal` };
  }
  return out;
}

const fmtBytes = (n: number): string => (n < 1024 ? `${n} B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(1)} KiB` : `${(n / 1024 ** 2).toFixed(1)} MiB`);

/** The one gate a service answers: what is taken, measured, against the budget. */
export function sizeGate(bytes: number, files: number, maxBytes: number, collectionFiles?: number, at?: string): Gate {
  const whole = collectionFiles !== undefined ? `${files} of the ${collectionFiles} files the repository holds at the pin` : `${files} file(s); the repository's whole was not enumerated`;
  const over = bytes > maxBytes;
  return {
    verdict: over ? "refused" : "permitted",
    basis: `measured ${fmtBytes(bytes)} (${bytes} bytes) in ${whole}, against a budget of ${fmtBytes(maxBytes)}${over ? " — over it" : ""}`,
    decidedBy: "kg:materialize (measured)",
    ...(at ? { decidedAt: at } : {}),
  };
}

// ── Materialise ──────────────────────────────────────────────────────────────

export type MaterializeResult =
  | { state: "materialized"; record: KgMaterializationRecord; recordFile: string; changed: boolean }
  | { state: "stayed-referenced"; record: KgMaterializationRecord; recordFile: string; reason: string }
  | { state: "refused"; reason: string }
  | { state: "could-not-determine"; reason: string };

export interface MaterializeOptions {
  subscription: string;
  subgraph?: string;
  asset?: string;
  instance?: string;
  decisions?: KgDecisions;
  fetch?: PartFetcher;
  now?: Date;
  dryRun?: boolean;
}

function readExisting(partDir: string): KgMaterializationRecord | undefined {
  const f = join(partDir, PART_RECORD_FILE);
  if (!existsSync(f)) return undefined;
  const p = KgMaterializationRecordSchema.safeParse(JSON.parse(readFileSync(f, "utf8")));
  return p.success ? p.data : undefined;
}

function writeRecordOnly(partDir: string, record: KgMaterializationRecord): void {
  rmSync(partDir, { recursive: true, force: true });
  mkdirSync(partDir, { recursive: true });
  writeFileSync(join(partDir, PART_RECORD_FILE), `${JSON.stringify(record, null, 2)}\n`);
}

export async function materialize(opts: MaterializeOptions): Promise<MaterializeResult> {
  const res = resolveRequest(opts);
  if (!res.ok) return { state: "refused", reason: res.reason };
  const { instanceRoot, sub, part, partDir } = res.r;
  const at = (opts.now ?? new Date()).toISOString();
  const recordFile = join(partDir, PART_RECORD_FILE);
  const label = part.kind === "subgraph" ? `subgraph \`${part.id}\`` : `asset \`${part.path}\``;

  const existing = readExisting(partDir);
  if (existing && existing.materialization.state === "materialized" && existing.ref !== sub.ref) {
    return {
      state: "refused",
      reason: `${label} is held at ${existing.ref.slice(0, 12)} and the subscription now pins ${sub.ref.slice(0, 12)}: moving a held copy is \`refresh-materialized\`, not a re-materialise`,
    };
  }

  const d = opts.decisions;
  if (d) {
    const parsed = KgDecisionsSchema.safeParse(d);
    if (!parsed.success) return { state: "refused", reason: `the decisions do not parse: ${parsed.error.issues[0]?.path.join(".")}: ${parsed.error.issues[0]?.message}` };
    if (d.purpose === "working" && d.gates?.sourceLoss?.verdict === "permitted") {
      return { state: "refused", reason: "a `working` copy cannot discharge `sourceLoss`: only an archival copy of the original bytes answers that gate" };
    }
  }
  const people = personGates(d);
  const maxBytes = d?.maxBytes ?? DEFAULT_MAX_BYTES;
  const upstreamOf = (p: string, tree: boolean): string => `https://github.com/${sub.repository}/${tree ? "tree" : "blob"}/${sub.ref}/${p}`;
  const provenance = { upstream: upstreamOf(part.path, part.kind === "subgraph") };
  const base = { $schema: KG_PART_RECORD_SCHEMA, subscription: sub.id, repository: sub.repository, ref: sub.ref, part } as const;

  const stay = (size: Gate, why: string): MaterializeResult => {
    const gates: Gates = { size, ...people };
    const keys = Object.keys(gates) as (keyof Gates)[];
    const record = KgMaterializationRecordSchema.parse({
      ...base,
      materialization: { state: "referenced", provenance, note: why },
      refusal: {
        gates,
        refused: keys.filter((k) => gates[k].verdict === "refused"),
        unanswered: keys.filter((k) => gates[k].verdict === "unknown"),
        ...(d?.purpose ? {} : { purposeMissing: true }),
      },
    });
    if (!opts.dryRun) writeRecordOnly(partDir, record);
    return { state: "stayed-referenced", record, recordFile, reason: why };
  };

  // Purpose and the four person gates are asked BEFORE the fetch: measuring
  // size costs the network, and a part a person has refused needs no bytes.
  const stoppers = PERSON_GATES.filter((k) => people[k].verdict !== "permitted");
  if (!d?.purpose || stoppers.length) {
    const why = [
      ...(d?.purpose ? [] : ["no purpose stated (working, archival or both), and three of the gates mean different things under each"]),
      ...stoppers.map((k) => `\`${k}\` is ${people[k].verdict}`),
    ].join("; ");
    return stay({ verdict: "unknown", basis: "not measured: the walk stopped before the fetch, because " + why }, `${label} stayed referenced: ${why}`);
  }

  let fetched: FetchedPart | undefined;
  try {
    fetched = await (opts.fetch ?? gitPartFetcher)(sub.repository, sub.ref, part.path);
  } catch (e) {
    return { state: "could-not-determine", reason: `${label} of ${sub.repository} at ${sub.ref.slice(0, 12)} was not read: ${e instanceof Error ? e.message : String(e)}` };
  }
  if (!fetched) {
    const claim = part.kind === "subgraph" ? "though the snapshot declares it" : "though it lies under a directory the snapshot declares";
    return { state: "refused", reason: `${sub.repository} at ${sub.ref.slice(0, 12)} holds nothing at \`${part.path}\`, ${claim}` };
  }
  try {
    const wantKind = part.kind === "subgraph" ? "tree" : "blob";
    if (fetched.kind !== wantKind) {
      return { state: "refused", reason: `\`${part.path}\` is a ${fetched.kind === "submodule" ? "submodule" : fetched.kind === "tree" ? "directory" : "file"} at the pin; ${part.kind === "asset" ? "an asset" : "a subgraph"} is ${wantKind === "tree" ? "a directory" : "one file"}` };
    }
    const { files, links } = treeEntries(fetched.part);
    if (links.length) {
      return { state: "refused", reason: `${label} holds symbolic link(s) ${links.map((l) => `\`${l}\``).join(", ")}: a link's target is outside what fixity can vouch for` };
    }
    if (files.length === 0) return { state: "refused", reason: `${label} holds no files at the pin` };
    const sizes = files.map((f) => statSync(join(fetched!.part, f)).size);
    const bytes = sizes.reduce((a, b) => a + b, 0);
    const size = sizeGate(bytes, files.length, maxBytes, fetched.collectionFiles, at);
    if (size.verdict !== "permitted") return stay(size, `${label} stayed referenced: \`size\` is refused — ${size.basis}`);

    const gates: Gates = { size, ...people };
    const common = {
      purpose: d.purpose,
      gates,
      materializedAt: at,
      upstreamVersion: sub.ref,
      ...(d.expiresAt ? { expiresAt: d.expiresAt } : {}),
    };
    const treeFinal = join(partDir, PART_TREE);
    const local = (p: string): string => relative(instanceRoot, p).split("\\").join("/");
    const upstreamFile = (f: string): string => (part.kind === "subgraph" ? `${part.path}/${f}` : part.path);
    const fileRecords = files.map((f, i) => ({
      id: `${sub.id}/${part.kind === "subgraph" ? part.id : "asset"}/${f}`,
      name: f,
      materialization: {
        state: "materialized" as const,
        provenance: { upstream: upstreamOf(upstreamFile(f), false) },
        localPath: local(join(treeFinal, f)),
        bytes: sizes[i],
        ...common,
        fixity: { algorithm: "sha256" as const, digest: sha256File(join(fetched!.part, f)) },
      },
    }));
    const digest = part.kind === "subgraph" ? treeDigest(fetched.part, files) : fileRecords[0]!.materialization.fixity.digest;
    const licence = fetched.licence
      ? {
          id: `${sub.id}/licence/${fetched.licence.name}`,
          name: fetched.licence.name,
          materialization: {
            state: "materialized" as const,
            provenance: { upstream: upstreamOf(fetched.licence.upstreamPath, false) },
            localPath: local(join(partDir, fetched.licence.name)),
            bytes: statSync(fetched.licence.file).size,
            ...common,
            fixity: { algorithm: "sha256" as const, digest: sha256File(fetched.licence.file) },
          },
        }
      : undefined;
    const record = KgMaterializationRecordSchema.parse({
      ...base,
      materialization: {
        state: "materialized",
        provenance,
        localPath: local(part.kind === "subgraph" ? treeFinal : join(treeFinal, files[0]!)),
        bytes,
        ...common,
        fixity: { algorithm: "sha256", digest },
      },
      ...(part.kind === "subgraph" ? { files: fileRecords } : {}),
      ...(licence ? { licence } : {}),
      note:
        "Somebody else's bytes, pinned. Do not edit in place: re-run `bun run kg:materialize` at the pin, or move the pin with `refresh-materialized`." +
        (licence || part.kind === "asset" || files.some((f) => /^(LICEN[CS]E|COPYING)/.test(f)) ? "" : " No licence file was found in the part or at the upstream root."),
    });

    // Already held, same pin, same bytes, same decisions: nothing to write.
    if (
      existing?.materialization.state === "materialized" &&
      existing.materialization.fixity?.digest === digest &&
      JSON.stringify([existing.materialization.purpose, existing.materialization.gates?.restrictions, existing.materialization.gates?.copyright, existing.materialization.gates?.retention, existing.materialization.gates?.sourceLoss, existing.materialization.expiresAt]) ===
        JSON.stringify([d.purpose, people.restrictions, people.copyright, people.retention, people.sourceLoss, d.expiresAt])
    ) {
      return { state: "materialized", record: existing, recordFile, changed: false };
    }
    if (!opts.dryRun) {
      // Land beside the final place, then swap, so a crash leaves the old
      // copy or the new one and never half of each.
      mkdirSync(dirname(partDir), { recursive: true });
      const staging = mkdtempSync(join(dirname(partDir), `${basename(partDir)}.landing-`));
      try {
        cpSync(fetched.part, join(staging, PART_TREE), { recursive: true });
        if (fetched.licence) cpSync(fetched.licence.file, join(staging, fetched.licence.name));
        writeFileSync(join(staging, PART_RECORD_FILE), `${JSON.stringify(record, null, 2)}\n`);
        rmSync(partDir, { recursive: true, force: true });
        renameSync(staging, partDir);
      } catch (e) {
        rmSync(staging, { recursive: true, force: true });
        throw e;
      }
    }
    return { state: "materialized", record, recordFile, changed: true };
  } finally {
    rmSync(fetched.root, { recursive: true, force: true });
  }
}

// ── Metadata mode: `--nodes <subscription> <subgraph-path>` ──────────────────

/**
 * Where the substrate publishes one subgraph's hydrated file, repo-relative,
 * and the IRI suffix the file must declare — or why the request is not one.
 * Read from the SNAPSHOT's declaration (its `docs` directory and its name),
 * the way `subgraphOutDir` reads this instance's: the path is the unstable
 * half, so it is looked up rather than spelled. The snapshot's declaration is
 * the substrate's root `<name>.json` (`SubstrateSnapshotSchema.file`), so its
 * instance root IS the repository root and a declared path is repo-relative.
 */
export function nodesLocation(
  snap: SubstrateSnapshot,
  subgraphPath: string,
): { ok: true; path: string; upstreamPath: string; iriSuffix: string; harness: string } | { ok: false; reason: string } {
  const harness = snap.summary.name;
  const dirs = declaredDirectories(snap);
  const docs = dirs.find((d) => d.id === "docs");
  const indexHint = docs ? `\`${docs.path}/subgraph/${harness}/${SUBGRAPH_INDEX_FILE}\`` : `\`${SUBGRAPH_INDEX_FILE}\``;
  const trimmed = subgraphPath.trim().replace(/^\/+|\/+$/g, "");
  if (trimmed === "" || trimmed === ".") {
    return {
      ok: false,
      reason:
        `the root of \`${harness}\` publishes ${indexHint} only, by design: a hydrated file at the root would be the whole graph in one document, ` +
        `the monolith \`f233\` forbids. Read the root's \`${SUBGRAPH_INDEX_FILE}\` for its direct members and its child subgraph IRIs, then ask \`--nodes\` for one of those`,
    };
  }
  const p = safeRelPath(trimmed);
  if (!p.ok) return { ok: false, reason: `subgraph path ${p.why}` };
  if (!dirs.some((d) => p.path === d.path || p.path.startsWith(`${d.path}/`))) {
    return {
      ok: false,
      reason: `\`${p.path}\` lies outside every directory the snapshot declares (${dirs.map((d) => `\`${d.path}/\``).join(", ") || "none"}), so it is no subgraph of the substrate's graph`,
    };
  }
  if (!docs) {
    return { ok: false, reason: `the snapshot of ${snap.repository}@${snap.ref.slice(0, 12)} declares no \`docs\` directory, so the substrate publishes no subgraph files to fetch` };
  }
  const up = safeRelPath(`${docs.path}/subgraph/${harness}/${p.path}/${SUBGRAPH_HYDRATED_FILE}`);
  if (!up.ok) return { ok: false, reason: `the hydrated file's upstream path ${up.why}` };
  return { ok: true, path: p.path, upstreamPath: up.path, iriSuffix: `/subgraph/${harness}/${p.path}/`, harness };
}

export type NodesResult =
  | { state: "materialized"; record: KgNodesRecord; recordFile: string; file: string; changed: boolean }
  | { state: "stayed-referenced"; record: KgNodesRecord; recordFile: string; reason: string }
  | { state: "refused"; reason: string }
  | { state: "could-not-determine"; reason: string };

export interface NodesOptions {
  subscription: string;
  /** Instance-relative subgraph path in the substrate, e.g. `skills/sdlc`. */
  path: string;
  instance?: string;
  /** The size cap. Absent: {@link DEFAULT_MAX_BYTES}. */
  maxBytes?: number;
  fetch?: PartFetcher;
  now?: Date;
  dryRun?: boolean;
}

function readNodesRecord(dir: string): KgNodesRecord | undefined {
  const f = join(dir, NODES_RECORD_FILE);
  if (!existsSync(f)) return undefined;
  try {
    const p = KgNodesRecordSchema.safeParse(JSON.parse(readFileSync(f, "utf8")));
    return p.success ? p.data : undefined;
  } catch {
    return undefined;
  }
}

/** Write beside the final name, then rename: a crash leaves the old file or the new one. */
function writeAtomic(file: string, content: string | Uint8Array): void {
  const landing = `${file}.landing-${process.pid}`;
  writeFileSync(landing, content);
  renameSync(landing, file);
}

/** Nodes in a hydrated subgraph's transitive membership, and subgraphs under it. */
function countHydrated(h: { hasMember?: unknown[]; hasSubgraph?: SubgraphHydratedNode[] }): { members: number; subgraphs: number } {
  let members = h.hasMember?.length ?? 0;
  let subgraphs = 0;
  for (const c of h.hasSubgraph ?? []) {
    const n = countHydrated(c);
    members += n.members;
    subgraphs += 1 + n.subgraphs;
  }
  return { members, subgraphs };
}

/**
 * METADATA MODE: fetch one subgraph's `index.hydrated.jsonld` at the pin,
 * validate it, and hold it with a sha256 record. See the module header,
 * §"Metadata mode", for why the person gates do not apply and `size` does.
 */
export async function materializeNodes(opts: NodesOptions): Promise<NodesResult> {
  const rs = resolveSubscription(opts);
  if (!rs.ok) return { state: "refused", reason: rs.reason };
  const { instanceRoot, snapshotDir, sub, snap } = rs;
  const loc = nodesLocation(snap, opts.path);
  if (!loc.ok) return { state: "refused", reason: loc.reason };
  const dir = nodesDirOf(snapshotDir, sub.id, loc.path);
  const recordFile = join(dir, NODES_RECORD_FILE);
  const heldFile = join(dir, SUBGRAPH_HYDRATED_FILE);
  const label = `the nodes of subgraph \`${loc.path}\``;
  const at = (opts.now ?? new Date()).toISOString();

  const existing = readNodesRecord(dir);
  if (existing?.state === "materialized" && existing.ref !== sub.ref) {
    return {
      state: "refused",
      reason: `${label} are held at ${existing.ref.slice(0, 12)} and the subscription now pins ${sub.ref.slice(0, 12)}: moving a held copy is \`refresh-materialized\`, not a re-fetch`,
    };
  }

  let fetched: FetchedPart | undefined;
  try {
    fetched = await (opts.fetch ?? gitPartFetcher)(sub.repository, sub.ref, loc.upstreamPath);
  } catch (e) {
    return { state: "could-not-determine", reason: `\`${loc.upstreamPath}\` of ${sub.repository} at ${sub.ref.slice(0, 12)} was not read: ${e instanceof Error ? e.message : String(e)}` };
  }
  if (!fetched) {
    return {
      state: "refused",
      reason:
        `${sub.repository} at ${sub.ref.slice(0, 12)} publishes no \`${loc.upstreamPath}\`: either \`${loc.path}\` is not a subgraph there, ` +
        `or the substrate did not publish its subgraph files at that commit (\`bun run subgraph:jsonld\`)`,
    };
  }
  try {
    if (fetched.kind !== "blob") {
      return { state: "refused", reason: `\`${loc.upstreamPath}\` is a ${fetched.kind === "submodule" ? "submodule" : "directory"} at the pin, not one file` };
    }
    const src = join(fetched.part, SUBGRAPH_HYDRATED_FILE);
    if (!existsSync(src)) return { state: "could-not-determine", reason: `the fetcher reported \`${loc.upstreamPath}\` and left no \`${SUBGRAPH_HYDRATED_FILE}\` to read` };
    const bytes = readFileSync(src);
    const upstream = `https://github.com/${sub.repository}/blob/${sub.ref}/${loc.upstreamPath}`;
    const base = { $schema: KG_NODES_RECORD_SCHEMA, subscription: sub.id, repository: sub.repository, ref: sub.ref } as const;

    // The safety cap is measured BEFORE the bytes are parsed.
    const size = sizeGate(bytes.length, 1, opts.maxBytes ?? DEFAULT_MAX_BYTES, fetched.collectionFiles, at);
    if (size.verdict !== "permitted") {
      const why = `${label} stayed referenced: \`size\` is refused — ${size.basis}`;
      const record = KgNodesRecordSchema.parse({ ...base, subgraph: { path: loc.path }, state: "referenced", size, note: why });
      if (!opts.dryRun) {
        mkdirSync(dir, { recursive: true });
        rmSync(heldFile, { force: true });
        writeAtomic(recordFile, `${JSON.stringify(record, null, 2)}\n`);
      }
      return { state: "stayed-referenced", record, recordFile, reason: why };
    }

    let json: unknown;
    try {
      json = JSON.parse(bytes.toString("utf8"));
    } catch (e) {
      return { state: "refused", reason: `\`${loc.upstreamPath}\` at ${sub.ref.slice(0, 12)} is not JSON: ${e instanceof Error ? e.message : String(e)}` };
    }
    const parsed = SubgraphHydratedSchema.safeParse(json);
    if (!parsed.success) {
      const i = parsed.error.issues[0];
      return { state: "refused", reason: `\`${loc.upstreamPath}\` at ${sub.ref.slice(0, 12)} is not a valid hydrated subgraph file: ${i?.path.join(".") || "(root)"}: ${i?.message}` };
    }
    const h = parsed.data;
    if (!h["@id"].endsWith(loc.iriSuffix)) {
      return { state: "refused", reason: `\`${loc.upstreamPath}\` declares itself \`${h["@id"]}\`, which is not the subgraph \`…${loc.iriSuffix}\` it was fetched for` };
    }
    const digest = createHash("sha256").update(bytes).digest("hex");
    const { members, subgraphs } = countHydrated(h);
    const local = relative(instanceRoot, heldFile).split("\\").join("/");
    const record = KgNodesRecordSchema.parse({
      ...base,
      subgraph: { path: loc.path, iri: h["@id"] },
      state: "materialized",
      size,
      file: { name: SUBGRAPH_HYDRATED_FILE, upstream, localPath: local, bytes: bytes.length, fetchedAt: at, fixity: { algorithm: "sha256", digest } },
      members,
      subgraphs,
      note: "Graph metadata only, somebody else's, pinned. Do not edit in place: re-run `bun run kg:materialize --nodes` at the pin.",
    });
    if (existing?.state === "materialized" && existing.file?.fixity.digest === digest && existsSync(heldFile) && sha256File(heldFile) === digest) {
      return { state: "materialized", record: existing, recordFile, file: heldFile, changed: false };
    }
    if (!opts.dryRun) {
      mkdirSync(dir, { recursive: true });
      // The file first and the record last: a crash between them leaves a
      // file no record accounts for, which `--check` reports as a stray.
      writeAtomic(heldFile, bytes);
      writeAtomic(recordFile, `${JSON.stringify(record, null, 2)}\n`);
    }
    return { state: "materialized", record, recordFile, file: heldFile, changed: true };
  } finally {
    rmSync(fetched.root, { recursive: true, force: true });
  }
}

/** Offline judgement of one metadata-mode record: parses, belongs, at the pin, hashes. */
function checkNodesRecord(
  dir: string,
  sub: Subscription,
  snapshotDir: string,
  snap: SubstrateSnapshot | undefined,
  instanceRoot: string,
): { findings: string[]; held: boolean } {
  const where = relative(snapshotDir, dir).split("\\").join("/");
  const out: string[] = [];
  let json: unknown;
  try {
    json = JSON.parse(readFileSync(join(dir, NODES_RECORD_FILE), "utf8"));
  } catch (err) {
    return { findings: [`${where}: the nodes record is not readable JSON: ${err instanceof Error ? err.message : String(err)}`], held: false };
  }
  const parsed = KgNodesRecordSchema.safeParse(json);
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    return { findings: [`${where}: the nodes record does not parse: ${i?.path.join(".") || "(root)"}: ${i?.message}`], held: false };
  }
  const r = parsed.data;
  const held = r.state === "materialized";
  if (r.subscription !== sub.id || r.repository !== sub.repository) out.push(`${where}: the nodes record says it belongs to \`${r.subscription}\` (${r.repository})`);
  if (r.ref !== sub.ref) out.push(`${where}: ${held ? "held" : "decided"} at ${r.ref.slice(0, 12)}, and the subscription pins ${sub.ref.slice(0, 12)} — refresh it (\`refresh-materialized\`)`);
  if (resolve(nodesDirOf(snapshotDir, sub.id, r.subgraph.path)) !== resolve(dir)) out.push(`${where}: the nodes record describes subgraph \`${r.subgraph.path}\`, which the layout puts elsewhere`);
  if (snap) {
    const loc = nodesLocation(snap, r.subgraph.path);
    if (!loc.ok) out.push(`${where}: ${loc.reason}`);
    else if (r.subgraph.iri && !r.subgraph.iri.endsWith(loc.iriSuffix)) out.push(`${where}: the record names \`${r.subgraph.iri}\`, not the subgraph \`…${loc.iriSuffix}\``);
  }
  const file = join(dir, SUBGRAPH_HYDRATED_FILE);
  if (!held) {
    if (existsSync(file)) out.push(`${where}: \`${SUBGRAPH_HYDRATED_FILE}\` sits beside a record that says it stayed referenced`);
    return { findings: out, held };
  }
  const local = relative(instanceRoot, file).split("\\").join("/");
  if (r.file!.localPath !== local) out.push(`${where}: \`file.localPath\` is \`${r.file!.localPath}\`, not where the file is`);
  if (!existsSync(file)) out.push(`${where}: \`${SUBGRAPH_HYDRATED_FILE}\` is recorded and absent`);
  else if (sha256File(file) !== r.file!.fixity.digest) out.push(`${where}: \`${SUBGRAPH_HYDRATED_FILE}\` does not hash to its record — somebody else's metadata was edited in place`);
  return { findings: out, held };
}

// ── --check: offline, every held part still is what its record says ──────────

export interface CheckReport {
  findings: string[];
  held: number;
  stayedReferenced: number;
  /** Chosen subgraphs with no record: "chosen, not yet held" — a state, not a finding. */
  chosenNotHeld: number;
  /** Subgraphs held in metadata mode (`--nodes`): an `index.hydrated.jsonld` and its record. */
  nodesHeld: number;
}

/**
 * Offline judgement of one instance's materialised parts. What it holds:
 *
 * - every record parses as {@link KgMaterializationRecordSchema} (so its
 *   inner records are valid `MaterializationSchema`), sits where the layout
 *   puts its part, and belongs to a subscription at that subscription's pin;
 * - every part is still CHOSEN (subgraph listed; asset under a policy that
 *   allows it) and still DECLARED by the snapshot, at the same path;
 * - a held part's tree hashes to its digest, the files on disk are exactly
 *   the files recorded (none added, none missing), each file and the licence
 *   match their own digests, and every `localPath` is where the bytes are;
 * - no bytes sit in a subscription's directory without a record, and no
 *   directory belongs to no subscription.
 */
export function checkMaterializations(instanceRoot: string): CheckReport {
  const report: CheckReport = { findings: [], held: 0, stayedReferenced: 0, chosenNotHeld: 0, nodesHeld: 0 };
  const declName = findDeclarationFile(instanceRoot);
  if (!declName) return report;
  const raw = JSON.parse(readFileSync(join(instanceRoot, declName), "utf8")) as Record<string, unknown>;
  const subs = (raw["subscriptions"] ?? []) as Subscription[];
  const snapshotDir = snapshotDirOf(instanceRoot, raw);
  if (!snapshotDir || !existsSync(snapshotDir)) {
    report.chosenNotHeld = subs.reduce((n, s) => n + (s.subgraphs?.length ?? 0), 0);
    return report;
  }
  const out = report.findings;
  const ids = new Set(subs.map((s) => s.id));
  for (const e of readdirSync(snapshotDir, { withFileTypes: true })) {
    if (e.isDirectory() && !ids.has(e.name)) out.push(`${e.name}/: materialised parts for no subscription — orphaned`);
  }
  const local = (p: string): string => relative(instanceRoot, p).split("\\").join("/");
  for (const s of subs) {
    const { parts, strays, nodes } = partRecordsIn(snapshotDir, s.id);
    for (const st of strays) out.push(`${s.id}: \`${st}\` is in the subscription's directory with no record — bytes nobody accounts for`);
    const snapRes = readSnapshot(snapshotDir, s);
    const dirs = snapRes.ok ? declaredDirectories(snapRes.snap) : undefined;
    for (const nd of nodes) {
      const n = checkNodesRecord(nd, s, snapshotDir, snapRes.ok ? snapRes.snap : undefined, instanceRoot);
      out.push(...n.findings);
      if (n.held) report.nodesHeld++;
      if (!snapRes.ok) out.push(`${relative(snapshotDir, nd).split("\\").join("/")}: cannot be judged against the substrate: ${snapRes.reason}`);
    }
    const heldSubgraphs = new Set<string>();
    for (const p of parts) {
      const where = relative(snapshotDir, p.dir).split("\\").join("/");
      let json: unknown;
      try {
        json = JSON.parse(readFileSync(join(p.dir, PART_RECORD_FILE), "utf8"));
      } catch (err) {
        out.push(`${where}: the record is not readable JSON: ${err instanceof Error ? err.message : String(err)}`);
        continue;
      }
      const parsed = KgMaterializationRecordSchema.safeParse(json);
      if (!parsed.success) {
        const i = parsed.error.issues[0];
        out.push(`${where}: the record does not parse: ${i?.path.join(".") || "(root)"}: ${i?.message}`);
        continue;
      }
      const r = parsed.data;
      const held = r.materialization.state === "materialized";
      if (held) report.held++;
      else report.stayedReferenced++;
      if (r.part.kind === "subgraph") heldSubgraphs.add(r.part.id);
      if (r.subscription !== s.id || r.repository !== s.repository) out.push(`${where}: the record says it belongs to \`${r.subscription}\` (${r.repository})`);
      if (r.ref !== s.ref) out.push(`${where}: ${held ? "held" : "decided"} at ${r.ref.slice(0, 12)}, and the subscription pins ${s.ref.slice(0, 12)} — refresh it (\`refresh-materialized\`)`);
      if (resolve(partDirOf(snapshotDir, s.id, r.part)) !== resolve(p.dir)) out.push(`${where}: the record describes ${r.part.kind} \`${r.part.kind === "subgraph" ? r.part.id : r.part.path}\`, which the layout puts elsewhere`);
      if (r.part.kind === "subgraph") {
        if (!(s.subgraphs ?? []).includes(r.part.id)) out.push(`${where}: subgraph \`${r.part.id}\` is ${held ? "held" : "recorded"} but no longer chosen`);
        const decl = dirs?.find((x) => x.id === (r.part as { id: string }).id);
        if (dirs && !decl) out.push(`${where}: subgraph \`${r.part.id}\` is not declared by the snapshot`);
        else if (decl && decl.path !== r.part.path) out.push(`${where}: subgraph \`${r.part.id}\` was copied from \`${r.part.path}\`, and the snapshot declares it at \`${decl.path}\``);
      } else {
        const policy = s.assets?.policy ?? "none";
        if (held && policy !== "on-demand" && policy !== "all") out.push(`${where}: an asset is held under asset policy \`${policy}\``);
        const assetPath = r.part.path;
        if (dirs && !dirs.some((x) => assetPath.startsWith(`${x.path}/`))) out.push(`${where}: asset \`${assetPath}\` lies outside every directory the snapshot declares`);
      }
      if (!snapRes.ok) out.push(`${where}: cannot be judged against the substrate: ${snapRes.reason}`);
      if (!held) continue;

      const tree = join(p.dir, PART_TREE);
      const { files, links } = treeEntries(tree);
      for (const l of links) out.push(`${where}: a symbolic link \`${l}\` under the tree`);
      if (p.fixity !== "verified") out.push(`${where}: the bytes under tree/ do not hash to the recorded digest (${p.fixity}) — somebody else's bytes were edited in place`);
      if (r.materialization.localPath !== local(r.part.kind === "subgraph" ? tree : join(tree, files[0] ?? ""))) {
        out.push(`${where}: \`materialization.localPath\` is \`${r.materialization.localPath}\`, not where the bytes are`);
      }
      if (r.part.kind === "subgraph") {
        const recorded = new Set((r.files ?? []).map((f) => f.name));
        for (const f of files) if (!recorded.has(f)) out.push(`${where}: \`${f}\` is under the tree and in no file record — added in place`);
        for (const f of recorded) if (!files.includes(f)) out.push(`${where}: \`${f}\` is recorded and not under the tree`);
        for (const f of r.files ?? []) {
          const abs = join(tree, f.name);
          if (f.materialization.localPath !== local(abs)) out.push(`${where}: \`${f.name}\`'s localPath is \`${f.materialization.localPath}\`, not where it is`);
          else if (existsSync(abs) && sha256File(abs) !== f.materialization.fixity?.digest) out.push(`${where}: \`${f.name}\` does not match its digest`);
        }
      }
      if (r.licence) {
        const abs = join(p.dir, r.licence.name);
        if (!existsSync(abs)) out.push(`${where}: the licence \`${r.licence.name}\` is recorded and absent`);
        else if (sha256File(abs) !== r.licence.materialization.fixity?.digest) out.push(`${where}: the licence \`${r.licence.name}\` does not match its digest`);
      }
    }
    report.chosenNotHeld += (s.subgraphs ?? []).filter((g) => !heldSubgraphs.has(g)).length;
  }
  return report;
}

// ── CLI ──────────────────────────────────────────────────────────────────────

function flag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  if (argv.includes("--check")) {
    const roots = [...new Set([resolve(DEFAULT_INSTANCE), ...instanceRootsIn(REPO).map((r) => resolve(r))])];
    const total: CheckReport = { findings: [], held: 0, stayedReferenced: 0, chosenNotHeld: 0, nodesHeld: 0 };
    for (const r of roots) {
      const rep = checkMaterializations(r);
      total.held += rep.held;
      total.stayedReferenced += rep.stayedReferenced;
      total.chosenNotHeld += rep.chosenNotHeld;
      total.nodesHeld += rep.nodesHeld;
      total.findings.push(...rep.findings.map((f) => `${relative(repoRootFor(DEFAULT_INSTANCE), r) || "."}: ${f}`));
    }
    console.log(
      `KG materialised parts — ${total.held} held, ${total.stayedReferenced} stayed referenced, ` +
        `${total.chosenNotHeld} chosen subgraph(s) not yet held, ${total.nodesHeld} subgraph(s) held as metadata, across ${roots.length} instance(s)`,
    );
    for (const f of total.findings) console.error(`  ✗ ${f}`);
    if (total.findings.length) process.exit(1);
    console.log(
      total.held + total.stayedReferenced + total.nodesHeld
        ? "  ✓ every held part hashes to its record, is still chosen and declared, and nothing sits unrecorded"
        : "  ✓ nothing materialised — every declaration and subscription directory was read, and no bytes sit unrecorded",
    );
    process.exit(0);
  }
  const valued = new Set(["--asset", "--decisions", "--instance", "--max-bytes"]);
  const positional = argv.filter((a, i) => !a.startsWith("--") && !valued.has(argv[i - 1] ?? ""));
  const rel = (f: string): string => relative(process.cwd(), f);
  if (argv.includes("--nodes")) {
    const [subscription, path] = positional;
    const maxRaw = flag(argv, "--max-bytes");
    const maxBytes = maxRaw === undefined ? undefined : Number(maxRaw);
    if (!subscription || path === undefined || positional.length > 2 || (maxBytes !== undefined && !(Number.isInteger(maxBytes) && maxBytes > 0))) {
      console.error("usage: bun run kg:materialize --nodes <subscription> <subgraph-path> [--max-bytes <n>] [--instance <dir>] [--dry-run]");
      process.exit(2);
    }
    const dryRun = argv.includes("--dry-run");
    const r = await materializeNodes({ subscription, path, instance: flag(argv, "--instance"), ...(maxBytes ? { maxBytes } : {}), dryRun });
    switch (r.state) {
      case "materialized":
        console.log(`  ⬇ nodes: ${r.record.members} node(s) in ${(r.record.subgraphs ?? 0) + 1} subgraph(s), ${r.record.file!.bytes} bytes of metadata, at ${r.record.ref.slice(0, 12)}`);
        console.log(r.changed ? `  ${dryRun ? "would write" : "wrote"} ${rel(r.file)} and ${rel(r.recordFile)}` : "  ✓ already held at this pin, byte for byte — nothing to write");
        process.exit(0);
        break;
      case "stayed-referenced":
        console.error(`  ✗ ${r.reason}`);
        console.error(`  ${dryRun ? "would record" : "recorded"} why in ${rel(r.recordFile)}`);
        process.exit(1);
        break;
      case "refused":
        console.error(`  ✗ refused: ${r.reason}`);
        process.exit(1);
        break;
      case "could-not-determine":
        console.error(`  ? could-not-determine: ${r.reason}`);
        process.exit(3);
    }
  }
  const [subscription, subgraph] = positional;
  const asset = flag(argv, "--asset");
  if (!subscription || (subgraph === undefined) === (asset === undefined)) {
    console.error(
      "usage: bun run kg:materialize <subscription> <subgraph> [--decisions <file.json>] [--instance <dir>] [--dry-run]\n" +
        "       bun run kg:materialize <subscription> --asset <path> [--decisions <file.json>] [--instance <dir>] [--dry-run]\n" +
        "       bun run kg:materialize --nodes <subscription> <subgraph-path> [--max-bytes <n>] [--instance <dir>] [--dry-run]",
    );
    process.exit(2);
  }
  const decisionsFile = flag(argv, "--decisions");
  const decisions = decisionsFile ? (JSON.parse(readFileSync(decisionsFile, "utf8")) as KgDecisions) : undefined;
  const dryRun = argv.includes("--dry-run");
  const r = await materialize({ subscription, subgraph, asset, instance: flag(argv, "--instance"), decisions, dryRun });
  switch (r.state) {
    case "materialized": {
      const m = r.record.materialization;
      console.log(`  ⬇ materialised: ${m.bytes} bytes, ${r.record.files?.length ?? 1} file(s), ${m.purpose}, at ${r.record.ref.slice(0, 12)}`);
      console.log(r.changed ? `  ${dryRun ? "would write" : "wrote"} ${rel(r.recordFile)}` : "  ✓ already held at this pin, with these decisions — nothing to write");
      process.exit(0);
      break;
    }
    case "stayed-referenced":
      console.error(`  ✗ ${r.reason}`);
      console.error(`  ${dryRun ? "would record" : "recorded"} why in ${rel(r.recordFile)}`);
      process.exit(1);
      break;
    case "refused":
      console.error(`  ✗ refused: ${r.reason}`);
      process.exit(1);
      break;
    case "could-not-determine":
      console.error(`  ? could-not-determine: ${r.reason}`);
      process.exit(3);
  }
}
