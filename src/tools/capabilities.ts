/**
 * Run the declared capability probes.
 *
 * `.claude/skills/capabilities/*.json` has always described how to detect each
 * external tool — a command, an env var, a file — and `requires` edges between
 * them. Nothing executed them: `--check-deps` carried its own hardcoded list,
 * and so did `src/tools/check-deps.ts`. So the probes were documentation, and
 * a skill declaring `requiredCapabilities` had nothing to check against.
 *
 * That matters beyond tidiness. The integration contract in
 * `docs/proposals/rag-document-ingestion.md` §5 rests on **absent tool ⇒
 * `n/a`, never a false pass** — a document nobody parsed must not read as a
 * document with nothing in it. An unexecuted probe cannot deliver that: a
 * skill whose tool is missing looks identical to one whose tool found nothing.
 *
 * This module executes them. It does not replace the two hardcoded lists —
 * unifying those is a separate change with its own blast radius — so
 * `--check-deps` now reports both, and says which is which.
 *
 * @module src/tools/capabilities
 */

import { execSync } from "child_process";
import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";

export interface CapabilityDetection {
  method: "command" | "env-var" | "file-exists" | "mcp-probe" | "always";
  command?: string;
  variable?: string;
  path?: string;
  endpoint?: string;
  expectExitCode?: number;
}

export interface Capability {
  id: string;
  name: string;
  description: string;
  detection: CapabilityDetection;
  requires?: string[];
}

export interface CapabilityStatus {
  id: string;
  name: string;
  present: boolean;
  /** Why it is unavailable — a missing prerequisite reads differently from a failed probe. */
  reason?: string;
  /** Prerequisites that are themselves absent. */
  missingRequires: string[];
}

/** Load every declared capability. Returns `[]` when the directory is absent. */
export function loadCapabilities(repoRoot: string): Capability[] {
  const dir = join(repoRoot, ".claude", "skills", "capabilities");
  if (!existsSync(dir)) return [];
  const out: Capability[] = [];
  for (const f of readdirSync(dir).sort()) {
    if (!f.endsWith(".json")) continue;
    try {
      const c = JSON.parse(readFileSync(join(dir, f), "utf-8")) as Capability;
      if (c?.id && c?.detection?.method) out.push(c);
    } catch {
      // A malformed probe is not a present capability. Skipping it here is
      // safe because `probe` reports it absent, which is the honest default.
    }
  }
  return out;
}

/**
 * Execute one probe.
 *
 * `mcp-probe` is deliberately not attempted: it would mean a network call from
 * a dependency check, and a check that hangs is worse than one that abstains.
 * It reports absent with a reason rather than pretending either way.
 */
export function probe(c: Capability, env: NodeJS.ProcessEnv = process.env): boolean {
  const d = c.detection;
  switch (d.method) {
    case "always":
      return true;
    case "env-var":
      return !!(d.variable && env[d.variable]);
    case "file-exists":
      return !!(d.path && existsSync(d.path));
    case "command": {
      if (!d.command) return false;
      try {
        execSync(d.command, { stdio: "pipe", env });
        return true;
      } catch (e) {
        const code = (e as { status?: number }).status;
        return d.expectExitCode !== undefined && code === d.expectExitCode;
      }
    }
    case "mcp-probe":
      return false;
    default:
      return false;
  }
}

/**
 * Probe everything, resolving `requires` first.
 *
 * A capability whose prerequisite is missing is reported absent **with that
 * prerequisite named**, and its own probe is not run — running it would either
 * fail confusingly or, worse, succeed and hide the broken dependency. Cycles
 * are treated as unmet rather than followed.
 */
export function probeAll(
  caps: Capability[],
  env: NodeJS.ProcessEnv = process.env,
): CapabilityStatus[] {
  const byId = new Map(caps.map((c) => [c.id, c]));
  const resolved = new Map<string, boolean>();
  const inFlight = new Set<string>();

  function resolve(id: string): boolean {
    if (resolved.has(id)) return resolved.get(id)!;
    const c = byId.get(id);
    if (!c) return false;
    if (inFlight.has(id)) return false; // cycle — unmet rather than infinite
    inFlight.add(id);
    const requiresMet = (c.requires ?? []).every((r) => resolve(r));
    const ok = requiresMet && probe(c, env);
    inFlight.delete(id);
    resolved.set(id, ok);
    return ok;
  }

  return caps.map((c) => {
    const present = resolve(c.id);
    const missingRequires = (c.requires ?? []).filter((r) => !resolved.get(r));
    return {
      id: c.id,
      name: c.name,
      present,
      missingRequires,
      reason: present
        ? undefined
        : missingRequires.length
          ? `requires ${missingRequires.join(", ")}`
          : c.detection.method === "mcp-probe"
            ? "mcp-probe not attempted from a dependency check"
            : "probe failed",
    };
  });
}

/** Human-readable report, in `--check-deps`'s existing idiom. */
export function formatCapabilityReport(statuses: CapabilityStatus[]): string {
  if (statuses.length === 0) return "  (no capability probes declared)";
  const lines: string[] = [];
  for (const s of statuses) {
    lines.push(`  ${s.present ? "✓" : "○"} ${s.id.padEnd(20)} ${s.present ? "" : `— ${s.reason}`}`);
  }
  return lines.join("\n");
}
