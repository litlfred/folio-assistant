/**
 * The platform's own IRI namespace — a leaf module, imported by nothing.
 *
 * ## Why this is not in `schemas/jsonld.ts`
 *
 * It was, and that placement inverted a dependency. `jsonld.ts` is the
 * **content** vocabulary: block kinds, DoCO structural types, SPAR citation
 * terms, the FHIR and smart-base namespaces. It belongs to
 * `folio-assist-core`, and it imports `./block-kinds` to build its projection
 * tables.
 *
 * But `schemas/agent-harness.ts` — the root declaration every instance
 * carries, including a Tool repo or a Test repo that holds no content at all —
 * also needs the platform namespace, to mint the `@type` IRIs for its graph
 * kinds. Importing it from `jsonld.ts` would have made `agentic-harness`
 * depend on the content model for its own type IRIs: a
 * `harness → folio-assist-core` edge, which is already the largest
 * wrong-direction group `bun run check:partition` reports, and exactly the
 * coupling the five-repo split has to undo.
 *
 * The first attempt at avoiding that was a duplicated constant in the harness
 * module with a test asserting the two stayed equal. That works and is worse:
 * a guard against drift is an admission that there are two definitions. This
 * module is the one definition. `jsonld.ts` re-exports it, so every existing
 * importer is unaffected.
 *
 * ## Why it partitions to the harness
 *
 * Because the dependency direction only works one way round. Core may import
 * the harness; the harness may not import core. A namespace both layers need
 * therefore has to live at or below the harness — putting it in core would
 * reintroduce the edge this module exists to remove.
 *
 * It deliberately imports **nothing**, for the same reason
 * `schemas/block-kinds.ts` does: a leaf cannot participate in a cycle, and
 * cannot drag a vocabulary into a module that only wanted a string.
 *
 * @module schemas/namespaces
 */

/**
 * Folio's own terms — the relations no published vocabulary models.
 *
 * One namespace for the whole platform, harness and content alike. The name is
 * historical (it predates the harness/core split) and is kept because renaming
 * it would churn every consumer to no effect: the IRI is what is published,
 * and that does not change.
 */
export const FOLIO_NS = "https://litlfred.github.io/folio-assistant/ns#";
