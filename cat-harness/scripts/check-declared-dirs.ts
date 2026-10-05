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
 * ## It covers entries declared FROM WITHIN too — and did not until 2026-10-03
 *
 * The sweep below read each instance's `<instance>.json` `directories` and
 * nothing else, so every entry a declaration declares from within — the
 * `docs/docs.json`, `beans/beans.json`, `voices/voices.json` shape sanctioned
 * by #980 — was neither checked nor counted. **32 directories**, measured.
 *
 * Found by mutation rather than by reading: pointing a real nested entry at a
 * path that does not exist produced
 *
 *     111 declared director(ies) across 15 instance(s); 0 finding(s)   exit=0
 *
 * byte-identical to the sound path. So this module's own opening paragraph —
 * a declaration into thin air makes every consumer "report a clean run over
 * nothing" — was true OF THIS MODULE for a whole class of declaration. The
 * `dh4f` shape inside the checker written to stop it. Bean `xsrv`.
 *
 * The summary counts the two separately and never adds them: how many
 * directories an instance declares and how many more are declared inside one
 * are different questions, and one total would hide the second behind the
 * first, which is how these went unnoticed.
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
 * A **route**-keyed directory gets the FIRST of those two and not the second:
 * two copies is still two copies, but there is no route-keyed mount for
 * `unmounted` to be about. {@link routePresence} carries why, and which gate asks
 * the question this one declines.
 *
 * A **commit**-keyed directory is still skipped entirely, because for that keying
 * the checkout copy really is an artefact of whether `qa:fetch` ran. The
 * distinction, and the measurements behind it, are in {@link tipPresence}.
 *
 * Exit codes: 0 clean · 1 any finding.
 */
import { spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { basename, join, relative, resolve, sep } from "node:path";

import { instanceRootsIn, nestedDirectories, readDeclaration } from "../schemas/cat-harness.js";
import { defaultGraphKinds } from "../schemas/graph-kind-registry.js";
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
  /**
   * Set on a NESTED entry: the declaration that holds it, instance-relative
   * (`docs/docs.json`), and the parent entry's id.
   *
   * Absent means the entry is in the instance's own `<instance>.json`. The
   * field exists because `detail` says *"drop the declaration"*, and a reader
   * who opens `<instance>.json` for a nested entry will not find it there —
   * a remedy pointing at the wrong file is worse than none.
   */
  nestedIn?: { file: string; parentId: string };
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
 * What this checkout can say about a directory kept per published ROUTE.
 *
 * **Two answers, not three**, and the missing one is the whole point of having a
 * separate function rather than a `keyedBy` branch inside {@link tipPresence}:
 *
 * - **`not-cut-over`** — identical to the tip case, and for an identical reason.
 *   The declaration names a branch, the checkout still tracks files at the path,
 *   so the graph has two copies and nothing says which is authoritative. Bean
 *   `9ofm`'s guard is about TWO COPIES, and route-keying does not change how many
 *   there are.
 * - **`off-checkout`** — the files are not tracked here. **Not a finding**, and
 *   not a pass dressed as one either: it is this gate declining a question it
 *   cannot ask. There is nothing further to measure locally, because…
 *
 * ## …there is no `unmounted` for a route store, and that is not a gap
 *
 * `tipPresence`'s third state reads the mount MARKER. A route store has no
 * mount: `tipLocations` defaults to `keyedBy: "tip"` and `state-mount.ts` takes
 * that default, so a route entry is never a mount candidate, and `mountTip`
 * itself reads no `keyedBy` at all — pointed at a route branch it opens a
 * tip-keyed store and `verifiedTip` answers **`corrupt`** (measured against the
 * seeded `cat/cat-harness/uml-overview`, whose manifest is route-keyed). So "cut
 * over and nothing mounted here" is not a state a route store can be in;
 * reporting it would be a finding against a mechanism that does not exist, and
 * one nobody could ever clear.
 *
 * **What replaces it is a different gate, not a missing branch here.** Whether
 * the branch actually carries the routes is answered by the route's own
 * generator `--check` — `route-authority.ts`'s `compareRoute`, which reports
 * `unknown` and refuses to pass when it cannot fetch. That question needs the
 * network. This gate is deliberately offline (`tipPresence`: *"it cannot go red
 * for a network reason and cannot be made green by a fetch"*), so answering it
 * here would mean giving this gate a second posture. Two gates, one each.
 */
export function routePresence(
  loc: { id: string; branch: string; keyedBy: string },
  abs: string,
  repoRoot: string,
): { state: "off-checkout" } | { state: "not-cut-over"; detail: string } {
  const rel = relative(repoRoot, abs).split(sep).join("/") || ".";
  const tracked = spawnSync("git", ["ls-files", "--", rel], { cwd: repoRoot, encoding: "utf-8" });
  if (!(tracked.status === 0 && tracked.stdout.trim())) return { state: "off-checkout" };
  const n = tracked.stdout.trim().split("\n").length;
  return {
    state: "not-cut-over",
    detail:
      `declares \`storage.branch: "${loc.branch}"\` (keyed by route) and the checkout still tracks ` +
      `${n} file(s) here, so the graph has two copies and nothing says which is authoritative. ` +
      `For a ROUTE store that is worse than ambiguous: the site build serves whichever copy its path ` +
      `resolves to, and the generator's \`--check\` compares against the BRANCH, so the two disagree ` +
      `silently. Flipping the declaration and removing the files are ONE change (bean \`9ofm\`): land ` +
      `both, or neither.`,
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
      findings.push(...offCheckoutFindings(e, abs, instanceRoot, repoRoot));
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
  return findings.concat(auditNested(instanceRoot, repoRoot, decl));
}

/**
 * The same two directions, over the entries a declaration declares FROM
 * WITHIN — `docs/docs.json`, `beans/beans.json`, `voices/voices.json`.
 *
 * ## Why this is a second function and not a longer loop
 *
 * Nested entries differ in three ways that each need saying once rather than
 * as a branch inside the loop above. They carry no `scope`: `walkNested`
 * composes the path from the parent's, so it is already instance-relative and
 * there is nothing to resolve. They therefore cannot be a `mirror` — that
 * finding is about a `scope: "repository"` path landing inside another
 * instance, which a composed path cannot do. And the remedy differs, because
 * the entry is in a different file.
 *
 * ## The gap it closes, measured
 *
 * The loop above reads `decl.directories` — an instance's TOP-LEVEL entries
 * only — and the summary counted the same list, so a nested entry was neither
 * checked nor counted. Measured 2026-10-03 by pointing a real nested entry at
 * `assets/img/uml/NOPE`:
 *
 *     111 declared director(ies) across 15 instance(s); 0 finding(s)   exit=0
 *
 * identical to the sound path, and identical to the tree before the entry
 * existed. **That is the `dh4f` shape inside the checker written to prevent
 * it** — this module's own docblock opens by saying a declaration into thin air
 * makes every consumer "report a clean run over nothing", and five entries in
 * `cat-harness/docs/docs.json` were exactly that: `proposals`, `requirements`,
 * `auto-docs` and the two uml routes (bean `xsrv`).
 *
 * It also explains a thing reported on #2022 as a quirk: `audit:coverage` calls
 * `auto-docs` `no-directory` because nothing resolved a nested path for
 * presence.
 *
 * `nestedDirectories` walks to any depth and guards a declaration naming its
 * own directory, so this inherits both rather than restating them.
 */
/** How many entries a declaration declares from within, at any depth. */
function auditNestedCount(
  instanceRoot: string,
  decl: { directories?: unknown[] } | undefined,
): number {
  return nestedDirectories(instanceRoot, decl as Parameters<typeof nestedDirectories>[1]).length;
}

/**
 * The declaration a nested entry actually lives in: its parent's directory,
 * plus the `declarationFile` the parent's own kind names.
 *
 * **Derived, because the obvious shortcut is wrong.** Stripping the last
 * segment of the nested entry's path looks right and is not: a nested path may
 * be several segments deep, so `assets/img/uml/overview` yields
 * `assets/img/uml/` — a directory holding no declaration at all. Measured on
 * the first version of this function, whose finding sent a reader to exactly
 * that path. `declarationFile` on the kind is the one place that fact lives
 * (`graph-kind-registry.ts`), which is why it is asked rather than assumed.
 *
 * Returns the parent's directory alone when the parent's kind names no
 * `declarationFile` — nothing else is known, and naming a file that may not
 * exist would be the same defect one level along.
 */
function declaringFile(
  parentId: string,
  byId: ReadonlyMap<string, { path: string; graphKinds: readonly string[] }>,
): string {
  const parent = byId.get(parentId);
  if (!parent) return "(the declaration naming it)";
  const dir = `${parent.path.replace(/\/+$/, "")}/`;
  const file = parent.graphKinds.map((g) => defaultGraphKinds.get(g)?.declarationFile).find((f) => typeof f === "string");
  return file === undefined ? dir : `${dir}${file}`;
}

/**
 * The findings for an entry whose content is OFF the checkout, by keying.
 *
 * Extracted from the sweep so the nested pass cannot answer this differently
 * (bean `xsrv`). It is the divergence that matters, not the duplication: the
 * first version of `auditNested` wrote `if (contentIsOffCheckout(e)) continue`,
 * so a nested stored directory got the silent skip while an identical top-level
 * one got the three states below. Two answers to one question, decided by where
 * the entry happened to be declared.
 *
 * ...and WHICH elsewhere, because the keyings are not the same question and
 * treating them alike is what bean `9ofm` measured going wrong.
 *
 * `commit`-keyed is qa-store's layout: the checkout holds at most a working
 * copy whose size depends on whether `qa:fetch` ran, so its absence IS the
 * declared state and its presence is not a stale exemption either. Neither
 * direction applies — skipped.
 *
 * A branch TIP is deterministic, so skipping it would be `1xhc`: a reader of
 * this path sees nothing, and "no content" and "could not reach the content"
 * would be indistinguishable from here. See {@link tipPresence}.
 *
 * **`route` is HALF of the tip question, and only half.** This paragraph said
 * "skipped too, and that is a decision rather than an omission", with the right
 * reason for the wrong scope: there is no route-keyed mount — `tipLocations`
 * defaults to `tip` and `state-mount.ts:168` takes that default, so a route entry
 * is never a mount candidate — and `unmounted` really would be a verdict about a
 * mechanism that does not exist. But `not-cut-over` is not about a mount. It is
 * about TWO COPIES, and a route-keyed declaration whose files are still tracked
 * here has exactly two, the same as a tip-keyed one. Skipping the keying skipped
 * both halves and only one of them was meant to go.
 *
 * That paragraph also said the question arrives "when `xsrv` cuts a reader over —
 * and at that point this is the one place to add it". This is that point, and
 * this is that place. See {@link routePresence}.
 */
function offCheckoutFindings(
  e: { id: string; path: string; absent?: { reason: string } },
  abs: string,
  instanceRoot: string,
  repoRoot: string,
): DirFinding[] {
  let src: ResolvedSubgraphSource;
  try {
    src = resolveSubgraphSource(e);
  } catch (err) {
    // The resolver throws on a contradiction a reader must not paper over
    // (both fields, or a tip-keyed `qa`). It is a finding here rather than a
    // crash, so one bad entry does not take the whole sweep with it — and
    // `unmounted` is the honest state: nothing read this path.
    return [{ instance: instanceRoot, id: e.id, path: e.path, kind: "unmounted", detail: (err as Error).message }];
  }
  // A FAMILY (bean `lehh`) is on its branches by declaration and mounted one
  // member at a time, so an absent path is the expected state, not a finding —
  // fsh-guts' precedent, without a single tip to compare against.
  if (src.kind === "family") return [];
  if (src.kind !== "branch") return [];
  if (src.keyedBy === "route") {
    const r = routePresence(src, abs, repoRoot);
    return r.state === "off-checkout" ? [] : [{ instance: instanceRoot, id: e.id, path: e.path, kind: r.state, detail: r.detail }];
  }
  if (src.keyedBy !== "tip") return [];
  const t = tipPresence(src, abs, repoRoot);
  return t.state === "mounted" ? [] : [{ instance: instanceRoot, id: e.id, path: e.path, kind: t.state, detail: t.detail }];
}

export function auditNested(
  instanceRoot: string,
  repoRoot: string,
  decl: { directories?: ReadonlyArray<{ id: string; path: string; graphKinds?: readonly string[] }> } | undefined,
): DirFinding[] {
  const findings: DirFinding[] = [];
  // `nestedDirectories` wants the whole declaration shape; only `directories`
  // is read, and a structural parameter keeps this callable from a test
  // fixture that has no reason to carry an instance `name`.
  const nested = nestedDirectories(instanceRoot, decl as Parameters<typeof nestedDirectories>[1]);
  // Every entry a parent id can name: the instance's own, then the nested ones
  // (`walkNested` goes to any depth, so a parent may itself be nested).
  const byId = new Map<string, { path: string; graphKinds: readonly string[] }>();
  for (const d of decl?.directories ?? []) byId.set(d.id, { path: d.path, graphKinds: d.graphKinds ?? [] });
  for (const n of nested) byId.set(n.id, { path: n.path, graphKinds: n.graphKinds });
  for (const n of nested) {
    const e = n as typeof n & { absent?: { reason: string }; storage?: { branch: string }; source?: SubgraphSource };
    const abs = join(instanceRoot, n.path);
    if (contentIsOffCheckout(e)) {
      // The same three answers a top-level entry gets, from the same function.
      findings.push(...offCheckoutFindings({ ...e, id: n.id, path: n.path }, abs, instanceRoot, repoRoot));
      continue;
    }
    const present = existsSync(abs) && statSync(abs).isDirectory();
    const where = { file: declaringFile(n.parentId, byId), parentId: n.parentId };
    if (!present && !e.absent) {
      findings.push({
        instance: instanceRoot,
        id: n.id,
        path: n.path,
        kind: "absent",
        detail:
          `declared FROM WITHIN and not on disk. Create it, drop the nested entry, or ` +
          `record \`"absent": { "reason": "…" }\` on it. It is NOT in this instance's ` +
          `own declaration — look in the declaration under \`${where.file}\`.`,
        nestedIn: where,
      });
    }
    if (present && e.absent) {
      findings.push({
        instance: instanceRoot,
        id: n.id,
        path: n.path,
        kind: "stale-exemption",
        detail:
          `a nested entry declares \`absent\` — "${e.absent.reason}" — but the directory ` +
          `exists. The exemption has outlived its cause; remove it from the declaration ` +
          `under \`${where.file}\`.`,
        nestedIn: where,
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
  let nestedCount = 0;

  for (const inst of instances) {
    const decl = readDeclaration(inst) as { directories?: unknown[] } | undefined;
    declared += decl?.directories?.length ?? 0;
    exempt += (decl?.directories as Array<{ absent?: unknown }> | undefined)?.filter((d) => d.absent).length ?? 0;
    // Counted SEPARATELY, never folded into `declared`. The two numbers answer
    // different questions — how many directories an instance declares, and how
    // many more are declared from within one of them — and a single total would
    // hide the second behind the first, which is how the nested entries went
    // unchecked in the first place. A zero here is also a fact worth printing:
    // it says this checkout has no from-within declaration, not that the walk
    // was skipped.
    nestedCount += auditNestedCount(inst, decl);
    findings = findings.concat(auditInstance(inst, repoRoot, instances));
  }

  for (const f of findings) {
    console.error(`  ✗ ${basename(f.instance) || f.instance}/${f.id} (${f.path}): ${f.kind} — ${f.detail}`);
  }
  console.log(
    // NAMED, not just counted — `check:declared-assets` records why: a bare
    // count reads as success until you know how many instances there were.
    `${declared} declared director(ies) across ${instances.length} instance(s) ` +
      `(${instances.map((p) => basename(p) || p).sort().join(", ")}) ` +
      `plus ${nestedCount} declared FROM WITHIN one of them; ` +
      `${exempt} declared absent with a reason; ${findings.length} finding(s)`,
  );
  process.exit(findings.length > 0 ? 1 : 0);
}

export { instanceRootsIn, resolve };
