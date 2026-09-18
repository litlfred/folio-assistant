/**
 * The `AgentHarness` declaration — what an instance IS, at its root.
 *
 * Named for the **harness**, not for folio-assistant, and the distinction is
 * the point: `agentic-harness` is the layer that defines Roles, Skills, Tools
 * and the conventional directories, and every other instance — including
 * `folio-assist-core` — inherits from it. Calling this a "FolioAssistant"
 * declaration would put the platform family's name on a harness-layer concept
 * and imply that an instance must be a folio-assistant to have one. It need
 * not: a Tool repo or a Test repo carries the same declaration.
 *
 * Issue #223, Phase 0.3. Every folio-assistant instance carries one of these
 * at its repository root (`agent-harness.json`). It declares the directories
 * the instance scans for content, and what **kind of graph** each one holds.
 *
 * ## Why a directory declaration rather than a content-type field
 *
 * The obvious reading of "a folio holds zero or more Content instances" is a
 * list of instances under one `contentType`. That is the wrong shape, for a
 * reason that only shows up once the five-repo split is real: the instances an
 * `agentic-harness` holds are not folios at all. They are **Tool definitions**
 * under `tools/`, a **knowledge graph** of skills and workflows under `kg/`,
 * and the **schema graph** under `schemas/`. None of those renders as a
 * document, and none has a `contentType` in the `document | paper` sense.
 *
 * So the general object is not "a folio with instances" but **an instance with
 * directories, each holding a graph**. `folio` is then one graph kind among
 * several — distinguished only by being renderable to a website (see
 * {@link GRAPH_KINDS}). An instance with no `folio/` directory is completely
 * ordinary; `agentic-harness` is exactly that.
 *
 * ## Inheritance
 *
 * An instance inherits its dependencies' directory conventions. `agentic-
 * harness` declares `tools/`, `kg/` and `schemas/`; `folio-assist-core`
 * declares `folio/` and **also scans the three it inherits**, without
 * restating them. This is the same depth-first walk as
 * `schemas/folio-config.ts`, and the same overlay order — deepest dependency
 * first, root last, so the root wins.
 *
 * Overriding is by graph **id**, not by path: an instance that wants its
 * knowledge graph somewhere other than `kg/` redeclares the `kg` id with a
 * different path, and the inherited entry is replaced rather than duplicated.
 * Matching on path instead would make two directories out of one relocation,
 * and every consumer would scan a directory that is not there.
 *
 * ## Self-declarative, in the smart-base sense
 *
 * The declaration is itself a small graph instance: each directory is a node
 * with an `@id` and an `@type` drawn from the folio namespace, so the set of
 * directories an instance scans is queryable by the same machinery as anything
 * else in the knowledge graph, rather than being configuration that only this
 * module understands.
 *
 * @module schemas/agent-harness
 */

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { z } from "zod";

/**
 * The published namespace, declared here rather than imported from
 * `schemas/jsonld.ts`.
 *
 * It is the same IRI, and that is deliberate — one platform, one namespace.
 * But `jsonld.ts` is the **content** vocabulary (block kinds, DoCO types,
 * citation terms), which belongs to `folio-assist-core`. A harness-layer
 * module importing it would make `agentic-harness` depend on the content model
 * for its own type IRIs, which is precisely the coupling
 * `bun run check:partition` reports 21 instances of and the split has to undo.
 *
 * `agent-harness.test.ts` asserts this equals `FOLIO_NS`, so the two cannot
 * drift apart without a test failing. A duplicated constant with a guard beats
 * an import that inverts a dependency.
 */
export const HARNESS_NS = "https://litlfred.github.io/folio-assistant/ns#";

/** Root-relative filename carrying an instance's declaration. */
export const DECLARATION_FILENAME = "agent-harness.json";

// ── Graph kinds ─────────────────────────────────────────────────

/**
 * The kinds of graph a declared directory can hold.
 *
 * `renderable` is the only behavioural distinction in this table, and it is
 * what makes `folio` special: a folio graph is expected to come out the
 * just-the-docs rendering pipeline as a website. The others are graphs that
 * tools read. Nothing stops a consumer treating them all uniformly — that is
 * the point of making them all graphs — but only a renderable one is wired to
 * the site build.
 */
export const GRAPH_KINDS = {
  folio: {
    type: `${HARNESS_NS}FolioGraph`,
    renderable: true,
    summary: "Authored content, rendered to a website by the just-the-docs pipeline.",
  },
  tools: {
    type: `${HARNESS_NS}ToolGraph`,
    renderable: false,
    summary: "Tool definitions — themselves nodes in the KG, per the repo taxonomy.",
  },
  kg: {
    type: `${HARNESS_NS}KnowledgeGraph`,
    renderable: false,
    summary: "Skills, workflows, roles — the instance's own knowledge graph.",
  },
  schemas: {
    type: `${HARNESS_NS}SchemaGraph`,
    renderable: false,
    summary: "Schema definitions, self-declared in the smart-base manner.",
  },
} as const;

export type GraphKind = keyof typeof GRAPH_KINDS;

export const GRAPH_KIND_NAMES = Object.keys(GRAPH_KINDS) as GraphKind[];

/** Is a graph of this kind expected to render as a website? */
export function isRenderable(kind: GraphKind): boolean {
  return GRAPH_KINDS[kind].renderable;
}

/**
 * The graph kind behind a projected `@type`, or `undefined`.
 *
 * The inverse of {@link GRAPH_KINDS}. It exists because the projection is
 * lossy in the naive direction: `toJsonLd` emits `@type` INSTEAD of `graph`,
 * so a declaration published in its JSON-LD form and read back without this
 * lookup loses the one field that says what the directory holds. A round-trip
 * test pins it.
 */
export function graphKindForType(type: string): GraphKind | undefined {
  return GRAPH_KIND_NAMES.find((k) => GRAPH_KINDS[k].type === type);
}

// ── The declaration ─────────────────────────────────────────────

/** One declared content directory. */
export interface ContentDirectory {
  /**
   * Stable identifier, unique within an instance. Inheritance overrides match
   * on THIS, never on `path` — see the module note on relocation.
   */
  id: string;
  /** Repo-relative directory, with or without a trailing slash. */
  path: string;
  /** What kind of graph lives there. */
  graph: GraphKind;
  /** Optional one-line description for `--list` style output. */
  summary?: string;
}

/** An instance's root declaration. */
export interface AgentHarnessDeclaration {
  /** The instance's name, e.g. `"agentic-harness"`. */
  name: string;
  /** Directories this instance scans, before inheritance. */
  directories: ContentDirectory[];
}

export const ContentDirectorySchema = z.object({
  id: z.string().min(1),
  path: z.string().min(1),
  graph: z.enum(GRAPH_KIND_NAMES as [GraphKind, ...GraphKind[]]),
  summary: z.string().optional(),
});

export const AgentHarnessDeclarationSchema = z.object({
  name: z.string().min(1),
  directories: z.array(ContentDirectorySchema).default([]),
});

// ── Reading ─────────────────────────────────────────────────────

/**
 * Read one instance's declaration.
 *
 * Returns `undefined` when the file is absent — an instance that has not been
 * migrated yet is not an error, and callers fall back to today's conventions.
 * A file that is present but malformed **throws**: a declaration nobody can
 * read leaves every consumer scanning the wrong directories, which is worse
 * than not having one.
 */
export function readDeclaration(instanceRoot: string): AgentHarnessDeclaration | undefined {
  const p = join(instanceRoot, DECLARATION_FILENAME);
  if (!existsSync(p)) return undefined;
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(p, "utf-8"));
  } catch (e) {
    throw new Error(`${p} is not valid JSON: ${e instanceof Error ? e.message : String(e)}`);
  }
  const parsed = AgentHarnessDeclarationSchema.safeParse(stripJsonLd(raw));
  if (!parsed.success) {
    throw new Error(`${p} is not a valid AgentHarness declaration: ${parsed.error.message}`);
  }
  return parsed.data;
}

/**
 * Drop JSON-LD keywords before Zod sees the object.
 *
 * The published form carries `@context` and per-node `@id` / `@type`, which
 * are projections of `id` and `graph` rather than extra data. Keeping them out
 * of the validated shape means the schema describes the authored object and
 * the graph projection stays derivable — the same split as
 * `schemas/jsonld.ts` draws for blocks.
 */
function stripJsonLd(raw: unknown): unknown {
  if (typeof raw !== "object" || raw === null) return raw;
  const o = { ...(raw as Record<string, unknown>) };
  delete o["@context"];
  delete o["@type"];
  delete o["@id"];
  if (Array.isArray(o.directories)) {
    o.directories = o.directories.map((d) => {
      if (typeof d !== "object" || d === null) return d;
      const e = { ...(d as Record<string, unknown>) };
      if (typeof e["@type"] === "string" && e.graph === undefined) {
        const kind = graphKindForType(e["@type"] as string);
        if (kind) e.graph = kind;
      }
      delete e["@type"];
      if (typeof e["@id"] === "string" && e.id === undefined) e.id = (e["@id"] as string).replace(/^#/, "");
      delete e["@id"];
      return e;
    });
  }
  return o;
}

// ── Inheritance ─────────────────────────────────────────────────

/** A directory after inheritance, with the instance that declared it. */
export interface ResolvedDirectory extends ContentDirectory {
  /** Name of the instance whose declaration contributed this entry. */
  declaredBy: string;
  /** Absolute path, resolved against the instance that declared it. */
  absPath: string;
  /** True when the declaring instance is the root rather than a dependency. */
  own: boolean;
}

/**
 * Resolve the directories an instance scans, including inherited ones.
 *
 * `chain` runs deepest dependency first and the root last, so a root
 * redeclaring an inherited id wins. Callers usually get this from
 * `flattenDependencies(resolveDependencyTree(root))` plus the root itself;
 * it is taken as a parameter rather than walked here so this module does not
 * depend on the dependency resolver, and so tests can state a chain directly.
 */
export function resolveDirectories(
  chain: Array<{ name: string; root: string; own?: boolean }>,
): ResolvedDirectory[] {
  const byId = new Map<string, ResolvedDirectory>();

  for (const link of chain) {
    const decl = readDeclaration(link.root);
    if (!decl) continue;
    for (const dir of decl.directories) {
      // Override by id, replacing in place so the inherited ORDER is kept: a
      // relocation should not reshuffle what a consumer scans first.
      byId.set(dir.id, {
        ...dir,
        declaredBy: decl.name,
        absPath: resolve(link.root, dir.path),
        own: link.own === true,
      });
    }
    }

  return [...byId.values()];
}

/** The resolved directories holding renderable (website) graphs. */
export function renderableDirectories(dirs: ResolvedDirectory[]): ResolvedDirectory[] {
  return dirs.filter((d) => isRenderable(d.graph));
}

// ── Graph projection ────────────────────────────────────────────

/**
 * Project a declaration to its JSON-LD form — the "very simple graph schema
 * instance" the directories are meant to be.
 *
 * Kept as a function rather than as the stored form so there is one authored
 * shape and one derived shape, not two truths.
 */
export function toJsonLd(decl: AgentHarnessDeclaration): Record<string, unknown> {
  return {
    "@context": { fa: HARNESS_NS, path: `${HARNESS_NS}path`, directories: `${HARNESS_NS}scans` },
    "@type": `${HARNESS_NS}AgentHarness`,
    name: decl.name,
    directories: decl.directories.map((d) => ({
      "@id": `#${d.id}`,
      "@type": GRAPH_KINDS[d.graph].type,
      path: d.path,
      ...(d.summary ? { summary: d.summary } : {}),
    })),
  };
}
