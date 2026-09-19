/**
 * The `CatHarness` declaration — what an instance IS, at its root.
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
 * at its repository root (`cat-harness.json`). It declares the directories
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
 * `schemas/harness-config.ts`, and the same overlay order — deepest dependency
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
 * @module schemas/cat-harness
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";
import { z } from "zod";

import { KgImageSchema, kgNodeLabelShape, type KgImage, type KgNodeLabels } from "./kg-node";
import { FOLIO_NS } from "./namespaces";

/** Root-relative filename carrying an instance's declaration. */
export const DECLARATION_FILENAME = "cat-harness.json";

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
/** What a declared directory's graph kind means. */
export interface GraphKindDef {
  /** The `@type` IRI this kind projects to. */
  type: string;
  /**
   * Is a graph of this kind expected to render as a website?
   *
   * The only behavioural distinction in the vocabulary — and the reason
   * `folio` is not declared here. The harness **cannot render**: the
   * just-the-docs pipeline and the webpage content type belong to
   * `folio-assist-core`. A layer that cannot render must not own the
   * renderable kind, so `folio` is REGISTERED by core rather than declared
   * here. See `schemas/folio-graph-kind.ts`.
   */
  renderable: boolean;
  summary: string;
}

/**
 * The graph kinds the **harness itself** defines.
 *
 * Four, and deliberately none of them renderable. Everything here is a graph a
 * tool reads: how work is done (`tools`), what an actor knows and which process
 * governs it (`kg`), the shapes both are typed against (`schemas`), and the
 * work plan with its running-process state (`beans`).
 *
 * ## Why the work plan is the harness's and not core's
 *
 * `folio` is registered by `folio-assist-core` because only core can render.
 * The work plan has no such constraint in either direction: an instance has
 * work whether or not it has content, and `agentic-harness` itself carries a
 * `beans/` store for its own. A Tool repo and a Test repo have work plans too.
 * So it is declared here — the test for "does this belong to the harness" is
 * whether the harness has one, and it does.
 *
 * ## One `beans` kind, and where the distinction it carried went
 *
 * This map used to hold five kinds, splitting the work plan in two: `workplan`
 * at `beans/` and `process-state` at `beans/workflow/`. The reasoning was that
 * WHAT IS BEING WORKED ON is human- and agent-authored and carries judgement,
 * while WHERE A RUNNING PROCESS GOT TO is a token the interpreter owns and no
 * human is invited to edit — and that a consumer asking for the work plan must
 * not be handed BPMN instance state.
 *
 * That reasoning holds; the mechanism was wrong. The second directory sat
 * INSIDE the first, so a consumer scanning a declared directory could not
 * assume it owned what lay beneath it, and the two were distinguishable only by
 * file extension — which the declaring comment itself called "a coincidence of
 * the current layout, not a contract". Two sibling entries in a flat list
 * misrepresented a containment relation.
 *
 * `beans/` is now a graph with named nodes (`beans/beans.json`,
 * `schemas/bean-graph.ts`), so the distinction lives INSIDE the graph that
 * declares it rather than out here where it had to be inferred. The harness
 * says which directories exist and what kind of graph each holds; the bean
 * graph says what its own nodes are. One fact, one place, at each level — and
 * the consumer that must not be handed instance state asks for a node by name.
 */
export const BASE_GRAPH_KINDS: Readonly<Record<string, GraphKindDef>> = {
  tools: {
    type: `${FOLIO_NS}ToolGraph`,
    renderable: false,
    summary: "Tool definitions — themselves nodes in the KG, per the repo taxonomy.",
  },
  kg: {
    type: `${FOLIO_NS}KnowledgeGraph`,
    renderable: false,
    summary: "Skills, workflows, roles — the instance's own knowledge graph.",
  },
  schemas: {
    type: `${FOLIO_NS}SchemaGraph`,
    renderable: false,
    summary: "Schema definitions, self-declared in the smart-base manner.",
  },
  // ONE kind for the whole work plan, not one per store. It replaced `workplan`
  // + `process-state` in #266; the rationale is in this map's doc comment above,
  // and the #263 version it supersedes is preserved there too. PR #266 changed
  // the map and left that comment describing the old five-kind design.
  beans: {
    type: `${FOLIO_NS}BeanGraph`,
    renderable: false,
    summary:
      "The work plan — what is being worked on, and where each running BPMN instance got to. " +
      "Its inner directories are declared by `beans/beans.json`.",
  },
  // The two parts of the bean graph. They are BASE kinds rather than
  // something `bean-graph.ts` registers separately, because a directory and
  // what it holds is one concept and this is where it lives — `bean-graph.ts`
  // had grown a parallel closed vocabulary (`BEAN_NODE_KINDS`) saying the same
  // thing in different words.
  "bean-defs": {
    type: `${FOLIO_NS}BeanDefsGraph`,
    renderable: false,
    summary:
      "Work items — one Markdown file each, in the layout the `beans` CLI reads. " +
      "Authored and edited by people and agents.",
  },
  "workflow-state": {
    type: `${FOLIO_NS}WorkflowStateGraph`,
    renderable: false,
    summary:
      "Running BPMN instances — one JSON file each, carrying " +
      "`\"$schema\": \"folio-workflow-instance/v1\"`. Owned by the interpreter, never hand-edited.",
  },
  // The todo graph. NOT a second work plan: `beans` is the agent work plan and
  // `AGENTS.md` forbids standing up another. This is the thing that document
  // already carves out beside it — "the content-review feedback workflow … a
  // separate domain feature, not the agent work-plan" — and it is CONTENT,
  // owned by the folio. A todo records a PERSON's outstanding work, tagged by
  // the four coordinates of the role model: who, as which role, in which
  // process, on which task.
  todos: {
    type: `${FOLIO_NS}TodoGraph`,
    renderable: false,
    summary:
      "Human actors' outstanding work — content, owned by the folio, tagged by role, " +
      "process, task and identity. Its inner directories are declared by `todos/todos.json`.",
  },
  "todo-items": {
    type: `${FOLIO_NS}TodoItemsGraph`,
    renderable: false,
    summary:
      "Todo nodes — one file each, carrying `\"$schema\": \"folio-todo/v1\"`. " +
      "Authored by people and by agents on their behalf.",
  },
  // The two stages of the document-ingestion pipeline. They are declared as
  // SEPARATE kinds rather than one `sources` kind because the whole point of
  // the pair is that they are not interchangeable: the corpus-grep checklist
  // searches `library/` and not `uploads/`, so a source still in `uploads/`
  // makes a clean grep read as "nobody has done this" while the file sits on
  // disk. Collapsing them into one kind would erase exactly the distinction
  // `content/docs/document-ingestion/uploads-and-library-are-two-stages-of-one-pipeline.md`
  // exists to state.
  uploads: {
    type: `${FOLIO_NS}UploadsGraph`,
    renderable: false,
    summary:
      "The incoming queue — raw files as dropped, before ingestion. NOT L1, and not " +
      "greppable as corpus: a document here reads as absent to every consumer.",
  },
  library: {
    type: `${FOLIO_NS}LibraryGraph`,
    renderable: false,
    summary:
      "L1 source content — one `<bib-slug>/` per ingested document, holding `sections/*.md`, " +
      "`structure.json` and, where the source was scanned, `ocr/page-NNN.txt`. Every " +
      "knowledge-graph reference to a source resolves through here, never to a loose path " +
      "or a bare URL.",
  },
  // Named editorial voice profiles, overlaid on the base house voice. A
  // separate kind from `kg` because a voice is OPT-IN per folio while a skill is
  // simply available: the activation list in `harness.config.json` is what makes
  // a voice apply, and a graph kind that conflated the two would have no place
  // to record that this instance ships four voices and activates none.
  voices: {
    type: `${FOLIO_NS}VoiceGraph`,
    renderable: false,
    summary:
      "Editorial voice profiles — one JSON each, carrying `\"$schema\": \"folio-voice/v1\"`. " +
      "Every rule cites the ingested source or KG node it was derived from. Opt-in per folio.",
  },
  "todo-feedback": {
    type: `${FOLIO_NS}TodoFeedbackGraph`,
    renderable: false,
    summary:
      "Feedback items — todos raised against a specific block, carrying the submitter's " +
      "identity. Read by the `todo-review` skill.",
  },
};

/** A graph kind name. Open, not a closed union — downstream layers add kinds. */
export type GraphKind = string;

/** Thrown when a kind is registered twice with different meanings. */
export class GraphKindConflictError extends Error {
  constructor(name: string) {
    super(
      `graph kind "${name}" is already registered with a different definition. ` +
        `Kinds are a shared vocabulary — rename, or register once.`,
    );
    this.name = "GraphKindConflictError";
  }
}

/**
 * The graph-kind vocabulary, extensible by the layers above the harness.
 *
 * An instance registry rather than a bare module constant, so that a test — or
 * a process resolving more than one instance — cannot leak registrations into
 * the next. `defaultGraphKinds` is the convenience shared instance; every read
 * accepts an explicit one.
 *
 * Registration is **idempotent for an identical definition** and throws on a
 * conflicting one, the same rule `schemas/contributions.ts` uses: a diamond
 * dependency graph reaches core twice and must not fail for it, while two
 * different layers claiming one name is a real collision.
 */
export class GraphKindRegistry {
  private kinds = new Map<string, GraphKindDef>();

  constructor(seed: Readonly<Record<string, GraphKindDef>> = BASE_GRAPH_KINDS) {
    for (const [k, v] of Object.entries(seed)) this.kinds.set(k, v);
  }

  register(name: string, def: GraphKindDef): void {
    const existing = this.kinds.get(name);
    if (existing) {
      if (existing.type === def.type && existing.renderable === def.renderable) return; // diamond
      throw new GraphKindConflictError(name);
    }
    this.kinds.set(name, def);
  }

  has(name: string): boolean {
    return this.kinds.has(name);
  }

  get(name: string): GraphKindDef | undefined {
    return this.kinds.get(name);
  }

  names(): string[] {
    return [...this.kinds.keys()];
  }

  /** The kind behind a projected `@type`, or `undefined`. */
  forType(type: string): string | undefined {
    for (const [k, v] of this.kinds) if (v.type === type) return k;
    return undefined;
  }
}

/** The shared registry. Core registers `folio` into this at load. */
export const defaultGraphKinds = new GraphKindRegistry();

/** Is a graph of this kind expected to render as a website? */
export function isRenderable(kind: string, registry: GraphKindRegistry = defaultGraphKinds): boolean {
  return registry.get(kind)?.renderable === true;
}

// ── The declaration ─────────────────────────────────────────────

/** One declared content directory. */
export interface ContentDirectory extends KgNodeLabels {
  /**
   * Stable identifier, unique within an instance. Inheritance overrides match
   * on THIS, never on `path` — see the module note on relocation.
   */
  id: string;
  /** Repo-relative directory, with or without a trailing slash. */
  path: string;
  /** What kind of graph lives there. */
  /**
   * Which parts of the knowledge graph this directory holds — an ARRAY,
   * because a directory is a PLACE TO LOOK and may hold more than one.
   *
   * It does not say how to tell the contents apart, and that is deliberate:
   * **the files declare what they are.** A bean carries its id, `title`,
   * `status` and `type` in front matter; a workflow instance carries
   * `"$schema": "folio-workflow-instance/v1"`. A consumer reads a file and
   * the file answers, so a declaration states what to EXPECT rather than how
   * to discriminate.
   *
   * Was singular `graph`. Made an array 2026-09-18 so that this schema and
   * the bean graph state the same fact the same way — they had diverged into
   * `graph: "kg"` here and `kinds: ["bean-defs"]` there, two spellings of one
   * concept.
   */
  graphs: GraphKind[];
}

/** An instance's root declaration. */
export interface CatHarnessDeclaration extends KgNodeLabels {
  /**
   * Images this instance names — its marks, in the graph rather than beside it.
   *
   * See {@link KgImage}: the docs site, the README and the browser tab all want
   * the same picture, and a node is what stops each of them hardcoding its own
   * path to it.
   */
  images?: KgImage[];
  /**
   * The id of the {@link images} entry to use as the browser icon.
   *
   * An id and not a path, so moving the file is one edit in one place. A
   * dangling reference is reported by `readDeclaration` rather than silently
   * rendering no icon — a missing favicon looks exactly like a slow one.
   */
  icon?: string;
  /** The instance's name, e.g. `"agentic-harness"`. */
  name: string;
  /**
   * The repository's short name, used as the **filename stem of every artefact
   * this instance publishes** — `<stub>.jsonld` for the knowledge graph,
   * `<stub>.schema.json` for its schema. Defaults to `name`.
   *
   * WHO's `smart-base` derives its stub by stripping the `smart-` prefix from
   * the repository name (`smart-base` → `base` → `https://smart.who.int/base`),
   * so the stub, the directory and the published path are one word. The same
   * convention holds here without the prefix rule: the artefact is named after
   * the repository, so a reader who knows the repo knows the filename.
   *
   * Note the declaration file itself is **not** stub-named — it stays
   * `cat-harness.json`, exactly as `smart-base`'s config stays `dak.json`. A
   * consumer must be able to find the config without already knowing the
   * repository's name; the artefacts it *describes* are free to be named.
   */
  stub?: string;
  /**
   * Where this instance's artefacts are published — the base every `@id` in
   * the exported graph is minted against.
   *
   * Absent means **no absolute IRIs can be minted**, which the exporter reports
   * rather than papering over with a plausible-looking guess: an `@id` that
   * resolves to nothing is worse than an obviously relative one, because it
   * looks dereferenceable and is not.
   */
  canonicalUrl?: string;
  /** Where CI previews are served, when that differs from `canonicalUrl`. */
  previewUrl?: string;
  /** Directories this instance scans, before inheritance. */
  directories: ContentDirectory[];
}

export const ContentDirectorySchema = z.object({
  id: z.string().min(1),
  path: z.string().min(1),
  // Open string here, checked against the registry in `readDeclaration`.
  // A closed enum would have to be built at module load, which is before core
  // has registered `folio` — so the enum would reject the one kind the whole
  // rendering pipeline depends on.
  graphs: z.array(z.string().min(1)).min(1),
  ...kgNodeLabelShape,
});

export const CatHarnessDeclarationSchema = z.object({
  name: z.string().min(1),
  ...kgNodeLabelShape,
  images: z.array(KgImageSchema).optional(),
  icon: z.string().min(1).optional(),
  stub: z.string().min(1).optional(),
  canonicalUrl: z.string().url().optional(),
  previewUrl: z.string().url().optional(),
  directories: z.array(ContentDirectorySchema).default([]),
});

/**
 * The stem every published artefact is named with: `stub` when declared,
 * otherwise `name`.
 *
 * One function so the KG export, the schema export and any future artefact
 * cannot disagree about what this instance is called — the naming convention
 * is only worth having if it is computed in one place.
 */
export function artefactStub(d: Pick<CatHarnessDeclaration, "name" | "stub">): string {
  return d.stub ?? d.name;
}

/**
 * Where an instance's renderings are published, given the site they are
 * published to.
 *
 * **They sit at the base, not in a subdirectory.** A cat-harness instance's
 * repository IS its declaration that it is a graph — `cat-harness.json` at the
 * root says which graphs are here — so there is nothing for a `kg/` segment to
 * distinguish it from. The stub is what separates one instance's renderings
 * from another's in a tree that overlays several, which is the job a directory
 * would otherwise have been doing.
 *
 * ```
 * <base>/<stub>.jsonld          the knowledge graph
 * <base>/<stub>.json            the same bytes, servable as application/json
 * <base>/<stub>.schema.json     the declaration's schema
 * <base>/<stub>/                the viewer
 * ```
 *
 * **One function so nothing hand-writes a path again.** It was written out in
 * seven template literals across two exporters and two workflows — five of them
 * minting an `$id`, which is an identity, not a link. Relocating the renderings
 * from `kg/` to the base meant editing all seven, and a missed one publishes a
 * document whose own `$id` names a URL that 404s. `skillSchemaId` in
 * `harness-schema-export.ts` already carried this argument for its own corner;
 * this generalises it.
 *
 * A trailing slash on `base` is dropped, and an EMPTY base yields a
 * document-relative path rather than one rooted at `/` — a leading slash would
 * silently retarget every reference at the domain root, which is a different
 * site.
 */
export function renderingPath(base: string, ...segments: string[]): string {
  const b = base.replace(/\/+$/, "");
  const tail = segments.filter((s) => s.length > 0).join("/");
  return b ? `${b}/${tail}` : tail;
}

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
export function readDeclaration(
  instanceRoot: string,
  registry: GraphKindRegistry = defaultGraphKinds,
): CatHarnessDeclaration | undefined {
  const p = join(instanceRoot, DECLARATION_FILENAME);
  if (!existsSync(p)) return undefined;
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(p, "utf-8"));
  } catch (e) {
    throw new Error(`${p} is not valid JSON: ${e instanceof Error ? e.message : String(e)}`);
  }
  const parsed = CatHarnessDeclarationSchema.safeParse(stripJsonLd(raw, registry));
  if (!parsed.success) {
    throw new Error(`${p} is not a valid CatHarness declaration: ${parsed.error.message}`);
  }
  // Kind validation is here rather than in the Zod schema because the
  // vocabulary is open: the set of valid kinds is whatever has been registered
  // by the time the declaration is read, not what existed at module load.
  for (const dir of parsed.data.directories) {
    for (const g of dir.graphs) {
      if (!registry.has(g)) {
        throw new Error(
          `${p}: directory "${dir.id}" declares unknown graph kind "${g}". ` +
            `Known kinds: ${registry.names().join(", ")}. ` +
            `A kind contributed by a dependency must be registered before the ` +
            `declaration is read.`,
        );
      }
    }
  }
  // Same reasoning one level down: an `icon` naming an image the declaration
  // does not carry renders nothing, and a missing favicon looks exactly like a
  // slow one — so it is reported rather than left to be noticed.
  if (parsed.data.icon) {
    const ids = (parsed.data.images ?? []).map((i) => i.id);
    if (!ids.includes(parsed.data.icon)) {
      throw new Error(
        `${p}: icon "${parsed.data.icon}" names no declared image. ` +
          (ids.length ? `Declared: ${ids.join(", ")}.` : `No images are declared.`),
      );
    }
  }
  const seen = new Set<string>();
  for (const i of parsed.data.images ?? []) {
    if (seen.has(i.id)) throw new Error(`${p}: image "${i.id}" is declared twice.`);
    seen.add(i.id);
  }
  return parsed.data;
}

/**
 * Drop JSON-LD keywords before Zod sees the object.
 *
 * The published form carries `@context` and per-node `@id` / `@type`, which
 * are projections of `id` and `graphs` rather than extra data. Keeping them out
 * of the validated shape means the schema describes the authored object and
 * the graph projection stays derivable — the same split as
 * `schemas/jsonld.ts` draws for blocks.
 */
function stripJsonLd(raw: unknown, registry: GraphKindRegistry): unknown {
  if (typeof raw !== "object" || raw === null) return raw;
  const o = { ...(raw as Record<string, unknown>) };
  delete o["@context"];
  delete o["@type"];
  delete o["@id"];
  if (Array.isArray(o.directories)) {
    o.directories = o.directories.map((d) => {
      if (typeof d !== "object" || d === null) return d;
      const e = { ...(d as Record<string, unknown>) };
      // `@type` recovers `graphs`, and handles both projected forms: a single
      // type stays a string, several become a list. A type the registry does
      // not know is DROPPED rather than guessed — recovering the wrong kind is
      // worse than recovering none, because the reader has no way to tell.
      if (e.graphs === undefined && e["@type"] !== undefined) {
        const types = Array.isArray(e["@type"]) ? e["@type"] : [e["@type"]];
        const kinds = types
          .filter((t): t is string => typeof t === "string")
          .map((t) => registry.forType(t))
          .filter((k): k is string => k !== undefined);
        if (kinds.length > 0) e.graphs = kinds;
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
  registry: GraphKindRegistry = defaultGraphKinds,
): ResolvedDirectory[] {
  const byId = new Map<string, ResolvedDirectory>();

  for (const link of chain) {
    const decl = readDeclaration(link.root, registry);
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

// ── Materialisation ─────────────────────────────────────────────

/**
 * What the keep-marker in a materialised directory says.
 *
 * It is a `.gitignore` because that is the one filename whose presence in an
 * otherwise-empty directory is unremarkable, and it **ignores nothing**. The
 * comment is the payload: git tracks files rather than directories, so a
 * declared-but-empty directory vanishes from the next clone without a file in
 * it, and the next person deletes it as debris.
 *
 * Deliberately no `*` / `!.gitignore` pair. Ignoring the contents of
 * `uploads/` would reproduce the defect the two-stage pipeline exists to
 * prevent — a source on disk that every consumer reads as absent — and
 * `library/` is L1 corpus that MUST be committed and greppable. What a folio
 * chooses to ignore is the folio's policy; this file only keeps the directory
 * alive, and is never overwritten once it exists.
 */
export function keepMarker(dir: Pick<ContentDirectory, "id" | "description">): string {
  const what = dir.description?.trim();
  return [
    "# do not delete me",
    "#",
    "# Git tracks files, not directories, so this directory would vanish from",
    "# the next clone without a file in it. This is that file. It ignores",
    "# nothing on purpose — see `keepMarker` in schemas/cat-harness.ts.",
    "#",
    `# ${dir.id}/`,
    ...(what ? wrapComment(what) : []),
    "",
  ].join("\n");
}

/** Wrap a description into `# `-prefixed lines at 76 columns. */
function wrapComment(text: string, width = 74): string[] {
  const words = text.replace(/\s+/g, " ").split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if (line && (line + " " + w).length > width) {
      lines.push(`# ${line}`);
      line = w;
    } else {
      line = line ? line + " " + w : w;
    }
  }
  if (line) lines.push(`# ${line}`);
  return lines;
}

/** One directory's outcome from {@link materialiseDirectories}. */
export interface MaterialisedDirectory {
  id: string;
  /** Path the directory was (or would be) created at, inside the instance. */
  absPath: string;
  /** The instance whose declaration contributed the entry — may be a dependency. */
  declaredBy: string;
  /** True when this call created the directory; false when it already existed. */
  created: boolean;
  /** True when this call wrote the keep-marker; false when one was already there. */
  markerWritten: boolean;
}

/**
 * Create every declared directory that does not exist yet, in the instance
 * being set up.
 *
 * WHY THIS EXISTS, and why it must land in the same change as any new
 * declaration: `AGENTS.md` says "declare only what exists — a declared-but-
 * absent directory is the bean `dh4f` defect, where a consumer scans nothing
 * and reports a clean run over it". Absent and empty are indistinguishable to
 * a consumer, so declaring a directory you have not created converts a real
 * gap into a clean run. Materialising is what makes "empty" a DETERMINED
 * empty rather than an unanswered question — the same third-state discipline
 * the README sections and the CI-health report follow.
 *
 * PATHS RESOLVE AGAINST THE INSTANCE, NOT THE DECLARER. An instance inherits
 * its dependencies' directory conventions, so what it inherits is the
 * CONVENTION — an id and a relative path — and it needs that directory in
 * ITSELF. `ResolvedDirectory.absPath` points into the declaring checkout,
 * which for a dependency is somebody else's tree; writing there would be the
 * equivalent of creating folders inside `node_modules`.
 *
 * A path that escapes the instance root is REFUSED rather than created, the
 * same rule `schemas/bean-graph.ts` applies to its node paths: a directory
 * outside the instance is not a directory of it.
 *
 * Idempotent. Running it twice creates nothing and overwrites nothing — an
 * existing keep-marker is left exactly as it is, because a folio may have
 * added real ignore rules to it. A directory that already holds files gets no
 * marker: it is not at risk of vanishing, so a file explaining that it might
 * would be both redundant and wrong.
 */
export function materialiseDirectories(
  dirs: ResolvedDirectory[],
  instanceRoot: string,
  opts: { dryRun?: boolean } = {},
): MaterialisedDirectory[] {
  const rootAbs = resolve(instanceRoot);
  const out: MaterialisedDirectory[] = [];
  for (const dir of dirs) {
    const abs = resolve(rootAbs, dir.path);
    const rel = relative(rootAbs, abs);
    if (rel.startsWith("..") || isAbsolute(rel)) {
      throw new Error(
        `declared directory "${dir.id}" resolves outside the instance ` +
          `(${dir.path} -> ${abs}); a directory outside the instance is not a directory of it`,
      );
    }
    const existed = existsSync(abs);
    const markerPath = join(abs, ".gitignore");
    const markerExisted = existed && existsSync(markerPath);
    // The marker earns its place ONLY in a directory that would otherwise be
    // empty — that is the whole failure it addresses. Writing one into a
    // directory that already holds files (this instance's `skills/` holds
    // hundreds) adds a file nobody asked for and says something untrue about
    // why it is there.
    const needsMarker =
      !markerExisted && (!existed || readdirSync(abs).length === 0);
    if (!opts.dryRun) {
      if (!existed) mkdirSync(abs, { recursive: true });
      if (needsMarker) writeFileSync(markerPath, keepMarker(dir), "utf-8");
    }
    out.push({
      id: dir.id,
      absPath: abs,
      declaredBy: dir.declaredBy,
      created: !existed,
      markerWritten: needsMarker,
    });
  }
  return out;
}

/** The resolved directories holding renderable (website) graphs. */
export function renderableDirectories(
  dirs: ResolvedDirectory[],
  registry: GraphKindRegistry = defaultGraphKinds,
): ResolvedDirectory[] {
  // Renderable if ANY declared graph is: a directory holding a folio plus
  // something else still renders.
  return dirs.filter((d) => d.graphs.some((g) => isRenderable(g, registry)));
}

// ── Graph projection ────────────────────────────────────────────

/**
 * Project a declaration to its JSON-LD form — the "very simple graph schema
 * instance" the directories are meant to be.
 *
 * Kept as a function rather than as the stored form so there is one authored
 * shape and one derived shape, not two truths.
 */
export function toJsonLd(
  decl: CatHarnessDeclaration,
  registry: GraphKindRegistry = defaultGraphKinds,
): Record<string, unknown> {
  return {
    "@context": { fa: FOLIO_NS, path: `${FOLIO_NS}path`, directories: `${FOLIO_NS}scans` },
    "@type": `${FOLIO_NS}CatHarness`,
    name: decl.name,
    ...(decl.title ? { title: decl.title } : {}),
    ...(decl.description ? { description: decl.description } : {}),
    ...(decl.icon ? { icon: { "@id": `#${decl.icon}` } } : {}),
    ...(decl.images?.length
      ? {
          images: decl.images.map((i) => ({
            "@id": `#${i.id}`,
            "@type": `${FOLIO_NS}Image`,
            src: i.src,
            ...(i.role ? { role: i.role } : {}),
            ...(i.title ? { title: i.title } : {}),
            ...(i.description ? { description: i.description } : {}),
          })),
        }
      : {}),
    directories: decl.directories.map((d) => {
      const types = d.graphs.map((g) => registry.get(g)?.type ?? `${FOLIO_NS}UnknownGraph`);
      return {
        "@id": `#${d.id}`,
        // One type stays a string, several become a list — JSON-LD permits
        // both, and emitting a one-element array for the common case would
        // make every existing published form look changed.
        "@type": types.length === 1 ? types[0] : types,
        path: d.path,
        ...(d.title ? { title: d.title } : {}),
        ...(d.description ? { description: d.description } : {}),
      };
    }),
  };
}
