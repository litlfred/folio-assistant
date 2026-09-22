/**
 * A methodology node's front matter — `folio-methodology/v1`.
 *
 * ## Why this did not exist, and what its absence cost
 *
 * The tag `$schema: folio-methodology/v1` was introduced on 2026-09-20 and
 * carried by four files. Measured 2026-09-22: it appeared in **no `.ts` file in
 * the repository**. So the nodes declared a schema that nothing had written —
 * the `declaration nothing checks` failure this repository keeps naming, in its
 * purest form, because here the declaration was a *version number*. A malformed
 * methodology, a missing `origin`, an `applies-when` phrased so the selection
 * question cannot reach it: none of it was detectable.
 *
 * That matters more for this kind than for most. `methodology-adoption`
 * requires an adopted methodology to be "external and named", with "an origin:
 * authors, a publication, a standards body", and states that a method without
 * one "is a house process — write it as a skill and do not dress it as an
 * adoption". The whole distinction rests on a front-matter field, and until now
 * that field could simply be absent.
 *
 * ## `evidence` is optional, and that is the point of the QA axis
 *
 * A node may cite an origin whose source is not in any library. Making
 * `evidence` required would have made every existing methodology invalid on the
 * day this schema landed, which is the "check that cries wolf" failure
 * `known-skills.ts` names: a gate that fails on six things nobody has decided
 * about is a gate somebody switches off.
 *
 * So the schema permits its absence and `check-methodology-evidence.ts` REPORTS
 * it as a finding. Optional in the schema, visible in the sidecar, gated by
 * nobody — which is the same division `check:subgraphs` uses for cross-subgraph
 * edges, and for the same reason.
 *
 * @graphNode schema
 * @module schemas/methodology
 */
import { z } from "zod";

/** The tag a methodology node carries in its front matter. */
export const METHODOLOGY_SCHEMA_TAG = "folio-methodology/v1";

/**
 * Front matter of a methodology node.
 *
 * `strict()` is deliberate. A misspelled `applies_when` beside a correct
 * `applies-when` would otherwise validate, and the selection question would
 * silently never reach the node — a failure indistinguishable from a
 * methodology nobody selects because it genuinely does not apply.
 */
export const MethodologyFrontMatterSchema = z
  .object({
    $schema: z.literal(METHODOLOGY_SCHEMA_TAG),
    /** Stable id, referenced from skills and diagrams. Kebab-case, like a skill's. */
    name: z
      .string()
      .min(1)
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "a methodology `name` is kebab-case, like a skill id"),
    /** What a reader sees. Not the id with capitals — it may name the acronym's expansion. */
    title: z.string().min(1),
    /**
     * Authors, a publication, a standards body.
     *
     * REQUIRED, because it is the whole line between an adoption and a house
     * process, and `methodology-adoption` makes that line load-bearing. A node
     * with no origin should be a skill.
     *
     * It is free prose rather than a structured citation on purpose: one of
     * these origins is *contested* — `swot.md` records that no academic
     * reference supports the usual attribution — and a structured `author`
     * field would force that node to assert a single answer. A citation format
     * that cannot express "the literature disagrees" would make the corpus
     * wrong in exactly the case an evidence base exists for.
     */
    origin: z.string().min(1),
    /**
     * When this methodology applies, phrased so `methodology-adoption`'s
     * selection question can reach it — and saying what it is NOT for.
     *
     * Required. A methodology whose applicability is unstated is one an agent
     * picks by resemblance, which is how the house method gets in.
     */
    "applies-when": z.string().min(1),
    /**
     * The ingested sources, each as `library/<bib-slug>`.
     *
     * Optional — see the module docstring. Each entry must be a library
     * reference, not a URL and not a prose citation: the point is that a reader
     * can open it from this checkout, and a URL is precisely the thing that
     * resolves against nothing.
     *
     * ## An ARRAY, and it became one the day a second source arrived
     *
     * This was a single string until 2026-09-22, when `swot` gained a second
     * ingested source. A methodology adopted from secondary literature does not
     * have one canonical text — `swot` is rendered from a theoretical review
     * AND an encyclopedia chapter, which agree on the method, differ in what
     * they cover, and are silent on different things. Forcing a choice between
     * them would make the node cite less than it rests on.
     *
     * An array even for one, matching `graphKinds` and for the same reason:
     * a field with two spellings is a field every consumer must branch on, and
     * the one-element case is the one that would silently become the default.
     * A present-but-empty array is refused — an empty list of sources is
     * `evidence` absent, said in a way that reads as answered.
     */
    evidence: z
      .array(
        z
          .string()
          .regex(/^library\/[a-z0-9][a-z0-9.-]*$/, "each `evidence` entry is a library reference: `library/<bib-slug>`"),
      )
      .min(1, "`evidence: []` is not `no evidence` — omit the field instead")
      .optional(),
  })
  .strict();

export type MethodologyFrontMatter = z.infer<typeof MethodologyFrontMatterSchema>;
