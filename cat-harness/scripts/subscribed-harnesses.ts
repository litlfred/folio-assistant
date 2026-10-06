/**
 * The harnesses a KG SUBSCRIPTION chose, read from the substrate snapshots
 * `kg:subscribe` cached: whether each is instantiated at the root, and the
 * navbar tile of one that is. Issue #1719, epic bean `fnx4`, slice 7.
 *
 * @module cat-harness/scripts/subscribed-harnesses
 *
 * ## Why this is its own module, and HARNESS rather than core
 *
 * `harness-tiles.ts` (harness) draws the navbar, and the harness may not
 * import core. `kg-instantiate.ts` writes the config and sits beside
 * `kg-subscribe.ts` in core. Reading a snapshot is the half both need, so it
 * lives here, below both, and the snapshot's node schema
 * (`schemas/substrate-snapshot.ts`) is harness for the same reason: the
 * harness registers the `substrate-snapshot` graph typology, and a kind's node
 * schema belongs with the kind.
 *
 * Every reader here is offline: what a tile shows is what was recorded at the
 * last subscribe. A snapshot that is absent, unreadable or not the pin's is
 * returned as such, and the tile draws it as a finding rather than as an
 * empty tile (`dh4f`).
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { KnowledgeGraphDeclarationSchema } from "../../bootstrap-tools/schemas/graph.ts";
import { GENERIC, avatarFor, hasAvatar } from "../schemas/avatars.js";
import { type CatHarnessDeclaration, type Subscription, rootForScope } from "../schemas/cat-harness.js";
import { instanceConfigFilename } from "../schemas/harness-config.js";
import type { DeclarationScope } from "../schemas/kg-node.js";
import {
  SNAPSHOT_GRAPH_TYPOLOGY,
  SNAPSHOT_SUFFIX,
  SubstrateSnapshotSchema,
  type SubstrateSnapshot,
  subscriptionKindOf,
} from "../schemas/substrate-snapshot.js";
import type { HarnessTile } from "./harness-tiles.js";

type DirLike = { path: string; graphTypologies?: readonly string[]; scope?: DeclarationScope };

/** The directory an instance keeps its substrate snapshots in, or undefined when it declares none. */
export function snapshotDirFor(instanceRoot: string, decl: { directories?: readonly DirLike[] }): string | undefined {
  const d = (decl.directories ?? []).find((x) => (x.graphTypologies ?? []).includes(SNAPSHOT_GRAPH_TYPOLOGY));
  return d ? resolve(rootForScope(instanceRoot, d.scope), d.path) : undefined;
}

export type SnapshotRead =
  | { state: "read"; snapshot: SubstrateSnapshot }
  | { state: "absent" | "unreadable" | "mismatch"; reason: string };

/**
 * One subscription's cached snapshot, held to the subscription it belongs to:
 * the right id, repository and pin, and bytes that still match their digest.
 */
export function readSnapshot(instanceRoot: string, decl: { directories?: readonly DirLike[] }, s: Subscription): SnapshotRead {
  const dir = snapshotDirFor(instanceRoot, decl);
  if (!dir) return { state: "absent", reason: `the subscriber declares no \`${SNAPSHOT_GRAPH_TYPOLOGY}\` directory, so no snapshot of \`${s.id}\` can exist` };
  const file = join(dir, `${s.id}${SNAPSHOT_SUFFIX}`);
  if (!existsSync(file)) {
    return { state: "absent", reason: `no snapshot of \`${s.id}\` at ${file} — run \`bun run kg:subscribe ${s.repository}@${s.ref}\`` };
  }
  let parsed;
  try {
    parsed = SubstrateSnapshotSchema.safeParse(JSON.parse(readFileSync(file, "utf8")));
  } catch (e) {
    return { state: "unreadable", reason: `the snapshot of \`${s.id}\` is not JSON: ${e instanceof Error ? e.message : String(e)}` };
  }
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    return { state: "unreadable", reason: `the snapshot of \`${s.id}\` does not parse: ${i?.path.join(".")}: ${i?.message}` };
  }
  const snap = parsed.data;
  if (snap.subscription !== s.id || snap.repository !== s.repository || snap.ref !== s.ref) {
    return {
      state: "mismatch",
      reason: `the snapshot of \`${s.id}\` is of ${snap.repository}@${snap.ref.slice(0, 12)}, the subscription pins ${s.repository}@${s.ref.slice(0, 12)} — re-subscribe`,
    };
  }
  if (createHash("sha256").update(snap.raw).digest("hex") !== snap.fixity.digest) {
    return { state: "mismatch", reason: `the snapshot of \`${s.id}\` does not match its digest — somebody else's bytes were edited in place` };
  }
  return { state: "read", snapshot: snap };
}

/** A harness's declaration, read out of the snapshot's upstream bytes. */
export type HarnessDeclaration = {
  name: string;
  title?: string;
  description?: string;
  directories: { id: string; path: string; graphTypologies: string[] }[];
  needs?: string[];
};

/** Read the harness `harness` out of a snapshot, or undefined when the bytes do not declare it. */
export function harnessDeclarationIn(snap: SubstrateSnapshot, harness: string): HarnessDeclaration | undefined {
  // A CONTENT Knowledge Graph (owner, 2026-10-06) contributes no harness to
  // any overlay, whatever its bytes say — asked of the kind, not inferred.
  if (subscriptionKindOf(snap) === "content") return undefined;
  if (!snap.summary.harnesses.includes(harness)) return undefined;
  const parsed = KnowledgeGraphDeclarationSchema.safeParse(JSON.parse(snap.raw));
  // `summary.harnesses` is derived from the root declaration's own name
  // (`harnessesOf`), so the root declaration IS the harness's.
  if (!parsed.success || parsed.data.name !== harness) return undefined;
  const d = parsed.data;
  return {
    name: d.name,
    ...(d.title !== undefined ? { title: d.title } : {}),
    ...(d.description !== undefined ? { description: d.description } : {}),
    directories: (d.directories ?? []).map((x) => ({ id: x.id, path: x.path, graphTypologies: x.graphTypologies.map(String) })),
    ...(d.needs !== undefined ? { needs: [...d.needs] } : {}),
  };
}

/** A chosen harness, and whether it is instantiated at the root. */
export interface SubscribedHarness {
  harness: string;
  subscriber: string;
  subscription: Subscription;
  instantiated: boolean;
  snapshot: SnapshotRead;
}

/**
 * Every harness some subscription in `decls` chose, with whether its config
 * sits at `root`. Reads only what it is handed and the snapshots, so the
 * navbar's caller does not rescan the tree.
 */
export function subscribedHarnesses(root: string, decls: readonly { dir: string; decl: CatHarnessDeclaration }[]): SubscribedHarness[] {
  const out: SubscribedHarness[] = [];
  for (const { dir, decl } of decls) {
    for (const s of decl.subscriptions ?? []) {
      const chosen = s.harnesses ?? [];
      if (!chosen.length) continue;
      const snapshot = readSnapshot(dir, decl, s);
      for (const h of chosen) {
        out.push({
          harness: h,
          subscriber: decl.name,
          subscription: s,
          instantiated: existsSync(join(root, instanceConfigFilename(h))),
          snapshot,
        });
      }
    }
  }
  return out;
}

/**
 * The navbar tile of an instantiated subscribed harness, drawn from its
 * snapshot. It has no local pages, so it links nowhere and opens no viewer;
 * its subgraphs are listed as referenced, and a snapshot that cannot be read
 * is drawn as a finding, never as an empty tile.
 */
export function subscribedTile(h: SubscribedHarness): HarnessTile {
  const own = hasAvatar(h.harness);
  const avatar = own ? avatarFor(h.harness) : GENERIC;
  const s = h.subscription;
  const pin = `${s.repository}@${s.ref.slice(0, 12)}`;
  const decl = h.snapshot.state === "read" ? harnessDeclarationIn(h.snapshot.snapshot, h.harness) : undefined;
  const findings: string[] = [];
  if (h.snapshot.state !== "read") findings.push(`${h.harness}: could not read its declaration — ${h.snapshot.reason}`);
  else if (!decl) findings.push(`${h.harness}: the snapshot of \`${s.id}\` does not declare it at the pin`);
  const kinds = [...new Set((decl?.directories ?? []).flatMap((d) => d.graphTypologies))];
  const title = decl?.title ?? h.harness;
  return {
    name: h.harness,
    title,
    label: title,
    description:
      `Subscribed from [\`${s.repository}\`](https://github.com/${s.repository}) at \`${s.ref.slice(0, 12)}\` by \`${h.subscriber}\`` +
      (decl?.description ? `. ${decl.description}` : "."),
    footer: false,
    icon: null,
    tone: avatar.tone,
    toneFrom: "avatar",
    reads: avatar.reads,
    genericAvatar: !own,
    instantiated: h.instantiated,
    ...(decl?.needs !== undefined ? { needs: decl.needs } : {}),
    stats: [
      { id: "directories", label: "declared directories", value: decl?.directories.length ?? 0 },
      { id: "kinds", label: "declared graph typologies", value: kinds.length },
      { id: "views", label: "visualisations you can open", value: 0 },
    ],
    visualisations: kinds.map((kind) => ({ kind, note: `referenced from ${pin}, not held here` })),
    // EVERY graph of a subscribed harness is REMOTE (`603s`): it lives in the
    // subscribed repository at the pin, and the subgraphs the subscription
    // names are the ones copied in — materialised, still remote in origin.
    subgraphs: (decl?.directories ?? []).map((d) => ({
      id: d.id,
      kinds: [...d.graphTypologies],
      where: "remote" as const,
      url: `https://github.com/${s.repository}/tree/${s.ref}/${d.path}`,
      via: "subscription" as const,
      ref: s.ref.slice(0, 7),
      ...((s.subgraphs ?? []).includes(d.id) ? { materialised: [d.id] } : {}),
    })),
    findings,
  };
}
