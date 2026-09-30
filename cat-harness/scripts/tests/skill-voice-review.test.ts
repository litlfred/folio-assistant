/**
 * The skill voice-review axis — bean `rkqp`. What it gates is only whether a
 * current review exists; a rule judged `fail` is recorded, never a finding.
 */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

import {
  evaluateVoiceReviews,
  fileHash,
  skillVoices,
  verdictProblems,
  type SkillVoice,
  type VoiceReview,
} from "../skill-voice-review.ts";

const REPO = resolve(import.meta.dir, "..", "..", "..");

describe("which voices judge skills", () => {
  test("nothing active is an empty set, and an unreadable config is undefined", () => {
    expect(skillVoices(REPO, { active: [] })).toEqual([]);
    expect(skillVoices(REPO, { active: undefined })).toBeUndefined();
  });

  test("the base skill-authoring voice contributes its skill-scoped rules", () => {
    const [base] = skillVoices(REPO, { active: ["agent-skill-authoring"] })!;
    expect(base!.id).toBe("agent-skill-authoring");
    expect(base!.rules.length).toBe(12);
  });

  // An inherited rule keeps the scope it was declared under, so a vendor voice
  // is its own rules PLUS the base's — the resolved union, not the override alone.
  test("a vendor voice resolves through its base", () => {
    const [claude] = skillVoices(REPO, { active: ["agent-skill-authoring-claude"] })!;
    expect(claude!.rules.length).toBe(20);
    expect(claude!.rules.some((r) => r.id.startsWith("as-"))).toBe(true);
  });
});

describe("whether a skill's review is current", () => {
  const dir = mkdtempSync(join(tmpdir(), "voice-review-"));
  const skill = join(dir, "a-skill.md");
  writeFileSync(skill, "# a skill\n");
  const voice: SkillVoice = { id: "v", instance: "i", rules: [{ id: "r1" }, { id: "r2" }] as SkillVoice["rules"], hash: "vh" };
  const review = (over: Partial<VoiceReview> = {}): VoiceReview => ({
    voice: "v",
    instance: "i",
    skill_hash: fileHash(skill)!,
    voice_hash: "vh",
    by: "agent",
    at: "2026-09-30T00:00:00Z",
    verdicts: [
      { rule: "r1", result: "pass" },
      { rule: "r2", result: "fail", note: "no trigger guidance" },
    ],
    ...over,
  });

  test("n/a with no voice active; unknown when undetermined", () => {
    expect(evaluateVoiceReviews(skill, [], []).entry.result).toBe("n/a");
    expect(evaluateVoiceReviews(skill, [], undefined).entry.result).toBe("unknown");
  });

  test("never reviewed is a finding", () => {
    expect(evaluateVoiceReviews(skill, [], [voice]).entry.result).toBe("fail");
  });

  test("a current review passes EVEN WITH a rule judged fail — no gate on rule content", () => {
    const { entry, reviews } = evaluateVoiceReviews(skill, [review()], [voice]);
    expect(entry.result).toBe("pass");
    expect(reviews[0]!.verdicts[1]!.result).toBe("fail");
  });

  test("a changed skill or a changed voice makes the review stale, and the old review is kept", () => {
    const stale = evaluateVoiceReviews(skill, [review({ skill_hash: "old" })], [voice]);
    expect(stale.entry.result).toBe("fail");
    expect(stale.reviews).toHaveLength(1);
    expect(evaluateVoiceReviews(skill, [review({ voice_hash: "old" })], [voice]).entry.result).toBe("fail");
  });

  test("verdicts must cover each rule once, and explain every non-pass", () => {
    expect(verdictProblems(voice, review().verdicts)).toEqual([]);
    expect(verdictProblems(voice, [{ rule: "r1", result: "pass" }])).toEqual(["r2: no verdict"]);
    expect(verdictProblems(voice, [{ rule: "r1", result: "pass" }, { rule: "r2", result: "fail" }])).toEqual([
      "r2: a fail verdict needs a note saying why",
    ]);
    expect(verdictProblems(voice, [...review().verdicts, { rule: "zz", result: "pass" }])).toEqual(["zz: not a skill rule of v"]);
  });
});
