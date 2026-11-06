#!/usr/bin/env bun
/**
 * repin-standing — move every pin a STANDING consent covers to the newest
 * (or newest green) commit of the branch it follows, and record that rule's
 * consent for each new pin.
 *
 * @module scripts/repin-standing
 * @graphNode none — a scheduled maintenance step over a site's own `index.config.json`
 * @covers none — it moves pins; the mount (`remote-mount.ts`) and its trust
 * check judge what it moved, exactly as they judge a pin a person moved.
 *
 * Each site keeps its own lock. The rule and its trust semantics are the
 * harness's (`cat-harness/schemas/kg/mount-trust.ts`, "Standing consent"); this is
 * the implementation.
 *
 *   bun run cat mount:repin:standing                 # resolve, re-pin, re-mount (writes index.config.json + index.lock.json)
 *   bun run cat mount:repin:standing --dry-run       # resolve and print what WOULD move; write nothing
 *   bun run cat mount:repin:standing --no-mount      # write index.config.json only; run mount:remote yourself
 *   ... --instance <root>   --depth <n>   --consent-on <YYYY-MM-DD>   --summary-file <f>   --no-install
 *
 * ## What it does, per instance
 *
 * 1. Reads the site's declared mounts through `readDeclaredMounts` and keeps
 *    those whose own `trust.standing` is declared.
 * 2. Resolves the followed branch through {@link GitHubApi} — the ONLY place
 *    this script reaches the network, so tests stub it. Without `require`, the
 *    candidate is the branch head; with `require: "green"`, the newest of the
 *    last `--depth` commits whose own combined status and check runs are green
 *    ({@link verdictOf}). None green: that instance does not move.
 * 3. Asks `standingCovers` (the harness's pure coverage decision) whether the
 *    rule covers the move. Not covered: reported, not moved.
 * 4. Moves the covered pins with `seedRemote` — the same write `mount:remote
 *    --seed` makes — with the rule's grant (`standingGrantOf`), so the consent
 *    for each new pin is written in the same write, by the rule's person,
 *    marked `standing`.
 * 5. Re-mounts with `mountRemote`, which rewrites `index.lock.json` and runs
 *    the trust check over every instance of the closure, and re-renders the
 *    agent surface when the lock changed (`afterMount`). A transitive instance
 *    whose consent does not cover its new pin is refused there, as always.
 *
 * Instances reached through a gitlink move with their parent's tree; a
 * `standing` rule on `overrides.<name>.trust` is not followed here.
 *
 * Exit: 0 when it finished (moved or nothing to move); 1 when the re-mount
 * reported an instance missing or refused; 2 when a branch or verdict could
 * not be determined, or a write failed.
 */
import { appendFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { standingCovers, standingGrantOf, type StandingCandidate, type StandingConsent } from "../schemas/kg/mount-trust.js";
import type { RemoteMount } from "../schemas/kg/remote-mount.js";

// ── The network, behind one seam ────────────────────────────────────────────

export type CommitVerdict = NonNullable<StandingCandidate["verdict"]>;

/** Everything this script asks GitHub. Tests pass a stub; {@link githubApi} is the real one. */
export interface GitHubApi {
  /** The last `limit` commits of `branch` in `repository` (`owner/repo`), NEWEST FIRST. */
  branchCommits(repository: string, branch: string, limit: number): Promise<string[]>;
  /** The commit's own combined status and check runs, reduced by {@link verdictOf}. */
  commitVerdict(repository: string, sha: string): Promise<CommitVerdict>;
}

/** The raw shapes {@link verdictOf} reads: GitHub's combined status and check-runs responses, reduced to what matters. */
export interface RawStatus {
  state: string;
  total_count: number;
}
export interface RawCheckRun {
  status: string;
  conclusion: string | null;
}

const PASSING_CONCLUSIONS = new Set(["success", "neutral", "skipped"]);

/**
 * One commit's verdict from its combined status and its check runs.
 * `green` only when at least ONE signal exists and every one passed — a
 * commit nothing checked is `none`, never green. Any failure is `red`; any
 * signal not yet concluded is `pending`.
 */
export function verdictOf(status: RawStatus | undefined, runs: readonly RawCheckRun[]): CommitVerdict {
  const statuses = status && status.total_count > 0 ? status.state : undefined;
  if (statuses === undefined && runs.length === 0) return "none";
  const failed = (statuses !== undefined && (statuses === "failure" || statuses === "error")) || runs.some((r) => r.status === "completed" && !PASSING_CONCLUSIONS.has(r.conclusion ?? ""));
  if (failed) return "red";
  const pending = (statuses !== undefined && statuses !== "success") || runs.some((r) => r.status !== "completed");
  return pending ? "pending" : "green";
}

/** The real {@link GitHubApi}: the REST API with `GITHUB_TOKEN` / `GH_TOKEN` when set. */
export function githubApi(token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN, base = process.env.GITHUB_API_URL ?? "https://api.github.com"): GitHubApi {
  const get = async <T>(path: string): Promise<T> => {
    // Read-only REST calls; what comes back is data (shas and states), checked by `standingCovers` before any pin moves.
    const r = await fetch(`${base}${path}`, {
      headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (!r.ok) throw new Error(`GET ${path}: HTTP ${r.status}`);
    return (await r.json()) as T;
  };
  const repo = (r: string) => r.split("/").map(encodeURIComponent).join("/");
  return {
    async branchCommits(repository, branch, limit) {
      const xs = await get<Array<{ sha: string }>>(`/repos/${repo(repository)}/commits?sha=${encodeURIComponent(branch)}&per_page=${Math.min(Math.max(limit, 1), 100)}`);
      return xs.map((x) => x.sha);
    },
    async commitVerdict(repository, sha) {
      const [status, runs] = await Promise.all([
        get<RawStatus>(`/repos/${repo(repository)}/commits/${sha}/status`),
        get<{ check_runs: RawCheckRun[] }>(`/repos/${repo(repository)}/commits/${sha}/check-runs?per_page=100`),
      ]);
      return verdictOf(status, runs.check_runs);
    },
  };
}

/**
 * The candidate a rule would pin: the branch head, or — `require: "green"` —
 * the newest of the last `depth` commits whose verdict is green. `undefined`
 * when the rule requires green and none of them is.
 */
export async function candidateFor(api: GitHubApi, repository: string, rule: StandingConsent, depth = 30): Promise<{ candidate?: StandingCandidate; looked: Array<{ sha: string; verdict: CommitVerdict }> }> {
  const shas = await api.branchCommits(repository, rule.follows, rule.require === "green" ? depth : 1);
  const looked: Array<{ sha: string; verdict: CommitVerdict }> = [];
  if (rule.require !== "green") return { candidate: shas[0] ? { branch: rule.follows, sha: shas[0] } : undefined, looked };
  for (const sha of shas.slice(0, depth)) {
    const verdict = await api.commitVerdict(repository, sha);
    looked.push({ sha, verdict });
    if (verdict === "green") return { candidate: { branch: rule.follows, sha, verdict }, looked };
  }
  return { candidate: undefined, looked };
}

// ── The plan ─────────────────────────────────────────────────────────────────

export interface PlannedMove {
  harness: string;
  repository: string;
  from: string;
  to: string;
  rule: StandingConsent;
  /** Commits passed over on the way to `to` (newer, not green). */
  skipped: Array<{ sha: string; verdict: CommitVerdict }>;
}

export interface RepinPlan {
  moves: PlannedMove[];
  /** Instances with a standing rule that do not move, and why. */
  held: Array<{ harness: string; reason: string }>;
  /** Instances whose branch or verdict could not be determined. */
  unknown: Array<{ harness: string; reason: string }>;
}

/** Resolve what each standing rule among `mounts` would move. Reads the network only through `api`; writes nothing. */
export async function planRepin(mounts: readonly RemoteMount[], api: GitHubApi, depth = 30): Promise<RepinPlan> {
  const plan: RepinPlan = { moves: [], held: [], unknown: [] };
  for (const m of mounts) {
    const rule = m.trust?.standing;
    if (!rule) continue;
    let found: Awaited<ReturnType<typeof candidateFor>>;
    try {
      found = await candidateFor(api, m.repository, rule, depth);
    } catch (e) {
      plan.unknown.push({ harness: m.harness, reason: `could not resolve \`${rule.follows}\` of ${m.repository}: ${(e as Error).message}` });
      continue;
    }
    if (!found.candidate) {
      plan.held.push({
        harness: m.harness,
        reason: rule.require === "green" ? `none of the last ${found.looked.length} commit(s) of \`${rule.follows}\` is green` : `\`${rule.follows}\` of ${m.repository} has no commits`,
      });
      continue;
    }
    const cover = standingCovers(m, found.candidate);
    if (!cover.covered) {
      plan.held.push({ harness: m.harness, reason: cover.reason });
      continue;
    }
    plan.moves.push({ harness: m.harness, repository: m.repository, from: m.ref, to: found.candidate.sha, rule, skipped: found.looked.filter((l) => l.sha !== found.candidate!.sha) });
  }
  return plan;
}

// ── Applying it: the existing mount:remote write paths ─────────────────────

export interface ApplyOptions {
  /** Consent date written on each new pin (default today, UTC). */
  on?: string;
  /** Re-mount after writing the config, so the lock moves too. Default true. */
  mount?: boolean;
  /** Passed to `mountRemote` — tests serve fixture repositories. */
  urlFor?: (repository: string) => string;
  install?: "production" | "all" | false;
}

export interface ApplyResult {
  configFile?: string;
  /** `mountRemote`'s overall state, when it ran. */
  mountState?: string;
  mountText?: string;
  exit: number;
}

/**
 * Write each planned move through `seedRemote` (the `--seed` path: pin and
 * consent in one write, other entries untouched), one rule's grant per
 * instance, then re-mount so `index.lock.json` follows. Imported lazily so
 * a dry run, and the pure parts' tests, load no mount machinery.
 */
export async function applyRepin(instanceRoot: string, plan: RepinPlan, opts: ApplyOptions = {}): Promise<ApplyResult> {
  if (plan.moves.length === 0) return { exit: 0 };
  const rm = await import("./remote-mount.ts");
  let configFile: string | undefined;
  for (const mv of plan.moves) {
    configFile = rm.seedRemote(instanceRoot, [{ harness: mv.harness, repository: mv.repository, ref: mv.to }], standingGrantOf(mv.rule, opts.on)).file;
  }
  if (opts.mount === false) return { configFile, exit: 0 };
  const before = rm.lockBytes(instanceRoot);
  const r = rm.mountRemote({ instanceRoot, urlFor: opts.urlFor, install: opts.install ?? "production" });
  const s = rm.summarise(r.plan.outcomes);
  const mountText = rm.reportOutcomes("Remote mounts after the standing repin", s.state, s.reason, r.plan.outcomes);
  // `--no-agent-surface` when no install ran: a fixture checkout has no generators to run.
  const exit = rm.afterMount(instanceRoot, before, opts.install === false ? ["--no-agent-surface"] : [], rm.exitCode(s.state));
  return { configFile, mountState: s.state, mountText, exit };
}

/** The moved pins as Markdown — the run's output, and the PR body the workflow opens. */
export function summaryOf(plan: RepinPlan, dryRun: boolean): string {
  const L: string[] = [`## Standing repin${dryRun ? " (dry run)" : ""}`, ""];
  if (plan.moves.length === 0) L.push("No pin moved.", "");
  else {
    L.push("| instance | repository | from | to | follows | consent by |", "|---|---|---|---|---|---|");
    for (const m of plan.moves) {
      L.push(
        `| ${m.harness} | ${m.repository} | \`${m.from.slice(0, 12)}\` | \`${m.to.slice(0, 12)}\` | \`${m.rule.follows}\`${m.rule.require ? ` (${m.rule.require})` : ""} | ${m.rule.consentBy} (standing, ${m.rule.consentAt}) |`,
      );
    }
    L.push("");
    for (const m of plan.moves.filter((x) => x.skipped.length > 0)) L.push(`- ${m.harness}: passed over ${m.skipped.map((s) => `\`${s.sha.slice(0, 10)}\` (${s.verdict})`).join(", ")}`);
    if (plan.moves.some((x) => x.skipped.length > 0)) L.push("");
  }
  if (plan.held.length) L.push("Held:", ...plan.held.map((h) => `- ${h.harness}: ${h.reason}`), "");
  if (plan.unknown.length) L.push("**Could not determine:**", ...plan.unknown.map((h) => `- ${h.harness}: ${h.reason}`), "");
  return L.join("\n");
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const valueOf = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const dryRun = argv.includes("--dry-run");
  try {
    const { checkoutRootFor } = await import("../schemas/kg/cat-harness.js");
    const { readDeclaredMounts } = await import("../schemas/kg/index-config.js");
    const root = valueOf("--instance") ? resolve(valueOf("--instance")!) : checkoutRootFor(process.cwd());
    const depth = Number(valueOf("--depth") ?? 30);
    const plan = await planRepin(readDeclaredMounts(root).mounts, githubApi(), Number.isFinite(depth) && depth > 0 ? depth : 30);
    const text = summaryOf(plan, dryRun);
    console.log(text);
    const summaryFile = valueOf("--summary-file");
    if (summaryFile) writeFileSync(summaryFile, text + "\n");
    if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `moved=${dryRun ? 0 : plan.moves.length}\n`);
    let exit = plan.unknown.length > 0 ? 2 : 0;
    if (!dryRun && plan.moves.length > 0) {
      const r = await applyRepin(root, plan, {
        on: valueOf("--consent-on"),
        mount: !argv.includes("--no-mount"),
        install: argv.includes("--no-install") ? false : "production",
      });
      if (r.mountText) console.log(`\n${r.mountText}`);
      console.log(`\nwrote ${r.configFile}${argv.includes("--no-mount") ? " — run `bun run cat mount:remote` to move the lock" : " and the lock"}`);
      exit = Math.max(exit, r.exit);
    }
    process.exit(exit);
  } catch (e) {
    console.error(`✗ ${(e as Error).message}`);
    process.exit(2);
  }
}
