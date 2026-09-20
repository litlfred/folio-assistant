/**
 * The bootstrap graph is committed, current, and a pure function of its inputs.
 *
 * @module scripts/tests/bootstrap-graph.test
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { buildBootstrapDocument } from "../gen-bootstrap-graph.js";
import { isSkillMd } from "../known-skills.js";
import { repoRootFor } from "../../schemas/cat-harness.js";

const ROOT = resolve(import.meta.dir, "../..");
// `bootstrap/` is at the REPOSITORY root, not inside this instance — it is
// the graph read before anything knows which instance it is looking at.
const BOOTSTRAP = join(repoRootFor(ROOT), "bootstrap");
const OUT = join(BOOTSTRAP, "bootstrap.jsonld");

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

  test("the graph is ORDERED, so two machines agree byte for byte", async () => {
    // The test above compares two builds in ONE process against ONE
    // filesystem, so it compares an ordering against itself and cannot fail
    // on ordering at all. It is a real guard for timestamps and a guard that
    // structurally cannot fire for this.
    //
    // Bean `3jj9`, measured 2026-09-20: the collectors walk directories, so
    // node order was `readdirSync` order — the FILESYSTEM's, not the
    // repository's. The committed file held skills as `bootstrap-kg-
    // navigation, discussion, confirm-harness, log-message`, stable on the
    // container that wrote it and different on CI. `it is current` compares
    // bytes, so it passed locally and failed in CI on identical inputs.
    //
    // Asserting the ORDER rather than re-running the build is the point: this
    // fails on the machine that introduces the regression, not only on the
    // one that disagrees with it later.
    const doc = await buildBootstrapDocument();
    const ids = (doc["@graph"] as Array<Record<string, unknown>>).map((n) => String(n["@id"]));
    expect(ids.length).toBeGreaterThan(0); // not vacuous
    expect(ids).toEqual([...ids].sort());
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
  test("every skill bootstrap holds is in the graph", async () => {
    // DERIVED, not pinned. It asserted `Skill` === 2 until 2026-09-20 and
    // broke the moment `log-message` landed — a count makes "the export still
    // works" and "somebody deleted a skill" indistinguishable, and the failure
    // it produces is on the change that was correct.
    //
    // The property is that the export sees what is on disk. A new skill passes
    // without an edit here; a skill the scan misses fails, which is the case
    // worth defending.
    const doc = await buildBootstrapDocument();
    expect(skillIds(doc)).toEqual(skillFilesOnDisk());
  });

  test("bootstrap publishes only the graph kinds it DECLARES", async () => {
    // Bean `3jj9`. `collectGraphKinds` emitted the UNIVERSAL registry into
    // every instance, so bootstrap — whose premise is that it knows nothing
    // yet — published 16 GraphKind nodes while its declaration names one.
    // It advertised `folio`, `voices` and `library` (core's) and `beans` and
    // `todos` (cat-harness's), none of which it can reach.
    //
    // Derived from the declaration rather than pinned to "cat-harness", for
    // the reason the skill test above gives: a literal breaks on the change
    // that was correct. What is defended is the RELATION — published is a
    // subset of declared — not today's contents.
    const doc = await buildBootstrapDocument();
    const kinds = (doc["@graph"] as Array<Record<string, unknown>>)
      .filter((n) => String(n["@type"]).endsWith("#GraphKind"))
      .map((n) => String(n["name"]));
    const declared = new Set(
      (JSON.parse(readFileSync(join(BOOTSTRAP, "harness.json"), "utf-8")) as {
        directories?: Array<{ graphs?: string[] }>;
      }).directories?.flatMap((d) => d.graphs ?? []) ?? [],
    );
    expect(kinds.length).toBeGreaterThan(0); // not vacuous
    for (const k of kinds) expect([...declared]).toContain(k);
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
    //
    // `Process: 1` was pinned here and broke when `log-message.bpmn` landed —
    // the same count-vs-property failure as the skills above, and the count
    // was ALSO stating a rule it could not enforce. "One process" was never
    // the constraint; "one place to START" is. A sub-process is a second
    // diagram and does not compete for being the thing an Initiator begins.
    const doc = await buildBootstrapDocument();
    const counts = doc["counts"] as Record<string, number>;
    expect({
      processes: processIds(doc),
      hasNodes: (counts["ProcessNode"] ?? 0) > 0,
      hasFlows: (counts["SequenceFlow"] ?? 0) > 0,
      hasRoles: (counts["Role"] ?? 0) > 0,
    }).toEqual({ processes: diagramsOnDisk(), hasNodes: true, hasFlows: true, hasRoles: true });
    // And nothing about the diagram is reported as a problem.
    expect((doc["problems"] as string[]).filter((p) => p.includes("bpmn"))).toEqual([]);
  });
});

function doc_omitted(doc: Record<string, unknown>): string[] {
  return [...(doc["omitted"] as readonly string[])];
}

/** Node ids of one `@type`, reduced to the fragment stem, sorted. */
function idsOfType(doc: Record<string, unknown>, type: string): string[] {
  const graph = (doc["@graph"] ?? []) as Array<Record<string, unknown>>;
  return graph
    .filter((n) => {
      const t = n["@type"];
      const ts = Array.isArray(t) ? t.map(String) : [String(t)];
      // `@type` is the full minted IRI — `<base>/bootstrap/ns#Skill` — so the
      // fragment is what names the class. Matched on the whole fragment
      // rather than a suffix, so `ProcessNode` does not answer for `Process`.
      return ts.some((x) => x.split("#")[1] === type);
    })
    .map((n) => String(n["@id"]).split("#")[1]!.split("/").slice(1).join("/"))
    .sort();
}

function skillIds(doc: Record<string, unknown>): string[] {
  return idsOfType(doc, "Skill");
}

function processIds(doc: Record<string, unknown>): string[] {
  return idsOfType(doc, "Process");
}

/**
 * The skill bodies actually sitting in `bootstrap/skills/`.
 *
 * Shares `isSkillMd` with the exporter deliberately — a README or a node
 * declaring `$schema:` is not a skill, and a disk side that disagreed about
 * THAT would fail on a correct tree. What the two sides do NOT share is which
 * directory to look in: this one names it, the exporter resolves it from the
 * declaration. That axis is the one worth defending, because a resolver that
 * stops finding `bootstrap/skills/` exports an empty section and reports a
 * clean run over it — the `dh4f` defect, verified by probe to fail here.
 */
function skillFilesOnDisk(): string[] {
  const dir = join(BOOTSTRAP, "skills");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md") && isSkillMd(join(dir, f)))
    .map((f) => f.slice(0, -3))
    .sort();
}

/** The processes actually drawn in `bootstrap/workflows/`, by their BPMN id. */
function diagramsOnDisk(): string[] {
  const dir = join(BOOTSTRAP, "workflows");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".bpmn"))
    .map((f) => /<bpmn:process id="([^"]+)"/.exec(readFileSync(join(dir, f), "utf-8"))?.[1] ?? f)
    .sort();
}
