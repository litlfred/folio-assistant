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
 * - A node of an instance stacked on this one lands in that instance's own
 *   tree, `<BASE_URL>/subgraph/<ITS NAME>/…`, by the same containment rule
 *   over its declared directories (bean `ax6r`) — a path outside them falls
 *   to that instance's root.
 * - Everything else — schemas, tools, roles, graph typologies — is a direct member
 *   of its own harness's ROOT.
 *
 * ## Each instance is framed from its OWN export (bean `4ak5` item 2)
 *
 * Since the split, `cat-harness.jsonld` holds cat-harness's directories only,
 * so a stacked instance's nodes are read from that instance's export, under
 * the `@id`s its published document gives them — never under
 * `cat-harness.jsonld#…` fragments, which are tombstones now and are not
 * framed. Which instances are framed is {@link framedInstances}: the corpus
 * this instance's checkout scope reaches, as before. A node's paths are
 * relative to the instance that exported it, so the plan is told which one
 * (`rootOf`).
 *
 * Above every root is the REPOSITORY's index, `<BASE_URL>/subgraph/`, whose
 * `hasSubgraph` are the roots framed here. `bootstrap` and `bootstrap-tools`
 * are not among them: they sit below this instance and publish through their
 * own graph (`pve3`). Their own repository indexes are linked from it with
 * `rdfs:seeAlso` (bean `t8c4`) — a link a reader may follow, never membership.
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
 * ## Heavy bodies stay pointers — and the pointer now resolves (bean `f233`)
 *
 * The KG already carries a skill's body as `instructionsPath`, a diagram as
 * `sourcePath`, a schema as `module` — never the text. This script refuses a
 * literal over {@link HEAVY_LITERAL_BYTES} rather than trimming it, because a
 * body that has crept into the graph is a kg-export defect to fix there.
 *
 * For the fields `HEAVY_POINTERS` names (`schemas/subgraph-manifest.ts`), the
 * TARGET is published as a PAYLOAD: one immutable file per distinct body at
 * `docs/payload/sha256/<hex>`, served at `<BASE_URL>/payload/sha256/<hex>`,
 * with its media type in `<hex>.json` beside it. The node carries a `payload`
 * link — `@id`, `sha256`, `bytes` — in both its index pointer and its hydrated
 * form. Identical bodies are one file. {@link auditPayloadTree} fails a payload
 * no node references, a node whose payload is missing, and bytes that do not
 * hash to their name; it runs on every write and under `--check`.
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

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, relative, resolve, sep } from "node:path";
import jsonld from "jsonld";
import { buildContext, buildExport, graphTypologyId } from "./kg-export.js";
import { corpusScopeFor, kgDirectories, workflowFiles } from "./known-skills.js";
import { checkoutRootFor, findInstanceRoot, instanceRootsIn, readDeclaration } from "../schemas/cat-harness.js";
import { readKnowledgeGraphDeclaration } from "../../bootstrap-tools/schemas/declaration.ts";
import { publicationBase } from "../../bootstrap-tools/scripts/subgraph-jsonld.ts";
import { gitCorpus } from "../schemas/git-corpus.js";
import { propertyIri, termIri } from "../schemas/namespaces.js";
import {
  HEAVY_POINTERS,
  PAYLOAD_MEDIA_TYPES,
  PAYLOAD_PATH,
  PAYLOAD_SIDECAR_SCHEMA,
  PAYLOAD_SIDECAR_SUFFIX,
  PayloadLinkSchema,
  PayloadSidecarSchema,
  type PayloadLink,
  SUBGRAPH_CONTEXT_PATH,
  SUBGRAPH_HYDRATED_FILE,
  SUBGRAPH_INDEX_FILE,
  SubgraphHydratedSchema,
  SubgraphIndexSchema,
} from "../schemas/subgraph-manifest.js";

const ROOT = resolve(import.meta.dir, "..");

export { SUBGRAPH_CONTEXT_PATH };
/**
 * Where the subgraph tree is written, relative to the instance root: the
 * `subgraph/` directory of the declared `docs` graph, which is the docs site
 * root — so a file there is served at `<BASE_URL>/subgraph/…`. Read from the
 * declaration by id rather than spelled, because the path is the unstable half.
 */
export function subgraphOutDir(root: string = ROOT): string {
  const docs = readDeclaration(root)?.directories.find((d) => d.id === "docs");
  if (!docs) throw new Error(`gen-subgraph-jsonld: ${root} declares no \`docs\` directory to serve subgraphs from`);
  return join(docs.path, "subgraph");
}

/** Where payloads are written, relative to the instance root: `<docs>/payload/sha256`. */
export function payloadOutDir(root: string = ROOT): string {
  return join(dirname(subgraphOutDir(root)), PAYLOAD_PATH);
}

/** One distinct payload: its bytes, its declared type, and every node linking to it. */
export interface PayloadEntry {
  sha256: string;
  bytes: Buffer;
  mediaType: string;
  referencedBy: string[];
}

export interface PayloadPlan {
  /** By hex digest — so identical bodies are ONE entry. */
  payloads: Map<string, PayloadEntry>;
  /** By node `@id`. */
  links: Map<string, PayloadLink>;
  problems: string[];
}

const sha256Hex = (b: Buffer | string): string => createHash("sha256").update(b).digest("hex");

/**
 * Decide every node's payload: for each node of a class `HEAVY_POINTERS`
 * names, read the file its pointer field names, hash it, and link it. Pure
 * over `graph` and the files under `root`; deterministic, since a name is a
 * digest and every list is sorted.
 */
export function planPayloads(graph: Node[], opts: { root: string; baseUrl: string }): PayloadPlan {
  const base = opts.baseUrl.replace(/\/+$/, "");
  const payloads = new Map<string, PayloadEntry>();
  const links = new Map<string, PayloadLink>();
  const problems: string[] = [];
  const heavy = HEAVY_POINTERS.map((h) => ({ type: termIri(h.type), field: h.field }));
  for (const n of graph) {
    const types = ([] as unknown[]).concat(n["@type"]).map(String);
    const h = heavy.find((x) => types.includes(x.type));
    if (!h) continue;
    const id = String(n["@id"]);
    const p = n[h.field];
    if (typeof p !== "string" || p.length === 0) continue;
    const abs = join(opts.root, p);
    if (!existsSync(abs) || !statSync(abs).isFile()) { problems.push(`${id}: ${h.field} ${p} is not a file — no payload`); continue; }
    const ext = extname(p).slice(1).toLowerCase();
    const mediaType = PAYLOAD_MEDIA_TYPES[ext];
    if (mediaType === undefined) { problems.push(`${id}: ${p} has no declared payload media type for .${ext}`); continue; }
    const bytes = readFileSync(abs);
    const hex = sha256Hex(bytes);
    const prior = payloads.get(hex);
    if (prior && prior.mediaType !== mediaType) {
      problems.push(`${id}: payload ${hex} is ${prior.mediaType} for ${prior.referencedBy[0]} but ${mediaType} here`);
      continue;
    }
    const e = prior ?? { sha256: hex, bytes, mediaType, referencedBy: [] };
    e.referencedBy.push(id);
    payloads.set(hex, e);
    links.set(id, { "@id": `${base}/${PAYLOAD_PATH}/${hex}`, sha256: hex, bytes: bytes.length });
  }
  for (const e of payloads.values()) e.referencedBy.sort();
  return { payloads, links, problems };
}

/**
 * Several instances' payload plans as one: a body two instances share is ONE
 * payload, referenced from both — the same rule {@link planPayloads} applies
 * inside one graph, and the same refusal when the media types disagree.
 */
export function mergePayloadPlans(plans: readonly PayloadPlan[]): PayloadPlan {
  const payloads = new Map<string, PayloadEntry>();
  const links = new Map<string, PayloadLink>();
  const problems: string[] = [];
  for (const pp of plans) {
    problems.push(...pp.problems);
    for (const [id, link] of pp.links) links.set(id, link);
    for (const [hex, e] of pp.payloads) {
      const prior = payloads.get(hex);
      if (prior === undefined) { payloads.set(hex, { ...e, referencedBy: [...e.referencedBy] }); continue; }
      if (prior.mediaType !== e.mediaType) {
        problems.push(`payload ${hex} is ${prior.mediaType} for ${prior.referencedBy[0]} but ${e.mediaType} for ${e.referencedBy[0]}`);
        continue;
      }
      prior.referencedBy.push(...e.referencedBy);
    }
  }
  for (const e of payloads.values()) e.referencedBy.sort();
  return { payloads, links, problems };
}

/** A sidecar's bytes — canonical, so a re-run writes the same file. */
export function payloadSidecar(e: PayloadEntry): string {
  return `${JSON.stringify({ $schema: PAYLOAD_SIDECAR_SCHEMA, bytes: e.bytes.length, mediaType: e.mediaType, sha256: e.sha256 }, null, 2)}\n`;
}

/** Render every payload file: instance-relative path → bytes (the body, then its sidecar). */
export function renderPayloadFiles(pp: PayloadPlan, outDir: string): Map<string, Buffer | string> {
  const out = new Map<string, Buffer | string>();
  for (const hex of [...pp.payloads.keys()].sort()) {
    const e = pp.payloads.get(hex)!;
    out.set(join(outDir, hex), e.bytes);
    out.set(join(outDir, `${hex}${PAYLOAD_SIDECAR_SUFFIX}`), payloadSidecar(e));
  }
  return out;
}

/**
 * The orphan check, BOTH ways, over a payload directory as it is on disk:
 *
 * - a node whose link names a payload that is not there, or whose `bytes`
 *   disagree with the file;
 * - a payload file no node links to — an orphan;
 * - a payload whose bytes do not hash to its name — it is not what it says;
 * - a payload without its sidecar, a sidecar without its payload, a sidecar
 *   that disagrees with it, and any file that is neither.
 *
 * Returns problems; an empty list is a clean tree. `links` is every node's
 * link (node `@id` → link).
 */
export function auditPayloadTree(dirAbs: string, links: ReadonlyMap<string, PayloadLink>): string[] {
  const problems: string[] = [];
  const names = existsSync(dirAbs) ? readdirSync(dirAbs).sort() : [];
  const present = new Set(names);
  const referenced = new Map<string, string[]>();
  for (const [id, link] of [...links].sort(([a], [b]) => a.localeCompare(b))) {
    const parsed = PayloadLinkSchema.safeParse(link);
    if (!parsed.success) { problems.push(`${id}: malformed payload link — ${parsed.error.message}`); continue; }
    (referenced.get(link.sha256) ?? referenced.set(link.sha256, []).get(link.sha256)!).push(id);
    if (!present.has(link.sha256)) { problems.push(`${id}: references payload ${link.sha256}, which is missing`); continue; }
    const size = statSync(join(dirAbs, link.sha256)).size;
    if (size !== link.bytes) problems.push(`${id}: payload ${link.sha256} is ${size} bytes, the link says ${link.bytes}`);
  }
  for (const name of names) {
    const abs = join(dirAbs, name);
    if (/^[0-9a-f]{64}$/.test(name)) {
      if (!referenced.has(name)) problems.push(`orphan payload ${name}: no node references it`);
      const bytes = readFileSync(abs);
      if (sha256Hex(bytes) !== name) problems.push(`payload ${name}: its bytes hash to ${sha256Hex(bytes)}, not to its name`);
      if (!present.has(`${name}${PAYLOAD_SIDECAR_SUFFIX}`)) { problems.push(`payload ${name}: no ${PAYLOAD_SIDECAR_SUFFIX} sidecar`); continue; }
      let sidecar: unknown;
      try { sidecar = JSON.parse(readFileSync(`${abs}${PAYLOAD_SIDECAR_SUFFIX}`, "utf-8")); } catch (e) {
        problems.push(`payload ${name}: sidecar is not JSON — ${(e as Error).message}`); continue;
      }
      const s = PayloadSidecarSchema.safeParse(sidecar);
      if (!s.success) problems.push(`payload ${name}: sidecar fails ${PAYLOAD_SIDECAR_SCHEMA} — ${s.error.message}`);
      else if (s.data.sha256 !== name || s.data.bytes !== bytes.length) problems.push(`payload ${name}: sidecar disagrees with the bytes`);
    } else if (name.endsWith(PAYLOAD_SIDECAR_SUFFIX) && /^[0-9a-f]{64}$/.test(name.slice(0, -PAYLOAD_SIDECAR_SUFFIX.length))) {
      if (!present.has(name.slice(0, -PAYLOAD_SIDECAR_SUFFIX.length))) problems.push(`orphan sidecar ${name}: its payload is missing`);
    } else {
      problems.push(`${name}: not a payload or a payload sidecar`);
    }
  }
  return problems;
}

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
  ctx.seeAlso = { "@id": "http://www.w3.org/2000/01/rdf-schema#seeAlso", "@type": "@id", "@container": "@set" };
  // Not `@type: @id`: the value is a node object — the payload's IRI plus its
  // digest and size — so a consumer can verify a fetch without a second one.
  ctx.payload = { "@id": propertyIri("payload") };
  ctx.sha256 = { "@id": propertyIri("sha256") };
  ctx.bytes = { "@id": propertyIri("bytes") };
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
  /** Name of the instance whose tree this subgraph is in — `<HARNESS>` in its IRI. */
  harness: string;
  /** Instance-relative directory with a trailing `/`; `""` for the root. */
  rel: string;
  kinds: string[];
  title?: string;
  members: string[];
  children: string[];
}

export interface SubgraphPlan {
  rootIri: string;
  /**
   * `<BASE_URL>/subgraph/` — the REPOSITORY's level, above every harness root
   * this build frames. Index only, and its children are those roots.
   */
  repoIri: string;
  /** The repository's name, the label of {@link repoIri}. */
  repoName: string;
  /** Every harness root this build frames: this instance's first, then each overlaid one by name. */
  harnessRoots: string[];
  /**
   * The repository indexes of instances in this checkout that declare
   * diagrams this build does not frame — bootstrap's, published by
   * bootstrap-tools at its own site (bean `t8c4`). Written as `seeAlso`.
   */
  seeAlso: string[];
  contextUrl: string;
  subgraphs: Map<string, SubgraphEntry>;
  nodes: Map<string, Node>;
  problems: string[];
}

/**
 * The instances this build frames, this one first: every instance whose
 * knowledge-graph directories the checkout scope reaches from `root` — the
 * corpus `kg-export` read in one document before the split, and each now read
 * from its own. `check:process-index` asks the same function, so the gate and
 * the generator cannot disagree about which diagrams are covered.
 */
export function framedInstances(root: string = ROOT): string[] {
  const own = resolve(root);
  const out = new Set<string>();
  for (const d of kgDirectories(root, corpusScopeFor(root))) {
    const inst = findInstanceRoot(d.absPath);
    if (inst !== undefined && resolve(inst) !== own) out.add(resolve(inst));
  }
  return [own, ...[...out].sort()];
}

const PATH_KEYS = ["instructionsPath", "module", "sourcePath", "path"] as const;

function pathOf(n: Node): string | undefined {
  for (const k of PATH_KEYS) {
    const v = n[k];
    if (typeof v === "string" && v.length > 0) return v.replace(/\\/g, "/").replace(/\/$/, "");
  }
  return undefined;
}

/**
 * The directories under `abs` that git accounts for — every directory holding
 * a tracked or unignored file, and each of its ancestors — as `rel`-prefixed,
 * `/`-terminated paths in sorted order (parents before children).
 *
 * Asked of git, never of the disk (`schemas/git-corpus.ts`): a walk would mint
 * a subgraph for one machine's ignored residue, and the committed output would
 * then differ by checkout. `undefined` when git cannot answer.
 */
function gitDirs(abs: string, rel: string): string[] | undefined {
  const files = gitCorpus(abs);
  if (files === undefined) return undefined;
  const out = new Set<string>([rel]);
  for (const f of files) {
    const parts = relative(abs, f).split(sep).slice(0, -1);
    if (parts.some((x) => x.startsWith(".") || x === "node_modules")) continue;
    for (let i = 1; i <= parts.length; i++) out.add(`${rel}${parts.slice(0, i).join("/")}/`);
  }
  return [...out].sort();
}

/** Decide every subgraph and every node's place in one of them. Pure over `graph`. */
export function planSubgraphs(
  graph: Node[],
  opts: {
    root: string;
    harness: string;
    baseUrl: string;
    title?: string;
    /**
     * The instance root a node was EXPORTED from, by `@id` — what its paths
     * are relative to, and whose harness root a node with no path and no
     * parent falls to. Absent → `root`, which is every node of a one-instance
     * graph.
     */
    rootOf?: ReadonlyMap<string, string>;
  },
): SubgraphPlan {
  const base = opts.baseUrl.replace(/\/+$/, "");
  const rootIri = `${base}/subgraph/${opts.harness}/`;
  const problems: string[] = [];
  const subgraphs = new Map<string, SubgraphEntry>();
  /** Absolute directory (trailing separator) → its subgraph. */
  const byDir = new Map<string, SubgraphEntry>();
  const slash = (abs: string): string => (abs.endsWith(sep) ? abs : abs + sep);
  const ownRoot = resolve(opts.root);
  const root: SubgraphEntry = { iri: rootIri, harness: opts.harness, rel: "", kinds: [], title: opts.title, members: [], children: [] };
  subgraphs.set(rootIri, root);
  /** Instance root (absolute) → that instance's root subgraph. */
  const harnessRoots = new Map<string, SubgraphEntry>([[ownRoot, root]]);

  // WHICH DIRECTORIES — the same corpus kg-export read, not this instance's
  // alone. kg-export overlays every instance the checkout stacks on this one
  // (`corpusScopeFor`), so its graph holds `folio-assistant-core`'s processes
  // and skills too, and until bean `ax6r` every one of them fell to the ROOT,
  // which has no hydrated file: "every process of this graph" was not one
  // fetch, nor any number of them. An overlaid instance's directory now
  // heads its OWN tree, `<BASE_URL>/subgraph/<ITS NAME>/`, because a
  // subgraph is a directory of the instance that declares it — and this
  // build frames it because this is the graph that publishes those nodes.
  //
  // `bootstrap` and `bootstrap-tools` are NOT in that corpus: they sit BELOW
  // this instance, and the owner's `pve3` ruling (2026-09-21) keeps their
  // processes out of this graph (#432's isolation). So no tree is framed for
  // them here, and none is invented.
  //
  // `kgDirectories` answers WHERE; each instance's own declaration answers
  // what kind and what title, looked up by the entry's id — ids are stable,
  // paths are not, and two instances may reuse an id.
  const declOf = new Map<string, ReturnType<typeof readDeclaration>>();
  const declarationOf = (inst: string): ReturnType<typeof readDeclaration> => {
    if (!declOf.has(inst)) {
      try {
        declOf.set(inst, readDeclaration(inst));
      } catch {
        declOf.set(inst, undefined);
      }
    }
    return declOf.get(inst);
  };
  const kgDirs = kgDirectories(opts.root, corpusScopeFor(opts.root)).flatMap((d) => {
    const inst = findInstanceRoot(d.absPath);
    if (inst === undefined) {
      problems.push(`${d.absPath}: no instance declaration above this knowledge-graph directory`);
      return [];
    }
    const decl = declarationOf(inst);
    const entry = decl?.directories.find((x) => x.id === d.id);
    return [{ ...d, inst: resolve(inst), harness: decl?.name ?? basename(inst), graphTypologies: entry?.graphTypologies ?? [], title: entry?.title, instTitle: decl?.title }];
  });
  // De-duplicated by directory: one directory reached twice is one subgraph.
  const seenDir = new Set<string>();
  const kgTops: Array<{ abs: string; entry: SubgraphEntry }> = [];
  for (const d of kgDirs) {
    const abs = slash(resolve(d.absPath));
    if (seenDir.has(abs)) continue;
    seenDir.add(abs);
    let hroot = harnessRoots.get(d.inst);
    if (hroot === undefined) {
      hroot = { iri: `${base}/subgraph/${d.harness}/`, harness: d.harness, rel: "", kinds: [], title: d.instTitle, members: [], children: [] };
      if (subgraphs.has(hroot.iri)) {
        problems.push(`two instances are both named ${d.harness} — their subgraph roots would collide`);
        continue;
      }
      subgraphs.set(hroot.iri, hroot);
      harnessRoots.set(d.inst, hroot);
    }
    const top = relative(d.inst, d.absPath).replace(/\\/g, "/").replace(/\/?$/, "/");
    const rels = gitDirs(d.absPath, top);
    if (rels === undefined) { problems.push(`${d.harness}/${top}: git could not list its files — subgraphs not determined`); continue; }
    const kinds = [...d.graphTypologies].sort();
    hroot.kinds = [...new Set([...hroot.kinds, ...kinds])].sort();
    for (const rel of rels) {
      const parentRel = rel === top ? "" : rel.replace(/[^/]+\/$/, "");
      const e: SubgraphEntry = {
        iri: `${hroot.iri}${rel}`,
        harness: d.harness,
        rel,
        kinds,
        title: rel === top ? d.title : undefined,
        members: [],
        children: [],
      };
      subgraphs.set(e.iri, e);
      byDir.set(slash(join(d.inst, rel)), e);
      const parent = parentRel === "" ? hroot : byDir.get(slash(join(d.inst, parentRel)));
      if (parent) parent.children.push(e.iri);
      else problems.push(`subgraph ${d.harness}/${rel}: parent ${parentRel || "(root)"} was not walked`);
    }
    kgTops.push({ abs, entry: byDir.get(abs)! });
  }
  // Deepest first, so a nested top-level directory wins over its ancestor.
  kgTops.sort((a, b) => b.abs.length - a.abs.length);

  const nodes = new Map<string, Node>();
  for (const n of graph) nodes.set(String(n["@id"]), n);

  /** The harness root a path outside every kg directory falls to: its own instance's tree, else this one's. */
  const rootFor = (abs: string): SubgraphEntry => {
    const inst = findInstanceRoot(abs);
    return (inst !== undefined && harnessRoots.get(resolve(inst))) || root;
  };
  /** Where a node's paths are relative to: the instance that exported it. */
  const exportedFrom = (id: string): string => resolve(opts.rootOf?.get(id) ?? opts.root);
  /** A node with no path and no parent: its own instance's root. */
  const homeOf = (id: string): SubgraphEntry => harnessRoots.get(exportedFrom(id)) ?? root;

  // Place by path.
  const placed = new Map<string, SubgraphEntry>();
  for (const n of graph) {
    const id = String(n["@id"]);
    const p = pathOf(n);
    if (p === undefined) continue;
    const abs = resolve(exportedFrom(id), p);
    const top = kgTops.find((t) => slash(abs).startsWith(t.abs));
    if (top === undefined) { placed.set(id, rootFor(abs)); continue; }
    if (!existsSync(abs)) { problems.push(`${id}: source path ${p} is inside ${top.entry.harness}/${top.entry.rel} but not on disk`); continue; }
    let dir = statSync(abs).isDirectory() ? slash(abs) : slash(dirname(abs));
    while (!byDir.has(dir) && dir.length > top.abs.length) dir = slash(dirname(dir));
    const e = byDir.get(dir);
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
      if (typeof parent !== "string") { placed.set(id, homeOf(id)); moved += 1; continue; }
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

  // The REPOSITORY's level: the contract's "the repo KG is the level above"
  // a harness, given the one file a reader needs to find every harness root
  // this build frames. Index only — a hydrated file here would be the whole
  // graph in one document, the monolith `f233` forbids.
  const repoRoot = checkoutRootFor(opts.root); // not `dirname`: the root instance's is outside the checkout (g43f)
  let repoName = basename(repoRoot);
  try {
    repoName = readDeclaration(repoRoot)?.repository?.split("/").pop() ?? repoName;
  } catch {
    // An unreadable root declaration is `check:harness-dirs`'s finding; the directory still names it.
  }
  const roots = [root.iri, ...[...harnessRoots.values()].filter((e) => e !== root).map((e) => e.iri).sort()];
  return {
    rootIri,
    repoIri: `${base}/subgraph/`,
    repoName,
    harnessRoots: roots,
    seeAlso: unframedRepoIndexes(repoRoot, new Set(harnessRoots.keys())),
    contextUrl: `${base}/${SUBGRAPH_CONTEXT_PATH}`,
    subgraphs,
    nodes,
    problems,
  };
}

/**
 * Where an instance this build does not frame publishes its own subgraphs:
 * `<its publication base>subgraph/`, by the same rule bootstrap-tools
 * publishes with (`publicationBase`), so the address is derived from its
 * declaration and never written here. Only an instance that declares a
 * diagram is linked — the reader follows the link for processes, and a link
 * to a site with none would be a fetch for nothing.
 */
export function unframedRepoIndexes(repoRoot: string, framed: ReadonlySet<string>): string[] {
  const out = new Set<string>();
  for (const inst of instanceRootsIn(repoRoot)) {
    if (framed.has(resolve(inst))) continue;
    if (!workflowFiles(inst, "instance").some((f) => f.endsWith(".bpmn"))) continue;
    const base = publicationBase(readKnowledgeGraphDeclaration(inst));
    if (base) out.add(`${base}subgraph/`);
  }
  return [...out].sort();
}

function subgraphNode(e: SubgraphEntry): Node {
  return {
    "@id": e.iri,
    "@type": termIri("Subgraph"),
    name: e.rel === "" ? e.harness : e.rel.replace(/\/$/, ""),
    path: e.rel === "" ? "./" : e.rel,
    ...(e.title ? { title: e.title } : {}),
    ...(e.kinds.length > 0 ? { holdsGraph: e.kinds.map(graphTypologyId) } : {}),
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
  /** Kept for callers; each subgraph now carries its own harness (an overlaid instance's tree is not this one's). */
  _harness: string,
  outDir: string,
): Promise<Map<string, string>> {
  const ctx = subgraphContext();
  const links = linkTerms(ctx);
  const never = Object.fromEntries(links.map((t) => [t, { "@embed": "@never", "@omitDefault": true }]));
  // A payload link is embedded whole wherever its node appears — `@id`,
  // `sha256`, `bytes` — and never more: the body is behind the IRI.
  const payloadLink = { "@embed": "@always", "@omitDefault": true };
  const memberWhole = { "@type": {}, "@embed": "@always", "@omitDefault": true, ...never, payload: payloadLink };
  const pointer = {
    "@type": {}, "@embed": "@always", "@explicit": true, "@omitDefault": true, name: {}, title: {}, payload: payloadLink,
  };
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
    const dir = join(outDir, e.harness, e.rel);
    const subtree = descendants(plan, e);
    const input = {
      "@context": ctx,
      "@graph": [
        ...subtree.map((s) => subgraphNode(s)),
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
      if (!child || !out.has(join(outDir, child.harness, child.rel, SUBGRAPH_INDEX_FILE))) {
        plan.problems.push(`${e.iri}: child ${c} has no ${SUBGRAPH_INDEX_FILE}`);
      }
    }
  }

  // The repository's index: one pointer per harness root, nothing hydrated.
  {
    const repoNode: Node = {
      "@id": plan.repoIri,
      "@type": termIri("Subgraph"),
      name: plan.repoName,
      path: "./",
      hasSubgraph: plan.harnessRoots,
      ...(plan.seeAlso.length > 0 ? { seeAlso: plan.seeAlso } : {}),
    };
    const framed = (await jsonld.frame(
      { "@context": ctx, "@graph": [repoNode] } as never,
      { "@context": ctx, "@id": plan.repoIri, "@embed": "@never" } as never,
      { documentLoader: NULL_LOADER, embed: "@never", omitDefault: true, omitGraph: true } as unknown as jsonld.Options.Frame,
    )) as Record<string, unknown>;
    const text = finish(framed);
    const parsed = SubgraphIndexSchema.safeParse(JSON.parse(text));
    if (!parsed.success) plan.problems.push(`${plan.repoIri}${SUBGRAPH_INDEX_FILE}: ${parsed.error.message}`);
    for (const r of plan.harnessRoots) {
      if (!out.has(join(outDir, plan.subgraphs.get(r)!.harness, SUBGRAPH_INDEX_FILE))) plan.problems.push(`${plan.repoIri}: harness root ${r} has no ${SUBGRAPH_INDEX_FILE}`);
    }
    out.set(join(outDir, SUBGRAPH_INDEX_FILE), text);
  }

  out.set(SUBGRAPH_CONTEXT_PATH, `${JSON.stringify({ "@context": canonical(ctx) }, null, 2)}\n`);
  return out;
}

/** Build the plan and the files for an instance from kg-export's in-memory graph. */
export async function generateSubgraphs(
  opts: { root?: string; baseUrl?: string } = {},
): Promise<{
  plan: SubgraphPlan;
  files: Map<string, string>;
  harness: string;
  outDir: string;
  payloadPlan: PayloadPlan;
  payloadFiles: Map<string, Buffer | string>;
  payloadDir: string;
}> {
  const root = opts.root ?? ROOT;
  const decl = readDeclaration(root);
  if (!decl) throw new Error(`gen-subgraph-jsonld: no declaration under ${root}`);
  const baseUrl = opts.baseUrl ?? decl.canonicalUrl;
  if (!baseUrl) throw new Error(`gen-subgraph-jsonld: ${decl.name} declares no canonicalUrl and no --base-url was given`);
  // ONE EXPORT PER FRAMED INSTANCE, each in its own scope (bean `4ak5` item
  // 2): the host's is the published document, the others are the documents
  // `instance-exports.ts` publishes. No `baseUrl`, as before: the IRIs are
  // canonical whatever site this tree is built for. A tombstone is the host
  // document's forwarding address for a node framed here under its owner's
  // `@id`, so it is not framed itself. An `@id` two exports share (a graph
  // kind is a vocabulary IRI, not a document fragment) is placed once, from
  // the first — the host.
  const exported: Node[] = [];
  const rootOf = new Map<string, string>();
  const payloadPlans: PayloadPlan[] = [];
  const exportProblems: string[] = [];
  for (const inst of framedInstances(root)) {
    const data = await buildExport({ instanceRoot: inst, scope: "instance" });
    const name = readDeclaration(inst)?.name ?? basename(inst);
    for (const p of data.problems) exportProblems.push(`kg-export (${name}): ${p}`);
    const own = (data["@graph"] as Node[]).filter((n) => n.deprecated !== true && !rootOf.has(String(n["@id"])));
    for (const n of own) rootOf.set(String(n["@id"]), inst);
    exported.push(...own);
    // Payloads first, so every node carries its link into both frames — each
    // against the instance its paths are relative to.
    payloadPlans.push(planPayloads(own, { root: inst, baseUrl }));
  }
  const payloadPlan = mergePayloadPlans(payloadPlans);
  const graph = exported.map((n) => {
    const link = payloadPlan.links.get(String(n["@id"]));
    return link ? { ...n, payload: link } : n;
  });
  const plan = planSubgraphs(graph, {
    root,
    harness: decl.name,
    baseUrl,
    title: decl.title,
    rootOf,
  });
  plan.problems.push(...exportProblems);
  for (const p of payloadPlan.problems) plan.problems.push(`payload: ${p}`);
  const outDir = subgraphOutDir(root);
  const files = await renderSubgraphFiles(plan, decl.name, outDir);
  const payloadDir = payloadOutDir(root);
  const payloadFiles = renderPayloadFiles(payloadPlan, payloadDir);
  return { plan, files, harness: decl.name, outDir, payloadPlan, payloadFiles, payloadDir };
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
  const { plan, files, outDir, payloadPlan, payloadFiles, payloadDir } = await generateSubgraphs();

  if (plan.problems.length > 0) {
    console.error(`gen-subgraph-jsonld: ${plan.problems.length} problem(s) — nothing written:`);
    for (const p of plan.problems) console.error(`  ✗ ${p}`);
    return 1;
  }

  // The WHOLE subgraph directory, not this harness's tree alone: an overlaid
  // instance's tree is written here too, and one that stops being overlaid
  // must not leave its files behind looking current. Payloads (f233) live in
  // their own directory and are checked the same way.
  const all = new Map<string, Buffer | string>([...files, ...payloadFiles]);
  const treeAbs = join(ROOT, outDir);
  const payloadAbs = join(ROOT, payloadDir);
  const expected = new Set([...all.keys()].map((p) => join(ROOT, p)));
  const strays = [...listFiles(treeAbs), ...listFiles(payloadAbs)].filter((p) => !expected.has(p)).sort();
  const size = (files_: Map<string, Buffer | string>): number =>
    [...files_.values()].reduce((s, t) => s + (typeof t === "string" ? Buffer.byteLength(t, "utf8") : t.length), 0);
  const same = (abs: string, t: Buffer | string): boolean =>
    existsSync(abs) && readFileSync(abs).equals(typeof t === "string" ? Buffer.from(t, "utf8") : t);
  const summary =
    `${files.size} subgraph file(s), ${size(files)} bytes, ${plan.subgraphs.size} subgraph(s); ` +
    `${payloadPlan.payloads.size} payload(s) for ${payloadPlan.links.size} node(s), ${payloadFiles.size} file(s), ${size(payloadFiles)} bytes`;

  if (check) {
    const stale = [...all].filter(([p, t]) => !same(join(ROOT, p), t)).map(([p]) => p).sort();
    const audit = auditPayloadTree(payloadAbs, payloadPlan.links);
    if (stale.length === 0 && strays.length === 0 && audit.length === 0) {
      console.log(`gen-subgraph-jsonld --check: ${summary} — up to date.`);
      return 0;
    }
    for (const p of stale) console.error(`  stale or missing: ${p}`);
    for (const p of strays) console.error(`  not generated:    ${relative(ROOT, p)}`);
    for (const p of audit) console.error(`  payload:          ${p}`);
    console.error("Run: bun run subgraph:jsonld");
    return 1;
  }

  for (const p of strays) rmSync(p);
  for (const [p, t] of all) {
    const abs = join(ROOT, p);
    mkdirSync(dirname(abs), { recursive: true });
    if (!same(abs, t)) writeFileSync(abs, t);
  }
  const audit = auditPayloadTree(payloadAbs, payloadPlan.links);
  if (audit.length > 0) {
    for (const p of audit) console.error(`  ✗ payload: ${p}`);
    return 1;
  }
  console.log(`gen-subgraph-jsonld: ${summary}` + (strays.length > 0 ? `, ${strays.length} stale file(s) removed` : ""));
  return 0;
}

if (import.meta.main) process.exit(await main());
