/**
 * The bootstrap graph is committed, current, and a pure function of its inputs.
 *
 * @module scripts/tests/bootstrap-graph.test
 */
import { describe, expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";

import { buildCatBootstrapDocument } from "../gen-bootstrap-graph.js";
import { isSkillMd } from "../known-skills.js";
import { repoRootFor, declarationPathIn } from "../../schemas/cat-harness.js";

const ROOT = resolve(import.meta.dir, "../..");
// `bootstrap/` is at the REPOSITORY root, not inside this instance — it is
// the graph read before anything knows which instance it is looking at.
const CAT_BOOTSTRAP = join(repoRootFor(ROOT), "bootstrap");

describe("the document is published where it says it is", () => {
  /**
   * These two replaced "`bootstrap.jsonld` is committed" and "it is current",
   * which went with the committed file on 2026-09-20.
   *
   * Their premise was that a cold reader is told to load the file from a fresh
   * clone. **No prose file under `bootstrap/` mentions this document** — the
   * README sends that reader to `workflows/initialize-harness.bpmn` and
   * `skills/bootstrap-kg-navigation.md`. So the pair defended an instruction
   * that does not exist, while the thing worth defending went unguarded: the
   * `@id` resolved to nothing, because the site build published
   * `bootstrap/ns.jsonld` — the NAMESPACE document — and never this one.
   *
   * That is `blv9` in the artefact whose whole purpose is being dereferenced,
   * and it is what these assert instead.
   */
  test("its `@id` is the URL the site build writes it to", async () => {
    const doc = await buildCatBootstrapDocument();
    const id = String(doc["@id"]);
    // The build writes `./_site/bootstrap/bootstrap.jsonld`, and `_site/` is
    // served at the site base. So the path the IRI carries must be exactly
    // the path under `_site/` — anything else is a link that 404s.
    expect(id.endsWith("/bootstrap/bootstrap.jsonld")).toBe(true);
  });

  test("the site build actually writes it, at that path", () => {
    // The assertion is against the WORKFLOW, because the failure being
    // guarded is a publication gap rather than a generator bug: the generator
    // worked perfectly for months while nothing published what it produced.
    //
    // Matched on the `--out` path rather than on the script name: a build that
    // runs the generator and writes it somewhere else leaves the `@id` dead
    // just as surely as one that never runs it, and the script name alone
    // cannot tell the two apart.
    const wf = readFileSync(
      join(repoRootFor(ROOT), ".github", "workflows", "docs-site.yml"),
      "utf-8",
    );
    expect(wf).toContain("gen-bootstrap-graph.ts --out \"./_site/bootstrap/bootstrap.jsonld\"");
  });

  test("it is NOT committed — it is a build artefact now", () => {
    // The inverse of the test this replaces, and it earns its place: an
    // ignored path is easy to re-add with `git add -f`, and a re-added copy
    // silently goes stale with no gate left to catch it. The file may exist
    // locally, since `bun run bootstrap:graph` writes it; what must not
    // exist is a TRACKED copy.
    const tracked = execFileSync("git", ["ls-files", "--", "bootstrap/bootstrap.jsonld"], {
      cwd: repoRootFor(ROOT),
      encoding: "utf-8",
    }).trim();
    expect(tracked).toBe("");
  });
});

describe("pure, because committed-and-gated demands it", () => {
  test("two builds are byte-identical", async () => {
    // A timestamp would make every run a diff, so `--check` would fail on a
    // tree nobody touched and be switched off within a week.
    const a = JSON.stringify(await buildCatBootstrapDocument());
    const b = JSON.stringify(await buildCatBootstrapDocument());
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
    const doc = await buildCatBootstrapDocument();
    const ids = (doc["@graph"] as Array<Record<string, unknown>>).map((n) => String(n["@id"]));
    expect(ids.length).toBeGreaterThan(0); // not vacuous
    expect(ids).toEqual([...ids].sort());
  });

  test("it carries no timestamp and no commit SHA", async () => {
    // A committed generated file CANNOT carry its own commit: the best it
    // could name is the commit before the one containing it, which is wrong by
    // construction. Its provenance is that it is in the repository.
    const doc = await buildCatBootstrapDocument();
    expect(doc["generatedAt"]).toBeUndefined();
    expect(doc["sourceCommitSha"]).toBeUndefined();
  });

  test("no value is an absolute path from the build machine", async () => {
    // Caught before shipping: the "no .bpmn directory" problem embedded an
    // absolute root, so CI — a different checkout path — would have failed the
    // staleness gate on an untouched tree.
    const text = JSON.stringify(await buildCatBootstrapDocument());
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
    const doc = await buildCatBootstrapDocument();
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
    const doc = await buildCatBootstrapDocument();
    const kinds = (doc["@graph"] as Array<Record<string, unknown>>)
      .filter((n) => String(n["@type"]).endsWith("#GraphKind"))
      .map((n) => String(n["name"]));
    const declared = new Set(
      (JSON.parse(readFileSync(declarationPathIn(CAT_BOOTSTRAP)!, "utf-8")) as {
        directories?: Array<{ graphKinds?: string[] }>;
      }).directories?.flatMap((d) => d.graphKinds ?? []) ?? [],
    );
    expect(kinds.length).toBeGreaterThan(0); // not vacuous
    for (const k of kinds) expect([...declared]).toContain(k);
  });

  test("the instance-bound collectors are named as NOT looked for", async () => {
    // "bootstrap has no tools" and "tools were never looked for" are different
    // facts; an empty section rendered as a clean one is the `dh4f` defect.
    expect(doc_omitted(await buildCatBootstrapDocument()).sort()).toEqual([
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
    const doc = await buildCatBootstrapDocument();
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
  // TWO directories, named. `render/` joined `skills/` with bean `hfkl`: it
  // holds the skills governing bootstrap's own `.jsonld`/`.json` emission,
  // which is the obligation bootstrap carries INSTEAD of a visualiser.
  //
  // Adding it here is the axis working rather than a maintenance tax — the
  // disk side names its directories on purpose, so a resolver that silently
  // stopped seeing one would fail here instead of exporting an empty section.
  return ["skills", "render"]
    .flatMap((name) => {
      const dir = join(CAT_BOOTSTRAP, name);
      return readdirSync(dir)
        .filter((f) => f.endsWith(".md") && isSkillMd(join(dir, f)))
        .map((f) => f.slice(0, -3));
    })
    .sort();
}

/** The processes actually drawn in `bootstrap/workflows/`, by their BPMN id. */
function diagramsOnDisk(): string[] {
  const dir = join(CAT_BOOTSTRAP, "workflows");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".bpmn"))
    .map((f) => /<bpmn:process id="([^"]+)"/.exec(readFileSync(join(dir, f), "utf-8"))?.[1] ?? f)
    .sort();
}
