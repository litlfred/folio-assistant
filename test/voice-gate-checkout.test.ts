/**
 * `voice-gate` tests about the WHOLE CHECKOUT, moved here from
 * `cat-harness/scripts/tests/voice-gate.test.ts` (bean `7zz1`, owner ruling
 * 2026-10-06 "Top-level instance"): each reads the voices folio-assistant-sci,
 * smart-base and who-iris ship, or the root instance's voice configuration,
 * which only the checkout holds. Standing alone, cat-harness has none of it,
 * and `check:cat-harness-standalone` collects every test in that layer. The
 * rest of that file's tests stay there; every path here is composed from
 * ORIGIN_DIR, the directory they were written in, so nothing they read
 * changed.
 */
import { describe, test, expect } from "bun:test";
import { join } from "node:path";

import { readActiveVoices } from "../cat-harness/schemas/voices";
import { qaCriteriaByIdFor } from "../cat-harness/content/pipeline/qa-criteria-registry";
import { repoRootFor } from "../cat-harness/schemas/cat-harness.js";

/** The directory these tests were written in (`cat-harness/scripts/tests/`): every path below is composed from it exactly as it was before the move, so nothing they read changed. */
const ORIGIN_DIR = join(import.meta.dir, "../cat-harness/scripts/tests");

describe("readActiveVoices", () => {

  test("this instance activates no voice", () => {
    // Issue #208: "the folio-asst's own docuemtnation conent doesnt have any
    // voice". Asserted so that activating one here is a deliberate act.
    //
    // The INSTANCE root, and it has to be: a config belongs to an instance
    // and is named after it, so the question "what does this activate" is
    // only answerable of something that declares itself. `cat-harness/` is
    // where `folio-assistant` is declared; its config sits one level up at
    // the checkout root, and the outward walk finds it there.
    const inst = join(ORIGIN_DIR, "../..");
    expect(readActiveVoices(inst)).toEqual([]);
  });

  test("the instantiated checkout root now answers like any configured instance", () => {
    // The other half of the change, asserted rather than left implicit: the
    // root is instantiated, so its answer is a DECISION rather than an
    // absence. Until 2026-09-30 that decision was "no voice"; the owner then
    // activated the base skill-authoring voice for this checkout's skills
    // (round 5, issue #1694). Still determined, which is the point here.
    const root = repoRootFor(join(ORIGIN_DIR, "../.."));
    expect(readActiveVoices(root)).toEqual(["agent-skill-authoring"]);
  });
});

describe("the four shipped voices each have a criterion", () => {
  // Issue #208: "make sure agentic sidecaras are set up for each". One criterion
  // per VOICE rather than per rule — 34 rules would put 30 permanently
  // `needs-agent` rows on every sidecar, a queue nobody drains.
  //
  // Read through `qaCriteriaByIdFor` rather than the static `QA_CRITERIA_BY_ID`:
  // since bean `btuv` these four are DERIVED from the voices the repository
  // ships, so the static index no longer carries them and a consumer that reads
  // it alone sees none. That is the consumer-facing half of the change, and this
  // block is where it is checked — `voice-criteria.test.ts` checks the
  // derivation itself.
  const byId = qaCriteriaByIdFor(join(ORIGIN_DIR, "../.."));
  for (const id of [
    "voice-overlay-who-editorial",
    "voice-overlay-who-guideline-development",
    "voice-overlay-who-publication-design",
    "voice-overlay-milnor",
  ]) {
    test(`${id} is registered, voice-scoped and agent-adjudicated`, () => {
      const def = byId[id];
      expect(def).toBeDefined();
      expect(def!.domain).toBe("voice");
      expect(def!.voices).toHaveLength(1);
      expect(def!.automated).toBe(false);
    });
  }
});
