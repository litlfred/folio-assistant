/**
 * `viewer-declarations` tests about the WHOLE CHECKOUT, moved here from
 * `cat-harness/scripts/tests/viewer-declarations.test.ts` (bean `7zz1`, owner
 * ruling 2026-10-06 "Top-level instance"): each reads every instance's
 * declared viewers, which only the checkout holds. Standing alone, cat-harness
 * has none of it, and `check:cat-harness-standalone` collects every test in
 * that layer. The rest of that file's tests stay there; every path here is
 * composed from ORIGIN_DIR, the directory they were written in, so nothing
 * they read changed.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { declarationPathIn, instanceRootsIn, visualisationResolves } from "../cat-harness/schemas/cat-harness.js";
import { tools } from "../cat-harness/tools/discover.js";
import {
  viewersOf,
  type ViewedDirectory,
} from "../cat-harness/scripts/viewer-declarations.js";

/** The directory these tests were written in (`cat-harness/scripts/tests/`): every path below is composed from it exactly as it was before the move, so nothing they read changed. */
const ORIGIN_DIR = join(import.meta.dir, "../cat-harness/scripts/tests");

describe("the corpus: viewers are read from the pages (#1168 B7a-2b)", () => {
  const REPO = resolve(ORIGIN_DIR, "..", "..", "..");
  const kindsByTool = new Map(
    tools().flatMap((t) => (t.renders && t.renders.length > 0 ? [[t.id, t.renders] as const] : [])),
  );

  type Dir = ViewedDirectory;
  const dirs: { root: string; instance: string; dir: Dir }[] = [];
  for (const root of instanceRootsIn(REPO)) {
    const p = declarationPathIn(root);
    if (!p) continue;
    const decl = JSON.parse(readFileSync(p, "utf-8")) as { name?: string; directories?: Dir[] };
    // The DECLARED name, not the directory's: the checkout's root instance
    // (placement PR0) sits in a directory named after the clone.
    for (const dir of decl.directories ?? []) dirs.push({ root, instance: decl.name ?? root.split("/").pop()!, dir });
  }

  test("the corpus is non-empty, so the assertions below are not vacuous", () => {
    expect(dirs.length).toBeGreaterThan(0);
    expect(kindsByTool.size).toBeGreaterThan(0);
  });

  test("a directory declares its viewer only where no platform page draws it", () => {
    // The directory pointing at its viewer is the wrong-way arrow B7 removed.
    // It survives only where a page the platform draws cannot say it — each
    // with its reason — and an entry anywhere else is the arrow coming back.
    const ELSEWHERE: Record<string, string> = {
      // Declared by the checkout's ROOT instance since placement PR0 (bean `ejye`).
      "folio-assistant/fsh-guts": "never published — no published artefact may carry a path to it",
      "who-iris/who-iris-catalogue": "drawn by who-iris's own generator, which declares no tools graph",
      "folio-assistant-core/glossary": "drawn by folio-assistant-core's own generator",
    };
    const declaring = dirs
      .filter(({ dir }) => dir.coverage?.visualiser !== undefined)
      .map(({ instance, dir }) => `${instance}/${dir.id}`)
      .sort();
    expect(declaring).toEqual(Object.keys(ELSEWHERE).sort());
  });

  test("known directories resolve to the page their generator draws for them", () => {
    const resolveFor = (instance: string, id: string): string | undefined => {
      const row = dirs.find((d) => d.instance === instance && d.dir.id === id)!;
      return viewersOf(row.dir, row.root, REPO)[0]?.ref;
    };
    expect(resolveFor("cat-harness", "tools")).toBe("cat-harness/docs/tools/index.md");
    expect(resolveFor("cat-harness", "processes")).toBe("cat-harness/docs/processes/index.md");
    // `who-iris-library` was cat-harness's MIRROR of who-iris's own entry; the
    // mirror is gone (placement PR0) and the owner's entry resolves the same page.
    expect(resolveFor("who-iris", "library")).toBe("cat-harness/docs/cat-harness/library/who-iris/index.html");
    expect(resolveFor("cat-harness", "skills")).toBe("cat-harness/docs/cat-harness/auto-docs/index/skills/skills/index.html");
    expect(resolveFor("folio-assistant", "beans")).toBe("cat-harness/docs/beans/index.html");
    // An index page that merely LISTS a directory is not its viewer: the
    // auto-docs processes pages draw `cat-harness/processes` too, and lose.
    expect(resolveFor("folio-assistant", "fsh-guts")).toBe("cat-harness/docs/fsh-guts/index.md");
  });

  // "Exists" includes a page BUILT AT PUBLISH (bean 0b8c): never committed,
  // so it resolves by its declared writer rather than by the disk.
  test("every resolved page exists, or is built at publish by a writer that exists", () => {
    const missing = dirs.flatMap(({ root, instance, dir }) =>
      viewersOf(dir, root, REPO)
        .filter((v) => !visualisationResolves(v, (p) => existsSync(join(REPO, p))))
        .map((v) => `${instance}/${dir.id} → ${v.ref}`),
    );
    expect(missing).toEqual([]);
  });
});
