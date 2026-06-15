/**
 * Lean toolchain management — setup, status, build, check.
 *
 * This is the single source of truth for Lean environment management.
 * Shell scripts (session-status.sh, lean-build-bg.sh) use
 * scripts/lib/lean-env.sh for shared helpers, but this module owns
 * the authoritative tools:
 *
 *   lean_setup    — Install elan, lean, lake, uv, ripgrep + fetch deps + build
 *   lean_status   — Check toolchain availability and readiness mode
 *   lean_build    — Trigger a Lean build (lake build)
 *   lean_check    — Quick type-check (lake check) — faster than full build
 *
 * @module folio-assistant/adapters/paper/tools/lean
 */

import { z } from "zod";
import { execSync, spawnSync, type SpawnSyncReturns } from "child_process";
import { existsSync, readFileSync, statSync } from "fs";
import { join, resolve } from "path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LEAN_DIR, REPO_ROOT } from "../paths.js";

/** Check if a command is available. */
function hasCommand(cmd: string): boolean {
  try {
    execSync(`which ${cmd}`, { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve the Lean project directory.  Prefers the repo-root Lake
 * workspace (which aggregates every paper package); falls back to the
 * legacy per-paper QOU directory when the root workspace is missing.
 */
function leanProjectDir(dir?: string): string {
  if (dir) return resolve(REPO_ROOT, dir);
  if (
    existsSync(join(REPO_ROOT, "lakefile.toml")) ||
    existsSync(join(REPO_ROOT, "lakefile.lean"))
  ) {
    return REPO_ROOT;
  }
  const leanArchive = join(REPO_ROOT, "content/quantum-observable-universe/lean");
  if (existsSync(join(leanArchive, "lakefile.toml")) || existsSync(join(leanArchive, "lakefile.lean"))) {
    return leanArchive;
  }
  return LEAN_DIR;
}

/** Extract stdout + stderr from a spawn result, truncated to the last 2000 chars. */
function processSpawnOutput(result: SpawnSyncReturns<Buffer>): { output: string; last2k: string } {
  const stdout = result.stdout?.toString() || "";
  const stderr = result.stderr?.toString() || "";
  const output = (stdout + "\n" + stderr).trim();
  const last2k = output.slice(-2000);
  return { output, last2k };
}

// ── Local Mathlib cache helpers ──────────────────────────────────

interface MathlibConfig {
  localPath: string;        // absolute path to local mathlib4 clone
  gitUrl: string;           // upstream URL Lake uses for mathlib
  available: boolean;       // local clone exists and is a git repo
  ageDays: number | null;   // days since last fetch, or null if unknown
}

function getMathlibConfig(): MathlibConfig {
  const configFile = join(REPO_ROOT, "lean-mcp.config.json");
  let relPath = "../mathlib4";
  let gitUrl = "https://github.com/leanprover-community/mathlib4";

  if (existsSync(configFile)) {
    try {
      const config = JSON.parse(readFileSync(configFile, "utf-8"));
      relPath = config.lean?.local_mathlib_path ?? relPath;
      gitUrl = config.lean?.mathlib_git_url ?? gitUrl;
    } catch { /* use defaults */ }
  }

  const localPath = resolve(REPO_ROOT, relPath);
  const available = existsSync(join(localPath, ".git"));

  let ageDays: number | null = null;
  if (available) {
    try {
      const fetchHead = join(localPath, ".git", "FETCH_HEAD");
      if (existsSync(fetchHead)) {
        const fetchTime = statSync(fetchHead).mtimeMs;
        ageDays = Math.floor((Date.now() - fetchTime) / 86_400_000);
      }
    } catch { /* ignore */ }
  }

  return { localPath, gitUrl, available, ageDays };
}

/**
 * Set git insteadOf so Lake redirects mathlib fetches to a local clone.
 * Uses repo-local git config (doesn't pollute global config).
 */
function enableMathlibRedirect(leanDir: string): string[] {
  const ml = getMathlibConfig();
  const msgs: string[] = [];

  if (!ml.available) {
    msgs.push(`○ No local mathlib at ${ml.localPath} — using GitHub`);
    return msgs;
  }

  // Set repo-local git config for both HTTPS and SSH URLs
  const fileUrl = `file://${ml.localPath}`;
  for (const upstream of [
    ml.gitUrl,
    "git@github.com:leanprover-community/mathlib4.git",
  ]) {
    spawnSync("git", ["config", "--local", `url.${fileUrl}.insteadOf`, upstream], {
      cwd: leanDir, stdio: "pipe",
    });
  }

  msgs.push(`✓ Mathlib redirect: ${ml.localPath} (${ml.ageDays !== null ? `${ml.ageDays}d since last fetch` : "age unknown"})`);
  return msgs;
}

/** Remove the local mathlib redirect. */
function disableMathlibRedirect(leanDir: string): void {
  const ml = getMathlibConfig();
  const fileUrl = `file://${ml.localPath}`;
  spawnSync("git", ["config", "--local", "--unset-all", `url.${fileUrl}.insteadOf`], {
    cwd: leanDir, stdio: "pipe",
  });
}

/** Update the local mathlib clone (git fetch --all). */
function updateLocalMathlib(): string {
  const ml = getMathlibConfig();
  if (!ml.available) return `No local mathlib at ${ml.localPath}`;

  const r = spawnSync("git", ["fetch", "--all", "--prune"], {
    cwd: ml.localPath, stdio: "pipe", timeout: 120_000,
  });
  const out = (r.stdout?.toString() || "") + (r.stderr?.toString() || "");
  return r.status === 0
    ? `Updated local mathlib at ${ml.localPath}`
    : `Fetch failed: ${out.slice(-200)}`;
}

export function registerLeanTools(server: McpServer): void {

  // ── lean_setup ──────────────────────────────────────────────

  server.tool(
    "lean_setup",
    "Install the full Lean 4 toolchain: elan, lean, lake, uv, ripgrep, " +
    "fetch Mathlib cache, and build the project. Safe to re-run — skips " +
    "already-installed components. This is the single entry point for " +
    "getting Lean working locally.",
    {
      skip_build: z.boolean().default(false)
        .describe("Skip the final `lake build` step (just install + fetch cache)"),
    },
    async ({ skip_build }) => {
      const steps: string[] = [];
      const leanDir = leanProjectDir();

      // 1. uv
      if (hasCommand("uv")) {
        steps.push(`✓ uv already installed`);
      } else {
        const r = spawnSync("bash", ["-c", "curl -LsSf https://astral.sh/uv/install.sh | sh"], {
          stdio: "pipe", timeout: 60_000,
          env: { ...process.env, PATH: `${process.env.HOME}/.local/bin:${process.env.PATH}` },
        });
        steps.push(r.status === 0 ? "✓ uv installed" : `✗ uv install failed: ${r.stderr?.toString().slice(-200)}`);
      }

      // 2. elan + lean
      if (hasCommand("elan")) {
        steps.push(`✓ elan already installed`);
      } else {
        const r = spawnSync("bash", ["-c",
          "curl -sSf https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh | sh -s -- -y --default-toolchain none"
        ], {
          stdio: "pipe", timeout: 120_000,
          env: { ...process.env, PATH: `${process.env.HOME}/.elan/bin:${process.env.PATH}` },
        });
        steps.push(r.status === 0 ? "✓ elan installed" : `✗ elan install failed: ${r.stderr?.toString().slice(-200)}`);
      }

      // Ensure elan/lean on PATH for subsequent steps
      const envPath = `${process.env.HOME}/.elan/bin:${process.env.HOME}/.local/bin:${process.env.PATH}`;
      const env = { ...process.env, PATH: envPath };

      // 3. Pin toolchain
      const tcFile = join(leanDir, "lean-toolchain");
      if (existsSync(tcFile)) {
        const tc = readFileSync(tcFile, "utf-8").trim();
        const r = spawnSync("elan", ["toolchain", "install", tc], {
          stdio: "pipe", timeout: 300_000, env,
        });
        const out = (r.stdout?.toString() || "") + (r.stderr?.toString() || "");
        steps.push(out.includes("already installed") ? `✓ Toolchain ${tc} already installed` : `✓ Toolchain ${tc} installed`);
      } else {
        steps.push("✗ No lean-toolchain file found");
      }

      // 4. ripgrep
      if (hasCommand("rg")) {
        steps.push("✓ ripgrep already installed");
      } else {
        const r = spawnSync("sudo", ["apt-get", "install", "-y", "-qq", "ripgrep"], {
          stdio: "pipe", timeout: 30_000, env,
        });
        steps.push(r.status === 0 ? "✓ ripgrep installed" : "○ ripgrep not available (optional)");
      }

      // 5. Local mathlib redirect (if available)
      steps.push(...enableMathlibRedirect(leanDir));

      // 6. lake update
      steps.push("▸ Running lake update...");
      const updateR = spawnSync("lake", ["update"], {
        cwd: leanDir, stdio: "pipe", timeout: 300_000, env,
      });
      steps.push(updateR.status === 0 ? "✓ Dependencies fetched" : "⚠ lake update had issues (continuing)");

      // 6. Mathlib cache
      steps.push("▸ Fetching Mathlib cache...");
      const cacheR = spawnSync("lake", ["exe", "cache", "get"], {
        cwd: leanDir, stdio: "pipe", timeout: 600_000, env,
      });
      steps.push(cacheR.status === 0 ? "✓ Mathlib cache fetched" : "⚠ Cache fetch had issues (continuing)");

      // 7. Build (optional)
      if (!skip_build) {
        steps.push("▸ Running lake build...");
        const buildR = spawnSync("lake", ["build"], {
          cwd: leanDir, stdio: "pipe", timeout: 600_000, env,
        });
        const buildOut = (buildR.stdout?.toString() || "") + (buildR.stderr?.toString() || "");
        const last500 = buildOut.slice(-500);
        steps.push(buildR.status === 0
          ? "✓ Build succeeded"
          : `⚠ Build had errors:\n${last500}`);
      } else {
        steps.push("○ Build skipped (--skip_build)");
      }

      // Summary
      const leanVer = (() => {
        try { return execSync("lean --version", { encoding: "utf-8", env }).trim(); }
        catch { return "not found"; }
      })();

      return {
        content: [{
          type: "text" as const,
          text: `Lean Setup Complete\n${"=".repeat(40)}\n${steps.join("\n")}\n\nLean: ${leanVer}\nProject: ${leanDir}`,
        }],
      };
    },
  );

  // ── lean_status ──────────────────────────────────────────────

  server.tool(
    "lean_status",
    "Check Lean environment readiness. Reports mode (local/remote/" +
    "local-degraded/none), what's installed, what's missing, and fix hints.",
    {},
    async () => {
      const checks: Record<string, string> = {};

      // Local Lean
      checks.lean = hasCommand("lean") ? execSync("lean --version", { encoding: "utf-8" }).trim() : "not installed";
      checks.lake = hasCommand("lake") ? "available" : "not installed";
      checks.elan = hasCommand("elan") ? "available" : "not installed";
      checks.uv = hasCommand("uv") ? "available" : "not installed";
      checks.ripgrep = hasCommand("rg") ? "available" : "not installed (optional)";

      // Toolchain
      const tcFile = join(LEAN_DIR, "lean-toolchain");
      checks.toolchain = existsSync(tcFile)
        ? readFileSync(tcFile, "utf-8").trim()
        : "lean-toolchain not found";

      // Lake manifest + Mathlib cache
      const manifestOk = existsSync(join(LEAN_DIR, "lake-manifest.json"));
      checks.lake_manifest = manifestOk ? "present" : "missing (run lean_setup or lake update)";

      const cacheOk = existsSync(join(LEAN_DIR, ".lake/packages/mathlib/.lake/build/lib"));
      checks.mathlib_cache = cacheOk ? "present" : "missing (run lean_setup or lake exe cache get)";

      // Local mathlib clone
      const ml = getMathlibConfig();
      if (ml.available) {
        const age = ml.ageDays !== null ? `${ml.ageDays}d since fetch` : "age unknown";
        checks.local_mathlib = `${ml.localPath} (${age})`;
      } else {
        checks.local_mathlib = `not found at ${ml.localPath}`;
      }

      // Remote MCP
      let remoteOk = false;
      try {
        const configFile = join(REPO_ROOT, "lean-mcp.config.json");
        if (existsSync(configFile)) {
          const config = JSON.parse(readFileSync(configFile, "utf-8"));
          const domain = config.domain;
          const result = spawnSync("curl", ["-sf", "--max-time", "5", `https://${domain}/health`], { stdio: "pipe" });
          remoteOk = result.status === 0;
          checks.remote_mcp = remoteOk ? `available (${domain})` : `unreachable (${domain})`;
        } else {
          checks.remote_mcp = "no config file";
        }
      } catch {
        checks.remote_mcp = "check failed";
      }

      // Determine mode
      const leanOk = hasCommand("lean");
      const uvOk = hasCommand("uv");
      let mode = "none";
      let fix = "";

      if (leanOk && uvOk && manifestOk && cacheOk) {
        mode = "local";
      } else if (leanOk) {
        mode = "local-degraded";
        if (!uvOk) fix = "Install uv: curl -LsSf https://astral.sh/uv/install.sh | sh";
        else if (!manifestOk) fix = "Run lean_setup or: cd content/quantum-observable-universe/lean && lake update";
        else if (!cacheOk) fix = "Run lean_setup or: cd content/quantum-observable-universe/lean && lake exe cache get";
      } else if (remoteOk) {
        mode = "remote";
      } else {
        fix = "Run the lean_setup MCP tool to install the full Lean toolchain";
      }

      // Background build status
      let buildStatus = "";
      try {
        const bsFile = "/tmp/qou-lean-build-status.json";
        if (existsSync(bsFile)) {
          const bs = JSON.parse(readFileSync(bsFile, "utf-8"));
          buildStatus = `\n  build_status: ${bs.status} — ${bs.message}`;
        }
      } catch { /* ignore */ }

      const status = Object.entries(checks)
        .map(([k, v]) => `  ${k.padEnd(20)} ${v}`)
        .join("\n");

      const fixLine = fix ? `\n\nTo fix: ${fix}` : "";

      return {
        content: [{
          type: "text" as const,
          text: `Lean status (mode: ${mode}):\n${status}${buildStatus}${fixLine}`,
        }],
      };
    },
  );

  // ── lean_build ───────────────────────────────────────────────

  server.tool(
    "lean_build",
    "Run `lake build` in the Lean project directory. Returns build output. " +
    "Defaults to content/quantum-observable-universe/lean/ if it contains a lakefile. " +
    "Automatically uses local mathlib clone (if configured in lean-mcp.config.json) " +
    "to avoid re-downloading from GitHub.",
    {
      clean: z.boolean().default(false)
        .describe("Run `lake clean` first"),
      project: z.string().optional()
        .describe("Specific library to build (e.g. 'QOU'). Default: build all."),
      dir: z.string().optional()
        .describe("Lean project directory relative to repo root (default: auto-detect content/quantum-observable-universe/lean/ or lean/)"),
      update_local_mathlib: z.boolean().default(false)
        .describe("Fetch latest commits in the local mathlib clone before building"),
    },
    async ({ clean, project, dir, update_local_mathlib }) => {
      if (!hasCommand("lake")) {
        return {
          content: [{
            type: "text" as const,
            text: "Error: lake not installed. Use the lean_setup MCP tool to install.",
          }],
        };
      }

      const cwd = leanProjectDir(dir);
      const preamble: string[] = [];

      try {
        // Enable local mathlib redirect if available
        preamble.push(...enableMathlibRedirect(cwd));

        // Optionally update local mathlib clone
        if (update_local_mathlib) {
          preamble.push(updateLocalMathlib());
        } else {
          const ml = getMathlibConfig();
          if (ml.available && ml.ageDays !== null && ml.ageDays > 7) {
            preamble.push(`⚠ Local mathlib is ${ml.ageDays} days old — consider update_local_mathlib: true`);
          }
        }

        if (clean) {
          spawnSync("lake", ["clean"], { cwd, stdio: "pipe", timeout: 30_000 });
        }

        const args = project ? ["build", project] : ["build"];
        const result = spawnSync("lake", args, {
          cwd,
          stdio: "pipe",
          timeout: 600_000, // 10 min
        });

        const { last2k } = processSpawnOutput(result);
        const pre = preamble.length ? preamble.join("\n") + "\n\n" : "";

        return {
          content: [{
            type: "text" as const,
            text: `${pre}lake build ${result.status === 0 ? "succeeded" : "failed"} (exit ${result.status}, cwd: ${cwd})\n\n${last2k}`,
          }],
        };
      } catch (e) {
        return {
          content: [{ type: "text" as const, text: `Build error: ${e instanceof Error ? e.message : String(e)}` }],
        };
      }
    },
  );

  // ── lean_check ──────────────────────────────────────────────

  server.tool(
    "lean_check",
    "Run `lake check` to type-check Lean files without full compilation. " +
    "Faster than lean_build — useful for quick validation after edits. " +
    "Defaults to content/quantum-observable-universe/lean/ if it contains a lakefile.",
    {
      project: z.string().optional()
        .describe("Specific library to check (e.g. 'QOU'). Default: check all."),
      dir: z.string().optional()
        .describe("Lean project directory relative to repo root (default: auto-detect content/quantum-observable-universe/lean/ or lean/)"),
    },
    async ({ project, dir }) => {
      if (!hasCommand("lake")) {
        return {
          content: [{
            type: "text" as const,
            text: "Error: lake not installed. Use the lean_setup MCP tool to install.",
          }],
        };
      }

      const cwd = leanProjectDir(dir);

      try {
        const args = project ? ["check", project] : ["check"];
        const result = spawnSync("lake", args, {
          cwd,
          stdio: "pipe",
          timeout: 180_000, // 3 min
        });

        const { output, last2k } = processSpawnOutput(result);

        // Count errors and warnings
        const errors = (output.match(/^error:/gm) || []).length;
        const warnings = (output.match(/^warning:/gm) || []).length;
        const summary = result.status === 0
          ? `lake check succeeded (${warnings} warnings)`
          : `lake check failed: ${errors} errors, ${warnings} warnings`;

        return {
          content: [{
            type: "text" as const,
            text: `${summary} (exit ${result.status}, cwd: ${cwd})\n\n${last2k}`,
          }],
        };
      } catch (e) {
        return {
          content: [{ type: "text" as const, text: `Check error: ${e instanceof Error ? e.message : String(e)}` }],
        };
      }
    },
  );
}
