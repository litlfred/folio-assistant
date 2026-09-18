/**
 * Cross-folio dependency schema for folio-assistant instances.
 *
 * A folio-assistant instance can depend on other instances for content,
 * skills, and translation resolution. Dependencies are declared in
 * `folio.config.json` under `dependencies.folioAssistant` and walked
 * depth-first in listed order.
 *
 * ## The dependency model
 *
 * When loading skills and content, the folio-assistant agent starts with
 * the root folio and walks the dependency tree depth-first, in the order
 * dependencies are listed, overlaying content and skills on top. This
 * is the same methodology as FHIR/SUSHI dependencies — declared
 * upstream, walked deterministically, later overlays earlier.
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
 * | Skills | ⚠️ | {@link resolveSkillDirs} exists and returns the overlay order; **no caller yet** |
 * | Block kinds | ✅ | {@link loadContributions} → `schemas/contributions.ts` |
 * | Adapters | ✅ | {@link loadContributions}, as a module specifier |
 * | MCP tools | ✅ | {@link loadContributions}, as registrar callbacks |
 * | Content blocks | ❌ | no resolver — the directory overlay was never written |
 * | QA criteria | ❌ | criterion definitions are still root-only |
 *
 * @module schemas/folio-config
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
 * The `dependencies` section of `folio.config.json`.
 */
export interface FolioConfigDependencies {
  /**
   * Other folio-assistant instances this folio depends on. Walked
   * depth-first in listed order, overlaying content and skills.
   */
  folioAssistant?: FolioAssistantDependency[];
}

/**
 * Translation configuration in `folio.config.json`.
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
 * The full `folio.config.json` shape.
 *
 * Not all fields are covered here — only the ones that have TypeScript
 * consumers. The JSON file may carry additional fields (e.g. `adapter`,
 * `adapterModule`, `viewer`, `simulators`) that are consumed by other
 * parts of the system.
 */
export interface FolioConfig {
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
   * with no arguments and returns a {@link FolioContribution} (or a promise of
   * one). Read only for dependencies — a root folio's own `contributes` is
   * ignored, because the root already *is* everything it would contribute.
   */
  contributes?: string;

  /** Translation pipeline configuration. */
  translation?: TranslationConfig;

  /** Cross-folio dependencies. */
  dependencies?: FolioConfigDependencies;
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

export const FolioConfigDependenciesSchema = z.object({
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
 * Where the agent harness keeps the two stores a person actually needs to find.
 *
 * `workPlan` is the bean store: WHAT is being worked on. `workflowState` is one
 * JSON file per running BPMN instance: WHERE IT GOT TO. They answer the two
 * halves of one question, so they live adjacent — `beans/` and `beans/workflow/`
 * — and at top level rather than behind a dot.
 *
 * ## Why they are declared rather than assumed
 *
 * Both paths were previously hard-coded in three places that could disagree:
 * `.beans.yml` (which the `beans` CLI reads), `WORKFLOW_DIR` in
 * `workflow/store.ts`, and every skill and diagram that named a path in prose.
 * Declaring them here makes the config the one place a folio states the answer,
 * and gives a tool something to read instead of a convention to re-derive.
 *
 * ## `.beans.yml` is still the CLI's own config, and still authoritative for it
 *
 * The `beans` binary does not read `folio.config.json` and never will — it is a
 * third-party tool. So `workPlan` here must MATCH `beans.path` in `.beans.yml`,
 * and `bun run check:harness-dirs` fails when they disagree. Two configs that
 * can drift is exactly the defect this repo keeps paying for; the check is what
 * makes the duplication safe rather than merely documented.
 */
export const HarnessDirsSchema = z.object({
  /** Bean store. Must equal `beans.path` in `.beans.yml`. */
  workPlan: z.string().default("beans"),
  /** One JSON file per running BPMN process instance. */
  workflowState: z.string().default("beans/workflow"),
  /** Per-user interaction preferences, read at session start. */
  interaction: z.string().default(".folio/interaction.json"),
});

export type HarnessDirs = z.infer<typeof HarnessDirsSchema>;

export const FolioConfigSchema = z.object({
  contentType: z.string().optional(),
  adapter: z.string().optional(),
  adapterModule: z.string().optional(),
  contributes: z.string().optional(),
  harness: HarnessDirsSchema.optional(),
  translation: TranslationConfigSchema.optional(),
  dependencies: FolioConfigDependenciesSchema.optional(),
});

// ── Dependency resolution ───────────────────────────────────────

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { ContributionRegistry, type FolioContribution } from "./contributions";

/**
 * Resolved dependency — a dependency that has been located on disk.
 */
export interface ResolvedDependency {
  /** The original dependency declaration. */
  dependency: FolioAssistantDependency;
  /** Absolute path to the dependency root. */
  rootPath: string;
  /** The dependency's own folio.config.json (if present). */
  config: FolioConfig | null;
  /** Transitive dependencies (resolved recursively). */
  transitive: ResolvedDependency[];
}

/**
 * Read and parse a folio.config.json from a directory.
 */
export function readFolioConfig(dir: string): FolioConfig | null {
  const configPath = join(dir, "folio.config.json");
  if (!existsSync(configPath)) return null;
  try {
    const raw = JSON.parse(readFileSync(configPath, "utf-8"));
    // Strip _comment fields before parsing
    const cleaned = JSON.parse(
      JSON.stringify(raw, (key, value) =>
        key === "_comment" ? undefined : value
      ),
    );
    return FolioConfigSchema.parse(cleaned);
  } catch {
    // If parsing fails, return the raw JSON as a partial config
    try {
      return JSON.parse(readFileSync(configPath, "utf-8")) as FolioConfig;
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
 * Walks `folio.config.json` dependencies in listed order, resolving
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

  const config = readFolioConfig(absRoot);
  const deps = config?.dependencies?.folioAssistant ?? [];
  const resolved: ResolvedDependency[] = [];

  for (const dep of deps) {
    const rootPath = resolveDependencyPath(absRoot, dep);
    if (!rootPath) continue;

    const depConfig = readFolioConfig(rootPath);
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
 * Get the combined skill directories in overlay order.
 *
 * Returns absolute paths to skills/ directories, deepest dependency
 * first, root last. The agent should load skills from each in order,
 * with later entries overriding earlier for the same skill name.
 */
export function resolveSkillDirs(folioRoot: string): string[] {
  const tree = resolveDependencyTree(folioRoot);
  const flat = flattenDependencies(tree);
  const dirs: string[] = [];

  for (const dep of flat) {
    if (dep.dependency.provides && !dep.dependency.provides.includes("skills")) {
      continue;
    }
    const skillsDir = join(dep.rootPath, "skills");
    if (existsSync(skillsDir)) dirs.push(skillsDir);
  }

  // Root's skills last (highest priority)
  const rootSkills = join(folioRoot, "skills");
  if (existsSync(rootSkills)) dirs.push(rootSkills);

  return dirs;
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
  const rootConfig = readFolioConfig(folioRoot);
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
export async function loadContributions(
  folioRoot: string,
  registry: ContributionRegistry = new ContributionRegistry(),
): Promise<ContributionRegistry> {
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

    const contribution = (await (fn as () => FolioContribution | Promise<FolioContribution>)()) ;
    // The dependency entry's name is authoritative over whatever the module
    // says about itself: the root declared the name, and a contributor that
    // could rename itself could impersonate another contributor's namespace
    // and turn a collision into a silent merge.
    registry.register({ ...contribution, name: dep.dependency.name });
  }

  return registry;
}
