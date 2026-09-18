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
 * A dependency names a module in its `folio.config.json`:
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
export interface FolioContribution {
  /** The contributing instance's name, as declared in the dependency entry. */
  name: string;
  blockKinds?: BlockKindContribution[];
  adapter?: AdapterContribution;
  tools?: ToolContribution[];
}

/** Thrown when two contributors claim the same kind, adapter or tool name. */
export class ContributionCollisionError extends Error {
  constructor(
    readonly what: "kind" | "adapter" | "tool",
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

  /** Every contributed tool group name. */
  contributedTools(): string[] {
    return [...this.toolGroups.keys()];
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
