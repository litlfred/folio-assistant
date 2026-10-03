/**
 * `check-workflow-submodules` — the rule, and the three things it must not do.
 *
 * The fixtures are written as workflow YAML rather than as parsed objects,
 * because the module reads TEXT: a test over a hand-built tree would pass
 * while the regexes that do the actual work went wrong.
 */

import { describe, expect, test } from "bun:test";

import { auditWorkflow, bunRunsOf, checkoutsOf, jobsOf } from "../check-workflow-submodules.ts";

/** The defect as it actually appeared in `feature-staging.yml`'s `cleanup` job. */
const BROKEN = `name: staging
on: [push]
jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Check out the platform
        uses: actions/checkout@v7
        with:
          path: source
      - run: |
          bun run source/cat-harness/scripts/staging-record.ts retire --out x.json
`;

const FIXED = BROKEN.replace("          path: source", "          submodules: true\n          path: source");

describe("the rule", () => {
  test("a job running a platform script from a submodule-less checkout is a finding", () => {
    const { findings } = auditWorkflow("staging.yml", BROKEN);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.job).toBe("cleanup");
    expect(findings[0]?.detail).toContain("staging-record.ts");
  });

  test("`submodules: true` clears it", () => {
    expect(auditWorkflow("staging.yml", FIXED).findings).toHaveLength(0);
  });

  test("`submodules: recursive` also clears it", () => {
    const rec = BROKEN.replace("          path: source", "          submodules: recursive\n          path: source");
    expect(auditWorkflow("staging.yml", rec).findings).toHaveLength(0);
  });

  test("a job that runs NO platform script is not a finding, however it checked out", () => {
    const none = BROKEN.replace(/      - run: \|\n.*\n/s, "      - run: echo hello\n");
    expect(auditWorkflow("staging.yml", none).findings).toHaveLength(0);
  });
});

describe("what it must NOT flag", () => {
  test("a PUBLISH-branch checkout is exempt — it holds built output, not the platform", () => {
    const pages = `jobs:
  deploy:
    steps:
      - uses: actions/checkout@v7
        with:
          ref: gh-pages
          path: pages
      - run: bun run pages/whatever.ts
`;
    expect(auditWorkflow("w.yml", pages).findings).toHaveLength(0);
  });

  test("the `publish_branch` input is exempt for the same reason", () => {
    const pub = `jobs:
  deploy:
    steps:
      - uses: actions/checkout@v7
        with:
          ref: \${{ inputs.publish_branch }}
          path: pages
      - run: bun run pages/whatever.ts
`;
    expect(auditWorkflow("w.yml", pub).findings).toHaveLength(0);
  });

  test("a `package.json` script name is not a platform script path", () => {
    const named = BROKEN.replace(
      "          bun run source/cat-harness/scripts/staging-record.ts retire --out x.json",
      "          bun run gates",
    );
    expect(auditWorkflow("staging.yml", named).findings).toHaveLength(0);
  });
});

describe("however the path is spelled", () => {
  // The three spellings that defeated a pairing rule and are the whole reason
  // the check is conservative instead.
  test.each([
    ["plain", "bun run source/cat-harness/scripts/x.ts"],
    ["parent-relative", "bun run ../source/cat-harness/scripts/x.ts"],
    ["shell variable", 'bun run "$PLATFORM_DIR/cat-harness/scripts/x.ts"'],
  ])("%s is still seen as a platform script", (_name, cmd) => {
    const y = BROKEN.replace(
      "          bun run source/cat-harness/scripts/staging-record.ts retire --out x.json",
      `          ${cmd}`,
    );
    expect(auditWorkflow("staging.yml", y).findings).toHaveLength(1);
  });
});

describe("the readers", () => {
  test("jobs are split by their two-space header, and carry a line number", () => {
    const jobs = jobsOf(BROKEN);
    expect(jobs.map((j) => j.name)).toEqual(["cleanup"]);
    // `jobs:` is line 3, so the job header is line 4.
    expect(jobs[0]?.start).toBe(4);
  });

  test("a non-indented key ends the jobs block, so trailing YAML is not a job", () => {
    expect(jobsOf(`${BROKEN}\nconcurrency:\n  group: x\n`).map((j) => j.name)).toEqual(["cleanup"]);
  });

  test("a checkout's `with:` keys stop at the next step", () => {
    const two = `jobs:
  j:
    steps:
      - uses: actions/checkout@v7
        with:
          path: source
      - uses: actions/checkout@v7
        with:
          submodules: true
          path: other
`;
    const c = checkoutsOf(jobsOf(two)[0]!);
    expect(c).toHaveLength(2);
    // The crux: the FIRST must not inherit the second's `submodules`.
    expect(c[0]?.submodules).toBe(false);
    expect(c[1]?.submodules).toBe(true);
  });

  test("every platform script in a job is found, not just the first", () => {
    const many = BROKEN.replace(
      "          bun run source/cat-harness/scripts/staging-record.ts retire --out x.json",
      "          bun run source/a.ts\n          bun run source/b.ts\n          bun run source/c.ts",
    );
    expect(bunRunsOf(jobsOf(many)[0]!)).toHaveLength(3);
  });
});

describe("the blind spot is reported rather than implied", () => {
  test("a composite-action call from a submodule-less checkout is named", () => {
    const comp = `jobs:
  j:
    steps:
      - uses: actions/checkout@v7
        with:
          path: source
      - uses: ./.github/actions/do-a-thing
`;
    const { findings, composites } = auditWorkflow("w.yml", comp);
    // Not a finding — this file cannot read what the action runs...
    expect(findings).toHaveLength(0);
    // ...but not silence either.
    expect(composites).toHaveLength(1);
    expect(composites[0]?.detail).toContain(".github/actions/do-a-thing");
  });
});
