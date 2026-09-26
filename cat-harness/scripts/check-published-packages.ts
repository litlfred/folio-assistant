#!/usr/bin/env bun
/**
 * Every PUBLISHABLE package in this repository still builds and still passes
 * its own tests — in BOTH languages it ships.
 *
 * ## Why this exists
 *
 * `@litlfred/block-qa-schema` is the only package here that ships, and until
 * 2026-09-26 **no workflow and no gate built it**. It is named in no
 * `.github/workflows/*.yml`, and the root `package.json` declares no
 * `workspaces`, so its devDependencies were never installed on a runner and
 * its `build` and `test` scripts were never run.
 *
 * The cost was paid rather than predicted. PR #914 bumped its `typescript`
 * from 5.9.3 to **7.0.2** and passed **ten** CI checks, not one of which read
 * the file it changed. Merged, the bump left the package unbuildable:
 *
 *     TypeError: Cannot read properties of undefined
 *       (reading 'useCaseSensitiveFileNames')
 *
 * — `tsup --dts` delegating to `rollup-plugin-dts`, which bundles its own
 * TypeScript 5.7.3 and reaches into compiler internals TypeScript 7 changed.
 * Measured with the control: 5.9.3 builds, 6.x fails, 7.0.2 fails, and
 * TypeScript 7's own `tsc` emits the same declarations without complaint.
 * Bean `rsi6`.
 *
 * ## The package has TWO halves, and only one of them was reachable
 *
 * That npm package ships a Python half beside it — `python/block_qa_schema/`
 * and an 18-test suite at `tests/test_python.py` — which ran nowhere either.
 * Bean `1s5s`. The obvious repair was to widen the `python` job's test glob
 * (`cat-harness/scripts/tests/*.test.py`), and it does not work: that step
 * runs each file as a BARE SCRIPT (`python3 "$t"`) and installs no pytest,
 * while `test_python.py` has no `__main__` runner and uses `pytest.raises`
 * and `@pytest.mark.parametrize`. Run that way it either dies on `import
 * pytest` or — with pytest present — defines eighteen functions, executes
 * none, and **exits 0**. A widened glob would therefore have reported a pass
 * it never computed, which is the `5rfy` gate-that-never-fires shape this
 * whole line of work exists to close.
 *
 * So the question stays in one place: this check owns "the packages this
 * repository ships work", and asks it of each half in that half's own terms.
 *
 * ## What it checks, and what it refuses to call a pass
 *
 * The set is DERIVED, never listed here: every `package.json` and every
 * `pyproject.toml` git accounts for, minus the repository root, minus
 * anything `private`. One directory shipping in both ecosystems is TWO
 * entries and two verdicts, because the halves fail independently — that is
 * the whole finding above.
 *
 * Nothing about a runner is hardcoded. A JavaScript half declares its steps
 * as `scripts.build` / `scripts.test`; a Python half declares pytest by
 * carrying `[tool.pytest.ini_options]`, and declares its own test
 * dependencies under `[project.optional-dependencies] test`, which is what
 * gets installed. A package that declares neither is REPORTED and skipped —
 * that is a different question, not a silent pass.
 *
 * **An empty set is a FINDING.** If the discovery finds nothing, this check
 * has examined nothing, and "no failures" would then be a statement about the
 * sweep rather than about the corpus — the vacuity rule `check:subgraphs` and
 * `check:context-emission` both keep. **A missing interpreter is a FINDING
 * too**, for the same reason: "python3 is not here" and "the Python half
 * passed" must never render identically.
 *
 * Usage:
 *   bun run check:published-packages
 *
 * @covers cat-harness
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..", "..");

/** Which registry a half ships to, and therefore whose tooling runs it. */
export type Ecosystem = "npm" | "pypi";

export interface PublishablePackage {
  /** Repository-relative directory holding the manifest. */
  dir: string;
  name: string;
  ecosystem: Ecosystem;
  /** `undefined` when the half declares no build step. */
  build: string | undefined;
  /** `undefined` when the half declares no test step. */
  test: string | undefined;
}

/** The manifests git accounts for, for one filename. */
function manifests(root: string, glob: string): string[] {
  const r = spawnSync("git", ["ls-files", "-z", "--", glob], { cwd: root, encoding: "utf-8" });
  if (r.error !== undefined || r.status !== 0) return [];
  return r.stdout.split("\0").filter((p) => p.length > 0);
}

/**
 * The publishable packages git accounts for, in every ecosystem this
 * repository ships to.
 *
 * Enumerated from the index rather than by walking the filesystem — the
 * `ramz` rule. A bare walk here would descend into every `node_modules/`
 * and every `.venv/` in the tree and report several thousand third-party
 * packages as this repository's own.
 */
export function publishablePackages(root: string = ROOT): PublishablePackage[] {
  const out: PublishablePackage[] = [];

  for (const rel of manifests(root, "*package.json")) {
    if (rel === "package.json") continue; // the repository itself is not published
    let raw: Record<string, unknown>;
    try {
      raw = JSON.parse(readFileSync(join(root, rel), "utf-8")) as Record<string, unknown>;
    } catch {
      continue;
    }
    if (raw.private === true || typeof raw.name !== "string") continue;
    const scripts = (raw.scripts ?? {}) as Record<string, string>;
    out.push({
      dir: dirname(rel),
      name: raw.name,
      ecosystem: "npm",
      build: scripts.build,
      test: scripts.test,
    });
  }

  for (const rel of manifests(root, "*pyproject.toml")) {
    let raw: Record<string, unknown>;
    try {
      raw = Bun.TOML.parse(readFileSync(join(root, rel), "utf-8")) as Record<string, unknown>;
    } catch {
      continue;
    }
    const project = (raw.project ?? {}) as Record<string, unknown>;
    if (typeof project.name !== "string") continue;
    // PEP 621 has no `private` flag; the Python convention for "never
    // published" is a Private classifier, so honour that rather than
    // inventing a field nobody writes.
    const classifiers = Array.isArray(project.classifiers) ? (project.classifiers as string[]) : [];
    if (classifiers.some((c) => c.startsWith("Private ::"))) continue;
    // Nothing about the runner is assumed: a package declares pytest by
    // carrying its config table. Absent, this reports rather than guesses.
    const tool = (raw.tool ?? {}) as Record<string, unknown>;
    const declaresPytest = Object.hasOwn(tool, "pytest");
    out.push({
      dir: dirname(rel),
      name: project.name,
      ecosystem: "pypi",
      // Deliberately undeclared: whether a WHEEL BUILD belongs in this gate is
      // a real question (it needs `python3 -m build` on the runner) and this
      // check does not answer it — so it is reported in the skipped channel
      // rather than passed over. Bean `872t`, which carries the argument that
      // matters: the tests import from `pythonpath`, not from the built wheel,
      // so a wheel whose `force-include`d schemas went missing would pass
      // every test there is. That is the `rsi6` shape — the thing under test
      // is not the thing that ships.
      build: undefined,
      test: declaresPytest ? "pytest" : undefined,
    });
  }

  return out;
}

/**
 * Make a Python half runnable, or say why not.
 *
 * Mirrors the `bun install` the npm half gets. The probe comes first so a
 * satisfied environment costs one interpreter start rather than a pip
 * resolution; the install reads the package's OWN `[project.optional-
 * dependencies] test`, so this function names no dependency of its own.
 */
function preparePython(abs: string): { ok: true } | { ok: false; why: string } {
  const probe = spawnSync("python3", ["-c", "import pytest, sys"], { cwd: abs, encoding: "utf-8" });
  if (probe.error !== undefined) {
    return { ok: false, why: `no \`python3\` on PATH — ${probe.error.message}` };
  }
  if (probe.status === 0) return { ok: true };
  const install = spawnSync("python3", ["-m", "pip", "install", "--quiet", "-e", ".[test]"], {
    cwd: abs,
    encoding: "utf-8",
  });
  if (install.error !== undefined || install.status !== 0) {
    const tail = `${install.stdout ?? ""}${install.stderr ?? ""}`.trimEnd().split("\n").slice(-6);
    return { ok: false, why: `\`pip install -e .[test]\` exited ${install.status ?? "?"}\n${tail.map((l) => `        ${l}`).join("\n")}` };
  }
  return { ok: true };
}

if (import.meta.main) {
  const pkgs = publishablePackages();

  // Vacuity before the verdict, for the same reason every sweep here does it.
  if (pkgs.length === 0) {
    console.error(
      "\n✗ FOUND NO PUBLISHABLE PACKAGE. This is not a pass: nothing was examined.\n" +
        "  Either the discovery is broken, or this repository stopped publishing —\n" +
        "  and those two need telling apart before anything here reads as green.",
    );
    process.exit(1);
  }

  const dirs = new Set(pkgs.map((p) => p.dir)).size;
  console.log(
    `Publishable packages — ${pkgs.length} across ${dirs} director${dirs === 1 ? "y" : "ies"},` +
      ` derived from the git index\n`,
  );

  const failed: string[] = [];
  const skipped: string[] = [];
  for (const pkg of pkgs) {
    const abs = join(ROOT, pkg.dir);
    const label = `${pkg.name} [${pkg.ecosystem}]`;

    if (pkg.ecosystem === "npm") {
      if (!existsSync(join(abs, "node_modules"))) {
        const install = spawnSync("bun", ["install"], { cwd: abs, encoding: "utf-8" });
        if (install.status !== 0) {
          failed.push(`${label}: \`bun install\` exited ${install.status ?? "?"}`);
          console.log(`  ✗ ${label}  (install failed)`);
          continue;
        }
      }
    } else if (pkg.test !== undefined) {
      const ready = preparePython(abs);
      if (!ready.ok) {
        // NOT a skip. An absent interpreter and a passing suite must never
        // render the same, or this gate reports on itself instead of on the
        // corpus — the `5rfy` shape, and the reason `1s5s` exists.
        failed.push(`${label}: ${ready.why}`);
        console.log(`  ✗ ${label}  (${pkg.dir})  — could not prepare`);
        continue;
      }
    }

    // BUILD then TEST. A package that compiles and does not work is the state
    // this gate was built during: `rsi6` fixed the build, and the `test`
    // script it left behind had never passed in the package's life — `vitest
    // run` reporting "No test files found, exiting with code 1". Checking only
    // the build would have gone green over exactly that.
    const steps: Array<{ name: "build" | "test"; declared: string | undefined }> = [
      { name: "build", declared: pkg.build },
      { name: "test", declared: pkg.test },
    ];
    let ok = true;
    for (const step of steps) {
      if (step.declared === undefined) {
        // Reported, never passed over: whether a shipped package should have
        // this script is a question this check does not answer, and silence
        // would answer it.
        skipped.push(`${label} (${pkg.dir}) — no \`${step.name}\` step declared`);
        continue;
      }
      const r =
        pkg.ecosystem === "npm"
          ? spawnSync("bun", ["run", step.name], { cwd: abs, encoding: "utf-8" })
          : spawnSync("python3", ["-m", "pytest", "-q"], { cwd: abs, encoding: "utf-8" });
      if (r.status === 0) continue;
      ok = false;
      const how = pkg.ecosystem === "npm" ? `bun run ${step.name}` : "python3 -m pytest";
      // pytest's exit 5 is "collected nothing", which is the `vitest run`
      // false-green in another costume — name it rather than leave a bare
      // exit code for a reader to look up.
      const gloss = pkg.ecosystem === "pypi" && r.status === 5 ? " — COLLECTED NO TESTS" : "";
      failed.push(`${label}: \`${how}\` exited ${r.status ?? "?"}${gloss}`);
      console.log(`  ✗ ${label}  (${pkg.dir})  — ${step.name}${gloss}`);
      // The error, not just the exit code: a reader must not have to re-run it.
      const tail = `${r.stdout ?? ""}${r.stderr ?? ""}`.trimEnd().split("\n").slice(-12);
      for (const line of tail) console.log(`        ${line}`);
    }
    if (ok) console.log(`  ✓ ${label}  (${pkg.dir})`);
  }

  if (skipped.length > 0) {
    console.log(`\n· ${skipped.length} step(s) a package does not declare, so none was run:`);
    for (const s of skipped) console.log(`    ${s}`);
    console.log("  Reported rather than passed over — whether a shipped package should");
    console.log("  build is a question this check does not answer, and silence would.");
  }

  if (failed.length > 0) {
    console.error(`\n✗ ${failed.length} publishable package half/halves do not build or pass:`);
    for (const f of failed) console.error(`    ${f}`);
    console.error(
      "\n  A package that ships and is neither built nor tested in CI is one whose\n" +
        "  next dependency bump lands green and broken. That already happened —\n" +
        `  see the header of ${relative(ROOT, import.meta.path)}.`,
    );
    process.exit(1);
  }

  console.log(`\n✓ ${pkgs.length} publishable package half/halves build and test.`);
}
