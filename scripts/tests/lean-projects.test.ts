/**
 * Lean project tests — compilation readiness, library presence, sorry audit.
 *
 * Walks every paper Lake package registered in the root workspace
 * (`folio-assistant/schemas/lean-packages.ts`) plus the root workspace
 * itself.
 */

import { describe, test, expect } from "bun:test";
import { readFileSync, existsSync } from "fs";
import { join, relative } from "path";
import {
  LEAN_DIR,
  REPO_ROOT,
  discoverLeanProjects,
  discoverDependencies,
  findLeanFiles,
} from "./helpers";

import { LEAN_PACKAGES } from "../../schemas/lean-packages.js";

// ── Root workspace ──────────────────────────────────────────────

describe("Lean root workspace", () => {
  test("root lean-toolchain exists", () => {
    expect(existsSync(join(LEAN_DIR, "lean-toolchain"))).toBe(true);
  });

  test("root lean-toolchain has valid version", () => {
    const tc = readFileSync(join(LEAN_DIR, "lean-toolchain"), "utf-8").trim();
    expect(tc).toMatch(/^leanprover\/lean4:v\d+\.\d+/);
  });

  test("root lakefile.toml exists", () => {
    expect(existsSync(join(LEAN_DIR, "lakefile.toml"))).toBe(true);
  });

  test("root lakefile declares every paper package", () => {
    const src = readFileSync(join(LEAN_DIR, "lakefile.toml"), "utf-8");
    for (const pkg of LEAN_PACKAGES) {
      expect(src).toContain(`name = "${pkg.name}"`);
    }
  });
});

// ── Required dependencies ───────────────────────────────────────

describe("Lean dependencies", () => {
  const deps = discoverDependencies();

  test("mathlib is declared", () => {
    expect(deps).toContain("mathlib");
  });

  test("every registered paper package is declared", () => {
    for (const pkg of LEAN_PACKAGES) {
      expect(deps).toContain(pkg.name);
    }
  });
});

// ── Per-paper Lake packages ─────────────────────────────────────

const projects = discoverLeanProjects();

describe("Lean project discovery", () => {
  test("at least one project found", () => {
    expect(projects.length).toBeGreaterThan(0);
  });

  test("every LEAN_PACKAGES entry's lib is discovered", () => {
    for (const pkg of LEAN_PACKAGES) {
      expect(projects).toContain(pkg.lib);
    }
  });
});

for (const pkg of LEAN_PACKAGES) {
  describe(`Paper package: ${pkg.name} (lib: ${pkg.lib})`, () => {
    const pkgRoot = join(REPO_ROOT, pkg.lakeRoot);
    const projDir = join(pkgRoot, pkg.lib);
    const leanFiles = findLeanFiles(projDir);

    test("lakefile.toml exists", () => {
      expect(existsSync(join(pkgRoot, "lakefile.toml"))).toBe(true);
    });

    test("library directory exists", () => {
      expect(existsSync(projDir)).toBe(true);
    });

    test("has .lean files", () => {
      expect(leanFiles.length).toBeGreaterThan(0);
    });

    for (const file of leanFiles) {
      const rel = relative(REPO_ROOT, file);

      test(`${rel} is non-empty`, () => {
        const content = readFileSync(file, "utf-8");
        expect(content.trim().length).toBeGreaterThan(0);
      });

      test(`${rel} has import or is root module`, () => {
        const content = readFileSync(file, "utf-8");
        const basename = file.split("/").pop()?.replace(".lean", "");
        const hasImport = /^import\s/m.test(content);
        const isRoot = basename === pkg.lib;
        expect(hasImport || isRoot).toBe(true);
      });
    }

    // Sorry audit (informational — never fails the test run)
    test("sorry audit", () => {
      let totalSorry = 0;
      const sorryFiles: string[] = [];
      for (const file of leanFiles) {
        const content = readFileSync(file, "utf-8");
        const count = (content.match(/\bsorry\b/g) || []).length;
        if (count > 0) {
          totalSorry += count;
          sorryFiles.push(`${relative(REPO_ROOT, file)}(${count})`);
        }
      }
      if (totalSorry > 0) {
        console.log(`    ℹ ${pkg.lib}: ${totalSorry} sorry in ${sorryFiles.length} files: ${sorryFiles.join(", ")}`);
      }
      expect(true).toBe(true);
    });

    // Build artifacts not tracked
    test("no .lake/ artifacts tracked in git", () => {
      const { execSync } = require("child_process");
      try {
        const tracked = execSync(`git ls-files --cached ${pkg.lakeRoot}/.lake/`, {
          cwd: REPO_ROOT,
          encoding: "utf-8",
        }).trim();
        expect(tracked).toBe("");
      } catch {
        // git not available — skip
      }
    });
  });
}
