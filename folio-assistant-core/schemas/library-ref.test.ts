/**
 * Cross-instance library references, against THIS checkout rather than fixtures.
 *
 * Fixtures would prove the code branches; this proves it resolves the real
 * instances, which is the claim that matters — bean `r1lz` predicted the defect
 * a year of fixtures would not have caught: *"a skill derived from a source
 * text in another repo would cite evidence its own instance cannot resolve."*
 */
import { describe, expect, it } from "bun:test";
import { resolve } from "path";
import { explainFailure, instanceRoots, libraryDirOf, resolveLibraryRef } from "./library-ref.js";

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
  it("finds instances by their DECLARED name, not by directory name", () => {
    const roots = instanceRoots(REPO);
    // `folio-assist-core` is the declared name; the directory is
    // `folio-assistant-core`. They differ, and that is the whole point of
    // citing a name rather than a path.
    expect(roots.has("folio-assist-core")).toBe(true);
    expect(roots.get("folio-assist-core")).toBe(resolve(REPO, "folio-assistant-core"));
  });

  it("finds the platform instance, whose directory is `cat-harness`", () => {
    expect(instanceRoots(REPO).get("folio-assistant")).toBe(PLATFORM);
  });
});

describe("library location is read from the declaration", () => {
  it("resolves a content instance's declared library graph", () => {
    expect(libraryDirOf(WHO_IRIS)).toBe(resolve(WHO_IRIS, "library"));
  });

  it("the PLATFORM declares none, and that is the point of the platform", () => {
    // `cat-harness` held 1,431 files of somebody else's writing until bean
    // `frs5`. AGENTS.md states the rule this asserts — "folio-assistant is the
    // platform, not the content" — and until the move nothing checked it.
    //
    // `undefined`, not an empty directory: the `library` entry was REMOVED
    // from its declaration rather than left pointing at an emptied path,
    // because a declared-and-absent directory is the `dh4f` defect.
    expect(libraryDirOf(PLATFORM)).toBeUndefined();
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

  it("a BARE reference from the platform is `no-library-graph`, not `not-ingested`", () => {
    // The two are a sentence apart and send a reader to different places:
    // "this instance has no corpus, name the one that does" versus "that
    // document was never ingested". Post-`frs5` the platform is the instance
    // where this distinction matters most, because every citation written
    // before the move is now a bare one against an empty declaration.
    const r = resolveLibraryRef(local, PLATFORM, REPO);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure.kind).toBe("no-library-graph");
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
