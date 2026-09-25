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
 * `kg-audit` reads its own sidecars back (`readAttestations(sidecarPath(r))`), so
 * a `kg-qa` sidecar holds adjudications an earlier run or a person recorded.
 * `-merge` on one would discard an attestation with nothing said. 840 generated
 * files live under `test/results/`, which makes a glob there the obvious and
 * wrong widening — and the reason this test exists rather than a comment.
 */
import { describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const REPO = resolve(import.meta.dir, "..", "..", "..");
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
      "cat-harness/docs/cat-harness/docs-auto/index/index.html",
      "cat-harness/test/results/audit-coverage.qa-results.json",
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
      "cat-harness/test/results/kg-qa/skills/folio-core/audit-coverage.kg-qa.json",
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
    // files are covered by `check:glossary`, `docs:auto:check` and
    // `audit:coverage:require-all`, so taking the wrong side cannot ship.
    const wf = readFileSync(join(REPO, ".github", "workflows", "code-quality-gates.yml"), "utf-8");
    for (const gate of ["check:glossary", "docs:auto:check", "audit:coverage:require-all"]) {
      expect(wf, `${gate} is not in CI, so a -merge path it covers is unguarded`).toContain(gate);
    }
  });
});
