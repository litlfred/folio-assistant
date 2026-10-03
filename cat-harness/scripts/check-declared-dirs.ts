#!/usr/bin/env bun
/**
 * Every declared directory exists, or says why it does not.
 *
 * @module scripts/check-declared-dirs
 * @covers cat-harness
 *
 * ## The gap, and why no existing check could have found it
 *
 * `resolveDirectories` is **existence-filtered**. A declared directory that is
 * not on disk is dropped before any consumer sees it — which is right for a
 * consumer (scanning a path that is not there is not useful) and is precisely
 * why nothing ever reported one. A declaration asserts *this directory is
 * ours*; when that is false, every consumer reports a clean run over nothing.
 * The `dh4f` shape, inside the resolver they all depend on. Bean `8mbk`.
 *
 * The neighbouring checks each answer a different question and none answers
 * this one: `check:declared-assets` verifies declared FILES and their links,
 * `check:declared-paths` refuses a literal naming a declared directory, and
 * `check:declaration-claims` compares prose against the files. A directory
 * declared into thin air passes all three.
 *
 * ## Two directions, and the second is the one that rots quietly
 *
 * - **absent, unexplained** — declared and not on disk, with no `absent`
 *   reason. A finding.
 * - **explained, but present** — declares `absent` and the directory exists.
 *   Also a finding: an exemption that outlived its cause reads as a live
 *   decision and is not one. Nothing goes wrong when this rots, which is
 *   exactly why it needs a checker rather than a reader.
 *
 * Checking only the first direction would let the escape hatch become
 * permanent the moment somebody created the directory, and the declaration
 * would go on claiming a deliberate absence forever.
 *
 * ## Where a path resolves against
 *
 * `scope: "repository"` resolves against the REPOSITORY root; anything else
 * against the declaring INSTANCE's root — the rule `KgAssetSchema.src`
 * already states for assets. Getting this backwards is not a subtle bug: a
 * first measurement for `8mbk` joined other instances' repo-scoped paths onto
 * the instance root and reported **ten** phantom absences out of 35. Every one
 * was the checker's error.
 *
 * ## Instances are DISCOVERED, not listed
 *
 * Via {@link instanceRootsIn}, the same way `check:declared-assets` does, and
 * for the reason recorded there: that gate twice reported a clean run over
 * instances a hardcoded list had never heard of.
 *
 * ## A third finding: a MIRROR of another instance's directory
 *
 * - **mirror** — a `scope: "repository"` entry whose path lies inside ANOTHER
 *   instance's root. Until bean `cmsl` step 3 (issue #1694, PR #1747)
 *   `cat-harness.json` declared twenty of these — `who-iris/library/`,
 *   `folio-assistant-core/skills/`, … — so the platform named the instances
 *   stacked on it, under ids that had already drifted from the owners' own.
 *   Each instance declares its own directories; the checkout aggregates them
 *   (the root instance `needs` every staged instance, and `check:instance-graph`
 *   refuses one it does not reach). A mirror is refused so the twenty cannot
 *   quietly come back one at a time.
 *
 * Exit codes: 0 clean · 1 any finding.
 */
import { existsSync, statSync } from "node:fs";
import { basename, join, resolve, sep } from "node:path";

import { instanceRootsIn, readDeclaration } from "../schemas/cat-harness.js";
// The `folio` graph kind is registered by CORE as a load-time side effect, so
// the harness alone does not know it exists and `readDeclaration` throws on a
// perfectly valid declaration that uses it. Same import, same reason, as
// `check-declared-assets.ts` and `kg-export.ts` carry.
import "../schemas/folio-graph-kind.js";

export interface DirFinding {
  instance: string;
  id: string;
  path: string;
  kind: "absent" | "stale-exemption" | "mirror";
  detail: string;
}

/**
 * Where `path` resolves, given the entry's `scope`.
 *
 * Exported because the resolution rule is the part a reader most needs to be
 * able to check, and the one this module has already got wrong once.
 */
export function resolveDeclaredPath(
  entry: { path: string; scope?: string },
  instanceRoot: string,
  repoRoot: string,
): string {
  return join(entry.scope === "repository" ? repoRoot : instanceRoot, entry.path);
}

/**
 * @param otherInstances every instance root in the checkout; a
 *   repository-scoped entry inside one of them other than the declaring
 *   instance is a `mirror`. An instance that CONTAINS the declaring one (the
 *   checkout's root instance) is not "other" for this purpose — every path is
 *   inside it.
 */
export function auditInstance(
  instanceRoot: string,
  repoRoot: string,
  otherInstances: readonly string[] = [],
): DirFinding[] {
  const decl = readDeclaration(instanceRoot) as
    | {
        directories?: Array<{
          id: string;
          path: string;
          scope?: string;
          absent?: { reason: string };
          storage?: { branch: string };
        }>;
      }
    | undefined;
  if (!decl?.directories) return [];

  const findings: DirFinding[] = [];
  for (const e of decl.directories) {
    const abs = resolveDeclaredPath(e, instanceRoot, repoRoot);
    // A FILE at the declared path is not the directory being there. Checking
    // `existsSync` alone would pass on one, and a consumer that calls
    // `readdirSync` on it throws rather than reporting an empty graph.
    const present = existsSync(abs) && statSync(abs).isDirectory();

    // A STORED directory (`storage.branch`, bean `16ei`) is kept on its
    // branch, so its absence from the checkout is the declared state, not a
    // missing directory — and its presence (a fetched working copy) is not a
    // stale exemption either. Neither direction applies.
    if (e.storage?.branch) continue;
    if (!present && !e.absent) {
      findings.push({
        instance: instanceRoot,
        id: e.id,
        path: e.path,
        kind: "absent",
        detail:
          `declared and not on disk. Create it, drop the declaration, or record ` +
          `\`"absent": { "reason": "…" }\` saying why it is meant to be missing.`,
      });
    }
    if (e.scope === "repository") {
      const target = resolve(abs);
      const self = resolve(instanceRoot);
      const owner = otherInstances
        .map((r) => resolve(r))
        .filter((r) => r !== self && !(self + sep).startsWith(r === sep ? r : r + sep))
        .find((r) => target === r || target.startsWith(r + sep));
      if (owner !== undefined) {
        findings.push({
          instance: instanceRoot,
          id: e.id,
          path: e.path,
          kind: "mirror",
          detail:
            `a repository-scoped entry inside another instance (${basename(owner)}). ` +
            `That instance declares its own directories and the checkout aggregates ` +
            `them (bean \`cmsl\`): drop this entry, and if a corpus-wide tool then ` +
            `misses the directory, the root instance must \`need\` ${basename(owner)}.`,
        });
      }
    }
    if (present && e.absent) {
      findings.push({
        instance: instanceRoot,
        id: e.id,
        path: e.path,
        kind: "stale-exemption",
        detail:
          `declares \`absent\` — "${e.absent.reason}" — but the directory exists. ` +
          `The exemption has outlived its cause; remove it.`,
      });
    }
  }
  return findings;
}

if (import.meta.main) {
  const repoRoot = process.cwd();
  const instances = instanceRootsIn(repoRoot);
  let findings: DirFinding[] = [];
  let declared = 0;
  let exempt = 0;

  for (const inst of instances) {
    const decl = readDeclaration(inst) as { directories?: unknown[] } | undefined;
    declared += decl?.directories?.length ?? 0;
    exempt += (decl?.directories as Array<{ absent?: unknown }> | undefined)?.filter((d) => d.absent).length ?? 0;
    findings = findings.concat(auditInstance(inst, repoRoot, instances));
  }

  for (const f of findings) {
    console.error(`  ✗ ${basename(f.instance) || f.instance}/${f.id} (${f.path}): ${f.kind} — ${f.detail}`);
  }
  console.log(
    // NAMED, not just counted — `check:declared-assets` records why: a bare
    // count reads as success until you know how many instances there were.
    `${declared} declared director(ies) across ${instances.length} instance(s) ` +
      `(${instances.map((p) => basename(p) || p).sort().join(", ")}); ` +
      `${exempt} declared absent with a reason; ${findings.length} finding(s)`,
  );
  process.exit(findings.length > 0 ? 1 : 0);
}

export { instanceRootsIn, resolve };
