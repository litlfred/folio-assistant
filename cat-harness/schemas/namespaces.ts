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
 * But `schemas/cat-harness.ts` — the root declaration every instance
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
 * @graphNode none — a single IRI constant, not a schema
 */

/**
 * Folio's own terms — the relations no published vocabulary models.
 *
 * One namespace for the whole platform, harness and content alike. The name is
 * historical (it predates the harness/core split) and is kept because renaming
 * it would churn every consumer to no effect: the IRI is what is published,
 * and that does not change.
 */
import { termLayer } from "./vocabulary";

/**
 * The namespace that WAS — kept only so the vocabulary document can name the
 * stem it published under, and deliberately not exported for minting.
 *
 * Every term moved to a per-layer namespace before anything consumed this one.
 * It survives as a string because `ns-export` still serves `<base>/ns` as the
 * document that CARRIES all three vocabularies, which is a different thing
 * from a namespace terms hang off.
 */
export const LEGACY_FOLIO_NS = "https://litlfred.github.io/folio-assistant/ns#";

/**
 * One namespace per LAYER, because a term belongs to whatever declares it.
 *
 * A single `folio:` namespace for everything said, in effect, that one
 * repository owns the whole vocabulary — which stopped being true the moment
 * the terms were layered. The owner, 2026-09-19: "folio:Actor, folio:Role,
 * folio:Skill, folio:CatHarness seem to have wrong prefix, it should match the
 * planned declaring instance once separation is done, like i guess bs:Actor
 * for cat-bootstrap? cat: for catharness?"
 *
 * **Now is the only cheap moment and it is why this changed immediately.**
 * Nothing served `<base>/ns` until this branch, so no consumer holds any of
 * these IRIs. Once the vocabulary is published, changing a term's IRI is a
 * breaking change for every downstream instance and needs an alias to carry
 * forever — the `kg` -> `cat-harness` migration, one layer down and with no
 * `GRAPH_KIND_ALIASES` to soften it.
 *
 * The paths name the REPOSITORIES the split creates, not the layer words, so
 * that after separation each namespace is already the IRI its own instance
 * publishes at and nothing has to move a second time.
 */
export const CAT_BOOTSTRAP_NS = "https://litlfred.github.io/folio-assistant/cat-bootstrap/ns#";
export const CAT_HARNESS_NS = "https://litlfred.github.io/folio-assistant/cat-harness/ns#";
export const CORE_NS = "https://litlfred.github.io/folio-assistant/folio-assist-core/ns#";

/** The prefixes those namespaces bind to in a `@context`. */
export const NS_PREFIXES = {
  bs: CAT_BOOTSTRAP_NS,
  cat: CAT_HARNESS_NS,
  fac: CORE_NS,
} as const;

/** The namespace a layer's terms hang off. */
export function namespaceForLayer(layer: "cat-bootstrap" | "harness" | "core"): string {
  return layer === "cat-bootstrap" ? CAT_BOOTSTRAP_NS : layer === "core" ? CORE_NS : CAT_HARNESS_NS;
}

/** The prefix a layer's terms are written with. */
export function prefixForLayer(layer: "cat-bootstrap" | "harness" | "core"): "bs" | "cat" | "fac" {
  return layer === "cat-bootstrap" ? "bs" : layer === "core" ? "fac" : "cat";
}

/**
 * A term's full IRI — the single call every minting site makes.
 *
 * This replaced 93 hand-written per-term template literals
 * across four modules. Each of those was a place to pick the wrong namespace
 * once the namespaces stopped being one, and `cat-harness.ts` alone mints
 * terms in all three layers — `KnowledgeGraph` and `SchemaGraph` are
 * cat-bootstrap's, `BeanGraph` is the harness's, `VoiceGraph` is core's — so
 * "which namespace does this file use" has no file-level answer.
 */
export function termIri(name: string): string {
  return `${namespaceForLayer(termLayer(name))}${name}`;
}
