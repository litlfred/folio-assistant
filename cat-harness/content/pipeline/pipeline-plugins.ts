/**
 * The slots through which GENERIC pipeline code reaches a higher layer's code.
 *
 * ## Why (bean `squu`, owner ruling 2026-10-01 ~18:15)
 *
 * The sci-bound pipeline files — the Lean lexer, the LaTeX preflight, Lean
 * coverage, one folio's chapter profiles — go straight to
 * `folio-assistant-sci`, the top layer. A generic module that imports one of
 * them would, after that move, be a lower → higher import, which
 * `check:import-direction` rejects. So the generic caller asks for a KIND here
 * and the science layer fills it through its `contributes` module
 * (`folio-assistant-sci/contributions.ts`). Neither side names the other's
 * files: the edge is inverted, not hidden.
 *
 * ## The shape is the one the repository already uses
 *
 * A slot is a {@link PipelinePluginContribution} on {@link ContributionRegistry},
 * loaded by the same dependency walk as content adapters, QA checkers, render
 * targets and MCP tools (`schemas/contributions.ts`). A kind claimed by two
 * contributors THROWS — the `contributions.ts` rule, kept for the reason it was
 * made: which Lean lexer runs must not depend on the order dependencies are
 * listed in.
 *
 * ## Why the registry is held here, and filled lazily
 *
 * `ContributionRegistry` is deliberately an instance, not module state. The
 * callers here are synchronous and deep — a checker in the sweep's hot loop, a
 * module-load side effect, a build step — and threading a registry through
 * each would change the signatures the QA dispatch tables are keyed on. So
 * this module holds ONE registry for the process, filled on first use from the
 * running folio's declared dependencies (`loadContributionsSync` from
 * `contributionsRoot()`), and a test or a caller that has already loaded one
 * hands it over with {@link usePipelinePluginRegistry}.
 *
 * Lazy is what keeps behaviour identical: every entry point that imported a
 * leaf directly — the sweep, the build, `q-usage-audit`, a test — reaches the
 * same function through the slot with no new setup step to forget.
 *
 * ## An unfilled slot is an error that says what is missing
 *
 * {@link pipelinePlugin} throws {@link UnregisteredPipelinePluginError}, naming
 * the kind, the root whose dependencies were walked, and which slots WERE
 * filled. It is never defaulted: a Lean lexer that silently does nothing would
 * make every Lean-sibling check pass. A caller for whom absence is a real,
 * reportable state uses {@link optionalPipelinePlugin} and says so.
 *
 * @module content/pipeline/pipeline-plugins
 */

import { ContributionRegistry, type FolioContribution } from "../../schemas/contributions";
import { loadContributionsSync } from "../../schemas/harness-config";
import { contributionsRoot } from "./repo-root";

// ── The slots, and what fills each ─────────────────────────────────
//
// Shapes are restated structurally rather than imported from the modules that
// implement them: importing even a type from a sci-bound file is a reference
// from this layer into that one.

/** A declaration's name and its offset in comment-stripped Lean source. */
export interface LeanDeclStart {
  name: string;
  at: number;
}

/** Lean source lexing — implemented by `lean-lexer.ts`. */
export interface LeanLexerPlugin {
  /** Blank comments, preserving offsets and line numbers. */
  stripLeanComments(src: string): string;
  /** Every declaration start in comment-stripped source, in order. */
  declarationStarts(stripped: string): LeanDeclStart[];
}

/** A folio's default chapter profiles — implemented by `_folio-chapter-profiles.qou.ts`. */
export interface ChapterProfileDefaultsPlugin {
  /** Configure `chapter-profile-registry-di` with this folio's profiles. */
  registerDefaults(): void;
}

/** One issue the LaTeX preflight found. */
export interface LatexPreflightIssue {
  check: string;
  macro: string;
  file: string;
  line: number;
  message: string;
}

/** The LaTeX preflight's verdict on one compile unit. */
export interface LatexPreflightResult {
  ok: boolean;
  issues: LatexPreflightIssue[];
  definedCount: number;
  usedCount: number;
  allowlistCount: number;
  filesScanned: number;
}

/** Macro lint over a generated compile unit — implemented by `latex-preflight.ts`. */
export interface LatexPreflightPlugin {
  runPreflight(mainTexPath: string): LatexPreflightResult;
}

/** Lean coverage — implemented by `scripts/lean-coverage.ts`. */
export interface LeanCoveragePlugin {
  /** The `.lean` file a block's manifest points at, or `null`. */
  resolveLeanFile(tsPath: string, src: string, leanRoot: string): string | null;
  /** Whether a `.lean` file is sorry-free, and its validation state. */
  leanFileStatus(leanPath: string): {
    sorryFree: boolean;
    validation: "stub" | "leanok" | "not_checked";
  };
  /** A paper's coverage statistics. Opaque here; `readme-sections.ts` types the fields it reads. */
  computeStats(paperDir: string, contentRoot: string): unknown;
}

/** Every slot, keyed by the kind string a contributor registers under. */
export interface PipelinePlugins {
  "lean-lexer": LeanLexerPlugin;
  "chapter-profile-defaults": ChapterProfileDefaultsPlugin;
  "latex-preflight": LatexPreflightPlugin;
  "lean-coverage": LeanCoveragePlugin;
}

export type PipelinePluginKind = keyof PipelinePlugins;

/** The kinds, as data — for reports and for the test that pins the set. */
export const PIPELINE_PLUGIN_KINDS: readonly PipelinePluginKind[] = [
  "lean-lexer",
  "chapter-profile-defaults",
  "latex-preflight",
  "lean-coverage",
];

// ── The process registry ───────────────────────────────────────────

/** Thrown when a slot is asked for and nothing filled it. */
export class UnregisteredPipelinePluginError extends Error {
  constructor(
    readonly kind: string,
    readonly root: string | undefined,
    readonly filled: string[],
  ) {
    super(
      `No dependency contributes the pipeline plugin "${kind}". ` +
        (root === undefined
          ? "The registry in use was supplied by the caller, not loaded from a folio. "
          : `Walked the dependencies declared from ${root}. `) +
        (filled.length
          ? `Slots that ARE filled: ${filled.join(", ")}. `
          : "No slot is filled at all. ") +
        `"${kind}" is generic pipeline code reaching a higher layer's code ` +
        `(normally folio-assistant-sci): declare that instance as a dependency, ` +
        `or have its contributes module list a pipelinePlugins entry of this kind.`,
    );
    this.name = "UnregisteredPipelinePluginError";
  }
}

let registry: ContributionRegistry | undefined;
/** Where `registry` was loaded from; `undefined` when a caller supplied it. */
let loadedFrom: string | undefined;

/**
 * Use this registry for every slot lookup in the process, or `undefined` to
 * go back to loading lazily from the running folio.
 *
 * For tests, and for an entry point that has already loaded contributions
 * from a root other than {@link contributionsRoot} and wants the slots to agree
 * with them.
 */
export function usePipelinePluginRegistry(next: ContributionRegistry | undefined): void {
  registry = next;
  loadedFrom = undefined;
}

function current(): ContributionRegistry {
  if (!registry) {
    const root = contributionsRoot();
    registry = loadContributionsSync<FolioContribution, ContributionRegistry>(
      root,
      new ContributionRegistry(),
    );
    loadedFrom = root;
  }
  return registry;
}

/**
 * What fills a slot. Throws {@link UnregisteredPipelinePluginError} when
 * nothing does — never a default.
 */
export function pipelinePlugin<K extends PipelinePluginKind>(kind: K): PipelinePlugins[K] {
  const reg = current();
  const impl = reg.pipelinePlugin(kind);
  if (impl === undefined) {
    throw new UnregisteredPipelinePluginError(
      kind,
      loadedFrom,
      reg.contributedPipelinePlugins().map((p) => `${p.kind} (${p.contributor})`),
    );
  }
  return impl as PipelinePlugins[K];
}

/**
 * What fills a slot, or `undefined` when nothing does.
 *
 * Only for a caller whose own output already has a "could not determine"
 * state to put this in — absence must surface somewhere, never as a pass.
 */
export function optionalPipelinePlugin<K extends PipelinePluginKind>(
  kind: K,
): PipelinePlugins[K] | undefined {
  return current().pipelinePlugin(kind) as PipelinePlugins[K] | undefined;
}

// ── Delegates under the implementing module's own names ────────────
//
// A caller switches from the leaf to the slot by changing its import
// SPECIFIER and nothing else. That is deliberate, and not only for a small
// diff: a QA checker's freshness key is a hash over its own text and the
// top-level declarations it reaches (`qa-criterion-hash.ts`). A local wrapper
// `const` would be a new reached declaration and would move the key of every
// checker that calls it, re-staling verdicts for a change that alters no
// behaviour. Import bindings are not declarations, so this way the keys stay.
//
// Each resolves its slot at CALL time, never at import time, so importing a
// module that uses one loads no contributor until the function actually runs.

/** `lean-lexer` slot: blank Lean comments, preserving offsets and lines. */
export function stripLeanComments(src: string): string {
  return pipelinePlugin("lean-lexer").stripLeanComments(src);
}

/** `lean-lexer` slot: declaration starts in comment-stripped Lean source. */
export function declarationStarts(stripped: string): LeanDeclStart[] {
  return pipelinePlugin("lean-lexer").declarationStarts(stripped);
}

/**
 * `chapter-profile-defaults` slot: configure the folio's default chapter
 * profiles, IF a dependency supplies them.
 *
 * The one OPTIONAL slot, and on purpose. It runs at module load of
 * `qa-checkers-q-usage.ts`, and "no defaults" is already a documented state
 * of `chapter-profile-registry-di` (unconfigured, which reads as empty and is
 * reported by `chapterProfilesConfigured()`). A folio that does not depend on
 * the science layer, such as the fixture in `q-usage-audit-roots.test.ts`,
 * must still be able to load the checker and get its own "found NO blocks"
 * answer, rather than a load-time throw about a slot it never needed. A
 * contributor that is declared but broken still throws, from the loader.
 */
export function registerDefaultChapterProfiles(): void {
  optionalPipelinePlugin("chapter-profile-defaults")?.registerDefaults();
}

/** `latex-preflight` slot: macro lint over a generated compile unit. */
export function runPreflight(mainTexPath: string): LatexPreflightResult {
  return pipelinePlugin("latex-preflight").runPreflight(mainTexPath);
}

/** `lean-coverage` slot: the `.lean` file a block's manifest points at. */
export function resolveLeanFile(tsPath: string, src: string, leanRoot: string): string | null {
  return pipelinePlugin("lean-coverage").resolveLeanFile(tsPath, src, leanRoot);
}

/** `lean-coverage` slot: sorry-freedom and validation state of a `.lean` file. */
export function leanFileStatus(leanPath: string): ReturnType<LeanCoveragePlugin["leanFileStatus"]> {
  return pipelinePlugin("lean-coverage").leanFileStatus(leanPath);
}
