#!/usr/bin/env ts-node
/**
 * @module generate-docs
 * @description Auto-generates COMPREHENSIVE schema documentation from all sources:
 *
 *   1. Core framework schemas (Zod → JSON Schema → Markdown)
 *   2. Per-skill input/output schemas (schemas/skills/*)
 *   3. SkillDefinition instances (.claude/skills/local/*.json) with schemaRef links
 *   4. ActorDefinition instances (.claude/skills/actors/*.json)
 *   5. CapabilityDefinition instances (.claude/skills/capabilities/*.json)
 *   6. Requirement instances (.claude/skills/requirements/*.json)
 *   7. Skill package manifests (skills/*/package-manifest.json) with Docker deps
 *
 * Produces:
 *   - schemas/generated/SCHEMAS.md       — complete schema reference
 *   - schemas/generated/SKILLS.md        — all skills with their schemas
 *   - schemas/generated/ACTORS.md        — actor hierarchy and capabilities
 *   - schemas/generated/CAPABILITIES.md  — capability catalog with detection
 *   - schemas/generated/REQUIREMENTS.md  — requirements and conformance
 *   - schemas/generated/PACKAGES.md      — skill packages and Docker deps
 *   - schemas/generated/LIFECYCLE.md     — content lifecycle overview
 *   - schemas/generated/index.json       — machine-readable catalog
 *
 * Usage: npx ts-node scripts/generate-docs.ts
 */

import { zodToJsonSchema } from "zod-to-json-schema";
import { writeFileSync, mkdirSync, readdirSync, readFileSync, existsSync } from "fs";
import { join, dirname, relative } from "path";
import { fileURLToPath } from "url";

import {
  ActorDefinitionSchema,
  CapabilityDefinitionSchema,
  SkillDefinitionSchema,
  RequirementSchema,
  SkillRegistrySchema,
  RoleAssignmentSchema,
  DockerRequirementsSchema,
  SkillPackageManifestSchema,
  RemotePackageRefSchema,
} from "../schemas/constraints.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const outDir = join(rootDir, "schemas", "generated");

mkdirSync(outDir, { recursive: true });

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadJsonDir(dir: string): { name: string; data: any }[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(f => f.endsWith(".json"))
    .map(f => {
      try {
        return { name: f.replace(".json", ""), data: JSON.parse(readFileSync(join(dir, f), "utf-8")) };
      } catch { return null; }
    })
    .filter(Boolean) as any[];
}

function formatType(def: any): string {
  if (!def) return "`any`";
  if (def.type === "array") return `${formatType(def.items || {})}[]`;
  if (def.type) return `\`${def.type}\``;
  if (def.enum) return def.enum.map((e: string) => `\`"${e}"\``).join(" | ");
  if (def.anyOf) return def.anyOf.map((a: any) => formatType(a)).join(" | ");
  if (def.oneOf) return def.oneOf.map((a: any) => formatType(a)).join(" | ");
  if (def.const) return `\`"${def.const}"\``;
  if (def.$ref) return `\`${def.$ref.split("/").pop()}\``;
  return "`object`";
}

function jsonSchemaPropsTable(schema: any): string[] {
  const lines: string[] = [];
  const props = schema?.properties || {};
  if (Object.keys(props).length === 0) return lines;
  const req = schema?.required || [];
  lines.push("| Property | Type | Required | Description |");
  lines.push("|----------|------|----------|-------------|");
  for (const [k, v] of Object.entries(props)) {
    const d = v as any;
    lines.push(`| \`${k}\` | ${formatType(d)} | ${req.includes(k) ? "Yes" : "No"} | ${d.description || ""} |`);
  }
  return lines;
}

function timestamp(): string {
  return new Date().toISOString().replace(/T.*/, "");
}

/**
 * Compute the transitive closure of an actor's identity: the actor itself
 * plus all actors that inherit from it (directly or transitively).
 * This lets us check "can this actor invoke a skill?" by testing whether
 * any of the skill's allowed roles are in this set.
 */
function getTransitiveRoles(actorId: string): Set<string> {
  const result = new Set<string>([actorId]);
  const queue = [actorId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    // Find actors whose `inherits` includes `current` — those are children
    // that also satisfy the role check. But we actually want ancestors:
    // if this actor inherits from X, then this actor can do anything X can.
    const actor = actors.find(a => a.data.id === current);
    if (actor?.data.inherits) {
      for (const parentId of actor.data.inherits) {
        if (!result.has(parentId)) {
          result.add(parentId);
          queue.push(parentId);
        }
      }
    }
  }
  return result;
}

// ─── Load all data ───────────────────────────────────────────────────────────

const actors = loadJsonDir(join(rootDir, ".claude", "skills", "actors"));
const capabilities = loadJsonDir(join(rootDir, ".claude", "skills", "capabilities"));
const requirements = loadJsonDir(join(rootDir, ".claude", "skills", "requirements"));
const skills = loadJsonDir(join(rootDir, ".claude", "skills", "local"));
const remotePackages = loadJsonDir(join(rootDir, "skills", "remote-packages"));
const skillSchemaDirs = existsSync(join(rootDir, "schemas", "skills"))
  ? readdirSync(join(rootDir, "schemas", "skills"), { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name)
  : [];
const packages = loadJsonDir(join(rootDir, "skills")).length > 0
  ? readdirSync(join(rootDir, "skills"), { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => {
        const mp = join(rootDir, "skills", d.name, "package-manifest.json");
        try { return { name: d.name, data: JSON.parse(readFileSync(mp, "utf-8")) }; }
        catch { return null; }
      })
      .filter(Boolean) as any[]
  : [];

// ─── 1. SCHEMAS.md — Core framework schemas ─────────────────────────────────

function generateSchemasMd(): string {
  const L: string[] = [];
  L.push("# Schema Reference");
  L.push("");
  L.push(`> **Auto-generated** on ${timestamp()} — Do not edit manually. Run \`npm run generate:docs\` to regenerate.`);
  L.push("");

  const coreEntries = [
    { name: "ActorDefinition", schema: ActorDefinitionSchema, desc: "A human role or system service. Roles form a DAG via `inherits`.", fhir: "ActorDefinition", cat: "Core" },
    { name: "CapabilityDefinition", schema: CapabilityDefinitionSchema, desc: "A concrete capability that tools/services/environments provide.", fhir: "CapabilityStatement", cat: "Core" },
    { name: "SkillDefinition", schema: SkillDefinitionSchema, desc: "Core skill type with metadata, capabilities, dependencies, and schemaRef.", cat: "Core" },
    { name: "Requirement", schema: RequirementSchema, desc: "Workflow rules agents must follow (FHIR R5 conformance verbs).", fhir: "Requirements", cat: "Core" },
    { name: "SkillRegistry", schema: SkillRegistrySchema, desc: "Central manifest of all skills, actors, capabilities, and requirements.", cat: "Registry" },
    { name: "RoleAssignment", schema: RoleAssignmentSchema, desc: "Maps user identities to actor roles at session start.", cat: "Registry" },
    { name: "DockerRequirements", schema: DockerRequirementsSchema, desc: "Docker packaging requirements (OCI image spec labels).", cat: "Packaging" },
    { name: "SkillPackageManifest", schema: SkillPackageManifestSchema, desc: "Skill package manifest declaring Docker/system requirements.", cat: "Packaging" },
    { name: "RemotePackageRef", schema: RemotePackageRefSchema, desc: "Reference to an external skill package maintained in another repository, with sync config and Docker wrapper.", cat: "Packaging" },
  ];

  // TOC
  L.push("## Table of Contents");
  L.push("");
  L.push("### Core Framework Schemas");
  for (const e of coreEntries) {
    L.push(`- [${e.name}](#${e.name.toLowerCase()})${e.fhir ? ` _(FHIR R5: ${e.fhir})_` : ""}`);
  }
  L.push("");
  L.push("### Skill-Specific Schemas");
  for (const sd of skillSchemaDirs) {
    L.push(`- [${sd}](#skill-schema-${sd})`);
  }
  L.push("");
  L.push("### Related Documentation");
  L.push("- [Skills Catalog](./SKILLS.md)");
  L.push("- [Actors & Roles](./ACTORS.md)");
  L.push("- [Capabilities](./CAPABILITIES.md)");
  L.push("- [Requirements](./REQUIREMENTS.md)");
  L.push("- [Packages & Docker](./PACKAGES.md)");
  L.push("- [Content Lifecycle](./LIFECYCLE.md)");
  L.push("");
  L.push("---");
  L.push("");

  // Core schemas
  for (const e of coreEntries) {
    const js = zodToJsonSchema(e.schema, { name: e.name, $refStrategy: "none" });
    L.push(`## ${e.name}`);
    L.push("");
    L.push(e.desc);
    L.push("");
    if (e.fhir) L.push(`**FHIR R5 Analog:** \`${e.fhir}\`  `);
    L.push(`**JSON Schema:** [\`${e.name}.schema.json\`](./${e.name}.schema.json)`);
    L.push("");
    L.push(...jsonSchemaPropsTable(js));
    L.push("");
    L.push("<details><summary>Full JSON Schema</summary>");
    L.push("");
    L.push("```json");
    L.push(JSON.stringify(js, null, 2));
    L.push("```");
    L.push("</details>");
    L.push("");
    L.push("---");
    L.push("");
  }

  // Skill-specific schemas
  L.push("# Skill-Specific Schemas");
  L.push("");
  L.push("Each skill with an MCP server, Python module, Node.js script, or shell script implementation");
  L.push("has input/output schemas under `schemas/skills/<skill-id>/`. Skills reference these via `schemaRef`.");
  L.push("");

  for (const sd of skillSchemaDirs) {
    L.push(`## <a id="skill-schema-${sd}"></a>${sd}`);
    L.push("");

    // Find the matching skill definition
    const skillDef = skills.find(s => s.data.id === sd || s.name === sd);
    if (skillDef) {
      L.push(`**Skill:** ${skillDef.data.name || sd}  `);
      L.push(`**Package:** ${skillDef.data.package || "local"}  `);
      L.push(`**Lifecycle:** ${(skillDef.data.lifecycleStages || []).join(", ")}  `);
      if (skillDef.data.mcpServices?.length) L.push(`**MCP Services:** ${skillDef.data.mcpServices.join(", ")}  `);
      if (skillDef.data.scripts?.length) L.push(`**Scripts:** ${skillDef.data.scripts.map((s: any) => `\`${s.path}\` (${s.runtime})`).join(", ")}  `);
      L.push("");
    }

    const schemaDir = join(rootDir, "schemas", "skills", sd);
    for (const schemaFile of ["input.schema.json", "output.schema.json"]) {
      const fp = join(schemaDir, schemaFile);
      if (!existsSync(fp)) continue;
      try {
        const schema = JSON.parse(readFileSync(fp, "utf-8"));
        const label = schemaFile.replace(".schema.json", "").toUpperCase();
        L.push(`### ${label}`);
        L.push("");
        L.push(`**Title:** ${schema.title || "—"}  `);
        L.push(`**Description:** ${schema.description || "—"}`);
        L.push("");
        L.push(...jsonSchemaPropsTable(schema));
        L.push("");
        L.push(`<details><summary>${schemaFile}</summary>`);
        L.push("");
        L.push("```json");
        L.push(JSON.stringify(schema, null, 2));
        L.push("```");
        L.push("</details>");
        L.push("");
      } catch {}
    }
    L.push("---");
    L.push("");
  }

  return L.join("\n");
}

// ─── 2. SKILLS.md — All skills with schema associations ─────────────────────

function generateSkillsMd(): string {
  const L: string[] = [];
  L.push("# Skills Catalog");
  L.push("");
  L.push(`> **Auto-generated** on ${timestamp()} — Do not edit manually.`);
  L.push("");
  L.push("Every skill with an MCP server, Python/Node/shell script, or external implementation");
  L.push("is associated with input/output schemas via `schemaRef`.");
  L.push("");

  // Group by package
  const byPackage: Record<string, typeof skills> = {};
  for (const s of skills) {
    const pkg = s.data.package || "local";
    (byPackage[pkg] ??= []).push(s);
  }

  L.push("## Summary");
  L.push("");
  L.push(`| Skill | Package | Lifecycle | Schema | MCP | Scripts |`);
  L.push(`|-------|---------|-----------|--------|-----|---------|`);
  for (const s of skills) {
    const d = s.data;
    const hasSchema = d.schemaRef ? "Yes" : "—";
    const hasMcp = d.mcpServices?.length ? d.mcpServices.join(", ") : "—";
    const hasScripts = d.scripts?.length ? `${d.scripts.length} script(s)` : "—";
    L.push(`| **${d.name || s.name}** | ${d.package || "local"} | ${(d.lifecycleStages || []).join(", ")} | ${hasSchema} | ${hasMcp} | ${hasScripts} |`);
  }
  L.push("");

  // Detail per package
  for (const [pkg, pkgSkills] of Object.entries(byPackage)) {
    L.push(`## Package: ${pkg}`);
    L.push("");
    for (const s of pkgSkills) {
      const d = s.data;
      L.push(`### ${d.name || s.name}`);
      L.push("");
      L.push(`**ID:** \`${d.id}\`  `);
      L.push(`**Description:** ${d.description}  `);
      L.push(`**Roles:** ${(d.roles || []).map((r: string) => `\`${r}\``).join(", ")}  `);
      L.push(`**Lifecycle:** ${(d.lifecycleStages || []).join(" → ")}  `);

      if (d.schemaRef) {
        L.push(`**Schema:** [\`${d.schemaRef}\`](../../${d.schemaRef}/)  `);
        // Link to input/output schemas
        const inputPath = join(rootDir, d.schemaRef, "input.schema.json");
        const outputPath = join(rootDir, d.schemaRef, "output.schema.json");
        if (existsSync(inputPath)) L.push(`  - [Input Schema](../../${d.schemaRef}/input.schema.json)  `);
        if (existsSync(outputPath)) L.push(`  - [Output Schema](../../${d.schemaRef}/output.schema.json)  `);
      }

      if (d.mcpServices?.length) {
        L.push(`**MCP Services:** ${d.mcpServices.join(", ")}  `);
      }
      if (d.scripts?.length) {
        L.push(`**Scripts:**  `);
        for (const sc of d.scripts) {
          L.push(`  - \`${sc.path}\` (${sc.runtime}, phase: ${sc.phase})  `);
        }
      }

      if (d.requiredCapabilities?.length) {
        L.push(`**Required Capabilities:**  `);
        for (const c of d.requiredCapabilities) {
          L.push(`  - \`${c.capabilityId}\` (${c.degradation}${c.fallbackCapabilityId ? ` → ${c.fallbackCapabilityId}` : ""})  `);
        }
      }

      if (d.dependsOn?.length) {
        L.push(`**Dependencies:**  `);
        for (const dep of d.dependsOn) {
          L.push(`  - \`${dep.ref}\` (${dep.kind}, ${dep.conformance})  `);
        }
      }

      if (d.routingPatterns?.length) {
        L.push(`**Routing Patterns:** ${d.routingPatterns.map((p: string) => `\`${p}\``).join(", ")}  `);
      }

      L.push("");
    }
  }
  return L.join("\n");
}

// ─── 3. ACTORS.md ────────────────────────────────────────────────────────────

function generateActorsMd(): string {
  const L: string[] = [];
  L.push("# Actors & Roles");
  L.push("");
  L.push(`> **Auto-generated** on ${timestamp()} — Do not edit manually.`);
  L.push("");

  // Hierarchy
  L.push("## Role Hierarchy");
  L.push("");
  L.push("```");
  // Build hierarchy tree
  const roots = actors.filter(a => !a.data.inherits?.length);
  function printTree(id: string, indent: string): void {
    const actor = actors.find(a => a.data.id === id);
    if (!actor) return;
    L.push(`${indent}${actor.data.id} (${actor.data.type}) — ${actor.data.name}`);
    const children = actors.filter(a => a.data.inherits?.includes(id));
    for (const c of children) {
      printTree(c.data.id, indent + "  ");
    }
  }
  for (const r of roots) printTree(r.data.id, "");
  L.push("```");
  L.push("");

  // Detail table
  L.push("## Actor Definitions");
  L.push("");
  L.push("| ID | Name | Type | Inherits | Capabilities |");
  L.push("|----|------|------|----------|-------------|");
  for (const a of actors) {
    const d = a.data;
    L.push(`| \`${d.id}\` | ${d.name} | ${d.type} | ${(d.inherits || []).map((i: string) => `\`${i}\``).join(", ") || "—"} | ${(d.capabilities || []).map((c: string) => `\`${c}\``).join(", ") || "—"} |`);
  }
  L.push("");

  // Detail sections
  for (const a of actors) {
    const d = a.data;
    L.push(`### ${d.name}`);
    L.push("");
    L.push(`**ID:** \`${d.id}\`  `);
    L.push(`**Type:** ${d.type}  `);
    L.push(`**Description:** ${d.description}  `);
    if (d.inherits?.length) L.push(`**Inherits:** ${d.inherits.map((i: string) => `\`${i}\``).join(", ")}  `);
    if (d.capabilities?.length) L.push(`**Capabilities:** ${d.capabilities.map((c: string) => `\`${c}\``).join(", ")}  `);
    if (d.meta) {
      L.push(`**Metadata:**  `);
      for (const [k, v] of Object.entries(d.meta)) {
        L.push(`  - ${k}: ${typeof v === "object" ? JSON.stringify(v) : v}  `);
      }
    }

    // Which skills can this actor invoke? (full transitive inheritance)
    const effectiveRoles = getTransitiveRoles(d.id);
    const accessibleSkills = skills.filter(s =>
      s.data.roles?.some((r: string) => effectiveRoles.has(r))
    );
    if (accessibleSkills.length) {
      L.push(`**Accessible Skills:** ${accessibleSkills.map(s => `\`${s.data.id}\``).join(", ")}  `);
    }
    L.push("");
  }

  return L.join("\n");
}

// ─── 4. CAPABILITIES.md ─────────────────────────────────────────────────────

function generateCapabilitiesMd(): string {
  const L: string[] = [];
  L.push("# Capabilities");
  L.push("");
  L.push(`> **Auto-generated** on ${timestamp()} — Do not edit manually.`);
  L.push("");
  L.push("| ID | Name | Detection | Requires |");
  L.push("|----|------|-----------|----------|");
  for (const c of capabilities) {
    const d = c.data;
    const det = d.detection;
    let detStr = det.method;
    if (det.method === "command") detStr = `command: \`${det.command}\``;
    else if (det.method === "env-var") detStr = `env: \`${det.variable}\``;
    else if (det.method === "file-exists") detStr = `file: \`${det.path}\``;
    else if (det.method === "mcp-probe") detStr = `mcp: \`${det.endpoint}\``;
    L.push(`| \`${d.id}\` | ${d.name} | ${detStr} | ${(d.requires || []).map((r: string) => `\`${r}\``).join(", ") || "—"} |`);
  }
  L.push("");

  for (const c of capabilities) {
    const d = c.data;
    L.push(`### ${d.name}`);
    L.push("");
    L.push(`**ID:** \`${d.id}\`  `);
    L.push(`**Description:** ${d.description}  `);
    L.push(`**Detection:** \`${JSON.stringify(d.detection)}\`  `);
    if (d.requires?.length) L.push(`**Requires:** ${d.requires.map((r: string) => `\`${r}\``).join(", ")}  `);
    // Which skills need this?
    const neededBy = skills.filter(s => s.data.requiredCapabilities?.some((rc: any) => rc.capabilityId === d.id));
    if (neededBy.length) L.push(`**Required by skills:** ${neededBy.map(s => `\`${s.data.id}\``).join(", ")}  `);
    // Which actors provide this?
    const providedBy = actors.filter(a => a.data.capabilities?.includes(d.id));
    if (providedBy.length) L.push(`**Provided by actors:** ${providedBy.map(a => `\`${a.data.id}\``).join(", ")}  `);
    L.push("");
  }
  return L.join("\n");
}

// ─── 5. REQUIREMENTS.md ─────────────────────────────────────────────────────

function generateRequirementsMd(): string {
  const L: string[] = [];
  L.push("# Requirements");
  L.push("");
  L.push(`> **Auto-generated** on ${timestamp()} — Do not edit manually.`);
  L.push("");

  for (const r of requirements) {
    const d = r.data;
    L.push(`## ${d.title}`);
    L.push("");
    L.push(`**ID:** \`${d.id}\`  `);
    L.push(`**Description:** ${d.description}  `);
    if (d.derivedFrom?.length) L.push(`**Derived from:** ${d.derivedFrom.map((df: string) => `\`${df}\``).join(", ")}  `);
    L.push(`**Actors:** ${(d.actors || []).map((a: string) => `\`${a}\``).join(", ")}  `);
    if (d.tags?.length) L.push(`**Tags:** ${d.tags.join(", ")}  `);
    L.push("");

    L.push("| Key | Label | Conformance | Requirement | Satisfied By |");
    L.push("|-----|-------|-------------|-------------|-------------|");
    for (const s of d.statements || []) {
      const satBy = (s.satisfiedBy || []).map((sb: any) => `\`${sb.kind}:${sb.ref}\``).join(", ") || "—";
      L.push(`| \`${s.key}\` | ${s.label} | **${s.conformance}** | ${s.requirement} | ${satBy} |`);
    }
    L.push("");
  }
  return L.join("\n");
}

// ─── 6. PACKAGES.md — Docker deps ───────────────────────────────────────────

function generatePackagesMd(): string {
  const L: string[] = [];
  L.push("# Skill Packages & Docker Dependencies");
  L.push("");
  L.push(`> **Auto-generated** on ${timestamp()} — Do not edit manually.`);
  L.push("");
  L.push("Each skill package declares its Docker/system requirements in `package-manifest.json`");
  L.push("conforming to the [SkillPackageManifest](./SCHEMAS.md#skillpackagemanifest) schema.");
  L.push("The Dockerfile merges all package requirements into a single Ubuntu 24.04 LTS image.");
  L.push("");

  // Summary table
  L.push("## Package Summary");
  L.push("");
  L.push("| Package | Version | Skills | Base Image | APT | Pip | NPM |");
  L.push("|---------|---------|--------|------------|-----|-----|-----|");
  for (const p of packages) {
    const d = p.data;
    L.push(`| **${d.name}** | ${d.version} | ${d.skills?.length || 0} | ${d.docker?.baseImage || "ubuntu:24.04"} | ${d.docker?.aptPackages?.length || 0} | ${d.docker?.pipPackages?.length || 0} | ${d.docker?.npmPackages?.length || 0} |`);
  }
  L.push("");

  // Detail per package
  for (const p of packages) {
    const d = p.data;
    L.push(`## ${d.name}`);
    L.push("");
    L.push(`**Version:** ${d.version}  `);
    L.push(`**Description:** ${d.description}  `);
    L.push(`**Lifecycle Stages:** ${(d.lifecycleStages || []).join(", ")}  `);
    L.push("");

    L.push("### Skills");
    L.push("");
    for (const sk of d.skills || []) {
      const skillDef = skills.find(s => s.data.id === sk);
      if (skillDef) {
        L.push(`- **${sk}** — ${skillDef.data.description} ${skillDef.data.schemaRef ? `([schema](../../${skillDef.data.schemaRef}/))` : ""}`);
      } else {
        L.push(`- **${sk}**`);
      }
    }
    L.push("");

    L.push("### Docker Requirements");
    L.push("");
    L.push(`**Base Image:** \`${d.docker?.baseImage || "ubuntu:24.04"}\``);
    L.push("");

    if (d.docker?.aptPackages?.length) {
      L.push("**APT Packages:**");
      L.push("```");
      L.push(d.docker.aptPackages.join("\n"));
      L.push("```");
      L.push("");
    }
    if (d.docker?.pipPackages?.length) {
      L.push("**Pip Packages:**");
      L.push("```");
      L.push(d.docker.pipPackages.join("\n"));
      L.push("```");
      L.push("");
    }
    if (d.docker?.npmPackages?.length) {
      L.push("**NPM Packages:**");
      L.push("```");
      L.push(d.docker.npmPackages.join("\n"));
      L.push("```");
      L.push("");
    }
    if (d.docker?.setupCommands?.length) {
      L.push("**Setup Commands:**");
      L.push("```bash");
      for (const cmd of d.docker.setupCommands) L.push(cmd);
      L.push("```");
      L.push("");
    }
    if (d.docker?.env && Object.keys(d.docker.env).length) {
      L.push("**Environment Variables:**");
      L.push("```");
      for (const [k, v] of Object.entries(d.docker.env)) L.push(`${k}=${v}`);
      L.push("```");
      L.push("");
    }
    if (d.docker?.exposePorts?.length) {
      L.push(`**Exposed Ports:** ${d.docker.exposePorts.join(", ")}`);
      L.push("");
    }
    if (d.docker?.labels && Object.keys(d.docker.labels).length) {
      L.push("**OCI Labels:**");
      for (const [k, v] of Object.entries(d.docker.labels)) L.push(`- \`${k}\`: ${v}`);
      L.push("");
    }

    if (d.providesCapabilities?.length) {
      L.push(`**Provides Capabilities:** ${d.providesCapabilities.map((c: string) => `\`${c}\``).join(", ")}  `);
    }
    if (d.requiresCapabilities?.length) {
      L.push(`**Requires Capabilities:** ${d.requiresCapabilities.map((c: string) => `\`${c}\``).join(", ")}  `);
    }
    if (d.schemas?.length) {
      L.push(`**Associated Schemas:** ${d.schemas.join(", ")}  `);
    }
    L.push("");
    L.push("---");
    L.push("");
  }

  // Remote packages
  if (remotePackages.length) {
    L.push("# Remote Packages");
    L.push("");
    L.push("Remote packages are maintained in external repositories. A light wrapper in");
    L.push("`skills/remote-packages/` provides `SkillPackageManifest`-compatible Docker requirements.");
    L.push("Agents can sync and update these automatically based on the sync configuration.");
    L.push("");
    L.push("| Package | Maintainer | Repo | Strategy | Frequency | Skills |");
    L.push("|---------|-----------|------|----------|-----------|--------|");
    for (const rp of remotePackages) {
      const d = rp.data;
      L.push(`| **${d.name}** | ${d.maintainer} | \`${d.repo}\` | ${d.sync?.strategy} | ${d.sync?.frequency} | ${d.wrapper?.skills?.join(", ") || "—"} |`);
    }
    L.push("");

    for (const rp of remotePackages) {
      const d = rp.data;
      L.push(`## ${d.name}`);
      L.push("");
      L.push(`**Description:** ${d.description}  `);
      L.push(`**Repository:** \`${d.repo}\`  `);
      L.push(`**Ref:** \`${d.ref}\`  `);
      L.push(`**Maintainer:** ${d.maintainer}  `);
      L.push(`**Sync Strategy:** ${d.sync?.strategy} (${d.sync?.frequency}, autoUpdate: ${d.sync?.autoUpdate})  `);
      L.push("");
      L.push("### Wrapper Docker Requirements");
      L.push("");
      const wd = d.wrapper?.docker;
      if (wd) {
        L.push(`**Base Image:** \`${wd.baseImage || "ubuntu:24.04"}\``);
        if (wd.aptPackages?.length) { L.push(""); L.push("**APT:** " + wd.aptPackages.join(", ")); }
        if (wd.pipPackages?.length) { L.push(""); L.push("**Pip:** " + wd.pipPackages.join(", ")); }
        if (wd.npmPackages?.length) { L.push(""); L.push("**NPM:** " + wd.npmPackages.join(", ")); }
      }
      L.push("");
      if (d.wrapper?.providesCapabilities?.length) {
        L.push(`**Provides Capabilities:** ${d.wrapper.providesCapabilities.map((c: string) => `\`${c}\``).join(", ")}  `);
      }
      if (d.wrapper?.skills?.length) {
        L.push(`**Skills:** ${d.wrapper.skills.join(", ")}  `);
      }
      if (d.wrapper?.lifecycleStages?.length) {
        L.push(`**Lifecycle:** ${d.wrapper.lifecycleStages.join(", ")}  `);
      }
      L.push("");
      L.push("---");
      L.push("");
    }
  }

  return L.join("\n");
}

// ─── 7. LIFECYCLE.md ─────────────────────────────────────────────────────────

function generateLifecycleMd(): string {
  const L: string[] = [];
  L.push("# Content Development Lifecycle");
  L.push("");
  L.push(`> **Auto-generated** on ${timestamp()} — Do not edit manually.`);
  L.push("");

  const stages = ["plan", "author", "validate", "review", "test", "publish", "feedback", "retire"];

  L.push("## Lifecycle Flow");
  L.push("");
  L.push("```");
  L.push(stages.join(" → "));
  L.push("```");
  L.push("");

  L.push("## Stage Details");
  L.push("");

  for (const stage of stages) {
    const stageSkills = skills.filter(s => s.data.lifecycleStages?.includes(stage));
    const stageActors = new Set<string>();
    for (const s of stageSkills) for (const r of s.data.roles || []) stageActors.add(r);

    L.push(`### ${stage.charAt(0).toUpperCase() + stage.slice(1)}`);
    L.push("");
    L.push(`**Skills:** ${stageSkills.map(s => `[\`${s.data.id}\`](#)`).join(", ") || "None"}  `);
    L.push(`**Actors:** ${[...stageActors].map(a => `\`${a}\``).join(", ") || "None"}  `);
    L.push("");

    if (stageSkills.length) {
      L.push("| Skill | Description | Schema |");
      L.push("|-------|-------------|--------|");
      for (const s of stageSkills) {
        const schemaLink = s.data.schemaRef ? `[schema](../../${s.data.schemaRef}/)` : "—";
        L.push(`| \`${s.data.id}\` | ${s.data.description} | ${schemaLink} |`);
      }
      L.push("");
    }
  }

  // Requirements that govern the lifecycle
  L.push("## Lifecycle Requirements");
  L.push("");
  const lifecycleReqs = requirements.filter(r => r.data.tags?.includes("lifecycle") || r.data.id?.includes("lifecycle"));
  for (const r of lifecycleReqs) {
    L.push(`### ${r.data.title}`);
    L.push("");
    L.push(`**ID:** \`${r.data.id}\`  `);
    L.push(`**Description:** ${r.data.description}`);
    L.push("");
    for (const s of r.data.statements || []) {
      L.push(`- **${s.conformance}** \`${s.key}\`: ${s.requirement}`);
    }
    L.push("");
  }

  return L.join("\n");
}

// ─── 8. Catalog JSON ─────────────────────────────────────────────────────────

function generateCatalog(): object {
  return {
    generatedAt: new Date().toISOString(),
    schemaVersion: "1.0",
    coreSchemas: [
      "ActorDefinition", "CapabilityDefinition", "SkillDefinition", "Requirement",
      "SkillRegistry", "RoleAssignment", "DockerRequirements", "SkillPackageManifest", "RemotePackageRef",
    ].map(name => ({
      name,
      jsonSchemaFile: `${name}.schema.json`,
    })),
    skillSchemas: skillSchemaDirs.map(sd => ({
      skillId: sd,
      inputSchema: `skills/${sd}/input.schema.json`,
      outputSchema: `skills/${sd}/output.schema.json`,
      linkedSkill: skills.find(s => s.data.id === sd)?.data.id || null,
    })),
    skills: skills.map(s => ({
      id: s.data.id,
      name: s.data.name,
      package: s.data.package || "local",
      schemaRef: s.data.schemaRef || null,
      hasMcp: !!(s.data.mcpServices?.length),
      hasScripts: !!(s.data.scripts?.length),
      lifecycleStages: s.data.lifecycleStages || [],
    })),
    actors: actors.map(a => ({ id: a.data.id, name: a.data.name, type: a.data.type })),
    capabilities: capabilities.map(c => ({ id: c.data.id, name: c.data.name })),
    requirements: requirements.map(r => ({ id: r.data.id, title: r.data.title })),
    packages: packages.map(p => ({ name: p.data.name, version: p.data.version, skills: p.data.skills })),
    remotePackages: remotePackages.map(rp => ({
      name: rp.data.name,
      repo: rp.data.repo,
      maintainer: rp.data.maintainer,
      syncStrategy: rp.data.sync?.strategy,
      skills: rp.data.wrapper?.skills || [],
    })),
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────

console.log("Generating comprehensive schema documentation...\n");

const docs: [string, () => string][] = [
  ["SCHEMAS.md", generateSchemasMd],
  ["SKILLS.md", generateSkillsMd],
  ["ACTORS.md", generateActorsMd],
  ["CAPABILITIES.md", generateCapabilitiesMd],
  ["REQUIREMENTS.md", generateRequirementsMd],
  ["PACKAGES.md", generatePackagesMd],
  ["LIFECYCLE.md", generateLifecycleMd],
];

for (const [file, gen] of docs) {
  writeFileSync(join(outDir, file), gen());
  console.log(`  ✓ schemas/generated/${file}`);
}

writeFileSync(join(outDir, "index.json"), JSON.stringify(generateCatalog(), null, 2) + "\n");
console.log("  ✓ schemas/generated/index.json");

console.log(`\nGenerated ${docs.length + 1} documentation files.`);
console.log(`  Core schemas: 8`);
console.log(`  Skill schemas: ${skillSchemaDirs.length} (input + output each)`);
console.log(`  Skills: ${skills.length}`);
console.log(`  Actors: ${actors.length}`);
console.log(`  Capabilities: ${capabilities.length}`);
console.log(`  Requirements: ${requirements.length}`);
console.log(`  Packages: ${packages.length}`);
