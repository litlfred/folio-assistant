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
 * Two are registered here — `harness` and `folio` — because they are the two
 * this layer owns.
 *
 * ## They are NOT the same type, and this repository is the proof
 *
 * `harness.json` says *this is an instance*: a name, a stub, the directories
 * it holds. `harness.config.json` says *this authors folio content*: it
 * carries `contentType`, and `folio_init` writes it.
 *
 * ```
 *                     harness.json   harness.config.json
 *   cat-harness/           yes              NO
 *   the repository root    yes              yes
 * ```
 *
 * So `cat-harness/` is a harness and is **not** a folio — which is exactly
 * right, and is the platform-not-content rule `AGENTS.md` opens with, showing
 * up as a measurable fact about two files rather than as a slogan.
 *
 * This is also what `isFolio` in `folio-intent.dmn` has always meant. That
 * input is documented as *"harness.config.json exists in the working
 * directory"* — so it was never "is this an instance", it is one membership of
 * the set, and `getting-started.md` now says so.
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
import { HARNESS_CONFIG } from "./harness-config";
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

  registry.register("folio", {
    filename: HARNESS_CONFIG,
    type: termIri("Folio"),
    summary:
      "A repository that authors folio content — it declares a content type, and `folio_init` wrote this file.",
    facts: (d) => {
      const doc = d as { contentType?: unknown };
      return {
        // NOT cross-checked against anything today, and that is the honest
        // state: no other marker here states a content type, so this fact has
        // nobody to disagree with. It is carried because a consumer asking
        // "what are you?" wants `paper` or `document`, not just `folio` — and
        // because the day a second marker states it, the cross-check is
        // already wired.
        contentType: typeof doc.contentType === "string" ? doc.contentType : undefined,
      };
    },
  });
}

registerBaseContentTypes();
