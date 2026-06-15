/**
 * Folio Assistant — Entry point.
 *
 * Wires up the server with the appropriate content adapter based on
 * configuration. Currently supports the "paper" adapter.
 *
 * Usage:
 *   bun run src/index.ts [--stdio|--http] [--repo <path>] [--check-deps]
 *
 * @module folio-assistant/index
 */

import { resolve } from "path";
import { existsSync, readFileSync } from "fs";
import { FolioServer } from "./server.js";
import { PaperContentAdapter } from "../adapters/paper/index.js";
import { GitHelper } from "./core/git.js";
import { FeedbackStore } from "./core/feedback.js";
import { log } from "./core/logging.js";

// ── Parse CLI args ───────────────────────────────────────────────

const args = process.argv.slice(2);
const mode = args.includes("--http") ? "http" : "stdio";

// --repo <path> or default to parent directory (assuming folio-assistant/ is inside the repo)
let repoRoot: string;
const repoIdx = args.indexOf("--repo");
if (repoIdx >= 0 && args[repoIdx + 1]) {
  repoRoot = resolve(args[repoIdx + 1]);
} else {
  // Default: assume folio-assistant/ is a subdirectory of the content repo
  repoRoot = resolve(import.meta.dir, "../..");
}

// ── Dependency check mode ────────────────────────────────────────

if (args.includes("--check-deps")) {
  const { execSync } = await import("child_process");

  interface DepInfo { name: string; required: boolean; cmd: string; hint: string }
  const deps: DepInfo[] = [
    { name: "bun", required: true, cmd: "bun --version", hint: "curl -fsSL https://bun.sh/install | bash" },
    { name: "latexmk", required: false, cmd: "latexmk --version", hint: "sudo apt install latexmk" },
    { name: "pdflatex", required: false, cmd: "pdflatex --version", hint: "sudo apt install texlive-latex-base" },
    { name: "pandoc", required: false, cmd: "pandoc --version", hint: "sudo apt install pandoc" },
    { name: "lean", required: false, cmd: "lean --version", hint: "Install via elan" },
    { name: "rg", required: false, cmd: "rg --version", hint: "sudo apt install ripgrep" },
  ];

  console.log("\nFolio Assistant — Dependency check:\n");
  let missingReq = 0;
  for (const d of deps) {
    let ok = false;
    try { execSync(d.cmd, { stdio: "pipe" }); ok = true; } catch {}
    const icon = ok ? "✓" : (d.required ? "✗" : "○");
    const tag = d.required ? "(required)" : "(optional)";
    console.log(`  ${icon} ${d.name.padEnd(12)} ${tag}`);
    if (!ok) {
      console.log(`    Install: ${d.hint}`);
      if (d.required) missingReq++;
    }
  }
  console.log(missingReq > 0
    ? `\n⚠  ${missingReq} required dep(s) missing!\n`
    : `\n✓  All required deps present.\n`);
  process.exit(missingReq > 0 ? 1 : 0);
}

// ── Detect adapter type ──────────────────────────────────────────

// ── Load folio config ───────────────────────────────────────────

let adapterType = "paper";
let adapterModule: string | undefined;
let feedbackDir = resolve(repoRoot, ".folio-feedback");
let viewerPort: number | undefined;

// folio.config.json (preferred)
const folioConfigPath = resolve(repoRoot, "folio.config.json");
if (existsSync(folioConfigPath)) {
  try {
    const config = JSON.parse(readFileSync(folioConfigPath, "utf-8"));
    adapterType = config.contentType || config.adapter || "paper";
    adapterModule = config.adapterModule;
    if (config.feedbackDir) feedbackDir = resolve(repoRoot, config.feedbackDir);
    if (config.viewer?.port) viewerPort = config.viewer.port;
    log("init", `Loaded folio.config.json: adapter=${adapterType}`);
  } catch (e) {
    log("init", `Failed to read folio.config.json: ${e}`);
  }
}

// Fallback: lean-mcp.config.json for viewer_port
if (!viewerPort) {
  const mcpConfigPath = resolve(repoRoot, "lean-mcp.config.json");
  if (existsSync(mcpConfigPath)) {
    try {
      const mcpConfig = JSON.parse(readFileSync(mcpConfigPath, "utf-8"));
      if (mcpConfig.viewer_port) viewerPort = mcpConfig.viewer_port;
    } catch { /* ignore */ }
  }
}

// ── Create adapter ───────────────────────────────────────────────

const gitHelper = new GitHelper(repoRoot);
const feedbackStore = new FeedbackStore(feedbackDir);
const assistantDir = resolve(import.meta.dir, "../ui");

let adapter;

if (adapterModule) {
  // Dynamic adapter loading — content repo provides its own adapter
  try {
    const modulePath = resolve(repoRoot, adapterModule);
    const mod = await import(modulePath);
    const AdapterClass = mod.default || mod[Object.keys(mod).find(k => k.includes("Adapter")) || ""];
    adapter = new AdapterClass(repoRoot, gitHelper, feedbackStore);
    log("init", `Using custom adapter from ${adapterModule} (repo: ${repoRoot})`);
  } catch (e) {
    log("init", `Failed to load adapter from ${adapterModule}: ${e}`);
    log("init", `Falling back to built-in paper adapter`);
    adapter = new PaperContentAdapter(repoRoot, gitHelper, feedbackStore);
  }
} else {
  // Built-in adapter selection
  switch (adapterType) {
    case "paper":
    default:
      adapter = new PaperContentAdapter(repoRoot, gitHelper, feedbackStore);
      log("init", `Using paper adapter (repo: ${repoRoot})`);
      break;
  }
}

// ── Start server ─────────────────────────────────────────────────

const server = new FolioServer({
  repoRoot,
  feedbackDir,
  assistantDir,
  adapter,
  serverName: "folio-assistant",
  viewerPort,
});

if (mode === "stdio") {
  await server.startStdio();
} else {
  await server.startHttp();
}
