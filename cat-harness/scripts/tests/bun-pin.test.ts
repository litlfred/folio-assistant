/**
 * Bean `3ozg` — every workflow installs the same Bun, and the gate can fail.
 *
 * The corpus test says the repository is currently consistent. The fixtures say
 * the gate would notice otherwise, which a test over a correct tree cannot
 * establish about itself.
 *
 * ## Three live controls, recorded because they are evidence
 *
 * Run against the real repository with one thing broken at a time, the gate
 * exits as it should:
 *
 *     one site set to `bun-version: 1.4.2`      exit 1  (disagrees)
 *     one site's `with:` block removed          exit 1  (unpinned)
 *     `.bun-version` set to `latest`            exit 2  (cannot determine)
 *
 * And a fourth, unplanned: reverting a control with `git checkout --` restored
 * `ci-health.yml` to HEAD rather than to its pre-control state, which silently
 * undid the pin this change had added to it — and the gate caught that on the
 * next run, naming the file and the job. The accident is the best demonstration
 * available that it works on real input, so it is written down rather than
 * tidied away.
 */
import { describe, expect, test } from "bun:test";

import { auditWorkflow, bunPin, readPinFile } from "../check-bun-pin.ts";

/** A workflow with one `setup-bun` step, pinned to `v`, or unpinned. */
const wf = (v?: string, uses = "oven-sh/setup-bun@v2"): unknown => ({
  jobs: {
    build: {
      steps: [
        { name: "checkout", uses: "actions/checkout@v7" },
        v === undefined ? { name: "bun", uses } : { name: "bun", uses, with: { "bun-version": v } },
      ],
    },
  },
});

describe("the real repository", () => {
  const report = bunPin();

  test("`.bun-version` was READ — every assertion below is computed from it", () => {
    expect(report.expected).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test("setup-bun sites were FOUND — a scan matching nothing must not read clean", () => {
    // The failure shape this repository keeps paying for. `main` exits 2 on it
    // rather than 0, and it is asserted here too because a test checking only
    // `findings` would pass over an empty scan.
    expect(report.sites).toBeGreaterThan(0);
    expect(report.workflows).toBeGreaterThan(0);
  });

  test("every site installs the pinned version", () => {
    expect(report.findings.map((f) => `${f.workflow} ${f.job} ${f.kind}`)).toEqual([]);
  });
});

describe("readPinFile", () => {
  test("a bare version, with or without a trailing newline", () => {
    expect(readPinFile("1.3.14\n")).toBe("1.3.14");
    expect(readPinFile("1.3.14")).toBe("1.3.14");
  });

  test("`latest` is NOT a version — that is the whole point of the file", () => {
    expect(readPinFile("latest\n")).toBeUndefined();
  });

  test("a `v` prefix is refused, because that is not what the action takes", () => {
    // `setup-bun` and `.bun-version` want `1.3.14`; upstream TAGS it
    // `bun-v1.3.14`. Keeping the file in the build's form is what makes
    // `upstream-pins.json`'s `tagPrefix` necessary, and accepting both forms
    // here would let the two drift.
    expect(readPinFile("v1.3.14\n")).toBeUndefined();
  });

  test("an empty or commentary file yields nothing rather than a guess", () => {
    expect(readPinFile("")).toBeUndefined();
    expect(readPinFile("# see upstream-pins.json\n")).toBeUndefined();
  });
});

describe("auditWorkflow — falsified by breaking", () => {
  test("a site pinned to the expected version is clean", () => {
    expect(auditWorkflow("a.yml", wf("1.3.14"), "1.3.14")).toEqual({ sites: 1, findings: [] });
  });

  test("a DISAGREEING site is caught, and the finding names the version found", () => {
    const r = auditWorkflow("a.yml", wf("1.4.2"), "1.3.14");
    expect(r.findings).toEqual([
      { workflow: "a.yml", job: "build", step: "bun", kind: "disagrees", found: "1.4.2" },
    ]);
  });

  test("`latest` is a disagreement like any other, not a special case", () => {
    // It is the state this gate was written to end, so it must not be handled
    // by a rule of its own that a future spelling could slip past.
    expect(auditWorkflow("a.yml", wf("latest"), "1.3.14").findings[0]).toMatchObject({
      kind: "disagrees",
      found: "latest",
    });
  });

  test("an UNPINNED site is caught — silence is not agreement", () => {
    // Four of the repository's 22 sites were exactly this before the pin: no
    // `bun-version`, taking the action's default. Treating absence as "fine"
    // would have left those four installing whatever `latest` resolves to while
    // the gate reported green.
    expect(auditWorkflow("a.yml", wf(undefined), "1.3.14").findings).toEqual([
      { workflow: "a.yml", job: "build", step: "bun", kind: "unpinned" },
    ]);
  });

  test("a numeric YAML value is compared AS WRITTEN, not normalised", () => {
    // `bun-version: 1.3` parses as the number 1.3, and it is a different
    // request to the action than `1.3.14`. Normalising it into agreement would
    // let a two-component pin pass while installing something else.
    const r = auditWorkflow("a.yml", { jobs: { b: { steps: [{ uses: "oven-sh/setup-bun@v2", with: { "bun-version": 1.3 } }] } } }, "1.3.14");
    expect(r.findings[0]).toMatchObject({ kind: "disagrees", found: "1.3" });
  });

  test("a step that is not setup-bun is not a site", () => {
    const r = auditWorkflow("a.yml", wf("1.3.14", "actions/setup-node@v4"), "1.3.14");
    expect(r).toEqual({ sites: 0, findings: [] });
  });

  test("a pinned action ref still counts as a site", () => {
    // `oven-sh/setup-bun@v2`, `@v2.0.1` or a sha are all the same action, and a
    // match on the exact string would stop seeing sites the day one is pinned.
    expect(auditWorkflow("a.yml", wf(undefined, "oven-sh/setup-bun@abc123"), "1.3.14").sites).toBe(1);
  });

  test("several jobs are all walked, and each finding names its own job", () => {
    const doc = {
      jobs: {
        one: { steps: [{ uses: "oven-sh/setup-bun@v2", with: { "bun-version": "1.4.2" } }] },
        two: { steps: [{ uses: "oven-sh/setup-bun@v2" }] },
      },
    };
    const r = auditWorkflow("a.yml", doc, "1.3.14");
    expect(r.sites).toBe(2);
    expect(r.findings.map((f) => [f.job, f.kind])).toEqual([
      ["one", "disagrees"],
      ["two", "unpinned"],
    ]);
  });

  test("a workflow with no jobs, and a null document, yield nothing rather than throwing", () => {
    expect(auditWorkflow("a.yml", { jobs: {} }, "1.3.14")).toEqual({ sites: 0, findings: [] });
    expect(auditWorkflow("a.yml", null, "1.3.14")).toEqual({ sites: 0, findings: [] });
  });
});
