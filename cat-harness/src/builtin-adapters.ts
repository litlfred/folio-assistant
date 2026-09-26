/**
 * Which content adapter a declared content type gets — as data, resolved at
 * startup.
 *
 * ## Why this is not a `switch`
 *
 * `src/index.ts` is the composition root, and it read:
 *
 * ```ts
 * import { PaperContentAdapter } from "../adapters/paper/index.js";
 * import { DocumentContentAdapter } from "../adapters/document/index.js";
 * // ...
 * switch (adapterType) { case "document": ... default: new PaperContentAdapter(...) }
 * ```
 *
 * The paper adapter is the science layer's — it registers Lean and LaTeX tools
 * — so the generic entry point imported it unconditionally. After the split
 * that import does not resolve in a core-only checkout, and the module fails
 * to load before any of its own error handling runs.
 *
 * The file already had the right mechanism for the OTHER case: a folio
 * declaring `adapterModule` gets a variable dynamic import with a fallback.
 * The built-ins are the same problem and get the same treatment; this file is
 * the declaration the resolver reads.
 *
 * ## It lives in `src/`, deliberately
 *
 * Knowing which adapters this instance ships is the harness's business — it is
 * the composition root's own inventory. Putting the table in `schemas/` would
 * make the harness import core to learn what it itself installed, which is the
 * edge this exists to remove rather than relocate.
 *
 * ## An absent adapter is reported, and the fallback is honest
 *
 * The old default was `paper` for a good reason: every folio predating the
 * document type declares `contentType: "paper"` or nothing, and the paper
 * adapter is a superset that registers the document tools too. Defaulting the
 * other way would silently drop `lean_build` from a folio whose config omits
 * `contentType`.
 *
 * That reasoning survives, but it is no longer an assumption. When `paper` is
 * declared and its module is not installed, falling back to `document`
 * silently would hand a paper folio an adapter with no `lean_build` — the
 * exact failure the default was chosen to avoid, arriving as a missing tool
 * instead of a missing package. So the fallback is taken, and SAID.
 *
 * @module src/builtin-adapters
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..");

export interface BuiltinAdapterDeclaration {
  /** The `contentType` this answers, as declared in `harness.config.json`. */
  contentType: string;
  /** Repo-relative module. Resolved by VARIABLE path — this file imports none. */
  module: string;
  /** The exported class. */
  className: string;
  /** For the boot log when the module is not installed. */
  layer: "core" | "sci";
}

/**
 * Ordered by preference for the fallback: the first INSTALLED entry is what an
 * unresolvable content type falls back to. `paper` leads because it is the
 * superset — it registers the document tools as well — so falling back to it
 * loses nothing, while falling back from it loses Lean and TeX.
 */
export const BUILTIN_ADAPTERS: BuiltinAdapterDeclaration[] = [
  { contentType: "paper", module: "adapters/paper/index.ts", className: "PaperContentAdapter", layer: "sci" },
  { contentType: "document", module: "adapters/document/index.ts", className: "DocumentContentAdapter", layer: "core" },
];

export interface AdapterResolution {
  /** The constructor, ready to `new`. */
  ctor: new (...args: never[]) => unknown;
  /** Which declaration answered — may differ from what was asked for. */
  used: BuiltinAdapterDeclaration;
  /**
   * Set when `used` is not what was requested. Never empty on a fallback: a
   * paper folio running on the document adapter has no `lean_build`, and the
   * operator must learn that here rather than from a failing tool call.
   */
  fallbackReason?: string;
}

/**
 * Resolve a declared content type to its built-in adapter class.
 *
 * Throws only when NO declared adapter is installed — at that point the
 * process genuinely cannot serve content, and starting anyway would present an
 * empty server as a working one.
 */
export async function resolveBuiltinAdapter(contentType: string): Promise<AdapterResolution> {
  const asked = BUILTIN_ADAPTERS.find((a) => a.contentType === contentType);
  const tried: string[] = [];

  const load = async (d: BuiltinAdapterDeclaration): Promise<(new (...args: never[]) => unknown) | undefined> => {
    const abs = resolve(ROOT, d.module);
    if (!existsSync(abs)) {
      tried.push(`${d.contentType}: ${d.module} is not installed (${d.layer} layer)`);
      return undefined;
    }
    try {
      // VARIABLE specifier — the module comes from the declaration above.
      const mod = (await import(abs)) as Record<string, unknown>;
      const ctor = mod[d.className];
      if (typeof ctor !== "function") {
        tried.push(`${d.contentType}: ${d.module} exports no ${d.className}`);
        return undefined;
      }
      return ctor as new (...args: never[]) => unknown;
    } catch (e) {
      tried.push(`${d.contentType}: ${d.module} failed to load: ${e instanceof Error ? e.message : String(e)}`);
      return undefined;
    }
  };

  if (asked) {
    const ctor = await load(asked);
    if (ctor) return { ctor, used: asked };
  }

  for (const d of BUILTIN_ADAPTERS) {
    if (asked && d.contentType === asked.contentType) continue;
    const ctor = await load(d);
    if (ctor) {
      return {
        ctor,
        used: d,
        fallbackReason: asked
          ? `contentType "${contentType}" declares the ${asked.contentType} adapter, which is unavailable ` +
            `(${tried[0]}); using ${d.contentType} instead — tools specific to ${asked.contentType} are NOT registered`
          : `contentType "${contentType}" matches no built-in adapter; using ${d.contentType}`,
      };
    }
  }

  throw new Error(
    `no built-in content adapter is installed. Tried:\n  ${tried.join("\n  ")}\n` +
      `A server with no adapter can serve no content, so it does not start.`,
  );
}
