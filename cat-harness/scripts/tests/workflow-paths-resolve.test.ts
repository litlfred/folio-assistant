/**
 * A path a PLATFORM workflow names must exist.
 *
 * ## Why this exists
 *
 * The `cat-harness` move (bean `wggr`) broke CI five times in a row, each time
 * a literal path in a workflow that no scan in this repository could see:
 * `find content …`, `cp -rT test/results/witnesses`, `bun run scripts/x.ts`,
 * a `bun -e` inline eval importing `./schemas/cat-harness.ts`, and a typedoc
 * entry-point list. Every one was found by pushing and reading a CI log, which
 * costs a round trip and only reports the FIRST failure in each job.
 *
 * `check:declared-paths` scans `.ts`. `site-dir-single-answer` scans `.ts` and
 * `.gitignore`. Neither reaches YAML, and YAML is where a path is most likely
 * to rot unnoticed: a workflow's outcome is invisible from a checkout, which
 * is the `xom7` defect this repository is named after having.
 *
 * ## Why it is scoped to a LIST of workflows rather than all of them
 *
 * Most workflows here are VENDORED BY FOLIOS. `lean_ci.yml` names
 * `folio/<paper>/lean/lakefile.toml`, `snappea_wasm.yml` names
 * `scripts/build-gmp.sh`, `wrapper-tests.yml` names `src/rust/` — none of
 * those exists here and none should. Asserting over them would demand that the
 * platform contain a folio's tree, which is the boundary this repository most
 * cares about keeping.
 *
 * So the list below is workflows that run THIS repository's own code. Adding
 * one is a deliberate act, and a workflow left off is simply unchecked — which
 * is a weaker guarantee honestly stated rather than a strong one that is false.
 *
 * ## This is NOT a duplicate of `check:workflow-paths`, and must not be merged into it
 *
 * The two look like one property stated twice, and they are not. Measured
 * 2026-09-20 by breaking each in turn and running both:
 *
 * | probe | this test | `check:workflow-paths` |
 * |---|---|---|
 * | a `cp` argument naming a missing dir, in an ALLOWLISTED workflow | **caught** | missed |
 * | `bun run scripts/does-not-exist.ts` in `publish.yml` (not allowlisted) | missed | **caught** |
 *
 * They are complementary on two orthogonal axes. This test covers **4
 * workflows** but **every path-shaped token on a line** — a `cp` argument, a
 * `paths:` filter entry, a typedoc entry list, a `bun -e` string — which is
 * where four of the five `wggr` failures actually lived.
 * `check:workflow-paths` covers **all 38 workflows** but only **script
 * invocations**, and models the cwd (job defaults, `working-directory`, `cd`,
 * `--cwd`, checkout `path:`) so it can tell a working workflow from a broken
 * spelling.
 *
 * Neither subsumes the other. Deleting either loses a class of defect that no
 * scan in this repository would then see, and a workflow's outcome is
 * invisible from a checkout — which is the `xom7` defect both exist for.
 *
 * @module cat-harness/scripts/tests/workflow-paths-resolve.test
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { repoRootFor } from "../../schemas/cat-harness.js";

const REPO = repoRootFor(resolve(import.meta.dir, "../.."));

/** Workflows that run THIS repository's code. See the module note. */
const PLATFORM_WORKFLOWS = [
  "docs-site.yml",
  "feature-staging.yml",
  "jsonld-gen-check.yml",
  "code-quality-gates.yml",
];

/** Top-level directories the move relocated under the instance. */
const MOVED = [
  "adapters", "blueprint", "computations", "content", "deploy", "home_page",
  "latex", "library", "ns", "schemas", "scripts", "simulators", "skills",
  "src", "test", "translations", "types", "ui", "uploads", "viewer", "voices",
];

/**
 * A path-shaped token naming a moved directory, anywhere on a line.
 *
 * Deliberately blunt: it matches inside `bun run …`, a `cp` argument, a
 * `paths:` list item, a typedoc entry point and a `bun -e` string alike,
 * because the five real failures were spread across exactly those five shapes
 * and a rule per shape is a rule per shape somebody forgot.
 */
const TOKEN = new RegExp(
  // `\.?/?` so a `./`-prefixed path is caught. The lookbehind excluded `.`,
  // which meant `cp ./ns/content/v1.jsonld` slipped past on this guard's first
  // outing — a real broken path, in a workflow already on the list. A guard
  // that misses the shape it was written for is worse than none, so this is
  // the one place to be generous.
  String.raw`(?<![\w/\-])\.?/?((?:${MOVED.join("|")})/[\w./*\-]*)`,
  "g",
);

/** Path segments that mean "not a literal file to check". */
const SKIP = /\$\{\{|\*|__|\.\.\./;

describe("a platform workflow names paths that exist", () => {
  for (const wf of PLATFORM_WORKFLOWS) {
    test(wf, () => {
      const file = join(REPO, ".github/workflows", wf);
      expect(existsSync(file)).toBe(true); // a renamed workflow is not a pass
      const missing: string[] = [];
      readFileSync(file, "utf-8")
        .split("\n")
        .forEach((line, i) => {
          // Comments explain history and necessarily name old paths.
          if (line.trimStart().startsWith("#")) return;
          const code = line.split(" #")[0]!;
          for (const m of code.matchAll(TOKEN)) {
            const p = m[1]!.replace(/[.,;:'"`)\]]+$/, "");
            if (SKIP.test(p) || p.endsWith("/")) continue;
            if (existsSync(join(REPO, p))) continue;
            missing.push(`${wf}:${i + 1}: ${p}`);
          }
        });
      expect(missing).toEqual([]);
    });
  }
});
