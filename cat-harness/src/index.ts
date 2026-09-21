/**
 * Folio Assistant — Entry point.
 *
 * Wires up the server with the appropriate content adapter based on
 * configuration. Currently supports the "paper" adapter.
 *
 * Usage:
 *   bun run cat-harness/src/index.ts [--stdio|--http] [--repo <path>] [--check-deps]
 *
 * @module folio-assistant/index
 */

import { basename, resolve } from "path";
import { existsSync, readFileSync } from "fs";
import { FolioServer } from "./server.js";
import { resolveBuiltinAdapter } from "./builtin-adapters.js";
import { GitHelper } from "./core/git.js";
import { log } from "./core/logging.js";
import { expectedInstanceConfigPath } from "../schemas/harness-config";
import { repoRootFor } from "../schemas/cat-harness.js";

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
  // Declared capability probes. These are a separate mechanism from the list
  // above — `.claude/skills/capabilities/*.json` is what skills declare
  // `requiredCapabilities` against — and until now nothing executed them, so a
  // skill's prerequisite could be missing with no way to find out. The two
  // hardcoded lists remain (here and in src/tools/check-deps.ts); unifying
  // them is a separate change.
  const { loadCapabilities, probeAll, formatCapabilityReport } = await import("./tools/capabilities.js");
  const instance = resolve(import.meta.dir, "..");
  const caps = loadCapabilities(repoRootFor(instance));
  if (caps.length) {
    console.log("\nDeclared capabilities (.claude/skills/capabilities/):\n");
    const statuses = probeAll(caps);
    console.log(formatCapabilityReport(statuses));

    // What each skill DOES about a missing capability. The probes above say
    // what is absent; this says what follows — the half that was missing
    // while 24 `degradation` declarations were read by nothing (owner "b1",
    // bean `folio-assistant-ahvw`).
    const { loadSkillNeeds, allSkillAvailability, formatSkillAvailability } = await import(
      "./tools/degradation.js"
    );
    const { kgRoots } = await import("../scripts/known-skills.js");
    const { fallbackRoleFor } = await import("../scripts/check-fallback-roles.js");
    const { skills, unreadable } = await loadSkillNeeds(kgRoots(instance));

    // Resolved up front rather than inside the join: the derivation reads
    // every BPMN in the corpus, and doing it per skill inside a synchronous
    // predicate is not possible anyway.
    const human = new Map<string, string[]>();
    for (const s of skills) human.set(s.id, await fallbackRoleFor(instance, s.id));

    console.log("\nSkills, by what they declared about a missing capability:\n");
    console.log(
      formatSkillAvailability(
        allSkillAvailability(skills, statuses, caps, { humanFallback: (id) => human.get(id) ?? [] }),
      ),
    );
    for (const u of unreadable) {
      // Reported, never skipped: a skill module that will not import is a
      // defect whose remedy is to fix it, and dropping it would make it read
      // as a skill with nothing to require.
      console.log(`  ⚠ ${u.file} declares requiredCapabilities but will not import: ${u.error}`);
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

// The instance's own config — `<name>.config.json`, resolved outward from
// the instance root (2026-09-20). `undefined` = nothing declares an instance
// here, so there is no config to prefer and the defaults below stand.
const harnessConfigPath = expectedInstanceConfigPath(repoRoot);
if (harnessConfigPath !== undefined && existsSync(harnessConfigPath)) {
  try {
    const config = JSON.parse(readFileSync(harnessConfigPath, "utf-8"));
    adapterType = config.contentType || config.adapter || "paper";
    adapterModule = config.adapterModule;
    if (config.feedbackDir) feedbackDir = resolve(repoRoot, config.feedbackDir);
    if (config.viewer?.port) viewerPort = config.viewer.port;
    // NAME THE FILE ACTUALLY READ. `harnessConfigPath` is computed by
    // `expectedInstanceConfigPath`, and the config is `<name>.config.json`
    // since the 2026-09-21 split — so a hardcoded `harness.config.json` here
    // told an operator to go and look at a file that does not exist. A log
    // line is not prose a rename rewords; it is output somebody acts on.
    log("init", `Loaded ${basename(harnessConfigPath)}: adapter=${adapterType}`);
  } catch (e) {
    log("init", `Failed to read ${harnessConfigPath}: ${e}`);
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
const assistantDir = resolve(import.meta.dir, "../ui");

let adapter;

if (adapterModule) {
  // Dynamic adapter loading — content repo provides its own adapter
  try {
    const modulePath = resolve(repoRoot, adapterModule);
    const mod = await import(modulePath);
    const AdapterClass = mod.default || mod[Object.keys(mod).find(k => k.includes("Adapter")) || ""];
    adapter = new AdapterClass(repoRoot, gitHelper, feedbackDir);
    log("init", `Using custom adapter from ${adapterModule} (repo: ${repoRoot})`);
  } catch (e) {
    log("init", `Failed to load adapter from ${adapterModule}: ${e}`);
    log("init", `Falling back to a built-in adapter`);
    const r = await resolveBuiltinAdapter(adapterType);
    if (r.fallbackReason) log("init", r.fallbackReason);
    adapter = new (r.ctor as new (...a: never[]) => unknown)(
      repoRoot as never, gitHelper as never, feedbackDir as never,
    );
  }
} else {
  // Built-in adapter selection, from the declaration in `builtin-adapters.ts`
  // rather than a `switch` over imported classes.
  //
  // `document` is the base content type — prose folios with no Lean and no
  // required TeX — and `paper` is the specialization that adds both. `paper`
  // remains the fallback because every folio predating the document type
  // declares `contentType: "paper"` or nothing at all, and the paper adapter
  // is a superset: it registers the document tools too. Falling back the other
  // way would silently drop `lean_build` from an existing folio whose config
  // happens to omit `contentType` — which is why a fallback that DOES go that
  // way (because the science layer is not installed) says so out loud.
  const r = await resolveBuiltinAdapter(adapterType);
  if (r.fallbackReason) log("init", r.fallbackReason);
  adapter = new (r.ctor as new (...a: never[]) => unknown)(
    repoRoot as never, gitHelper as never, feedbackDir as never,
  );
  log("init", `Using ${r.used.contentType} adapter (repo: ${repoRoot})`);
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
