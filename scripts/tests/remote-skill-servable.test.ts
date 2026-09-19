/**
 * A remote package must not declare a skill this instance cannot serve.
 *
 * Bean `wlqd`, and the owner's instruction was specific: they wanted this "as a
 * todo that fails QA" rather than as prose. The previous pass made the
 * *documentation* honest — the generated docs now say "declared, not
 * integrated" — which left nothing that trips, so the overstatement was
 * accurate and invisible at the same time.
 *
 * ## What fails, and what deliberately does not
 *
 * `remote-skill-is-servable` is `major`, so it fails `bun run kg:audit`
 * (`Worst severity: major`), it is recorded as `fail` in the committed sidecar
 * `test/results/kg-qa/skills/roles/kg.kg-qa.json`, and it fails
 * `bun run kg:audit:strict`. It does NOT fail `kg:audit:check`, which gates CI
 * and fires on `critical` only.
 *
 * **That last part is deliberate and is not timidity.** A required check that is
 * red until somebody implements a remote-package sync would be red on every
 * unrelated pull request, which is precisely the defect `AGENTS.md` documents at
 * length: `docs-site.yml` failed all 30 runs over two months and the failure
 * became invisible *because* it was constant. Making this criterion `critical`
 * would block the whole repository on one known, sized, non-urgent
 * overstatement. The owner can ask for that escalation in one line — change the
 * severity in `schemas/kg-qa.ts` — and this comment is the argument they would
 * be overriding, recorded so the decision is not re-derived.
 *
 * ## So what does this test do
 *
 * It pins the finding set, in both directions:
 *
 * - it cannot silently **grow** — a sixth declared-but-unservable skill fails
 *   here, which is the regression that matters, because the whole point is that
 *   adding such a name is currently free;
 * - it cannot silently **vanish** — if somebody implements the sync or drops the
 *   declaration, this test fails and names what to do, so closing `wlqd` is a
 *   deliberate act with the expectation updated, not a green run nobody reads.
 *
 * @module scripts/tests/remote-skill-servable
 */
import { describe, expect, test } from "bun:test";
import { join } from "node:path";

import { knownSkills, remotePackageDeclarations } from "../known-skills.js";

const ROOT = join(import.meta.dir, "..", "..");

/**
 * The five names, measured 2026-09-19, WITH the wrapper that declares each.
 *
 * Written out rather than counted: a bare `toBe(5)` passes when one name is
 * swapped for another, and which skills are unfetchable is the finding.
 */
const EXPECTED_UNSERVABLE = [
  "claude-scientific-skills.json/hypothesis-generation",
  "claude-scientific-skills.json/scientific-critical-thinking",
  "claude-scientific-skills.json/scientific-visualization",
  "smarter-fhir.json/fhir-client-operations",
  "smarter-fhir.json/smart-launch",
];

describe("remote-package declarations vs what this instance can serve", () => {
  const servable = knownSkills(ROOT);
  const declared = remotePackageDeclarations(ROOT);

  test("there are declarations to check", () => {
    // A green run over zero rows reads as coverage that is not there — the same
    // vacuity guard the workflow-yaml suite carries.
    expect(declared.length).toBeGreaterThan(0);
  });

  test("the unservable set is exactly the known one — it has not grown or vanished", () => {
    const unservable = declared
      .filter((d) => !servable.has(d.skill))
      .map((d) => `${d.file}/${d.skill}`)
      .sort();

    expect(unservable).toEqual(EXPECTED_UNSERVABLE);
  });

  test("every declared skill names a wrapper that exists, so a finding is actionable", () => {
    // A finding keyed on a file nobody can open is a finding nobody acts on.
    for (const d of declared) {
      expect(d.file.endsWith(".json")).toBe(true);
      expect(d.skill.length).toBeGreaterThan(0);
    }
  });

  test("both wrappers still declare a sync nothing performs — the bean's premise", () => {
    // If this stops being true the premise has changed: either the field was
    // dropped (one of `wlqd`'s two remedies) or a sync was implemented. Either
    // way the criterion's summary needs rewriting, so fail rather than pass.
    const withSync = declared.filter((d) => d.sync !== undefined && d.sync !== null);
    expect(withSync.length).toBe(declared.length);
  });
});
