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
/**
 * The ONE keying enum. `DirectoryStorageSchema.keyedBy` in `cat-harness.ts`
 * imports this rather than restating it, and bean `1j3q` is why: that field
 * held its own copy, `route` was added there and not here, and a route-keyed
 * declaration then parsed and threw a ZodError inside
 * {@link resolveSubgraphSource}. A schema change somebody has to make is only
 * a guard if there is one schema to change.
 *
 * `route-family` (bean `xp5j`) is added HERE for that reason. The branch that
 * introduced it first added a fourth value to the copy in `cat-harness.ts` and
 * reproduced `1j3q` one keying later — accepted by the declaration, rejected by
 * every consumer that parses through this.
 */
export const KeyedBySchema = z.enum(["commit", "tip", "route", "route-family"]);
export type KeyedBy = z.infer<typeof KeyedBySchema>;

/**
 * ## `route-family`, and why its reasoning is HERE
 *
 * One entry per MEMBER of a family under a directory's path, the member
 * supplied at publish time rather than declared — the `STAGING/<slug>/`
 * previews on `gh-pages`, one per open branch. Bean `xp5j`.
 *
 * A fourth keying rather than a flag on `route`, because `route` must not carry
 * two write contracts for the same reason it is not a synonym for `tip`. Three
 * things differ, each a decision rather than a detail:
 *
 * 1. **The member key is UNTRUSTED** — it derives from a branch name, and
 *    `.github/workflows/feature-staging.yml` states a branch name is
 *    attacker-controlled on a fork PR. {@link RouteMemberSchema} is the
 *    validation.
 * 2. **Source and destination differ.** A declared `route` is published FROM
 *    the declared path; a family member is built into a local directory and
 *    published to a route named at publish time, so the two cannot be one field.
 * 3. **A member can be REMOVED.** `route`'s contract has no case for it — "a
 *    generator that stops emitting a page must stop publishing it" — but a
 *    member's branch can be deleted, and `feature-staging.yml` already deletes
 *    `STAGING/<slug>` on PR close.
 *
 * Like `route`, a `route-family` write carries NO `expect`: a member is a
 * rendering authored by nobody, so the newer generation wins.
 *
 * This text sits beside the enum rather than on
 * `DirectoryStorageSchema.keyedBy` in `cat-harness.ts`, and that is `1j3q`'s
 * rule applied to prose: the keying has ONE definition, so it gets one
 * description. It also keeps this branch out of a file `main` edits constantly
 * — the earlier arrangement put 67 lines there and `merge-main-bot` refused
 * every sweep on it.
 */

/**
 * A `route-family` MEMBER key — one path segment, from untrusted input.
 *
 * The member becomes a path on the published branch, so a traversal here writes
 * OUTSIDE the family's prefix — over the site at `/` in the worst case. This
 * REFUSES rather than sanitises: a key that had to be cleaned up is a key whose
 * author meant something else, and a sanitiser's output is a value nobody
 * declared.
 *
 * ONE SEGMENT is the load-bearing rule. Refusing `/` outright disposes of
 * `..`, `//`, absolute paths and deep traversal in a single rule rather than as
 * four patterns somebody has to keep complete. No dot-prefixed segment (the
 * `kg-core/directory-conventions` guard, written to stay correct if a member
 * ever stops being one segment); no leading dash, so a member cannot be read as
 * a flag.
 */
export const RouteMemberSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, "one path segment: alphanumerics, dot, dash, underscore, not starting with a dot or dash")
  .refine((m) => !m.split("/").some((seg) => seg.startsWith(".")), "no dot-prefixed segment")
  .refine((m) => m !== "." && m !== ".." && !m.includes(".."), "not a traversal");
export type RouteMember = z.infer<typeof RouteMemberSchema>;

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
