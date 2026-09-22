/**
 * The generated bootstrap schemas, against the contract they replace.
 *
 * @module bootstrap-tools/schemas/discussion.test
 * @graphNode none — a test
 *
 * ## Why a corpus and not a diff
 *
 * A diff of two JSON Schemas tells you the documents differ. It does not tell
 * you whether anything that used to validate now fails, which is the only
 * question a published `$id` raises. So this validates a corpus of documents
 * — each labelled with whether it MUST pass or MUST fail — against the
 * generated schema, and separately against the Zod.
 *
 * The invalid cases are the ones that matter. `zodToJsonSchema` drops
 * `.refine()` entirely, so a generator that forgot to re-apply the two
 * conditionals would emit a schema that accepts every document here —
 * including the two that must be rejected — and a happy-path test would not
 * notice. That is the failure this file exists to catch.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import Ajv from "ajv";

import {
  DiscussionInputSchema,
  DiscussionOutputObjectSchema,
  DiscussionOutputSchema,
  ExchangeEntrySchema,
  ParticipantSchema,
  RepositoryRefSchema,
} from "./discussion.ts";

const ROOT = join(import.meta.dir, "..", "..");
const read = (p: string): Record<string, unknown> => JSON.parse(readFileSync(join(ROOT, p), "utf8"));

const INPUT = read("bootstrap/schemas/discussion.input.schema.json");
const OUTPUT = read("bootstrap/schemas/discussion.output.schema.json");

/** `strict: false` — these are draft-07 documents, not ajv-flavoured ones. */
const ajv = new Ajv({ strict: false, allErrors: true });

const participant = { kind: "person" as const };
const exchange = [{ asked: "which harness?", answered: "cat-harness" }];

/** Every case carries WHY, because a bare fixture teaches the next reader nothing. */
const OUTPUT_CASES: Array<{ why: string; doc: unknown; valid: boolean }> = [
  {
    why: "the ordinary settled answer",
    doc: { outcome: "settled", harness: "cat-harness", determinedBy: "asked", answeredBy: participant, exchange },
    valid: true,
  },
  {
    why: "assumed WITH its documented default named",
    doc: {
      outcome: "settled",
      harness: "cat-harness",
      determinedBy: "assumed",
      assumption: "the README's stated default",
      answeredBy: participant,
      exchange,
    },
    valid: true,
  },
  {
    why: "THE CONDITIONAL: assumed with no assumption — a guess wearing a default's clothes",
    doc: { outcome: "settled", determinedBy: "assumed", answeredBy: participant, exchange },
    valid: false,
  },
  {
    why: "unsettled WITH what remains open, so the next actor resumes",
    doc: { outcome: "unsettled", answeredBy: participant, exchange, stillOpen: ["harness"] },
    valid: true,
  },
  {
    why: "THE CONDITIONAL: unsettled with nothing open — the next actor restarts instead of resuming",
    doc: { outcome: "unsettled", answeredBy: participant, exchange },
    valid: false,
  },
  {
    why: "an empty exchange is not an exchange",
    doc: { outcome: "settled", answeredBy: participant, exchange: [] },
    valid: false,
  },
  {
    why: "answeredBy is required — an answer nobody gave is not evidence",
    doc: { outcome: "settled", exchange },
    valid: false,
  },
  {
    // STRICTNESS, bean `z634`. These documents are written by AGENTS, and the
    // typo'd key is the failure they are most exposed to: before this, a
    // misspelled `assumption` was silently ignored, which is the worst of both
    // answers — the field is absent, so the `assumed` conditional should have
    // fired, and the stray key carried the value that would have satisfied it.
    why: "STRICTNESS: a typo'd key is rejected rather than ignored",
    doc: {
      outcome: "settled",
      harness: "cat-harness",
      determinedBy: "assumed",
      assumtion: "the README's stated default",
      answeredBy: participant,
      exchange,
    },
    valid: false,
  },
  {
    // The same document spelled correctly. Without this pair the case above
    // would still pass if the schema rejected it for the WRONG reason — the
    // missing `assumption` rather than the extra key — and the two are
    // indistinguishable from one `valid: false`.
    why: "...and the same document with the key spelled right is accepted",
    doc: {
      outcome: "settled",
      harness: "cat-harness",
      determinedBy: "assumed",
      assumption: "the README's stated default",
      answeredBy: participant,
      exchange,
    },
    valid: true,
  },
  {
    why: "STRICTNESS reaches NESTED objects too — a participant with a stray key",
    doc: {
      outcome: "settled",
      harness: "cat-harness",
      determinedBy: "asked",
      answeredBy: { ...participant, nickname: "not a field" },
      exchange,
    },
    valid: false,
  },
];

const INPUT_CASES: Array<{ why: string; doc: unknown; valid: boolean }> = [
  { why: "the minimum an Initiator can populate", doc: { open: ["harness"], askedOf: participant }, valid: true },
  {
    why: "with everything it might have narrowed from context",
    doc: {
      open: ["harness", "repositories"],
      askedOf: { kind: "agent", id: "session_x" },
      candidates: ["cat-harness"],
      knownRepositories: [{ url: "https://example.invalid/r", role: "read-from" }],
      context: "read the README",
    },
    valid: true,
  },
  { why: "nothing open means there is nothing to ask", doc: { open: [], askedOf: participant }, valid: false },
  { why: "askedOf is required — the kind is recorded, never inferred", doc: { open: ["harness"] }, valid: false },
  {
    why: "a repository must say which part it plays",
    doc: { open: ["harness"], askedOf: participant, knownRepositories: [{ url: "x" }] },
    valid: false,
  },
  {
    why: "STRICTNESS: an extra top-level key is rejected rather than ignored",
    doc: { open: ["harness"], askedOf: participant, contex: "read the README" },
    valid: false,
  },
];

describe("the generated bootstrap schemas", () => {
  test("keep their published `$id` — it is a contract, cited from five languages' catalogues", () => {
    expect(INPUT.$id).toBe(
      "https://litlfred.github.io/folio-assistant/bootstrap/skills/discussion/input.schema.json",
    );
    expect(OUTPUT.$id).toBe(
      "https://litlfred.github.io/folio-assistant/bootstrap/skills/discussion/output.schema.json",
    );
  });

  test("carry the two conditionals Zod cannot export", () => {
    // Without this the rest of the suite still passes on the VALID cases, so
    // this asserts the mechanism as well as its effect.
    expect(OUTPUT.allOf).toHaveLength(2);
  });

  test("ARE strict, at every depth — bean `z634`, decided 2026-09-21", () => {
    // This test asserted the OPPOSITE until 2026-09-21, and the reversal is
    // the bean rather than a change of mind. The port that created these
    // documents stripped `additionalProperties` because the hand-written ones
    // it replaced carried none, and tightening a published contract as a side
    // effect of choosing Zod would have been wrong.
    //
    // `z634` pre-registered the test that settles it — does anything actually
    // PRODUCE one of these documents? Nothing does, the skill doc is silent
    // rather than permissive, and the `$id` was one day old. So nothing can
    // break, and strictness buys the failure these documents are most exposed
    // to: they are agent-authored, and a typo'd key was silently ignored.
    //
    // Counted rather than merely present, because `toContain` would pass on a
    // document strict at the top level and open at every nesting — which is
    // the shape a later `.strict()` dropped from one object would leave, and
    // the one this cannot distinguish from correct.
    const count = (o: unknown) => JSON.stringify(o).split('"additionalProperties":false').length - 1;
    expect(count(INPUT)).toBe(3);
    expect(count(OUTPUT)).toBe(4);
  });

  test("the Zod is strict too, or the two forms disagree about what validates", () => {
    // `z.object()` STRIPS an unknown key and parses successfully; only
    // `.strict()` rejects it. So making the JSON Schema strict without the Zod
    // would publish a contract the source of truth does not hold — caught by
    // the cross-check below rather than reasoned about, which is why that
    // cross-check exists.
    for (const [name, schema] of [
      ["RepositoryRefSchema", RepositoryRefSchema],
      ["ParticipantSchema", ParticipantSchema],
      ["DiscussionInputSchema", DiscussionInputSchema],
      ["ExchangeEntrySchema", ExchangeEntrySchema],
      ["DiscussionOutputObjectSchema", DiscussionOutputObjectSchema],
    ] as const) {
      expect({ [name]: (schema as { _def: { unknownKeys?: string } })._def.unknownKeys }).toEqual({
        [name]: "strict",
      });
    }
  });

  describe("output corpus", () => {
    const validate = ajv.compile(OUTPUT);
    for (const c of OUTPUT_CASES) {
      test(`${c.valid ? "accepts" : "REJECTS"}: ${c.why}`, () => {
        expect(validate(c.doc)).toBe(c.valid);
      });
    }
  });

  describe("input corpus", () => {
    const validate = ajv.compile(INPUT);
    for (const c of INPUT_CASES) {
      test(`${c.valid ? "accepts" : "REJECTS"}: ${c.why}`, () => {
        expect(validate(c.doc)).toBe(c.valid);
      });
    }
  });

  describe("the Zod and the JSON Schema agree", () => {
    // Two forms of one rule is a thing to be uneasy about. This is what makes
    // the duplication safe: in-process validation and a third party following
    // the `$id` must reach the same verdict on every case above.
    const validateOut = ajv.compile(OUTPUT);
    for (const c of OUTPUT_CASES) {
      test(`output — ${c.why}`, () => {
        expect(DiscussionOutputSchema.safeParse(c.doc).success).toBe(validateOut(c.doc));
      });
    }
    const validateIn = ajv.compile(INPUT);
    for (const c of INPUT_CASES) {
      test(`input — ${c.why}`, () => {
        expect(DiscussionInputSchema.safeParse(c.doc).success).toBe(validateIn(c.doc));
      });
    }
  });
});
