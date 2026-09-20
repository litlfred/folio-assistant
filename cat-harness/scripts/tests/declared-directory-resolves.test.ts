/**
 * Every module that resolves a DECLARED directory can actually resolve one.
 *
 * ## What went wrong
 *
 * `folio` is registered into the graph-kind registry by an IMPORT SIDE EFFECT
 * at the bottom of `schemas/folio-graph-kind.ts`, and that module's own
 * comment says why: *"Registering on import is what makes `folio` available to
 * anything that imports core. The harness alone never sees it."* The layering
 * is deliberate — `folio` is CORE's kind and the harness must not know it.
 *
 * The consequence is not deliberate. Whether a script works depends on whether
 * something in its import graph happened to pull that module in. Measured
 * 2026-09-20 across the 20 modules that call `directoryForGraph`: **10 threw**
 * `unknown graph kind "folio"` on their first call — among them
 * `scripts/narratives.ts`, the human review queue, and `src/tools/translation.ts`,
 * an MCP tool.
 *
 * ## Why nothing caught it
 *
 * Every gate passed. All 3 298 tests passed. `check:harness-dirs`,
 * `kg:schema:check` and `docs:harness:check` — the three that
 * `schemas/cat-harness.ts` explicitly predicts will throw when a `folio`
 * directory entry is added — all passed, because each runs inside a process
 * that reaches the registration transitively.
 *
 * A test suite has the same problem in a sharper form: one module importing
 * core registers `folio` for the *whole process*, so every module tested after
 * it passes regardless. That is why this spawns a FRESH SUBPROCESS per module.
 * Testing them in-process would be a check that cannot fail.
 */
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "../..");

/** Source trees that hold runnable modules. Not `test/` — those are not entry points. */
const TREES = ["scripts", "content", "src"];

/** Every module that resolves a declared directory, found rather than listed. */
function modulesResolvingADirectory(): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.startsWith(".") || e === "node_modules") continue;
      const p = join(dir, e);
      if (statSync(p).isDirectory()) {
        walk(p);
        continue;
      }
      if (!e.endsWith(".ts") || e.includes(".test.")) continue;
      if (readFileSync(p, "utf-8").includes("directoryForGraph(")) {
        out.push(relative(ROOT, p));
      }
    }
  };
  for (const t of TREES) walk(join(ROOT, t));
  return out.sort();
}

describe("a module that resolves a declared directory can resolve one", () => {
  const modules = modulesResolvingADirectory();

  test("the scan found modules — otherwise nothing below proves anything", () => {
    // 20 at the time of writing. Asserting a floor rather than the number:
    // a count in a test is a claim that goes stale, and the failure this
    // guards is "the scan silently matched nothing".
    expect(modules.length).toBeGreaterThan(10);
  });

  test("each one resolves `library` in a FRESH process, without throwing", () => {
    // Fresh process per module is the whole point. In one process the first
    // module to reach core registers `folio` for all of them, and this test
    // becomes incapable of failing — the exact shape of the defect it exists
    // to catch.
    const broken: string[] = [];
    for (const m of modules) {
      const r = Bun.spawnSync(
        [
          "bun",
          "-e",
          `import "./${m}";` +
            `import { directoryForGraph } from "./schemas/cat-harness.js";` +
            `directoryForGraph(".", "library");`,
        ],
        { cwd: ROOT },
      );
      const err = new TextDecoder().decode(r.stderr);
      if (err.includes("unknown graph kind")) broken.push(m);
    }
    expect(broken).toEqual([]);
  });
});
