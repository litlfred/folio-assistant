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
import { type TermLayer, termLayer } from "./vocabulary";

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
 * for bootstrap? cat: for catharness?"
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
export const CAT_BOOTSTRAP_NS = "https://litlfred.github.io/folio-assistant/bootstrap/ns#";
export const CAT_HARNESS_NS = "https://litlfred.github.io/folio-assistant/cat-harness/ns#";
export const CORE_NS = "https://litlfred.github.io/folio-assistant/folio-assistant-core/ns#";

/**
 * The XML namespace our BPMN EXTENSION elements bind to — `folio:skill`,
 * `folio:bean`, `folio:decision`.
 *
 * A different object from the three above, and the distinction is the whole
 * reason this constant exists. Those are JSON-LD namespaces that TERMS hang
 * off; this is an XML namespace that ELEMENTS are in, read by bpmn-moddle
 * rather than by a `@context`. Nothing resolves one against the other.
 *
 * **It had no constant until 2026-09-20 and it drifted, which is bean
 * `0d99`.** Measured on the corpus that day: 41 diagrams bound `folio:` to
 * this IRI and 13 to `http://folio-assistant.dev/bpmn`, a domain this project
 * does not own and has never published at. Two spellings of one namespace is
 * not a cosmetic split — an XML namespace is compared by STRING, so a
 * consumer matching on one silently skips every element in the other, and
 * the diagrams that carried `folio:skill` under the wrong IRI were extension
 * elements nothing could read while parsing without error.
 *
 * It is the published `docs/` stem, matching {@link LEGACY_FOLIO_NS} and the
 * three layer namespaces, so every IRI this project mints is under a domain
 * it controls.
 */
export const FOLIO_BPMN_NS = "https://litlfred.github.io/folio-assistant/bpmn";

/**
 * The spelling that was never ours, kept so a gate can NAME it rather than
 * report an anonymous mismatch.
 *
 * Exported for `scripts/external-schemas.ts`, which partitions the namespaces
 * a diagram binds into "ours" and "an external specification's" — an external
 * one needs a record in the registry, ours needs to be spelt one way. Without
 * this, the drift read as two undeclared external specifications and the
 * finding told the reader to go and write records for them.
 */
export const LEGACY_FOLIO_BPMN_NS = "http://folio-assistant.dev/bpmn";

/**
 * The `targetNamespace` every diagram under `processes/` declares: the
 * namespace its processes, and so every `calledElement` naming them, live in.
 *
 * A different object again from {@link FOLIO_BPMN_NS}: that is the namespace
 * our extension ELEMENTS are in; this one is the diagram's IDENTITY. Bean
 * `rtrg`, measured 2026-09-23: 47 diagrams declared this IRI, 4
 * `https://folio-assistant.dev/workflows`, and 15 one per diagram under
 * `http://folio-assistant.dev/bpmn/`, a domain this project does not own.
 *
 * **One shared namespace, not one per diagram (owner, 2026-09-23).** BPMN
 * types `calledElement` as a QName, so a call is resolved against a namespace
 * and not only an id. With one namespace, every call in the corpus names a
 * process in the caller's own namespace; the split left 12 call edges crossing
 * namespaces with no `<bpmn:import>` between them, which a conformant tool
 * cannot resolve. It is also the IRI every existing `<bpmn:import namespace>`
 * already used. Nothing in this repository resolved a QName against it, so the
 * change was invisible here and only a standards tool would have noticed.
 *
 * Bootstrap's diagrams use `…/bootstrap/workflows` on purpose: a different
 * instance, so a different set of process ids.
 */
export const WORKFLOWS_NS = "https://litlfred.github.io/folio-assistant/workflows";

/** Every XML namespace this project mints for itself. */
export const OWN_XML_NAMESPACES = [FOLIO_BPMN_NS, LEGACY_FOLIO_BPMN_NS] as const;

/**
 * The prefixes those namespaces bind to in a `@context` — and each prefix IS
 * the declaring instance's stub.
 *
 * Owner, 2026-09-23: "prefix -> match stub". Each namespace above is already
 * `<canonical>/<stub>/ns#`, so the path segment, the stub and the prefix are
 * now ONE word in three places instead of three words that must agree. They
 * were `bs`, `cat` and `fac` until then, and the cost of three spellings was
 * measured rather than argued (bean `zaqn`): `CONTENT_CONTEXT` renamed its
 * binding from `folio` to `fac` and kept writing twenty terms as `folio:…`,
 * so every content term in 1,737 committed documents expanded to an IRI in a
 * URI scheme called `folio` — well-formed, meaningless, and joined with
 * nothing. An abbreviation is a second name, and a second name is where the
 * two drift.
 *
 * `check-context-emission.ts` enforces both halves: a prefix a document USES
 * must be bound, and a binding onto one of our own namespaces must be spelt
 * as that namespace's stub.
 */
export const NS_PREFIXES = {
  bootstrap: CAT_BOOTSTRAP_NS,
  "cat-harness": CAT_HARNESS_NS,
  "folio-assistant-core": CORE_NS,
} as const;

/** One of our own prefixes — each the stub of the instance declaring it. */
export type NsPrefix = keyof typeof NS_PREFIXES;

/** The instance stub a namespace of ours names — the segment before `/ns#`. */
export function stubOfNamespace(ns: string): string | undefined {
  return /\/([^/]+)\/ns#$/.exec(ns)?.[1];
}

/** The namespace a layer's terms hang off. */
export function namespaceForLayer(layer: TermLayer): string {
  return layer === "bootstrap" ? CAT_BOOTSTRAP_NS : layer === "core" ? CORE_NS : CAT_HARNESS_NS;
}

/** The prefix a layer's terms are written with. */
export function prefixForLayer(layer: TermLayer): NsPrefix {
  return layer === "bootstrap" ? "bootstrap" : layer === "core" ? "folio-assistant-core" : "cat-harness";
}

/**
 * A term's full IRI — the single call every minting site makes.
 *
 * This replaced 93 hand-written per-term template literals
 * across four modules. Each of those was a place to pick the wrong namespace
 * once the namespaces stopped being one, and `cat-harness.ts` alone mints
 * terms in all three layers — `KGraph` and `SchemaGraph` are
 * bootstrap's, `BeanGraph` is the harness's, `VoiceGraph` is core's — so
 * "which namespace does this file use" has no file-level answer.
 */
export function termIri(name: string): string {
  return `${namespaceForLayer(termLayer(name))}${name}`;
}
