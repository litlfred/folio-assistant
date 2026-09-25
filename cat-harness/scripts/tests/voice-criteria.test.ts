/**
 * The voice-overlay criteria are derived from the voices, and the derivation
 * reproduces what four hand-written entries used to say.
 *
 * Bean `btuv`. `qa-criteria-registry.ts` carried one entry per voice, each
 * restating that voice's rules in prose — three of them describing files in
 * ANOTHER instance, and every one of them restating rules without the citation
 * the voice itself carries.
 *
 * **The expected values below are the ones the hand-written entries carried**,
 * captured before they were deleted. They are written here rather than read off
 * the corpus on purpose: a test whose expected value is whatever the code
 * currently produces cannot catch the code changing, which is the whole thing
 * this file is for.
 */

import { describe, expect, test } from "bun:test";
import { join } from "node:path";

import {
  QA_CRITERIA_REGISTRY,
  qaCriteriaFor,
  qaCriteriaByIdFor,
} from "../../content/pipeline/qa-criteria-registry.ts";
import {
  overlayCriterionId,
  overlaySeverityOf,
  shippedVoices,
  voiceOverlayCriteria,
} from "../../content/pipeline/voice-criteria.ts";

const INSTANCE = join(import.meta.dir, "..", "..");

/** Exactly what the four deleted entries declared. */
const AS_HAND_WRITTEN: Record<string, { severity: string }> = {
  "voice-overlay-who-editorial": { severity: "major" },
  "voice-overlay-who-guideline-development": { severity: "critical" },
  "voice-overlay-who-publication-design": { severity: "major" },
  "voice-overlay-milnor": { severity: "minor" },
};

describe("the derivation reproduces the hand-written criteria", () => {
  const derived = voiceOverlayCriteria(INSTANCE);
  const byId = new Map(derived.map((c) => [c.id, c]));

  test("every voice this repository ships produces one criterion", () => {
    expect(derived.length).toBe(shippedVoices(INSTANCE).length);
    // Four when this landed. Asserted against the voices rather than as a
    // literal, so shipping a fifth voice is not a test failure — that is the
    // point of deriving them.
    expect(derived.length).toBeGreaterThan(0);
  });

  for (const [id, want] of Object.entries(AS_HAND_WRITTEN)) {
    test(`${id} keeps its severity, domain, voices, deps and automated flag`, () => {
      const c = byId.get(id);
      expect(c).toBeDefined();
      expect(c!.default_severity).toBe(want.severity as never);
      expect(c!.domain).toBe("voice");
      expect(c!.voices).toEqual([id.replace("voice-overlay-", "")]);
      expect(c!.depends_on).toEqual(["md"]);
      expect(c!.automated).toBe(false);
    });
  }

  test("no criterion appeared that was not registered before", () => {
    // The derivation is allowed to produce MORE as voices are added; what it
    // must not do is produce a differently-named version of one of these four,
    // which would leave a dangling id in every sidecar already written.
    for (const id of Object.keys(AS_HAND_WRITTEN)) expect(byId.has(id)).toBe(true);
  });
});

describe("the derived criteria reach the consumers", () => {
  test("`qaCriteriaFor` carries them and `QA_CRITERIA_REGISTRY` does not", () => {
    const all = qaCriteriaFor(INSTANCE);
    const staticOnly = QA_CRITERIA_REGISTRY.filter((c) => c.id.startsWith("voice-overlay-"));
    expect(staticOnly).toEqual([]);
    expect(all.filter((c) => c.id.startsWith("voice-overlay-")).length).toBeGreaterThan(0);
    expect(all.length).toBe(QA_CRITERIA_REGISTRY.length + voiceOverlayCriteria(INSTANCE).length);
  });

  test("the by-id index carries them too", () => {
    const idx = qaCriteriaByIdFor(INSTANCE);
    for (const id of Object.keys(AS_HAND_WRITTEN)) expect(idx[id]).toBeDefined();
  });

  test("every voice criterion is agent-adjudicated, which is why the drain queue had to change", () => {
    // All four are `automated: false`, so a consumer filtering the STATIC array
    // for agent work silently dropped four adjudications. `qa-agent-drain-queue`
    // was that consumer.
    for (const c of voiceOverlayCriteria(INSTANCE)) expect(c.automated).toBe(false);
  });
});

describe("the description names the voice and does not restate it", () => {
  test("it says where the voice lives and who ships it", () => {
    const c = voiceOverlayCriteria(INSTANCE).find((x) => x.id === "voice-overlay-milnor")!;
    expect(c.description).toContain("folio-assistant-sci");
    expect(c.description).toContain("skills/voices/milnor/");
  });

  test("it tells a reviewer to open the citation", () => {
    for (const c of voiceOverlayCriteria(INSTANCE)) {
      expect(c.description.toLowerCase()).toContain("citation");
    }
  });

  test("a WHO criterion no longer carries WHO editorial RULES", () => {
    // The point of the bean. Naming the voice is fine — restating its rules in
    // the platform, uncited, is what this removed. The two rules the old
    // descriptions spelled out are the check.
    const c = voiceOverlayCriteria(INSTANCE).find(
      (x) => x.id === "voice-overlay-who-guideline-development",
    )!;
    expect(c.description).not.toContain("not recommended");
    expect(c.description).not.toContain("PICO");
  });
});

describe("overlaySeverityOf is declared, never derived from the rules", () => {
  test("it reads the voice's own field", () => {
    for (const { voice } of shippedVoices(INSTANCE)) {
      const declared = (voice as { overlaySeverity?: string }).overlaySeverity;
      if (declared) expect(overlaySeverityOf(voice)).toBe(declared as never);
    }
  });

  test("a voice declaring none gets the documented default, not the worst rule", () => {
    const worst = { id: "x", title: "X", description: "d", rules: [{ severity: "critical" }] };
    expect(overlaySeverityOf(worst as never)).toBe("major");
  });

  test("two of the four disagree with the worst-rule rule — which is why it is declared", () => {
    // The measurement that settled the design. If this ever stops holding, the
    // derivation becomes possible and the field could go.
    const worstOf = (v: { rules: { severity: string }[] }) =>
      v.rules.some((r) => r.severity === "critical")
        ? "critical"
        : v.rules.some((r) => r.severity === "major")
          ? "major"
          : "minor";
    const disagree = shippedVoices(INSTANCE).filter(
      ({ voice }) => worstOf(voice as never) !== overlaySeverityOf(voice),
    );
    expect(disagree.length).toBeGreaterThan(0);
  });
});

describe("the criterion id is composed in one place", () => {
  test("`overlayCriterionId` is what the derivation uses", () => {
    for (const { voice } of shippedVoices(INSTANCE)) {
      const c = voiceOverlayCriteria(INSTANCE).find((x) => x.voices?.[0] === voice.id);
      expect(c!.id).toBe(overlayCriterionId(voice.id));
    }
  });
});
