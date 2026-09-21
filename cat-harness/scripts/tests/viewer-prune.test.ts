/**
 * Orphan subject pages — the pruner, and the sibling that must survive it.
 *
 * @module scripts/tests/viewer-prune
 * @graphNode none — a test
 *
 * Bean `ankg` names the pair to verify, because either alone proves nothing:
 * a planted orphan is pruned AND a hand-authored sibling survives. A pruner
 * that deleted the whole directory would pass the first and fail the second;
 * one that deleted nothing would pass the second and fail the first.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { findOrphans, isGeneratedViewer, pruneOrphans, viewerMarker } from "../viewer-prune.ts";

const GEN = "gen-schema-viz";

function page(dir: string, name: string, body: string): string {
  mkdirSync(join(dir, name), { recursive: true });
  const p = join(dir, name, "index.html");
  writeFileSync(p, body);
  return p;
}

/** A page as this generator writes them today. */
const generated = (subject: string): string =>
  `<!doctype html>\n${viewerMarker(GEN)}\n<html><script>var DATA_HREF = "x"; var SCOPE = "${subject}";</script></html>\n`;

/** A page as the generator wrote them BEFORE the marker existed. */
const legacy = (subject: string): string =>
  `<!doctype html>\n<html><script>var DATA_HREF = "x"; var SCOPE = "${subject}";</script></html>\n`;

function root(): string {
  return mkdtempSync(join(tmpdir(), "viewer-prune-"));
}

describe("findOrphans", () => {
  test("a subject still declared is not an orphan", () => {
    const dir = root();
    page(dir, "detangle", generated("detangle"));
    expect(findOrphans(dir, ["detangle"], GEN)).toEqual([]);
  });

  test("a subject no longer declared IS an orphan, and owned", () => {
    const dir = root();
    page(dir, "folio-assist-sci", generated("folio-assist-sci"));
    const found = findOrphans(dir, ["folio-assistant-sci"], GEN);
    expect(found).toHaveLength(1);
    expect(found[0]?.subject).toBe("folio-assist-sci");
    expect(found[0]?.kind).toBe("owned");
  });

  test("a page written BEFORE the marker is still recognised — the orphans predate it", () => {
    // Without this the pruner could never remove the very file that motivated
    // the bean: an orphan is never rewritten, so it never acquires the marker.
    const dir = root();
    page(dir, "old-subject", legacy("old-subject"));
    expect(findOrphans(dir, [], GEN)[0]?.kind).toBe("owned");
  });

  test("a HAND-AUTHORED page is reported as foreign, never owned", () => {
    const dir = root();
    page(dir, "hand-written", "<!doctype html>\n<html><body>somebody wrote this</body></html>\n");
    const found = findOrphans(dir, [], GEN);
    expect(found).toHaveLength(1);
    expect(found[0]?.kind).toBe("foreign");
  });

  test("a page written by the OTHER generator is foreign to this one", () => {
    // Only reachable if two generators ever publish under one root, which is
    // exactly when getting this wrong deletes somebody else's output. The
    // marker names its generator so the question has an answer.
    const dir = root();
    page(dir, "theirs", `<!doctype html>\n${viewerMarker("gen-library-viz")}\n<html>no constants here</html>\n`);
    expect(findOrphans(dir, [], GEN)[0]?.kind).toBe("foreign");
  });

  test("a directory with no index.html is not a candidate at all", () => {
    const dir = root();
    mkdirSync(join(dir, "empty"), { recursive: true });
    expect(findOrphans(dir, [], GEN)).toEqual([]);
  });

  test("a missing pages root is an empty answer, not a throw", () => {
    expect(findOrphans(join(root(), "nope"), [], GEN)).toEqual([]);
  });
});

describe("pruneOrphans — the pair the bean asks for", () => {
  test("the planted orphan is pruned and the hand-authored sibling survives", () => {
    const dir = root();
    const orphan = page(dir, "gone", generated("gone"));
    const sibling = page(dir, "hand-written", "<!doctype html>\n<html>mine</html>\n");
    const kept = page(dir, "detangle", generated("detangle"));

    const found = findOrphans(dir, ["detangle"], GEN);
    const removed = pruneOrphans(dir, found);

    expect(removed).toEqual(["gone"]);
    expect(existsSync(orphan)).toBe(false);
    // Both halves matter. A pruner that cleared the directory would pass the
    // line above and fail these two.
    expect(existsSync(sibling)).toBe(true);
    expect(existsSync(kept)).toBe(true);
  });

  test("the whole subject DIRECTORY goes, not just its page", () => {
    // A page left as an empty directory is still a URL that resolves.
    const dir = root();
    page(dir, "gone", generated("gone"));
    writeFileSync(join(dir, "gone", "stray.txt"), "x");
    pruneOrphans(dir, findOrphans(dir, [], GEN));
    expect(existsSync(join(dir, "gone"))).toBe(false);
  });

  test("a foreign orphan is left on disk even though it was reported", () => {
    const dir = root();
    const foreign = page(dir, "not-mine", "<!doctype html>\n<html>somebody else</html>\n");
    const found = findOrphans(dir, [], GEN);
    expect(found[0]?.kind).toBe("foreign");
    expect(pruneOrphans(dir, found)).toEqual([]);
    expect(readFileSync(foreign, "utf8")).toContain("somebody else");
  });
});

describe("isGeneratedViewer", () => {
  test("needs BOTH legacy constants, since either alone is a weaker claim", () => {
    expect(isGeneratedViewer('var DATA_HREF = "x";', GEN)).toBe(false);
    expect(isGeneratedViewer('var SCOPE = "x";', GEN)).toBe(false);
    expect(isGeneratedViewer('var DATA_HREF = "x"; var SCOPE = "y";', GEN)).toBe(true);
  });

  test("the marker names its generator", () => {
    expect(viewerMarker(GEN)).toContain(GEN);
    expect(isGeneratedViewer(viewerMarker(GEN), GEN)).toBe(true);
    expect(isGeneratedViewer(viewerMarker("other"), GEN)).toBe(false);
  });
});
