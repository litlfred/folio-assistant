/**
 * The degradation model, executed — and the distinctions it exists to make.
 *
 * The property worth pinning is not "a missing tool blocks a skill". It is
 * that **"ran with less" and "did not run" stay different answers**: the
 * integration contract these declarations serve rests on *absent tool ⇒
 * `n/a`, never a false pass*, and collapsing the two is exactly how an
 * absent tool comes to look like a finding of nothing.
 *
 * @module src/tools/degradation.test
 */
import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";

import {
  allSkillAvailability,
  formatSkillAvailability,
  loadSkillNeeds,
  skillAvailability,
  type SkillNeeds,
} from "./degradation.ts";
import type { Capability, CapabilityStatus } from "./capabilities.ts";

const INSTANCE = resolve(import.meta.dir, "../..");

const caps: Capability[] = [
  { id: "present-tool", name: "p", description: "", detection: { method: "always" } },
  { id: "absent-tool", name: "a", description: "", detection: { method: "always" } },
  {
    id: "has-substitute",
    name: "h",
    description: "",
    detection: { method: "always" },
    fallbackTo: "present-tool",
  },
  {
    id: "dead-substitute",
    name: "d",
    description: "",
    detection: { method: "always" },
    fallbackTo: "absent-tool",
  },
];
const statuses: CapabilityStatus[] = [
  { id: "present-tool", name: "p", present: true, missingRequires: [] },
  { id: "absent-tool", name: "a", present: false, missingRequires: [] },
  { id: "has-substitute", name: "h", present: false, missingRequires: [] },
  { id: "dead-substitute", name: "d", present: false, missingRequires: [] },
];

const skill = (id: string, reqs: SkillNeeds["requiredCapabilities"]): SkillNeeds => ({
  id,
  requiredCapabilities: reqs,
});
const run = (s: SkillNeeds, opts = {}) => skillAvailability(s, statuses, caps, opts);

describe("each strategy maps to a distinct verdict", () => {
  test("everything present is ready, with nothing to say", () => {
    const r = run(skill("s", [{ capabilityId: "present-tool", degradation: "fail" }]));
    expect([r.state, r.reasons.length]).toEqual(["ready", 0]);
  });

  test("`fail` on an absent capability blocks, and names it", () => {
    const r = run(skill("s", [{ capabilityId: "absent-tool", degradation: "fail" }]));
    expect(r.state).toBe("blocked");
    expect(r.blockedBy).toEqual(["absent-tool"]);
  });

  test("`warn` is degraded, not blocked — the skill still runs", () => {
    const r = run(skill("s", [{ capabilityId: "absent-tool", degradation: "warn" }]));
    expect(r.state).toBe("degraded");
    expect(r.blockedBy).toEqual([]);
  });

  test("`skip` is partial — the requirement is dropped, not the skill", () => {
    // `skip` and `warn` must not collapse. `skip` drops the part that needed
    // the tool; `warn` runs the whole thing regardless. A caller choosing
    // between "some of the work" and "all of it, unverified" needs both.
    const r = run(skill("s", [{ capabilityId: "absent-tool", degradation: "skip" }]));
    expect(r.state).toBe("partial");
  });

  test("`fallback` uses the capability's substitute when it is present", () => {
    const r = run(skill("s", [{ capabilityId: "has-substitute", degradation: "fallback" }]));
    expect(r.state).toBe("degraded");
    expect(r.usingFallback).toEqual([{ capabilityId: "has-substitute", fallbackTo: "present-tool" }]);
  });

  test("`fallback` blocks when the substitute is absent too", () => {
    const r = run(skill("s", [{ capabilityId: "dead-substitute", degradation: "fallback" }]));
    expect(r.state).toBe("blocked");
    expect(r.reasons[0]).toContain("absent too");
  });
});

describe("the human route", () => {
  const airGapped = skill("signer", [{ capabilityId: "absent-tool", degradation: "fallback" }]);

  test("a person takes over when no capability can, and that is DEGRADED not blocked", () => {
    // `qa-report-signing` declares `fallback` with NO `fallbackTo` on
    // purpose: there is no second tool on an air-gapped host. Without this
    // path the join reports `blocked` for a skill a person can perform.
    const r = run(airGapped, { humanFallback: () => ["publication-manager"] });
    expect(r.state).toBe("degraded");
    expect(r.viaHuman).toEqual([
      { capabilityId: "absent-tool", roles: ["publication-manager"] },
    ]);
  });

  test("with no human lane it blocks, and says both things it looked for", () => {
    const r = run(airGapped);
    expect(r.state).toBe("blocked");
    expect(r.reasons[0]).toContain("no `fallbackTo`");
    expect(r.reasons[0]).toContain("no human lane");
  });
});

describe("the guards", () => {
  test("an UNDECLARED capability blocks rather than being ignored", () => {
    // The `blv9` shape: a reference-shaped value resolving to nothing. If a
    // gap in the registry read as "no requirement", a broken reference would
    // turn into a pass — and this is not hypothetical, `git-read` was
    // referenced by 17 skills and declared by nothing until this join ran.
    const r = run(skill("s", [{ capabilityId: "never-declared", degradation: "warn" }]));
    expect(r.state).toBe("blocked");
    expect(r.reasons[0]).toContain("cannot be established");
  });

  test("a skill's state is the WORST of its requirements", () => {
    const r = run(
      skill("s", [
        { capabilityId: "present-tool", degradation: "fail" },
        { capabilityId: "absent-tool", degradation: "skip" },
        { capabilityId: "absent-tool", degradation: "fail" },
      ]),
    );
    expect(r.state).toBe("blocked");
  });

  test("an empty corpus says it checked nothing rather than printing a tick", () => {
    expect(formatSkillAvailability([])).toContain("nothing was checked");
  });
});

describe("over the real corpus", () => {
  test("the skills load, and none is unreadable", async () => {
    const { kgRoots } = await import("../../scripts/known-skills.ts");
    const { skills, unreadable } = await loadSkillNeeds(kgRoots(INSTANCE));
    // A relative specifier resolved against THIS module, not the caller's
    // cwd, and every import failed — caught in one run because `unreadable`
    // is reported rather than skipped. Without this assertion the join would
    // silently report "no skill declares requiredCapabilities".
    expect(unreadable).toEqual([]);
    expect(skills.length).toBeGreaterThan(10);
    for (const s of skills) expect(s.requiredCapabilities.length).toBeGreaterThan(0);
  });

  test("every capability a skill requires is DECLARED", async () => {
    // The finding this join was written to make possible. `git-read` was
    // referenced by 17 skills and declared by no capability; it is declared
    // now. `deploy-access` is still undeclared and is listed here so the
    // gap is named rather than passing — remove it from the list when it
    // gains a declaration, and never widen the list to make this green.
    const { kgRoots } = await import("../../scripts/known-skills.ts");
    const { loadCapabilities } = await import("./capabilities.ts");
    const { repoRootFor } = await import("../../schemas/cat-harness.ts");
    const { skills } = await loadSkillNeeds(kgRoots(INSTANCE));
    const declared = new Set(loadCapabilities(repoRootFor(INSTANCE)).map((c) => c.id));
    expect(declared.size).toBeGreaterThan(5);
    const KNOWN_UNDECLARED = ["deploy-access"];
    const missing = [
      ...new Set(
        skills
          .flatMap((s) => s.requiredCapabilities.map((r) => r.capabilityId))
          .filter((id) => !declared.has(id)),
      ),
    ].sort();
    expect(missing).toEqual(KNOWN_UNDECLARED);
  });

  test("the real join runs and produces a verdict per skill", async () => {
    const { kgRoots } = await import("../../scripts/known-skills.ts");
    const { loadCapabilities, probeAll } = await import("./capabilities.ts");
    const { repoRootFor } = await import("../../schemas/cat-harness.ts");
    const { skills } = await loadSkillNeeds(kgRoots(INSTANCE));
    const c = loadCapabilities(repoRootFor(INSTANCE));
    const rows = allSkillAvailability(skills, probeAll(c), c);
    expect(rows.length).toBe(skills.length);
    // Not asserting WHICH state — that depends on what is installed on the
    // machine, and pinning it would make the suite fail on a developer
    // laptop with Lean present. Asserting the shape is the honest test.
    for (const r of rows) expect(["ready", "partial", "degraded", "blocked"]).toContain(r.state);
  });
});
