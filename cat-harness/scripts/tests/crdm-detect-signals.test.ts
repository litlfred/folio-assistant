/**
 * The exclusion list and the skill it was transcribed from must still agree.
 *
 * Bean `xfoh`. The transcription had already drifted when this was written —
 * seven bullets in the skill, five patterns in the runner — and the gap
 * produced a false alarm the runner's own output could not explain. These
 * tests are the thing that was missing, not a restatement of the fix.
 *
 * @module folio-assistant/scripts/tests/crdm-detect-signals
 */

import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, test } from "bun:test";

import {
  EXCLUSIONS,
  detect,
  exclusionDrift,
  parseSkillExclusions,
} from "../../src/crdm/detect-signals.ts";

const root = resolve(import.meta.dir, "../..");
const skillPath = join(root, "methodologies/crdm/crdm-detect.md");
const skill = parseSkillExclusions(readFileSync(skillPath, "utf-8"));

interface Item { number: number; title: string; isFeature: boolean; why: string; text: string }
const corpus: Item[] = JSON.parse(readFileSync(join(root, "scripts/eval/crdm-detect-corpus.json"), "utf-8"));

describe("the exclusion patterns and the skill's prose agree", () => {
  test("every quoted exclusion in the skill is matched by some pattern", () => {
    // The drift that shipped: `"What does this block kind mean?"` was in the
    // skill and in no pattern, so the runner excluded less than the skill says.
    const unmatched = exclusionDrift(skill).filter((d) => d.direction === "unmatched-bullet");
    expect(unmatched.map((d) => d.subject)).toEqual([]);
  });

  test("every pattern comes from a bullet — no exclusion without prose", () => {
    // The more dangerous direction: a pattern suppressing a real detection with
    // nothing in the skill to justify it.
    const orphans = exclusionDrift(skill).filter((d) => d.direction === "orphan-pattern");
    expect(orphans.map((d) => d.subject)).toEqual([]);
  });

  test("a renamed section throws rather than reporting an empty list", () => {
    // `dh4f`: a consumer that scans nothing and calls the run clean.
    expect(() => parseSkillExclusions("# something else\n\n- a bullet\n")).toThrow(/no "## What is NOT/);
  });
});

describe("the bullets a phrase cannot decide are reported, not dropped", () => {
  test("the skill carries at least one judgement-only category", () => {
    // "Bug reports about existing features (unless they imply a redesign)" —
    // no phrase names it, which is exactly why the runner false-alarms on one.
    expect(skill.judgementOnly.length).toBeGreaterThan(0);
  });

  test("a judgement-only bullet is not silently counted as implemented", () => {
    for (const j of skill.judgementOnly) expect(j).not.toContain('"');
  });
});

describe("GUARD: an exclusion must not swallow a real feature request", () => {
  test("no issue labelled a feature is excluded by phrase", () => {
    // Measured over the whole 27-issue population, not a sample. An exclusion
    // that buys precision by silencing a true positive is a worse rule than the
    // one it replaced, and this is the direction that says so.
    const silenced = corpus.filter((i) => i.isFeature && detect(i.text).excluded);
    expect(silenced.map((i) => i.number)).toEqual([]);
  });

  test("the patterns are all case-insensitive — an issue title is not prose", () => {
    for (const p of EXCLUSIONS) expect(p.flags).toContain("i");
  });
});
