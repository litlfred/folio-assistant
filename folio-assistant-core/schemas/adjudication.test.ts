/**
 * The adjudication contract.
 *
 * @module folio-assistant-core/schemas/adjudication.test
 * @graphNode none — a test
 *
 * Bean `5vo9`. **The load-bearing cases are the refusals**, and one of them is
 * a cross-layer invariant no single file can hold: `mechanical` must never
 * become an adjudicator kind. Core cannot import the harness's `ActorKind`
 * (core `needs` cat-harness, so the import would run the wrong way), which is
 * exactly why the pair has to be pinned by a test rather than by a shared
 * type.
 */
import { describe, expect, it } from "bun:test";

import {
  ADJUDICATION_SCHEMA_TAG,
  ADJUDICATOR_KINDS,
  AdjudicationAssetSchema,
  AdjudicationOutcomeSchema,
  AdjudicationRequestSchema,
  adjudicationDefects,
  type AdjudicationOutcome,
  type AdjudicationRequest,
} from "./adjudication.js";
import { ACTOR_KINDS } from "../../cat-harness/schemas/role-graph.js";

const REQUEST: AdjudicationRequest = {
  $schema: ADJUDICATION_SCHEMA_TAG,
  id: "adj-1",
  assets: [{ ref: "library/x", state: "referenced" }],
  prompt: "Do the checker and the reviewer disagree about the same thing?",
  codes: [
    { code: "stands", means: "the finding stands" },
    { code: "scope", means: "the criterion does not apply here" },
    { code: "dispensation", means: "it applies, and this is a stated exception" },
  ],
};

const OUTCOME: AdjudicationOutcome = {
  $schema: ADJUDICATION_SCHEMA_TAG,
  request: "adj-1",
  code: "stands",
  codes: ["stands", "scope", "dispensation"],
  reasoning: "Both read the same revision; the finding is about the text, not the version.",
  by: { id: "untainted-adjudicator", kind: "agent", model: "claude-opus-5" },
  at: "2026-09-23",
};

describe("who may adjudicate", () => {
  it("excludes the MECHANICAL kind — the whole reason the step exists", () => {
    // The owner: "ONLY agentic human actor". `system` is this repository's
    // name for the mechanical kind. A judgement a script can perform is a
    // rule, and a rule belongs behind a `folio:decision` gateway.
    expect(ADJUDICATOR_KINDS as readonly string[]).not.toContain("system");
    expect(ADJUDICATOR_KINDS as readonly string[]).not.toContain("external");
  });

  it("uses the HARNESS's spelling, and every excluded kind really exists", () => {
    // Without this the test above is vacuous — it would pass just as well if
    // the names were invented and excluded nothing. It caught exactly that:
    // the first draft read ["human", "agentic"], a second spelling of a
    // concept `skill-package.ts` already names, which is the failure that
    // module's docstring records paying for once already.
    for (const k of ADJUDICATOR_KINDS) {
      expect(ACTOR_KINDS as readonly string[], `adjudicator kind \`${k}\` is unknown to the harness`).toContain(k);
    }
    for (const k of ["system", "external"]) {
      expect(ACTOR_KINDS as readonly string[], `\`${k}\` is not a harness kind, so excluding it is vacuous`).toContain(k);
    }
  });

  it("matches what `adjudication.bpmn` already declares on its adjudicator step", () => {
    // `<folio:fulfilment kinds="person agent"/>` on A_Adjudicate. The contract and
    // the diagram must not disagree about who may adjudicate, and the diagram got
    // there first.
    expect([...ADJUDICATOR_KINDS].sort()).toEqual(["agent", "person"]);
  });

  it("an `agent` adjudicator must name its model", () => {
    const noModel = { ...OUTCOME, by: { id: "a", kind: "agent" as const } };
    expect(AdjudicationOutcomeSchema.safeParse(noModel).success).toBe(false);
    const person = { ...OUTCOME, by: { id: "litlfred", kind: "person" as const } };
    expect(AdjudicationOutcomeSchema.safeParse(person).success).toBe(true);
  });
});

describe("the request", () => {
  it("accepts the worked case", () => {
    expect(AdjudicationRequestSchema.safeParse(REQUEST).success).toBe(true);
  });

  it("REFUSES a single permitted answer — that is assent, not a judgement", () => {
    const one = { ...REQUEST, codes: [REQUEST.codes[0]!] };
    expect(AdjudicationRequestSchema.safeParse(one).success).toBe(false);
  });

  it("refuses two codes sharing a token — the outcome could not say which", () => {
    const dup = {
      ...REQUEST,
      codes: [...REQUEST.codes, { code: "stands", means: "again" }],
    };
    expect(AdjudicationRequestSchema.safeParse(dup).success).toBe(false);
  });

  it("allows NO assets, because a judgement about a process has none", () => {
    // Empty and absent must not differ, which is why `assets` is required and
    // may be `[]` rather than optional.
    expect(AdjudicationRequestSchema.safeParse({ ...REQUEST, assets: [] }).success).toBe(true);
    const { assets: _drop, ...without } = REQUEST;
    expect(AdjudicationRequestSchema.safeParse(without).success).toBe(false);
  });

  it("refuses a misspelled key rather than ignoring it", () => {
    expect(AdjudicationRequestSchema.safeParse({ ...REQUEST, prompts: "x" }).success).toBe(false);
  });
});

describe("an asset says where it is, when it is anywhere", () => {
  it("refuses `materialized` with no locator", () => {
    // Presence asserted without location is the one shape the state rules out.
    expect(AdjudicationAssetSchema.safeParse({ ref: "x", state: "materialized" }).success).toBe(false);
    expect(
      AdjudicationAssetSchema.safeParse({ ref: "x", state: "materialized", at: "library/x/" }).success,
    ).toBe(true);
  });

  it("carries `unknown` as its own state, not a flavour of `referenced`", () => {
    // Inherited from MATERIALIZATION_STATES on purpose: an adjudicator told "here is
    // the evidence" about bytes nobody can find has been misled.
    expect(AdjudicationAssetSchema.safeParse({ ref: "x", state: "unknown" }).success).toBe(true);
  });
});

describe("the outcome", () => {
  it("accepts the worked case, and it answers its request", () => {
    expect(AdjudicationOutcomeSchema.safeParse(OUTCOME).success).toBe(true);
    expect(adjudicationDefects(REQUEST, OUTCOME)).toEqual([]);
  });

  it("REFUSES empty reasoning — what makes an outcome sound is the reason", () => {
    expect(AdjudicationOutcomeSchema.safeParse({ ...OUTCOME, reasoning: "" }).success).toBe(false);
  });

  it("refuses a code outside the enum it records", () => {
    expect(AdjudicationOutcomeSchema.safeParse({ ...OUTCOME, code: "invented" }).success).toBe(false);
  });

  it("reports a code the REQUEST does not permit", () => {
    const off = { ...OUTCOME, code: "other", codes: [...OUTCOME.codes, "other"] };
    const d = adjudicationDefects(REQUEST, off);
    expect(d.some((m) => m.includes("not a permitted answer"))).toBe(true);
  });

  it("reports the wrong request rather than judging it silently", () => {
    expect(adjudicationDefects(REQUEST, { ...OUTCOME, request: "adj-2" })[0]).toContain("adj-2");
  });
});

describe("enum drift — the reason an outcome records its own enum", () => {
  it("is REPORTED when the request's codes have since changed", () => {
    // The cost the layer split accepts: the enum is written in a diagram and
    // in a record. This is what makes the divergence visible instead of
    // silent — an outcome carrying only its code could not be checked at all.
    const widened: AdjudicationRequest = {
      ...REQUEST,
      codes: [...REQUEST.codes, { code: "refer-up", means: "somebody senior decides" }],
    };
    const d = adjudicationDefects(widened, OUTCOME);
    expect(d.some((m) => m.includes("the enum drifted"))).toBe(true);
    // And it says the outcome is not thereby WRONG — a judgement made under
    // the older contract was legitimate when it was made.
    expect(d.find((m) => m.includes("drifted"))).toContain("not wrong");
  });

  it("is NOT reported for a mere reordering", () => {
    // Order is not part of the contract; treating it as one would cry wolf.
    const reordered = { ...OUTCOME, codes: ["dispensation", "stands", "scope"] };
    expect(adjudicationDefects(REQUEST, reordered)).toEqual([]);
  });

  it("reports every defect, not just the first", () => {
    const bad = { ...OUTCOME, request: "nope", code: "other", codes: ["other", "x"] };
    expect(adjudicationDefects(REQUEST, bad).length).toBeGreaterThan(1);
  });
});

describe("it expresses the adjudication that already exists", () => {
  it("carries `adjudication.bpmn`'s three outcomes, each keeping its meaning", () => {
    // The test the bean set itself: the generalisation must express the
    // existing diagram unchanged. Flattening the three to bare tokens would
    // drop exactly what distinguishes them, which is why a code carries
    // `means`.
    expect(AdjudicationRequestSchema.safeParse(REQUEST).success).toBe(true);
    expect(REQUEST.codes.map((c) => c.code)).toEqual(["stands", "scope", "dispensation"]);
    for (const c of REQUEST.codes) expect(c.means.length).toBeGreaterThan(0);
  });

  it("can RESTRICT what the adjudicator sees — `adjudicator_sees`, not the artefact", () => {
    // A contract that always handed over everything would silently undo the
    // untainted-verification epic. The request names its own set, so the
    // artefact simply is not in it.
    const restricted: AdjudicationRequest = {
      ...REQUEST,
      assets: [{ ref: "checker-output", state: "materialized", at: "test/results/x.json" }],
    };
    expect(AdjudicationRequestSchema.safeParse(restricted).success).toBe(true);
    expect(restricted.assets.map((a) => a.ref)).not.toContain("the-artefact");
  });
});
