/**
 * `fsh-guts/` is not rendered, and that is checked rather than reasoned.
 *
 * Bean `folio-assistant-t0i3`. The directory's whole purpose is that content
 * can be KEPT without being PUBLISHED — so "it is not rendered" is the
 * property, not a side effect, and a property nothing checks is a property
 * that lasts until somebody moves a directory.
 *
 * The first version of this claim was an argument: `fsh-guts/` sits at the
 * repository root, Jekyll's source root is `docs/<stub>`, therefore it cannot
 * be picked up. True, and exactly the kind of reasoning that stops being true
 * silently — the site root has already moved once this month (bean `x4a6`,
 * `docs/` → `docs/<stub>`), and a future move that happened to put the two in
 * the same tree would republish the trashcan with nothing complaining.
 *
 * @module scripts/tests/fsh-guts-not-rendered.test
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { siteDirFor, repoRootFor } from "../../schemas/cat-harness.ts";

const ROOT = resolve(import.meta.dir, "../..");
const GUTS = "fsh-guts";

/** Every `source:` a publish workflow hands to the Jekyll build. */
function jekyllSourceRoots(): { file: string; source: string }[] {
  const out: { file: string; source: string }[] = [];
  const dir = join(repoRootFor(ROOT), ".github/workflows");
  for (const f of readdirSync(dir).filter((n) => n.endsWith(".yml") || n.endsWith(".yaml"))) {
    readFileSync(join(dir, f), "utf8")
      .split("\n")
      .forEach((line) => {
        const m = /^\s*source:\s*(\S+)\s*$/.exec(line);
        if (m) out.push({ file: f, source: m[1]!.replace(/^\.\//, "").replace(/\/$/, "") });
      });
  }
  return out;
}

describe("fsh-guts stays out of the render pipeline", () => {
  test("the directory exists at the repository root", () => {
    // If this fails the rest is vacuous — a test suite that passes because
    // its subject is missing is the shape of `pzdv` (two hard gates passing
    // over an empty corpus).
    expect(existsSync(join(ROOT, GUTS))).toBe(true);
  });

  test("at least one workflow declares a Jekyll source, so the check has teeth", () => {
    // Same guard, one level up: if the regex stops matching because the
    // workflows changed shape, every assertion below would pass over an
    // empty list.
    expect(jekyllSourceRoots().length).toBeGreaterThan(0);
  });

  test("no Jekyll source root contains it", () => {
    const offenders = jekyllSourceRoots()
      .filter(({ source }) => existsSync(join(ROOT, source, GUTS)))
      .map(({ file, source }) => `${file}: source '${source}' contains ${GUTS}/`);
    expect(offenders).toEqual([]);
  });

  test("it is not inside the declared site directory", () => {
    // The site root is `siteDirFor`'s answer, not a literal — so this keeps
    // holding if the site moves again, which is the case that motivated the
    // test.
    const site = siteDirFor(ROOT);
    expect(existsSync(join(ROOT, site, GUTS))).toBe(false);
  });

  test("its nodes declare themselves", () => {
    // A directory is a place to look; the file says what it is. Without this
    // the graph is duck-typed on location, which is the coincidence-not-
    // contract problem the bean and workflow stores already fixed.
    const proposals = join(ROOT, GUTS, "proposals");
    const files = existsSync(proposals)
      ? readdirSync(proposals).filter((f) => f.endsWith(".md"))
      : [];
    expect(files.length).toBeGreaterThan(0);

    const undeclared = files.filter(
      (f) => !readFileSync(join(proposals, f), "utf8").includes("$schema: folio-fsh-guts/v1"),
    );
    expect(undeclared).toEqual([]);
  });

  test("a moved node records where it came from", () => {
    // `movedFrom` is what stops a node here being an orphan — the reader can
    // otherwise see what it says and not where it used to live, which is the
    // abandonment-or-accident ambiguity the whole rule exists to prevent.
    const proposals = join(ROOT, GUTS, "proposals");
    const missing = readdirSync(proposals)
      .filter((f) => f.endsWith(".md"))
      .filter((f) => !readFileSync(join(proposals, f), "utf8").includes("movedFrom:"));
    expect(missing).toEqual([]);
  });
});
