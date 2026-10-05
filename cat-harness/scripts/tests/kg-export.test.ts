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
import { EXTERNAL_SCHEMA_TAG } from "../../schemas/external-schema.ts";
import { basename, isAbsolute, join, relative, resolve } from "node:path";
import { builtDocsRoute } from "../docs-route.ts";
import { workflowFiles } from "../known-skills.ts";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

import { buildExport, exportIdentity, publishedDocument, publishedIdentity, undeclaredRootTerms } from "../kg-export.js";
import { PUBLISHED_ELSEWHERE, declaresOwnCanonical, instanceExportPlan } from "../instance-exports.js";
import { buildDeclarationSchema, buildSkillIoContracts } from "../harness-schema-export.js";
import { artefactStub, findDeclarationFile, instanceRootsIn, readDeclaration, repoRootFor, siteDirFor } from "../../schemas/cat-harness.js";
import { NS_PREFIXES, termIri } from "../../schemas/namespaces.js";
import { inAggregate } from "../../test/support/checkout.js";

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
const REPO = repoRootFor(join(import.meta.dir, "../.."));
const EXPORT = await buildExport();

/**
 * The three OTHER export configurations this file asserts over, each built once.
 *
 * Bean `sff8`. These were eight `await buildExport(...)` calls inside test bodies,
 * and measured 2026-09-27 six of those tests cost **2.0–2.6 s each** quietly —
 * 42–53 % of bun's 5000 ms default budget with the machine idle. Two of them timed
 * out in a loaded full-suite run (5009 ms and 6215 ms); which two was luck, since
 * all six sit at roughly half the budget. `EXPORT` above was already hoisted for
 * this reason, so this only finishes the job.
 *
 * Module scope belongs to NO test's timeout, which is why this is the remedy and a
 * raised timeout is not (`sff8` `## What a fix is NOT`: a bigger number decays as
 * the corpus grows).
 *
 * **The names are explicit because the old call sites were NOT interchangeable,
 * and looked it.** `BASE` above is the repo's real `canonicalUrl` — and the
 * `exporting ANOTHER instance's graph` block USED TO declare its own `BASE` of
 * `https://example.invalid/fa`, shadowing it. So the identical text
 * `buildExport({ baseUrl: BASE })` meant two different things depending on which
 * block it sat in: a canonical export in one and a preview in the other, which the
 * self-identification test distinguishes by `@type` and its 968 `alternateOf`
 * links. Collapsing those eight calls by counting matching call TEXT would have
 * swapped one for the other silently — the same trap as "a matching failure count
 * is not a matching failure set".
 *
 * The shadowing is now GONE rather than documented: that block reads `ALT_BASE`,
 * so there is one declaration of each base and the hazard cannot recur. This
 * paragraph is kept because the reason the three constants are named separately is
 * not visible from the names alone.
 */
const ALT_BASE = "https://example.invalid/fa";
const BOOT_ROOT = join(import.meta.dir, "../../../bootstrap");
/** Canonical base, explicit — distinct from `EXPORT`, which passes no `baseUrl`. */
const EXPORT_CANONICAL = await buildExport({ baseUrl: BASE });
/** The preview base, this instance's content. */
const EXPORT_ALT = await buildExport({ baseUrl: ALT_BASE });
/** The preview base, BOOTSTRAP's content — the pair the size comparison needs. */
const EXPORT_ALT_BOOT = await buildExport({ baseUrl: ALT_BASE, instanceRoot: BOOT_ROOT });
/**
 * A STAGING-shaped preview export, built once.
 *
 * Bean `sff8`, finishing what bean `w82m` started in the test below: that session
 * hoisted the CANONICAL half out of the body (its comment there records the test at
 * ~5.2 s, over budget) and left this one in. Measured 2026-09-27 the test was still
 * **4.43 s of a 5000 ms default budget** (89 %) — over budget again as soon as the
 * machine is busy, for the same reason, one build later.
 *
 * The base must stay STAGING-shaped: the assertion is that a preview SAYS it is one
 * in its `@type` and links every node back to canonical, so a canonical base here
 * would make it pass while testing nothing.
 */
const EXPORT_PREVIEW = await buildExport({ baseUrl: "https://example.invalid/fa/STAGING/demo" });
/**
 * The CHECKOUT-scope graph — every instance stacked on this one, under this
 * document's name. Not published since bean `4ak5` item 2 (owner ruling
 * 2026-10-05, option B): it is what the tombstones are measured against, and
 * the only graph still holding a package whose manifest name differs from its
 * directory, which the package-id witness below needs.
 */
const EXPORT_CHECKOUT = await buildExport({ baseUrl: BASE, scope: "checkout" });
/** A tombstone: no `@type`, `deprecated`, and where the node went (bean `4ak5`). */
const isTombstone = (n: Record<string, unknown>): boolean => n.deprecated === true;
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
    // link data — `implementsSkillNames`, `satisfiesSkillNames`, `graphTypologies`,
    // `packagePaths`, `laneName` — and the right treatment of a redundant copy
    // is removal, not a predicate IRI for a second answer that can go stale.
    // Each was removed only after its link form was shown to resolve for every
    // node; this pins that they do not come back.
    const retired = ["implementsSkillNames", "satisfiesSkillNames", "graphTypologies", "packagePaths", "laneName"];
    const seen = new Set(EXPORT["@graph"].flatMap((n) => Object.keys(n)));
    expect(retired.filter((k) => seen.has(k))).toEqual([]);
    // And the facts they carried are still reachable, by link: a ProcessNode's
    // performer is a Role node with a name, and its skills are Skill nodes.
    // A Role's name is its `prefLabel` and its id its `notation` since bean
    // `lodp` (D3), so the id is no longer written as `name`.
    const byId = new Map(EXPORT["@graph"].map((n) => [n["@id"] as string, n]));
    const withLane = typed("ProcessNode").filter((n) => n.performedBy !== undefined);
    expect(withLane.length).toBeGreaterThan(100);
    for (const n of withLane) expect(byId.get(n.performedBy as string)?.notation).toBeTruthy();
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
    // GraphTypology node, not on a term that only exists in TypeScript.
    const kinds = typed("GraphTypology");
    expect(kinds.length).toBeGreaterThanOrEqual(5);
    expect(kinds.some((k) => k.name === "folio" && k.renderable === true)).toBe(true);
    const ids = new Set(EXPORT["@graph"].map((n) => n["@id"]));
    // `holdsGraph` is a LIST: `graph` became `graphs[]` upstream because a
    // directory may hold more than one graph — `schemas/` holds both its own
    // and `kg`. Every entry must still land on a GraphTypology node.
    // `Subgraph` — bootstrap's word — since 2026-09-30; it was `Directory`,
    // and a loop over a type nothing carries any more passes over nothing.
    const dirs = typed("Subgraph");
    expect(dirs.length).toBeGreaterThan(0);
    for (const dir of dirs) {
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
      // A tombstone has no type by the owner's ruling — it is no longer
      // anything here; its own shape is asserted in the tombstone block.
      if (isTombstone(n)) continue;
      expect(inFolioNs(String(n["@type"]))).toBe(true);
    }
    expect(ids.length).toBe(new Set(ids).size);
  });

  test("counts agree with the graph they summarise", () => {
    // The counts block exists so a consumer can spot a truncated file. If it
    // can disagree with `@graph`, it is worse than absent.
    const recomputed: Record<string, number> = {};
    for (const n of EXPORT["@graph"]) {
      if (isTombstone(n)) continue; // not a node of any type here — see `tombstonesFor`
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
      writeFileSync(join(outside, "outside.json"), JSON.stringify({ name: "outside", graphTypologies: [] }));
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
    // `<stub>/<stub>.jsonld` since `dyd3`: the owner's URL-space rule puts a
    // foreign instance under its own segment, and the site-root path this
    // used to assert is the one that had two `@id`s for one graph.
    expect(id.docIri).toBe(`${BASE}/bootstrap/bootstrap.jsonld`);
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
    expect(ex["@id"]).toBe(`${BASE}/bootstrap/bootstrap.jsonld`);
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

  test("a preview says so in its type and links every node back to canonical", () => {
    // The owner's standing rule: a downstream consumer must never have to
    // string-manipulate or infer a rule to follow a link. So the preview→
    // canonical relation is written out per node, not left derivable.
    const preview = EXPORT_PREVIEW;
    // The shared fixture IS the canonical export; building it again here put
    // this test at ~5.2 s alone, over bun's timeout (bean `w82m`).
    const canonical = EXPORT;

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
    // A blanket loop gave GraphTypology nodes an alternateOf pointing at a
    // canonical fragment that does not exist: they are minted under the
    // NAMESPACE, not the document, so they are byte-identical in a preview and
    // in the canonical graph. Marking them as alternates of themselves-by-
    // another-name was a broken link, and a generated one is still a broken one.
    const kinds = typed("GraphTypology");
    expect(kinds.length).toBeGreaterThan(0);
    for (const k of kinds) expect(inFolioNs(String(k["@id"]))).toBe(true);
  });
});

describe("source provenance — what the graph was generated FROM", () => {
  // Read off the shared canonical export: each of these once rebuilt it, and
  // one rebuild costs about bun's 5 s per-test timeout on a session container
  // (bean `w82m`). Provenance is fixed per checkout, so one build answers all.
  // `generatedAt` says WHEN the export ran, which does not identify what it
  // ran over: two graphs differing in content are indistinguishable from two
  // runs of the same content, and a consumer holding a published .jsonld has
  // no way back to the tree that produced it.

  test("the commit SHA is carried, unabbreviated", () => {
    const d = EXPORT;
    expect(d.sourceCommitSha).toMatch(/^[0-9a-f]{40}$/);
  });

  test("it is the commit this checkout is actually on", () => {
    const head = spawnSync("git", ["rev-parse", "HEAD"], {
      cwd: resolve(import.meta.dir, "../.."),
      encoding: "utf-8",
    }).stdout.trim();
    const d = EXPORT;
    expect(d.sourceCommitSha).toBe(head);
  });

  test("the commit is a dereferenceable IRI, typed prov:wasDerivedFrom", () => {
    const d = EXPORT;
    expect(d.sourceCommit).toContain(d.sourceCommitSha);
    expect(d.sourceCommit).toMatch(/^https:\/\/(github|gitlab)\.com\/.+\/commit\//);
    const ctx = d["@context"] as Record<string, { "@id"?: string; "@type"?: string }>;
    expect(ctx.sourceCommit?.["@id"]).toMatch(/wasDerivedFrom$/);
    expect(ctx.sourceCommit?.["@type"]).toBe("@id");
  });

  test("the commit's own time is distinct from the export's", () => {
    const d = EXPORT;
    expect(d.sourceCommitAt).toBeDefined();
    expect(d.sourceCommitAt).not.toBe(d.generatedAt);
  });

  test("a dirty tree is a typed flag, NOT a `problems` entry", () => {
    // A SHA reported from a tree with uncommitted changes names a commit that
    // does not contain what was exported, so the flag rides beside the SHA
    // rather than suppressing it. It stays out of `problems`, whose contract
    // is "sources that could not be read": a dirty checkout is the normal
    // state of a developer's machine, and putting it there would make
    // `problems: []` fail on every local run and train the reader to ignore
    // the field that reports real failures.
    const d = EXPORT;
    expect(typeof d.sourceTreeDirty).toBe("boolean");
    expect(d.problems.some((p) => /uncommitted|dirty/i.test(p))).toBe(false);
  });

  test("an absent SHA carries its own reason, not a placeholder", () => {
    const d = EXPORT;
    // Exactly one of the two is present — a consumer never has to infer why a
    // field is missing, and never parses a placeholder as a commit.
    expect(Boolean(d.sourceCommitSha) !== Boolean(d.sourceCommitUnavailable)).toBe(true);
  });

  test("every provenance term is declared in @context", () => {
    // An undeclared term is dropped on expansion, so a field present in the
    // JSON would be absent from the RDF — the graph would silently lose its
    // own provenance.
    const d = EXPORT;
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
      // `dyd3`: bootstrap's graph moved from the site root to its own segment,
      // and `gen-bootstrap-graph.ts`'s publish step was retired with it. One
      // document, one `@id`, at the path the owner's URL-space rule names —
      // it was published at BOTH until then, 88 subjects under two identities.
      "bootstrap/bootstrap.jsonld",
      "bootstrap/bootstrap.json",
      "tool.schema.json",
      "tool-types.schema.json",
      `${stub}/`,
      // The vocabulary, published by the same step. `ns` is extensionless
      // because the IRI is: the vocabulary document is `<base>/ns`, so every term's fragment
      // lives in the document `<base>/ns`. The `.jsonld` and `.json` are the
      // canonical-extension and correct-Content-Type aliases, exactly as for
      // the graph itself.
      // `ns/` is a directory holding the content context. There is
      // deliberately no file at `ns`, and no all-layers union inside it any
      // more (retired 2026-09-30) — each layer's vocabulary is `<stub>/ns`.
      "ns/content/v1.jsonld",
      // The generated stylesheets, reached because `themes-css` and
      // `avatars-css` DECLARE them through `maintains` and the export publishes
      // that relation. Jekyll copies `assets/` from the site directory, so these
      // are served wherever the DOCS tree is — under `docs/cat-harness/` since
      // 2026-10-05 (issue #2188).
      //
      // Listed as literals like everything else here on purpose: a `maintains`
      // claim asserts the artefact is published, and this set is what turns that
      // assertion into a test. Deriving it from the declarations would make the
      // check tautological — every claim would confirm itself.
      "docs/cat-harness/assets/css/themes.css",
      "docs/cat-harness/assets/css/avatars.css",
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
    // Each instance's OWN document (bean `4ak5` items 1 and 2): the root
    // instance's line, then every instance in `instance-exports.ts`'s plan —
    // the deploy's own list, read rather than restated, since a second list
    // here would be the "what is declared" answer that went stale before.
    // A tombstone and a re-homed skill link land in these.
    const rootStub = artefactStub(readDeclaration(repoRootFor(join(import.meta.dir, "../..")))!);
    for (const s of [rootStub, ...instanceExportPlan().map((p) => p.stub)]) {
      out.add(`${s}/${s}.jsonld`);
      out.add(`${s}/${s}.json`);
    }
    for (const c of buildSkillIoContracts({ baseUrl: BASE })) out.add(c.published.split("\\").join("/"));
    // A Process's `depiction` (bean `ax6r`): the SVGs `render:bpmn` commits
    // into the site's `assets/`, which Jekyll serves as they sit. Read from the
    // DIRECTORY, not from the nodes — a depiction naming a file that is not
    // there must fail here, not confirm itself.
    const svgDir = join(import.meta.dir, "../..", siteDirFor(join(import.meta.dir, "../..")), "assets", "img", "workflows");
    // Under the docs route, where the docs tree is published (issue #2188).
    const docsRoute = builtDocsRoute(basename(join(import.meta.dir, "../..")), join(import.meta.dir, "../../.."));
    for (const f of readdirSync(svgDir)) if (f.endsWith(".svg")) out.add(`${docsRoute}/assets/img/workflows/${f}`);
    return out;
  }

  // Reads other instances' exports, so it runs only where those instances
  // exist; skipped visibly when cat-harness stands alone (bean `ho66`).
  test.skipIf(!inAggregate())("no absolute self-URL names a path the deploy does not write", async () => {
    const doc = EXPORT_CANONICAL;
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
    //
    // The retired thing is the PUBLISHED `<base>/kg/` — the old viewer URL the
    // `udx8` tile pointed at — so the literal is that URL's form. It was the
    // bare substring "/kg/" until bean `9umr` gave the skills directory a `kg`
    // TOPIC (`skills/kg/kg-core/`), a real path the bare substring would forbid.
    const doc = EXPORT_CANONICAL;
    expect(JSON.stringify(doc)).not.toContain("github.io/folio-assistant/kg/");
    expect(JSON.stringify(doc)).not.toContain('"/kg/');
  });
});

/**
 * Bean `folio-assistant-7uff`. The role REGISTRY is a source of Role nodes,
 * not just the lane names that fall out of the diagrams.
 */
describe("a Role comes from the registry; a lane is a Lane that binds one", () => {
  const roles = typed("Role");
  const registry = roles.filter((r) => r.sourceKind === "role-registry");
  const lanes = typed("Lane");

  test("both are present, and every Role is a registry role", () => {
    // The vacuity guard first: every assertion below filters, and a filter
    // over nothing passes. Until 2026-09-19 EVERY Role node came from a
    // `bpmn-lane`; until #1168 B9b lanes were still minted as Roles keyed by
    // their NAME, so one role had two nodes. Now a Role is only ever the
    // registry's, and a lane is its own node.
    expect(registry.length).toBeGreaterThan(20);
    expect(lanes.length).toBeGreaterThan(50);
    expect(roles.filter((r) => r.sourceKind !== "role-registry").map((r) => r["@id"])).toEqual([]);
  });

  test("every lane is part of its process and binds a registry role", () => {
    const registryIds = new Set(registry.map((r) => r["@id"]));
    const processes = new Set(typed("Process").map((p) => p["@id"]));
    for (const l of lanes) expect(processes.has(l.partOf as string)).toBe(true);
    const unbound = lanes.filter((l) => !registryIds.has(l.bindsRole as string)).map((l) => l["@id"]);
    expect(unbound).toEqual([]);
  });

  test("an activity is performed by a registry role, in a lane", () => {
    const registryIds = new Set(registry.map((r) => r["@id"]));
    const laneIds = new Set(lanes.map((l) => l["@id"]));
    const acting = typed("ProcessNode").filter((n) => n.performedBy !== undefined);
    expect(acting.length).toBeGreaterThan(100);
    expect(acting.filter((n) => !registryIds.has(n.performedBy as string)).map((n) => n["@id"])).toEqual([]);
    expect(acting.filter((n) => !laneIds.has(n.inLane as string)).map((n) => n["@id"])).toEqual([]);
  });

  test("every role the registry declares is a node", () => {
    const declared = readRoleGraph(join(import.meta.dir, "../../scenarios"))!.roles;
    expect(declared.length).toBeGreaterThan(20);
    const byName = new Set(registry.map((r) => r.notation));
    expect(declared.filter((d) => !byName.has(d.id)).map((d) => d.id)).toEqual([]);
  });

  test("a role that acts on nothing still reaches the graph", () => {
    // `corpus`, `work-plan` and `log` are `actedUpon`: written to, never
    // performing. The lane-derived view could not see them, because a lane
    // was minted from the lanes FLOW NODES name and an `actedUpon` lane holds
    // no flow nodes by construction. Exactly the roles whose emptiness is the
    // point were the ones the graph dropped.
    for (const id of ["corpus", "work-plan", "log"]) {
      const node = registry.find((r) => r.notation === id);
      expect(node, `${id} is missing from the graph`).toBeDefined();
      expect(node!.actedUpon).toBe(true);
    }
  });

  test("the registry view joins the lane view rather than replacing it", () => {
    // Two kinds of node, joined by `bindsRole` ON THE LANE: the Role carries
    // what the role IS, each Lane where it acts. The lane holds the pointer,
    // not the role (#1168). The join is only worth having if it resolves,
    // which is what the `log` lane failed until the lane set was read.
    const log = registry.find((r) => r.notation === "log")!;
    const binding = EXPORT["@graph"].filter((n) => n.bindsRole === log["@id"]);
    expect(binding.length).toBeGreaterThanOrEqual(1);
    expect(log.bindsLane).toBeUndefined();
    expect(log.hasSkill).toContain(
      EXPORT["@graph"].find((n) => String(n["@id"]).endsWith("#skill/activity-log"))!["@id"],
    );
  });

  test("`actedUpon` and `judgementOnly` are two flags, not one", () => {
    // Collapsing them would give a store an actor or a stakeholder a skill.
    // Asserted on real rows so the distinction is observed, not just typed.
    const stakeholder = registry.find((r) => r.notation === "stakeholder")!;
    expect(stakeholder.judgementOnly).toBe(true);
    expect(stakeholder.actedUpon).toBeUndefined();
    expect(registry.find((r) => r.notation === "corpus")!.judgementOnly).toBeUndefined();
  });
});

/**
 * Bean `lodp`, finding D3 of `docs/proposals/vocabulary-mappings-2026-10-02.md`.
 * kg-export and glossary-export both mint a role as `makeIri(doc, "role", id)`,
 * and named it two ways: `rdfs:label` = the id beside `dcterms:title`, and
 * `skos:prefLabel` beside `skos:notation` = the id. Merged, one node carried
 * `rdfs:label "reviewer"` and `skos:prefLabel "Reviewer / SME"`, and
 * `skos:prefLabel` is a sub-property of `rdfs:label`. Owner default applied
 * (option 1, 2026-10-02): one table row, `role-naming`, names it in both.
 *
 * Asserted on the MERGED, EXPANDED graph rather than on either document's
 * JSON keys, because the defect only exists where the two meet, and a key is
 * only a predicate once its document's context has said which.
 */
const D3 = await (async () => {
  const jsonld = (await import("jsonld")).default;
  const { buildGlossary } = await import("../glossary-export.ts");
  const SKOS = "http://www.w3.org/2004/02/skos/core#";
  const LABEL = "http://www.w3.org/2000/01/rdf-schema#label";
  const TITLE = "http://purl.org/dc/terms/title";
  const roleIri = (id: string) => id.includes("#role/");
  const glossary = buildGlossary({ today: () => "2026-10-02" }).doc;
  const kgRoles = EXPORT["@graph"].filter((n) => roleIri(String(n["@id"])));
  const glossaryRoles = (glossary["@graph"] as Array<Record<string, unknown>>).filter((n) => roleIri(String(n["@id"])));
  const expanded = [
    ...(await jsonld.expand({ "@context": EXPORT["@context"], "@graph": kgRoles } as never)),
    ...(await jsonld.expand({ "@context": glossary["@context"], "@graph": glossaryRoles } as never)),
  ] as Array<Record<string, Array<{ "@value"?: unknown }> | string>>;
  const merged = new Map<string, Map<string, Set<unknown>>>();
  for (const n of expanded) {
    const props = merged.get(n["@id"] as string) ?? new Map<string, Set<unknown>>();
    merged.set(n["@id"] as string, props);
    for (const [p, vs] of Object.entries(n)) {
      if (p.startsWith("@")) continue;
      const set = props.get(p) ?? new Set<unknown>();
      for (const v of vs as Array<{ "@value"?: unknown; "@id"?: string }>) set.add(v["@value"] ?? v["@id"]);
      props.set(p, set);
    }
  }
  const shared = [...merged.keys()].filter(
    (iri) => kgRoles.some((n) => n["@id"] === iri) && glossaryRoles.some((n) => n["@id"] === iri),
  );

  return { merged, shared, LABEL, TITLE, SKOS };
})();

describe("a role node merged from kg-export and glossary-export has one name", () => {
  const { merged, shared, LABEL, TITLE, SKOS } = D3;
  test("the two exports do meet on role IRIs", () => {
    // The vacuity guard: every assertion below is over `shared`, and a check
    // over two graphs that never meet would pass by meeting nothing.
    expect(shared.length).toBeGreaterThan(20);
  });

  test("no merged role node carries two different labels", () => {
    const conflicts: string[] = [];
    for (const iri of shared) {
      const props = merged.get(iri)!;
      // Every label-like value on the node: rdfs:label and its SKOS
      // sub-properties' preferred form, plus the Dublin Core title.
      const names = new Set([...(props.get(LABEL) ?? []), ...(props.get(`${SKOS}prefLabel`) ?? []), ...(props.get(TITLE) ?? [])]);
      if (names.size !== 1) conflicts.push(`${iri}: ${[...names].map((v) => JSON.stringify(v)).join(" vs ")}`);
    }
    expect(conflicts).toEqual([]);
  });

  test("the id is a notation and never a label, in either export", () => {
    for (const iri of shared) {
      const props = merged.get(iri)!;
      expect([iri, props.has(LABEL)]).toEqual([iri, false]);
      expect([iri, [...(props.get(`${SKOS}notation`) ?? [])]]).toEqual([iri, [iri.slice(iri.lastIndexOf("/") + 1)]]);
    }
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

  // Over the CHECKOUT graph, where the witness below lives (bean `4ak5`).
  const membersOf = (pkgIri: string): string[] =>
    EXPORT_CHECKOUT["@graph"]
      .filter((n) => {
        const links = (n as { inPackage?: Array<string | { "@id": string }> }).inPackage ?? [];
        return links.some((l) => (typeof l === "string" ? l : l["@id"]) === pkgIri);
      })
      .map((n) => String(n["@id"]).split("#").pop()!);

  test("no two packages share an @id — a collision is not a merge", () => {
    const ids = packages().map((p) => String(p["@id"]));
    expect(ids.length).toBe(new Set(ids).size);
  });

  // WITNESS RETARGETED TWICE, and the second time is the lesson landing.
  //
  // These three guard `packageIdFor`'s rule — an id comes from the manifest's
  // `name`, never from the directory basename — against the real corpus. The
  // witness was `bootstrap` until the `pve3` ruling removed it from this
  // graph, then `bootstrap-render` (directory `tools/`) until bean `n350`
  // consolidated that package into `bootstrap/skills/` on 2026-09-23.
  //
  // It is now `who-iris`: directory `who-iris/skills/`, basename `skills`,
  // manifest `who-iris`. (It was `large-datasets` until bean `j7ql` dissolved
  // that instance into cat-harness on 2026-10-01, where its package sits at
  // `cat-harness/skills/library/large-datasets/` and the basename IS the name;
  // before that `kg-navigation`, until bean `byql` folded it into
  // `cat-harness/skills/kg/kg-navigation/` for the same reason.) Same shape,
  // and a witness the root graph carries for its own reasons rather than by a
  // declaration made for one package. The members are READ from its manifest
  // rather than listed, so adding a skill there is not a test edit.
  //
  // Read from the CHECKOUT-scope graph since bean `4ak5` item 2: who-iris is
  // its own instance, so the published graph holds a tombstone where its
  // package was (asserted below), and no package of cat-harness's own has a
  // manifest name that differs from its directory. The rule is
  // `packageIdFor`'s, which runs the same in either scope.
  const WITNESS = "who-iris";
  const checkoutPackages = (): Array<Record<string, unknown>> =>
    (EXPORT_CHECKOUT["@graph"] as Array<Record<string, unknown>>).filter((n) => n["@type"] === termIri("SkillPackage"));
  const witness = () => checkoutPackages().find((x) => String(x["@id"]).endsWith(`#package/${WITNESS}`));

  // Reads other instances' exports, so it runs only where those instances
  // exist; skipped visibly when cat-harness stands alone (bean `ho66`).
  test.skipIf(!inAggregate())("in the PUBLISHED graph the witness is a tombstone forwarding to its own instance's document", () => {
    const at = `${EXPORT["@id"]}#package/${WITNESS}`;
    const t = (EXPORT["@graph"] as Array<Record<string, unknown>>).find((n) => n["@id"] === at);
    expect(t).toEqual({ "@id": at, deprecated: true, isReplacedBy: publishedIdentity(join(REPO, WITNESS)).docIri });
  });

  test("a package is named by its manifest, not by its directory", () => {
    const p = witness();
    expect(p, `packages present: ${checkoutPackages().map((x) => x["name"]).join(", ")}`).toBeDefined();
    expect(p!["name"]).toBe(WITNESS);
    expect(String(p!["path"])).toContain("who-iris/skills");
    // And the basename is NOT what it is called — the assertion the rule is
    // actually about, which naming the package alone does not make.
    expect(p!["name"]).not.toBe("skills");
  });

  test("its members are that package's own skills and nothing else", () => {
    // Against the manifest, because what the collision produced was a member
    // from ANOTHER package — a count would have gone on passing while one
    // name was swapped for another.
    const manifest = JSON.parse(
      readFileSync(join(import.meta.dir, "../../..", "who-iris", "skills", "package-manifest.json"), "utf8"),
    ) as { skills: string[] };
    expect(membersOf(String(witness()!["@id"])).sort()).toEqual(manifest.skills.map((k) => `skill/${k}`).sort());
  });

  test("`corpus-grep` is NOT among them — the contamination the merge caused", () => {
    // The sharpest assertion here, because it is the one that was false and
    // that every other signal called healthy. `corpus-grep` is folio-core's.
    expect(membersOf(String(witness()!["@id"]))).not.toContain("skill/corpus-grep");
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

  test("it takes the OTHER instance's identity", async () => {
    const e = EXPORT_ALT_BOOT;
    expect(e["@id"]).toBe(`${ALT_BASE}/bootstrap/bootstrap.jsonld`);
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
    const mine = EXPORT_ALT;
    const theirs = EXPORT_ALT_BOOT;
    const n = (e: { "@graph": unknown[] }) => e["@graph"].length;
    expect(n(theirs)).toBeGreaterThan(0);
    expect(n(theirs)).toBeLessThan(n(mine) / 4);
    // And named, not merely smaller: a skill bootstrap has and this
    // instance does not.
    const ids = new Set((theirs["@graph"] as Array<{ "@id": string }>).map((x) => x["@id"]));
    // `skillHome` follows `exportIdentity`, so repointing the document moved
    // every link into it — which is the half of `dyd3`'s option B that needed
    // no separate change.
    expect(ids.has(`${ALT_BASE}/bootstrap/bootstrap.jsonld#skill/discussion`)).toBe(true);
  });

  test("it emits no link to a collector it did not run", async () => {
    // `collectSkills` puts `inPackage` on every skill; `collectPackages` is
    // instance-bound and omitted. Left alone that was SEVEN dangling links in
    // bootstrap's export, every skill pointing at a package node the
    // document cannot contain.
    const e = EXPORT_ALT_BOOT;
    expect(e.danglingLinks).toEqual([]);
    expect((e["@graph"] as Array<Record<string, unknown>>).some((n) => "inPackage" in n)).toBe(false);
  });

  test("a Tool satisfying a sibling's skill links into the SIBLING's document", async () => {
    // The edge `pve3` created: the skills live in bootstrap so an
    // Bootstrapping Agent can read them with nothing installed, the Tool nodes live here
    // because a Tool is cat-harness's vocabulary (`gn4l`).
    const e = EXPORT_ALT;
    // The document's OWN `@id`, never a spelled-out stub. Main renamed this
    // instance's stub from `folio-assistant` to `cat-harness` while this
    // branch was open and the hardcoded literal took two tests down with it —
    // the same failure this file's package-witness comment warns about, made
    // in the act of fixing it.
    const tool = (e["@graph"] as Array<Record<string, unknown>>).find(
      (n) => n["@id"] === `${e["@id"]}#tool/discuss`,
    )!;
    expect(tool.satisfies).toEqual([`${ALT_BASE}/bootstrap/bootstrap.jsonld#skill/discussion`]);
  });

  test("a skill THIS instance also declares stays here", async () => {
    // Own-first, and it is not academic: `agent-skills` and `kg-navigation`
    // declare ids this instance also declares, and without the own-first
    // check their documents appeared as link targets the deploy never writes.
    const e = EXPORT_ALT;
    const own = String(e["@id"]);
    // Every legitimate foreign home is a document some instance PUBLISHES,
    // minted as that instance's export mints it. bootstrap was the only one
    // until the split (bean `4ak5` item 2); since then a skill held by an
    // instance stacked on this one links into that instance's document.
    const homes = instanceRootsIn(REPO)
      .map((r) => publishedIdentity(r, ALT_BASE).docIri)
      .filter((d) => d !== own);
    for (const n of e["@graph"] as Array<Record<string, unknown>>) {
      for (const s of (n.satisfies ?? []) as string[]) {
        if (s.startsWith(`${own}#`)) continue;
        expect({ s, home: homes.some((h) => s.startsWith(`${h}#`)) }).toEqual({ s, home: true });
      }
    }
  });
});

/*
 * THE STANDARDS A GRAPH IS WRITTEN IN, reachable from the graph. Owner,
 * 2026-09-27, on the `processes` GraphTypology: "i would have expected to see
 * schemas more accessible (e.g. bpmn, or others) when viewing". The registry
 * knew `processes` is BPMN; the export dropped it.
 */
describe("schemas and standards are nodes, and graphs link to them", () => {
  const graph = EXPORT["@graph"] as Array<Record<string, unknown>>;
  const byType = (t: string) => graph.filter((n) => n["@type"] === termIri(t));
  const specs = byType("ExternalSchema");
  const idOf = (name: string): string => String(specs.find((n) => n.name === name)?.["@id"]);

  /*
   * The corpus is the files DECLARING themselves external schemas, not every
   * `.json` in the directory. `external-schemas/` gained a second family on
   * 2026-09-30 — `folio-pinned-terminology/v1`, the concept snapshot
   * `check:term-mapping` resolves the FHIR half against — and a bare
   * `*.json` count reads that as a missing node.
   *
   * Both halves are asserted, and the second is the reason: a test that only
   * counted the first family would pass just as well if `loadSpecs` started
   * dropping records for some OTHER reason, because the expected count would
   * fall with the actual one. Naming the excluded file pins WHICH exclusion
   * is legitimate, so a silently-dropped external schema still fails here.
   */
  test("every external-schemas record is an ExternalSchema node, DMN 1.3 among them", () => {
    const dir = resolve(import.meta.dir, "..", "..", "external-schemas");
    const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
    const tagOf = (f: string): unknown => JSON.parse(readFileSync(join(dir, f), "utf-8")).$schema;
    // Absent `$schema` is accepted as an external schema — `loadSpecs` reads it the same way.
    const external = files.filter((f) => {
      const tag = tagOf(f);
      return typeof tag !== "string" || tag === EXTERNAL_SCHEMA_TAG;
    });
    const other = files.filter((f) => !external.includes(f));

    expect(specs.length).toBe(external.length);
    expect(specs.map((n) => n.name)).toContain("omg-bpmn-2.0");
    expect(specs.map((n) => n.name)).toContain("omg-dmn-1.3");

    // A pinned edition's snapshot beside its record: the IG's terminology
    // (bean `7wou`) and the SPDX License List's ids (bean `sd5v`).
    expect(other.sort()).toEqual(["spdx-license-list.terminology.json", "who-smart-base.terminology.json"]);
    for (const f of other) expect(tagOf(f)).toBe("folio-pinned-terminology/v1");
  });

  test("the processes GraphTypology conforms to BPMN AND DMN, and says why it has no validator", () => {
    const kind = byType("GraphTypology").find((n) => n.name === "processes")!;
    const to = kind.conformsTo as string[];
    expect(to).toContain(idOf("omg-bpmn-2.0"));
    expect(to).toContain(idOf("omg-dmn-1.3"));
    expect(typeof kind.validatorNotApplicable).toBe("string");
  });

  test("a kind with a runtime validator links to its Schema node", () => {
    const schemas = new Set(byType("Schema").map((n) => n["@id"]));
    const withValidator = byType("GraphTypology").filter((n) => n.validator !== undefined);
    expect(withValidator.length).toBeGreaterThan(0);
    for (const k of withValidator) expect(schemas.has(k.validator)).toBe(true);
  });

  test("a Schema node's docblock line is its summary and its title is the stem (D5)", () => {
    const schemas = byType("Schema");
    expect(schemas.length).toBeGreaterThan(0);
    for (const n of schemas) expect(n.title).toBe(n.name);
    expect(schemas.some((n) => typeof n.summary === "string")).toBe(true);
  });

  test("every Process links to the standard its own file declares", () => {
    const bpmn = idOf("omg-bpmn-2.0");
    const procs = byType("Process");
    expect(procs.length).toBeGreaterThan(0);
    for (const p of procs) expect(p.conformsTo as string[]).toContain(bpmn);
  });
});

/*
 * EACH DMN DECISION IS A NODE. Owner, 2026-09-27: add each DMN decision table
 * to the knowledge graph as its own node, linked to the BPMN gateway that uses
 * it and to the DMN 1.3 standard. Before this a gateway carried only
 * `decisionRef`, a string, so the table computing its branch was the one
 * thing about the branch a reader could not walk to.
 */
describe("DMN decisions are nodes, linked to their gateways and to DMN 1.3", () => {
  const graph = EXPORT["@graph"] as Array<Record<string, unknown>>;
  const byType = (t: string) => graph.filter((n) => n["@type"] === termIri(t));
  const decisions = byType("Decision");
  const dmn13 = String(byType("ExternalSchema").find((n) => n.name === "omg-dmn-1.3")?.["@id"]);

  test("every decision in every .dmn file is a Decision node conforming to DMN 1.3", () => {
    // Every `.dmn` the harness's corpus declares, wherever it is grouped
    // (`processes/<group>/decisions/`, placement PR3, bean `63wl`).
    // THIS instance's — the published graph holds no other's since bean
    // `4ak5` item 2; each stacked instance's decisions are in its own.
    const declared = workflowFiles(resolve(import.meta.dir, "..", ".."), "instance")
      .filter((f) => f.endsWith(".dmn"))
      .flatMap((f) =>
        [...readFileSync(f, "utf-8").matchAll(/<decision\s[^>]*\bid="([^"]+)"/g)].map(
          (m) => `${basename(f).replace(/\.dmn$/, "")}/${m[1]}`,
        ),
      );
    expect(declared.length).toBeGreaterThan(0);
    const emitted = decisions.map((n) => String(n["@id"]).split("#decision/")[1]);
    for (const d of declared) expect(emitted).toContain(d);
    for (const n of decisions) {
      expect(n.conformsTo as string[]).toContain(dmn13);
      expect(String(n.sourcePath)).toMatch(/\.dmn$/);
    }
  });

  test("every gateway with a decisionRef links to its Decision, and no decidedBy dangles", () => {
    const ids = new Set(decisions.map((n) => n["@id"]));
    const gateways = byType("ProcessNode").filter((n) => n.decisionRef !== undefined);
    expect(gateways.length).toBeGreaterThan(0);
    for (const g of gateways) expect(ids.has(g.decidedBy as string)).toBe(true);
    for (const g of byType("ProcessNode").filter((n) => n.decidedBy !== undefined)) {
      expect(ids.has(g.decidedBy as string)).toBe(true);
      // The link names the same table the authored ref does.
      const [file, id] = String(g.decisionRef).split("#");
      const stem = file!.split("/").pop()!.replace(/\.dmn$/, "");
      expect(String(g.decidedBy).endsWith(`#decision/${stem}/${id}`)).toBe(true);
    }
  });

  // Bean `ax6r` (owner, 2026-10-03: "Move to JSON-LD"): the workflow page's
  // rows are Process nodes, so the KG carries what the old plain-JSON index did.
  test("a Process carries its own documentation — first sentence as summary, whole as description", () => {
    const processes = byType("Process");
    expect(processes.length).toBeGreaterThan(0);
    for (const p of processes.filter((x) => x.description !== undefined)) {
      expect(typeof p.summary).toBe("string");
      expect(String(p.description).startsWith(String(p.summary).replace(/…$/, ""))).toBe(true);
    }
    // The witness is one of cat-harness's OWN diagrams, so the case holds where
    // cat-harness is its own clone with no higher instance beside it (bean
    // `ho66`); `content-lifecycle` was folio-assistant-core's.
    const review = processes.find((p) => String(p.sourcePath).endsWith("content/review-task.bpmn"))!;
    expect(review.description).toBeDefined();
    expect(String(review.sourceUrl)).toMatch(/^https:\/\/github\.com\/.+\/blob\/main\/.+review-task\.bpmn$/);
    expect(String(review.depiction)).toMatch(/\/assets\/img\/workflows\/review-task\.svg$/);
  });

  test("a call activity's calledElement links to a Process in this graph, never to one it lacks", () => {
    const procIds = new Set(byType("Process").map((p) => p["@id"]));
    const calls = byType("ProcessNode").filter((n) => n.calledElement !== undefined);
    expect(calls.length).toBeGreaterThan(0);
    for (const c of calls) expect(procIds.has(c.calledElement as string)).toBe(true);
    // `review-task` calls `review-narrative` — an edge between two of
    // cat-harness's own diagrams, so it is there standalone too (bean `ho66`).
    const review = byType("Process").find((p) => String(p.sourcePath).endsWith("content/review-task.bpmn"))!;
    const narrative = byType("Process").find((p) => String(p.sourcePath).endsWith("content/review-narrative.bpmn"))!;
    expect(calls.some((c) => c.partOf === review["@id"] && c.calledElement === narrative["@id"])).toBe(true);
  });
});

describe("an actor's roles are links to Role nodes (#1168 B8)", () => {
  // `roles` on an actor was the literal `roleName` while the role registry was
  // not exported. It is now — one Role node per `scenarios/roles.json` entry —
  // so the edge is minted as a link, and a link that lands nowhere is the
  // defect the literal was protecting against.
  const graph = (EXPORT as unknown as { "@graph": { "@id"?: string; mayTakeRole?: string[]; roleName?: unknown }[] })["@graph"];
  const ids = new Set(graph.map((n) => n["@id"]));
  const links = graph.flatMap((n) => (n.mayTakeRole ?? []).map((t) => ({ from: n["@id"], to: t })));

  test("actors carry mayTakeRole links, not the old literal", () => {
    expect(links.length).toBeGreaterThan(0);
  });

  test("every link lands on a node of this document", () => {
    expect(links.filter((l) => !ids.has(l.to)).map((l) => `${l.from} -> ${l.to}`)).toEqual([]);
  });
});

/*
 * THE SPLIT — bean `4ak5` item 2, owner ruling 2026-10-05 (option B).
 *
 * `cat-harness.jsonld` is built in instance scope: cat-harness's own declared
 * directories only. Measured the day it landed, the checkout-scope document
 * it replaced carried 825 nodes of five other instances under
 * `cat-harness.jsonld#…` fragments. Each such `@id` keeps a tombstone for ONE
 * release, forwarding to the same node in its owner's published document —
 * GitHub Pages cannot redirect a fragment. Remove the tombstone tests with
 * `tombstonesFor`.
 */
const OWNER_EXPORTS = new Map<string, Set<string>>();
for (const r of instanceRootsIn(REPO)) {
  if (resolve(r) === resolve(join(import.meta.dir, "../.."))) continue;
  const own = declaresOwnCanonical(readDeclaration(r));
  const e = await buildExport({ instanceRoot: r, ...(own ? {} : { baseUrl: BASE }) });
  OWNER_EXPORTS.set(String(e["@id"]), new Set((e["@graph"] as Array<{ "@id": string }>).map((n) => n["@id"])));
}

describe("the published graph is this instance's own (bean 4ak5 item 2)", () => {
  const HOST = resolve(join(import.meta.dir, "../.."));
  const graph = EXPORT_CANONICAL["@graph"] as Array<Record<string, unknown>>;
  const tombstones = graph.filter(isTombstone);

  test("no node's source path is outside this instance", () => {
    const outside: string[] = [];
    for (const n of graph) {
      for (const k of ["instructionsPath", "sourcePath", "path", "module"]) {
        const v = n[k];
        if (typeof v !== "string") continue;
        const rel = relative(HOST, resolve(HOST, v));
        if (rel.startsWith("..") || isAbsolute(rel)) outside.push(`${String(n["@id"])} ${k}=${v}`);
      }
    }
    expect(outside).toEqual([]);
  });

  // Reads other instances' exports, so it runs only where those instances
  // exist; skipped visibly when cat-harness stands alone (bean `ho66`).
  test.skipIf(!inAggregate())("every @id the checkout-scope graph mints and this one lacks is a tombstone", () => {
    // Two WHOLE builds, so a collector that becomes scope-dependent without
    // `tombstonesFor` re-running it fails here rather than leaving an `@id`
    // with no forwarding address.
    const here = new Set(graph.filter((n) => !isTombstone(n)).map((n) => String(n["@id"])));
    const moved = (EXPORT_CHECKOUT["@graph"] as Array<{ "@id": string }>).map((n) => n["@id"]).filter((id) => !here.has(id));
    expect(moved.length).toBeGreaterThan(0);
    const stones = new Set(tombstones.map((n) => String(n["@id"])));
    expect(moved.filter((id) => !stones.has(id))).toEqual([]);
    // And nothing is tombstoned that is still here, or that never was.
    expect(tombstones.length).toBe(moved.length);
  });

  test("a tombstone is exactly the ruling's shape, and the context maps it to OWL and Dublin Core", () => {
    for (const t of tombstones) expect(Object.keys(t).sort()).toEqual(["@id", "deprecated", "isReplacedBy"]);
    const ctx = EXPORT_CANONICAL["@context"] as Record<string, Record<string, string>>;
    expect(ctx.deprecated!["@id"]).toBe("http://www.w3.org/2002/07/owl#deprecated");
    expect(ctx.isReplacedBy).toEqual({ "@id": "http://purl.org/dc/terms/isReplacedBy", "@type": "@id" });
  });

  test("every tombstone forwards to a node its owner's PUBLISHED document holds", () => {
    // The owner's document is the one `instance-exports.ts` writes — built
    // the way it builds it, with no `--base-url` for an instance that
    // declares its own `canonicalUrl`. A package has no node in any other
    // instance's document (the package collector is instance-bound), so it
    // forwards to the document itself.
    const published = new Set([...instanceExportPlan().map((p) => p.stub), ...Object.keys(PUBLISHED_ELSEWHERE)]);
    const stubOf = new Map(instanceRootsIn(REPO).map((r) => [publishedIdentity(r, BASE).docIri, artefactStub(readDeclaration(r)!)]));
    const lost: string[] = [];
    for (const t of tombstones) {
      const to = String(t.isReplacedBy);
      const doc = to.split("#")[0]!;
      const held = OWNER_EXPORTS.get(doc);
      const stub = stubOf.get(doc);
      const ok = held !== undefined && stub !== undefined && published.has(stub) && (to === doc || held.has(to));
      if (!ok) lost.push(`${String(t["@id"])} → ${to}`);
    }
    expect(lost).toEqual([]);
  });

  // Reads other instances' exports, so it runs only where those instances
  // exist; skipped visibly when cat-harness stands alone (bean `ho66`).
  test.skipIf(!inAggregate())("nothing left behind links to a node that moved", () => {
    // `danglingLinks` is computed before the tombstones are appended, so a
    // link to a node that LEFT is reported rather than resolved by its own
    // forwarding address — a role's skill held by a stacked instance is
    // re-homed by `skillHome`, as a Tool's `satisfies` is.
    expect(EXPORT_CANONICAL.danglingLinks).toEqual([]);
  });
});
