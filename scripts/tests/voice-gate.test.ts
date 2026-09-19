/**
 * The voice axis is THREE-VALUED, and collapsing it to two is the defect these
 * pin.
 *
 * A voice is opt-in (issue #208: "we shouldnt autmoatically apply voices. not
 * all authors will want to use the who voice (e.g. a mministry of health)"), so
 * a criterion scoped to a voice must not run on a folio that never adopted it.
 * But "activates nothing" and "could not read the configuration" are different
 * facts, and only the first grants the skip — the same rule
 * `profileExcludesCriterion` follows, for the same reason: a config a tool
 * cannot parse must not silently lose every voice check while reporting clean.
 */
import { describe, test, expect } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  criterionVoices,
  voiceExcludesCriterion,
} from "../../schemas/block-qa";
import { readActiveVoices } from "../../schemas/voices";
import { criterionDefHash } from "../../content/pipeline/qa-utils";
import { QA_CRITERIA_BY_ID } from "../../content/pipeline/qa-criteria-registry";

describe("criterionVoices", () => {
  test("absent means NOT voice-scoped — the opposite default from profiles", () => {
    // `criterionProfiles` returns every profile when absent, because narrowing
    // silently stops a check. `voices` absent means the criterion is part of the
    // base standard, so it returns undefined rather than "all voices".
    expect(criterionVoices({})).toBeUndefined();
    expect(criterionVoices({ voices: ["milnor"] })).toEqual(["milnor"]);
  });
});

describe("voiceExcludesCriterion", () => {
  test("a criterion naming no voice always runs", () => {
    expect(voiceExcludesCriterion({}, [])).toBe(false);
    expect(voiceExcludesCriterion({}, undefined)).toBe(false);
  });

  test("a voice criterion is excluded when the folio activates none", () => {
    expect(voiceExcludesCriterion({ voices: ["who-editorial"] }, [])).toBe(true);
  });

  test("...and runs when its voice is active", () => {
    expect(
      voiceExcludesCriterion({ voices: ["who-editorial"] }, ["who-editorial"]),
    ).toBe(false);
  });

  test("one match out of several is enough", () => {
    expect(
      voiceExcludesCriterion({ voices: ["milnor", "who-editorial"] }, ["milnor"]),
    ).toBe(false);
  });

  test("a different active voice does not satisfy it", () => {
    expect(
      voiceExcludesCriterion({ voices: ["who-editorial"] }, ["milnor"]),
    ).toBe(true);
  });

  test("UNREADABLE config runs the criterion — the third state", () => {
    // The case that must not collapse into "activates nothing". A folio whose
    // config will not parse would otherwise lose every voice check silently.
    expect(voiceExcludesCriterion({ voices: ["who-editorial"] }, undefined)).toBe(
      false,
    );
  });
});

describe("readActiveVoices", () => {
  const tmp = () => mkdtempSync(join(tmpdir(), "voicecfg-"));

  test("no config at all is undefined, not []", () => {
    expect(readActiveVoices(tmp())).toBeUndefined();
  });

  test("a config with no voices key activates none", () => {
    const d = tmp();
    writeFileSync(join(d, "harness.config.json"), '{"contentType":"document"}');
    expect(readActiveVoices(d)).toEqual([]);
  });

  test("a config listing voices returns them in order", () => {
    const d = tmp();
    writeFileSync(
      join(d, "harness.config.json"),
      '{"voices":{"active":["who-editorial","milnor"]}}',
    );
    expect(readActiveVoices(d)).toEqual(["who-editorial", "milnor"]);
  });

  test("UNPARSEABLE config is undefined, not []", () => {
    const d = tmp();
    writeFileSync(join(d, "harness.config.json"), "{ not json");
    expect(readActiveVoices(d)).toBeUndefined();
  });

  test("a voices key of the wrong shape is undefined, not []", () => {
    // The author meant something; guessing which voices they meant is worse
    // than running every check.
    const d = tmp();
    writeFileSync(join(d, "harness.config.json"), '{"voices":{"active":"who-editorial"}}');
    expect(readActiveVoices(d)).toBeUndefined();
  });

  test("this instance activates no voice", () => {
    // Issue #208: "the folio-asst's own docuemtnation conent doesnt have any
    // voice". Asserted so that activating one here is a deliberate act.
    const root = join(import.meta.dir, "../..");
    expect(readActiveVoices(root)).toEqual([]);
  });
});

describe("the voice scope is in the freshness key", () => {
  test("re-scoping a criterion's voices changes its def_hash", () => {
    // Without this, narrowing a criterion to a voice nobody activated would
    // leave every cached verdict in place — bean `cv10` in a new axis.
    expect(criterionDefHash({ depends_on: ["md"] })).not.toBe(
      criterionDefHash({ depends_on: ["md"], voices: ["milnor"] }),
    );
  });
});

describe("the four shipped voices each have a criterion", () => {
  // Issue #208: "make sure agentic sidecaras are set up for each". One criterion
  // per VOICE rather than per rule — 34 rules would put 30 permanently
  // `needs-agent` rows on every sidecar, a queue nobody drains.
  for (const id of [
    "voice-overlay-who-editorial",
    "voice-overlay-who-guideline-development",
    "voice-overlay-who-publication-design",
    "voice-overlay-milnor",
  ]) {
    test(`${id} is registered, voice-scoped and agent-adjudicated`, () => {
      const def = QA_CRITERIA_BY_ID[id];
      expect(def).toBeDefined();
      expect(def!.domain).toBe("voice");
      expect(def!.voices).toHaveLength(1);
      expect(def!.automated).toBe(false);
    });
  }
});
