#!/usr/bin/env ts-node
/**
 * @module generate-registry
 * @description Scans .claude/skills/ and skills/ directories to produce a unified SkillRegistry.
 *
 * Outputs:
 *   - .claude/skills/registry.json
 *
 * Usage: npx ts-node scripts/generate-registry.ts
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

interface RegistryOutput {
  schemaVersion: "1.0";
  repository: string;
  generatedAt: string;
  actors: any[];
  capabilities: any[];
  skills: any[];
  requirements: any[];
  packages: any[];
  hooks: any[];
}

function loadJsonFiles(dir: string): any[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(f => f.endsWith(".json"))
    .map(f => {
      try {
        return JSON.parse(readFileSync(join(dir, f), "utf-8"));
      } catch {
        console.warn(`  ⚠ Failed to parse ${join(dir, f)}`);
        return null;
      }
    })
    .filter(Boolean);
}

function loadPackageManifests(): any[] {
  const skillsDir = join(rootDir, "skills");
  if (!existsSync(skillsDir)) return [];
  return readdirSync(skillsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => {
      const manifestPath = join(skillsDir, d.name, "package-manifest.json");
      if (!existsSync(manifestPath)) return null;
      try {
        return JSON.parse(readFileSync(manifestPath, "utf-8"));
      } catch {
        console.warn(`  ⚠ Failed to parse ${manifestPath}`);
        return null;
      }
    })
    .filter(Boolean);
}

// ─── Main ────────────────────────────────────────────────────────────────────

console.log("Generating skill registry...\n");

const pkg = JSON.parse(readFileSync(join(rootDir, "package.json"), "utf-8"));

const registry: RegistryOutput = {
  schemaVersion: "1.0",
  repository: pkg.name || "folio-assistant",
  generatedAt: new Date().toISOString(),
  actors: loadJsonFiles(join(rootDir, ".claude", "skills", "actors")),
  capabilities: loadJsonFiles(join(rootDir, ".claude", "skills", "capabilities")),
  skills: loadJsonFiles(join(rootDir, ".claude", "skills", "local")),
  requirements: loadJsonFiles(join(rootDir, ".claude", "skills", "requirements")),
  packages: loadPackageManifests(),
  hooks: [],
};

// Load hooks from settings if they exist
const settingsPath = join(rootDir, ".claude", "settings.json");
if (existsSync(settingsPath)) {
  try {
    const settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
    if (settings.hooks) {
      registry.hooks = Object.entries(settings.hooks).map(([event, config]: [string, any]) => ({
        event,
        commands: Array.isArray(config) ? config : [config],
      }));
    }
  } catch {
    console.warn("  ⚠ Failed to parse .claude/settings.json");
  }
}

const outDir = join(rootDir, ".claude", "skills");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "registry.json"), JSON.stringify(registry, null, 2) + "\n");

console.log(`  ✓ .claude/skills/registry.json`);
console.log(`    Actors: ${registry.actors.length}`);
console.log(`    Capabilities: ${registry.capabilities.length}`);
console.log(`    Skills: ${registry.skills.length}`);
console.log(`    Requirements: ${registry.requirements.length}`);
console.log(`    Packages: ${registry.packages.length}`);
console.log("\nDone.");
