/**
 * The ONE file in this instance that names where the platform lives.
 *
 * smart-base is staged here ahead of becoming its own repository
 * (`litlfred/smart-base`, plan `smart-separation-2026-10-01`, issue #1767,
 * bean `n3ni`). Every platform symbol the instance uses is re-exported from
 * here, so the day it leaves, re-pointing the platform is a one-file edit —
 * the same reason a folio's block manifests import `../schemas/builders`
 * and never folio-assistant directly. `instance-separation-imports.test.ts`
 * holds the rule: no other file here may reach outside the instance.
 *
 * @module smart-base/platform
 */
export { defineTool, type ToolDefinition } from "../cat-harness/schemas/tool.js";
export { toolTypeIri } from "../cat-harness/schemas/tool-types.js";
export { declarationPathIn } from "../cat-harness/schemas/cat-harness.js";
