/**
 * Tests for the workflow-script-path check.
 *
 * Each pins a REFUSAL or a discrimination the check has to make, rather than
 * the happy path: the check's whole value is that it does not report a
 * working workflow as broken (which teaches readers to skim it) and does not
 * report a broken one as working (which is the defect it exists for).
 *
 * @module scripts/tests/check-workflow-paths.test
 */
import { describe, expect, test } from "bun:test";

import {
  FOLIO_PATHS,
  Verdict,
  cdTarget,
  cwdFlag,
  invocationsFrom,
  invokedPath,
} from "../check-workflow-paths.js";

/** A workflow with one job and one step running `body`. */
function wf(body: string, extra = ""): string {
  return `
jobs:
  j:
    steps:
${extra}      - name: s
        run: |
${body
  .split("\n")
  .map((l) => `          ${l}`)
  .join("\n")}
`;
}

describe("invokedPath", () => {
  test("takes a script path", () => {
    expect(invokedPath("bun run cat-harness/scripts/x.ts")).toBe("cat-harness/scripts/x.ts");
  });

  test("an npm SCRIPT NAME is not a path — it is the recommended fix", () => {
    // `bun run check:ci-health` puts the path in package.json once. Treating
    // it as a path would report the fix as a finding.
    expect(invokedPath("bun run check:ci-health --out /tmp/x.md")).toBeUndefined();
    expect(invokedPath("bun run health")).toBeUndefined();
  });

  test("ignores lines that are not bun invocations", () => {
    expect(invokedPath("echo bun run x.ts")).toBeUndefined();
    expect(invokedPath("# bun run x.ts")).toBeUndefined();
  });

  test("sees past --cwd to the script", () => {
    expect(invokedPath("bun run --cwd content pipeline/a.ts")).toBe("pipeline/a.ts");
    expect(cwdFlag("bun run --cwd content pipeline/a.ts")).toBe("content");
  });
});

describe("cdTarget", () => {
  test("a plain cd is followed", () => {
    expect(cdTarget("cd content")).toBe("content");
  });

  test("a cd naming a VARIABLE is unresolvable, not ignorable", () => {
    // null, not undefined: undefined means "not a cd", null means "a cd I
    // cannot follow". Collapsing them would silently resolve against the
    // wrong directory.
    expect(cdTarget('cd "$RUNNER_TEMP"')).toBeNull();
    expect(cdTarget("cd $HOME/x")).toBeNull();
    expect(cdTarget("cd build-*")).toBeNull();
  });

  test("a non-cd line is undefined", () => {
    expect(cdTarget("bun run x.ts")).toBeUndefined();
  });
});

describe("cwd tracking", () => {
  test("a cd earlier in the SAME run block moves the path", () => {
    const [inv] = invocationsFrom("f.yml", wf("cd content\nbun run pipeline/build.ts"));
    expect(inv.cwd).toBe("content");
  });

  test("`cd x && bun …` on one line is followed too", () => {
    const [inv] = invocationsFrom("f.yml", wf("cd content && bun run pipeline/build.ts"));
    expect(inv.cwd).toBe("content");
  });

  test("a cd does NOT leak into the next run block — each `run:` is its own shell", () => {
    // This is the misreading that makes an unprefixed path look correct.
    const text = `
jobs:
  j:
    steps:
      - name: install
        run: cd content && bun install
      - name: check
        run: bun run cat-harness/scripts/x.ts
`;
    const [inv] = invocationsFrom("f.yml", text);
    expect(inv.cwd).toBe("");
  });

  test("a step's working-directory applies", () => {
    const text = `
jobs:
  j:
    steps:
      - name: s
        working-directory: cat-harness
        run: bun run scripts/gates.ts
`;
    const [inv] = invocationsFrom("f.yml", text);
    expect(inv.cwd).toBe("cat-harness");
    expect(inv.verdict).toBe(Verdict.Resolves);
  });

  test("a job-level defaults.run.working-directory applies", () => {
    const text = `
jobs:
  j:
    defaults:
      run:
        working-directory: cat-harness
    steps:
      - name: s
        run: bun run scripts/gates.ts
`;
    const [inv] = invocationsFrom("f.yml", text);
    expect(inv.verdict).toBe(Verdict.Resolves);
  });
});

describe("verdicts", () => {
  test("a path that is not there from the computed cwd is MISSING", () => {
    const [inv] = invocationsFrom("f.yml", wf("bun run scripts/check-ci-health.ts"));
    expect(inv.verdict).toBe(Verdict.Missing);
  });

  test("the same script WITH the cat-harness prefix resolves", () => {
    const [inv] = invocationsFrom("f.yml", wf("bun run cat-harness/scripts/check-ci-health.ts"));
    expect(inv.verdict).toBe(Verdict.Resolves);
  });

  test("an unresolvable cd yields UNDETERMINED, never a pass", () => {
    const [inv] = invocationsFrom("f.yml", wf('cd "$RUNNER_TEMP"\nbun run scripts/x.ts'));
    expect(inv.verdict).toBe(Verdict.Undetermined);
    expect(inv.note).toContain("variable");
  });

  test("a declared folio path is NEEDS-FOLIO and carries its reason", () => {
    const [inv] = invocationsFrom("f.yml", wf("cd content\nbun run pipeline/build.ts"));
    expect(inv.verdict).toBe(Verdict.NeedsFolio);
    expect(inv.note).toMatch(/folio/i);
  });
});

describe("checkout paths", () => {
  test("a step working in an actions/checkout `path:` resolves against the repo", () => {
    const text = `
jobs:
  j:
    steps:
      - uses: actions/checkout@v4
        with:
          path: source
      - name: s
        working-directory: source
        run: bun run cat-harness/scripts/gates.ts
`;
    const [inv] = invocationsFrom("f.yml", text);
    expect(inv.verdict).toBe(Verdict.Resolves);
  });

  test("a checkout of a DIFFERENT repository is not collected", () => {
    // Nothing here can say whether a path in someone else's tree resolves,
    // so the prefix must not be stripped and the verdict must not be green.
    const text = `
jobs:
  j:
    steps:
      - uses: actions/checkout@v4
        with:
          repository: other/repo
          path: source
      - name: s
        working-directory: source
        run: bun run cat-harness/scripts/gates.ts
`;
    const [inv] = invocationsFrom("f.yml", text);
    expect(inv.verdict).toBe(Verdict.Missing);
  });
});

describe("FOLIO_PATHS", () => {
  test("every entry carries a reason", () => {
    for (const f of FOLIO_PATHS) {
      expect(f.reason.length).toBeGreaterThan(20);
    }
  });

  test("build.ts is exempt for the FOLIO's copy, not resolved to the platform's", () => {
    // `cat-harness/content/pipeline/build.ts` exists and is a DIFFERENT file
    // with the same basename. Pointing the workflow at it would be a wrong
    // fix that looks like a right one, so the exemption records why.
    const entry = FOLIO_PATHS.find((f) => f.match === "pipeline/build.ts");
    expect(entry?.reason).toContain("same basename");
  });
});
