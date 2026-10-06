/**
 * The attestation store — bean `2gst`. The schema holds only judgements, the
 * path mirrors the derived family's tree, and a read answers in five states
 * where a miss or an absent store is "never attested" only once the prior derived file has been read.
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  ATTESTATION_FAMILIES,
  attestationPathFor,
  attestationsHomeFor,
  QA_ATTESTATIONS_SCHEMA,
  QaAttestationsSchema,
  readAttestationFile,
  serialiseAttestations,
  type KgAttestations,
} from "./qa-attestations";
import { defaultGraphTypologies } from "./cat-harness";
import { KgQaReportSchema } from "./kg-qa";

const pair = {
  kind: "implements" as const,
  prose: "cat-harness/processes/p.bpmn",
  code: ".github/workflows/p.yml",
  prose_hash: "0123456789ab",
  code_hash: "ba9876543210",
  by: "baseline" as const,
};
const file = (over: Partial<KgAttestations> = {}): KgAttestations => ({
  $schema: QA_ATTESTATIONS_SCHEMA,
  family: "kg-qa",
  subject: { kind: "process", id: "Process_P", path: "processes/p.bpmn" },
  pair_attestations: [pair],
  ...over,
});

describe("qa-attestations/v1", () => {
  test("a kg-qa file with pair attestations and voice reviews validates", () => {
    const voice = {
      voice: "v",
      instance: "i",
      skill_hash: "s",
      voice_hash: "h",
      by: "agent" as const,
      at: "2026-10-01T00:00:00Z",
      verdicts: [{ rule: "r", result: "pass" as const }],
    };
    expect(QaAttestationsSchema.safeParse(file({ voice_reviews: [voice] })).success).toBe(true);
  });

  test("it holds ONLY judgements: a derived field is refused", () => {
    // A store that also took `criteria` or `totals` would be a second copy of
    // the derived verdict, free to disagree with the one on the branch.
    expect(QaAttestationsSchema.safeParse({ ...file(), criteria: {} }).success).toBe(false);
    expect(QaAttestationsSchema.safeParse({ ...file(), totals: {} }).success).toBe(false);
  });

  test("every judgement pins the hash it attested, so staleness is detectable", () => {
    const { code_hash: _drop, ...noHash } = pair;
    expect(QaAttestationsSchema.safeParse(file({ pair_attestations: [noHash as typeof pair] })).success).toBe(false);
  });

  test("the family is one of the shared list: kg-qa (bean 2gst), block-qa and translation-qa (bean 8wj1)", () => {
    expect([...ATTESTATION_FAMILIES]).toEqual(["kg-qa", "block-qa", "translation-qa", "bib-verification", "bib-human-review"]);
    expect(QaAttestationsSchema.safeParse({ ...file(), family: "lsi" }).success).toBe(false);
  });

  test("the graph typology is registered, as state, with this validator", () => {
    const kind = defaultGraphTypologies.get("attestations");
    expect(kind?.holds).toBe("state");
    expect(kind?.validator).toBe("schemas/qa-attestations.ts#QaAttestationsSchema");
  });
});

describe("where an attestation lives", () => {
  test("the same mirrored path as the derived sidecar, under <home>/<family>/", () => {
    const p = attestationPathFor(
      "/r/inst/test/results/kg-qa/skills/pkg/a.kg-qa.json",
      "/r/inst/test/results/kg-qa",
      "/r/inst/test/attestations",
      "kg-qa",
      ".kg-qa.json",
    );
    expect(p).toBe("/r/inst/test/attestations/kg-qa/skills/pkg/a.attestations.json");
  });

  test("a sidecar outside the derived tree is a caller's bug, never a quiet miss", () => {
    expect(() => attestationPathFor("/elsewhere/a.kg-qa.json", "/r/kg-qa", "/r/att", "kg-qa", ".kg-qa.json")).toThrow();
  });

  test("an instance with no declaration falls back to the convention", () => {
    const root = mkdtempSync(join(tmpdir(), "att-home-"));
    const conv = join(root, "test", "attestations");
    expect(attestationsHomeFor(root)).toEqual({ root: conv, by: "convention", storeRoot: conv });
  });
});

describe("reading — five states, and a miss or an absent store is 'never attested' only after the prior is read", () => {
  const home = mkdtempSync(join(tmpdir(), "att-read-"));
  const tree = join(home, "kg-qa");
  const path = join(tree, "processes", "p.attestations.json");

  test("no store at all is ABSENT, not a miss — the writer then moves the prior's judgements (owner ruling 2)", () => {
    expect(readAttestationFile(path, join(home, "absent")).state).toBe("absent");
  });

  test("a store path that is not a directory is UNKNOWN", () => {
    const notDir = join(home, "a-file");
    writeFileSync(notDir, "");
    expect(readAttestationFile(path, notDir).state).toBe("unknown");
  });

  test("a store with no file for this subject is a miss — even with no family tree under it yet", () => {
    expect(readAttestationFile(path, home).state).toBe("miss");
    mkdirSync(join(tree, "processes"), { recursive: true });
    expect(readAttestationFile(path, tree).state).toBe("miss");
  });

  test("a conflict-marked or invalid file is CORRUPT, never an empty list", () => {
    writeFileSync(path, "<<<<<<< ours\n{}\n=======\n{}\n>>>>>>> theirs\n");
    expect(readAttestationFile(path, tree).state).toBe("corrupt");
    writeFileSync(path, JSON.stringify({ $schema: QA_ATTESTATIONS_SCHEMA, family: "kg-qa" }));
    expect(readAttestationFile(path, tree).state).toBe("corrupt");
  });

  test("a valid file is a hit, returned as written — key order included", () => {
    // Keys deliberately NOT in schema order: zod would rebuild them, and a
    // writer round-tripping through it would rewrite every entry.
    const reordered = { ...file(), pair_attestations: [{ reason: "r", ...pair, by: "agent" }] };
    writeFileSync(path, serialiseAttestations(reordered as KgAttestations));
    const r = readAttestationFile(path, tree);
    expect(r.state).toBe("hit");
    if (r.state !== "hit") return;
    expect(JSON.stringify(r.file)).toBe(JSON.stringify(reordered));
    expect(r.text.endsWith("\n")).toBe(true);
  });
});

describe("the kg-qa sidecar no longer carries judgements", () => {
  test("KgQaReportSchema refuses pair_attestations and voice_reviews", () => {
    const derived = { $schema: "kg-qa/v1", subject: { kind: "process", id: "P", path: "p.bpmn" }, source_hash: null, criteria: {}, totals: { pass: 0, fail: 0, "n/a": 0, unknown: 0 } };
    expect(KgQaReportSchema.safeParse(derived).success).toBe(true);
    expect(KgQaReportSchema.safeParse({ ...derived, pair_attestations: [pair] }).success).toBe(false);
    expect(KgQaReportSchema.safeParse({ ...derived, voice_reviews: [] }).success).toBe(false);
  });
});
