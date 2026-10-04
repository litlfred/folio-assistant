/**
 * Register a declared set of tool groups, wherever they are declared.
 *
 * @module src/tool-groups
 *
 * ## Why the mechanism is here and the lists are not
 *
 * Two servers register tool groups — the MCP server in
 * `adapters/mcp-server/` and the HTTP server in `src/server.ts` — and each has
 * its OWN list, because each serves a different set. What they share is the
 * loading: resolve a declared module by variable path, call its registrar,
 * and report which of three things happened.
 *
 * That mechanism lived in `adapters/mcp-server/tool-groups.ts`, which is
 * core's. The harness is the BASE repository — core may import it, it may not
 * import core — so `src/server.ts` could not reuse it and had to import its
 * one core tool group directly. Same lesson as the render targets: the
 * mechanism is generic and belongs at the base; the declaration is per-layer
 * and belongs with the layer that owns the tools.
 *
 * ## An absent layer is a determined absence, not a crash and not silence
 *
 * A group whose module is not present is **skipped and reported**, because
 * after the split a core-only checkout legitimately has no science layer and
 * must still start. That is the one behaviour a hardcoded import cannot have.
 * It is equally not silent: a server that quietly starts without a tool group
 * looks identical to one where that group is broken, and the operator finds
 * out from a failing call rather than from the boot log.
 *
 * A group that IS present and fails to load is a different state again —
 * reported as an error, never as "this layer is not installed", because the
 * remedy is opposite (fix the module vs install the layer).
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ToolDefinition } from "../schemas/tool.js";

/** Which repository layer a group will live in after the split. */
export type ToolGroupLayer = "core" | "sci" | "harness";

export interface ToolGroupDeclaration {
  /** Stable id, used in the boot report. */
  id: string;
  /** Repo-relative module. Resolved by VARIABLE path, so this file imports none. */
  module: string;
  /**
   * The exported registrar, called with the built server. Absent means "the
   * module's ONE `register…` export" — a Tool node names its registrar only
   * when the module has more than one (`inProcess.register`), and a module
   * with zero or several is reported as `failed`, never guessed at.
   */
  registrar?: string;
  /**
   * The layer that owns it. Not consulted at runtime — a declaration is not a
   * gate — but it is what makes the boundary reviewable in one place instead
   * of inferable from six import lines.
   */
  layer: ToolGroupLayer;
  /** What it needs on the machine, for the operator reading a skip. */
  requires?: string;
}


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
  groups: readonly ToolGroupDeclaration[],
  /** Absolute path the declared modules are relative to. */
  root: string,
  /**
   * Extra arguments passed to every registrar after the server.
   *
   * Runtime configuration, not declaration: the HTTP server's registrars take
   * `(server, repoRoot)` and the MCP server's take `(server)`. Putting the
   * repo root in the DECLARATION would be wrong — it is not a property of
   * which tools exist, it is a property of this run.
   */
  extraArgs: readonly unknown[] = [],
): Promise<ToolGroupOutcome[]> {
  const out: ToolGroupOutcome[] = [];

  for (const g of groups) {
    const abs = join(root, g.module);
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
      let name = g.registrar;
      if (name === undefined) {
        const candidates = Object.keys(mod).filter((k) => /^register[A-Z]/.test(k) && typeof mod[k] === "function");
        if (candidates.length !== 1) {
          out.push({
            id: g.id,
            state: "failed",
            detail:
              `${g.module} exports ${candidates.length === 0 ? "no" : candidates.length} register…() function(s)` +
              (candidates.length > 1 ? ` (${candidates.join(", ")}); its Tool node must name one in invoke.inProcess.register` : ""),
          });
          continue;
        }
        name = candidates[0];
      }
      const fn = mod[name];
      if (typeof fn !== "function") {
        out.push({ id: g.id, state: "failed", detail: `${g.module} exports no ${name}()` });
        continue;
      }
      (fn as (s: unknown, ...rest: unknown[]) => void)(server, ...extraArgs);
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

/**
 * The tool groups a server serves, DERIVED from the Tool nodes its instance
 * declares — one group per (module, registrar) among the nodes served over MCP
 * in-process.
 *
 * Bean `zmdo`, owner 2026-10-04: a tool is served because it is declared in
 * the KG, not because a list in code names it. Until then the same fact was
 * restated twice by hand — `SERVER_TOOL_GROUPS` in `server.ts` and the
 * "generic tools" inline in the document adapter — and the second lived in
 * `folio-assistant-core`, so with `cat-harness` alone no adapter was loaded,
 * none of them was registered, and the server refused to start.
 *
 * `layer` is "harness" for every group: these are the harness's own Tool
 * nodes. A module that is absent or fails is still REPORTED by
 * {@link registerDeclaredToolGroups}, exactly as a hand-declared one was.
 */
export function toolGroupsFromNodes(nodes: readonly ToolDefinition[]): ToolGroupDeclaration[] {
  const groups = new Map<string, ToolGroupDeclaration>();
  for (const n of nodes) {
    const inProcess = n.invoke?.inProcess;
    if (!inProcess || !n.invoke?.mcp) continue;
    const key = `${inProcess.module}#${inProcess.register ?? ""}`;
    if (groups.has(key)) continue;
    groups.set(key, {
      id: inProcess.module.replace(/^.*\//, "").replace(/\.ts$/, ""),
      module: inProcess.module,
      ...(inProcess.register ? { registrar: inProcess.register } : {}),
      layer: "harness",
    });
  }
  return [...groups.values()];
}
