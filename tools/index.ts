/**
 * Every instance's Tool nodes, merged — the one import a consumer needs.
 *
 * ## Why this file exists rather than each consumer importing a stub
 *
 * Tool definitions moved from `tools/*.ts` to `<stub>/tools/*.ts` so that a
 * composed instance can contribute its own without colliding on a filename —
 * the stub pattern the owner set for `tools/`, `skills/`, `library/` and
 * `docs/`, and deliberately NOT for `beans/` or `todos/`, which are never
 * overlaid.
 *
 * Five modules import `../tools/index.js` — `check-tools`, `kg-export`,
 * `harness-schema-export`, `tool-coverage` and the MCP projection. Had the
 * move stopped at relocating the files, each of those would now name
 * `../folio-assistant/tools/index.js`, baking THIS instance's stub into five
 * import paths. That is the exact defect the stub pattern exists to remove,
 * reintroduced one directory along: a downstream instance would have to patch
 * platform code to be seen.
 *
 * So the barrel stays at the top and consumers are untouched. Adding an
 * instance is one import and one spread here.
 *
 * ## Why an explicit import rather than a directory scan
 *
 * `harness.json` describes this directory as "Authored as .ts calling
 * defineTool so a malformed node fails at tsc". A runtime scan with dynamic
 * `import()` would discover subdirectories automatically and give that up —
 * a malformed Tool node would then fail when something called it rather than
 * when somebody compiled it. One line per instance is a small price for the
 * error arriving at the keyboard instead of in production.
 *
 * @module tools/index
 */
import type { ToolDefinition } from "../cat-harness/schemas/tool.js";
import { tools as folioAssistantTools } from "../cat-harness/tools/index.js";

/**
 * Every Tool node this instance can see, its own and its dependencies'.
 *
 * `baseUrl` is threaded through rather than defaulted here: a Tool's IO
 * schema IRIs are minted against the base the document is published at, and a
 * preview build overrides it. Defaulting in the barrel would give two answers
 * to which base a Tool was minted for.
 */
export function tools(baseUrl?: string): ToolDefinition[] {
  return [...folioAssistantTools(baseUrl)];
}
