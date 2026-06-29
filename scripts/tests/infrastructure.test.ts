/**
 * Infrastructure tests — MCP config, scripts, schemas, deploy.
 *
 * Migrated from the original bash run-tests.sh, now type-safe
 * and producing structured TestReport output.
 */

import { describe, test, expect } from "bun:test";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { REPO_ROOT } from "./helpers";

// ── session-status.sh (replaced check-lean.sh) ─────────────────

describe("session-status.sh", () => {
  const script = join(REPO_ROOT, "scripts/session-status.sh");

  let output: string;
  let parsed: Record<string, unknown>;

  try {
    output = execSync(script, { encoding: "utf-8", timeout: 10_000 }).trim();
    parsed = JSON.parse(output);
  } catch {
    output = "";
    parsed = {};
  }

  test("outputs valid JSON", () => {
    expect(output.length).toBeGreaterThan(0);
    expect(() => JSON.parse(output)).not.toThrow();
  });

  test("has status object", () => {
    expect(parsed).toHaveProperty("status");
  });

  test("status has lean_mode field", () => {
    const status = parsed.status as Record<string, unknown> | undefined;
    if (status) {
      expect(status).toHaveProperty("lean_mode");
      const validModes = ["local", "remote", "local-degraded", "none"];
      expect(validModes).toContain(status.lean_mode);
    }
  });

  test("has summary field", () => {
    expect(parsed).toHaveProperty("summary");
  });
});

// ── check-no-lean-artifacts.sh ──────────────────────────────────

describe("check-no-lean-artifacts.sh", () => {
  test("passes on clean repo", () => {
    const script = join(REPO_ROOT, "scripts/check-no-lean-artifacts.sh");
    expect(() =>
      execSync(script, { cwd: REPO_ROOT, encoding: "utf-8", timeout: 5_000 })
    ).not.toThrow();
  });
});

// ── Config files ────────────────────────────────────────────────

describe("lean-mcp.config.json", () => {
  const configPath = join(REPO_ROOT, "lean-mcp.config.json");

  test("is valid JSON", () => {
    const content = readFileSync(configPath, "utf-8");
    expect(() => JSON.parse(content)).not.toThrow();
  });

  test("has required fields", () => {
    const config = JSON.parse(readFileSync(configPath, "utf-8"));
    expect(config).toHaveProperty("image");
    expect(config).toHaveProperty("mcp_internal_port");
    expect(config).toHaveProperty("auth");
    expect(config).toHaveProperty("folio");
    expect(config.folio).toHaveProperty("domain");
  });

  test("has llm provider config", () => {
    const config = JSON.parse(readFileSync(configPath, "utf-8"));
    expect(config).toHaveProperty("llm");
    expect(config.llm).toHaveProperty("provider");
    expect(config.llm).toHaveProperty("providers");
  });
});

describe(".mcp.json", () => {
  const mcpPath = join(REPO_ROOT, ".mcp.json");

  test("is valid JSON", () => {
    const content = readFileSync(mcpPath, "utf-8");
    expect(() => JSON.parse(content)).not.toThrow();
  });

  test("has paper-assistant server", () => {
    const mcp = JSON.parse(readFileSync(mcpPath, "utf-8"));
    expect(mcp.mcpServers).toHaveProperty("paper-assistant");
  });
});

// ── Unified Docker image ───────────────────────────────────────

describe("Unified paper-assistant image", () => {
  test("Dockerfile exists", () => {
    expect(existsSync(join(REPO_ROOT, "scripts/mcp-server/Dockerfile"))).toBe(true);
  });

  test("Dockerfile includes TeX Live", () => {
    const df = readFileSync(join(REPO_ROOT, "scripts/mcp-server/Dockerfile"), "utf-8");
    expect(df).toContain("texlive-full");
  });

  test("Dockerfile includes gh CLI", () => {
    const df = readFileSync(join(REPO_ROOT, "scripts/mcp-server/Dockerfile"), "utf-8");
    expect(df).toMatch(/apt-get\s+install\b[^\n]*\bgh\b/);
    expect(df).toMatch(/\bgh\s+--version\b/);
  });

  test("Dockerfile includes Python requests", () => {
    const df = readFileSync(join(REPO_ROOT, "scripts/mcp-server/Dockerfile"), "utf-8");
    expect(df).toContain("requests");
  });

  test("all CI workflows use paper-assistant image", () => {
    for (const wf of ["publish.yml", "lean-build.yml", "blueprint.yml"]) {
      const content = readFileSync(join(REPO_ROOT, `.github/workflows/${wf}`), "utf-8");
      expect(content).toContain("paper-assistant");
      expect(content).not.toContain("texlive/texlive");
      expect(content).not.toContain("latex-ci");
    }
  });

  test("deprecated workflows have no automatic triggers", () => {
    for (const wf of ["docker-ci-image.yml", "build-latex-image.yml"]) {
      const content = readFileSync(join(REPO_ROOT, `.github/workflows/${wf}`), "utf-8");
      expect(content).toContain("DEPRECATED");
      expect(content).not.toMatch(/^\s+- cron:/m);
      expect(content).not.toMatch(/push:\s*\n\s+branches:/m);
    }
  });

  test("docker-tex.sh helper exists", () => {
    expect(existsSync(join(REPO_ROOT, "scripts/lib/docker-tex.sh"))).toBe(true);
  });

  test("render-on-change.sh uses docker-tex.sh", () => {
    const script = readFileSync(join(REPO_ROOT, "scripts/render-on-change.sh"), "utf-8");
    expect(script).toContain("docker-tex.sh");
  });

  test("render-pre-commit.sh uses docker-tex.sh", () => {
    const script = readFileSync(join(REPO_ROOT, "scripts/render-pre-commit.sh"), "utf-8");
    expect(script).toContain("docker-tex.sh");
  });

  test("config image matches build workflow", () => {
    const config = JSON.parse(readFileSync(join(REPO_ROOT, "lean-mcp.config.json"), "utf-8"));
    const workflow = readFileSync(join(REPO_ROOT, ".github/workflows/build-lean-mcp.yml"), "utf-8");
    expect(config.image).toContain("paper-assistant");
    expect(workflow).toContain("paper-assistant");
  });
});

// ── Deploy infrastructure ───────────────────────────────────────

describe("Deploy infrastructure", () => {
  test("Caddyfile.template uses domain variable", () => {
    const caddyfile = readFileSync(
      join(REPO_ROOT, "deploy/Caddyfile.template"),
      "utf-8"
    );
    expect(caddyfile).toContain("${FOLIO_DOMAIN}");
  });

  test("self-update.sh preserves .env", () => {
    const script = readFileSync(
      join(REPO_ROOT, "deploy/self-update.sh"),
      "utf-8"
    );
    expect(script).toContain("exclude='deploy/.env'");
  });
});

// ── .gitignore ──────────────────────────────────────────────────

describe(".gitignore", () => {
  const gitignore = readFileSync(join(REPO_ROOT, ".gitignore"), "utf-8");

  test("blocks deploy/.env", () => {
    expect(gitignore).toContain("deploy/.env");
  });

  test("blocks content/quantum-observable-universe/lean/.lake/", () => {
    expect(gitignore).toContain("content/quantum-observable-universe/lean/.lake/");
  });
});

// ── Schema files ────────────────────────────────────────────────

describe("Schema files", () => {
  test("formalization-types.ts exists", () => {
    expect(existsSync(join(REPO_ROOT, "folio-assistant/schemas/formalization-types.ts"))).toBe(true);
  });

  test("formalization-types.ts exports all key types", () => {
    const content = readFileSync(
      join(REPO_ROOT, "folio-assistant/schemas/formalization-types.ts"),
      "utf-8"
    );
    // Proof pipeline types
    expect(content).toContain("export interface ProofObjectsManifest");
    expect(content).toContain("export interface ProofObject");
    expect(content).toContain("export interface ReviewRecord");
    // Visualizer types (migrated from schema/viz.json)
    expect(content).toContain("export interface VizState");
    expect(content).toContain("export type VizMode");
    // Skills config types (migrated from skills-config-schema.json)
    expect(content).toContain("export interface SkillsConfig");
    expect(content).toContain("export interface SkillPackage");
  });

  test("constraints.ts exports Zod schemas for all block kinds", () => {
    const content = readFileSync(
      join(REPO_ROOT, "folio-assistant/schemas/constraints.ts"),
      "utf-8"
    );
    for (const schema of [
      "DefinitionSchema", "TheoremSchema", "LemmaSchema",
      "PropositionSchema", "CorollarySchema", "ProofSchema",
      "ExampleSchema", "RemarkSchema", "ProseSchema",
      "ComputationSchema",
    ]) {
      expect(content).toContain(`export const ${schema}`);
    }
  });

  test("proof-objects.json has valid structure", () => {
    const manifest = JSON.parse(
      readFileSync(join(REPO_ROOT, "proof-objects.json"), "utf-8")
    );
    // Version and top-level structure
    expect(manifest.version).toBe("1.0");
    expect(manifest).toHaveProperty("objects");
    expect(manifest).toHaveProperty("manuscript");
    expect(Array.isArray(manifest.objects)).toBe(true);
    // Manuscript metadata
    expect(manifest.manuscript).toHaveProperty("repo");
    expect(manifest.manuscript).toHaveProperty("commit_sha");
    expect(manifest.manuscript).toHaveProperty("generated_at");
    // Validate first object has required fields (structural check)
    if (manifest.objects.length > 0) {
      const obj = manifest.objects[0];
      expect(obj).toHaveProperty("label");
      expect(obj).toHaveProperty("object_type");
      expect(obj).toHaveProperty("latex");
      expect(obj.latex).toHaveProperty("file");
      expect(obj.latex).toHaveProperty("line");
      // object_type must be a valid kind
      const validKinds = [
        "definition", "theorem", "lemma", "proposition",
        "corollary", "conjecture", "example", "remark",
      ];
      expect(validKinds).toContain(obj.object_type);
    }
  });
});
