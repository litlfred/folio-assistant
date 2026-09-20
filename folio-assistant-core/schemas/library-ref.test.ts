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
  it("resolves the platform's declared library graph", () => {
    expect(libraryDirOf(PLATFORM)).toBe(resolve(PLATFORM, "library"));
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
    const r = resolveLibraryRef(local, PLATFORM, REPO);
    expect(r.ok).toBe(true);
  });

  it("resolves the SAME reference when the instance is named explicitly", () => {
    // The two forms must agree, or adding `instance` to an existing citation
    // would change what it means.
    const bare = resolveLibraryRef(local, PLATFORM, REPO);
    const named = resolveLibraryRef({ ...local, instance: "folio-assistant" }, PLATFORM, REPO);
    expect(named.ok).toBe(true);
    if (bare.ok && named.ok) expect(named.path).toBe(bare.path);
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
    // `who-iris` is declared but its corpus has not moved yet (bean frs5), so
    // this is the honest intermediate state — distinct from a missing section.
    const r = resolveLibraryRef({ ...local, instance: "who-iris" }, PLATFORM, REPO);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure.kind).toBe("no-library-graph");
  });

  it("a document that was never ingested is distinct from a missing section", () => {
    const r = resolveLibraryRef({ libraryId: "never-ingested" }, PLATFORM, REPO);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure.kind).toBe("not-ingested");
  });

  it("a missing section in an ingested document is the fourth case", () => {
    const r = resolveLibraryRef({ libraryId: "wpr-rdo-2020-003-eng", sectionId: "page-999" }, PLATFORM, REPO);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure.kind).toBe("no-such-section");
  });

  it("every failure explains itself in one actionable line", () => {
    for (const ref of [
      { ...local, instance: "nope" },
      { ...local, instance: "who-iris" },
      { libraryId: "never-ingested" },
      { libraryId: "wpr-rdo-2020-003-eng", sectionId: "page-999" },
    ]) {
      const r = resolveLibraryRef(ref, PLATFORM, REPO);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(explainFailure(r.failure).length).toBeGreaterThan(40);
    }
  });
});
