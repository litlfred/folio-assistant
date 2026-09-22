/**
 * Who references a library slug — bean `jbx2`'s third "done when".
 *
 * @module scripts/tests/library-refs
 *
 * Two halves that must be able to disagree: the SCANNER against a tree the
 * test planted, and the real corpus's own edges. One test over both would
 * pass while either was wrong.
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { libraryIdsIn, scanLibraryRefs, type RefSource } from "../library-refs.ts";
import { siteDirFor } from "../../schemas/cat-harness.ts";

const INSTANCE = resolve(import.meta.dir, "..", "..");
/** READ, never spelled: `site-dir-single-answer` is a gate, and it is right. */
const SITE = join(INSTANCE, siteDirFor(INSTANCE));

describe("libraryIdsIn", () => {
  test("finds the field at any depth, in objects and arrays alike", () => {
    expect(libraryIdsIn({ libraryId: "a" })).toEqual(["a"]);
    expect(libraryIdsIn({ rules: [{ source: { libraryId: "b" } }, { source: { libraryId: "b" } }] }))
      .toEqual(["b", "b"]);
    expect(libraryIdsIn([{ libraryId: "c" }, { nested: { deep: [{ libraryId: "d" }] } }]))
      .toEqual(["c", "d"]);
  });

  test("a field that merely mentions the word is not a reference", () => {
    // `libraryIdOf`, `library_id`, a string VALUE reading "libraryId" — none
    // of them is the declared edge, and matching loosely would inflate every
    // slug's referrer list with prose.
    expect(libraryIdsIn({ libraryIdOf: "a", library_id: "b", note: "libraryId" })).toEqual([]);
  });

  test("an empty or non-string value is not a reference", () => {
    // An empty string resolves to no slug, and reporting it would put a blank
    // row in the referrer list of a slug nobody named.
    expect(libraryIdsIn({ libraryId: "" })).toEqual([]);
    expect(libraryIdsIn({ libraryId: null })).toEqual([]);
    expect(libraryIdsIn({ libraryId: 7 })).toEqual([]);
  });
});

describe("scanLibraryRefs", () => {
  /** A repo with a catalogue node, a voice naming one slug many times, and noise. */
  function plant(): { repo: string; sources: RefSource[] } {
    const repo = mkdtempSync(join(tmpdir(), "refs-"));
    mkdirSync(join(repo, "cat"), { recursive: true });
    writeFileSync(join(repo, "cat", "item-x.json"), JSON.stringify({ id: "item/x", libraryId: "x" }));

    mkdirSync(join(repo, "voices"), { recursive: true });
    writeFileSync(
      join(repo, "voices", "v.json"),
      JSON.stringify({ sources: [{ libraryId: "x" }], rules: [{ source: { libraryId: "x" } }, { source: { libraryId: "x" } }] }),
    );

    // Noise: not JSON, and a dot-prefixed directory.
    writeFileSync(join(repo, "voices", "notes.md"), "libraryId: x\n");
    mkdirSync(join(repo, "voices", ".hidden"), { recursive: true });
    writeFileSync(join(repo, "voices", ".hidden", "h.json"), JSON.stringify({ libraryId: "hidden" }));

    return {
      repo,
      sources: [
        { kind: "catalogue", instance: "who-iris", dir: join(repo, "cat") },
        { kind: "voices", instance: "who-style-guide", dir: join(repo, "voices") },
      ],
    };
  }

  test("the referrer's KIND is the declared graph kind of its directory", () => {
    const { repo, sources } = plant();
    const s = scanLibraryRefs(sources, repo);
    expect(s.bySlug["x"]!.map((r) => r.kind).sort()).toEqual(["catalogue", "voices"]);
    expect(s.bySlug["x"]!.map((r) => r.instance).sort()).toEqual(["who-iris", "who-style-guide"]);
    rmSync(repo, { recursive: true });
  });

  test("one file is ONE referrer, however many times it names the slug", () => {
    // A voice names its source once and again on every rule. Counting those
    // as three referrers would say three things depend on the slug when one
    // does; the depth belongs in `count`.
    const { repo, sources } = plant();
    const s = scanLibraryRefs(sources, repo);
    const voice = s.bySlug["x"]!.find((r) => r.kind === "voices")!;
    expect(voice.count).toBe(3);
    expect(s.bySlug["x"]!.length).toBe(2);
    rmSync(repo, { recursive: true });
  });

  test("dot-prefixed directories are not scanned, at any depth", () => {
    const { repo, sources } = plant();
    expect(scanLibraryRefs(sources, repo).bySlug["hidden"]).toBeUndefined();
    rmSync(repo, { recursive: true });
  });

  test("a file named by two declarations is read once", () => {
    // A directory can carry two graph kinds. Reading it twice would double
    // every count in it and make one file look like two referrers.
    const { repo, sources } = plant();
    const twice = [...sources, { kind: "other", instance: "who-iris", dir: join(repo, "cat") }];
    const s = scanLibraryRefs(twice, repo);
    expect(s.bySlug["x"]!.filter((r) => r.from.endsWith("item-x.json")).length).toBe(1);
    rmSync(repo, { recursive: true });
  });

  test("UNREADABLE is collected separately — it is not a file with no references", () => {
    const { repo, sources } = plant();
    writeFileSync(join(repo, "cat", "broken.json"), "{ not json");
    const s = scanLibraryRefs(sources, repo);
    expect(s.unreadable).toEqual(["cat/broken.json"]);
    // And it is NOT counted as read: a consumer reporting "736 files scanned"
    // over a file it could not parse would be overstating its own coverage.
    expect(s.filesRead).toBe(2);
    rmSync(repo, { recursive: true });
  });

  test("a missing directory is empty, not a crash", () => {
    const { repo } = plant();
    const s = scanLibraryRefs([{ kind: "catalogue", instance: "i", dir: join(repo, "nope") }], repo);
    expect(s).toEqual({ bySlug: {}, filesRead: 0, unreadable: [] });
    rmSync(repo, { recursive: true });
  });
});

describe("the real corpus — the L1 property, demonstrated", () => {
  const g = JSON.parse(
    readFileSync(join(SITE, "assets", "library", "index.json"), "utf-8"),
  ) as {
    refScan?: { filesRead: number; unreadable: string[] };
    entries: { id: string; referencedBy?: { kind: string; from: string; count: number }[] }[];
  };

  test("the scan ran, and it could read everything it opened", () => {
    // Without this, every zero below is provisional and the next test would
    // be asserting over a scan that half-happened.
    expect(g.refScan).toBeDefined();
    expect(g.refScan!.unreadable).toEqual([]);
    expect(g.refScan!.filesRead).toBeGreaterThan(0);
  });

  test("every WHO IRIS slug resolves through its catalogue node AND a voice", () => {
    // This is what "demonstrated rather than asserted" means: two independent
    // referrer kinds, read off the corpus, for each of the three.
    for (const id of ["9789241548960-eng", "who-pub-tps-931", "wpr-rdo-2020-003-eng"]) {
      const e = g.entries.find((x) => x.id === id);
      expect(e, `${id} is not in the library projection`).toBeDefined();
      const kinds = new Set((e!.referencedBy ?? []).map((r) => r.kind));
      expect([...kinds].sort()).toEqual(["catalogue", "voices"]);
    }
  });

  test("an entry nothing references says so, rather than reading as fine", () => {
    // Measured 2026-09-21: the two arXiv entries are referenced by nothing.
    // Asserted as a PROPERTY rather than as those two ids — the finding is
    // that the field distinguishes them, and pinning the ids would fail the
    // day somebody cites one, which is the outcome we want.
    const none = g.entries.filter((e) => (e.referencedBy?.length ?? 0) === 0);
    for (const e of none) expect(e.referencedBy).toEqual([]);
    expect(g.entries.every((e) => Array.isArray(e.referencedBy))).toBe(true);
  });
});
