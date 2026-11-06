import { describe, expect, test } from "bun:test";

import type { DublinCoreRecord } from "../platform/index.js";
import { checkClassification, decideL1, inferL1, LAYER_SCHEME, type IntakeRecord } from "./l1-membership.ts";

const rec = (fields: [string, string | undefined, string][]): DublinCoreRecord => ({
  $schema: "folio-dublin-core/v1",
  id: "x",
  fields: fields.map(([element, qualifier, value]) => ({ schema: "dc", element, ...(qualifier ? { qualifier } : {}), values: [{ value }] })),
  provenance: { source: "test", retrievedAt: "2026-10-07T00:00:00Z", method: "test" },
}) as DublinCoreRecord;

// The three immunization sources, as IRIS describes them.
const LNOB = rec([["title", undefined, "Leave no one behind: guidance for planning and implementing catch-up vaccination"], ["type", undefined, "Publications"]]);
const DAK = rec([
  ["title", undefined, "Digital adaptation kit for immunizations: operational requirements for implementing WHO recommendations"],
  ["relation", "ispartofseries", "Smart guidelines;"],
]);
const DDCC = rec([["title", undefined, "Digital documentation of COVID-19 certificates: vaccination status: technical specifications and implementation guidance"]]);

const intake = (classifications: IntakeRecord["classifications"]): IntakeRecord => ({ files: [], classifications });

describe("inferL1", () => {
  test("the owner's rulings of 2026-10-07 are what the rule infers", () => {
    expect(inferL1(LNOB)).toMatchObject({ member: true, properties: { publicationType: "implementation-guidance" } });
    expect(inferL1(DAK)?.member).toBe(false);
    expect(inferL1(DDCC)?.member).toBe(false);
  });
  test("no signal is undetermined, not 'no'", () => {
    expect(inferL1(rec([["title", undefined, "Annual report 2023"]]))).toBeUndefined();
  });
});

describe("decideL1", () => {
  test("declared beats context beats inferred, and disagreement is reported", () => {
    const d = decideL1(
      intake([
        { scheme: LAYER_SCHEME, code: "l1", member: false, source: "declared", basis: "owner", by: "ritikarawlani", at: "2026-10-07" },
        { scheme: LAYER_SCHEME, code: "l1", member: true, source: "context", basis: "cited by a DAK" },
      ]),
      LNOB,
    );
    expect(d.status).toBe("not-member");
    expect(d.derivation).toBe("decided");
    expect(d.disagreements).toHaveLength(2);
  });
  test("inferred alone decides, as inferred", () => {
    const d = decideL1(undefined, LNOB);
    expect(d).toMatchObject({ status: "member", derivation: "inferred", publicationType: "implementation-guidance", disagreements: [] });
  });
  test("a deciding record without a type borrows an agreeing lower one's", () => {
    const d = decideL1(intake([{ scheme: LAYER_SCHEME, code: "l1", member: true, source: "declared", basis: "owner" }]), LNOB);
    expect(d.publicationType).toBe("implementation-guidance");
    expect(d.disagreements).toEqual([]);
  });
  test("nothing recorded and nothing inferred is undetermined", () => {
    expect(decideL1(undefined, undefined).status).toBe("undetermined");
  });
});

describe("checkClassification holds the platform schema's rules", () => {
  test("a good record passes; each broken field is named", () => {
    expect(checkClassification({ scheme: LAYER_SCHEME, code: "l1", member: true, source: "context", basis: "b" })).toEqual([]);
    expect(checkClassification({ scheme: "", code: "l1", member: "yes", source: "guessed", basis: "b", at: "Oct", extra: 1 })).toEqual([
      "scheme: a non-empty string",
      "member: a boolean",
      "source: declared, context or inferred",
      "at: an ISO 8601 date",
      "extra: not a field",
    ]);
  });
  test("decideL1 refuses an intake whose record breaks them", () => {
    expect(() => decideL1(intake([{ scheme: LAYER_SCHEME, code: "l1", member: true, source: "declared", basis: "" }]), undefined)).toThrow();
  });
});
