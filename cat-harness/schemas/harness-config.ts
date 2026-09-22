/**
 * Cross-folio dependency schema for folio-assistant instances.
 *
 * A folio-assistant instance can depend on other instances for content,
 * skills, and translation resolution. Dependencies are declared in
 * `harness.config.json` under `dependencies.folioAssistant` and walked
 * depth-first in listed order.
 *
 * ## The dependency model
 *
 * When loading skills and content, the folio-assistant agent starts with
 * the root folio and walks the dependency tree depth-first, in the order
 * dependencies are listed, overlaying content and skills on top. This
 * is the same methodology as FHIR/SUSHI dependencies **for the WALK** —
 * declared upstream, walked deterministically, later overlays earlier.
 *
 * **It is NOT the same for the PIN, and the unqualified claim was wrong**
 * (bean `dhvf`). SUSHI names a dependency as `packageId: version` and
 * resolves it against a registry; {@link FolioAssistantDependencySchema}
 * names a git `ref` that DEFAULTS TO THE DEFAULT BRANCH. A dependency pinned
 * to a branch is a different dependency on Tuesday and nothing notices —
 * the `xom7` shape, a thing that changes under you with nothing in the
 * repository saying so.
 *
 * The owner ruled 2026-09-20: *"sha is for staging, regernecing in published
 * SEMVER"*, with alignment to FHIR/SUSHI a hard constraint because some
 * instances ARE consumed from outside this monorepo. So the two tiers differ
 * and the rule lives where declarations are governed —
 * [`directory-conventions`](../skills/folio-core/directory-conventions.md)
 * §"Pinning a reference — a SHA may stage, only a version may publish" —
 * with `bun run check:published-refs` as its mechanical half. The full scheme
 * is `fsh-guts/proposals/instance-versioning.md`.
 *
 * ## What gets resolved across dependencies
 *
 * This table states what is WIRED, not what is intended. It was previously
 * optimistic in both directions — it claimed content blocks resolve (no such
 * function has ever existed) and that schemas and MCP tools never can (issue
 * #223 needs them to, and `schemas/contributions.ts` is how). Measured
 * 2026-09-18; re-measure before quoting it.
 *
 * | Resource | Resolved? | How |
 * |---|---|---|
 * | PO translations | ✅ | `translations/<locale>/`, fallback chain step 4 — the only path with a live consumer (`content/pipeline/po-resolve.ts`) |
 * | Kind headings | ✅ | `schemas/translation.ts` KIND_HEADINGS |
 * | Skills | ✅ | {@link resolveSkillDirs} reads each instance's DECLARATION, and `LOCAL_PACKAGES` in `src/tools/skill-fetch.ts` is built from it, so a dependency's packages are served. Two nearby call sites stay root-only on purpose — see its docs |
 * | Declared directories | ✅ | {@link declarationChain} + `resolveDirectories`, materialised by {@link materialiseDeclaredDirectories} |
 * | Block kinds | ✅ | {@link loadContributions} → `schemas/contributions.ts` |
 * | Adapters | ✅ | {@link loadContributions}, as a module specifier |
 * | MCP tools | ✅ | {@link loadContributions}, as registrar callbacks |
 * | Content blocks | ❌ | no resolver — the directory overlay was never written |
 * | QA criteria | ❌ | criterion definitions are still root-only |
 *
 * @module schemas/folio-config
 * @graphNode schema
 */

import { z } from "zod";

// ── Dependency types ────────────────────────────────────────────

/**
 * A single folio-assistant dependency.
 *
 * Dependencies can be specified by local path (for development or
 * when using git submodules) or by git URL (for CI and remote
 * resolution).
 */
export interface FolioAssistantDependency {
  /** Display name of the dependency (e.g. "smart-base", "qou-platform"). */
  name: string;

  /**
   * Local filesystem path to the dependency root. May be absolute or
   * relative to the folio root. Checked first — if present and the
   * directory exists, the git URL is not consulted.
   */
  path?: string;

  /**
   * Git clone URL for the dependency. Used when `path` is absent or
   * the directory does not exist. The agent should clone to a
   * deterministic location (e.g. `.deps/<name>/`).
   */
  git?: string;

  /**
   * Git ref to checkout after cloning (branch, tag, or commit SHA).
   * Defaults to the repository's default branch.
   */
  ref?: string;

  /**
   * What this dependency provides. Controls which resolution chains
   * consult it. Defaults to all three when absent.
   */
  provides?: Array<"skills" | "content" | "translations">;
}

/**
 * The `dependencies` section of `harness.config.json`.
 */
export interface HarnessConfigDependencies {
  /**
   * Other folio-assistant instances this folio depends on. Walked
   * depth-first in listed order, overlaying content and skills.
   */
  folioAssistant?: FolioAssistantDependency[];
}

/**
 * Translation configuration in `harness.config.json`.
 */
export interface TranslationConfig {
  /** Source language of the folio's content (BCP 47). Default: "en". */
  defaultLocale?: string;
  /** Target languages. Default: six UN languages. */
  supportedLocales?: string[];
  /** Directory for .pot/.po files. Default: "translations". */
  translationDir?: string;
  /** When true, only signed-off translations are rendered. Default: false. */
  officialOnly?: boolean;
}

/**
 * The full `harness.config.json` shape.
 *
 * Not all fields are covered here — only the ones that have TypeScript
 * consumers. The JSON file may carry additional fields (e.g. `adapter`,
 * `adapterModule`, `viewer`, `simulators`) that are consumed by other
 * parts of the system.
 */
export interface HarnessConfig {
  /** Content type — "document" or "paper". */
  contentType?: string;
  /** Adapter name — "document", "paper", or "dak". */
  adapter?: string;
  /** Path to the adapter module. */
  adapterModule?: string;

  /**
   * Module this instance contributes from when it is loaded as a DEPENDENCY.
   *
   * Resolved relative to this folio's own root. Its default export is called
   * with no arguments and returns a contribution object (or a promise of
   * one). Read only for dependencies — a root folio's own `contributes` is
   * ignored, because the root already *is* everything it would contribute.
   */
  contributes?: string;

  /** Translation pipeline configuration. */
  translation?: TranslationConfig;

  /** Cross-folio dependencies. */
  dependencies?: HarnessConfigDependencies;
}

// ── Zod schemas ─────────────────────────────────────────────────

export const FolioAssistantDependencySchema = z.object({
  name: z.string().min(1),
  path: z.string().optional(),
  git: z.string().url().optional(),
  ref: z.string().optional(),
  provides: z
    .array(z.enum(["skills", "content", "translations"]))
    .optional(),
}).refine(
  (dep) => dep.path !== undefined || dep.git !== undefined,
  { message: "Dependency must have at least one of 'path' or 'git'" },
);

export const HarnessConfigDependenciesSchema = z.object({
  folioAssistant: z.array(FolioAssistantDependencySchema).optional(),
});

export const TranslationConfigSchema = z.object({
  defaultLocale: z.string().default("en"),
  supportedLocales: z
    .array(z.string())
    .default(["ar", "zh", "en", "fr", "ru", "es"]),
  translationDir: z.string().default("translations"),
  officialOnly: z.boolean().default(false),
});

/**
 * Harness paths that are NOT part of the bean graph.
 *
 * ## What used to be here, and why it left
 *
 * This schema carried `workPlan` and `workflowState` — the bean store and the
 * workflow-instance store. They are gone. `beans/beans.json` declares them now
 * (see {@link file://../schemas/bean-graph.ts}), because it is the thing they
 * are nodes OF.
 *
 * That is a removal, not a relocation of the problem. The previous design had
 * the same path written in two places that could disagree — here and
 * `.beans.yml` — and `check:harness-dirs` existed to catch the drift. Declaring
 * the layout in the graph leaves ONE fewer place, not one more.
 *
 * `.beans.yml` still carries the defs path and still needs that check: the
 * `beans` binary is third-party and will never read our schema, so its config
 * must say where its store is. That duplication is unavoidable; leaving it
 * unchecked would not be.
 *
 * ## What stays
 *
 * `interaction` — the per-user preference file the session-start sweep reads
 * first. It is not bean content and is not a node of any graph: it describes
 * how to talk to the person at this machine, not what is being worked on.
 */
export const HarnessDirsSchema = z.object({
  /** Per-user interaction preferences, read at session start. */
  // declared-path-literal: a DEFAULT for a config key, which is read before
  // — and without — any declaration. Resolving it through `harness.json`
  // would make the fallback depend on the thing it is the fallback for. The
  // declaration and this default name the same place on purpose; the
  // `interaction` directory entry carries the other half of that pairing.
  interaction: z.string().default("interaction/interaction.json"),
});

export type HarnessDirs = z.infer<typeof HarnessDirsSchema>;

export const HarnessConfigSchema = z.object({
  contentType: z.string().optional(),
  adapter: z.string().optional(),
  adapterModule: z.string().optional(),
  contributes: z.string().optional(),
  harness: HarnessDirsSchema.optional(),
  translation: TranslationConfigSchema.optional(),
  dependencies: HarnessConfigDependenciesSchema.optional(),
});

// ── Dependency resolution ───────────────────────────────────────

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  describeRepository,
  type ContentTypeDisagreement,
  type ContentTypeMembership,
  type ContentTypeRegistry,
} from "./content-type";
import {
  instanceConfigFilename,
  findInstanceRoot,
  isKgOnlyDirectory,
  materialiseDirectories,
  ownDirectories,
  readDeclaration,
  resolveDirectories,
  type MaterialisedDirectory,
} from "./cat-harness";
// The `folio` graph kind is registered by CORE. This module is a LIBRARY, so it
// does NOT import that registration: a library's edge is inherited by every
// module that imports it, and the harness may not depend on core. The
// COMMAND that runs carries it — and since #840 every caller does, because
// the trigger sits at the foot of `cat-harness.ts` and a reader lives in that
// module, so loading it is a precondition of calling one.
//
// THIS COMMENT NAMED `check:composition-roots` AS THE GUARANTEE UNTIL
// 2026-09-22, in SEVEN files, AND THAT SCRIPT DOES NOT EXIST. `bun run
// check:composition-roots` exits "Script not found". The safety argument for
// a library omitting the registration rested on a gate nobody built, and no
// gate failed to say so — the same silence this repository keeps paying for.
// It is moot now rather than fixed: #840 made the registration automatic, so
// there is no longer a command that can forget it (bean `z9ax`).

/**
 * Resolved dependency — a dependency that has been located on disk.
 */
export interface ResolvedDependency {
  /** The original dependency declaration. */
  dependency: FolioAssistantDependency;
  /** Absolute path to the dependency root. */
  rootPath: string;
  /** The dependency's own harness config (if present). */
  config: HarnessConfig | null;
  /** Transitive dependencies (resolved recursively). */
  transitive: ResolvedDependency[];
}

/**
 * The names this file has had, and why it is now one PER INSTANCE.
 *
 * `folio.config.json` (to 2026-09-18) described the wrong thing: the file
 * configures the HARNESS — adapter selection, the skills directory, the
 * viewer, simulators, translation, the two work-plan stores — not the folio's
 * content. `harness.config.json` (to 2026-09-20) fixed the noun and kept a
 * flaw the split exposed: **one global filename in a checkout that holds
 * several instances.**
 *
 * The owner's ruling, 2026-09-20:
 *
 * > "mv to root at `cat-harness.config.json` as will all instantiated
 * > instances (not just materialized KGs). `root/` is where instantiation is
 * > tracked."
 *
 * So the file stays at the INSTANTIATION ROOT — the checkout, where instances
 * are tracked — and takes the instance's own name. This checkout already
 * holds `cat-harness` and `bootstrap`, with `folio-assist-core` arriving; one
 * filename between them could only ever configure one.
 *
 * ## Two roots, and they were never the same question (bean `zkgs`)
 *
 * | question | root |
 * |---|---|
 * | where is the folio's CONTENT | nearest declared folio directory — `findContentRepoRoot()` |
 * | where is this instance INSTANTIATED | the checkout root, holding `<name>.config.json` |
 *
 * `zkgs` is what happens when one walk answers both: `findContentRepoRoot()`
 * stopped at `cat-harness/` while the config sat one level up, so nothing
 * read it. `readDeclaredFolioProfile()` returned the THIRD state on a
 * repository that had declared `document`, which the config's own comment
 * says "runs every criterion, and the paper adapter's LaTeX-shaped axes fire
 * `critical` on prose that never reaches pdflatex" — and the sidecars proved
 * it was happening.
 */
// MOVED to `schemas/cat-harness.ts` on 2026-09-21 and re-exported here, so
// every existing importer keeps working. It had to move: that module now uses
// this filename for DISCOVERY — `<name>.config.json` is the declaration too
// since `harness.json` was excised — and this module imports THAT one, so the
// dependency only runs one way. The alternative was two functions spelling one
// filename, which is how a config and its declaration drift apart at the first
// rename.
export { instanceConfigFilename };

/**
 * The retired global name. Kept as a constant so `check:instance-config` can
 * FIND it, never so a reader can fall back to it.
 *
 * The hard break is the owner's instruction from the previous rename (bean
 * `6nfy`, "no longer read at all"), and `9ici` is why it is paired with a
 * gate this time rather than left to be discovered: a silent break left one
 * reader still honouring the dead name, which gave an old-name instance a
 * DETERMINED answer for one setting while fifteen others vanished. A break
 * nothing announces is the expensive kind.
 */
export const LEGACY_HARNESS_CONFIG = "harness.config.json";

/**
 * The instance owning `dir`, and the config filename it would use.
 *
 * `undefined` when nothing declares — a THIRD state, not "no config": a
 * directory that declares no instance has no name to compose one from, and
 * guessing would put the old global filename back under a new spelling.
 */
export function instanceConfigFor(dir: string): { root: string; name: string } | undefined {
  const root = findInstanceRoot(dir);
  if (root === undefined) return undefined;
  let name: string | undefined;
  try {
    name = readDeclaration(root)?.name;
  } catch {
    // UNREADABLE is the same third state as UNDECLARED for this question, and
    // it only became reachable here when `harness.json` was excised: the
    // declaration and the config used to be two files, so a malformed config
    // could not make `readDeclaration` throw. They are one file now, and a
    // caller asking "which instance owns this directory" cannot answer from a
    // file that will not parse. `readDeclaration` still throws for the callers
    // that need the declaration itself — this one needs a name.
    return undefined;
  }
  return name === undefined ? undefined : { root, name };
}

/**
 * Find the harness config in `dir`.
 *
 * **Every reader goes through this.** The path was previously built
 * independently at eleven sites — `src/index.ts`, four `content/pipeline`
 * modules, three scripts, the document adapter, `folio_init` and `qa-sweep`.
 * Eleven hardcoded literals is eleven places to miss when the name changes,
 * and the one that is missed is the one where a folio silently stops being
 * configured.
 *
 * Returns `undefined` when the file is absent — a legitimate state, not an
 * error: the platform itself has no harness config, and a bare repo has none
 * until `folio_init` writes one.
 *
 * ## `folio.config.json` is not read
 *
 * That was this file's name before 2026-09-18. It is **not** a fallback: a
 * folio still carrying the old name is not configured, rather than quietly
 * half-configured by a path nothing else agrees about. Rename the file.
 */
export function resolveHarnessConfigPath(dir: string): { path: string } | undefined {
  const inst = instanceConfigFor(dir);
  if (inst === undefined) return undefined;
  const file = instanceConfigFilename(inst.name);

  // From the instance root OUTWARD. The instance's own directory is tried
  // first so a standalone instance — a folio, where the instance root and the
  // checkout root are the same directory — needs no special case; then each
  // ancestor, because a checkout holding several instances tracks them at its
  // own root, which is the whole point of naming the file after the instance.
  //
  // BOUNDED at 12. An unbounded walk ends at `/`, where a stray
  // `cat-harness.config.json` in somebody's home directory would configure
  // this repository. The same bound `findContentRepoRoot` uses.
  let d = resolve(inst.root);
  for (let i = 0; i < 12; i++) {
    const p = join(d, file);
    if (existsSync(p)) return { path: p };
    const up = resolve(d, "..");
    if (up === d) break;
    d = up;
  }
  return undefined;
}

/**
 * Where the config IS, or where it would go.
 *
 * Every caller that wanted a path rather than a hit wrote
 * `resolveHarnessConfigPath(root)?.path ?? join(root, HARNESS_CONFIG)` —
 * seven of them. That tail is the eleventh hardcoded literal growing back,
 * in the callers of the function written to retire the first ten, and with
 * a per-instance filename it would now compose a name no instance uses.
 *
 * `undefined` when nothing declares, which is the same third state
 * {@link instanceConfigFor} reports and for the same reason: a directory with
 * no instance has no name to compose a filename from, and the honest answer
 * to "where would it go" is that nobody can say.
 *
 * The intended location is the INSTANCE ROOT rather than the checkout root.
 * A config that does not exist yet belongs to one instance and nothing else,
 * and writing it beside the declaration that names it is the placement a
 * reader can follow; the outward walk in {@link resolveHarnessConfigPath}
 * then finds it wherever a multi-instance checkout has chosen to keep it.
 */
export function expectedInstanceConfigPath(dir: string): string | undefined {
  const found = resolveHarnessConfigPath(dir);
  if (found) return found.path;
  const inst = instanceConfigFor(dir);
  return inst === undefined ? undefined : join(inst.root, instanceConfigFilename(inst.name));
}

/**
 * Read and parse the harness config from a directory.
 */
export function readHarnessConfig(dir: string): HarnessConfig | null {
  const found = resolveHarnessConfigPath(dir);
  if (!found) return null;
  const configPath = found.path;
  try {
    const raw = JSON.parse(readFileSync(configPath, "utf-8"));
    // Strip _comment fields before parsing
    const cleaned = JSON.parse(
      JSON.stringify(raw, (key, value) =>
        key === "_comment" ? undefined : value
      ),
    );
    return HarnessConfigSchema.parse(cleaned);
  } catch {
    // If parsing fails, return the raw JSON as a partial config
    try {
      return JSON.parse(readFileSync(configPath, "utf-8")) as HarnessConfig;
    } catch {
      return null;
    }
  }
}

/**
 * Resolve a single dependency to an absolute path.
 *
 * Tries `path` first (relative to folioRoot), then falls back to
 * checking `.deps/<name>/` for a previous clone. Does NOT clone —
 * that is the caller's responsibility.
 */
export function resolveDependencyPath(
  folioRoot: string,
  dep: FolioAssistantDependency,
): string | null {
  // Try explicit path
  if (dep.path) {
    const abs = dep.path.startsWith("/")
      ? dep.path
      : resolve(folioRoot, dep.path);
    if (existsSync(abs)) return abs;
  }

  // Try .deps/<name>/
  const depsDir = join(folioRoot, ".deps", dep.name);
  if (existsSync(depsDir)) return depsDir;

  return null;
}

/**
 * Resolve the full dependency tree depth-first.
 *
 * Walks `harness.config.json` dependencies in listed order, resolving
 * each to a path and recursing into its own dependencies. Cycle
 * detection prevents infinite loops.
 *
 * @param folioRoot - Absolute path to the folio root.
 * @param seen - Set of already-visited roots (for cycle detection).
 * @returns Array of resolved dependencies in depth-first order.
 */
export function resolveDependencyTree(
  folioRoot: string,
  seen: Set<string> = new Set(),
): ResolvedDependency[] {
  const absRoot = resolve(folioRoot);
  if (seen.has(absRoot)) return []; // cycle
  seen.add(absRoot);

  const config = readHarnessConfig(absRoot);
  const deps = config?.dependencies?.folioAssistant ?? [];
  const resolved: ResolvedDependency[] = [];

  for (const dep of deps) {
    const rootPath = resolveDependencyPath(absRoot, dep);
    if (!rootPath) continue;

    const depConfig = readHarnessConfig(rootPath);
    const transitive = resolveDependencyTree(rootPath, seen);

    resolved.push({
      dependency: dep,
      rootPath,
      config: depConfig,
      transitive,
    });
  }

  return resolved;
}

/**
 * Flatten the dependency tree into a depth-first ordered list.
 *
 * Transitive dependencies appear before the dependency that declared
 * them, so the overlay order is: deepest first, root last — meaning
 * the root's files override everything, which is the desired behavior
 * for skills and content overlay.
 */
export function flattenDependencies(
  tree: ResolvedDependency[],
): ResolvedDependency[] {
  const flat: ResolvedDependency[] = [];
  for (const dep of tree) {
    flat.push(...flattenDependencies(dep.transitive));
    flat.push(dep);
  }
  return flat;
}

/**
 * The declaration chain for an instance: deepest dependency first, root last.
 *
 * This is the argument `resolveDirectories` in `schemas/cat-harness.ts` asks
 * for and documents ("callers usually get this from
 * `flattenDependencies(resolveDependencyTree(root))` plus the root itself") and
 * which, until now, nothing built — `resolveDirectories` had no caller outside
 * its own tests, the same gap `resolveSkillDirs` carries and this file's own
 * status table records. A resolver with no caller is a declaration nobody
 * reads, which is how `uploads/` and `library/` came to be described in three
 * documents and declared in none.
 *
 * Root LAST so a root redeclaring an inherited id wins, matching the overlay
 * order `flattenDependencies` documents and `resolveDirectories` relies on.
 */
export function declarationChain(
  folioRoot: string,
): Array<{ name: string; root: string; own?: boolean }> {
  const flat = flattenDependencies(resolveDependencyTree(folioRoot));
  const chain: Array<{ name: string; root: string; own?: boolean }> = flat.map(
    (d) => ({ name: d.dependency.name ?? d.rootPath, root: d.rootPath }),
  );
  chain.push({ name: "(root)", root: resolve(folioRoot), own: true });
  return chain;
}

/**
 * Create every directory this instance declares or inherits, if absent.
 *
 * THE ONE ANSWER for "which directories does an instance have", called by
 * every getting-started / instantiation path so there is not a second one
 * free to disagree. Discovery walks the dependency tree; creation happens in
 * `folioRoot` — an instance inherits the CONVENTION (an id and a relative
 * path), not a licence to write into a dependency's checkout.
 *
 * Returns what it did, so a caller can report it rather than guess. Idempotent.
 */
export function materialiseDeclaredDirectories(
  folioRoot: string,
  opts: { dryRun?: boolean } = {},
): MaterialisedDirectory[] {
  const dirs = resolveDirectories(declarationChain(folioRoot));
  return materialiseDirectories(dirs, folioRoot, opts);
}

/**
 * Every instance's knowledge-graph directories, in overlay order.
 *
 * Deepest dependency first, root last — so an agent loads them in order and a
 * later entry overrides an earlier one **for the same skill name**. The
 * directories themselves all stay: a dependency's skills and the root's are
 * both real.
 *
 * ## Read from the declaration, not from a literal
 *
 * This used to be `join(dep.rootPath, "skills")`. `AGENTS.md` is explicit that
 * *"hardcoding a path is how a skill goes missing the moment the layout
 * moves"*, and an instance may put its knowledge graph anywhere — in THIS
 * repository the declared id is `cat-harness` while the path is `skills/`,
 * which is exactly the id/path split the declaration exists to absorb.
 *
 * ## Why not `resolveDirectories`
 *
 * Because it answers a different question, and asking it this one silently
 * loses dependencies — it overrides **by id**, so a dependency and a root that
 * both declare `cat-harness` collapse to the root's entry alone. {@link
 * ownDirectories} resolves per instance instead, which is what an overlay
 * needs. That mismatch is the likeliest reason this function reached for a
 * literal in the first place, and why it sat with no caller.
 *
 * ## `provides` still opts a dependency out
 *
 * A dependency declaring `provides` without `"skills"` contributes none, and
 * that is kept deliberately: it is the only way an instance can depend on
 * another for content or translations without inheriting its skills.
 *
 * ## Its consumer, and the two call sites that are still wrong for the job
 *
 * `LOCAL_PACKAGES` in `src/tools/skill-fetch.ts` is built from this — so a
 * DEPENDENCY's skill packages are served, which is the overlay `AGENTS.md`
 * records as outstanding Phase 0.1 work.
 *
 * Two nearby call sites deliberately still do NOT use it, because each would
 * break in a specific way:
 *
 * 1. **`kgDirectories` in `scripts/known-skills.ts` composes IDS.** Its
 *    `path` field becomes a repo-relative skill id (`skillMdDirs`). Feeding a
 *    dependency's directory in would mint ids that look repo-relative but
 *    resolve into another checkout — wrong in a way that reads as correct.
 * 2. **`kgRoots(root)[0]` is taken as "the root's graph"** by
 *    `src/tools/workflow.ts` and `src/workflow/gate.ts`. Overlay order is
 *    deepest-dependency-FIRST, so making that function overlay-aware would
 *    hand those callers a dependency's role graph instead of the root's.
 */
export function resolveSkillDirs(folioRoot: string): string[] {
  const dirs: string[] = [];

  for (const dep of flattenDependencies(resolveDependencyTree(folioRoot))) {
    if (dep.dependency.provides && !dep.dependency.provides.includes("skills")) {
      continue;
    }
    for (const d of ownDirectories({ name: dep.dependency.name, root: dep.rootPath })) {
      if (isKgOnlyDirectory(d) && existsSync(d.absPath)) dirs.push(d.absPath);
    }
  }

  // The root last, so its skills win on a name collision.
  for (const d of ownDirectories({ name: "(root)", root: resolve(folioRoot), own: true })) {
    if (isKgOnlyDirectory(d) && existsSync(d.absPath)) dirs.push(d.absPath);
  }

  // De-duplicated: a diamond dependency reaches the same instance twice, and a
  // directory scanned twice reports every skill in it twice.
  return [...new Set(dirs)];
}

/**
 * Get the combined translation directories in overlay order.
 *
 * Returns absolute paths to translations/ directories, deepest
 * dependency first, root last.
 */
export function resolveTranslationDirs(folioRoot: string): string[] {
  const tree = resolveDependencyTree(folioRoot);
  const flat = flattenDependencies(tree);
  const dirs: string[] = [];

  for (const dep of flat) {
    if (
      dep.dependency.provides &&
      !dep.dependency.provides.includes("translations")
    ) {
      continue;
    }
    const depConfig = dep.config;
    const transDir = depConfig?.translation?.translationDir ?? "translations";
    const abs = join(dep.rootPath, transDir);
    if (existsSync(abs)) dirs.push(abs);
  }

  // Root's translations last (highest priority)
  const rootConfig = readHarnessConfig(folioRoot);
  const rootTransDir = rootConfig?.translation?.translationDir ?? "translations";
  const rootAbs = join(folioRoot, rootTransDir);
  if (existsSync(rootAbs)) dirs.push(rootAbs);

  return dirs;
}

// ── Contribution loading (issue #223, Phase 0.1) ────────────────

/**
 * Walk the dependency tree and collect every dependency's contributions.
 *
 * Load-time registration: each dependency naming a `contributes` module has
 * that module imported and its default export called, and the result handed
 * to the registry. Order is depth-first, deepest dependency first — the same
 * order {@link resolveSkillDirs} overlays in, so a reader only has to learn
 * one traversal.
 *
 * **Order is significant, and collisions still do not resolve by it.** That is
 * the deliberate shape of this mechanism: registration is cheap and familiar,
 * but a kind claimed twice throws rather than letting whoever loaded last
 * win. See `schemas/contributions.ts` for why last-writer-wins was refused.
 *
 * A dependency that declares no `contributes` module contributes nothing;
 * that is the normal case and not an error. A dependency whose `contributes`
 * module is missing or does not export a callable default **is** an error —
 * it is a stated intention that silently did nothing, which is the failure
 * mode `AGENTS.md` records under "move wiring and script together".
 *
 * @param folioRoot - Absolute path to the ROOT folio.
 * @param registry - Optional existing registry to accumulate into.
 */
export interface ContributionSink<C extends { name: string }> {
  register(contribution: C): void;
}

export async function loadContributions<C extends { name: string }, S extends ContributionSink<C>>(
  folioRoot: string,
  registry: S,
): Promise<S> {
  const flat = flattenDependencies(resolveDependencyTree(folioRoot));

  for (const dep of flat) {
    const spec = dep.config?.contributes;
    if (!spec) continue;

    const modulePath = resolve(dep.rootPath, spec);
    if (!existsSync(modulePath)) {
      throw new Error(
        `folio dependency "${dep.dependency.name}" declares contributes: ` +
          `"${spec}", but ${modulePath} does not exist. A declared ` +
          `contribution that cannot load must fail loudly — silently ` +
          `contributing nothing is how a dependency appears wired and is not.`,
      );
    }

    const mod: unknown = await import(modulePath);
    const fn = (mod as { default?: unknown }).default;
    if (typeof fn !== "function") {
      throw new Error(
        `folio dependency "${dep.dependency.name}" contributes module ` +
          `${modulePath} has no callable default export.`,
      );
    }

    const contribution = (await (fn as () => C | Promise<C>)());
    // The dependency entry's name is authoritative over whatever the module
    // says about itself: the root declared the name, and a contributor that
    // could rename itself could impersonate another contributor's namespace
    // and turn a collision into a silent merge.
    //
    // `root` is pinned here for the same reason and is not the same field as
    // `name`: it is where the contributor's FILES are, and a contributed QA
    // checker's source file is resolved against it in order to be
    // freshness-hashed. A contributor that could name its own root could point
    // the sweep at bytes it does not own, and the resulting `script_hash`
    // would be computed over a file the contribution never mentions.
    //
    // The spread widens `C` to `C & { name: string; root: string }`, which is
    // C's own shape with two fields pinned; the cast states that rather than
    // loosening the parameter.
    registry.register({
      ...contribution,
      name: dep.dependency.name,
      root: dep.rootPath,
    } as C);
  }

  return registry;
}

// ── What a repository IS, closed under the dependency tree ──────────

/**
 * One type asserted somewhere in the dependency closure, and by whom.
 *
 * `by` is the dependency NAME that carried the marker, or `"(root)"`. It is
 * the field that makes the closure honest: "this repository is a DAK" and
 * "something this repository depends on is a DAK" are different claims, and a
 * flattened set cannot tell them apart.
 */
export interface ClosedContentType extends ContentTypeMembership {
  by: string;
  /** `true` when the marker is on the root itself rather than a dependency. */
  own: boolean;
}

export interface ClosedRepositoryDescription {
  types: ClosedContentType[];
  /**
   * Disagreements WITHIN one instance, each tagged with the instance.
   *
   * Deliberately not computed ACROSS instances. Two repositories naming
   * different `canonicalUrl`s is not a disagreement — it is two repositories,
   * and reporting it as a conflict would make every dependency tree look
   * broken. See {@link describeRepositoryClosure}.
   */
  disagreements: Array<ContentTypeDisagreement & { instance: string }>;
}

/**
 * Ask a repository what it is, INCLUDING what its dependencies are.
 *
 * `79t3`: *"The set is closed under the dependency tree. Resolving
 * dependencies yields a set of overlaying instances: declaring
 * `folio-assistant` implies `cat-harness`, because folio-assistant depends on
 * it."*
 *
 * ## Why it lives here and not beside `describeRepository`
 *
 * `schemas/content-type.ts` reads a root and nothing else, on purpose: the
 * dependency resolver lives in THIS module, and importing it there would make
 * the type registry depend on the thing that should depend on it. So closure
 * is composed at the layer that already owns the walk — `resolveDependencyTree`
 * is three functions up — rather than the walk being pushed down.
 *
 * ## Membership is ATTRIBUTED, never merged
 *
 * The result is a list rather than a set, and every entry says which instance
 * carried the marker. A union would answer "is this tree a DAK?" and lose "is
 * THIS repository a DAK?", and those differ in the case the bean cites: a
 * folio depending on a WHO adapter is not itself a DAK.
 *
 * A type asserted by both the root and a dependency appears TWICE, with
 * different `by`. That is not a duplicate to collapse — it is two repositories
 * each making the claim, which is what the tree actually says.
 *
 * ## Disagreements stay INSIDE an instance
 *
 * Cross-instance facts are not compared. Two repositories declaring different
 * `canonicalUrl`s are two repositories, not a conflict, and reporting it as
 * one would make every non-trivial dependency tree look broken — the false
 * positive that would get the check switched off within a week.
 */
export function describeRepositoryClosure(
  folioRoot: string,
  registry?: ContentTypeRegistry,
): ClosedRepositoryDescription {
  const types: ClosedContentType[] = [];
  const disagreements: ClosedRepositoryDescription["disagreements"] = [];

  const visit = (root: string, by: string, own: boolean): void => {
    const d = describeRepository(root, registry);
    for (const t of d.types) types.push({ ...t, by, own });
    for (const x of d.disagreements) disagreements.push({ ...x, instance: by });
  };

  // Dependencies first, root last — the same depth-first order
  // `resolveSkillDirs` uses, so a reader comparing the two sees one traversal
  // rather than two conventions.
  for (const dep of flattenDependencies(resolveDependencyTree(folioRoot))) {
    visit(dep.rootPath, dep.dependency.name, false);
  }
  visit(resolve(folioRoot), "(root)", true);

  return { types, disagreements };
}
