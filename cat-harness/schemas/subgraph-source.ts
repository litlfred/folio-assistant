/**
 * WHERE A DECLARED SUBGRAPH GETS ITS CONTENT — one concept, several kinds.
 *
 * @module schemas/subgraph-source
 * @graphNode schema
 *
 * The owner, 2026-10-03, verbatim:
 *
 * > *"It's the same pattern. One of them is mounting the directory while one
 * > of them is mounting a branch. Another mount type could come in the future.
 * > A sub graph declares where it's getting its content.. It could also be a
 * > graph database in the future. That same information can be overwritten by
 * > the harness instance config."*
 *
 * So a "declared directory subgraph" and a "declared branch subgraph" are not
 * two things. Both are a declared Subgraph; they differ in their SOURCE, and
 * the source is a discriminated union on `kind`:
 *
 * | kind | content comes from | the entry's `path` is |
 * |---|---|---|
 * | `directory` (the default) | the checkout, at `path` | the content itself |
 * | `branch` | a declared repository branch (`special-branches.json`), keyed by `commit` or `tip` | where a mount of it lands |
 *
 * A third kind (a graph database) is a new MEMBER of the union — an additive
 * change every `switch` on `kind` is then forced by the compiler to answer —
 * never a reinterpretation of an existing field.
 *
 * ## How the older fields map onto it
 *
 * `storage: { branch, keyedBy }` (arc `3fva`, #1764; `keyedBy: "tip"` added by
 * #1937) is EXACTLY `source: { kind: "branch", branch, keyedBy }`. It stays
 * as the LEGACY spelling: the resolver reads it and reports the answer as
 * `declaredIn: "storage"`, the presence checks ask {@link contentIsOffCheckout}
 * (which honours both), and an entry carrying both is refused, because two
 * answers to one question is the defect this module exists to remove.
 * `qa-store.ts` and `branch-store.ts` still read `storage` directly; moving
 * them onto the resolver is their owners' change (#1957 takes `branch-store`'s
 * `mount`/`push` onto it), not this module's. `special-branches.json` stays the
 * one declaration of branch NAMES (and their legacy spellings): a branch
 * source names its branch, and the resolver attaches the matching row.
 *
 * ## Overridable by the instance config, matched on id
 *
 * `<instance>.config.json` → `subgraphSources: { "<dir-id>": <source> }`. The
 * declaration says what the subgraph IS; the config says how THIS
 * instantiation is set up, and where a subgraph is mounted from is that kind
 * of fact (an IG folio may mount `fsh-guts` from a branch while a fresh clone
 * reads it from the checkout). Matched on the entry's `id`, never its `path` —
 * the override rule `resolveDirectories` already applies to whole entries.
 *
 * ## One resolver
 *
 * {@link resolveSubgraphSource} is pure: entry + optional override in,
 * resolved source out. Every consumer — the KG export's Subgraph node, a
 * publisher's container node, `branch-store mount`/`push` — asks it, so the
 * precedence (config, then `source`, then legacy `storage`, then the
 * `directory` default) is stated once.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

import { propertyIri, termIri } from "./namespaces";

/** A plain branch name: no `refs/`, no `..`, no leading `-` — the rule `DirectoryStorageSchema` (#1764) uses. */
export const BranchNameSchema = z
  .string()
  .regex(/^(?!-)(?!refs\/)[A-Za-z0-9._/-]+$/, "a plain branch name, e.g. cat/cat-harness/todos")
  .refine(
    (b) => !b.includes("..") && !b.includes("//") && !b.endsWith("/") && !b.endsWith(".lock") && !b.startsWith("/"),
    "not a valid branch name",
  );

/** How entries are keyed on a branch: one per `commit`, or one live copy at the `tip`. */
export const KeyedBySchema = z.enum(["commit", "tip"]);
export type KeyedBy = z.infer<typeof KeyedBySchema>;

/** The content is the checkout's own directory at the entry's `path`. */
export const DirectorySourceSchema = z.object({ kind: z.literal("directory") }).strict();

/** The content is a declared repository branch; the entry's `path` is where a mount of it lands. */
export const BranchSourceSchema = z
  .object({
    kind: z.literal("branch"),
    branch: BranchNameSchema,
    keyedBy: KeyedBySchema,
  })
  .strict();

/**
 * A declared subgraph's content source. A discriminated union, so a new kind
 * is a new member here and a compile error at every consumer that has not
 * decided what to do with it.
 */
export const SubgraphSourceSchema = z.discriminatedUnion("kind", [DirectorySourceSchema, BranchSourceSchema]);
export type SubgraphSource = z.infer<typeof SubgraphSourceSchema>;
export type SubgraphSourceKind = SubgraphSource["kind"];

/** Every kind the union knows — for a reader that must refuse the rest (`branch-store mount`'s exit code). */
export const SUBGRAPH_SOURCE_KINDS: readonly SubgraphSourceKind[] = ["directory", "branch"];

/** The config half: `<instance>.config.json` → `subgraphSources`, keyed by directory id. */
export const SubgraphSourceOverridesSchema = z.record(z.string().min(1), SubgraphSourceSchema);
export type SubgraphSourceOverrides = z.infer<typeof SubgraphSourceOverridesSchema>;

/** The #1764 shape, read only to map it. */
const LegacyStorageSchema = z.object({ branch: BranchNameSchema, keyedBy: KeyedBySchema });

/** Which layer the answer came from — reported, so an override is never silent. */
export type SourceDeclaredIn = "default" | "declaration" | "storage" | "config";

/** A row of `special-branches.json`, as far as a source needs it. */
export interface SpecialBranchRow {
  id: string;
  shape: "branch" | "family";
  name: string;
  legacy: string[];
}

export type ResolvedSubgraphSource =
  | {
      kind: "directory";
      /** The declared directory's id. */
      id: string;
      /** The entry's `path` — the content itself. */
      path: string;
      declaredIn: SourceDeclaredIn;
    }
  | {
      kind: "branch";
      id: string;
      /** The entry's `path` — where a mount of the branch lands. */
      path: string;
      branch: string;
      keyedBy: KeyedBy;
      /**
       * The `special-branches.json` row naming this branch (exactly, or as a
       * member of a `family`), or `undefined` when none does — a FINDING the
       * subgraph-source gate reports, never a guess at the name.
       */
      special: SpecialBranchRow | undefined;
      declaredIn: SourceDeclaredIn;
    };

/**
 * Where `special-branches.json` is — resolved LAZILY, from `import.meta.url`.
 * `import.meta.dir` is Bun's alone: Playwright loads this module under Node,
 * where a top-level `resolve(import.meta.dir, …)` threw before any test ran.
 * Lazy as well, so importing the declaration schema touches no filesystem.
 */
function specialBranchesPath(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), "..", "scripts", "special-branches.json");
}

let specialRows: SpecialBranchRow[] | undefined;

/** `special-branches.json`'s rows — the one declaration of branch names. */
export function specialBranches(path?: string): SpecialBranchRow[] {
  if (path === undefined && specialRows !== undefined) return specialRows;
  const raw = JSON.parse(readFileSync(path ?? specialBranchesPath(), "utf-8")) as { branches?: SpecialBranchRow[] };
  const rows = (raw.branches ?? []).map((b) => ({ id: b.id, shape: b.shape, name: b.name, legacy: [...(b.legacy ?? [])] }));
  if (path === undefined) specialRows = rows;
  return rows;
}

/** The row declaring `branch`: an exact `branch` row, or the `family` whose prefix it carries. Legacy names count. */
export function specialBranchFor(branch: string, rows: readonly SpecialBranchRow[] = specialBranches()): SpecialBranchRow | undefined {
  for (const r of rows) {
    if (r.shape === "branch" && (r.name === branch || r.legacy.includes(branch))) return r;
  }
  for (const r of rows) {
    if (r.shape === "family" && [r.name, ...r.legacy].some((p) => p.endsWith("/") && branch.startsWith(p) && branch.length > p.length)) {
      return r;
    }
  }
  return undefined;
}

/** The fields of a directory entry the resolver reads. */
export interface SourcedEntry {
  id: string;
  path: string;
  graphKinds?: readonly string[];
  source?: SubgraphSource;
  /** #1764's field, if a declaration carries it. Read only to map it. */
  storage?: unknown;
}

/**
 * Does this entry's DECLARATION put its content somewhere other than the
 * checkout? The presence checks ask this (`materialiseDirectories`,
 * `check:declared-dirs`, `audit:coverage`): a subgraph whose content is on a
 * branch is not "missing" when its directory is absent, and must not be
 * created empty. Asked of the declaration alone, so it never throws and needs
 * no IO; the instance config's override is the resolver's to apply.
 * `storage` (#1764) counts — it is the legacy spelling of a branch source.
 */
export function contentIsOffCheckout(entry: { source?: SubgraphSource; storage?: unknown }): boolean {
  if (entry.source !== undefined) return entry.source.kind !== "directory";
  return entry.storage !== undefined && entry.storage !== null;
}

/**
 * THE resolver. Precedence: the instance config's override for this id, then
 * the entry's `source`, then a legacy `storage`, then `directory`.
 *
 * Throws on the two contradictions a reader must not paper over: an entry
 * carrying both `source` and `storage`, and a `qa` subgraph keyed by `tip`
 * (#1937's rule, kept here so it holds whichever field said it).
 */
export function resolveSubgraphSource(
  entry: SourcedEntry,
  overrides?: SubgraphSourceOverrides,
  rows?: readonly SpecialBranchRow[],
): ResolvedSubgraphSource {
  if (entry.source !== undefined && entry.storage !== undefined) {
    throw new Error(
      `directory "${entry.id}" declares both \`source\` and \`storage\` — two answers to where its content comes from. ` +
        `\`storage: { branch, keyedBy }\` is \`source: { kind: "branch", branch, keyedBy }\`; keep one.`,
    );
  }
  let src: SubgraphSource = { kind: "directory" };
  let declaredIn: SourceDeclaredIn = "default";
  const override = overrides?.[entry.id];
  if (override !== undefined) {
    src = SubgraphSourceSchema.parse(override);
    declaredIn = "config";
  } else if (entry.source !== undefined) {
    src = SubgraphSourceSchema.parse(entry.source);
    declaredIn = "declaration";
  } else if (entry.storage !== undefined) {
    const s = LegacyStorageSchema.parse(entry.storage);
    src = { kind: "branch", branch: s.branch, keyedBy: s.keyedBy };
    declaredIn = "storage";
  }
  switch (src.kind) {
    case "directory":
      return { kind: "directory", id: entry.id, path: entry.path, declaredIn };
    case "branch": {
      if (src.keyedBy === "tip" && (entry.graphKinds ?? []).includes("qa")) {
        throw new Error(`directory "${entry.id}" is a \`qa\` subgraph: it is keyed by commit, and \`keyedBy: "tip"\` is for one-live-copy state (beans, todos)`);
      }
      return {
        kind: "branch",
        id: entry.id,
        path: entry.path,
        branch: src.branch,
        keyedBy: src.keyedBy,
        special: specialBranchFor(src.branch, rows),
        declaredIn,
      };
    }
  }
}

/**
 * The JSON-LD form of a resolved source — the value of a Subgraph node's
 * `contentSource`. Keys are scoped by the `@context` the exporter declares
 * ({@link contentSourceContext}), so they cannot leak a meaning onto
 * another node's `kind` or `branch`.
 *
 * A branch on a forge whose tree URL layout is known gets an `@id` that
 * dereferences to the branch; anything else stays a blank node carrying the
 * name — a link that looks dereferenceable and 404s is worse than none.
 */
export function contentSourceJsonLd(src: ResolvedSubgraphSource, repository?: string): Record<string, unknown> {
  switch (src.kind) {
    case "directory":
      return { kind: "directory", declaredIn: src.declaredIn };
    case "branch": {
      const web = forgeTreeUrl(repository, src.branch);
      return {
        ...(web ? { "@id": web } : {}),
        kind: "branch",
        branch: src.branch,
        keyedBy: src.keyedBy,
        declaredIn: src.declaredIn,
      };
    }
  }
}

/** `owner/repo` or a GitHub URL → the branch's tree URL; `undefined` for anything else. */
export function forgeTreeUrl(repository: string | undefined, branch: string): string | undefined {
  if (!repository) return undefined;
  const m = /^(?:https?:\/\/github\.com\/)?([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+?)(?:\.git)?\/?$/.exec(repository);
  if (!m) return undefined;
  return `https://github.com/${m[1]}/tree/${branch}`;
}

/**
 * The `@context` entry for `contentSource`: the property and its SCOPED terms
 * (JSON-LD 1.1 §4.1.8 — `kind` and `branch` are words another node could use
 * for something else, so they mean this only inside `contentSource`).
 *
 * Vocabulary REUSED before minted: `contentSource` is `dcterms:source` ("a
 * related resource from which the described resource is derived"), `kind` is
 * `dcterms:type`, `branch` is `dcterms:identifier`. Only `keyedBy` and
 * `sourceDeclaredIn` are minted, glossed in `vocabulary.ts`: no published
 * vocabulary says how entries are keyed on a repository branch, or which
 * configuration layer an answer came from.
 */
export function contentSourceContext(): Record<string, unknown> {
  return {
    "@id": propertyIri("contentSource"),
    "@context": {
      kind: propertyIri("contentSourceKind"),
      branch: propertyIri("contentSourceBranch"),
      keyedBy: termIri("keyedBy"),
      declaredIn: termIri("sourceDeclaredIn"),
    },
  };
}
