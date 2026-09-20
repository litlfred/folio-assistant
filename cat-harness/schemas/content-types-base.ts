/**
 * The content types this layer owns, registered at load time.
 *
 * @module schemas/content-types-base
 * @graphNode schema
 *
 * Separate from `content-type.ts` for the reason `folio-graph-kind.ts` is
 * separate from `cat-harness.ts`: the registry is a mechanism and the entries
 * are a layer's opinion. A layer that does not own a type must not be the
 * place it is declared, and the split is what makes that enforceable rather
 * than merely stated.
 *
 * ONE type is registered here — `harness`, on `harness.json` — because it is
 * the only one this layer owns.
 *
 * ## `dak` and `sushi` are NOT here, and the partition gate is why
 *
 * They were, for about ten minutes, under a comment saying *"registering a
 * type is not claiming it … when a WHO adapter becomes its own layer, those
 * two entries move there."* `check:partition:edges` disagreed, immediately and
 * correctly:
 *
 * ```
 * schemas/content-types-base.ts [folio-assist-core] -> schemas/dak.ts [smart-base]
 * A repo may not import one that depends on it.
 * ```
 *
 * `smart-base` depends on core, so core recognising a DAK means core importing
 * downstream. The comment was right about the destination and wrong that it
 * could wait: recognising `dak.json` needs `DAK_TYPE`, and reaching for it is
 * the edge. They live in {@link module:schemas/dak-content-type}, registered by
 * the layer that owns the model — exactly as `folio-graph-kind.ts` registers
 * `folio` rather than the harness declaring a kind it cannot serve.
 *
 * `ig` is registered nowhere, and that is also deliberate. `79t3` records it as
 * half-formalised — `l3-fhir` exists as a translation content type with `fsh`
 * and `fhir-json` formats, but **nothing declares an IG instance**, so there is
 * no marker file to recognise. An entry for it would mint a type whose
 * membership can never be asserted: something that looks like coverage and
 * detects nothing.
 */
import { defaultContentTypes, type ContentTypeRegistry } from "./content-type";
import { DECLARATION_FILENAME } from "./cat-harness";
import { termIri } from "./namespaces";

/** The `@type` a harness declaration projects to. */
export const HARNESS_TYPE = termIri("Instance");

export function registerBaseContentTypes(registry: ContentTypeRegistry = defaultContentTypes): void {
  registry.register("harness", {
    filename: DECLARATION_FILENAME,
    type: HARNESS_TYPE,
    summary:
      "An instance of the harness — it declares a name, a stub and the directories it holds.",
    facts: (d) => {
      const doc = d as { name?: unknown; stub?: unknown; canonicalUrl?: unknown };
      return {
        name: typeof doc.name === "string" ? doc.name : undefined,
        stub: typeof doc.stub === "string" ? doc.stub : undefined,
        canonicalUrl: typeof doc.canonicalUrl === "string" ? doc.canonicalUrl : undefined,
      };
    },
  });

}

registerBaseContentTypes();
