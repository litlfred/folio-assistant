/**
 * The gate that runs the deploy's own foreign exports.
 *
 * Its subject is not the export — that is `publication-base.test.ts` — but
 * the DERIVATION: which commands it decides to run, and what it does when it
 * decides on none.
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

describe("publishedInstances", () => {
  test("finds the invocation in the real deploy workflow", () => {
    // The witness that keeps the pattern honest. A regex proven only against
    // fixtures is a regex proven against its own author's idea of the file.
    const text = readFileSync(join(REPO_ROOT, ".github", "workflows", "docs-site.yml"), "utf-8");
    const found = publishedInstances(text);
    expect(found.length).toBeGreaterThan(0);
    expect(found).toContain("./cat-bootstrap");
  });

  test("reads every invocation, in the order the deploy runs them", () => {
    const yml = [
      "          bun run cat-harness/scripts/kg-export.ts --instance ./first --out a.jsonld",
      "          bun run cat-harness/scripts/kg-export.ts --instance ./second --out b.jsonld",
    ].join("\n");
    expect(publishedInstances(yml)).toEqual(["./first", "./second"]);
  });

  test("a DIFFERENT script taking --instance is not this export", () => {
    // `gen-cat-bootstrap-graph.ts` is a real neighbour in this same workflow.
    // Running it here would report failures that say nothing about the
    // published graph, which is how a gate earns the habit of being ignored.
    const yml = "          bun run cat-harness/scripts/gen-cat-bootstrap-graph.ts --instance ./cat-bootstrap";
    expect(publishedInstances(yml)).toEqual([]);
  });

  test("this instance's own export carries no --instance and is not counted", () => {
    const yml = '          bun run cat-harness/scripts/kg-export.ts             --out "./_site/${STUB}.jsonld"';
    expect(publishedInstances(yml)).toEqual([]);
  });
});

describe("formatReport", () => {
  test("finding nothing is reported as examining nothing, NOT as a pass", () => {
    // The third-state rule, in the one place a gate is most tempted to break
    // it: if the pattern stops matching, this gate would sweep an empty set
    // and print a tick. Zero is a finding.
    const out = formatReport({ invocations: [], results: [] });
    expect(out).toContain("EXAMINED NOTHING");
    expect(out).not.toContain("✓");
  });

  test("an unreadable workflow is its own state, and says so", () => {
    const out = formatReport({ invocations: [], results: [], unreadable: "no such file" });
    expect(out).toContain("COULD NOT READ");
    expect(out).toContain("not a pass");
    expect(out).not.toContain("✓");
  });

  test("a failure names the instance and repeats what the export reported", () => {
    const out = formatReport({
      invocations: ["./cat-bootstrap"],
      results: [{ instance: "./cat-bootstrap", ok: false, detail: "✗ no canonicalUrl in x" }],
    });
    expect(out).toContain("✗ ./cat-bootstrap");
    expect(out).toContain("no canonicalUrl in x");
  });

  test("a failure that said nothing is distinguishable from one that did", () => {
    // "it failed and gave no diagnosis" must not render as a blank line under
    // the instance name, which reads like the report was truncated.
    const out = formatReport({
      invocations: ["./x"],
      results: [{ instance: "./x", ok: false, detail: "exited 1 with no diagnosis" }],
    });
    expect(out).toContain("no diagnosis");
  });

  test("all green lists every instance, so a shrinking set is visible", () => {
    const out = formatReport({
      invocations: ["./a", "./b"],
      results: [
        { instance: "./a", ok: true },
        { instance: "./b", ok: true },
      ],
    });
    expect(out).toContain("✓ ./a");
    expect(out).toContain("✓ ./b");
    expect(out).toContain("2 invocation(s)");
  });
});
