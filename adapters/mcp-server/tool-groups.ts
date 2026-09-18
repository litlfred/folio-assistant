/**
 * Which tool groups the MCP server registers — declared as data, resolved at
 * startup.
 *
 * ## The composition-root problem this solves
 *
 * `server.ts` imported six registrars and called them in sequence. Three of
 * them — `render`, `preview`, `lean` — need a TeX installation or a Lean
 * toolchain, which is the line `adapters/paper/index.ts` already draws: they
 * belong to the science layer. So the generic server named the science layer
 * three times, and once the repositories are separated those imports do not
 * resolve at all.
 *
 * The usual answer is a conditional import, which is the same hardcoding with
 * a branch in front of it. The actual answer is that "which tool groups exist"
 * is a fact about the INSTANCE, not about this file: the platform declares its
 * own here, a dependency contributes more through `ToolContribution`, and
 * `server.ts` registers whatever it is handed.
 *
 * ## An absent layer is a determined absence, not a crash and not silence
 *
 * A group whose module is not present is **skipped and reported**, because
 * after the split a core-only checkout legitimately has no science layer and
 * must still start. That is the one behaviour a hardcoded import cannot have.
 * It is equally not silent: a server that quietly starts without
 * `paper_render_pdf` looks identical to one where rendering is broken, and the
 * operator finds out from a failing tool call rather than from the boot log.
 *
 * A group that IS present and fails to load is a different state again —
 * reported as an error, never as "this layer is not installed", because the
 * remedy is opposite (fix the module vs install the layer).
 *
 * @module adapters/mcp-server/tool-groups
 */

import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "../..");

/** Which repository layer a group will live in after the split. */
export type ToolGroupLayer = "core" | "sci" | "harness";

export interface ToolGroupDeclaration {
  /** Stable id, used in the boot report. */
  id: string;
  /** Repo-relative module. Resolved by VARIABLE path, so this file imports none. */
  module: string;
  /** The exported registrar, called with the built server. */
  registrar: string;
  /**
   * The layer that owns it. Not consulted at runtime — a declaration is not a
   * gate — but it is what makes the boundary reviewable in one place instead
   * of inferable from six import lines.
   */
  layer: ToolGroupLayer;
  /** What it needs on the machine, for the operator reading a skip. */
  requires?: string;
}

export const TOOL_GROUPS: ToolGroupDeclaration[] = [
  { id: "validate", module: "adapters/mcp-server/tools/validate.ts", registrar: "registerValidateTools", layer: "core" },
  { id: "preferences", module: "adapters/mcp-server/tools/preferences.ts", registrar: "registerPreferenceTools", layer: "core" },
  { id: "deps", module: "adapters/mcp-server/tools/check-deps.ts", registrar: "registerDepsTools", layer: "harness" },
  { id: "render", module: "adapters/mcp-server/tools/render.ts", registrar: "registerRenderTools", layer: "sci", requires: "a LaTeX installation" },
  { id: "preview", module: "adapters/mcp-server/tools/preview.ts", registrar: "registerPreviewTools", layer: "sci", requires: "rendered LaTeX output" },
  { id: "lean", module: "adapters/mcp-server/tools/lean.ts", registrar: "registerLeanTools", layer: "sci", requires: "a Lean toolchain" },
];

/** What happened to one declared group. Three outcomes, never two. */
export type ToolGroupOutcome =
  | { id: string; state: "registered" }
  | { id: string; state: "absent"; layer: ToolGroupLayer; detail: string }
  | { id: string; state: "failed"; detail: string };

/**
 * Register every declared group against the server.
 *
 * Returns one outcome per declaration. The caller reports them; this function
 * does not print, so a test can assert on the outcomes rather than on stderr.
 */
export async function registerDeclaredToolGroups(
  server: unknown,
  groups: ToolGroupDeclaration[] = TOOL_GROUPS,
): Promise<ToolGroupOutcome[]> {
  const out: ToolGroupOutcome[] = [];

  for (const g of groups) {
    const abs = join(ROOT, g.module);
    if (!existsSync(abs)) {
      out.push({
        id: g.id,
        state: "absent",
        layer: g.layer,
        detail:
          `${g.module} is not present in this checkout` +
          (g.requires ? ` (it needs ${g.requires})` : "") +
          `; its tools are not available`,
      });
      continue;
    }

    try {
      // VARIABLE specifier — the target comes from the declaration, so this
      // module names none of the tool groups and depends on none of them.
      const mod = (await import(abs)) as Record<string, unknown>;
      const fn = mod[g.registrar];
      if (typeof fn !== "function") {
        out.push({ id: g.id, state: "failed", detail: `${g.module} exports no ${g.registrar}()` });
        continue;
      }
      (fn as (s: unknown) => void)(server);
      out.push({ id: g.id, state: "registered" });
    } catch (e) {
      // NOT reported as `absent`. The module is there and broken, and the
      // remedy — fix it — is the opposite of "install that layer".
      out.push({
        id: g.id,
        state: "failed",
        detail: `${g.module} failed to register: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
  }

  return out;
}
