/**
 * A Tool node that names a command which does not run is unreachable through its
 * own declaration — and nothing checked that.
 *
 * ## The defect
 *
 * **Nine of the forty-four checkable `invoke.shell` values named a path that does
 * not exist.** Every one was missing the `cat-harness/` prefix, stale since the
 * instance moved under that directory, so `bun run scripts/ingest-document.ts`
 * failed with `Module not found`. `ingest-stdlib` and `ingest-extended` had been
 * unreachable through their own declared invocation for as long as the inversion
 * has been in, and `check:tools` was green throughout.
 *
 * `code-node-review` says why nobody expected the audit to catch it: *"what no
 * audit can tell you: whether the mechanism a Tool describes is the one that
 * runs"*. True of WHAT the command does — not of whether it exists, which is a
 * path and a filesystem. The honest split is to check the mechanical half and
 * leave the rest to a reviewer, which is what this is.
 *
 * ## Two roots, and getting it backwards would have broken twenty nodes
 *
 * `invoke.shell` resolves against the REPOSITORY — it is a command a caller
 * types, and `package.json` and `.github/` live at the repo root.
 * `invoke.*.module` resolves against the INSTANCE — it is loaded by this
 * instance's own server, same convention as `maintains.source`.
 *
 * All twenty `inProcess.module` values are instance-relative and correct. The
 * field's docstring said *"Repo-relative"* while giving `src/tools/workflow.ts`
 * as its example, which is instance-relative and is where the file actually is:
 * **the word was stale and the values were right.** A check that resolved both
 * against one root would have reported twenty false defects, or none of the nine
 * real ones.
 *
 * @module scripts/tests/tool-invoke-paths.test
 */
import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

import { unresolvedPaths } from "../check-tools.ts";
import { tools } from "../../tools/discover.js";

const INSTANCE = resolve(import.meta.dir, "../..");
const REPO = resolve(INSTANCE, "..");

describe("every declared path exists", () => {
  test("the corpus is clean", () => {
    // The assertion that would have failed before the fix, naming the offenders.
    expect(unresolvedPaths()).toEqual([]);
  });

  test("there are paths to check — a clean run over zero declarations is not coverage", () => {
    // Guards the assertion above from passing because nothing was examined.
    const withShell = tools().filter((t) => typeof t.invoke?.shell === "string");
    expect(withShell.length).toBeGreaterThan(20);
  });
});

describe("the two roots, asserted separately because conflating them breaks 20 nodes", () => {
  test("every `invoke.shell` path resolves against the REPOSITORY", () => {
    const broken: string[] = [];
    for (const t of tools()) {
      const shell = t.invoke?.shell;
      if (typeof shell !== "string") continue;
      const m = /^(?:bun|bunx) run ([^\s]+)/.exec(shell);
      const target = m?.[1] ?? (/^[.\w][\w./-]*\.(?:ts|sh|ya?ml)$/.test(shell) ? shell : undefined);
      if (target !== undefined && /\.(?:ts|sh|ya?ml)$/.test(target) && !existsSync(join(REPO, target))) {
        broken.push(`${t.id}: ${shell}`);
      }
    }
    expect(broken).toEqual([]);
  });

  test("every `inProcess.module` resolves against the INSTANCE, and NOT against the repo", () => {
    // The second half is the interesting one: it pins the convention, so a future
    // change that "helpfully" rewrites these to repo-relative fails here rather
    // than silently making twenty modules unloadable.
    const mods = tools()
      .map((t) => ({ id: t.id, mod: (t.invoke as { inProcess?: { module?: string } })?.inProcess?.module }))
      .filter((x): x is { id: string; mod: string } => typeof x.mod === "string");
    expect(mods.length).toBeGreaterThan(10);
    for (const { id, mod } of mods) {
      expect(existsSync(join(INSTANCE, mod)), `${id}: ${mod} under the instance`).toBe(true);
      expect(existsSync(join(REPO, mod)), `${id}: ${mod} must NOT be repo-relative`).toBe(false);
    }
  });
});

describe("what the check deliberately does NOT rule on", () => {
  test("a bare command is not reported as a missing path", () => {
    // `beans`, `jq` and the like are RUNTIME DEPENDENCIES, and `requires.runtime`
    // is where that claim lives. Reporting them as unresolved paths would make the
    // check unusable and would also be a lie — they are not paths.
    const bare = tools().filter((t) => {
      const sh = t.invoke?.shell;
      return typeof sh === "string" && !/^(?:bun|bunx) run /.test(sh) && !/\.(?:ts|sh|ya?ml)$/.test(sh);
    });
    expect(bare.length).toBeGreaterThan(0);
    const flagged = unresolvedPaths().map((u) => u.tool);
    for (const t of bare) expect(flagged).not.toContain(t.id);
  });

  test("a `package.json` script name is not treated as a path", () => {
    // `bun run kg:audit` names a script, not a file. Treating it as a path would
    // report every script-backed node as broken.
    const scripted = tools().filter((t) => {
      const sh = t.invoke?.shell;
      return typeof sh === "string" && /^bun run [a-z][\w-]*:/.test(sh);
    });
    expect(scripted.length).toBeGreaterThan(5);
    const flagged = unresolvedPaths().map((u) => u.tool);
    for (const t of scripted) expect(flagged).not.toContain(t.id);
  });
});
