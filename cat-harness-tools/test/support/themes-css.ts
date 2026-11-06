/**
 * The harness's `themes.css`, built here when the checkout does not have it.
 *
 * litlfred/cat-harness#371 stopped committing it: the stylesheet (and the
 * `_data/instance-themes.json` written beside it) is BUILT AT PUBLISH by
 * `themes:css` (`scripts/gen-themes-css.ts`). This repository's PR checks run
 * `bun test` without `derive:publish`, and the e2e specs read the stylesheet at
 * module load — before `e2e-global-setup.ts` runs — so a spec that reads it
 * must build it when it is absent, the way `todos-repo-root.test.ts` builds
 * `todos/index.md` (#411). What is under test is then what the deploy emits,
 * never a committed copy that could agree with the test and disagree with what
 * ships.
 *
 * A generator that cannot run here (a standalone layer, with no checkout of
 * instances beside it) is not itself a failure: the caller then fails on the
 * missing file, under its own name.
 *
 * @module test/support/themes-css
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

import { siteFileFor } from "../../schemas/kg/cat-harness.ts";
import { TOOLS_ROOT } from "../../scripts/lib/roots.ts";

/** The generator, in this layer — `TOOLS_ROOT`, since Playwright loads specs under Node, where `import.meta.dir` is undefined. */
const GENERATOR = join(TOOLS_ROOT, "scripts", "gen-themes-css.ts");

/**
 * The absolute path of `themes.css` for the harness rooted at `root`, built
 * first if it is missing. Building is synchronous so a spec can call this at
 * module load; the file may still be absent afterwards (see the module note).
 */
export function ensureThemesCss(root: string): string {
  const path = join(root, siteFileFor(root, "assets/css/themes.css"));
  if (!existsSync(path)) {
    spawnSync("bun", [GENERATOR, `--harness=${root}`], { cwd: root, encoding: "utf-8", stdio: "inherit" });
  }
  return path;
}
