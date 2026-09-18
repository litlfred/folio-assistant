/**
 * Contribution registry — what a folio-assistant *dependency* may add to the
 * root instance.
 *
 * Phase 0.1 of the separation-of-concerns migration (issue #223). Until this
 * existed, `dependencies.folioAssistant` resolved translations and nothing
 * else: the model was explicit that schemas and MCP tools come "always from
 * the root folio-assistant". That is fine for one platform and fatal for the
 * proposed five-repo split, because `folio-asst-sci` exists precisely to own
 * the math block kinds, the paper adapter and the Lean tools. A dependency
 * that can contribute none of them can only ship prose.
 *
 * ## Shape: load-time registration
 *
 * A dependency names a module in its `harness.config.json`:
 *
 * ```jsonc
 * { "contributes": "./contributions.ts" }
 * ```
 *
 * That module's default export is called as the root walks the dependency
 * tree, and returns what it adds. Load ORDER is therefore significant, which
 * is the acknowledged cost of this shape over a manifest that is validated
 * before anything loads.
 *
 * **Collisions do not resolve by order.** A kind claimed by two contributors
 * throws, naming both. Last-writer-wins would make `adapterForKind` ambiguous
 * — the one property `schemas/block-kinds.ts` states it must keep — and would
 * make the ambiguity depend on the order dependencies happen to be listed in,
 * which is exactly the failure that is hardest to reproduce from a bug report.
 *
 * ## Why the diamond is not a collision
 *
 * The proposed dependency graph is a diamond: `smart-base → smart-kg → core`
 * and `folio-asst-sci → core`, so a depth-first walk reaches `core` twice.
 * Registering the same contribution twice from the same contributor is
 * therefore a **no-op**, not an error. Without that rule every realistic
 * dependency tree would throw a false collision on its first load — and the
 * obvious fix (dropping the collision check) is the one that must not be made.
 *
 * ## Why this module is in `schemas/` and not `src/core/`
 *
 * It is about the content model — which kinds exist and which adapter owns
 * them — so it belongs with the model. Putting it under `src/` would have
 * added another `agentic-harness → folio-assist-core` import, already the
 * largest wrong-direction group in `bun run check:partition` (20 edges). A
 * mechanism built to enable the split should not deepen the thing the split
 * has to undo.
 *
 * MCP tool contributions are carried as opaque registrar callbacks for the
 * same reason: this module never imports the MCP SDK, so the server type does
 * not leak into the content model.
 *
 * @module schemas/contributions
 */

import type { CheckerPaths, CheckerResult } from "./block-qa";
import { ADAPTER_BLOCK_KINDS, CONTENT_ADAPTERS, type ContentAdapter } from "./block-kinds";

// ── What a dependency may contribute ────────────────────────────

/** A block kind a dependency adds, and the adapter namespace that owns it. */
export interface BlockKindContribution {
  /** The kind string as it appears in a block manifest, e.g. `"theorem"`. */
  kind: string;
  /** The adapter namespace claiming it. May be a new namespace. */
  adapter: string;
}

/** A content adapter a dependency provides. */
export interface AdapterContribution {
  /** Adapter name, e.g. `"paper"`. Must be unique across contributors. */
  name: string;
  /** Module specifier, resolved relative to the contributing folio's root. */
  module: string;
}

/**
 * An MCP tool group a dependency registers.
 *
 * `register` is called with the server once the root has built it. It is typed
 * `unknown` here on purpose — see the module note on why the MCP SDK type does
 * not belong in the content model.
 */
export interface ToolContribution {
  /** Stable identifier, e.g. `"lean"`. Unique across contributors. */
  name: string;
  register: (server: unknown) => void;
}

/** Everything one dependency adds. Returned by its `contributes` module. */
/**
 * A QA checker a dependency adds, keyed by the criterion it answers.
 *
 * The reason this exists: `content/pipeline/qa-sweep.ts` dispatched with
 *
 * ```ts
 * const checker = AUTOMATED_CHECKERS[id] ?? DAK_AUTOMATED_CHECKERS[id];
 * ```
 *
 * — the generic sweep naming one adapter's checker table. That is a
 * wrong-direction dependency (core → smart-base) and it does not generalise:
 * a third adapter means a third `??`, and a folio that brings its own criteria
 * has nowhere to put them at all.
 */
export interface QaCheckerContribution {
  /** The criterion id this answers. Must be a criterion the sweep knows. */
  criterion: string;
  /** The checker itself. */
  check: (paths: CheckerPaths) => CheckerResult;
}

/**
 * A render target: how a block becomes typeset output, and how to tell
 * whether that output is well-formed.
 *
 * ## Why the validator needs this and could not have it
 *
 * `validate.ts` Phase 3 is "AST validation (render → parse)" and it read:
 *
 * ```ts
 * const latex = renderBlock(block, mdContent);
 * const astResult = validateLatexAst(latex);
 * ```
 *
 * — the GENERIC validator rendering every block to LaTeX. On a document folio
 * that is a category error twice over: the document render path goes through
 * pandoc and `content/pipeline/render-markdown.ts`, and deliberately never
 * falls back to `latexmk`, so a "LaTeX AST" error there is raised against
 * output the folio will never produce. It is also a wrong-direction dependency
 * (core → sci), since the LaTeX renderer is the science layer's.
 *
 * ## `validate` is separate from `render` on purpose
 *
 * A renderer that produces output and a validator that judges it are different
 * obligations, and a target may honestly have only the first. `validate`
 * returning `undefined` means **could not determine**, and the validator must
 * report that as such — never as a pass. A render target with no structural
 * check is a real state (an HTML target whose well-formedness the browser
 * decides), and silently counting it as valid is how a folio acquires a clean
 * validation record over output nobody checked.
 */
export interface RendererContribution {
  /**
   * The output format this renders to — `latex`, `markdown`, `html`. One
   * contributor per format; two renderers for `latex` is a collision, not a
   * fallback chain.
   */
  format: string;
  /** Which content adapters this target applies to. */
  adapters: string[];
  /** Render one block's manifest plus its Markdown body to the target format. */
  render: (block: unknown, markdown: string) => string;
  /**
   * Structural check on rendered output. `undefined` means this target has no
   * structural check — reported as "not checked", never as a pass.
   */
  validate?: (rendered: string) => { valid: boolean; errors: string[] };
}

export interface FolioContribution {
  /** The contributing instance's name, as declared in the dependency entry. */
  name: string;
  blockKinds?: BlockKindContribution[];
  adapter?: AdapterContribution;
  tools?: ToolContribution[];
  qaCheckers?: QaCheckerContribution[];
  renderers?: RendererContribution[];
}

/** Thrown when two contributors claim the same kind, adapter or tool name. */
export class ContributionCollisionError extends Error {
  constructor(
    readonly what: "kind" | "adapter" | "tool" | "checker" | "renderer",
    readonly id: string,
    readonly incumbent: string,
    readonly challenger: string,
  ) {
    super(
      `${what} "${id}" is claimed by both "${incumbent}" and "${challenger}". ` +
        `Contributions do not resolve by load order — rename one, or have the ` +
        `two instances share a dependency that declares it once.`,
    );
    this.name = "ContributionCollisionError";
  }
}

// ── The registry ────────────────────────────────────────────────

interface KindEntry {
  adapter: string;
  contributor: string;
}

/**
 * Accumulates contributions as the dependency tree is walked.
 *
 * Deliberately an instance rather than module-level state: tests, and a root
 * that resolves more than one folio in a process, must not leak registrations
 * into each other. Module-level mutable state is also how load order becomes
 * un-debuggable, which this shape is already paying enough for.
 */
export class ContributionRegistry {
  private kinds = new Map<string, KindEntry>();
  private adapters = new Map<string, { module: string; contributor: string }>();
  private toolGroups = new Map<string, { register: (server: unknown) => void; contributor: string }>();
  private checkers = new Map<string, { check: (paths: CheckerPaths) => CheckerResult; contributor: string }>();
  private renderers = new Map<string, { renderer: RendererContribution; contributor: string }>();

  /**
   * Register one dependency's contribution.
   *
   * Idempotent per contributor: re-registering identical content from the same
   * contributor is a no-op, so a diamond dependency graph loads cleanly.
   * Registering the same identifier from a *different* contributor throws.
   */
  register(contribution: FolioContribution): void {
    const who = contribution.name;

    for (const bk of contribution.blockKinds ?? []) {
      // A dependency may not redefine a kind the platform already owns.
      // Silently shadowing `theorem` would change what every existing folio
      // validates against, from a config file two repos away.
      const builtIn = CONTENT_ADAPTERS.find((a) => ADAPTER_BLOCK_KINDS[a].includes(bk.kind));
      if (builtIn) throw new ContributionCollisionError("kind", bk.kind, `platform (${builtIn})`, who);

      const existing = this.kinds.get(bk.kind);
      if (existing) {
        if (existing.contributor === who && existing.adapter === bk.adapter) continue; // diamond
        throw new ContributionCollisionError("kind", bk.kind, existing.contributor, who);
      }
      this.kinds.set(bk.kind, { adapter: bk.adapter, contributor: who });
    }

    if (contribution.adapter) {
      const a = contribution.adapter;
      if (CONTENT_ADAPTERS.includes(a.name as ContentAdapter)) {
        throw new ContributionCollisionError("adapter", a.name, "platform", who);
      }
      const existing = this.adapters.get(a.name);
      if (existing && !(existing.contributor === who && existing.module === a.module)) {
        throw new ContributionCollisionError("adapter", a.name, existing.contributor, who);
      }
      this.adapters.set(a.name, { module: a.module, contributor: who });
    }

    for (const t of contribution.tools ?? []) {
      const existing = this.toolGroups.get(t.name);
      if (existing) {
        if (existing.contributor === who) continue; // diamond
        throw new ContributionCollisionError("tool", t.name, existing.contributor, who);
      }
      this.toolGroups.set(t.name, { register: t.register, contributor: who });
    }

    for (const c of contribution.qaCheckers ?? []) {
      const existing = this.checkers.get(c.criterion);
      if (existing) {
        if (existing.contributor === who) continue; // diamond
        throw new ContributionCollisionError("checker", c.criterion, existing.contributor, who);
      }
      this.checkers.set(c.criterion, { check: c.check, contributor: who });
    }

    for (const r of contribution.renderers ?? []) {
      const existing = this.renderers.get(r.format);
      if (existing) {
        if (existing.contributor === who) continue; // diamond
        throw new ContributionCollisionError("renderer", r.format, existing.contributor, who);
      }
      this.renderers.set(r.format, { renderer: r, contributor: who });
    }
  }

  /**
   * The adapter owning a contributed kind, or `undefined`.
   *
   * Mirrors `adapterForKind`'s contract deliberately: `undefined` is never
   * defaulted to a guess. Callers wanting the composed answer should consult
   * `adapterForKind` first and fall back to this — see {@link composedKindOwner}.
   */
  kindOwner(kind: string): string | undefined {
    return this.kinds.get(kind)?.adapter;
  }

  /** Every contributed kind, with its adapter and contributor. */
  contributedKinds(): Array<{ kind: string; adapter: string; contributor: string }> {
    return [...this.kinds].map(([kind, e]) => ({ kind, ...e }));
  }

  /** A contributed adapter's module specifier, or `undefined`. */
  adapterModule(name: string): string | undefined {
    return this.adapters.get(name)?.module;
  }

  /** Every contributed adapter name. */
  contributedAdapters(): string[] {
    return [...this.adapters.keys()];
  }

  /** Run every contributed tool registrar against the built server. */
  registerTools(server: unknown): void {
    for (const { register } of this.toolGroups.values()) register(server);
  }

  /**
   * The checker a dependency contributed for this criterion, or `undefined`.
   *
   * `undefined` is never defaulted to a pass: a criterion the sweep knows but
   * nobody implements is `needs-agent`, which is what the sweep already does
   * for its own unimplemented criteria.
   */
  qaChecker(criterion: string): ((paths: CheckerPaths) => CheckerResult) | undefined {
    return this.checkers.get(criterion)?.check;
  }

  /** Every contributed checker, with the criterion it answers and who added it. */
  contributedQaCheckers(): Array<{ criterion: string; contributor: string }> {
    return [...this.checkers].map(([criterion, e]) => ({ criterion, contributor: e.contributor }));
  }

  /** Every contributed tool group name. */
  contributedTools(): string[] {
    return [...this.toolGroups.keys()];
  }

  /**
   * The render targets that apply to one content adapter.
   *
   * An empty array is a determined empty — this adapter has no contributed
   * render target — and is not the same as the registry being absent. A caller
   * with no registry at all knows nothing; this caller knows there is nothing.
   */
  renderersFor(adapter: string): RendererContribution[] {
    return [...this.renderers.values()]
      .filter((e) => e.renderer.adapters.includes(adapter))
      .map((e) => e.renderer);
  }

  /** A contributed render target by format, or `undefined`. */
  renderer(format: string): RendererContribution | undefined {
    return this.renderers.get(format)?.renderer;
  }

  /** Every contributed render target, with its format and who added it. */
  contributedRenderers(): Array<{ format: string; adapters: string[]; contributor: string }> {
    return [...this.renderers].map(([format, e]) => ({
      format,
      adapters: e.renderer.adapters,
      contributor: e.contributor,
    }));
  }
}

/**
 * The adapter owning a kind, consulting the platform first and the registry
 * second.
 *
 * The order matters and is not arbitrary: a platform kind can never be
 * overridden (`register` refuses one outright), so checking the platform first
 * makes that guarantee visible at the read site as well as the write site.
 */
export function composedKindOwner(
  kind: string,
  registry: ContributionRegistry | undefined,
  builtIn: (k: string) => string | undefined,
): string | undefined {
  return builtIn(kind) ?? registry?.kindOwner(kind);
}
