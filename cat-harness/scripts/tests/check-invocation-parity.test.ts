/**
 * A preview must run the generators the deploy runs, with the same instance
 * arguments.
 *
 * The literals below are workflow source text on purpose: this file feeds
 * fixture text to the matcher, so rewriting them to reference a constant would
 * leave every detection test passing while asserting nothing — the failure
 * `check-declaration-filename.test.ts` already paid for (bean `jijc`).
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { EXEMPT, formatReport, invocations, isDeploy, withoutComments } from "../check-invocation-parity.js";

const REPO_ROOT = resolve(import.meta.dir, "..", "..", "..");
const wf = (n: string) => readFileSync(join(REPO_ROOT, ".github", "workflows", n), "utf-8");

describe("invocations", () => {
  test("`kg-export` and `kg-export --instance X` are DIFFERENT obligations", () => {
    // The whole of `3jhq`: staging ran the exporter, just not for the foreign
    // instance. Collapsing the two is what let that pass unnoticed.
    const yml = [
      "          bun run cat-harness/scripts/kg-export.ts --out a.jsonld",
      "          bun run cat-harness/scripts/kg-export.ts --instance ./bootstrap --out b.jsonld",
    ].join("\n");
    const got = invocations(yml);
    expect(got).toHaveLength(2);
    expect(got.map((i) => i.instance)).toEqual([undefined, "./bootstrap"]);
  });

  test("a repeated invocation is counted once", () => {
    const yml = "bun run cat-harness/scripts/ns-export.ts --layer a\nbun run cat-harness/scripts/ns-export.ts --layer b";
    expect(invocations(yml)).toEqual([{ script: "ns-export" }]);
  });

  test("a generator named only in a COMMENT is not an invocation", () => {
    // `code-quality-gates.yml` names `kg-export.ts` twice in prose. An earlier
    // design read those as invocations and reported 50 findings against a
    // workflow that publishes nothing.
    const yml = "          # see cat-harness/scripts/kg-export.ts for why\n          echo hi";
    expect(invocations(yml)).toEqual([]);
    expect(withoutComments(yml)).not.toContain("kg-export");
  });

  test("the real deploy workflow's set includes the foreign-instance export", () => {
    // The witness. A matcher proven only against fixtures is proven against
    // its author's idea of the file.
    //
    // `./bootstrap`, not `./cat-bootstrap`: #771 renamed the directory an hour
    // after #790 added this assertion, and neither branch carried the other's
    // change. Both were green on their own head and main went red on the
    // merge -- which is this witness doing precisely its job.
    //
    // THE FIXTURES ABOVE ALSO SAY `./bootstrap`, AND THAT IS A COINCIDENCE.
    // They are synthetic YAML testing that the parser returns WHATEVER
    // instance string it is handed, so the name there is arbitrary and no
    // directory has to exist for it. They would pass just as well spelled
    // anything else; they happen to match this line because a rename swept
    // them along, not because they are required to agree with it.
    //
    // So do not "fix" a fixture to match this line, and do not read a fixture
    // as evidence about the real workflow. This line is the only one that
    // reads the real file.
    //
    // This note said the opposite until #854 -- it claimed the fixtures still
    // read `cat-bootstrap`, ten lines below fixtures that did not. #807 had
    // warned in advance that they "must not be swept up in a find-and-replace";
    // they were, and the comment defending them was not updated. Recorded
    // because a note whose example is wrong is worse than no note: it is the
    // same drift, one layer up, as the `--layer` message that listed an
    // allow-list it no longer matched.
    const got = invocations(wf("docs-site.yml"));
    expect(got.some((i) => i.script === "kg-export" && i.instance === "./bootstrap")).toBe(true);
  });
});

describe("isDeploy", () => {
  test("no `--base-url` on the graph export means it publishes at the canonical base", () => {
    expect(isDeploy('bun run cat-harness/scripts/kg-export.ts --out "./_site/x.jsonld"')).toBe(true);
  });

  test("a `--base-url` means a preview naming itself", () => {
    expect(isDeploy('bun run cat-harness/scripts/kg-export.ts --base-url "$BASE" --out "./_site/x.jsonld"')).toBe(false);
  });

  test("the real pair classifies without either being named in the check", () => {
    // Neither workflow is written down in `check-invocation-parity.ts`; a
    // third site workflow would be classified the moment it exists.
    expect(isDeploy(wf("docs-site.yml"))).toBe(true);
    expect(isDeploy(wf("feature-staging.yml"))).toBe(false);
  });
});

describe("EXEMPT", () => {
  test("every exemption carries a reason", () => {
    // An exemption without one is indistinguishable from an oversight.
    for (const e of EXEMPT) expect(e.reason.length).toBeGreaterThan(20);
  });

  test("each exempt generator really is one the deploy runs", () => {
    // The live half of the stale-exemption rule: an entry for something the
    // deploy no longer runs excuses nothing and hides the next difference.
    const deployScripts = new Set(invocations(wf("docs-site.yml")).map((i) => i.script));
    for (const e of EXEMPT) expect(deployScripts.has(e.script)).toBe(true);
  });
});

describe("formatReport", () => {
  test("no preview is reported as examining nothing, NOT as a pass", () => {
    const out = formatReport({ deploy: "docs-site.yml", peers: [], staleExemptions: [] });
    expect(out).toContain("EXAMINED NOTHING");
    expect(out).not.toContain("✓");
  });

  test("no identifiable deploy is could-not-determine, NOT a pass", () => {
    const out = formatReport({ peers: [], staleExemptions: [], unreadable: "none publishes at the canonical base" });
    expect(out).toContain("COULD NOT DETERMINE");
    expect(out).toContain("not a pass");
    expect(out).not.toContain("✓");
  });

  test("a stale exemption is a finding in its own right", () => {
    const out = formatReport({
      deploy: "docs-site.yml",
      peers: [{ workflow: "feature-staging.yml", missing: [] }],
      staleExemptions: ["gone-export"],
    });
    expect(out).toContain("EXEMPTION IS STALE");
    expect(out).toContain("gone-export");
  });

  test("a missing invocation names the instance argument, not just the script", () => {
    const out = formatReport({
      deploy: "docs-site.yml",
      peers: [{ workflow: "feature-staging.yml", missing: [{ script: "kg-export", instance: "./bootstrap" }] }],
      staleExemptions: [],
    });
    expect(out).toContain("kg-export --instance ./bootstrap");
  });

  test("a clean run prints the exemptions with their reasons", () => {
    // So the hand-maintained part is visible on every green run rather than
    // only when it fails — an allow-list nobody sees is one nobody prunes.
    const out = formatReport({
      deploy: "docs-site.yml",
      peers: [{ workflow: "feature-staging.yml", missing: [] }],
      staleExemptions: [],
    });
    expect(out).toContain("exempt, each with its reason");
    expect(out).toContain("fsh-guts-export");
  });
});
