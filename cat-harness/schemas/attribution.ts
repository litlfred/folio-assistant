/**
 * Who wrote a piece of derived content — bean `iqim`.
 *
 * ## A narrative is a claim by someone, not a property of the file
 *
 * Text lifted verbatim out of a PDF has no author: it is the source document's,
 * and `provenance: "ingested"` says exactly that. A *narrative* — an image
 * description, a transcript, a translation, a dataset summary — is somebody's
 * account of the thing, and the difference between "a human curator described
 * this figure" and "a model described it, version X" is precisely what a reader
 * needs in order to weigh it. It is also unrecoverable once lost.
 *
 * It makes staleness findable too: when a model is superseded, everything it
 * wrote can be re-generated or re-reviewed **as a set**, which is impossible if
 * the attribution was never recorded.
 *
 * ## The vocabulary is the QA reviewer's, not a second one
 *
 * `script | agent | human` is already how this repository names the three sorts
 * of participant, in `schemas/block-qa.ts`. That constant now lives here and is
 * re-exported there, so there is ONE spelling. `rlp5` is the standing record of
 * what a second spelling costs: three copies of `slugify`, already drifted, one
 * of them producing a different document id from the same filename.
 *
 * What is NOT reused is `QaReviewer` itself. Most of it (`script_hash`,
 * `deps_hash`, `def_hash`) is about whether a CRITERION's cached verdict is
 * stale, which has nothing to do with authoring a narrative. Sharing the
 * vocabulary is one fact in one place; sharing the whole interface would drag
 * QA machinery into content attribution to save a type.
 *
 * ## `agent` requires a model, structurally
 *
 * The bean asks for "an agent together with its **model version**". An agent
 * attribution with no model is the case the field exists to prevent — it
 * records that a machine wrote it while losing the only part that lets anyone
 * act on that later. So it is a refinement on the schema, not a convention.
 *
 * @module schemas/attribution
 * @graphNode schema
 */
import { z } from "zod";

/**
 * The three sorts of participant that can author content.
 *
 * - `script` — deterministic code. `id` is the script path.
 * - `agent` — an LLM-driven agent. `id` names the agent, `model` the version.
 * - `human` — a person. `id` is a GitHub login or equivalent.
 *
 * `script` is a distinct kind rather than a flavour of `agent` for the reason
 * the QA vocabulary already separates them: a script's output is reproducible
 * from its source, and its `version` is a revision anyone can check out.
 *
 * The ORDER matches what `block-qa.ts` has always exported, because that file
 * now re-exports this constant: a re-spelling that also silently reorders is
 * the kind of change that shows up somewhere nobody was looking.
 */
export const ATTRIBUTION_KINDS = ["script", "agent", "human"] as const;
export type AttributionKind = (typeof ATTRIBUTION_KINDS)[number];

/** Who authored a piece of derived content. */
export interface Attribution {
  kind: AttributionKind;
  /** Stable identifier — GitHub login, agent name, or script path. */
  id: string;
  /** Version pin: a script revision, or a human's role at the time. */
  version?: string;
  /** LLM model identifier, e.g. `claude-opus-5`. REQUIRED when kind is `agent`. */
  model?: string;
  /** Session identifier, where the authoring run had one. */
  session?: string;
  /** ISO-8601 date the content was authored. */
  date?: string;
  /** The skill or tool that dispatched the authoring, e.g. `folio-core/library-ingestion`. */
  skill?: string;
}

/**
 * The literal that says "nobody authored this — it is the source's own text".
 *
 * A bare string rather than `{kind: "source"}` because it is not an
 * attribution: there is no participant to name. Extracted text belongs to the
 * document it came out of, which `source{}` on `structure.json` already
 * records (bean `nso8`).
 */
export const INGESTED = "ingested" as const;

/**
 * How a piece of content came to exist: extracted, or authored by someone.
 *
 * A **closed** union, which is the load-bearing part. While `provenance` was an
 * open string, `"ingested"` was the only value anything wrote and nothing could
 * tell a description a model had written from text lifted off a page. Closing
 * it does not stop an arm asserting something false, but it does make the
 * *omission* impossible: a new arm has to choose, and choosing `"ingested"` for
 * a generated narrative is a false statement rather than a missing field.
 */
export type Provenance = typeof INGESTED | Attribution;

export const AttributionSchema = z
  .object({
    kind: z.enum(ATTRIBUTION_KINDS),
    id: z.string().min(1),
    version: z.string().optional(),
    model: z.string().optional(),
    session: z.string().optional(),
    date: z.string().optional(),
    skill: z.string().optional(),
  })
  .refine((a) => a.kind !== "agent" || (a.model !== undefined && a.model !== ""), {
    message: "an `agent` attribution must name its `model` — see the module docstring",
    path: ["model"],
  });

export const ProvenanceSchema = z.union([z.literal(INGESTED), AttributionSchema]);

/** True when the content is the source document's own text, with no author. */
export function isIngested(p: unknown): p is typeof INGESTED {
  return p === INGESTED;
}

/** The attribution, or `null` for extracted text. Throws on nothing. */
export function attributionOf(p: unknown): Attribution | null {
  if (isIngested(p)) return null;
  const parsed = AttributionSchema.safeParse(p);
  return parsed.success ? parsed.data : null;
}

/**
 * How a library block's text came to be, per block kind.
 *
 * **Total by test, not by hope.** `scripts/tests/attribution.test.ts` asserts
 * that every `kind` occurring anywhere in `library/` has an entry here, so a
 * narrative arm cannot land a new kind without classifying it — and the moment
 * a kind is classified `authored`, the L1 gate requires an attribution on every
 * block carrying it.
 *
 * The corpus holds two kinds, both extracted. That is a determined
 * classification of everything present, NOT an empty registry: an empty one
 * would let the gate pass having checked nothing, which is the "unknown
 * rendered as a pass" failure this repository keeps paying for. No count is
 * given here on purpose — the previous version said "424 blocks" and was stale
 * the moment `figure` arrived, and a count in prose is a claim rather than
 * evidence. `scripts/tests/attribution.test.ts` counts.
 */
export const LIBRARY_BLOCK_ORIGIN: Record<string, "extracted" | "authored"> = {
  // Verbatim text off the page. `pdf-structure.py` and `pdf-pages.py` both
  // emit this and nothing else, so `"ingested"` is the honest value for it.
  prose: "extracted",
  // Bean `d5f1`. The BLOCK is extracted: its content is an image lifted off
  // the page, as verbatim as prose is. Its `narrative` is authored — but a
  // narrative carries its OWN attribution and its own state machine
  // (`schemas/narrative.ts`), where only a human may confirm a draft, so it is
  // not this registry's business. Classifying the block `authored` on account
  // of a description it may not even have would demand an attribution for the
  // pixels, which nobody wrote.
  figure: "extracted",
};

/** True when blocks of this kind are somebody's account rather than the source's text. */
export function isNarrativeKind(kind: string): boolean {
  return LIBRARY_BLOCK_ORIGIN[kind] === "authored";
}
