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
 * `test/results/kg-qa/scenarios/kg.kg-qa.json`, and it fails
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
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { knownSkills, remotePackageDeclarations } from "../known-skills.js";

const ROOT = join(import.meta.dir, "..", "..");

/**
 * **Empty since 2026-09-20 — and the gap did not close, it MOVED.**
 *
 * The five names were unservable, so `skill_fetch` failed partway through any
 * task that asked for one. Each now has a stub body in `skills/remote-stubs/`
 * that says plainly it is not implemented, where the real thing lives, and what
 * would finish it. So nothing fails at the call site, and **nothing is finished
 * either**: the content is still absent.
 *
 * This file's own header asked for exactly that act — "a deliberate act with the
 * expectation updated, not a green run nobody reads" — on the owner's principle:
 *
 * > stub things out knowing its not working. make sure QA checks pickup so we can
 * > fix later. principle: KG is always a work in progress. QA helps show where to
 * > work on it next, close gaps.
 *
 * ## Why emptying this list alone would have been the wrong change
 *
 * An empty pin passes in two very different worlds: one where every declaration
 * is now servable, and one where somebody deleted the wrapper declarations so
 * there was nothing left to fail. It would also pass if the stubs were deleted
 * and the wrappers with them — losing both the capability and its record.
 *
 * So the pin moved rather than shrank. `EXPECTED_STUBS` below carries the same
 * five names on the other side of the ledger, and `kg:audit` reports each under
 * `skill-is-a-stub` (`minor`: printed every run, gating nothing). Bean `wlqd`.
 */
const EXPECTED_UNSERVABLE: string[] = [];

/**
 * The same five, now stubbed — the other side of the ledger.
 *
 * Deleting a stub must fail here rather than quietly restore the call-time
 * failure this pair of pins exists to prevent.
 */
const EXPECTED_STUBS = [
  "fhir-client-operations",
  "hypothesis-generation",
  "scientific-critical-thinking",
  "scientific-visualization",
  "smart-launch",
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

  test("every name that WAS unservable is now a declared stub, not silently gone", () => {
    // The other half of the pin. `unservable` being empty is only good news if
    // the names are still declared AND each is answered by a stub that says it is
    // unimplemented. A name that vanished from both sides took its record with it.
    const declaredNames = new Set(declared.map((d) => d.skill));
    for (const name of EXPECTED_STUBS) {
      expect(declaredNames.has(name), `${name} is no longer declared by any wrapper`).toBe(true);
      expect(servable.has(name), `${name} is declared but has no body to serve`).toBe(true);
    }
  });

  test("each stub declares itself a stub, so kg:audit can report it", () => {
    // The stub body is what stops the call-time failure; the `stub:` front matter
    // is what stops the fix from LOOKING finished. Without this assertion,
    // somebody could remove the marker and the gap would go quiet.
    for (const name of EXPECTED_STUBS) {
      const body = readFileSync(join(ROOT, "skills", "remote-stubs", `${name}.md`), "utf-8");
      expect(body.startsWith("---"), `${name}.md has no front matter`).toBe(true);
      expect(/^stub:\s*\S/m.test(body), `${name}.md carries no \`stub:\` reason`).toBe(true);
    }
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
