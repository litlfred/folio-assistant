/**
 * The tool groups the MCP server registers — this instance's own list.
 *
 * @module adapters/mcp-server/tool-groups
 *
 * The LOADING lives in `src/tool-groups.ts`, at the base, because the HTTP
 * server has its own list and needs the same mechanism — and the harness may
 * not import core to get it. What stays here is the one thing that is
 * genuinely this server's: which groups it serves.
 *
 * Three of them — `render`, `preview`, `lean` — need a TeX installation or a
 * Lean toolchain, which is the line `adapters/paper/index.ts` already draws.
 * A generic server naming them is a wrong-direction dependency that stops
 * resolving once the repositories are separated, which is why they are
 * declared rather than imported.
 */

import { resolve } from "node:path";

import {
  registerDeclaredToolGroups,
  type ToolGroupDeclaration,
  type ToolGroupOutcome,
} from "../../src/tool-groups.js";

export type { ToolGroupDeclaration, ToolGroupOutcome };

/** Where the declared modules are resolved from. */
const ROOT = resolve(import.meta.dir, "../..");

export const TOOL_GROUPS: ToolGroupDeclaration[] = [
  { id: "validate", module: "adapters/mcp-server/tools/validate.ts", registrar: "registerValidateTools", layer: "core" },
  { id: "preferences", module: "adapters/mcp-server/tools/preferences.ts", registrar: "registerPreferenceTools", layer: "core" },
  { id: "deps", module: "adapters/mcp-server/tools/check-deps.ts", registrar: "registerDepsTools", layer: "harness" },
  { id: "render", module: "adapters/mcp-server/tools/render.ts", registrar: "registerRenderTools", layer: "sci", requires: "a LaTeX installation" },
  { id: "preview", module: "adapters/mcp-server/tools/preview.ts", registrar: "registerPreviewTools", layer: "sci", requires: "rendered LaTeX output" },
  { id: "lean", module: "adapters/mcp-server/tools/lean.ts", registrar: "registerLeanTools", layer: "sci", requires: "a Lean toolchain" },
];


/** Register this server's declared groups. See `src/tool-groups.ts`. */
export function registerMcpToolGroups(server: unknown): Promise<ToolGroupOutcome[]> {
  return registerDeclaredToolGroups(server, TOOL_GROUPS, ROOT);
}
