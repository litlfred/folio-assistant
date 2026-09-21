/**
 * The generated bootstrap schemas, against the contract they replace.
 *
 * @module cat-bootstrap-tools/schemas/discussion.test
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

import { DiscussionInputSchema, DiscussionOutputSchema } from "./discussion.ts";

const ROOT = join(import.meta.dir, "..", "..");
const read = (p: string): Record<string, unknown> => JSON.parse(readFileSync(join(ROOT, p), "utf8"));

const INPUT = read("cat-bootstrap/skills/discussion.input.schema.json");
const OUTPUT = read("cat-bootstrap/skills/discussion.output.schema.json");

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
];

describe("the generated bootstrap schemas", () => {
  test("keep their published `$id` — it is a contract, cited from five languages' catalogues", () => {
    expect(INPUT.$id).toBe(
      "https://litlfred.github.io/folio-assistant/cat-bootstrap/skills/discussion/input.schema.json",
    );
    expect(OUTPUT.$id).toBe(
      "https://litlfred.github.io/folio-assistant/cat-bootstrap/skills/discussion/output.schema.json",
    );
  });

  test("carry the two conditionals Zod cannot export", () => {
    // Without this the rest of the suite still passes on the VALID cases, so
    // this asserts the mechanism as well as its effect.
    expect(OUTPUT.allOf).toHaveLength(2);
  });

  test("do NOT tighten the contract with additionalProperties", () => {
    // The hand-written documents carried none at any depth. Publishing
    // `additionalProperties: false` would reject documents that validate
    // today — a tightening nobody asked for, arriving as a side effect of
    // choosing Zod.
    expect(JSON.stringify(INPUT)).not.toContain("additionalProperties");
    expect(JSON.stringify(OUTPUT)).not.toContain("additionalProperties");
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
