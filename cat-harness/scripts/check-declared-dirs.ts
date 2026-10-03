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
 * ## Two more, for a directory kept at a branch TIP
 *
 * - **not-cut-over** — it declares the branch and the checkout still tracks
 *   files at the path. Two copies, and nothing says which is authoritative.
 * - **unmounted** — cut over, and nothing mounted here, so every reader of
 *   the path sees an EMPTY graph rather than an unreachable one.
 *
 * A **commit**-keyed directory is still skipped, because for that keying the
 * checkout copy really is an artefact of whether `qa:fetch` ran. The
 * distinction, and the measurements behind it, are in {@link tipPresence}.
 *
 * Exit codes: 0 clean · 1 any finding.
 */
import { spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { basename, join, relative, resolve, sep } from "node:path";

import { instanceRootsIn, readDeclaration } from "../schemas/cat-harness.js";
import {
  contentIsOffCheckout,
  resolveSubgraphSource,
  type ResolvedSubgraphSource,
  type SubgraphSource,
} from "../schemas/subgraph-source.js";
// The marker format has ONE reader, in `branch-store.ts`. This gate asking
// `existsSync` on a path it spelled itself would be a second, and the two
// would drift the first time the marker moved — which it already did once,
// from `--git-common-dir` to the per-worktree git dir (review on #1957).
import { readMarker } from "./branch-store.ts";
// The `folio` graph kind is registered by CORE as a load-time side effect, so
// the harness alone does not know it exists and `readDeclaration` throws on a
// perfectly valid declaration that uses it. Same import, same reason, as
// `check-declared-assets.ts` and `kg-export.ts` carry.
import "../schemas/folio-graph-kind.js";

export interface DirFinding {
  instance: string;
  id: string;
  path: string;
  kind: "absent" | "stale-exemption" | "mirror" | "not-cut-over" | "unmounted";
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
 * What this checkout can say about a directory kept at a branch TIP.
 *
 * Three answers, and **only one of them is a pass**:
 *
 * - **`not-cut-over`** — the declaration names the branch and the checkout
 *   still tracks files at the path, so the graph has two copies and nothing
 *   says which is authoritative. `mountTip` refuses precisely this state
 *   (*"is still tracked on this checkout's branch"*), so a declaration
 *   flipped ahead of the `git rm` leaves the mount permanently refusing while
 *   every reader goes on reading `main`. Bean `9ofm` measured both halves on
 *   `main@4622dc2a`: `branch-store.ts mount --id beans` refused with exit 5,
 *   and `state-mount.ts` — what the session-start hook calls — printed
 *   "Mounted" and exited **0** for the same declaration. This finding is the
 *   guard that makes the flip and the `git rm` one step rather than a state
 *   somebody can leave the repository in.
 * - **`unmounted`** — cut over, and nothing mounted here, so every reader of
 *   this path sees an empty graph. For the work plan that is an empty
 *   `beans list`, which is not evidence that there is no work.
 * - **`mounted`** — a marker for this id, and its mount on disk. It carries
 *   `into`, because the mount is wherever the marker says and not necessarily
 *   the declared path (`mountTip --into`), and a census that assumed the
 *   declared path would count zero files for a mount that is really there.
 *
 * Read from the mount MARKER and `git ls-files`, never from the branch: this
 * gate stays local and offline, so it cannot go red for a network reason and
 * cannot be made green by a fetch. "Could not ask" — no git directory, or a
 * marker that will not parse — is reported as `unmounted` with the reason,
 * because a gate that cannot determine presence has not determined presence.
 */
export function tipPresence(
  loc: { id: string; branch: string; keyedBy: string },
  abs: string,
  repoRoot: string,
): { state: "mounted"; into: string } | { state: "not-cut-over" | "unmounted"; detail: string } {
  const rel = relative(repoRoot, abs).split(sep).join("/") || ".";
  const tracked = spawnSync("git", ["ls-files", "--", rel], { cwd: repoRoot, encoding: "utf-8" });
  if (tracked.status === 0 && tracked.stdout.trim()) {
    const n = tracked.stdout.trim().split("\n").length;
    return {
      state: "not-cut-over",
      detail:
        `declares \`storage.branch: "${loc.branch}"\` (keyed by ${loc.keyedBy}) and the checkout ` +
        `still tracks ${n} file(s) here, so the graph has two copies and nothing says which is ` +
        `authoritative. \`mountTip\` refuses this state, so the mount stays refused while every ` +
        `reader goes on reading this branch. Flipping the declaration and removing the files are ` +
        `ONE change (bean \`9ofm\`): land both, or neither.`,
    };
  }
  let marker;
  try {
    marker = readMarker(repoRoot, loc.id);
  } catch (err) {
    return {
      state: "unmounted",
      detail: `could not determine whether ${loc.branch} is mounted here: ${(err as Error).message}. Not a pass — nothing read this path.`,
    };
  }
  if (marker && existsSync(marker.into)) return { state: "mounted", into: marker.into };
  return {
    state: "unmounted",
    detail:
      `is cut over to \`${loc.branch}\` and ${marker ? `its marker points at ${marker.into}, which is gone` : "nothing is mounted here"}, ` +
      `so every reader of this path sees an EMPTY graph rather than an unreachable one. ` +
      `Mount it (\`bun run state:mount\`); "no content" and "could not reach the content" are different answers.`,
  };
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
          storage?: { branch: string; keyedBy?: string };
          source?: SubgraphSource;
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

    // Content off the checkout — `source: { kind: "branch" }` or the legacy
    // `storage` (beans `16ei`, `l4ay`). `contentIsOffCheckout` is the cheap,
    // throw-free question: is this entry's content elsewhere at all. It is
    // asked FIRST so the common case costs nothing.
    if (contentIsOffCheckout(e)) {
      // ...and then WHICH elsewhere, because the keyings are not the same
      // question and treating them alike is what bean `9ofm` measured going
      // wrong.
      //
      // `commit`-keyed is qa-store's layout: the checkout holds at most a
      // working copy whose size depends on whether `qa:fetch` ran, so its
      // absence IS the declared state and its presence is not a stale
      // exemption either. Neither direction applies — skipped, as before.
      //
      // A branch TIP is deterministic, so skipping it would be `1xhc`: a
      // reader of this path sees nothing, and "no content" and "could not
      // reach the content" would be indistinguishable from here. See
      // {@link tipPresence}.
      let src: ResolvedSubgraphSource;
      try {
        src = resolveSubgraphSource(e);
      } catch (err) {
        // The resolver throws on a contradiction a reader must not paper over
        // (both fields, or a tip-keyed `qa`). It is a finding here rather than
        // a crash, so one bad entry does not take the whole sweep with it —
        // and `unmounted` is the honest state: nothing read this path.
        findings.push({ instance: instanceRoot, id: e.id, path: e.path, kind: "unmounted", detail: (err as Error).message });
        continue;
      }
      if (src.kind !== "branch" || src.keyedBy !== "tip") continue;
      const t = tipPresence(src, abs, repoRoot);
      if (t.state !== "mounted") findings.push({ instance: instanceRoot, id: e.id, path: e.path, kind: t.state, detail: t.detail });
      continue;
    }
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
