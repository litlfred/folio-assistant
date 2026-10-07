#!/usr/bin/env bun
/**
 * mount:update — the UPDATE half of a remote mount: what `git submodule
 * update --remote` is to a submodule, with the commit of the new gitlink
 * replaced by a person's recorded consent.
 *
 * @module scripts/mount-update
 * @graphNode none — a command-line tool over declared `remoteMounts`
 * @covers none — it reports and, on consent, re-pins; the gates judge what it mounts
 *
 * Owner, 2026-10-07 (#2467, PR #2468). The workflow it implements is the skill
 * `kg-core/pinned-remote-dependency`; this script is the `kg-remote-mount`
 * Tool's `status` / `plan-update` / `apply`.
 *
 *   bun run cat mount:update                        # every tracked mount: status, and the plan where behind
 *   bun run cat mount:update --instance <harness>   # one mount
 *   bun run cat mount:update --instance <harness> --yes-consent-by <login> --evidence <text>
 *
 * ## Pins stay pins
 *
 * A mount's `ref` is a 40-character SHA and nothing here follows a branch on
 * its own. `track` (the `branch =` of `.gitmodules`) only says WHERE to look
 * for a newer commit. Without the consent flags this script writes NOTHING:
 * it prints the plan and the exact question, and exits
 * {@link AWAITING_CONSENT}.
 *
 * ## Consent is a person's, never an agent's
 *
 * `--yes-consent-by` records that a named PERSON approved this exact commit,
 * with `--evidence` saying where (an issue comment, a chat message). An agent
 * never passes these flags on its own initiative: it runs the plan, shows it
 * to the person, asks the question, and passes the flags only to record an
 * answer the person actually gave. Rule H8 (`schemas/mount-trust.ts`) then
 * reads that consent like any other.
 *
 * ## Drift refuses
 *
 * If any mounted file no longer matches the lock — somebody edited a mounted
 * directory — the update is refused and the edited paths are listed. Those
 * edits are somebody's work: move them upstream (a PR to the fork) first.
 * Nothing is overwritten.
 *
 * ## Exit codes
 *
 * 0 up to date, not tracked, or applied · 1 refused (drift) or the re-mount
 * did not mount · 2 could not determine · 4 awaiting consent.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { checkoutRootFor, readDeclaration } from "../schemas/cat-harness.js";
import { readDeclaredMounts, writeDeclaredMounts } from "../schemas/index-config.js";
import { mountLockPathFor, readMountLock, type LockedInstance, type RemoteMount } from "../schemas/remote-mount.js";
import { declaringInstances, modifiedSince, mountRemote, pathCollisions, relocateCommand, summarise } from "./remote-mount.ts";
import { urlFor as lockUrlFor } from "./mount-from-lock.ts";
import { type UrlFor } from "./remote-tree.ts";

/** GitHub, or `CAT_MOUNT_URL_PREFIX` in its place: the replayer's rule, so a test serves both the same way. */
const defaultUrlFor: UrlFor = lockUrlFor;

/** The exit code for "a plan is ready and waits on a person's answer". */
export const AWAITING_CONSENT = 4;

export const HELP = `bun run cat mount:update [--instance <harness>] [--root <dir>] [--yes-consent-by <login> --evidence <text>]

For each remote mount that declares \`track\` (a branch), fetch that branch's tip
and compare it with the pin. Up to date: says so. Behind: prints the plan
(commits, files changed under the mounted directories and assets, the
declaration diff, and the package.json checkoutScripts added, removed and
changed) and the question "Update <harness> <pin7> → <tip7>?", writes nothing,
and exits ${AWAITING_CONSENT} (awaiting consent).

--yes-consent-by <login> --evidence <text>
    Record that the PERSON <login> approved re-pinning to the tip just shown,
    and where (<text>): writes the new \`ref\` and \`trust.consent\`, then re-mounts
    and re-locks. Refused if the mounted files have drifted from the lock.

    AGENTS MUST NEVER PASS THESE FLAGS ON THEIR OWN INITIATIVE. Show the plan to
    the person, ask the question, and pass the flags only to record the answer
    they gave, with evidence pointing at it.

Exit codes: 0 up to date / applied, 1 refused, 2 could not determine, ${AWAITING_CONSENT} awaiting consent.`;

export interface ScriptChange {
  added: { name: string; command: string }[];
  removed: { name: string; command: string }[];
  changed: { name: string; from: string; to: string }[];
}

export interface UpdateReport {
  harness: string;
  repository: string;
  pin: string;
  track?: string;
  state: "not-tracked" | "up-to-date" | "update-available" | "could-not-determine";
  tip?: string;
  /** Commits on `track` that the pin does not have. */
  behind?: number;
  /** The pin is not an ancestor of the tip: the branch was rewritten or the pin is elsewhere. */
  diverged?: boolean;
  reason?: string;
  /** Files changed pin → tip under the mounted directories, assets and declaration (upstream paths). */
  filesChanged?: string[];
  declarationDiff?: string;
  /** `package.json` checkoutScripts, per manifest, pin → tip. */
  scripts?: Record<string, ScriptChange>;
}

function git(cwd: string, args: string[]): { status: number; stdout: string; stderr: string } {
  const r = spawnSync("git", args, { cwd, encoding: "utf-8", maxBuffer: 1 << 28 });
  return { status: r.status ?? 128, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

function scriptsAt(dir: string, rev: string, file: string): Record<string, string> | undefined {
  const r = git(dir, ["show", `${rev}:${file}`]);
  if (r.status !== 0) return undefined;
  try {
    const s = (JSON.parse(r.stdout) as { checkoutScripts?: unknown }).checkoutScripts;
    return s !== null && typeof s === "object" ? Object.fromEntries(Object.entries(s as Record<string, unknown>).filter(([, v]) => typeof v === "string")) as Record<string, string> : {};
  } catch {
    return undefined;
  }
}

/** The script-level difference between two `checkoutScripts` tables. */
export function diffScripts(from: Record<string, string>, to: Record<string, string>): ScriptChange {
  const out: ScriptChange = { added: [], removed: [], changed: [] };
  for (const [name, command] of Object.entries(to)) {
    if (!(name in from)) out.added.push({ name, command });
    else if (from[name] !== command) out.changed.push({ name, from: from[name]!, to: command });
  }
  for (const [name, command] of Object.entries(from)) if (!(name in to)) out.removed.push({ name, command });
  return out;
}

/** The lock's instances that THIS mount laid down from ITS repository: what a new pin of that repository moves. */
function lockedFor(instanceRoot: string, downstream: string, m: RemoteMount): LockedInstance[] | undefined {
  const r = readMountLock(mountLockPathFor(instanceRoot, downstream));
  if (!r.ok) return undefined;
  return r.lock.instances.filter((i) => i.via === m.harness && i.repository === m.repository);
}

/**
 * Status and, where behind, the plan for one mount. Fetches the tracked
 * branch's history (blobless) into a temporary repository; writes nothing in
 * the checkout.
 */
export function planUpdate(instanceRoot: string, downstream: string, m: RemoteMount, urlFor: UrlFor = defaultUrlFor): UpdateReport {
  const base: UpdateReport = { harness: m.harness, repository: m.repository, pin: m.ref, track: m.track, state: "not-tracked" };
  if (!m.track) return base;
  const dir = mkdtempSync(join(tmpdir(), "mount-update-"));
  try {
    for (const step of [
      ["init", "-q"],
      ["remote", "add", "origin", urlFor(m.repository)],
      ["fetch", "-q", "--filter=blob:none", "origin", `+refs/heads/${m.track}:refs/remotes/origin/${m.track}`],
    ]) {
      const r = git(dir, step);
      if (r.status !== 0) return { ...base, state: "could-not-determine", reason: `could not read \`${m.track}\` of ${m.repository}: ${r.stderr.trim().split("\n").pop() ?? r.status}` };
    }
    const tip = git(dir, ["rev-parse", `refs/remotes/origin/${m.track}`]).stdout.trim();
    if (tip === m.ref) return { ...base, state: "up-to-date", tip, behind: 0 };
    if (git(dir, ["cat-file", "-e", `${m.ref}^{commit}`]).status !== 0) {
      const f = git(dir, ["fetch", "-q", "--filter=blob:none", "origin", m.ref]);
      if (f.status !== 0) return { ...base, state: "could-not-determine", tip, reason: `could not fetch the pin ${m.ref.slice(0, 12)}: ${f.stderr.trim().split("\n").pop()}` };
    }
    const behind = Number(git(dir, ["rev-list", "--count", `${m.ref}..${tip}`]).stdout.trim());
    const diverged = git(dir, ["merge-base", "--is-ancestor", m.ref, tip]).status !== 0;
    const locked = lockedFor(instanceRoot, downstream, m) ?? [];
    // What the mount reads: its directories, assets and declarations (`.` is everything).
    const paths = new Set<string>();
    const manifests = new Set<string>();
    for (const i of locked) {
      const root = i.upstreamRoot.replace(/\/+$/, "");
      paths.add(root ? `${root}/${i.declaration.file}` : i.declaration.file);
      for (const d of i.directories) paths.add(d.upstreamPath === "." ? (root || ".") : d.upstreamPath);
      for (const a of i.assets ?? []) paths.add(a.upstreamPath);
      manifests.add(root ? `${root}/package.json` : "package.json");
    }
    if (locked.length === 0) {
      paths.add(".");
      manifests.add("package.json");
    }
    const spec = [...paths];
    const filesChanged = git(dir, ["diff", "--name-only", m.ref, tip, "--", ...spec]).stdout.split("\n").filter(Boolean);
    const declFiles = locked.map((i) => (i.upstreamRoot ? `${i.upstreamRoot.replace(/\/+$/, "")}/${i.declaration.file}` : i.declaration.file));
    const declarationDiff = declFiles.length ? git(dir, ["diff", m.ref, tip, "--", ...declFiles]).stdout : "";
    const scripts: Record<string, ScriptChange> = {};
    for (const f of manifests) {
      const a = scriptsAt(dir, m.ref, f);
      const b = scriptsAt(dir, tip, f);
      if (a === undefined && b === undefined) continue;
      const d = diffScripts(a ?? {}, b ?? {});
      if (d.added.length || d.removed.length || d.changed.length) scripts[f] = d;
    }
    return { ...base, state: "update-available", tip, behind, diverged, filesChanged, declarationDiff, scripts };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** The one question a person answers. */
export function question(r: UpdateReport): string {
  return `Update ${r.harness} ${r.pin.slice(0, 7)} → ${(r.tip ?? "").slice(0, 7)}?`;
}

export function renderReport(r: UpdateReport): string {
  const L: string[] = [`## ${r.harness} (${r.repository})`];
  if (r.state === "not-tracked") return [...L, "", "No `track` declared: nothing to update from. The pin stands."].join("\n");
  if (r.state === "could-not-determine") return [...L, "", `❔ could not determine: ${r.reason}`].join("\n");
  if (r.state === "up-to-date") return [...L, "", `✓ up to date: \`${r.track}\` is at the pin ${r.pin.slice(0, 12)}.`].join("\n");
  L.push("", `**update available**: ${r.behind} commit(s) behind \`${r.track}\` — ${r.pin.slice(0, 12)} → ${r.tip!.slice(0, 12)}${r.diverged ? " (the pin is NOT an ancestor of the tip: the branch was rewritten)" : ""}.`, "");
  L.push(`Files changed under what is mounted: ${r.filesChanged!.length}`);
  for (const f of r.filesChanged!.slice(0, 50)) L.push(`- ${f}`);
  if (r.filesChanged!.length > 50) L.push(`- … and ${r.filesChanged!.length - 50} more`);
  for (const [f, d] of Object.entries(r.scripts ?? {})) {
    L.push("", `\`${f}\` checkoutScripts:`);
    for (const a of d.added) L.push(`- added \`${a.name}\`: \`${a.command}\``);
    for (const x of d.removed) L.push(`- removed \`${x.name}\`: \`${x.command}\``);
    for (const c of d.changed) L.push(`- changed \`${c.name}\`: \`${c.from}\` → \`${c.to}\``);
  }
  if (r.declarationDiff) L.push("", "Declaration diff:", "```diff", r.declarationDiff.trimEnd(), "```");
  return L.join("\n");
}

export interface ApplyResult {
  state: "applied" | "refused" | "could-not-determine";
  detail: string;
  /** For `refused`: the mounted paths whose bytes no longer match the lock. */
  edited?: string[];
}

/**
 * Re-pin `harness` to `tip` on a person's consent, then re-mount and re-lock.
 * Refused, writing nothing, when the mounted files have drifted from the lock.
 */
export function applyUpdate(
  instanceRoot: string,
  harness: string,
  tip: string,
  consent: { by: string; evidence: string; on?: string },
  opts: { urlFor?: UrlFor } = {},
): ApplyResult {
  const decl = readDeclaration(instanceRoot);
  if (!decl) return { state: "could-not-determine", detail: `${instanceRoot} holds no declaration` };
  let declared: ReturnType<typeof readDeclaredMounts>;
  try {
    declared = readDeclaredMounts(instanceRoot);
  } catch (e) {
    return { state: "could-not-determine", detail: (e as Error).message };
  }
  const m = declared.mounts.find((x) => x.harness === harness);
  if (!m) return { state: "could-not-determine", detail: `no remote mount named \`${harness}\`` };
  const lock = readMountLock(mountLockPathFor(instanceRoot, decl.name));
  if (!lock.ok) return { state: "could-not-determine", detail: `the lock cannot be read (${lock.why}); run \`bun run cat mount:remote\` before updating` };
  const locked = lock.lock.instances.filter((i) => i.via === harness);
  const edited: string[] = [];
  const absent: string[] = [];
  for (const i of locked) {
    edited.push(...modifiedSince(instanceRoot, i));
    const d = join(instanceRoot, i.path, i.declaration.file);
    if (!existsSync(d)) absent.push(`${i.path}/${i.declaration.file}`);
    for (const dir of i.directories) if (!existsSync(join(instanceRoot, dir.path))) absent.push(dir.path);
  }
  if (edited.length) {
    return {
      state: "refused",
      edited,
      detail: `refused: ${edited.join(", ")} no longer match the lock. Those edits are somebody's work: move them upstream as a PR to the fork first, then update. Nothing was changed.`,
    };
  }
  if (absent.length) return { state: "refused", detail: `refused: ${absent.join(", ")} not on disk; run \`bun run cat mount:lock\` so the mounted files match the lock, then update` };

  // THE write path for mounts (`schemas/index-config.ts`): it writes
  // `index.config.json`, and refuses while the declaration still carries
  // `remoteMounts` (migrate first: `bun run cat index-config:migrate --write`).
  const next = declared.mounts.map((x) =>
    x.harness === harness ? { ...x, ref: tip, trust: { consent: { by: consent.by, on: consent.on ?? new Date().toISOString().slice(0, 10), ref: tip, evidence: consent.evidence } } } : x,
  );
  try {
    writeDeclaredMounts(instanceRoot, next);
  } catch (e) {
    return { state: "refused", detail: `refused before anything changed: ${(e as Error).message}` };
  }
  const r = mountRemote({ instanceRoot, urlFor: opts.urlFor ?? defaultUrlFor });
  const mine = r.plan.outcomes.filter((o) => locked.some((i) => i.instance === o.instance) || o.instance === harness);
  const sum = summarise(mine);
  return sum.state === "mounted"
    ? { state: "applied", detail: `re-pinned \`${harness}\` to ${tip.slice(0, 12)} on ${consent.by}'s consent, re-mounted and re-locked: ${sum.reason}` }
    : { state: sum.state === "could-not-determine" ? "could-not-determine" : "refused", detail: `re-pinned \`${harness}\` to ${tip.slice(0, 12)}, but the re-mount did not mount: ${mine.map((o) => `${o.instance} ${o.state}: ${o.detail}`).join("; ")}` };
}

// ── Health (the `remote-mounts` check's evidence) ────────────────────────────

/**
 * One row of the `remote-mounts` health check. Read from the declaration, the
 * lock and the disk; for a mount with `track`, also the tracked branch's tip.
 * Never writes.
 */
export interface MountHealthRow {
  /** The declaring (downstream) instance. */
  downstream: string;
  /** The mounted instance, or the mount's harness when the row is about the mount as a whole. */
  instance: string;
  state: "mounted" | "refused-not-identical" | "refused-other" | "modified-since-mount" | "path-collision" | "tracked-under-mount" | "update-available" | "could-not-determine";
  detail: string;
  path?: string;
  /** For `refused-other`: `trust` (H8), `tracked`, `absent-at-pin`, or `missing` (the upstream does not hold it). */
  reason?: string;
  differing?: string[];
  extra?: string[];
  /** For `modified-since-mount`: the mounted paths whose bytes no longer match the lock. */
  edited?: string[];
  /** For `update-available`. */
  behind?: number;
  track?: string;
}

/**
 * The health of every remote mount `instanceRoot` declares. `network: false`
 * skips the tracked-branch question (and says so in no row: an untracked
 * check is simply not asked). Reads only.
 */
export function mountHealth(instanceRoot: string, opts: { network?: boolean; urlFor?: UrlFor } = {}): MountHealthRow[] {
  const decl = readDeclaration(instanceRoot);
  if (!decl) return [];
  let mounts: RemoteMount[];
  try {
    mounts = readDeclaredMounts(instanceRoot).mounts;
  } catch (e) {
    return [{ downstream: decl.name, instance: "(declaration)", state: "could-not-determine", detail: (e as Error).message }];
  }
  if (mounts.length === 0) return [];
  const downstream = decl.name;
  let lock: ReturnType<typeof readMountLock>;
  try {
    lock = readMountLock(mountLockPathFor(instanceRoot, downstream));
  } catch (e) {
    lock = { ok: false, absent: false, why: (e as Error).message };
  }
  if (!lock.ok) {
    return mounts.map((m) => ({
      downstream,
      instance: m.harness,
      state: "could-not-determine" as const,
      detail: lock.absent ? "declared, and no lock: never mounted here — run `bun run cat mount:remote`" : `the lock cannot be read: ${lock.why}`,
    }));
  }
  const rows: MountHealthRow[] = [];
  const stale = new Set(mounts.filter((m) => !lock.lock.mounts.some((l) => l.harness === m.harness && l.repository === m.repository && l.ref === m.ref)).map((m) => m.harness));
  for (const h of stale) rows.push({ downstream, instance: h, state: "could-not-determine", detail: "the lock was written for another pin than the declaration names — run `bun run cat mount:remote`" });
  const refusedHere = new Set<string>();
  for (const u of lock.lock.unmounted) {
    if (u.state === "local" || u.state === "skipped") continue; // answers, not mounts this downstream lays down
    refusedHere.add(u.instance);
    if (u.state === "could-not-determine" && u.refusal === undefined) {
      rows.push({ downstream, instance: u.instance, state: "could-not-determine", detail: u.detail });
    } else if (u.refusal === "not-identical") {
      rows.push({ downstream, instance: u.instance, state: "refused-not-identical", detail: u.detail, differing: u.differing ?? [], extra: u.extra ?? [] });
    } else if (u.refusal === "path-collision") {
      rows.push({ downstream, instance: u.instance, state: "path-collision", detail: u.detail });
    } else {
      rows.push({ downstream, instance: u.instance, state: "refused-other", detail: u.detail, reason: u.refusal ?? "missing" });
    }
  }
  for (const i of lock.lock.instances) {
    if (refusedHere.has(i.instance) || stale.has(i.via)) continue;
    try {
      const edited = modifiedSince(instanceRoot, i);
      const d = join(instanceRoot, i.path, i.declaration.file);
      const absent: string[] = [];
      if (!existsSync(d)) absent.push(`${i.path}/${i.declaration.file}`);
      else if (sha256(readFileSync(d)) !== i.declaration.sha256) edited.push(`${i.path}/${i.declaration.file}`);
      for (const dir of i.directories) if (!existsSync(join(instanceRoot, dir.path))) absent.push(dir.path);
      for (const a of i.assets ?? []) if (!existsSync(join(instanceRoot, a.path))) absent.push(a.path);
      if (edited.length) rows.push({ downstream, instance: i.instance, path: i.path, state: "modified-since-mount", detail: `${edited.join(", ")} no longer match the lock`, edited });
      else if (absent.length) rows.push({ downstream, instance: i.instance, path: i.path, state: "could-not-determine", detail: `locked but not laid down here (${absent.join(", ")}) — run \`bun run cat mount:lock\`` });
      else rows.push({ downstream, instance: i.instance, path: i.path, state: "mounted", detail: `${i.repository}@${i.sha.slice(0, 12)}, matching the lock` });
    } catch (e) {
      rows.push({ downstream, instance: i.instance, path: i.path, state: "could-not-determine", detail: `could not read: ${(e as Error).message}` });
    }
  }
  // Bean `t4xb`: every effective mount path — locked, or declared and not yet
  // laid down — against the declared directories, the reserved root names and
  // each other. A collision is reported with the command that fixes it.
  const effective = [
    ...lock.lock.instances.map((i) => ({ instance: i.instance, path: i.path })),
    ...mounts.filter((m) => !lock.lock.instances.some((i) => i.instance === m.harness) && !refusedHere.has(m.harness)).map((m) => ({ instance: m.harness, path: (m.overrides?.[m.harness]?.path ?? m.harness).replace(/\/+$/, "") })),
  ];
  for (const [instance, msgs] of pathCollisions(instanceRoot, effective)) {
    const path = effective.find((e) => e.instance === instance)!.path;
    rows.push({ downstream, instance, path, state: "path-collision", detail: `${msgs.join("; ")}. Fix: ${relocateCommand(instance, path)}` });
  }
  // Mounted code is git-ignored and never committed (#2468): a tracked file
  // under a mount path is a finding here as well as the `check:mount-tracked` gate.
  for (const e of effective) {
    const r = spawnSync("git", ["ls-files", "--", e.path], { cwd: instanceRoot, encoding: "utf-8" });
    if (r.status !== 0) {
      if (r.status === 128 && /not a git repository/.test(r.stderr ?? "")) continue; // not a checkout: nothing can be tracked
      rows.push({ downstream, instance: e.instance, path: e.path, state: "could-not-determine", detail: `git ls-files -- ${e.path} exited ${r.status}` });
      continue;
    }
    const files = r.stdout.split("\n").filter(Boolean);
    if (files.length) rows.push({ downstream, instance: e.instance, path: e.path, state: "tracked-under-mount", detail: `${files.length} tracked file(s) under \`${e.path}/\`: ${files.slice(0, 10).join(", ")}`, edited: files });
  }
  if (opts.network !== false) {
    for (const m of mounts) {
      if (!m.track) continue;
      const r = planUpdate(instanceRoot, downstream, m, opts.urlFor ?? defaultUrlFor);
      if (r.state === "could-not-determine") rows.push({ downstream, instance: m.harness, state: "could-not-determine", detail: `\`${m.track}\`: ${r.reason}`, track: m.track });
      else if (r.state === "update-available")
        rows.push({ downstream, instance: m.harness, state: "update-available", detail: `${r.behind} commits behind \`${m.track}\` (${m.ref.slice(0, 12)} → ${r.tip!.slice(0, 12)})`, behind: r.behind, track: m.track });
    }
  }
  return rows;
}

const sha256 = (b: Buffer): string => createHash("sha256").update(b).digest("hex");

if (import.meta.main) {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(HELP);
    process.exit(0);
  }
  const arg = (f: string): string | undefined => {
    const i = argv.indexOf(f);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const only = arg("--instance");
  const by = arg("--yes-consent-by");
  const evidence = arg("--evidence");
  if ((by === undefined) !== (evidence === undefined)) {
    console.error("--yes-consent-by and --evidence go together: a consent with no evidence cannot be read back.");
    process.exit(2);
  }
  const checkout = arg("--root") ? resolve(arg("--root")!) : checkoutRootFor(process.cwd());
  const roots = arg("--root") ? [checkout] : declaringInstances(checkout).roots;
  const reports: Array<{ root: string; downstream: string; r: UpdateReport }> = [];
  for (const root of roots) {
    const decl = readDeclaration(root);
    if (!decl) continue;
    for (const m of readDeclaredMounts(root).mounts) {
      if (only && m.harness !== only) continue;
      reports.push({ root, downstream: decl.name, r: planUpdate(root, decl.name, m) });
    }
  }
  if (reports.length === 0) {
    console.log(only ? `mount:update: no remote mount named \`${only}\`` : "mount:update: not enabled — no remote mounts declared");
    process.exit(only ? 2 : 0);
  }
  for (const x of reports) console.log(renderReport(x.r) + "\n");
  const behind = reports.filter((x) => x.r.state === "update-available");
  if (by !== undefined) {
    if (behind.length !== 1) {
      console.error(`mount:update: consent applies to ONE mount's tip; ${behind.length} have an update. Name it with --instance.`);
      process.exit(2);
    }
    const t = behind[0]!;
    const res = applyUpdate(t.root, t.r.harness, t.r.tip!, { by, evidence: evidence! });
    console.log(res.detail);
    process.exit(res.state === "applied" ? 0 : res.state === "refused" ? 1 : 2);
  }
  if (reports.some((x) => x.r.state === "could-not-determine")) process.exit(2);
  if (behind.length) {
    for (const x of behind) console.log(question(x.r));
    console.log("\nNothing was written. A PERSON answers; an agent passes --yes-consent-by only to record that answer.");
    process.exit(AWAITING_CONSENT);
  }
  process.exit(0);
}
