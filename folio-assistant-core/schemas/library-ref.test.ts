/**
 * Cross-instance library references, against THIS checkout rather than fixtures.
 *
 * Fixtures would prove the code branches; this proves it resolves the real
 * instances, which is the claim that matters — bean `r1lz` predicted the defect
 * a year of fixtures would not have caught: *"a skill derived from a source
 * text in another repo would cite evidence its own instance cannot resolve."*
 */
import { describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
import { explainFailure, instanceRoots, libraryDirOf, resolveLibraryRef } from "./library-ref.js";
import {  } from "../../cat-harness/schemas/cat-harness.js";
import { writeDeclaration } from "../../cat-harness/test/support/instance-fixture.js";

const REPO = resolve(import.meta.dir, "../..");
const PLATFORM = resolve(REPO, "cat-harness");
/**
 * The instance that actually holds the WHO corpus, since bean `frs5`.
 *
 * Before the move `cat-harness` held it and every assertion below resolved
 * LOCALLY — the cross-instance path was exercised only by an unknown-instance
 * negative. That made this file's own opening claim ("this proves it resolves
 * the real instances") weaker than it read: the interesting case was the one
 * with no data behind it. Now the platform holds no library at all, so a
 * citation of a WHO document is a genuine cross-instance resolution, which is
 * exactly the situation bean `r1lz` predicted: *"a skill derived from a source
 * text in another repo would cite evidence its own instance cannot resolve."*
 */
const WHO_IRIS = resolve(REPO, "who-iris");

describe("instance discovery", () => {
  it("finds instances by their DECLARED name, not by their published stub", () => {
    const roots = instanceRoots(REPO);
    // This used to read "not by DIRECTORY name", witnessed by a declared
    // `folio-assist-core` in a directory called `folio-assistant-core`. After
    // the owner's 2026-09-20 ruling — `cat-harness`, `folio-assistant-core`
    // and `folio-assistant` are distinct instances — every name agrees with
    // its directory, so that witness is gone and a test asserting it would be
    // asserting a coincidence.
    //
    // The distinction that IS still live is name vs STUB. `cat-harness`
    // declares `stub: "folio-assistant"` — the stub names the published
    // artefact (`docs/folio-assistant/`, `_kg/folio-assistant.jsonld`) while
    // the name names the instance. A consumer reaching for an instance by its
    // stub gets the REPOSITORY, which is a different instance entirely.
    expect(roots.get("cat-harness")).toBe(PLATFORM);
    expect(roots.get("folio-assistant")).not.toBe(PLATFORM);
    expect(roots.has("folio-assistant-core")).toBe(true);
    expect(roots.get("folio-assistant-core")).toBe(resolve(REPO, "folio-assistant-core"));
  });

  it("finds the platform instance, whose directory is `cat-harness`", () => {
    expect(instanceRoots(REPO).get("cat-harness")).toBe(PLATFORM);
  });

  it("the REPOSITORY is its own instance, and not the harness layer", () => {
    // Three distinct instances, per the owner 2026-09-20. They were not
    // distinct for a few hours: the repository root gained a `harness.json`
    // and declared `folio-assistant`, which `cat-harness/harness.json`
    // already carried. `instanceRoots` is keyed on the declared name, so the
    // two were ONE key and the root won — `folio-assistant` resolved to the
    // checkout and the harness layer became unreachable by name, silently.
    //
    // Asserting they are DIFFERENT is the check that cannot pass by accident;
    // asserting each resolves somewhere would have passed throughout.
    const roots = instanceRoots(REPO);
    expect(roots.get("folio-assistant")).toBe(REPO);
    expect(roots.get("cat-harness")).toBe(PLATFORM);
    expect(roots.get("folio-assistant")).not.toBe(roots.get("cat-harness"));
  });
});

describe("library location is read from the declaration", () => {
  it("resolves a content instance's declared library graph", () => {
    expect(libraryDirOf(WHO_IRIS)).toBe(resolve(WHO_IRIS, "library"));
  });

  it("the PLATFORM's library holds ONLY sources its methodologies cite", () => {
    // `cat-harness` held 1,431 files of somebody else's writing until bean
    // `frs5`. AGENTS.md states the rule — "folio-assistant is the platform,
    // not the content" — and until that move nothing checked it.
    //
    // This asserted `toBeUndefined()` for a few hours (`frs5` removed the
    // declaration with the content), then `toEqual([])` on the owner's
    // 2026-09-20 ruling, which kept the declaration so a DEPENDENT folio
    // inherits the convention (`wwi6`).
    //
    // IT IS NOW NARROWED RATHER THAN DROPPED, on the owner's ruling of
    // 2026-09-22: *"they should be under <stub>/library and appear in the
    // library visualizer for the harness. dont bury sub-graph assets."*
    // Methodology source literature is the harness's OWN grounding material,
    // not a folio's subject matter — the same relation `agent-skills/library/`
    // has to the agent-skills subgraph — so an empty-directory assertion would
    // now forbid the thing the owner asked for.
    //
    // The teeth are kept by inverting the question. Instead of "is it empty",
    // this asks "is every entry here cited by a methodology node" — which
    // still fails the moment folio content appears, and fails for a reason
    // that names the offending entry. An emptiness check could only ever say
    // "something is here".
    const dir = libraryDirOf(PLATFORM);
    expect(dir).toBeDefined();

    const entries = readdirSync(dir!).filter((f) => !f.startsWith("."));

    // `evidence:` lines across the methodology graph, as bib-slugs.
    const methodologies = resolve(PLATFORM, "methodologies");
    const cited = new Set<string>();
    for (const f of readdirSync(methodologies).filter((f) => f.endsWith(".md"))) {
      const text = readFileSync(join(methodologies, f), "utf8");
      for (const m of text.matchAll(/^evidence:\s*library\/(\S+)\s*$/gm)) {
        cited.add(m[1]!);
      }
    }

    const uncited = entries.filter((e) => !cited.has(e));
    expect(uncited).toEqual([]);
  });

  it("returns undefined for an instance that declares no library graph", () => {
    // NOT the same as an empty directory, and not an error: `kg-navigation`
    // legitimately holds no corpus.
    expect(libraryDirOf(resolve(REPO, "kg-navigation"))).toBeUndefined();
  });
});

describe("resolution keeps four failures apart", () => {
  const local = { libraryId: "wpr-rdo-2020-003-eng", sectionId: "page-012" };

  it("resolves a bare reference against the citing instance", () => {
    const r = resolveLibraryRef(local, WHO_IRIS, REPO);
    expect(r.ok).toBe(true);
  });

  it("resolves the SAME reference when the instance is named explicitly", () => {
    // The two forms must agree, or adding `instance` to an existing citation
    // would change what it means.
    const bare = resolveLibraryRef(local, WHO_IRIS, REPO);
    const named = resolveLibraryRef({ ...local, instance: "who-iris" }, WHO_IRIS, REPO);
    expect(named.ok).toBe(true);
    if (bare.ok && named.ok) expect(named.path).toBe(bare.path);
  });

  it("the platform citing a WHO document must NAME who-iris — and does resolve", () => {
    // The case bean `r1lz` predicted, now real rather than hypothetical. A
    // bare citation from the platform cannot work any more (it declares no
    // library), and the named one crosses the instance boundary and lands.
    const named = resolveLibraryRef({ ...local, instance: "who-iris" }, PLATFORM, REPO);
    expect(named.ok).toBe(true);
    if (named.ok) expect(named.path).toContain("who-iris/library/wpr-rdo-2020-003-eng");
  });

  it("an unknown instance is never silently treated as local", () => {
    // The failure this rule exists for: falling back would turn "you cited
    // another repository and it is not here" into "that section is missing",
    // sending the reader to entirely the wrong place.
    const r = resolveLibraryRef({ ...local, instance: "no-such-instance" }, PLATFORM, REPO);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.failure.kind).toBe("unknown-instance");
      expect(explainFailure(r.failure)).toContain("DECLARED NAME");
    }
  });

  it("a known instance with no library graph is its own finding", () => {
    // `kg-navigation` is declared and legitimately holds no corpus — distinct
    // from a missing section, and distinct from an unknown instance.
    //
    // This named `who-iris` until bean `frs5`, when who-iris gained the
    // library it had been deliberately withholding. Moving the assertion to an
    // instance that will never hold one is the point: an assertion that only
    // holds until somebody does the obvious next thing is not testing the
    // distinction, it is testing the schedule.
    const r = resolveLibraryRef({ ...local, instance: "kg-navigation" }, PLATFORM, REPO);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure.kind).toBe("no-library-graph");
  });

  it("a BARE reference from the platform now says `not-ingested`, and that is WORSE", () => {
    // The two answers are a sentence apart and send a reader to different
    // places: "this instance has no corpus, name the one that does" versus
    // "that document was never ingested".
    //
    // Between `frs5` and the owner's ruling the platform declared no library,
    // so a bare citation got the FIRST and more useful answer. Re-declaring
    // the (empty) library to preserve `wwi6`'s inheritance guarantee replaced
    // it with the second: the graph is there, the document is not, so the
    // resolver correctly reports `not-ingested` — and sends the reader looking
    // for an ingestion that was never going to happen here, instead of telling
    // them to name `who-iris`.
    //
    // Asserted rather than lamented: this is a real cost of declaring a
    // directory an instance does not fill, it is the `dh4f` shape doing
    // exactly what that bean says it does, and the core relocation is what
    // ends it. Pinning it here means the day it changes back, this says so.
    const r = resolveLibraryRef(local, PLATFORM, REPO);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure.kind).toBe("not-ingested");
  });

  it("a document that was never ingested is distinct from a missing section", () => {
    const r = resolveLibraryRef({ libraryId: "never-ingested" }, WHO_IRIS, REPO);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure.kind).toBe("not-ingested");
  });

  it("a missing section in an ingested document is the fourth case", () => {
    const r = resolveLibraryRef({ libraryId: "wpr-rdo-2020-003-eng", sectionId: "page-999" }, WHO_IRIS, REPO);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure.kind).toBe("no-such-section");
  });

  it("every failure explains itself in one actionable line", () => {
    for (const ref of [
      { ...local, instance: "nope" },
      { ...local, instance: "kg-navigation" },
      { libraryId: "never-ingested" },
      { libraryId: "wpr-rdo-2020-003-eng", sectionId: "page-999" },
    ]) {
      const r = resolveLibraryRef(ref, WHO_IRIS, REPO);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(explainFailure(r.failure).length).toBeGreaterThan(40);
    }
  });
});

describe("an instance's library is ITS OWN, not the first one declared", () => {
  // Found by review 2026-09-20. `libraryDirOf` used `dirs.find(...)` over
  // every entry declaring a `library` graph, and `cat-harness/harness.json`
  // declares FOUR — its own, plus `who-iris/`, `folio-assistant-sci/` and
  // `agent-skills/`, all three `scope: "repository"` because the consumers
  // that scan libraries run from the repository root.
  //
  // It happened to be right today only because cat-harness's own entry is
  // declared first. Reorder the file and `libraryDirOf("cat-harness")` starts
  // returning `cat-harness/who-iris/library` — a path that does not exist —
  // so a citation to an INGESTED who-iris document reports "never brought
  // through uploads/ -> library/". A correct answer resting on key order is
  // not a correct answer.
  function instance(dirs: unknown[]): string {
    const root = mkdtempSync(join(tmpdir(), "libdir-"));
    mkdirSync(join(root, "library"), { recursive: true });
    mkdirSync(join(root, "elsewhere", "library"), { recursive: true });
    writeDeclaration(root, JSON.stringify({ name: "x", directories: dirs }));
    return root;
  }

  it("ignores a repository-scoped entry even when it is declared FIRST", () => {
    const root = instance([
      { id: "other", path: "elsewhere/library/", scope: "repository", dependents: "skip", graphKinds: ["library"] },
      { id: "library", path: "library/", dependents: "reproduce", graphKinds: ["library"] },
    ]);
    expect(libraryDirOf(root)).toBe(resolve(root, "library"));
    rmSync(root, { recursive: true, force: true });
  });

  it("and the answer does not change when the order does", () => {
    // The whole point: the same declaration, written the other way round.
    const root = instance([
      { id: "library", path: "library/", dependents: "reproduce", graphKinds: ["library"] },
      { id: "other", path: "elsewhere/library/", scope: "repository", dependents: "skip", graphKinds: ["library"] },
    ]);
    expect(libraryDirOf(root)).toBe(resolve(root, "library"));
    rmSync(root, { recursive: true, force: true });
  });

  it("REFUSES when an instance declares two of its own, rather than picking", () => {
    // `undefined` would say "this instance declares no library", which is a
    // different and wrong fact. Two libraries of one's own has no answer to
    // "where does this instance keep its corpus".
    const root = instance([
      { id: "a", path: "library/", dependents: "reproduce", graphKinds: ["library"] },
      { id: "b", path: "elsewhere/library/", dependents: "reproduce", graphKinds: ["library"] },
    ]);
    expect(() => libraryDirOf(root)).toThrow(/no single answer/);
    rmSync(root, { recursive: true, force: true });
  });

  it("every real instance here resolves its own library, or declares none", () => {
    // Over the real repository, so a future declaration that breaks it says so.
    for (const inst of ["cat-harness", "who-iris", "folio-assistant-sci", "agent-skills"]) {
      expect({ inst, dir: libraryDirOf(resolve(REPO, inst)) })
        .toEqual({ inst, dir: resolve(REPO, inst, "library") });
    }
    // Declares voices and no corpus — a determined "none", not a failure.
    expect(libraryDirOf(resolve(REPO, "who-style-guide"))).toBeUndefined();
  });
});
