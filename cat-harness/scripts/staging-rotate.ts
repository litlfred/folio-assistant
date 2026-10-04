#!/usr/bin/env bun
/**
 * Cap the number of `STAGING/<slug>/` review previews on the publish branch,
 * rotating the oldest off.
 *
 * @module scripts/staging-rotate
 * @covers none — a WRITER the deploy calls, not an audit: it removes previews over the cap, and judges nothing else
 *
 * ```sh
 * bun run cat-harness/scripts/staging-rotate.ts --dir pages --current "$STAGING_SLUG" --summary-out rotated.txt
 * ```
 *
 * ## Why this exists — issue #1868
 *
 * GitHub Pages deploys `gh-pages` as-is, and every per-PR preview under
 * `STAGING/<slug>/` is a full copy of the site — roughly 200–500 MB each. With
 * nothing bounding how many existed at once, the branch passed GitHub's 10 GB
 * Pages artifact limit and the LIVE site stopped deploying on 2026-10-01. The
 * removal paths that existed (`cleanup` on PR close, `cleanup-dispatch` for
 * orphans — bean `w2g5`) are all per-preview and event-driven; none of them
 * bounds the TOTAL, which is the quantity the limit is about.
 *
 * **Owner ruling, 2026-10-02:** *"for going forward, we should cap the maximum
 * number of previews (<= 10) and rotate old ones off."* **Amended 2026-10-04:**
 * the cap is by SIZE, not count — *"Cap by size, not count"*, budget *"3gb"*.
 * Previews had grown from ~88 MiB (2026-09-22) to 200–780 MB each, so ten of
 * them was 3–5 GB and any one lasted an hour or two before rotating off; a
 * count bounds the total only as well as preview size is stable, and it was
 * not. The total is the quantity GitHub's limit is about, so the total is
 * what is capped. The ruling is the
 * confirmation `deletion-requires-confirmation` asks for, given once for the
 * whole class rather than per preview. What the skill still asks of every
 * removal is a RECORD, and this script leaves three: a `removed` entry in the
 * render log, the preview's `staging-preview.json` retired into
 * `STAGING/_retired/` (bean `6pfo` — retirement is a state, not a deletion),
 * and a line per preview in the commit message and the job log, with its age
 * and size.
 *
 * ## A rotated-off preview is not lost work
 *
 * A preview is a BUILD of a branch, not content. The next push to that pull
 * request's branch runs `feature-staging.yml` again, which re-stages it — and,
 * being the preview just staged, it can never be the one rotated off by that
 * run. So the cost of rotation is a 404 until the author pushes, never data.
 *
 * ## How "last updated" is determined, in order
 *
 * 1. **`STAGING/<slug>/.staged-at`** — an ISO timestamp this script writes into
 *    the preview being staged, every time it is staged. The authoritative
 *    answer for every preview staged after this script landed.
 * 2. **The render log** — the latest `rendered` or `restored` entry for
 *    `STAGING/<slug>` in `_render-log/*.jsonl` (bean `5mg5`). Accurate for any
 *    preview staged since the log existed.
 * 3. **`staging-preview.json`'s `builtAt`** — when the preview FIRST appeared
 *    (`staging-record.ts` deliberately does not walk it forward). A lower bound
 *    on the last update, so a preview known only this way sorts as older than
 *    it may be.
 * 4. **`git log -1 --format=%ct -- STAGING/<slug>`** — last resort. The
 *    workflow's checkout of `gh-pages` is depth 1, where this returns the TIP
 *    commit's time for every path, so it cannot order previews against each
 *    other; ties then break by slug so the choice is at least deterministic.
 *
 * A preview whose age could not be determined at all sorts OLDEST and the log
 * says so. That is the one place this leans towards removal, and it is
 * deliberate: an unknown-age preview is overwhelmingly one that predates every
 * signal above, and the cap is the owner's rule — leaving it standing would let
 * the very previews that caused #1868 sit outside the bound forever.
 *
 * ## What is never touched
 *
 * - **The preview being staged** (`--current`). It always takes one of the N
 *   slots, so the cap counts it.
 * - **`STAGING/_retired/`** and anything that is not a preview directory: plain
 *   files, dot-entries, `_`-prefixed reserved names, and names the staging
 *   slug pipeline could not have produced. Conservative on purpose — an entry
 *   this script does not recognise is somebody else's, and a cap that deleted
 *   it would be `plj1` with a better excuse.
 *
 * ## Why it runs inside the push loop
 *
 * The stage job re-reads `gh-pages` on every push attempt and re-runs this
 * against the fresh tree. A removal decided against a stale read and REPLAYED
 * by a rebase could remove a preview another run has just refreshed — or
 * conflict with it and lose this run's deploy. Re-deciding per attempt means
 * the removal pushed is always the one the current tree warrants.
 */
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

import { RENDER_LOG_DIR, readRenderLog } from "../schemas/render-log.ts";
import { readStagingPreview, retireStagingPreview, serializeStagingPreview } from "../schemas/staging-preview.ts";
import { appendEntry, buildEntry } from "./render-log.ts";
import { RETIRED_DIR, STAGING_PREFIX } from "./restore-staging.ts";
import { SLUG_PATTERN } from "./staging-cleanup-preflight.ts";
import { loadExisting } from "./staging-record.ts";

/**
 * THE CAP — defined here and nowhere else. The workflow passes no number, so
 * there is no second copy to drift.
 *
 * The TOTAL size of every preview under `STAGING/`, in bytes as checked out
 * (what Pages publishes, not what git stores). Owner ruling 2026-10-02
 * (issue #1868) capped the COUNT at ten; amended 2026-10-04 to a size budget
 * of *"3gb"*. Binary, 3 x 1024^3: every byte formatter in this repository
 * divides by 1024, and a budget stated in decimal would print as "2.79 GB"
 * beside the owner's 3 in the health report that checks it. The preview being staged counts
 * toward it. GitHub's Pages limit (10 GB) covers the live site too, which is
 * why the budget leaves most of it free.
 */
export const MAX_PREVIEW_BYTES = 3 * 1024 ** 3;

/** The per-preview stamp, inside the preview directory. */
export const STAGED_AT_FILE = ".staged-at";

/** The record `staging-record.ts` writes beside each preview. */
const RECORD_FILE = "staging-preview.json";

export type AgeSource = "stamp" | "render-log" | "record" | "git" | "unknown";

export interface Preview {
  slug: string;
  /** Last update, epoch milliseconds. `undefined` when no signal answered. */
  updatedMs: number | undefined;
  source: AgeSource;
  /** Total size of the files under the preview, bytes. */
  bytes: number;
}

export interface RotationPlan {
  keep: Preview[];
  remove: Preview[];
}

/** Is this `STAGING/` entry name one this script may treat as a preview? */
export function isPreviewName(name: string): boolean {
  if (name === RETIRED_DIR) return false;
  if (name.startsWith(".") || name.startsWith("_")) return false;
  return SLUG_PATTERN.test(name);
}

/**
 * Decide what to keep. Pure.
 *
 * `current` is always kept, whether or not it is in `previews`, and its bytes
 * count first. The others are kept newest first while the running total stays
 * within `budget`; the first that does not fit goes, and so does everything
 * older than it. Strictly by recency, never by fit: keeping an older small
 * preview over a newer large one would make rotation depend on size, and a
 * reviewer could not tell from a preview's age whether it is still there.
 * Ties break by slug so two runs over the same tree agree. Unknown ages sort
 * oldest.
 *
 * A current preview larger than the whole budget on its own is still kept —
 * it is what this run was asked to publish — and every other preview goes.
 */
export function planRotation(previews: Preview[], current: string, budget: number = MAX_PREVIEW_BYTES): RotationPlan {
  if (!Number.isFinite(budget) || budget <= 0) throw new Error(`the preview budget must be a positive number of bytes, got ${budget}`);
  const cur = previews.filter((p) => p.slug === current);
  const others = previews
    .filter((p) => p.slug !== current)
    .sort((a, b) => {
      const ta = a.updatedMs ?? Number.NEGATIVE_INFINITY;
      const tb = b.updatedMs ?? Number.NEGATIVE_INFINITY;
      if (ta !== tb) return tb - ta;
      return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
    });
  let total = cur.reduce((n, p) => n + p.bytes, 0);
  let fit = 0;
  while (fit < others.length && total + others[fit]!.bytes <= budget) total += others[fit++]!.bytes;
  return { keep: [...cur, ...others.slice(0, fit)], remove: others.slice(fit) };
}

/** The latest `rendered`/`restored` time per slug, from every log file under `dir`. */
export function renderLogTimes(dir: string): Map<string, number> {
  const out = new Map<string, number>();
  const logDir = join(dir, RENDER_LOG_DIR);
  if (!existsSync(logDir)) return out;
  for (const f of readdirSync(logDir)) {
    if (!f.endsWith(".jsonl")) continue;
    const { entries } = readRenderLog(readFileSync(join(logDir, f), "utf8"));
    for (const e of entries) {
      if (e.event !== "rendered" && e.event !== "restored") continue;
      const m = /^STAGING\/([^/]+)$/.exec(e.subject.path);
      if (m === null) continue;
      const t = Date.parse(e.at);
      if (Number.isNaN(t)) continue;
      const prev = out.get(m[1]);
      if (prev === undefined || t > prev) out.set(m[1], t);
    }
  }
  return out;
}

/** Last-commit time of a path, epoch ms, or undefined. Injected in tests. */
export type GitTime = (dir: string, path: string) => number | undefined;

export const gitLastCommit: GitTime = (dir, path) => {
  const r = spawnSync("git", ["-C", dir, "log", "-1", "--format=%ct", "--", path], { encoding: "utf-8" });
  if (r.status !== 0) return undefined;
  const s = Number((r.stdout ?? "").trim());
  return Number.isFinite(s) && s > 0 ? s * 1000 : undefined;
};

function readTime(path: string, pick: (text: string) => string | undefined): number | undefined {
  if (!existsSync(path)) return undefined;
  try {
    const raw = pick(readFileSync(path, "utf8"));
    if (raw === undefined) return undefined;
    const t = Date.parse(raw.trim());
    return Number.isNaN(t) ? undefined : t;
  } catch {
    return undefined;
  }
}

function sizeOf(path: string): number {
  let total = 0;
  const st = lstatSync(path);
  if (st.isSymbolicLink()) return 0;
  if (st.isFile()) return st.size;
  if (st.isDirectory()) for (const k of readdirSync(path)) total += sizeOf(join(path, k));
  return total;
}

/** Every preview under `<dir>/STAGING`, with its age and where the age came from. */
export function readPreviews(dir: string, git: GitTime = gitLastCommit): Preview[] {
  const staging = join(dir, STAGING_PREFIX);
  if (!existsSync(staging)) return [];
  const logTimes = renderLogTimes(dir);
  const out: Preview[] = [];
  for (const name of readdirSync(staging).sort()) {
    if (!isPreviewName(name)) continue;
    const abs = join(staging, name);
    if (!lstatSync(abs).isDirectory()) continue;

    let updatedMs: number | undefined;
    let source: AgeSource = "unknown";
    const stamp = readTime(join(abs, STAGED_AT_FILE), (t) => t);
    if (stamp !== undefined) {
      updatedMs = stamp;
      source = "stamp";
    } else if (logTimes.has(name)) {
      updatedMs = logTimes.get(name);
      source = "render-log";
    } else {
      const built = readTime(join(abs, RECORD_FILE), (t) => readStagingPreview(t).node?.staging.builtAt);
      if (built !== undefined) {
        updatedMs = built;
        source = "record";
      } else {
        const g = git(dir, `${STAGING_PREFIX}/${name}`);
        if (g !== undefined) {
          updatedMs = g;
          source = "git";
        }
      }
    }
    out.push({ slug: name, updatedMs, source, bytes: sizeOf(abs) });
  }
  return out;
}

function human(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function age(p: Preview, nowMs: number): string {
  if (p.updatedMs === undefined) return "age unknown";
  const h = (nowMs - p.updatedMs) / 3_600_000;
  return h < 48 ? `${h.toFixed(1)}h old` : `${(h / 24).toFixed(1)}d old`;
}

/** One line per rotated preview — the job log and the commit message both carry these. */
export function describeRemoval(p: Preview, nowMs: number): string {
  return `rotated off STAGING/${p.slug}: ${age(p, nowMs)} (last update from ${p.source}), ${human(p.bytes)}`;
}

export interface RotateOptions {
  dir: string;
  current: string;
  now: string;
  /** Bytes. Defaults to {@link MAX_PREVIEW_BYTES}; tests pass their own. */
  budget?: number;
  git?: GitTime;
  run?: string;
}

/**
 * Stamp the current preview, then remove every preview over the cap, leaving
 * a record for each. Returns the plan that was carried out.
 */
export function rotate(o: RotateOptions): { plan: RotationPlan; lines: string[] } {
  const budget = o.budget ?? MAX_PREVIEW_BYTES;
  const nowMs = Date.parse(o.now);
  if (Number.isNaN(nowMs)) throw new Error(`--now \`${o.now}\` is not a timestamp`);
  if (!isPreviewName(o.current)) throw new Error(`--current \`${o.current}\` is not a preview slug`);

  const curDir = join(o.dir, STAGING_PREFIX, o.current);
  if (existsSync(curDir)) writeFileSync(join(curDir, STAGED_AT_FILE), `${o.now}\n`);

  const plan = planRotation(readPreviews(o.dir, o.git ?? gitLastCommit), o.current, budget);
  const reason =
    `rotated off: the previews on gh-pages came to more than ${human(budget)} ` +
    `(owner ruling 2026-10-02, issue #1868, amended 2026-10-04 to a size budget); ` +
    `STAGING/${o.current} was staged and the least recently updated preview goes. ` +
    `The next push to its branch re-stages it.`;
  const lines: string[] = [];
  for (const p of plan.remove) {
    const abs = join(o.dir, STAGING_PREFIX, p.slug);
    const line = describeRemoval(p, nowMs);
    lines.push(line);

    // Retire the record first, the same way both cleanup jobs do: the record
    // goes to `_retired/`, never with the directory. Retiring twice keeps the
    // first retirement.
    const rec = join(abs, RECORD_FILE);
    if (existsSync(rec)) {
      const retiredDir = join(o.dir, STAGING_PREFIX, RETIRED_DIR);
      const out = join(retiredDir, `${p.slug}.json`);
      mkdirSync(retiredDir, { recursive: true });
      try {
        if (!existsSync(out)) copyFileSync(rec, out);
        const node = loadExisting(out);
        if (node !== undefined) writeFileSync(out, serializeStagingPreview(retireStagingPreview(node, reason, o.now)));
      } catch (e) {
        // Same posture as the cleanup jobs: the record copy stays as it was and
        // the failure is an annotation, not a blocked deploy.
        console.log(
          `::error title=staging-preview record::could not retire STAGING/${p.slug} — ` +
            `${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }

    appendEntry(
      o.dir,
      buildEntry({
        event: "removed",
        kind: "staging-preview",
        path: `${STAGING_PREFIX}/${p.slug}`,
        slug: p.slug,
        summary: line,
        reason,
        ...(o.run ? { run: o.run } : {}),
        at: o.now,
        id: `${o.now.replace(/[:.]/g, "-")}-removed-${p.slug}`,
      }),
    );

    rmSync(abs, { recursive: true, force: true });
  }
  return { plan, lines };
}

function flag(argv: string[], name: string): string | undefined {
  const i = argv.findIndex((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (i === -1) return undefined;
  const v = argv[i].startsWith(`--${name}=`) ? argv[i].slice(name.length + 3) : argv[i + 1];
  return v === undefined || v === "" ? undefined : v;
}

const USAGE =
  "usage: staging-rotate.ts --dir PAGES_CHECKOUT --current SLUG [--summary-out FILE] [--run URL]";

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const dir = flag(argv, "dir");
  const current = flag(argv, "current");
  if (dir === undefined || current === undefined) {
    console.error(USAGE);
    process.exit(2);
  }
  try {
    const now = new Date().toISOString();
    const { plan, lines } = rotate({ dir, current, now, run: flag(argv, "run") });
    const kept = plan.keep.reduce((n, p) => n + p.bytes, 0);
    console.log(
      `staging-rotate: budget ${human(MAX_PREVIEW_BYTES)}; ${plan.keep.length} kept (${human(kept)}), ` +
        `${plan.remove.length} rotated off`,
    );
    if (kept > MAX_PREVIEW_BYTES) {
      console.log(`::warning title=staging preview over budget::STAGING/${current} alone is ${human(kept)}, over the ${human(MAX_PREVIEW_BYTES)} budget; it is published and every other preview was rotated off`);
    }
    for (const p of plan.keep) console.log(`  keep STAGING/${p.slug}: ${age(p, Date.parse(now))} (${p.source}), ${human(p.bytes)}`);
    for (const l of lines) console.log(`::notice title=staging preview rotated off::${l}`);
    const out = flag(argv, "summary-out");
    if (out !== undefined) writeFileSync(out, lines.length === 0 ? "" : `${lines.join("\n")}\n`);
    process.exit(0);
  } catch (e) {
    console.error(`staging-rotate: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  }
}
