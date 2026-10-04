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
 * | `branch` | a declared repository branch, keyed by `commit` or `tip` | where a mount of it lands |
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
 * `mount`/`push` onto it), not this module's. The DECLARATION is the only
 * source of a branch's name (bean rva2, owner 2026-10-04: special-branches.json
 * leaves infrastructure). The resolver attaches no table row any more, and a
 * branch no directory declares is a health finding (`state:drift`), not a
 * resolver failure.
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

/**
 * How entries are keyed on a branch: one per `commit`, one live copy at the
 * `tip`, or one per published `route`.
 *
 * **THE one spelling of this enum.** `DirectoryStorageSchema.keyedBy` in
 * `cat-harness.ts` imports it rather than restating it, and that is not tidying:
 * the two were separate literals until this change, `cat-harness.ts` gained
 * `"route"` with bean `1j3q` and this one did not, so any declaration carrying
 * `keyedBy: "route"` parsed at the declaration layer and threw a ZodError the
 * moment {@link resolveSubgraphSource} read it —
 * `Invalid option: expected one of "commit"|"tip"`, measured on
 * `main@12b916e9a5`. The declaration said yes and the resolver said no, about
 * one field, and nothing compared them.
 *
 * **Widening an enum is SILENT where widening the union is loud.** The union
 * below documents that "a new kind is a new member here and a compile error at
 * every consumer that has not decided what to do with it". A new VALUE gets no
 * such help: every consumer guarding `keyedBy !== "tip"` kept compiling and
 * silently took its else-arm. That is why this change is four consumers wide and
 * not one line.
 *
 * What each value means, and why `route` is not a synonym for `tip` (the
 * difference is whether a write carries `expect`), is in
 * `DirectoryStorageSchema`'s docblock — one place, because the meaning is one
 * fact even though the enum is now read in two.
 */
export const KeyedBySchema = z.enum(["commit", "tip", "route"]);
export type KeyedBy = z.infer<typeof KeyedBySchema>;

/** A branch-name PREFIX for a family of branches: a plain branch name ending in `/`. */
export const BranchPrefixSchema = z
  .string()
  .regex(/^(?!-)(?!refs\/)[A-Za-z0-9._/-]+\/$/, "a plain branch prefix ending in /, e.g. cat/fhir-harness/fhir-ast/")
  .refine((b) => !b.includes("..") && !b.includes("//") && !b.startsWith("/"), "not a valid branch prefix");

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
 * The content is a FAMILY of branches, one per key: `<branchPrefix><key>`,
 * where `keyFrom` says in words what the key is (an IG's package id; a Lean
 * package and toolchain). Bean `lehh`, owner 2026-10-04 (option 1 of 3): a
 * branch-only graph is declared on its directory, with a mount path, as
 * fsh-guts is. `repository` says WHERE the family is (owner, 2026-10-04: an
 * IG's AST *"could also materialize a remote AST into local branch"*, and
 * *"similar for lean cache"*): absent, it is on this repository, a local copy
 * materialised here; present, it is read from that remote `owner/repo`.
 * Its own KIND rather than a fourth `keyedBy` on `branch`,
 * because a family has no single branch to read: a consumer that took the
 * `branch` arm would read a branch that does not exist as an empty graph. A new
 * union member is a compile error at every such consumer instead.
 */
export const FamilySourceSchema = z
  .object({
    kind: z.literal("family"),
    branchPrefix: BranchPrefixSchema,
    keyFrom: z.string().min(1),
    /** Where the family is: absent = this repository (materialised locally); `owner/repo` = read from that remote. */
    repository: z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/, "owner/repo").optional(),
  })
  .strict();

/**
 * A declared subgraph's content source. A discriminated union, so a new kind
 * is a new member here and a compile error at every consumer that has not
 * decided what to do with it.
 */
export const SubgraphSourceSchema = z.discriminatedUnion("kind", [DirectorySourceSchema, BranchSourceSchema, FamilySourceSchema]);
export type SubgraphSource = z.infer<typeof SubgraphSourceSchema>;
export type SubgraphSourceKind = SubgraphSource["kind"];

/** Every kind the union knows — for a reader that must refuse the rest (`branch-store mount`'s exit code). */
export const SUBGRAPH_SOURCE_KINDS: readonly SubgraphSourceKind[] = ["directory", "branch", "family"];

/** The config half: `<instance>.config.json` → `subgraphSources`, keyed by directory id. */
export const SubgraphSourceOverridesSchema = z.record(z.string().min(1), SubgraphSourceSchema);
export type SubgraphSourceOverrides = z.infer<typeof SubgraphSourceOverridesSchema>;

/** The #1764 shape, read only to map it. */
const LegacyStorageSchema = z.union([
  z.object({ branch: BranchNameSchema, keyedBy: KeyedBySchema }),
  // `storage`'s family form (bean `lehh`): the owner's spelling, mapped to `kind: "family"`.
  z.object({
    branchPrefix: BranchPrefixSchema,
    keyedBy: z.literal("family"),
    keyFrom: z.string().min(1),
    repository: z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/, "owner/repo").optional(),
  }),
]);

/** Which layer the answer came from — reported, so an override is never silent. */
export type SourceDeclaredIn = "default" | "declaration" | "storage" | "config";


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
      declaredIn: SourceDeclaredIn;
    }
  | {
      kind: "family";
      id: string;
      /** The entry's `path` — where a mount of ONE member of the family lands. */
      path: string;
      branchPrefix: string;
      keyFrom: string;
      /** The remote `owner/repo` the family is read from; absent when it is materialised on this repository. */
      repository?: string;
      declaredIn: SourceDeclaredIn;
    };





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
    src = "branchPrefix" in s
      ? { kind: "family", branchPrefix: s.branchPrefix, keyFrom: s.keyFrom, ...(s.repository ? { repository: s.repository } : {}) }
      : { kind: "branch", branch: s.branch, keyedBy: s.keyedBy };
    declaredIn = "storage";
  }
  switch (src.kind) {
    case "directory":
      return { kind: "directory", id: entry.id, path: entry.path, declaredIn };
    case "branch": {
      // Every NON-commit keying, not just `tip`. `directory-storage.test.ts`
      // states the principle this guard had already broken: *"A guard that named
      // one value would admit every value added after it — which is exactly how
      // `route` would have slipped past the check written for `tip`"*.
      // `ContentDirectorySchema` refuses both for a DECLARED entry, so this arm
      // is reached by a caller that builds an entry by hand — `audit-coverage.ts`
      // does — which is precisely where a schema cannot help.
      if (src.keyedBy !== "commit" && (entry.graphKinds ?? []).includes("qa")) {
        throw new Error(
          `directory "${entry.id}" is a \`qa\` subgraph: it is keyed by commit, and \`keyedBy: "${src.keyedBy}"\` is not. ` +
            `\`tip\` is for one-live-copy state (beans, todos); \`route\` is for regenerable published output. ` +
            `A QA verdict is addressed by the COMMIT it judges, so neither names the right unit.`,
        );
      }
      return {
        kind: "branch",
        id: entry.id,
        path: entry.path,
        branch: src.branch,
        keyedBy: src.keyedBy,
        declaredIn,
      };
    }
    case "family": {
      if ((entry.graphKinds ?? []).includes("qa")) {
        throw new Error(
          `directory "${entry.id}" is a \`qa\` subgraph: it is keyed by commit, and a branch family is not.`,
        );
      }
      const prefix = src.branchPrefix;
      return {
        kind: "family",
        id: entry.id,
        path: entry.path,
        branchPrefix: prefix,
        keyFrom: src.keyFrom,
        ...(src.repository ? { repository: src.repository } : {}),
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
    case "family":
      // The prefix is the family's identifier; no single branch has a tree URL.
      return {
        kind: "family",
        branch: src.branchPrefix,
        keyFrom: src.keyFrom,
        ...(src.repository ? { familyRepository: src.repository } : {}),
        declaredIn: src.declaredIn,
      };
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
      keyFrom: termIri("keyFrom"),
      familyRepository: termIri("familyRepository"),
      declaredIn: termIri("sourceDeclaredIn"),
    },
  };
}
