/**
 * `.gitattributes` — `-merge` may only cover a file its producer OWNS OUTRIGHT.
 *
 * Bean `oxka`. Three generated files conflicted on nearly every concurrent merge
 * (106, 45 and 18 commits in three days), so they are marked
 * `linguist-generated=true -diff -merge`: git stops attempting a line-by-line
 * merge on a file no human edits, and GitHub collapses it in review.
 *
 * ## The line this file exists to hold
 *
 * The test of whether a file belongs there is **not** "is it generated" — it is
 * **"does its producer carry anything forward from the existing file"**.
 *
 * `kg-audit` reads its prior judgements back (`readAttestations`), so the
 * file holding them carries adjudications an earlier run or a person recorded.
 * `-merge` on one would discard an attestation with nothing said. Since bean
 * `2gst` that file is the attestation store (`test/attestations/kg-qa/`), not
 * the `kg-qa` sidecar — and BOTH stay textually mergeable here. 840 generated
 * files live under `test/results/`, which makes a glob there the obvious and
 * wrong widening — and the reason this test exists rather than a comment.
 *
 * Moved here from `cat-harness/scripts/tests/` (bean `ho66`), as
 * `merge-guard-workflows.test.ts` was: every test in it reads the aggregate
 * repository's own root — `.gitattributes` and the CI workflow that gates it —
 * which a standalone cat-harness layer does not have, and
 * `check:cat-harness-standalone` collects every test in that layer.
 *
 * Moved again, from `cat-harness-tools/scripts/tests/` to the checkout's own
 * test home `test/` (bean `7zz1`, owner ruling 2026-10-06 "Top-level
 * instance"): what it reads belongs to the whole checkout, which the root
 * instance declares, not to any one layer — so cat-harness-tools stays green
 * standing alone too.
 */
import { describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

/** The directory this test was written in (`cat-harness/scripts/tests/`): every path below is composed from it exactly as it was before the move. */
const ORIGIN_DIR = join(import.meta.dir, "../cat-harness/scripts/tests");

const REPO = resolve(ORIGIN_DIR, "..", "..", "..");
const ATTRS = join(REPO, ".gitattributes");

/** What git itself resolves for a path — not what the file appears to say. */
function mergeAttr(path: string): string {
  const out = execFileSync("git", ["check-attr", "merge", "--", path], { cwd: REPO, encoding: "utf-8" });
  return out.trim().split(": ").pop() ?? "";
}

describe(".gitattributes exists and is read by git", () => {
  test("the three high-churn generated files are marked", () => {
    expect(existsSync(ATTRS)).toBe(true);
    for (const p of [
      "cat-harness/docs/glossary/index.md",
      "cat-harness/docs/cat-harness/auto-docs/index/index.html",
      "cat-harness/test/results/audit-coverage.qa-results.json",
      // Added 2026-10-01, bean `eqxp`. Producer `writeToolRun` composes the
      // body from its argument and reads the existing file only to skip a
      // pointless write.
      "cat-harness/test/results/tool-runs/lsi-index/cat-harness/skills.tool-run.json",
    ]) {
      // Asked of GIT, not matched against the file's text: a pattern that looks
      // right and does not apply is the failure mode this guards.
      expect(mergeAttr(p), `${p} is not marked -merge`).toBe("unset");
    }
  });
});

describe("a sidecar whose producer reads it back is NOT marked", () => {
  test("`kg-qa` sidecars stay textually mergeable", () => {
    // `readAttestations(sidecarPath(r))` in `kg-audit.ts` is the fact. If that
    // ever stops being true this test should be revisited deliberately, not
    // deleted because it became inconvenient.
    const audit = readFileSync(join(REPO, "cat-harness", "scripts", "kg-audit.ts"), "utf-8");
    expect(audit, "kg-audit no longer reads its sidecars back — re-examine this rule").toContain("readAttestations");
    for (const p of [
      "cat-harness/test/results/kg-qa/processes/adjudication.kg-qa.json",
      "cat-harness/test/results/kg-qa/skills/kg/kg-core/audit-coverage.kg-qa.json",
      // The judgement half itself (bean `2gst`) — the file that must never be `-merge`.
      "cat-harness/test/attestations/kg-qa/processes/ci-health-watch.attestations.json",
    ]) {
      expect(mergeAttr(p), `${p} is marked -merge, which would discard an attestation`).not.toBe("unset");
    }
  });

  test("no pattern globs the whole results tree", () => {
    // The obvious widening: 840 generated files under one directory. Refused by
    // text as well as by behaviour, because a future glob might match nothing
    // today and everything after a relocation.
    const text = readFileSync(ATTRS, "utf-8");
    for (const line of text.split("\n")) {
      if (line.trim().startsWith("#") || !line.includes("-merge")) continue;
      const pattern = line.trim().split(/\s+/)[0]!;
      expect(
        /^cat-harness\/test\/results\/\*|^cat-harness\/test\/results\/\*\*/.test(pattern),
        `"${pattern}" globs the results tree, where sidecars carry attestations`,
      ).toBe(false);
    }
  });
});

describe("every -merge path is gated in CI", () => {
  test("a wrong resolution reddens rather than ships", () => {
    // This is what makes the whole entry safe rather than clever. The three
    // files are covered by `check:glossary`, `auto:docs:check` and
    // `audit:coverage:require-all`, so taking the wrong side cannot ship.
    const wf = readFileSync(join(REPO, ".github", "workflows", "code-quality-gates.yml"), "utf-8");
    for (const gate of ["check:glossary", "auto:docs:check", "audit:coverage:require-all", "lsi:skills:check"]) {
      expect(wf, `${gate} is not in CI, so a -merge path it covers is unguarded`).toContain(gate);
    }
  });
});

/**
 * Two files that pass the carry-forward test and FAIL the gate test.
 *
 * Bean `eqxp`, 2026-10-01. Both were cleared on the producer question — read
 * each one, neither carries anything forward — and both were then refused,
 * because being safe to overwrite is only half of it. `oxka`'s entry is safe
 * *because* a wrong resolution reddens; without that it is a way to lose work
 * quietly.
 *
 * Measured by corrupting each committed file and running its gate:
 *
 *   · `skill-register.qa-results.json` — `producer.script_hash` and a family
 *     summary corrupted. `skill:register:check` exited **0**, and 66 tests
 *     across `skill-register.test.ts` and `qa-results.test.ts` passed.
 *   · `skills.lsi.json` — `fingerprint` corrupted. `lsi:skills:check` exited
 *     **0**. That gate reads the RUN RECORD's `inputFingerprint` (corrupting
 *     which does exit 1) and never validates the sidecar's own contents.
 *
 * This test is here so the next agent reaching for them has to overturn a
 * measurement rather than an opinion.
 */
describe("a generated file whose gate does NOT redden is not marked", () => {
  test("the two refused candidates stay textually mergeable", () => {
    for (const p of [
      "cat-harness/test/results/skill-register.qa-results.json",
      "cat-harness/test/results/lsi/cat-harness/skills.lsi.json",
    ]) {
      expect(
        mergeAttr(p),
        `${p} is marked -merge, but no gate reddens on a wrong resolution of it — see this block`,
      ).not.toBe("unset");
    }
  });

  test("the gate that DOES cover the newly marked run record is named in CI", () => {
    // The asymmetry is the point: the run record is guarded, its sibling
    // sidecar is not, and they sit two directories apart.
    const wf = readFileSync(join(REPO, ".github", "workflows", "code-quality-gates.yml"), "utf-8");
    expect(wf).toContain("lsi:skills:check");
    expect(mergeAttr("cat-harness/test/results/tool-runs/lsi-index/cat-harness/skills.tool-run.json")).toBe("unset");
  });
});
