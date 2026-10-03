#!/usr/bin/env bun
/**
 * Emit every NAMED SUBGRAPH's pair of JSON-LD files — `index.jsonld` and
 * `index.hydrated.jsonld` — by framing kg-export's one in-memory graph.
 *
 * The contract is `skills/kg/kg-core/kg-export.md` §"Named subgraphs — one
 * IRI, two files, framed from one graph" (bean `c1m4`), and the schema both
 * files validate against is `schemas/subgraph-manifest.ts`.
 *
 * ## What is a subgraph here
 *
 * Every directory under each of this instance's declared knowledge-graph
 * directories (`kgDirectories(…, "instance")`: today `skills/`, `scenarios/`
 * and `processes/`), nested ones included — so `skills/` and `skills/sdlc/`
 * are both subgraphs, and the second is a child of the first. Above them is the
 * ROOT, the harness instance itself, whose IRI is `<BASE_URL>/subgraph/<HARNESS>/`.
 *
 * ## Membership is containment, and every node lands exactly once
 *
 * - A node with a source path inside a kg directory is a direct member of the
 *   DEEPEST subgraph directory containing it (a package's own directory, for a
 *   package node).
 * - A node with no path is a member of whatever subgraph its `partOf` parent
 *   is in — a ProcessNode is part of a diagram, not a file. The same rule
 *   `stampSubgraph` uses for `inSubgraph`, to a fixed point.
 * - Everything else — schemas, tools, roles, graph kinds, and nodes the export
 *   overlays from other instances — is a direct member of the ROOT.
 *
 * Transitive membership is not a second property. It is `hasMember` followed
 * through `hasSubgraph`, which is exactly what the hydrated file nests.
 *
 * A node this cannot place — a path inside a kg directory that is not on disk,
 * or a `partOf` naming a node the graph does not hold — goes in `problems`,
 * and the run exits 1 having written nothing: a partial set must not pass for
 * a whole one.
 *
 * ## One graph, two frames
 *
 * Both files come out of `jsonld.frame` over the SAME source nodes: the
 * index frame embeds nothing (`@embed: @never`) except each direct member's
 * pointer projection — `@id`, `@type` and label, under `@explicit`; the
 * hydrated frame embeds every member whole and every child subgraph whole
 * (`@embed: @always`), while every edge between KG nodes stays an IRI. The
 * root gets the index only: a deep hydrated file there is the whole graph in
 * one document, the monolith `f233` forbids.
 *
 * `@context` is the URL of `ns/subgraph/v1.jsonld`, which this script also
 * writes — kg-export's context without its keyword aliases (so the files say
 * `@id`, not `id`) plus the two subgraph terms. It is never inlined.
 *
 * ## Heavy bodies stay pointers
 *
 * The KG already carries a skill's body as `instructionsPath`, a diagram as
 * `sourcePath`, a schema as `module` — never the text. This script refuses a
 * literal over {@link HEAVY_LITERAL_BYTES} rather than trimming it, because a
 * body that has crept into the graph is a kg-export defect to fix there.
 *
 * Output is deterministic — no timestamps, no commit, keys and members
 * sorted — so `--check` can compare bytes.
 *
 * Usage:
 *   bun run cat-harness/scripts/gen-subgraph-jsonld.ts            # write
 *   bun run cat-harness/scripts/gen-subgraph-jsonld.ts --check    # verify
 *
 * Output: `docs/subgraph/<HARNESS>/<PATH>/index[.hydrated].jsonld` (served at
 * `<BASE_URL>/subgraph/…`, since `docs/` is the site root) and
 * `ns/subgraph/v1.jsonld` (copied to `<BASE_URL>/ns/subgraph/v1.jsonld` by the
 * docs workflows, beside `ns/content/v1.jsonld`).
 *
 * @module scripts/gen-subgraph-jsonld
 * @covers computed — the subgraphs are every directory under `kgDirectories(instance)`
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import jsonld from "jsonld";
import { buildContext, buildExport, graphKindId } from "./kg-export.js";
import { kgDirectories } from "./known-skills.js";
import { readDeclaration } from "../schemas/cat-harness.js";
import { propertyIri, termIri } from "../schemas/namespaces.js";
import {
  SUBGRAPH_HYDRATED_FILE,
  SUBGRAPH_INDEX_FILE,
  SubgraphHydratedSchema,
  SubgraphIndexSchema,
} from "../schemas/subgraph-manifest.js";

const ROOT = resolve(import.meta.dir, "..");

/** Where the context is written, relative to the instance root. */
export const SUBGRAPH_CONTEXT_PATH = "ns/subgraph/v1.jsonld";
/** Where the subgraph tree is written, relative to the instance root — the docs site root. */
export const SUBGRAPH_OUT_DIR = "docs/subgraph";

/** A literal larger than this is a body, not KG metadata. */
export const HEAVY_LITERAL_BYTES = 16 * 1024;

type Node = { "@id": string; "@type": string | string[]; [k: string]: unknown };

/** The context every subgraph file names by URL. */
export function subgraphContext(): Record<string, unknown> {
  const base = buildContext();
  const ctx: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(base)) {
    // Keyword aliases (`id` → `@id`) are dropped: compaction would otherwise
    // write `"id"` where the contract says the root `@id` is the directory IRI.
    if (typeof v === "string" && v.startsWith("@") && !k.startsWith("@")) continue;
    ctx[k] = v;
  }
  // A set, so a subgraph of one kind still carries an array — the shape a
  // consumer reads should not depend on how many kinds a directory holds.
  if (typeof ctx.holdsGraph === "object" && ctx.holdsGraph !== null) {
    ctx.holdsGraph = { ...(ctx.holdsGraph as Record<string, unknown>), "@container": "@set" };
  }
  ctx.hasMember = { "@id": propertyIri("hasMember"), "@type": "@id", "@container": "@set" };
  ctx.hasSubgraph = { "@id": propertyIri("hasSubgraph"), "@type": "@id", "@container": "@set" };
  return ctx;
}

/**
 * Every term the context declares as a link, other than the two this script
 * frames — ONE term per predicate IRI.
 *
 * `partOf` and `inSubgraph` are both `dcterms:isPartOf`, so naming both in a
 * frame expands to two subframes for one property, which `jsonld.frame`
 * rejects. The first term in sort order stands for the predicate.
 */
function linkTerms(ctx: Record<string, unknown>): string[] {
  const expand = (iri: string): string => {
    const i = iri.indexOf(":");
    const prefix = i > 0 ? ctx[iri.slice(0, i)] : undefined;
    return typeof prefix === "string" && !iri.slice(i + 1).startsWith("//") ? prefix + iri.slice(i + 1) : iri;
  };
  const byIri = new Map<string, string>();
  for (const [k, v] of Object.entries(ctx).sort(([a], [b]) => a.localeCompare(b))) {
    if (k === "hasMember" || k === "hasSubgraph") continue;
    if (typeof v !== "object" || v === null) continue;
    const def = v as Record<string, unknown>;
    if (def["@type"] !== "@id" && def["@type"] !== "@vocab") continue;
    const iri = expand(String(def["@id"] ?? k));
    if (!byIri.has(iri)) byIri.set(iri, k);
  }
  return [...byIri.values()].sort();
}

export interface SubgraphEntry {
  iri: string;
  /** Instance-relative directory with a trailing `/`; `""` for the root. */
  rel: string;
  kinds: string[];
  title?: string;
  members: string[];
  children: string[];
}

export interface SubgraphPlan {
  rootIri: string;
  contextUrl: string;
  subgraphs: Map<string, SubgraphEntry>;
  nodes: Map<string, Node>;
  problems: string[];
}

const PATH_KEYS = ["instructionsPath", "module", "sourcePath", "path"] as const;

function pathOf(n: Node): string | undefined {
  for (const k of PATH_KEYS) {
    const v = n[k];
    if (typeof v === "string" && v.length > 0) return v.replace(/\\/g, "/").replace(/\/$/, "");
  }
  return undefined;
}

function walkDirs(abs: string, rel: string, out: string[]): void {
  out.push(rel);
  for (const e of readdirSync(abs, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!e.isDirectory() || e.name.startsWith(".") || e.name === "node_modules") continue;
    walkDirs(join(abs, e.name), `${rel}${e.name}/`, out);
  }
}

/** Decide every subgraph and every node's place in one of them. Pure over `graph`. */
export function planSubgraphs(
  graph: Node[],
  opts: { root: string; harness: string; baseUrl: string; title?: string },
): SubgraphPlan {
  const base = opts.baseUrl.replace(/\/+$/, "");
  const rootIri = `${base}/subgraph/${opts.harness}/`;
  const problems: string[] = [];
  const subgraphs = new Map<string, SubgraphEntry>();
  const byRel = new Map<string, SubgraphEntry>();
  const root: SubgraphEntry = { iri: rootIri, rel: "", kinds: [], title: opts.title, members: [], children: [] };
  subgraphs.set(rootIri, root);
  byRel.set("", root);

  const kgDirs = kgDirectories(opts.root, "instance");
  const kgRels: string[] = [];
  for (const d of kgDirs) {
    const top = relative(opts.root, d.absPath).replace(/\\/g, "/").replace(/\/?$/, "/");
    if (top.startsWith("../")) continue; // another instance's directory — not this harness's subgraph
    kgRels.push(top);
    const rels: string[] = [];
    walkDirs(d.absPath, top, rels);
    for (const rel of rels) {
      const parentRel = rel === top ? "" : rel.replace(/[^/]+\/$/, "");
      const e: SubgraphEntry = {
        iri: `${rootIri}${rel}`,
        rel,
        kinds: [...d.graphKinds].sort(),
        title: rel === top ? (d as { title?: string }).title : undefined,
        members: [],
        children: [],
      };
      subgraphs.set(e.iri, e);
      byRel.set(rel, e);
      const parent = byRel.get(parentRel);
      if (parent) parent.children.push(e.iri);
      else problems.push(`subgraph ${rel}: parent ${parentRel || "(root)"} was not walked`);
    }
  }
  root.kinds = [...new Set(kgDirs.flatMap((d) => d.graphKinds))].sort();

  const nodes = new Map<string, Node>();
  for (const n of graph) nodes.set(String(n["@id"]), n);

  // Place by path.
  const placed = new Map<string, SubgraphEntry>();
  for (const n of graph) {
    const id = String(n["@id"]);
    const p = pathOf(n);
    if (p === undefined) continue;
    const top = kgRels.find((r) => `${p}/`.startsWith(r));
    if (top === undefined) { placed.set(id, root); continue; }
    const abs = join(opts.root, p);
    if (!existsSync(abs)) { problems.push(`${id}: source path ${p} is inside ${top} but not on disk`); continue; }
    let dir = statSync(abs).isDirectory() ? `${p}/` : `${dirname(p)}/`;
    while (!byRel.has(dir) && dir.length > top.length) dir = dir.replace(/[^/]+\/$/, "");
    const e = byRel.get(dir);
    if (e === undefined) { problems.push(`${id}: no walked subgraph contains ${p}`); continue; }
    placed.set(id, e);
  }

  // Inherit through `partOf`, to a fixed point; pathless and parentless → root.
  for (;;) {
    let moved = 0;
    for (const n of graph) {
      const id = String(n["@id"]);
      if (placed.has(id) || pathOf(n) !== undefined) continue;
      const parent = Array.isArray(n.partOf) ? n.partOf[0] : n.partOf;
      if (typeof parent !== "string") { placed.set(id, root); moved += 1; continue; }
      if (!nodes.has(parent)) continue;
      const e = placed.get(parent);
      if (e) { placed.set(id, e); moved += 1; }
    }
    if (moved === 0) break;
  }
  for (const n of graph) {
    const id = String(n["@id"]);
    if (placed.has(id) || pathOf(n) !== undefined) continue;
    const parent = Array.isArray(n.partOf) ? n.partOf[0] : n.partOf;
    problems.push(`${id}: partOf ${String(parent)} ${nodes.has(String(parent)) ? "could not be placed" : "is not in the graph"}`);
  }

  for (const [id, e] of placed) e.members.push(id);
  for (const e of subgraphs.values()) { e.members.sort(); e.children.sort(); }

  // Heavy bodies: refused, never trimmed.
  for (const n of graph) {
    for (const [k, v] of Object.entries(n)) {
      if (k.startsWith("@")) continue;
      const size = Buffer.byteLength(JSON.stringify(v) ?? "", "utf8");
      if (size > HEAVY_LITERAL_BYTES) problems.push(`${n["@id"]}: ${k} is ${size} bytes — a body, not KG metadata; keep it as a pointer`);
    }
  }

  return { rootIri, contextUrl: `${base}/${SUBGRAPH_CONTEXT_PATH}`, subgraphs, nodes, problems };
}

function subgraphNode(e: SubgraphEntry, harness: string): Node {
  return {
    "@id": e.iri,
    "@type": termIri("Subgraph"),
    name: e.rel === "" ? harness : e.rel.replace(/\/$/, ""),
    path: e.rel === "" ? "./" : e.rel,
    ...(e.title ? { title: e.title } : {}),
    ...(e.kinds.length > 0 ? { holdsGraph: e.kinds.map(graphKindId) } : {}),
    ...(e.members.length > 0 ? { hasMember: e.members } : {}),
    ...(e.children.length > 0 ? { hasSubgraph: e.children } : {}),
  };
}

function descendants(plan: SubgraphPlan, e: SubgraphEntry): SubgraphEntry[] {
  const out = [e];
  for (const c of e.children) out.push(...descendants(plan, plan.subgraphs.get(c)!));
  return out;
}

function depth(plan: SubgraphPlan, e: SubgraphEntry): number {
  return e.children.length === 0 ? 0 : 1 + Math.max(...e.children.map((c) => depth(plan, plan.subgraphs.get(c)!)));
}

/** Keys sorted at every level, except inside `@json` literals' own arrays. */
function canonical(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(canonical);
  if (v !== null && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return Object.fromEntries(Object.keys(o).sort().map((k) => [k, canonical(o[k])]));
  }
  return v;
}

const NULL_LOADER = async (url: string): Promise<never> => {
  throw new Error(`gen-subgraph-jsonld: refusing to fetch ${url} — every context is inline at build time`);
};

/** Render every file: instance-relative output path → bytes. */
export async function renderSubgraphFiles(
  plan: SubgraphPlan,
  harness: string,
): Promise<Map<string, string>> {
  const ctx = subgraphContext();
  const links = linkTerms(ctx);
  const never = Object.fromEntries(links.map((t) => [t, { "@embed": "@never", "@omitDefault": true }]));
  const memberWhole = { "@type": {}, "@embed": "@always", "@omitDefault": true, ...never };
  const pointer = { "@type": {}, "@embed": "@always", "@explicit": true, "@omitDefault": true, name: {}, title: {} };
  const subgraphFrame = (d: number): Record<string, unknown> => ({
    "@type": {},
    "@embed": "@always",
    "@omitDefault": true,
    ...never,
    hasMember: memberWhole,
    hasSubgraph: d > 0 ? subgraphFrame(d - 1) : { "@embed": "@never" },
  });

  const out = new Map<string, string>();
  const finish = (framed: Record<string, unknown>): string => {
    const { "@context": _inline, ...body } = framed;
    return `${JSON.stringify(canonical({ "@context": plan.contextUrl, ...body }), null, 2)}\n`;
  };

  for (const e of [...plan.subgraphs.values()].sort((a, b) => a.iri.localeCompare(b.iri))) {
    const dir = join(SUBGRAPH_OUT_DIR, harness, e.rel);
    const subtree = descendants(plan, e);
    const input = {
      "@context": ctx,
      "@graph": [
        ...subtree.map((s) => subgraphNode(s, harness)),
        ...subtree.flatMap((s) => s.members.map((m) => plan.nodes.get(m)!)),
      ],
    };
    const opts = { documentLoader: NULL_LOADER, embed: "@never", omitDefault: true, omitGraph: true } as unknown as jsonld.Options.Frame;

    const index = (await jsonld.frame(
      input as never,
      { "@context": ctx, "@id": e.iri, "@embed": "@never", hasMember: pointer } as never,
      opts,
    )) as Record<string, unknown>;
    const indexText = finish(index);
    const parsedIndex = SubgraphIndexSchema.safeParse(JSON.parse(indexText));
    if (!parsedIndex.success) plan.problems.push(`${e.iri}${SUBGRAPH_INDEX_FILE}: ${parsedIndex.error.message}`);
    out.set(join(dir, SUBGRAPH_INDEX_FILE), indexText);

    if (e.rel === "") continue; // the root has no hydrated file — no monolith
    const hydrated = (await jsonld.frame(
      input as never,
      {
        "@context": ctx,
        "@id": e.iri,
        "@embed": "@never",
        "@omitDefault": true,
        hasMember: memberWhole,
        hasSubgraph: depth(plan, e) > 0 ? subgraphFrame(depth(plan, e) - 1) : { "@embed": "@never" },
      } as never,
      opts,
    )) as Record<string, unknown>;
    const hydratedText = finish(hydrated);
    const parsedHydrated = SubgraphHydratedSchema.safeParse(JSON.parse(hydratedText));
    if (!parsedHydrated.success) plan.problems.push(`${e.iri}${SUBGRAPH_HYDRATED_FILE}: ${parsedHydrated.error.message}`);
    out.set(join(dir, SUBGRAPH_HYDRATED_FILE), hydratedText);
  }

  // A child IRI with no file of its own is a dangling link — reported, never skipped.
  for (const e of plan.subgraphs.values()) {
    for (const c of e.children) {
      const child = plan.subgraphs.get(c);
      if (!child || !out.has(join(SUBGRAPH_OUT_DIR, harness, child.rel, SUBGRAPH_INDEX_FILE))) {
        plan.problems.push(`${e.iri}: child ${c} has no ${SUBGRAPH_INDEX_FILE}`);
      }
    }
  }

  out.set(SUBGRAPH_CONTEXT_PATH, `${JSON.stringify({ "@context": canonical(ctx) }, null, 2)}\n`);
  return out;
}

/** Build the plan and the files for an instance from kg-export's in-memory graph. */
export async function generateSubgraphs(
  opts: { root?: string; baseUrl?: string } = {},
): Promise<{ plan: SubgraphPlan; files: Map<string, string>; harness: string }> {
  const root = opts.root ?? ROOT;
  const decl = readDeclaration(root);
  if (!decl) throw new Error(`gen-subgraph-jsonld: no declaration under ${root}`);
  const baseUrl = opts.baseUrl ?? decl.canonicalUrl;
  if (!baseUrl) throw new Error(`gen-subgraph-jsonld: ${decl.name} declares no canonicalUrl and no --base-url was given`);
  const data = await buildExport({ instanceRoot: root });
  const plan = planSubgraphs(data["@graph"] as Node[], {
    root,
    harness: decl.name,
    baseUrl,
    title: decl.title,
  });
  for (const p of data.problems) plan.problems.push(`kg-export: ${p}`);
  const files = await renderSubgraphFiles(plan, decl.name);
  return { plan, files, harness: decl.name };
}

function listFiles(abs: string): string[] {
  if (!existsSync(abs)) return [];
  const out: string[] = [];
  for (const e of readdirSync(abs, { withFileTypes: true })) {
    const p = join(abs, e.name);
    if (e.isDirectory()) out.push(...listFiles(p));
    else out.push(p);
  }
  return out;
}

async function main(): Promise<number> {
  const check = process.argv.includes("--check");
  const { plan, files, harness } = await generateSubgraphs();

  if (plan.problems.length > 0) {
    console.error(`gen-subgraph-jsonld: ${plan.problems.length} problem(s) — nothing written:`);
    for (const p of plan.problems) console.error(`  ✗ ${p}`);
    return 1;
  }

  const treeAbs = join(ROOT, SUBGRAPH_OUT_DIR, harness);
  const expected = new Set([...files.keys()].map((p) => join(ROOT, p)));
  const strays = listFiles(treeAbs).filter((p) => !expected.has(p)).sort();
  let bytes = 0;
  for (const t of files.values()) bytes += Buffer.byteLength(t, "utf8");

  if (check) {
    const stale = [...files].filter(([p, t]) => {
      const abs = join(ROOT, p);
      return !existsSync(abs) || readFileSync(abs, "utf-8") !== t;
    }).map(([p]) => p).sort();
    if (stale.length === 0 && strays.length === 0) {
      console.log(`gen-subgraph-jsonld --check: ${files.size} file(s), ${bytes} bytes, ${plan.subgraphs.size} subgraph(s) — up to date.`);
      return 0;
    }
    for (const p of stale) console.error(`  stale or missing: ${p}`);
    for (const p of strays) console.error(`  not generated:    ${relative(ROOT, p)}`);
    console.error("Run: bun run subgraph:jsonld");
    return 1;
  }

  for (const p of strays) rmSync(p);
  for (const [p, t] of files) {
    const abs = join(ROOT, p);
    mkdirSync(dirname(abs), { recursive: true });
    if (!existsSync(abs) || readFileSync(abs, "utf-8") !== t) writeFileSync(abs, t);
  }
  console.log(`gen-subgraph-jsonld: ${files.size} file(s), ${bytes} bytes, ${plan.subgraphs.size} subgraph(s)` +
    (strays.length > 0 ? `, ${strays.length} stale file(s) removed` : ""));
  return 0;
}

if (import.meta.main) process.exit(await main());
