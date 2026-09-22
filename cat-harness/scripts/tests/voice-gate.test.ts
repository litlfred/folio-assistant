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
import { qaCriteriaByIdFor } from "../../content/pipeline/qa-criteria-registry";
import { repoRootFor } from "../../schemas/cat-harness.js";
import { writeInstanceConfig } from "../../test/support/instance-fixture.js";

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
    writeInstanceConfig(d, '{"contentType":"document"}');
    expect(readActiveVoices(d)).toEqual([]);
  });

  test("a config listing voices returns them in order", () => {
    const d = tmp();
    writeInstanceConfig(d, '{"voices":{"active":["who-editorial","milnor"]}}',
    );
    expect(readActiveVoices(d)).toEqual(["who-editorial", "milnor"]);
  });

  test("folio.config.json is NOT read here either — the old name is dead", () => {
    // Bean `9ici`. `harness-dirs.test.ts` asserts the hard break for
    // `resolveHarnessConfigPath`; this is the case it did not cover, and the
    // one that was live: this function looped over BOTH names until
    // 2026-09-20, so an old-name folio got a DETERMINED voice list while every
    // other setting was dropped in silence.
    //
    // `undefined` is the assertion that matters, not `[]`. The third state
    // makes voice criteria RUN; `[]` would grant them a skip on the strength
    // of a file the rest of the platform refuses to read.
    const d = tmp();
    writeFileSync(
      join(d, "folio.config.json"),
      '{"voices":{"active":["who-editorial"]}}',
    );
    expect(readActiveVoices(d)).toBeUndefined();
  });

  test("UNPARSEABLE config is undefined, not []", () => {
    const d = tmp();
    writeInstanceConfig(d, "{ not json");
    expect(readActiveVoices(d)).toBeUndefined();
  });

  test("a voices key of the wrong shape is undefined, not []", () => {
    // The author meant something; guessing which voices they meant is worse
    // than running every check.
    const d = tmp();
    writeInstanceConfig(d, '{"voices":{"active":"who-editorial"}}');
    expect(readActiveVoices(d)).toBeUndefined();
  });

  test("this instance activates no voice", () => {
    // Issue #208: "the folio-asst's own docuemtnation conent doesnt have any
    // voice". Asserted so that activating one here is a deliberate act.
    //
    // The INSTANCE root, and it has to be: a config belongs to an instance
    // and is named after it, so the question "what does this activate" is
    // only answerable of something that declares itself. `cat-harness/` is
    // where `folio-assistant` is declared; its config sits one level up at
    // the checkout root, and the outward walk finds it there.
    const inst = join(import.meta.dir, "../..");
    expect(readActiveVoices(inst)).toEqual([]);
  });

  test("an instance with NO config of its own is `undefined`, not `[]`", () => {
    // The contrast that keeps the assertion above meaningful: "activates
    // nothing" and "could not determine" are different answers, and
    // collapsing them would let that test pass over a directory nobody read.
    //
    // It USED to be made with the checkout root, which had no config. That
    // stopped being true on 2026-09-21, when the owner instantiated three
    // harnesses here — "boot strap, cat harness and folioasistant should be
    // instantaited" — so `folio-assistant.config.json` exists and the root now
    // answers `[]` like any other configured instance. The PROPERTY is
    // unchanged and still guarded; it is demonstrated on an instance that
    // genuinely has no config, which `check:instance-config` calls a
    // legitimate state.
    //
    // It also still says why `repoRootFor` is the wrong move here: with a
    // config per instance, the repo root is a DIFFERENT instance's question.
    //
    // THE SUBJECT CHANGED ON 2026-09-21, AND THE PROPERTY DID NOT. This used
    // to point at `who-iris`, an instance that DECLARED and had no config —
    // a real state while a declaration (`harness.json`) and a config were two
    // files. `harness.json` was excised and they are one, so every declared
    // instance has a config file and `who-iris` now answers `[]` like any
    // other. `[]` is a DETERMINED answer ("no voices are active") and the
    // whole point here is the UNDETERMINED one.
    //
    // So the third state is demonstrated where it still lives: a directory
    // that declares nothing at all. Moving the subject rather than weakening
    // the assertion — `undefined` is what makes the criteria RUN, and a test
    // that accepted `[]` here would have stopped guarding that.
    const unconfigured = mkdtempSync(join(tmpdir(), "voice-undeclared-"));
    expect(readActiveVoices(unconfigured)).toBeUndefined();
  });

  test("the instantiated checkout root now answers like any configured instance", () => {
    // The other half of the change, asserted rather than left implicit: the
    // root is instantiated, so its silence is a DECISION (no voice active)
    // rather than an absence.
    const root = repoRootFor(join(import.meta.dir, "../.."));
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
  //
  // Read through `qaCriteriaByIdFor` rather than the static `QA_CRITERIA_BY_ID`:
  // since bean `btuv` these four are DERIVED from the voices the repository
  // ships, so the static index no longer carries them and a consumer that reads
  // it alone sees none. That is the consumer-facing half of the change, and this
  // block is where it is checked — `voice-criteria.test.ts` checks the
  // derivation itself.
  const byId = qaCriteriaByIdFor(join(import.meta.dir, "../.."));
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
