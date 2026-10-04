/**
 * The generic MCP tools — every instance gets these, whatever its content
 * type, and an instance with NO content type gets only these.
 *
 * They lived inline in `DocumentContentAdapter.registerMcpTools`, so the only
 * way to reach `folio_init`, `skill_fetch` or the README tools was to load an
 * adapter from `folio-assistant-core` or above. Measured 2026-10-04 (bean
 * `zmdo`): with `cat-harness` alone and no adapter installed, the server did
 * not start at all. The owner ruled the same day that it starts with these
 * tools only, which needs them to live in the harness rather than in core.
 *
 * Every function here is the harness's own; this module adds no dependency,
 * it only names the set once so the document adapter and the no-content
 * adapter cannot drift apart.
 *
 * @module cat-harness/src/tools/generic
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerDepsTools } from "./check-deps.js";
import { registerPreferenceTools } from "./preferences.js";
import { registerPreviewTools } from "./preview.js";
import { registerSkillFetchTools } from "./skill-fetch.js";
import { registerSkillPrompts } from "./skill-prompts.js";
import { registerFolioInitTools } from "./folio-init.js";
import { registerReadmeSyncTools } from "./readme-sync.js";
import { registerReadmeAuditTools } from "./readme-audit.js";
import { registerRenderOrderTools } from "./render-order.js";
import { registerLsiQueryTools } from "./lsi-query.js";

export function registerGenericTools(server: McpServer): void {
  registerDepsTools(server);
  registerPreferenceTools(server);
  registerPreviewTools(server);
  registerSkillFetchTools(server);
  // The person-facing half of the same skills: each `user_invocable` one as
  // an MCP PROMPT, which a host lists for the person rather than offering to
  // the model. Not a tool — bean `j6t3`, and the owner's "keep tools and
  // skills separate!".
  registerSkillPrompts(server);
  // `folio_init` runs BEFORE a folio has a content type, so it has to be
  // reachable whichever adapter — or none — the server started with.
  registerFolioInitTools(server);
  // A folio's README lists its papers and chapters whatever the content
  // type, so the generated sections are generic too. A document folio simply
  // never carries the Lean markers, so those sections never render.
  registerReadmeSyncTools(server);
  // Its read-only half: sync owns the generated regions, audit checks the
  // links the author wrote. Between them nothing in the file is unaccounted
  // for.
  registerReadmeAuditTools(server);
  // Where the README render SITS, and what else is derived from the same
  // graph. Generic for the same reason: the order comes from the instance's
  // declarations, and no block kind enters into it.
  registerRenderOrderTools(server);
  // Vocabulary-gap search over the declared prose graphs (bean `ansc`).
  // Generic: a library, the skills and the beans exist whatever the
  // content type, and no block kind enters into it.
  registerLsiQueryTools(server);
}
