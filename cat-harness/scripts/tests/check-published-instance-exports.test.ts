/**
 * The gate that runs every workflow's foreign-instance exports.
 *
 * Its subject is not the export — that is `kg-export.test.ts` — but the
 * DERIVATION: which commands it decides to run, across which files, and what
 * it does when it decides on none.
 *
 * The literals below are workflow source text on purpose. This file feeds
 * fixture text to the matcher, so rewriting those strings to reference a
 * constant would leave every detection test passing while asserting nothing
 * — the failure `check-declaration-filename.test.ts` already paid for once
 * (bean `jijc`). They stay literal.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { formatReport, publishedInstances } from "../check-published-instance-exports.js";

const REPO_ROOT = resolve(import.meta.dir, "..", "..", "..");
const wf = (n: string) => join(REPO_ROOT, ".github", "workflows", n);

describe("publishedInstances", () => {
  test("finds the invocation in the real deploy workflow", () => {
    // The witness that keeps the pattern honest. A regex proven only against
    // fixtures is a regex proven against its own author's idea of the file.
    const found = publishedInstances(readFileSync(wf("docs-site.yml"), "utf-8"), "docs-site.yml");
    expect(found.length).toBeGreaterThan(0);
    expect(found.map((i) => i.instance)).toContain("./bootstrap");
  });

  test("finds it in the STAGING workflow too — the file `3jhq` showed was missed", () => {
    // Before `3jhq`, feature-staging.yml published no site-root export at all,
    // and this gate read only docs-site.yml, so neither half saw the other.
    // Asserted against the real file: a staged preview that stops publishing
    // it should fail here rather than 404 for a reviewer.
    const found = publishedInstances(readFileSync(wf("feature-staging.yml"), "utf-8"), "feature-staging.yml");
    expect(found.map((i) => i.instance)).toContain("./bootstrap");
    // ...and it is the one that passes a base, which the report must not
    // present as the same evidence as a base-less run.
    expect(found.find((i) => i.instance === "./bootstrap")?.standInBase).toBe(true);
  });

  test("reads every invocation, in the order the workflow runs them", () => {
    const yml = [
      "          bun run cat-harness/scripts/kg-export.ts --instance ./first --out a.jsonld",
      "          bun run cat-harness/scripts/kg-export.ts --instance ./second --out b.jsonld",
    ].join("\n");
    expect(publishedInstances(yml, "w.yml").map((i) => i.instance)).toEqual(["./first", "./second"]);
  });

  test("a `--base-url` on the line is recorded, and its absence is too", () => {
    // The distinction that stops the report overstating what it checked: a
    // base-less invocation exercises the declaration fallback, a based one
    // cannot, and they are not interchangeable evidence.
    const withBase = 'kg-export.ts --instance ./x --base-url "$BASE" --out x.jsonld';
    const without = 'kg-export.ts --instance ./x --out x.jsonld';
    expect(publishedInstances(withBase, "w.yml")[0]!.standInBase).toBe(true);
    expect(publishedInstances(without, "w.yml")[0]!.standInBase).toBe(false);
  });

  test("a `--base-url` on the NEXT line is not this invocation's", () => {
    // The regex takes the remainder of the line only. A following command's
    // flag is not evidence about this one.
    const yml = 'kg-export.ts --instance ./x --out x.jsonld\nsomething-else --base-url "$BASE"';
    expect(publishedInstances(yml, "w.yml")[0]!.standInBase).toBe(false);
  });

  test("a DIFFERENT script taking --instance is not this export", () => {
    // `gen-bootstrap-graph.ts` is a real neighbour in both workflows.
    // Running it here would report failures that say nothing about the
    // published graph, which is how a gate earns the habit of being ignored.
    expect(publishedInstances("bun run cat-harness/scripts/gen-bootstrap-graph.ts --instance ./bootstrap", "w.yml")).toEqual([]);
  });

  test("this instance's own export carries no --instance and is not counted", () => {
    expect(publishedInstances('bun run cat-harness/scripts/kg-export.ts             --out "./_site/${STUB}.jsonld"', "w.yml")).toEqual([]);
  });
});

describe("formatReport", () => {
  const inv = (workflow: string, instance: string, standInBase = false) => ({ workflow, instance, standInBase });

  test("finding nothing is reported as examining nothing, NOT as a pass", () => {
    // The third-state rule, where a gate is most tempted to break it: if the
    // pattern stops matching, this would sweep an empty set and print a tick.
    const out = formatReport({ invocations: [], results: [], workflowsRead: 39 });
    expect(out).toContain("EXAMINED NOTHING");
    expect(out).toContain("39 workflow file(s)");
    expect(out).not.toContain("✓");
  });

  test("an unreadable workflow is its own state, and says so", () => {
    const out = formatReport({ invocations: [], results: [], unreadable: "x.yml: EACCES", workflowsRead: 38 });
    expect(out).toContain("COULD NOT READ");
    expect(out).toContain("not a pass");
    expect(out).not.toContain("✓");
  });

  test("an unreadable workflow OUTRANKS green results — a partial sweep is not a clean one", () => {
    // A sweep blind on one file has not cleared the others, and the report
    // must not let a row of ticks read as coverage.
    const out = formatReport({
      invocations: [inv("docs-site.yml", "./bootstrap")],
      results: [{ ...inv("docs-site.yml", "./bootstrap"), ok: true, nodes: 85 }],
      unreadable: "feature-staging.yml: EACCES",
      workflowsRead: 38,
    });
    expect(out).toContain("COULD NOT READ");
    expect(out).toContain("partial");
    expect(out).not.toContain("every graph a workflow publishes builds");
  });

  test("each row names its workflow, so two files' results cannot be confused", () => {
    const out = formatReport({
      invocations: [inv("docs-site.yml", "./bootstrap"), inv("feature-staging.yml", "./bootstrap", true)],
      results: [
        { ...inv("docs-site.yml", "./bootstrap"), ok: true, nodes: 85 },
        { ...inv("feature-staging.yml", "./bootstrap", true), ok: true, nodes: 85 },
      ],
      workflowsRead: 39,
    });
    expect(out).toContain("docs-site.yml: ./bootstrap");
    expect(out).toContain("feature-staging.yml: ./bootstrap");
    expect(out).toContain("2 workflow(s)");
  });

  test("a stood-in base is disclosed, never presented as the workflow's own run", () => {
    const out = formatReport({
      invocations: [inv("feature-staging.yml", "./bootstrap", true)],
      results: [{ ...inv("feature-staging.yml", "./bootstrap", true), ok: true, nodes: 85 }],
      workflowsRead: 39,
    });
    expect(out).toContain("stood in");
  });

  test("the node count rides with the tick, so a drop to nothing is visible", () => {
    // `exit 0` alone was not enough and the falsification proved it: an
    // invocation pointed at a nonexistent instance exited 0 and this gate
    // printed a tick over an empty graph.
    const out = formatReport({
      invocations: [inv("docs-site.yml", "./bootstrap")],
      results: [{ ...inv("docs-site.yml", "./bootstrap"), ok: true, nodes: 85 }],
      workflowsRead: 39,
    });
    expect(out).toContain("85 node(s)");
  });

  test("a failure names the workflow, the instance, and what the export reported", () => {
    const out = formatReport({
      invocations: [inv("docs-site.yml", "./bootstrap")],
      results: [{ ...inv("docs-site.yml", "./bootstrap"), ok: false, detail: "✗ no canonicalUrl in x" }],
      workflowsRead: 39,
    });
    expect(out).toContain("✗ docs-site.yml: ./bootstrap");
    expect(out).toContain("no canonicalUrl in x");
  });

  test("a failure that said nothing is distinguishable from one that did", () => {
    const out = formatReport({
      invocations: [inv("w.yml", "./x")],
      results: [{ ...inv("w.yml", "./x"), ok: false, detail: "exited 1 with no diagnosis" }],
      workflowsRead: 39,
    });
    expect(out).toContain("no diagnosis");
  });
});
