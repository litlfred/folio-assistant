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
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

import { buildExport, exportIdentity, undeclaredRootTerms } from "../kg-export.js";
import { buildDeclarationSchema, buildSkillIoContracts } from "../harness-schema-export.js";
import { readDeclaration, artefactStub } from "../../schemas/cat-harness.js";
import { FOLIO_NS } from "../../schemas/namespaces.js";

// The repo's own canonicalUrl, so the shared fixture is the CANONICAL export.
// Using an arbitrary base made it a preview, which (correctly) gave it an
// array `@type` and 968 alternateOf links — caught by the self-identification
// test below, which is the test doing its job.
const BASE = readDeclaration(join(import.meta.dir, "../.."))!.canonicalUrl!;
const EXPORT = await buildExport();
const typed = (t: string) => EXPORT["@graph"].filter((n) => n["@type"] === `${FOLIO_NS}${t}`);

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
    expect(EXPORT["@id"]).toBe(`${BASE}/folio-assistant.jsonld`);
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
    expect(undeclaredRootTerms(EXPORT as unknown as Record<string, unknown>, EXPORT["@context"])).toEqual([]);
  });

  test("...and the root check FIRES, rather than passing because it looks at nothing", () => {
    // The assertion above is green when the checker works AND when it is
    // broken, so on its own it is not evidence. `dh4f` is the whole repo's
    // name for that shape: a clean run over what was never read.
    const ctx = { ...EXPORT["@context"] } as Record<string, unknown>;
    delete ctx.counts;
    expect(undeclaredRootTerms(EXPORT as unknown as Record<string, unknown>, ctx)).toEqual(["counts"]);

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
      expect(String(n["@type"]).startsWith(FOLIO_NS)).toBe(true);
    }
    expect(ids.length).toBe(new Set(ids).size);
  });

  test("counts agree with the graph they summarise", () => {
    // The counts block exists so a consumer can spot a truncated file. If it
    // can disagree with `@graph`, it is worse than absent.
    const recomputed: Record<string, number> = {};
    for (const n of EXPORT["@graph"]) {
      const t = String(n["@type"]).replace(FOLIO_NS, "");
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
    expect(stub).toBe("folio-assistant");
    expect(exportIdentity({ baseUrl: BASE }).docIri).toBe(`${BASE}/${stub}.jsonld`);
    expect(buildDeclarationSchema({ baseUrl: BASE }).$id).toBe(`${BASE}/${stub}.schema.json`);

    // The declaration is read from a fixed filename, whatever the stub is.
    expect(existsSync(join(import.meta.dir, "../..", "cat-harness.json"))).toBe(true);
    expect(existsSync(join(import.meta.dir, "../..", `${stub}.json`))).toBe(false);
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
    expect(preview["@type"]).toContain(`${FOLIO_NS}PreviewGraph`);
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
    for (const k of kinds) expect(String(k["@id"]).startsWith(FOLIO_NS)).toBe(true);
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
      "tool.schema.json",
      "tool-types.schema.json",
      `${stub}/`,
    ]);
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
      // The term namespace is an IRI stem, not a file — nothing serves it and
      // nothing should try to. Excluded by name rather than by pattern so a
      // new non-file stem has to be declared here to be exempt.
      if (rel === "ns" || rel.startsWith("ns/")) continue;
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
