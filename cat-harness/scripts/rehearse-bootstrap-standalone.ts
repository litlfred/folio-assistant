#!/usr/bin/env bun
/**
 * Run bootstrap-tools' standalone rehearsal when bootstrap arrives by remote
 * mount from lock (bean `nn8e`, #2462).
 *
 * ## Why this wrapper exists
 *
 * `rehearse-standalone.ts` (Phase 4 of bean `xsqm`) tests that bootstrap-tools
 * passes its checks when isolated beside bootstrap in an empty scratch directory.
 * To know which files a standalone clone would hold, it queries `gitFiles()`.
 *
 * When bootstrap and bootstrap-tools were submodules, each directory was its own
 * git worktree. Under bean `nn8e`, they arrive by remote mount from the lock and
 * are ignored by the enclosing repository's `.gitignore` and `.git/info/exclude`.
 * In that state, `git ls-files` inside them asks the enclosing repository, which
 * ignores them, returning zero files.
 *
 * This wrapper ensures `bootstrap` and `bootstrap-tools` have temporary git
 * repository metadata if missing, runs the rehearsal, and cleanly removes the
 * temporary metadata in a `finally` block so `mount:lock:check` remains clean.
 *
 * @module scripts/rehearse-bootstrap-standalone
 */

import { spawnSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const REPO = join(import.meta.dir, "../..");
const BOOTSTRAP = join(REPO, "bootstrap");
const TOOLS = join(REPO, "bootstrap-tools");
const SCRIPT = join(TOOLS, "scripts/rehearse-standalone.ts");

function ensureGit(dir: string): boolean {
  if (!existsSync(dir)) return false;
  const gitDir = join(dir, ".git");
  if (existsSync(gitDir)) return false;
  spawnSync("git", ["init", "-q"], { cwd: dir });
  spawnSync("git", ["add", "-A"], { cwd: dir });
  return true;
}

let createdBootstrap = false;
let createdTools = false;

try {
  createdBootstrap = ensureGit(BOOTSTRAP);
  createdTools = ensureGit(TOOLS);

  const proc = spawnSync("bun", ["run", SCRIPT, ...process.argv.slice(2)], {
    cwd: REPO,
    stdio: "inherit",
  });

  process.exitCode = proc.status ?? (proc.error ? 1 : 0);
} finally {
  if (createdBootstrap) {
    rmSync(join(BOOTSTRAP, ".git"), { recursive: true, force: true });
  }
  if (createdTools) {
    rmSync(join(TOOLS, ".git"), { recursive: true, force: true });
  }
}
