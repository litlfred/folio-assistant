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
 * 2026-09-20 across the 20 modules that call `directoriesForGraph`: **10 threw**
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
      // Any of the three accessors — they share a registry, so a module that
      // reaches it through `directoryForGraph` can throw `unknown graph
      // kind` exactly as one calling the plural form can. Scanning for the
      // plural name alone would have quietly dropped every module bean `a02m`
      // migrated, which is the whole population this test exists to cover.
      const src = readFileSync(p, "utf-8");
      if (/\b(directoriesForGraph|directoryForGraph|instanceDirectoryForGraph)\(/.test(src)) {
        out.push(relative(ROOT, p));
      }
    }
  };
  for (const t of TREES) walk(join(ROOT, t));
  return out.sort();
}

/**
 * Budget for the two tests that spawn ONE SUBPROCESS PER DISCOVERED MODULE.
 *
 * Their cost grows with a population this file goes and finds, so bun's 5 s
 * default is a time bomb: it fires on whoever adds the module that tips the
 * total over, and a timeout is indistinguishable from the defect this file
 * exists to catch — a module that cannot resolve a declared directory.
 *
 * It fired on 2026-09-22, at **38 modules and 4 695 ms**, on a change that
 * added one unrelated script. Measured rather than guessed, and set an order
 * of magnitude above the measurement because the number that matters is the
 * one a slower CI runner sees, not the one this machine did.
 */
const SUBPROCESS_PER_MODULE_TIMEOUT_MS = 60_000;

describe("a module that resolves a declared directory can resolve one", () => {
  const modules = modulesResolvingADirectory();

  test("the scan found modules — otherwise nothing below proves anything", () => {
    // 20 at the time of writing. Asserting a floor rather than the number:
    // a count in a test is a claim that goes stale, and the failure this
    // guards is "the scan silently matched nothing".
    expect(modules.length).toBeGreaterThan(10);
  });

  test("IMPORTING one writes nothing — an entry point must be guarded", () => {
    // This test file caused the defect it now guards. It imports every module
    // that calls `directoriesForGraph`, and one of them —
    // `scripts/translation/simulate-translation.ts` — ended in a bare
    // `main();` rather than `if (import.meta.main) main();`. So the import
    // RAN the translation simulation, which writes four files under
    // `translations/fr/`, and from the commit that added this file a plain
    // `bun test` left the working tree modified. Whoever ran the suite
    // reverted them as somebody else's churn; I did, four times, before
    // measuring where they came from. Bean `07p7`.
    //
    // Compared BEFORE against AFTER rather than asserted clean: a tree that
    // was already dirty is not this test's business, and asserting clean
    // would make it fail for whoever is mid-edit — which is everyone.
    const status = (): string =>
      new TextDecoder()
        .decode(Bun.spawnSync(["git", "status", "--porcelain"], { cwd: ROOT }).stdout)
        .trim();
    const before = status();
    for (const m of modules) Bun.spawnSync(["bun", "-e", `import "./${m}";`], { cwd: ROOT });
    expect(status()).toBe(before);
  }, SUBPROCESS_PER_MODULE_TIMEOUT_MS);

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
            `import { directoriesForGraph, directoryForGraph, instanceDirectoryForGraph }` +
            ` from "./schemas/cat-harness.js";` +
            // All THREE accessors, because all three go through the same
            // registry and any of them can be the first call a module makes.
            // Testing only the plural one would leave the two added by bean
            // `a02m` un-probed in exactly the modules that now use them.
            `directoriesForGraph(".", "library"); directoryForGraph(".", "library");` +
            ` instanceDirectoryForGraph(".", "library");`,
        ],
        { cwd: ROOT },
      );
      const err = new TextDecoder().decode(r.stderr);
      if (err.includes("unknown graph kind")) broken.push(m);
    }
    expect(broken).toEqual([]);
  }, SUBPROCESS_PER_MODULE_TIMEOUT_MS);
});
