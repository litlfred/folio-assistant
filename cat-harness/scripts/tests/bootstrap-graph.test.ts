/**
 * The bootstrap graph resolves at the URL it names itself by, has exactly one
 * publisher, and holds what is on disk.
 *
 * Since 2026-09-30 (owner, bean `xsqm`) the one publisher is bootstrap-tools'
 * `export-graph.ts`, and `gen-bootstrap-graph.ts`, the cat-harness generator
 * these tests were first written against, is gone (owner: "remove
 * gen-bootstrap-graph"). The exporter's own properties — purity, ordering, no
 * absolute path, provenance only when asked, the `omitted` list — are asserted
 * beside it in `bootstrap-tools/scripts/export-graph.test.ts`. What stays here
 * is what only this repository can see: which workflow step publishes it,
 * where, and whether the export agrees with a disk read made independently of
 * the declaration.
 *
 * @module scripts/tests/bootstrap-graph.test
 */
import { describe, expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";

import { GraphExportSchema } from "../../../bootstrap-tools/schemas/graph-export.ts";
import { exportGraph } from "../../../bootstrap-tools/scripts/export-graph.ts";
import { isSkillMd } from "../known-skills.js";
import {
  repoRootFor,
  declarationPathIn,
  readDeclaration,
  artefactStub,
} from "../../schemas/cat-harness.js";

const ROOT = resolve(import.meta.dir, "../..");
// `bootstrap/` is at the REPOSITORY root, not inside this instance — it is
// the graph read before anything knows which instance it is looking at.
const CAT_BOOTSTRAP = join(repoRootFor(ROOT), "bootstrap");
const STUB = artefactStub(readDeclaration(CAT_BOOTSTRAP)!);
/** The document as the site build makes it: `@id` = base + the `--out` file name. */
const build = (provenance = false) =>
  exportGraph(CAT_BOOTSTRAP, { docIri: `https://example.org/${STUB}/${STUB}.jsonld`, provenance });

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
  test("its `@id` is the URL the site build writes it to", () => {
    // Each publishing step passes `--base-url <site>/<stub>/` and
    // `--out ./_site/<stub>/<file>`, and the exporter names the document
    // `<base-url><file>`, so the `@id` is the served path by construction.
    // What can still go wrong is the two arguments naming different
    // directories, which is what this reads off each step.
    for (const wf of ["docs-site.yml", "feature-staging.yml"]) {
      const text = readFileSync(join(repoRootFor(ROOT), ".github", "workflows", wf), "utf-8");
      for (const step of bootstrapGraphPublishers(text)) {
        const base = /--base-url\s+"[^"]*\/([^"/]+)\/"/.exec(step)?.[1];
        const outDir = /--out\s+"\.\/_site\/([^"/]+)\//.exec(step)?.[1];
        expect({ wf, base, outDir }).toEqual({ wf, base: outDir, outDir: expect.any(String) });
      }
    }
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
    //
    // That sentence was written here on 2026-09-20 and the assertion did not
    // honour it — the literal it matched named `gen-bootstrap-graph.ts`. Bean
    // `dyd3` then found TWO publishers writing a bootstrap graph, disagreeing
    // about its contents, and retired this one; the site now writes that URL
    // from `kg-export --instance ./bootstrap`, and since 2026-09-30 from
    // bootstrap-tools' `export-graph.ts`. A script-name match would have
    // gone red on the change that FIXED the defect it was guarding. Matching
    // the path, as the comment always said, it goes red only if nothing
    // writes there.
    const wf = readFileSync(
      join(repoRootFor(ROOT), ".github", "workflows", "docs-site.yml"),
      "utf-8",
    );
    const id = String(build()["@id"]);
    // `<base>/bootstrap/bootstrap.jsonld` → `bootstrap/bootstrap.jsonld`, the
    // path under `_site/`. Taken from the `@id` rather than written out, so
    // the two sides cannot drift into agreeing about different URLs.
    const served = new URL(id).pathname.split("/").slice(-2).join("/");
    expect(siteOutputs(wf)).toContain(`./_site/${served}`);
  });

  test("exactly ONE step publishes it — the rival generator no longer does", () => {
    // `dyd3`. Two generators minted the SAME document: this one at
    // `<base>/bootstrap/bootstrap.jsonld`, and `kg-export --instance
    // ./bootstrap` at `<base>/bootstrap.jsonld`. Measured 2026-09-21: 88 nodes
    // each, 85 of them doc-relative, so 85 subjects existed under two
    // identities no consumer will ever merge.
    //
    // Collapsing the PATHS is not what settles it, which is why this test is
    // about the COUNT rather than about a path: at one URL the two documents
    // still disagree on 74 of those 88 nodes, so the site would serve whichever
    // step ran last. The invariant is one publisher, and the failure mode it
    // guards is somebody re-adding the other because the generator is still
    // here and still works.
    for (const wf of ["docs-site.yml", "feature-staging.yml"]) {
      const text = readFileSync(join(repoRootFor(ROOT), ".github", "workflows", wf), "utf-8");
      expect({ workflow: wf, publishers: bootstrapGraphPublishers(text).length }).toEqual({
        workflow: wf,
        publishers: 1,
      });
    }
  });

  test("it is NOT committed — it is a build artefact now", () => {
    // The inverse of the test this replaces, and it earns its place: an
    // ignored path is easy to re-add with `git add -f`, and a re-added copy
    // silently goes stale with no gate left to catch it. The file may exist
    // locally, from a hand run of the exporter; what must not
    // exist is a TRACKED copy.
    const tracked = execFileSync("git", ["ls-files", "--", "bootstrap/bootstrap.jsonld"], {
      cwd: repoRootFor(ROOT),
      encoding: "utf-8",
    }).trim();
    expect(tracked).toBe("");
  });
});

describe("what it contains, read against the disk", () => {
  test("every skill bootstrap holds is in the graph", () => {
    // DERIVED, not pinned. It asserted `Skill` === 2 until 2026-09-20 and
    // broke the moment `log-message` landed — a count makes "the export still
    // works" and "somebody deleted a skill" indistinguishable, and the failure
    // it produces is on the change that was correct.
    //
    // The property is that the export sees what is on disk. A new skill passes
    // without an edit here; a skill the scan misses fails, which is the case
    // worth defending.
    expect(skillIds(build())).toEqual(skillFilesOnDisk());
  });

  test("bootstrap publishes only the graph typologies it DECLARES", () => {
    // Bean `3jj9`: the universal registry once leaked into every instance, so
    // bootstrap advertised `folio`, `voices` and `beans`, none of which it can
    // reach. Derived from the declaration, read here independently of the
    // exporter: published is a subset of declared.
    const kinds = (build()["@graph"] as Array<Record<string, unknown>>)
      .filter((n) => n["@type"] === "bootstrap:Subgraph")
      .flatMap((n) => (n["type"] as string[]).map((k) => k.split("/").pop()!));
    const declared = new Set(
      (JSON.parse(readFileSync(declarationPathIn(CAT_BOOTSTRAP)!, "utf-8")) as {
        directories?: Array<{ graphTypologies?: string[] }>;
      }).directories?.flatMap((d) => d.graphTypologies ?? []) ?? [],
    );
    expect(kinds.length).toBeGreaterThan(0); // not vacuous
    for (const k of kinds) expect([...declared]).toContain(k);
  });

  test("bootstrap's process IS in the graph, with its flows and lanes", () => {
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
    // diagram and does not compete for being the thing a Bootstrapping Agent begins.
    const doc = build();
    const counts = doc["counts"] as Record<string, number>;
    expect({
      processes: processIds(doc),
      hasNodes: (counts["bootstrap:ProcessNode"] ?? 0) > 0,
      hasFlows: (counts["bootstrap:SequenceFlow"] ?? 0) > 0,
      hasRoles: (counts["bootstrap:Role"] ?? 0) > 0,
    }).toEqual({ processes: diagramsOnDisk(), hasNodes: true, hasFlows: true, hasRoles: true });
    // And nothing about the diagram is reported as a problem.
    expect((doc["problems"] as string[]).filter((p) => p.includes("bpmn"))).toEqual([]);
  });
});

/**
 * The steps in a workflow that publish a bootstrap GRAPH document.
 *
 * bootstrap-tools' `export-graph.ts` is the publisher; `kg-export.ts` pointed
 * at that instance was the previous one, and stays named so it cannot come
 * back unnoticed as a second. `ns-export.ts` also writes into `bootstrap/`, and is not one of these:
 * it publishes the NAMESPACE document, a different subject at a different URL.
 */
function bootstrapGraphPublishers(workflowText: string): string[] {
  const code = workflowText
    .split("\n")
    .filter((l) => !/^\s*#/.test(l))
    .join("\n");
  return [...code.matchAll(/(?:cat-harness|bootstrap-tools)\/scripts\/([a-z0-9-]+)\.ts([^\n]*)/g)]
    .filter((m) => {
      const [script, rest] = [m[1]!, m[2] ?? ""];
      if (!/--out\s/.test(rest)) return false;
      if (script === "export-graph") return true;
      return script === "kg-export" && /--instance\s+\.?\/?bootstrap\b/.test(rest);
    })
    .map((m) => `${m[1]}${m[2]}`);
}

/**
 * Every `--out` path a workflow writes, with its shell variables expanded.
 *
 * The workflow captures stubs — `BOOT_STUB=$(… print-stub.ts ./bootstrap)` —
 * so a literal-text match cannot see the path at all. Expanding the capture
 * rather than hardcoding `bootstrap` keeps the assertion pointed at the
 * DECLARATION: rename the instance and both sides move together, which is the
 * whole reason the workflow captures it instead of spelling it out.
 */
function siteOutputs(workflowText: string): string[] {
  const stubs = new Map<string, string>();
  for (const m of workflowText.matchAll(
    /(\w+)=\$\(bun run cat-harness\/scripts\/print-stub\.ts\s+(\S+)\)/g,
  )) {
    const decl = readDeclaration(join(repoRootFor(ROOT), m[2]!));
    if (decl) stubs.set(m[1]!, artefactStub(decl));
  }
  const expand = (v: string): string =>
    v.replace(/\$\{(\w+)\}/g, (whole, name: string) => stubs.get(name) ?? whole);
  return [...workflowText.matchAll(/--out\s+"([^"]+)"/g)].map((m) => expand(m[1]!));
}

/** Node ids of one `@type`, reduced to the fragment stem, sorted. */
function idsOfType(doc: Record<string, unknown>, type: string): string[] {
  const graph = (doc["@graph"] ?? []) as Array<Record<string, unknown>>;
  return graph
    .filter((n) => {
      const t = n["@type"];
      const ts = Array.isArray(t) ? t.map(String) : [String(t)];
      // `@type` is a CURIE, `bootstrap:Skill`. Matched on the whole local
      // name rather than a suffix, so `ProcessNode` does not answer for `Process`.
      return ts.some((x) => x === `bootstrap:${type}`);
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
  // ONE directory again, named. `tools/` (earlier `render/`) held the two
  // skills governing bootstrap's own `.jsonld`/`.json` emission from bean
  // `hfkl` until bean `n350` moved them into `skills/`: they are skills, the
  // Tool that performs the emission is bootstrap-tools' `export-graph.ts`,
  // and the document's shape is its `GraphExportSchema`.
  //
  // The list is STILL hardcoded on
  // purpose. Reading the declaration here would collapse the two axes into
  // one and the comparison below would compare the export against itself —
  // which is the whole defect this file exists to catch. The literal going
  // stale and failing loudly IS the mechanism, not a cost of it.
  return ["skills"]
    .flatMap((name) => {
      const dir = join(CAT_BOOTSTRAP, name);
      return readdirSync(dir)
        .filter((f) => f.endsWith(".md") && isSkillMd(join(dir, f)))
        .map((f) => f.slice(0, -3));
    })
    .sort();
}

/** The processes actually drawn in `bootstrap/processes/`, by their BPMN id. */
function diagramsOnDisk(): string[] {
  const dir = join(CAT_BOOTSTRAP, "processes");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".bpmn"))
    .map((f) => /<bpmn:process id="([^"]+)"/.exec(readFileSync(join(dir, f), "utf-8"))?.[1] ?? f)
    .sort();
}

describe("the document has a schema, and the published build satisfies it (bean n350)", () => {
  // `renderExemption.owes` names this document. Until n350 it had no schema:
  // its properties lived in the emission skill's prose and the code that read
  // it cast `doc.problems as string[]`.
  // The published document is bootstrap-tools' since 2026-09-30 (owner,
  // bean `xsqm`), with its own schema; its properties are tested beside it
  // (`bootstrap-tools/scripts/export-graph.test.ts`). These two stay here
  // because the PUBLISHING — which step, with what flags — is this site's.
  test("the published document — bootstrap-tools' export-graph, the one publisher — parses", () => {
    const doc = build(true);
    const r = GraphExportSchema.safeParse(doc);
    expect(r.success ? [] : r.error.issues).toEqual([]);
  });

  test("the published copy carries provenance; the @graph carries none (hwzu)", () => {
    // Owner, 2026-09-23: every published graph carries PROV provenance. Both
    // workflows pass `--provenance`; no node carries a build time.
    for (const wf of ["docs-site.yml", "feature-staging.yml"]) {
      const text = readFileSync(join(repoRootFor(ROOT), ".github", "workflows", wf), "utf-8");
      expect({ wf, provenance: bootstrapGraphPublishers(text).every((p) => p.includes("--provenance")) }).toEqual({ wf, provenance: true });
    }
    const doc = build(true);
    expect("generatedAtTime" in doc).toBe(true);
    expect(JSON.stringify(doc["@graph"]).includes("generatedAtTime")).toBe(false);
  });

  test("the two emission skills are in bootstrap's skills package", () => {
    const manifest = JSON.parse(readFileSync(join(CAT_BOOTSTRAP, "skills", "package-manifest.json"), "utf8"));
    expect(manifest.skills).toEqual(expect.arrayContaining(["bootstrap-graph-emission", "bootstrap-graph-publication"]));
  });
});
