/**
 * `check:workflow-refs` audits bootstrap, and for a year it audited a typo.
 *
 * ## What happened
 *
 * `bootstrap` was added to that checker's instance list on 2026-09-19 with a
 * stated reason: *"a dangling `<…:skill ref>` in a diagram this checker never
 * opens is a broken reference reported as clean."* It was written as
 * `join(INSTANCE_ROOT, "bootstrap")` — and `INSTANCE_ROOT` is `cat-harness/`
 * while `bootstrap/` sits at the REPOSITORY root. So the path resolved to a
 * directory that has never existed, `workflowFiles` returned `[]`, and the
 * summary line printed *"2 instances"* beside the root's own diagram count.
 *
 * The change that fixed it is one expression. **What these tests pin is the
 * reason nobody noticed**: a checker looping over an empty set reports clean,
 * so the set being non-empty has to be asserted rather than assumed. That is
 * bean `dh4f` arriving inside the gate whose own docblock argues against
 * exactly this.
 *
 * ## Why this goes through the library
 *
 * `check-workflow-refs.ts` runs at module scope, so importing it would EXECUTE
 * it — the unguarded-entry-point defect `declared-directory-resolves.test.ts`
 * guards. So the property is asserted against `workflowFiles`, which is what
 * the checker calls, and the end-to-end behaviour is asserted by spawning the
 * script rather than importing it.
 *
 * @module cat-harness/scripts/tests/workflow-refs-instances
 */
import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { basename, join, resolve } from "node:path";

import { workflowFiles } from "../known-skills.js";
import { repoRootFor, siteDirFor } from "../../schemas/cat-harness.js";

const INSTANCE_ROOT = resolve(import.meta.dir, "..", "..");
const REPO = repoRootFor(INSTANCE_ROOT);
const BOOTSTRAP = join(REPO, "bootstrap");

const diagrams = (root: string): string[] =>
  workflowFiles(root).filter((f) => f.endsWith(".bpmn"));

describe("bootstrap is where the checker looks for it", () => {
  test("`bootstrap/` is at the REPOSITORY root, not under the instance root", () => {
    expect(existsSync(BOOTSTRAP)).toBe(true);
    // The exact composition that was wrong, asserted as wrong so a future
    // edit cannot quietly restore it.
    expect(existsSync(join(INSTANCE_ROOT, "bootstrap"))).toBe(false);
  });

  test("its diagrams resolve — a non-empty set, which is the whole point", () => {
    expect(diagrams(BOOTSTRAP).length).toBeGreaterThan(0);
  });

  /**
   * The load-bearing assertion. If the root's own walk already reached
   * bootstrap's diagrams, listing bootstrap separately would be redundant and
   * this checker's two-instance design pointless — so the fact that it does NOT
   * is what makes the second entry necessary. It does not, deliberately:
   * declaring `bootstrap/processes/` at the root re-introduces the 2026-09-19
   * leak of 88 references that `instance-graph-isolation.test.ts` guards
   * (beans `pve3`, `sa8y`).
   */
  test("the root's own walk does NOT reach them, which is why the second entry exists", () => {
    const rootDiagrams = diagrams(INSTANCE_ROOT);
    const bootstrapDiagrams = diagrams(BOOTSTRAP);
    expect(rootDiagrams.length).toBeGreaterThan(10); // anti-vacuity on the control
    for (const b of bootstrapDiagrams) expect(rootDiagrams).not.toContain(b);
  });

  /**
   * Dependency instances ARE reached by the root's walk, and stating it here
   * stops the next reader over-generalising from bootstrap. Bean `bjzs` claimed
   * *"render:bpmn never lists a nested diagram"*; measured, two of the three
   * nested instances are reached and only bootstrap is not, because only
   * bootstrap's process directory is undeclared at the root.
   */
  test("a DEPENDENCY instance's diagrams are reached — the gap is bootstrap alone", () => {
    const rootDiagrams = diagrams(INSTANCE_ROOT);
    const nested = rootDiagrams.filter((f) => !f.startsWith(`${INSTANCE_ROOT}/`));
    expect(nested.length).toBeGreaterThan(0);
  });
});

describe("the checker, run as a command", () => {
  test("exits 0 on this tree and counts BOTH instances' diagrams", async () => {
    const p = Bun.spawn(["bun", "run", "check:workflow-refs"], {
      cwd: REPO,
      stdout: "pipe",
      stderr: "pipe",
    });
    const out = await new Response(p.stdout).text();
    expect(await p.exited).toBe(0);

    const m = /(\d+) skills known across (\d+) instances, (\d+) diagrams/.exec(out);
    expect(m, `summary line not found in:\n${out.slice(0, 400)}`).not.toBeNull();
    const [, , instances, files] = m!;

    // Derived, never hardcoded: a literal here would go stale the day a
    // diagram is added, and a stale expected count teaches the next agent to
    // edit the test instead of reading it.
    const expected = diagrams(INSTANCE_ROOT).length + diagrams(BOOTSTRAP).length;
    expect(Number(instances)).toBe(2);
    expect(Number(files)).toBe(expected);
  }, 120_000);
});

describe("render:bpmn covers the same two instances", () => {
  /**
   * Measured 2026-09-26, and this was a live defect rather than a gap: all three
   * of bootstrap's SVGs already existed in `docs/assets/img/workflows/` and were
   * referenced by published pages under `docs/processes/`, their sources all
   * changed on 2026-09-24, and every SVG was from 2026-09-20. Four days stale on
   * the published site, with no gate able to say so — `render:bpmn:check` judged
   * 71 diagrams and named none of bootstrap's.
   */
  test("every bootstrap diagram has a rendered SVG in the site assets", () => {
    // `siteDirFor`, never the literal `docs` — the site root has moved twice
    // (beans `x4a6`, `wggr`) and `check:site-dir` refuses a hardcoded one. It
    // caught this line, which is the gate doing exactly its job.
    const assets = join(INSTANCE_ROOT, siteDirFor(INSTANCE_ROOT), "assets", "img", "workflows");
    for (const f of diagrams(BOOTSTRAP)) {
      const svg = join(assets, `${basename(f, ".bpmn")}.svg`);
      expect(existsSync(svg), `${basename(svg)} is missing — run \`bun run render:bpmn\``).toBe(true);
    }
  });

  /**
   * The invariant `collidingBasenames` guards, asserted here instead of against
   * that function directly.
   *
   * `render-bpmn.ts` cannot be imported: it has top-level `await`s that launch a
   * browser and write files, so a test that imported it to reach one pure helper
   * would render the whole corpus as a side effect — the unguarded-entry-point
   * defect. Guarding that module is a worthwhile separate change; until then the
   * property is checked from the same inputs the script uses, which fails on a
   * real collision whether or not the script's own report fires.
   */
  test("no two diagrams across both instances share a basename", () => {
    const all = [...diagrams(INSTANCE_ROOT), ...diagrams(BOOTSTRAP)];
    const names = all.map((f) => basename(f, ".bpmn"));
    const dupes = names.filter((n, i) => names.indexOf(n) !== i);
    expect([...new Set(dupes)]).toEqual([]);
    expect(all.length).toBeGreaterThan(10); // anti-vacuity
  });
});
