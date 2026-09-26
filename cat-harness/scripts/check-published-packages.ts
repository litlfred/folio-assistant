#!/usr/bin/env bun
/**
 * Every PUBLISHABLE package in this repository still builds.
 *
 * ## Why this exists
 *
 * `@litlfred/block-qa-schema` is the only package here that ships to npm, and
 * until 2026-09-26 **no workflow and no gate built it**. It is named in no
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
 * ## What it checks, and what it refuses to call a pass
 *
 * The set is DERIVED, never listed here: every `package.json` git accounts
 * for, minus the repository root, minus anything `private`. A package with no
 * `build` script is reported and skipped — that is a different question, not a
 * silent pass.
 *
 * **An empty set is a FINDING.** If the discovery finds nothing, this check
 * has examined nothing, and "no failures" would then be a statement about the
 * sweep rather than about the corpus — the vacuity rule `check:subgraphs` and
 * `check:context-emission` both keep.
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

export interface PublishablePackage {
  /** Repository-relative directory holding the `package.json`. */
  dir: string;
  name: string;
  /** `undefined` when the package declares no `build` script. */
  build: string | undefined;
  /** `undefined` when the package declares no `test` script. */
  test: string | undefined;
}

/**
 * The publishable packages git accounts for.
 *
 * Enumerated from the index rather than by walking the filesystem — the
 * `ramz` rule. A bare walk here would descend into every `node_modules/`
 * in the tree and report several thousand third-party packages as this
 * repository's own.
 */
export function publishablePackages(root: string = ROOT): PublishablePackage[] {
  const r = spawnSync("git", ["ls-files", "-z", "--", "*package.json"], {
    cwd: root,
    encoding: "utf-8",
  });
  if (r.error !== undefined || r.status !== 0) return [];

  const out: PublishablePackage[] = [];
  for (const rel of r.stdout.split("\0").filter((p) => p.length > 0)) {
    if (rel === "package.json") continue; // the repository itself is not published
    let raw: Record<string, unknown>;
    try {
      raw = JSON.parse(readFileSync(join(root, rel), "utf-8")) as Record<string, unknown>;
    } catch {
      continue;
    }
    if (raw.private === true || typeof raw.name !== "string") continue;
    const scripts = (raw.scripts ?? {}) as Record<string, string>;
    out.push({ dir: dirname(rel), name: raw.name, build: scripts.build, test: scripts.test });
  }
  return out;
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

  console.log(`Publishable packages — ${pkgs.length}, derived from the git index\n`);

  const failed: string[] = [];
  const skipped: string[] = [];
  for (const pkg of pkgs) {
    const abs = join(ROOT, pkg.dir);
    if (!existsSync(join(abs, "node_modules"))) {
      const install = spawnSync("bun", ["install"], { cwd: abs, encoding: "utf-8" });
      if (install.status !== 0) {
        failed.push(`${pkg.name}: \`bun install\` exited ${install.status ?? "?"}`);
        console.log(`  ✗ ${pkg.name}  (install failed)`);
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
        skipped.push(`${pkg.name} (${pkg.dir}) — no \`${step.name}\` script`);
        continue;
      }
      const r = spawnSync("bun", ["run", step.name], { cwd: abs, encoding: "utf-8" });
      if (r.status === 0) continue;
      ok = false;
      failed.push(`${pkg.name}: \`bun run ${step.name}\` exited ${r.status ?? "?"}`);
      console.log(`  ✗ ${pkg.name}  (${pkg.dir})  — ${step.name}`);
      // The error, not just the exit code: a reader must not have to re-run it.
      const tail = `${r.stdout ?? ""}${r.stderr ?? ""}`.trimEnd().split("\n").slice(-12);
      for (const line of tail) console.log(`        ${line}`);
    }
    if (ok) console.log(`  ✓ ${pkg.name}  (${pkg.dir})`);
  }

  if (skipped.length > 0) {
    console.log(`\n· ${skipped.length} script(s) a package does not declare, so none was run:`);
    for (const s of skipped) console.log(`    ${s}`);
    console.log("  Reported rather than passed over — whether a shipped package should");
    console.log("  build is a question this check does not answer, and silence would.");
  }

  if (failed.length > 0) {
    console.error(`\n✗ ${failed.length} publishable package(s) do not build:`);
    for (const f of failed) console.error(`    ${f}`);
    console.error(
      "\n  A package that ships to npm and is neither built nor tested in CI is one\n" +
        "  whose next dependency bump lands green and broken. That already happened —\n" +
        `  see the header of ${relative(ROOT, import.meta.path)}.`,
    );
    process.exit(1);
  }

  console.log(`\n✓ ${pkgs.length} publishable package(s) build and test.`);
}
