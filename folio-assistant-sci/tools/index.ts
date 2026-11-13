/**
 * folio-assistant-sci's Tool nodes: the `tools` graph for the science layer.
 *
 * @module folio-assistant-sci/tools
 * @graphNode tool
 *
 * Reached by the harness through tool auto-discovery (`cat-harness/tools/
 * discover.ts`, bean `p0za`), never by an import, as `folio-assistant-core`'s
 * are. A Tool node is a declaration read at load; these invoke shell commands,
 * so declaring them copies no code.
 *
 * ## The iterative paper build (issue #2117, 2026-10-04)
 *
 * The owner asked for the loop litlfred/qou used to iterate on a large paper,
 * as "new skill/tools". It has four steps, governed by the `latex-build-cache`
 * skill:
 *
 * 1. `latex-preflight`, a static check that needs no TeX;
 * 2. `tex-install`, to get an engine into a sandbox that has none;
 * 3. `paper-feature-build`, which compiles only the changed chapters plus a
 *    latexdiff of each, with margin notes off;
 * 4. `paper-latex-build`, the full render.
 *
 * Steps 1 and 4 were declared in cat-harness until bean `bbza` moved them
 * here with the rest of the LaTeX, Lean-audit and proof-status Tools: the
 * skills they satisfy already lived in this layer, so a harness Tool naming
 * them pointed up a layer.
 *
 * Steps 2 and 3 had no Tool node, so an agent searching the tools graph could
 * not find the loop; and step 3 could not run anywhere, because it read the
 * preamble deleted in `34a70659c7`. It now lives beside the recovered print
 * template in `adapters/paper/latex/`.
 *
 * ## One Tool per folder — bean `tdir`
 *
 * Each Tool is declared in `<id>/<id>.ts` beside this file, with its scripts
 * and tests when they are its alone; this file only loads the folders
 * (`toolsFromFolders`, which holds the folder = file = id convention).
 */
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import type { ToolDefinition } from "@litlfred/cat-harness-tools/schemas/tools/tool.js";
import { toolsFromFolders } from "@litlfred/cat-harness-tools/schemas/tools/tool-folders.js";

export function tools(baseUrl?: string): ToolDefinition[] {
  return toolsFromFolders(dirname(fileURLToPath(import.meta.url)), baseUrl ?? "");
}
