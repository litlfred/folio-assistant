/**
 * The bootstrap graph is committed, current, and a pure function of its inputs.
 *
 * @module scripts/tests/bootstrap-graph.test
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { buildBootstrapDocument } from "../gen-bootstrap-graph.js";
import { repoRootFor } from "../../schemas/cat-harness.js";

const ROOT = resolve(import.meta.dir, "../..");
const OUT = join(repoRootFor(ROOT), "bootstrap", "bootstrap.jsonld");

describe("the file a cold agent is told to load exists", () => {
  test("`bootstrap/bootstrap.jsonld` is committed, not a build artefact", () => {
    // `_kg/<stub>.jsonld` is gitignored because nothing needs it in a fresh
    // clone. This one is the opposite case: its reader has nothing installed
    // and cannot run a build, and `bootstrap/README.md` step 2 says to load
    // it. For that instruction to be true in a fresh clone, it must be IN the
    // clone.
    expect(existsSync(OUT)).toBe(true);
  });

  test("it is current", async () => {
    const doc = await buildBootstrapDocument();
    expect(readFileSync(OUT, "utf-8")).toBe(JSON.stringify(doc, null, 2) + "\n");
  });
});

describe("pure, because committed-and-gated demands it", () => {
  test("two builds are byte-identical", async () => {
    // A timestamp would make every run a diff, so `--check` would fail on a
    // tree nobody touched and be switched off within a week.
    const a = JSON.stringify(await buildBootstrapDocument());
    const b = JSON.stringify(await buildBootstrapDocument());
    expect(a).toBe(b);
  });

  test("it carries no timestamp and no commit SHA", async () => {
    // A committed generated file CANNOT carry its own commit: the best it
    // could name is the commit before the one containing it, which is wrong by
    // construction. Its provenance is that it is in the repository.
    const doc = await buildBootstrapDocument();
    expect(doc["generatedAt"]).toBeUndefined();
    expect(doc["sourceCommitSha"]).toBeUndefined();
  });

  test("no value is an absolute path from the build machine", async () => {
    // Caught before shipping: the "no .bpmn directory" problem embedded an
    // absolute root, so CI — a different checkout path — would have failed the
    // staleness gate on an untouched tree.
    const text = JSON.stringify(await buildBootstrapDocument());
    expect(text).not.toContain(ROOT);
    expect(text.includes("/home/") || text.includes("/Users/")).toBe(false);
  });
});

describe("what it contains, and what it admits it did not look at", () => {
  test("bootstrap's two skills are in the graph", async () => {
    const doc = await buildBootstrapDocument();
    expect((doc["counts"] as Record<string, number>)["Skill"]).toBe(2);
  });

  test("the instance-bound collectors are named as NOT looked for", async () => {
    // "bootstrap has no tools" and "tools were never looked for" are different
    // facts; an empty section rendered as a clean one is the `dh4f` defect.
    expect(doc_omitted(await buildBootstrapDocument()).sort()).toEqual([
      "packages",
      "registry",
      "schemas",
      "tools",
    ]);
  });

  test("bootstrap's process IS in the graph, with its flows and lanes", async () => {
    // This asserted the OPPOSITE until 2026-09-19 — "the missing BPMN
    // directory is reported rather than passed over", against the real
    // `bootstrap/`, which had no `workflows/` when it was written. #413 gave
    // bootstrap its decision tree and the assertion inverted: the directory is
    // no longer missing, so nothing reports it missing.
    //
    // The behaviour it meant to pin — an absent directory is REPORTED, not
    // passed over — is real and still guarded, on a FIXTURE that declares the
    // absence, in `kg-export-instance.test.ts`. A property of a real instance
    // that is still being built cannot carry it: the test breaks when the
    // instance grows the feature, which is a fact about the subject rather
    // than about the code.
    //
    // What belongs here is the fact that is now true and worth defending.
    const doc = await buildBootstrapDocument();
    const counts = doc["counts"] as Record<string, number>;
    expect({
      Process: counts["Process"] ?? 0,
      hasNodes: (counts["ProcessNode"] ?? 0) > 0,
      hasFlows: (counts["SequenceFlow"] ?? 0) > 0,
      hasRoles: (counts["Role"] ?? 0) > 0,
    }).toEqual({ Process: 1, hasNodes: true, hasFlows: true, hasRoles: true });
    // And nothing about the diagram is reported as a problem.
    expect((doc["problems"] as string[]).filter((p) => p.includes("bpmn"))).toEqual([]);
  });
});

function doc_omitted(doc: Record<string, unknown>): string[] {
  return [...(doc["omitted"] as readonly string[])];
}
