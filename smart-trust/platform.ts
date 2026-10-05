/**
 * The ONE file in this instance that names where the platform lives.
 *
 * smart-trust is staged here ahead of becoming its own repository
 * (`litlfred/smart-trust`, plan `smart-separation-2026-10-01`, issue #1767,
 * bean `n3ni`). Every platform symbol the instance uses is re-exported from
 * here, so the day it leaves, re-pointing the platform is a one-file edit —
 * the same reason `smart-base/platform.ts` exists.
 * `cat-harness/scripts/tests/instance-separation-imports.test.ts` holds the
 * rule: no other file here may reach outside the instance.
 *
 * Today that is one symbol, used by one test. It is the climb PR #2082
 * measured in the seeded fork: `pages-markdown.test.ts` imported
 * `../../../fhir-harness/scripts/resource-views.ts` directly, and in a fork
 * with no folio-assistant beside it that path does not exist. Routing it
 * here does not make the fork run — the platform still has to be present —
 * but it makes the one place to re-point it findable.
 *
 * @module smart-trust/platform
 */
export { VIEW_PAGE } from "../fhir-harness/scripts/resource-views.ts";
