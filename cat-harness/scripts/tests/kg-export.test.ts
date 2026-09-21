/**
 * The KG export is a whole graph, not a partial one wearing a total's clothes.
 *
 * The first version of `scripts/kg-export.ts` collected skills from six
 * instruction-body directories and reported **11 BPMN skill refs as dangling**.
 * They were not dangling. They resolve through `schemas/skills/<name>/`, which
 * holds a skill's I/O contract and which that collector did not know existed —
 * so the export was a partial graph published as a complete one, in the module
 * whose own doc comment warns against exactly that.
 *
 * It is worth being precise about why that is dangerous rather than merely
 * wrong. A consumer of `kg.json` cannot tell a skill that is absent from one
 * that was never collected: both are simply not in `@graph`. The counts look
 * plausible either way. Nothing errors. That is the `dh4f` shape — a clean run
 * over a corpus the tool could not read — and the only defence is an invariant
 * asserted against something outside the exporter's own view.
 *
 * So: every skill a diagram names must appear in the export. `check-workflow-refs`
 * already guarantees those refs resolve against the real skill locations, which
 * makes the set of BPMN refs an independent witness — if the exporter's notion
 * of "where skills live" narrows again, this fails.
 */
import { describe, expect, test } from "bun:test";
import { readRoleGraph } from "../../schemas/role-graph.ts";
import { join, resolve } from "node:path";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

import { buildExport, exportIdentity, publishedDocument, undeclaredRootTerms } from "../kg-export.js";
import { buildDeclarationSchema, buildSkillIoContracts } from "../harness-schema-export.js";
import { artefactStub, findDeclarationFile, instanceRootsIn, readDeclaration, repoRootFor } from "../../schemas/cat-harness.js";
import { NS_PREFIXES, termIri } from "../../schemas/namespaces.js";

/**
 * Does this IRI sit in ANY of the three folio namespaces?
 *
 * It was `startsWith(FOLIO_NS)` against one namespace. That assertion passed
 * for as long as there was one, and the moment the vocabulary split by layer
 * it would have failed on every bootstrap and core term — which is the test
 * doing its job, not a bug in it.
 */
const inFolioNs = (iri: string): boolean => Object.values(NS_PREFIXES).some((ns) => iri.startsWith(ns));

// The repo's own canonicalUrl, so the shared fixture is the CANONICAL export.
// Using an arbitrary base made it a preview, which (correctly) gave it an
// array `@type` and 968 alternateOf links — caught by the self-identification
// test below, which is the test doing its job.
const BASE = readDeclaration(join(import.meta.dir, "../.."))!.canonicalUrl!;
const EXPORT = await buildExport();
// Minted through `termIri`, exactly as the exporter mints it. Rebuilding the
// IRI from a namespace constant is what made this helper silently return zero
// rows for every type once the namespaces split — a green-looking suite over
// an empty set.
const typed = (t: string) => EXPORT["@graph"].filter((n) => n["@type"] === termIri(t));

describe("kg export", () => {
  test("no source failed to read", () => {
    // `problems` is reported AND non-empty is a CLI failure; a green test here
    // is what lets the workflow trust the published file.
    expect(EXPORT.problems).toEqual([]);
  });

  test("the graph is not trivially small — otherwise every assertion below is vacuous", () => {
    expect(EXPORT["@graph"].length).toBeGreaterThan(100);
    expect(typed("Skill").length).toBeGreaterThan(50);
    expect(typed("Process").length).toBeGreaterThan(5);
  });

  test("every skill a BPMN activity names appears in the export", () => {
    // The independent witness. `check:workflow-refs` guarantees these refs
    // resolve against the real skill locations, so if this exporter's notion
    // of where skills live narrows again — it has three times — this fails.
    const ids = new Set(typed("Skill").map((n) => n["@id"] as string));
    const referenced = new Set<string>();
    for (const n of typed("ProcessNode")) {
      for (const s of (n.implementedBy as string[] | undefined) ?? []) referenced.add(s);
    }
    expect(referenced.size).toBeGreaterThan(20); // Guard the guard.
    expect([...referenced].filter((r) => !ids.has(r)).sort()).toEqual([]);
  });

  test("process nodes carry the edges that make this a graph", () => {
    const nodes = typed("ProcessNode");
    // A list of skills is not a graph. These two edges are the reason to publish.
    expect(nodes.filter((n) => n.performedBy !== undefined).length).toBeGreaterThan(100);
    expect(nodes.filter((n) => ((n.implementedBy as string[]) ?? []).length > 0).length)
      .toBeGreaterThan(50);
  });

  test("the document identifies itself — @id, @type, provenance", () => {
    // smart-base's pattern: the document IRI is the URL it is served from, so
    // fetching an `@id` returns the document that defines it.
    //
    // DERIVED from the declaration rather than restating the stub. This read
    // `${BASE}/folio-assistant.jsonld` and went red on the 2026-09-21 stub
    // rename — correctly, but for the wrong reason: the property here is that
    // the document names ITSELF, which holds whatever the stub is. The value
    // is pinned once, in the naming test below, where it IS the subject.
    expect(EXPORT["@id"]).toBe(`${BASE}/${artefactStub(readDeclaration(join(import.meta.dir, "../.."))!)}.jsonld`);
    expect(EXPORT["@type"]).toBe("http://www.w3.org/ns/prov#Entity");
    expect(EXPORT.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test("every edge term is declared {\"@type\": \"@id\"} — otherwise it is not a graph", () => {
    // THE load-bearing assertion of this file. Without the coercion, every
    // edge is a string literal to a JSON-LD processor and the document is a
    // list of records that merely looks linked. This is cheap to lose in a
    // context edit and invisible when you do.
    const ctx = EXPORT["@context"] as Record<string, { "@type"?: string } | string>;
    for (const term of ["partOf", "implementedBy", "performedBy", "inPackage",
                        "declaresSkill", "startNode", "from", "to", "holdsGraph"]) {
      const d = ctx[term];
      expect(typeof d === "object" && d !== null && d["@type"] === "@id").toBe(true);
    }
    // And no @vocab: an undeclared key must stay undeclared rather than
    // silently minting an IRI against a default namespace.
    expect(ctx["@vocab"]).toBeUndefined();
  });

  test("every property in the graph is declared — nothing is dropped on expansion", () => {
    // Bean `ovkk`. A property name that is neither in the `@context` nor an
    // absolute IRI is not a property at all: a JSON-LD processor DROPS it, and
    // reading the file as plain JSON shows it, which is why 34 names and 3583
    // occurrences survived unnoticed until the viewer became the first real
    // consumer. Measured before the fix: 34 names on 8 of the 11 node types.
    //
    // The CLI exits non-zero on a non-empty list, so this is the same gate at
    // a smaller unit. It fails with the OFFENDING NAMES rather than a count,
    // because the work each one implies is a decision about that name.
    expect(EXPORT.undeclaredTerms.map((t) => t.term)).toEqual([]);
  });

  test("the published document carries no QA finding — those live in test/results/", () => {
    // Bean `2634`. The four families are a QA reviewer's findings about the
    // graph this run produced, so they belong under `test/results/`, not in
    // the artefact under review. `buildExport` still computes them; the
    // projection is what ships.
    const pub = publishedDocument(EXPORT) as unknown as Record<string, unknown>;
    for (const k of ["undeclaredTerms", "undeclaredSchemaModules", "danglingLinks", "problems"]) {
      expect(pub[k]).toBeUndefined();
    }
    // ...and what stays, stays. `counts` is what the graph CONTAINS — the
    // truncation check — and `repository` is provenance beside `sourceCommit`.
    // Neither is a verdict, so neither moves.
    expect(pub.counts).toBeDefined();
    expect(pub.repository).toBeDefined();
  });

  test("no ROOT-level field is undeclared either — the level `undeclaredTerms` cannot see", () => {
    // Bean `m5sk`. The same defect one level up, and it survived `ovkk` for a
    // structural reason: `undeclaredTerms` walks `@graph`, so the document
    // root is the one place it cannot look. Half the root WAS declared
    // (`generatedAt`, the four `sourceCommit*` fields), which is exactly what
    // made the other half invisible — a spot check on any declared field said
    // the root was covered.
    //
    // Measured before the fix: SIX undeclared root fields — `repository`,
    // `counts`, `problems`, `undeclaredTerms`, `undeclaredSchemaModules`,
    // `danglingLinks` — carrying the provenance, the truncation check and
    // every diagnostic the export produces. `staging` had already shipped
    // through this same gap in #340.
    // Against the PUBLISHED projection, which is what a consumer receives.
    // `buildExport` still returns the QA findings — they are the computation
    // the `qa-results/v1` document is written from — and they are deliberately
    // no longer declared, so checking the raw computation would report four
    // fields that are never published.
    expect(
      undeclaredRootTerms(
        publishedDocument(EXPORT) as unknown as Record<string, unknown>,
        EXPORT["@context"],
      ),
    ).toEqual([]);
  });

  test("...and the root check FIRES, rather than passing because it looks at nothing", () => {
    // The assertion above is green when the checker works AND when it is
    // broken, so on its own it is not evidence. `dh4f` is the whole repo's
    // name for that shape: a clean run over what was never read.
    const ctx = { ...EXPORT["@context"] } as Record<string, unknown>;
    delete ctx.counts;
    expect(
      undeclaredRootTerms(publishedDocument(EXPORT) as unknown as Record<string, unknown>, ctx),
    ).toEqual(["counts"]);

    // A `@`-prefixed key is a JSON-LD keyword and needs no declaration, so it
    // must NOT be reported — an alias of one is `keywordCollisions`' business.
    expect(undeclaredRootTerms({ "@id": "x", "@graph": [] }, {})).toEqual([]);

    // And a genuinely new field is caught with its name, not a count: the work
    // each one implies is a decision about that name.
    expect(undeclaredRootTerms({ "@id": "x", somethingNew: 1 }, {})).toEqual(["somethingNew"]);
  });

  test("no term is coerced to @id over values that are not IRIs", () => {
    // The failure mode that is WORSE than an undeclared term, and the reason
    // `ovkk` was modelling work rather than 34 lines of context. Under
    // `{"@type": "@id"}` a bare name like `git-push` does not stay a name: it
    // resolves against the document base and becomes `<base>/git-push`, an IRI
    // nobody minted and nothing serves. Confidently wrong beats silently
    // absent only in the sense that it is harder to notice.
    //
    // So: every value of every `@id`-coerced term must already BE an IRI.
    // `hasCapability` is the live instance — actor registry files carry bare
    // capability names, and the collector mints them.
    const ctx = EXPORT["@context"] as Record<string, { "@type"?: string } | string>;
    const coerced = Object.entries(ctx)
      .filter(([, v]) => typeof v === "object" && v !== null && (v as { "@type"?: string })["@type"] === "@id")
      .map(([k]) => k);
    expect(coerced.length).toBeGreaterThan(10); // Guard the guard.
    const offenders: string[] = [];
    for (const n of EXPORT["@graph"]) {
      for (const term of coerced) {
        for (const v of ([] as unknown[]).concat((n[term] as unknown) ?? [])) {
          if (typeof v !== "string" || /^[a-z][a-z0-9+.-]*:/i.test(v)) continue;
          offenders.push(`${String(n["@id"])} ${term} → ${v}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  test("a name is not carried beside the link that already reaches it", () => {
    // The other half of `ovkk`: five properties were DENORMALISED copies of
    // link data — `implementsSkillNames`, `satisfiesSkillNames`, `graphKinds`,
    // `packagePaths`, `laneName` — and the right treatment of a redundant copy
    // is removal, not a predicate IRI for a second answer that can go stale.
    // Each was removed only after its link form was shown to resolve for every
    // node; this pins that they do not come back.
    const retired = ["implementsSkillNames", "satisfiesSkillNames", "graphKinds", "packagePaths", "laneName"];
    const seen = new Set(EXPORT["@graph"].flatMap((n) => Object.keys(n)));
    expect(retired.filter((k) => seen.has(k))).toEqual([]);
    // And the facts they carried are still reachable, by link: a ProcessNode's
    // lane is its Role node's label, and its skills are Skill nodes.
    const byId = new Map(EXPORT["@graph"].map((n) => [n["@id"] as string, n]));
    const withLane = typed("ProcessNode").filter((n) => n.performedBy !== undefined);
    expect(withLane.length).toBeGreaterThan(100);
    for (const n of withLane) expect(byId.get(n.performedBy as string)?.name).toBeTruthy();
  });

  test("internal links resolve, bar the known data defects", () => {
    // 4 on this branch, every one a manifest naming something nobody wrote
    // (bean `nup0`) — data, not export failures, so they are reported in the
    // document rather than thrown. The number may only go DOWN.
    expect(EXPORT.danglingLinks.length).toBeLessThanOrEqual(4);
    for (const d of EXPORT.danglingLinks) {
      expect(["declaresSkill", "providesCapability"]).toContain(d.edge);
    }
  });

  test("the graph carries its own vocabulary", () => {
    // Self-describing: following `holdsGraph` from a directory must land on a
    // GraphKind node, not on a term that only exists in TypeScript.
    const kinds = typed("GraphKind");
    expect(kinds.length).toBeGreaterThanOrEqual(5);
    expect(kinds.some((k) => k.name === "folio" && k.renderable === true)).toBe(true);
    const ids = new Set(EXPORT["@graph"].map((n) => n["@id"]));
    // `holdsGraph` is a LIST: `graph` became `graphs[]` upstream because a
    // directory may hold more than one graph — `schemas/` holds both its own
    // and `kg`. Every entry must still land on a GraphKind node.
    for (const dir of typed("Directory")) {
      const held = dir.holdsGraph as string[];
      expect(Array.isArray(held)).toBe(true);
      expect(held.length).toBeGreaterThan(0);
      for (const g of held) expect(ids.has(g)).toBe(true);
    }
  });

  test("every node has an @id and an @type, and @ids are unique", () => {
    const ids = EXPORT["@graph"].map((n) => n["@id"]);
    for (const n of EXPORT["@graph"]) {
      expect(typeof n["@id"]).toBe("string");
      expect(inFolioNs(String(n["@type"]))).toBe(true);
    }
    expect(ids.length).toBe(new Set(ids).size);
  });

  test("counts agree with the graph they summarise", () => {
    // The counts block exists so a consumer can spot a truncated file. If it
    // can disagree with `@graph`, it is worse than absent.
    const recomputed: Record<string, number> = {};
    for (const n of EXPORT["@graph"]) {
      const t = String(n["@type"]).split("#")[1] ?? String(n["@type"]);
      recomputed[t] = (recomputed[t] ?? 0) + 1;
    }
    expect(EXPORT.counts).toEqual(recomputed);
  });

  test("artefacts are named after the repository, the declaration is not", () => {
    // The naming rule from migration-plan I.8. Both halves matter: stub-named
    // artefacts stop five split repos asserting colliding node IRIs, and a
    // FIXED declaration filename is what lets a consumer open a repo it has
    // never seen. A per-repo config name fails silently — a resolver deriving
    // it from the directory finds nothing when the repo is cloned elsewhere.
    const decl = readDeclaration(join(import.meta.dir, "../.."))!;
    const stub = artefactStub(decl);
    // `cat-harness` since 2026-09-21, on the owner's ruling (issue #649).
    // While this read `folio-assistant` it was the same string the REPOSITORY
    // ROOT instance carries as its `name`, and `artefactStub` falls through to
    // `name` when no stub is declared — so both instances resolved to
    // `<base>/folio-assistant.jsonld`. Two vocabularies, one path. The literal
    // is pinned HERE and derived everywhere else, because this test is the one
    // whose subject is the name itself.
    expect(stub).toBe("cat-harness");
    expect(exportIdentity({ baseUrl: BASE }).docIri).toBe(`${BASE}/${stub}.jsonld`);
    expect(buildDeclarationSchema({ baseUrl: BASE }).$id).toBe(`${BASE}/${stub}.schema.json`);

    // THE OTHER HALF OF THIS TEST WAS REVERSED BY THE OWNER, 2026-09-21, and
    // the reasoning is worth keeping rather than just the new assertion.
    //
    // It read: the declaration is at a FIXED filename, whatever the stub is —
    // and asserted `<stub>.json` must NOT exist. Migration-plan I.8's argument
    // was that a fixed name is what lets a consumer open a repo it has never
    // seen, because "a resolver deriving it from the DIRECTORY finds nothing
    // when the repo is cloned elsewhere".
    //
    // That argument is about deriving a filename from the DIRECTORY, and no
    // resolver here does. `findDeclarationFile` scans, parses, and takes the
    // file whose stem equals its own declared `name` — so a declaration is
    // SELF-IDENTIFYING and a clone renamed on disk still resolves. The
    // property I.8 wanted is preserved by the check rather than by the
    // constant, which is what made the suffix free to move.
    //
    // So `<name>.json` exists now, deliberately, and what is asserted is the
    // self-agreement that replaced the fixed name.
    const declFile = findDeclarationFile(join(import.meta.dir, "../.."));
    expect(declFile).toBe(`${readDeclaration(join(import.meta.dir, "../.."))!.name}.json`);
    // ...and the stub does NOT name it. The stub names published ARTEFACTS;
    // the declaration is named for the instance. They are equal here only
    // because cat-harness's stub is its own name, so asserting on the stub
    // would pass for the wrong reason in any instance that sets one.
    expect(declFile).not.toBe(`${stub}.config.json`);
  });

  test("EVERY declared instance exports at an absolute IRI — the base is the SITE's, not the instance's", () => {
    // Bean `40fl`. `exportIdentity` read `canonicalUrl` off the instance being
    // EXPORTED. `bootstrap` declares none deliberately — it has no site of
    // its own — so the moment `docs-site.yml` started publishing its graph
    // (2026-09-21, 11:31) the export minted a document-relative `@id`, pushed
    // that onto `problems`, and exited 1. Every push to `main` for the next
    // two hours failed to publish the site.
    //
    // DERIVED over the declared instances rather than listing bootstrap:
    // the defect is not about that instance, it is about any instance whose
    // graph this site publishes, and the next one to be added would have
    // reproduced it against a literal list that still read green.
    //
    // The invariant is the one the export's own error text states: a graph
    // whose nodes have no absolute identity cannot be merged with anyone
    // else's. It holds per-instance, so it is asserted per-instance.
    const repoRoot = repoRootFor(join(import.meta.dir, "../.."));
    const instances = instanceRootsIn(repoRoot);
    // An empty list is a broken probe, not a clean run — the `dh4f` shape.
    // Without this, a resolver that stopped finding instances would make every
    // assertion below vacuous and this test would pass by checking nothing.
    expect(instances.length).toBeGreaterThan(1);

    const relative_ = (d: string): string => d.slice(repoRoot.length + 1) || ".";
    const notAbsolute = instances
      .map((instanceRoot) => ({ at: relative_(instanceRoot), iri: exportIdentity({ instanceRoot }).docIri }))
      .filter((r) => !r.iri.startsWith("http"));
    expect(notAbsolute).toEqual([]);
  });

  test("an instance OUTSIDE this repository gets no base — the boundary, not a prefix", () => {
    // The defect the first version of this fallback shipped (#718, mine). It
    // inherited the host's `canonicalUrl` for ANY instance declaring none,
    // with no condition, so exporting a directory in /tmp minted
    // `<this site>/outside.jsonld` — a URL that will never resolve, claiming a
    // document this repository does not publish, and reported as no problem.
    //
    // `bootstrap` inherits because this repository PUBLISHES it. A path in
    // /tmp is not published here, so the honest answer is the third state.
    // That distinction is the whole of `publicationBase`; #725 wrote it, then
    // dropped it on merge because my fallback had already hidden the symptom.
    const outside = mkdtempSync(join(tmpdir(), "kg-export-outside-"));
    try {
      writeFileSync(join(outside, "outside.json"), JSON.stringify({ name: "outside", graphKinds: [] }));
      const id = exportIdentity({ instanceRoot: outside });
      expect(id.publishedHere).toBe(false);
      // Document-relative, NOT a fabricated absolute one.
      expect(id.docIri.startsWith("http")).toBe(false);
      expect(id.base).toBe("");
    } finally {
      rmSync(outside, { recursive: true, force: true });
    }
  });

  test("a sibling directory whose name merely EXTENDS the repo root is outside it", () => {
    // `startsWith(repoRoot)` calls `/repo-other` a child of `/repo`. It is the
    // obvious way to write the boundary and it is wrong, so the test plants
    // exactly that string rather than trusting the implementation reads
    // carefully. No file is created: `exportIdentity` answers this from the
    // path alone, which is the point — the comparison must not depend on what
    // happens to exist.
    const repoRoot = repoRootFor(join(import.meta.dir, "../.."));
    const sibling = `${repoRoot}-other`;
    expect(exportIdentity({ instanceRoot: sibling }).publishedHere).toBe(false);
  });

  test("an instance INSIDE the repository still inherits — the fallback is narrowed, not removed", () => {
    // The other side of the boundary, and the case `40fl` exists for. Asserted
    // here as well as through `buildExport` below, because a narrowing is
    // exactly the change that silently takes the good case with it.
    const boot = join(repoRootFor(join(import.meta.dir, "../..")), "bootstrap");
    const id = exportIdentity({ instanceRoot: boot });
    expect(id.publishedHere).toBe(true);
    expect(id.docIri).toBe(`${BASE}/bootstrap.jsonld`);
  });

  test("a foreign instance's export reports no unread source — the publish step exits 0", async () => {
    // The companion to the above, one level up: `publishedPaths()` already
    // asserted that `bootstrap.jsonld` is a path the deploy WRITES, and
    // that assertion stayed green throughout the outage — because a path the
    // workflow names is not a step that succeeds. `problems` is what the exit
    // code is computed from, so this is the assertion that was missing.
    const boot = join(repoRootFor(join(import.meta.dir, "../..")), "bootstrap");
    const ex = await buildExport({ instanceRoot: boot });
    expect(ex.problems).toEqual([]);
    // `BASE` is THIS instance's declared canonicalUrl, which is the whole
    // point: the foreign document is published at the publishing site's base,
    // under its own stub. Spelling the URL as a literal here would pass even
    // if the fallback started reading some other instance's declaration.
    expect(ex["@id"]).toBe(`${BASE}/bootstrap.jsonld`);
  });

  test("no canonicalUrl and no base → no absolute IRI, and it says so", () => {
    // A fabricated absolute base is the README generator's composed-link
    // defect in another costume: it looks dereferenceable and resolves to
    // nothing. Absent is the honest answer, and it must be reported.
    const schema = buildDeclarationSchema({ baseUrl: "" });
    // The repo declares a canonicalUrl, so passing "" falls back to it; the
    // assertion that matters is that $id is never relative.
    expect(String(schema.$id ?? "https://x")).toMatch(/^https?:\/\//);
  });

  test("a preview says so in its type and links every node back to canonical", async () => {
    // The owner's standing rule: a downstream consumer must never have to
    // string-manipulate or infer a rule to follow a link. So the preview→
    // canonical relation is written out per node, not left derivable.
    const preview = await buildExport({ baseUrl: "https://example.invalid/fa/STAGING/demo" });
    const canonical = await buildExport();

    expect(Array.isArray(preview["@type"])).toBe(true);
    expect(preview["@type"]).toContain(termIri("PreviewGraph"));
    expect(preview.canonicalDocument).toBe(canonical["@id"]);

    // Canonical must carry neither marker — otherwise "is this the real one?"
    // is unanswerable from the document.
    expect(canonical["@type"]).toBe("http://www.w3.org/ns/prov#Entity");
    expect(canonical.canonicalDocument).toBeUndefined();
    expect(canonical["@graph"].filter((n) => n.alternateOf !== undefined)).toEqual([]);

    // Every alternateOf must land on a node that actually exists canonically.
    const canonicalIds = new Set(canonical["@graph"].map((n) => n["@id"] as string));
    const alts = preview["@graph"]
      .map((n) => n.alternateOf as string | undefined)
      .filter((x): x is string => x !== undefined);
    expect(alts.length).toBeGreaterThan(900);
    expect(alts.filter((a) => !canonicalIds.has(a))).toEqual([]);
  });

  test("vocabulary nodes get no alternateOf — they are identical in both graphs", () => {
    // A blanket loop gave GraphKind nodes an alternateOf pointing at a
    // canonical fragment that does not exist: they are minted under the
    // NAMESPACE, not the document, so they are byte-identical in a preview and
    // in the canonical graph. Marking them as alternates of themselves-by-
    // another-name was a broken link, and a generated one is still a broken one.
    const kinds = typed("GraphKind");
    expect(kinds.length).toBeGreaterThan(0);
    for (const k of kinds) expect(inFolioNs(String(k["@id"]))).toBe(true);
  });
});

describe("source provenance — what the graph was generated FROM", () => {
  // `generatedAt` says WHEN the export ran, which does not identify what it
  // ran over: two graphs differing in content are indistinguishable from two
  // runs of the same content, and a consumer holding a published .jsonld has
  // no way back to the tree that produced it.

  test("the commit SHA is carried, unabbreviated", async () => {
    const d = await buildExport();
    expect(d.sourceCommitSha).toMatch(/^[0-9a-f]{40}$/);
  });

  test("it is the commit this checkout is actually on", async () => {
    const head = spawnSync("git", ["rev-parse", "HEAD"], {
      cwd: resolve(import.meta.dir, "../.."),
      encoding: "utf-8",
    }).stdout.trim();
    const d = await buildExport();
    expect(d.sourceCommitSha).toBe(head);
  });

  test("the commit is a dereferenceable IRI, typed prov:wasDerivedFrom", async () => {
    const d = await buildExport();
    expect(d.sourceCommit).toContain(d.sourceCommitSha);
    expect(d.sourceCommit).toMatch(/^https:\/\/(github|gitlab)\.com\/.+\/commit\//);
    const ctx = d["@context"] as Record<string, { "@id"?: string; "@type"?: string }>;
    expect(ctx.sourceCommit?.["@id"]).toMatch(/wasDerivedFrom$/);
    expect(ctx.sourceCommit?.["@type"]).toBe("@id");
  });

  test("the commit's own time is distinct from the export's", async () => {
    const d = await buildExport();
    expect(d.sourceCommitAt).toBeDefined();
    expect(d.sourceCommitAt).not.toBe(d.generatedAt);
  });

  test("a dirty tree is a typed flag, NOT a `problems` entry", async () => {
    // A SHA reported from a tree with uncommitted changes names a commit that
    // does not contain what was exported, so the flag rides beside the SHA
    // rather than suppressing it. It stays out of `problems`, whose contract
    // is "sources that could not be read": a dirty checkout is the normal
    // state of a developer's machine, and putting it there would make
    // `problems: []` fail on every local run and train the reader to ignore
    // the field that reports real failures.
    const d = await buildExport();
    expect(typeof d.sourceTreeDirty).toBe("boolean");
    expect(d.problems.some((p) => /uncommitted|dirty/i.test(p))).toBe(false);
  });

  test("an absent SHA carries its own reason, not a placeholder", async () => {
    const d = await buildExport();
    // Exactly one of the two is present — a consumer never has to infer why a
    // field is missing, and never parses a placeholder as a commit.
    expect(Boolean(d.sourceCommitSha) !== Boolean(d.sourceCommitUnavailable)).toBe(true);
  });

  test("every provenance term is declared in @context", async () => {
    // An undeclared term is dropped on expansion, so a field present in the
    // JSON would be absent from the RDF — the graph would silently lose its
    // own provenance.
    const d = await buildExport();
    const ctx = d["@context"] as Record<string, unknown>;
    for (const k of ["sourceCommit", "sourceCommitSha", "sourceCommitAt", "sourceTreeDirty"]) {
      expect(ctx[k]).toBeDefined();
    }
  });
});

describe("every self-URL the export publishes resolves to something published", () => {
  /**
   * The check that would have caught the `kg/` relocation, and did not exist
   * when it was needed.
   *
   * Moving the renderings from `<base>/kg/` to `<base>/` touched six places.
   * Five were found by searching the two exporters; the sixth was
   * `toolTypeIri` in `schemas/tool-types.ts`, which computed its FRAGMENT with
   * a function and wrote `kg/tool-types.schema.json` as a literal. Every `@id`
   * in the document moved correctly and **95 `schema` refs still pointed at a
   * URL that 404s** — the document they named sat one directory away, and
   * nothing in the suite could tell.
   *
   * That is the `dh4f` shape on a link instead of a corpus: a graph that is
   * internally consistent, externally dead, and silent about it. The defence
   * is an invariant asserted against something outside the exporter's own
   * view — here, the set of paths the publish step actually writes.
   */
  const PUB = `${BASE}/`;

  /** Every path the deploy emits, built the way the workflows build it. */
  function publishedPaths(): Set<string> {
    const stub = artefactStub(readDeclaration(join(import.meta.dir, "../.."))!);
    const out = new Set<string>([
      `${stub}.jsonld`,
      `${stub}.json`,
      `${stub}.schema.json`,
      // bootstrap's own graph, published by the same step because THIS
      // graph links into it — `pve3`'s "neither" ruling made a Tool here
      // satisfy a skill published there. Listed as a literal like everything
      // else in this set: if the deploy step goes, this line makes it a test
      // failure rather than a 404 nobody sees.
      "bootstrap.jsonld",
      "bootstrap.json",
      "tool.schema.json",
      "tool-types.schema.json",
      `${stub}/`,
      // The vocabulary, published by the same step. `ns` is extensionless
      // because the IRI is: the vocabulary document is `<base>/ns`, so every term's fragment
      // lives in the document `<base>/ns`. The `.jsonld` and `.json` are the
      // canonical-extension and correct-Content-Type aliases, exactly as for
      // the graph itself.
      // `ns/` is a directory: the union vocabulary and the content context
      // live inside it. There is deliberately no file at `ns` — see
      // `vocabularyIri()`.
      "ns/vocabulary.jsonld",
      "ns/vocabulary.json",
      "ns/content/v1.jsonld",
      // The generated stylesheets, reached because `themes-css` and
      // `avatars-css` DECLARE them through `maintains` and the export publishes
      // that relation. Jekyll copies `assets/` from the site directory, so these
      // are served wherever the site is.
      //
      // Listed as literals like everything else here on purpose: a `maintains`
      // claim asserts the artefact is published, and this set is what turns that
      // assertion into a test. Deriving it from the declarations would make the
      // check tautological — every claim would confirm itself.
      "assets/css/themes.css",
      "assets/css/avatars.css",
    ]);
    // One document per NAMESPACE. Splitting `folio:` into three made three
    // new stems, and a stem nothing serves is the defect this whole check
    // exists for — so each is published and each is listed here, where
    // deleting an entry fails rather than 404s.
    for (const dir of ["bootstrap", "cat-harness", "folio-assistant-core"]) {
      out.add(`${dir}/ns`);
      out.add(`${dir}/ns.jsonld`);
      out.add(`${dir}/ns.json`);
    }
    for (const c of buildSkillIoContracts({ baseUrl: BASE })) out.add(c.published.split("\\").join("/"));
    return out;
  }

  test("no absolute self-URL names a path the deploy does not write", async () => {
    const doc = await buildExport({ baseUrl: BASE });
    const seen = new Set<string>();
    const walk = (o: unknown) => {
      if (Array.isArray(o)) o.forEach(walk);
      else if (o && typeof o === "object") Object.values(o as Record<string, unknown>).forEach(walk);
      else if (typeof o === "string" && o.startsWith(PUB)) seen.add(o);
    };
    walk(doc);

    const published = publishedPaths();
    const dead: string[] = [];
    for (const url of seen) {
      // Strip the fragment: `…/x.schema.json#/$defs/BeanId` is a pointer INTO
      // a document, so the document is what has to exist.
      const rel = url.slice(PUB.length).split("#")[0];
      // The term namespace WAS exempted here, on the reasoning that an IRI
      // stem is not a file and "nothing serves it and nothing should try to".
      // That held while a term only had to be an IDENTIFIER. It stopped
      // holding when the terms had to be DEFINITIONS a reader can follow, and
      // the exemption is why nothing noticed: 93 terms pointing at a stem no
      // check was allowed to look at.
      //
      // `scripts/ns-export.ts` now publishes `<base>/ns`, so the walk covers
      // it like anything else. `publishedPaths()` knows it, and removing that
      // entry is now a test failure rather than a silent 404 — which is the
      // point of retiring an exemption rather than just filling the gap.
      if (!published.has(rel)) dead.push(rel);
    }
    expect([...new Set(dead)].sort()).toEqual([]);
  });

  test("nothing published still names the retired `kg/` directory", async () => {
    // Pinned as a literal, not derived: the point is that this exact string
    // stopped being a path, and a derived check would move with the mistake.
    const doc = await buildExport({ baseUrl: BASE });
    expect(JSON.stringify(doc)).not.toContain("/kg/");
  });
});

/**
 * Bean `folio-assistant-7uff`. The role REGISTRY is a source of Role nodes,
 * not just the lane names that fall out of the diagrams.
 */
describe("a Role comes from the registry as well as from a lane", () => {
  const roles = typed("Role");
  const registry = roles.filter((r) => r.sourceKind === "role-registry");

  test("both views are present and neither is empty", () => {
    // The vacuity guard first: every assertion below filters, and a filter
    // over nothing passes. Until 2026-09-19 EVERY Role node came from a
    // `bpmn-lane`, so `roles.json` — which is where a role's actor kinds,
    // its skills and its `actedUpon` flag are actually written — contributed
    // nothing to the published graph at all.
    expect(registry.length).toBeGreaterThan(20);
    expect(roles.filter((r) => r.sourceKind === "bpmn-lane").length).toBeGreaterThan(50);
  });

  test("every role the registry declares is a node", () => {
    const declared = readRoleGraph(join(import.meta.dir, "../../scenarios"))!.roles;
    expect(declared.length).toBeGreaterThan(20);
    const byName = new Set(registry.map((r) => r.name));
    expect(declared.filter((d) => !byName.has(d.id)).map((d) => d.id)).toEqual([]);
  });

  test("a role that acts on nothing still reaches the graph", () => {
    // `corpus`, `work-plan` and `log` are `actedUpon`: written to, never
    // performing. The lane-derived view could not see them, because a lane
    // was minted from the lanes FLOW NODES name and an `actedUpon` lane holds
    // no flow nodes by construction. Exactly the roles whose emptiness is the
    // point were the ones the graph dropped.
    for (const id of ["corpus", "work-plan", "log"]) {
      const node = registry.find((r) => r.name === id);
      expect(node, `${id} is missing from the graph`).toBeDefined();
      expect(node!.actedUpon).toBe(true);
    }
  });

  test("the registry view joins the lane view rather than replacing it", () => {
    // Two nodes per role, joined by `bindsLane`: one carrying what the role
    // IS, one per lane it is bound to carrying where it acts. The join is
    // only worth having if it resolves — which is what `danglingLinks`
    // checks, and what the `log` role failed until the lane set was read.
    const log = registry.find((r) => r.name === "log")!;
    expect(log.bindsLane).toHaveLength(1);
    const ids = new Set(EXPORT["@graph"].map((n) => n["@id"]));
    for (const lane of log.bindsLane as string[]) expect(ids.has(lane)).toBe(true);
    expect(log.hasSkill).toContain(
      EXPORT["@graph"].find((n) => String(n["@id"]).endsWith("#skill/activity-log"))!["@id"],
    );
  });

  test("`actedUpon` and `judgementOnly` are two flags, not one", () => {
    // Collapsing them would give a store an actor or a stakeholder a skill.
    // Asserted on real rows so the distinction is observed, not just typed.
    const stakeholder = registry.find((r) => r.name === "stakeholder")!;
    expect(stakeholder.judgementOnly).toBe(true);
    expect(stakeholder.actedUpon).toBeUndefined();
    expect(registry.find((r) => r.name === "corpus")!.judgementOnly).toBeUndefined();
  });
});

/**
 * A package's id comes from its MANIFEST, and two directories cannot merge
 * into one node in silence. Bean `r1vw`.
 *
 * ## The failure this pins, measured 2026-09-20
 *
 * The id was `dir.split("/").pop()` — the directory basename. Eleven of the
 * twelve packages hid that, because their directory is named after the
 * package. The twelfth was `bootstrap/skills/`, whose manifest declares
 * `"name": "bootstrap"` and whose node was `package/skills`, **named
 * `skills`**.
 *
 * `cat-harness/src/skills/` has the same basename, so both wanted
 * `package/skills`, and a `seen` set dropped whichever arrived second while
 * its skills went on emitting `inPackage -> package/skills`. The result was a
 * node with five members: bootstrap's skills plus `corpus-grep`, a
 * cat-harness skill from a directory with **no manifest at all**, published as
 * a member of a package it was never listed in.
 *
 * Nothing reported it, and that is the part worth a test rather than a fix.
 * Both sides resolved. No link dangled. The audit's `skill-servable` criterion
 * was SATISFIED by the collision — the skill was "served" because a package it
 * had nothing to do with happened to exist. Every signal said healthy.
 *
 * These assert the OUTCOME (the two packages are distinct and carry the right
 * members) and the MECHANISM (the id tracks the declared name). An outcome
 * test alone would go on passing if the resolver silently reverted to
 * basenames, because `bootstrap/skills` and `src/skills` are the only pair
 * in this corpus that collide — and the day somebody renames one, the outcome
 * test would pass over a corpus with nothing left to detect.
 */
describe("a package's id is declared, not derived from its path", () => {
  const packages = (): Array<Record<string, unknown>> =>
    typed("SkillPackage") as Array<Record<string, unknown>>;

  const membersOf = (pkgIri: string): string[] =>
    EXPORT["@graph"]
      .filter((n) => {
        const links = (n as { inPackage?: Array<string | { "@id": string }> }).inPackage ?? [];
        return links.some((l) => (typeof l === "string" ? l : l["@id"]) === pkgIri);
      })
      .map((n) => String(n["@id"]).split("#").pop()!);

  test("no two packages share an @id — a collision is not a merge", () => {
    const ids = packages().map((p) => String(p["@id"]));
    expect(ids.length).toBe(new Set(ids).size);
  });

  // WITNESS RETARGETED 2026-09-21, from `bootstrap` to
  // `bootstrap-render`, and the reason is worth more than the change.
  //
  // These three guarded `packageIdFor`'s rule — an id comes from the
  // manifest's `name`, never from the directory basename — by asserting it of
  // the one package in the corpus that exercised it. The owner's `pve3`
  // ruling ("neither") removed `bootstrap/skills/` from this instance's
  // declared directories, so that package is no longer in this graph and the
  // witness went with it.
  //
  // Deleting them would have deleted a live contamination guard along with
  // the witness. `bootstrap/render/` is still declared here and has the
  // same shape — basename `render`, manifest `bootstrap-render` — so the
  // RULE is still witnessed against the real corpus rather than a fixture.
  //
  // The lesson, since this is the second time a corpus witness has been lost
  // to a declaration change: a test that asserts a RULE through one named
  // example dies with that example. Where `packageIdFor` can be called
  // directly against a root, prefer that.
  test("`bootstrap-render` is named by its manifest, not by its directory", () => {
    // Its directory is `bootstrap/render/`, basename `render`. The
    // manifest says `bootstrap-render`. Exactly the case the basename rule
    // got wrong.
    const p = packages().find((x) => String(x["@id"]).endsWith("#package/bootstrap-render"));
    expect(p, `packages present: ${packages().map((x) => x["name"]).join(", ")}`).toBeDefined();
    expect(p!["name"]).toBe("bootstrap-render");
    expect(String(p!["path"])).toContain("bootstrap/render");
    // And the basename is NOT what it is called — the assertion the rule is
    // actually about, which naming the package alone does not make.
    expect(p!["name"]).not.toBe("render");
  });

  test("its members are that package's own skills and nothing else", () => {
    // Listed rather than counted, because what the collision produced was a
    // member from ANOTHER package — a count would have gone on passing while
    // one name was swapped for another.
    const p = packages().find((x) => String(x["@id"]).endsWith("#package/bootstrap-render"))!;
    expect(membersOf(String(p["@id"])).sort()).toEqual([
      "skill/bootstrap-graph-emission",
      "skill/bootstrap-graph-publication",
    ]);
  });

  test("`corpus-grep` is NOT among them — the contamination the merge caused", () => {
    // The sharpest assertion here, because it is the one that was false and
    // that every other signal called healthy. `corpus-grep` lived in
    // `src/skills/`, which declared no package at all; since #760 it lives in
    // `skills/folio-core/` and is listed in that package's manifest. Either
    // way it is not bootstrap's, which is what this pins.
    const p = packages().find((x) => String(x["@id"]).endsWith("#package/bootstrap-render"))!;
    expect(membersOf(String(p["@id"]))).not.toContain("skill/corpus-grep");
  });

  test("a directory with NO manifest falls back to its basename, and says so", () => {
    // The fallback is not a hedge: a directory carrying no manifest has no
    // declared name and nothing else to be called. What the mechanism buys is
    // that a name is only INFERRED where none was declared — and
    // `hasManifest: false` is what lets a reader tell the two apart.
    //
    // The subject was `src/skills` until #760 folded it into
    // `skills/folio-core/`. Asserted over WHATEVER carries no manifest rather
    // than over a named path, because pinning the path is what made this test
    // go red on a move that changed none of the behaviour it tests.
    //
    // An empty set is REPORTED, not silently passed: if nothing in the corpus
    // lacks a manifest then this rule is unexercised, and "no subject" reads
    // identically to "the rule holds" unless something says otherwise.
    const inferred = packages().filter((x) => x["hasManifest"] === false);
    if (inferred.length === 0) {
      console.log(
        "  NOTE: every package in this corpus declares a manifest — the " +
          "basename fallback is unexercised here, not proven.",
      );
      return;
    }
    for (const p of inferred) {
      const base = String(p["path"]).split("/").filter(Boolean).pop();
      expect(p["name"], `package at ${String(p["path"])}`).toBe(base);
    }
  });

  test("every package with a manifest is named what that manifest says", () => {
    // The mechanism, over the whole corpus rather than the one case above.
    // Without this the resolver could revert to basenames and only
    // bootstrap would notice.
    for (const p of packages()) {
      if (p["hasManifest"] !== true) continue;
      const id = String(p["@id"]).split("#package/")[1];
      expect(id, `package at ${String(p["path"])}`).toBe(String(p["name"]));
    }
  });
});

describe("exporting ANOTHER instance's graph", () => {
  // `gn4l` separated the generic collectors from the instance-bound ones in
  // 2026-09-19 and proved `collectInstanceNodes` against bootstrap. What
  // it did not do is let a DOCUMENT be built for another instance, and the
  // owner's `pve3` ruling ("neither") made that necessary: this graph now
  // links into bootstrap's, so bootstrap's has to exist.
  const BOOT = join(import.meta.dir, "../../../bootstrap");
  const BASE = "https://example.invalid/fa";

  test("it takes the OTHER instance's identity", async () => {
    const { buildExport } = await import("../kg-export.js");
    const e = await buildExport({ baseUrl: BASE, instanceRoot: BOOT });
    expect(e["@id"]).toBe(`${BASE}/bootstrap.jsonld`);
  });

  test("and the other instance's CONTENT — not this one's under that name", async () => {
    // THE SHARPEST ASSERTION HERE. `exportIdentity` and the collectors are
    // separately parameterised, so honouring `instanceRoot` for the identity
    // while leaving the collector list alone produces a document that is
    // wrong about whose it is, under a name a consumer trusts.
    //
    // Measured by removing the branch: bootstrap's document came back
    // with 2079 nodes — this instance's 222 skills and 55 processes — instead
    // of 85. A size comparison is the check, because every other signal
    // (`@id`, stub, published path) was correct in that run.
    const { buildExport } = await import("../kg-export.js");
    const mine = await buildExport({ baseUrl: BASE });
    const theirs = await buildExport({ baseUrl: BASE, instanceRoot: BOOT });
    const n = (e: { "@graph": unknown[] }) => e["@graph"].length;
    expect(n(theirs)).toBeGreaterThan(0);
    expect(n(theirs)).toBeLessThan(n(mine) / 4);
    // And named, not merely smaller: a skill bootstrap has and this
    // instance does not.
    const ids = new Set((theirs["@graph"] as Array<{ "@id": string }>).map((x) => x["@id"]));
    expect(ids.has(`${BASE}/bootstrap.jsonld#skill/discussion`)).toBe(true);
  });

  test("it emits no link to a collector it did not run", async () => {
    // `collectSkills` puts `inPackage` on every skill; `collectPackages` is
    // instance-bound and omitted. Left alone that was SEVEN dangling links in
    // bootstrap's export, every skill pointing at a package node the
    // document cannot contain.
    const { buildExport } = await import("../kg-export.js");
    const e = await buildExport({ baseUrl: BASE, instanceRoot: BOOT });
    expect(e.danglingLinks).toEqual([]);
    expect((e["@graph"] as Array<Record<string, unknown>>).some((n) => "inPackage" in n)).toBe(false);
  });

  test("a Tool satisfying a sibling's skill links into the SIBLING's document", async () => {
    // The edge `pve3` created: the skills live in bootstrap so an
    // Initiator can read them with nothing installed, the Tool nodes live here
    // because a Tool is cat-harness's vocabulary (`gn4l`).
    const { buildExport } = await import("../kg-export.js");
    const e = await buildExport({ baseUrl: BASE });
    // The document's OWN `@id`, never a spelled-out stub. Main renamed this
    // instance's stub from `folio-assistant` to `cat-harness` while this
    // branch was open and the hardcoded literal took two tests down with it —
    // the same failure this file's package-witness comment warns about, made
    // in the act of fixing it.
    const tool = (e["@graph"] as Array<Record<string, unknown>>).find(
      (n) => n["@id"] === `${e["@id"]}#tool/discuss`,
    )!;
    expect(tool.satisfies).toEqual([`${BASE}/bootstrap.jsonld#skill/discussion`]);
  });

  test("a skill THIS instance also declares stays here", async () => {
    // Own-first, and it is not academic: `agent-skills` and `kg-navigation`
    // declare ids this instance also declares, and without the own-first
    // check their documents appeared as link targets the deploy never writes.
    const { buildExport } = await import("../kg-export.js");
    const e = await buildExport({ baseUrl: BASE });
    const own = String(e["@id"]);
    for (const n of e["@graph"] as Array<Record<string, unknown>>) {
      for (const s of (n.satisfies ?? []) as string[]) {
        if (s.startsWith(`${own}#`)) continue;
        // The only legitimate foreign home in this corpus.
        expect(s.startsWith(`${BASE}/bootstrap.jsonld#`)).toBe(true);
      }
    }
  });
});
