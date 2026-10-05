/**
 * The `glossary` graph typology — registered by **core**, not declared by the harness.
 *
 * Owner, 2026-09-23: *"put glossary into folio-assistant-core"*, *"it should be
 * part of general pracice w/ glossary/ page"*, *"can glossary be refefences to
 * external skos schema?"* (yes), and, on the clash with the harness's own
 * swimlane ledger: *"Rename harness one"*. So the harness's kind is now
 * `swimlane-glossary`, and this name belongs to core.
 *
 * A `glossary` directory holds `folio-glossary/v1` documents (schema and SKOS
 * emitter: `folio-assistant-core/schemas/glossary.ts`): local SKOS terms, each
 * `authored`, `candidate` or `could-not-extract` (bean `lqo9`'s three states),
 * linked to EXTERNAL SKOS concepts by `exactMatch` / `closeMatch`, and
 * `members` that reference external concepts without copying them. A whole
 * external scheme is referenced through the declaration's `remoteGraphs` with
 * `graphTypologies: ["glossary"]`.
 *
 * ## Why this module sits in `cat-harness/schemas/`
 *
 * For the reason `folio-graph-typology.ts` does, and `graph-typology-registry.ts`
 * records it: *"The harness must not reach up into core … the kind moves to
 * core with its schema … the `folio` kind is the worked example, registered by
 * core through a load-time side effect."* The declaration reader in
 * `cat-harness.ts` must know the kind to resolve a directory declaring it, and
 * it may not import from `folio-assistant-core/`. So the one line that names
 * the kind lives beside `folio`'s, and is classified core in
 * `scripts/partition/instance-rules.ts`; everything else is in core's tree.
 * No `validator` path, for the same reason `fhir-artifact-index` has none:
 * it resolves under the DECLARING instance's root. `check:glossary` validates
 * instead.
 *
 * @module schemas/glossary-graph-typology
 * @graphNode schema
 */
import { defaultGraphTypologies, type GraphTypologyDef, type GraphTypologyRegistry } from "./graph-typology-registry.js";

export const GLOSSARY_GRAPH_TYPOLOGY: GraphTypologyDef = {
  // Its one family, LISTED with no code: core's validator node names it (bean riit).
  nodeSchemas: { "folio-glossary/v1": {} },
  anyLayer: true,
    description:
      "Terms and what they mean, as W3C SKOS (`folio-glossary/v1`, `folio-assistant-core/schemas/glossary.ts`): local terms, each `authored`, `candidate` or `could-not-extract`, linked to external SKOS concepts by `exactMatch`/`closeMatch`, and external concepts listed as `members` without being copied. A whole external scheme is a `remoteGraphs` entry with `graphTypologies: [\"glossary\"]`. The `glossary` kind is `perInstance`, so every folio built on core gets one. Rendered on the site's `glossary/` page with SKOS JSON-LD beside it; the swimlane ledger is one more source. Read with the [`glossary-terms`](../../library/library-core/glossary-terms.md) skill; gated by `check:glossary`.",
  layer: "core",
  renderable: false,
  // Authored or extracted terms and what they mean: true on their own, read by
  // every rendering, written by no process run. Content, as `scenarios` is.
  holds: "content",
  perInstance: true,
  title: "Glossary",
  summary:
    "SKOS terms (folio-glossary/v1): local terms with definitions and codes, linked to " +
    "external SKOS schemes by exactMatch rather than copied. Rendered on the glossary/ page.",
};

/** Register `glossary`. Idempotent, like `registerFolioGraphTypology`. */
export function registerGlossaryGraphTypology(registry: GraphTypologyRegistry = defaultGraphTypologies): void {
  registry.register("glossary", GLOSSARY_GRAPH_TYPOLOGY);
}

registerGlossaryGraphTypology();
