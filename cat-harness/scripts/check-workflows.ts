#!/usr/bin/env bun
/**
 * Workflow YAML that GitHub will actually parse.
 *
 * ## Why a local check, when CI already runs the workflows
 *
 * Because a workflow GitHub cannot parse does not fail loudly — it produces a
 * run **named by its file path instead of its `name:`**, because there is no
 * `name:` to read. `AGENTS.md` records two workflows that failed this way on
 * 2026-08-07 and stayed red for a day. I reproduced it on 2026-09-18 by adding
 * a second `env:` block to a step that already had one.
 *
 * The trap is that **`yaml.safe_load` accepts duplicate keys** — the YAML spec
 * says they are invalid, but most loaders take the last one silently. So
 * "it parses locally" is not evidence, and that is exactly what I relied on.
 *
 * ## What is checked
 *
 * - **Duplicate keys at any level.** The failure above.
 * - **`${{ }}` inside a `run:` body**, where the expression is substituted into
 *   the script TEXT before the shell parses it. Trusted contexts are allowed;
 *   anything attacker-controlled is an error. See
 *   `skills/folio-core/untrusted-input.md`.
 * - **A job that pushes `gh-pages` with no protection against the race.**
 *   Either the shared `gh-pages-push` concurrency group, or a retry. One or
 *   the other, because they all contend for a single ref.
 * - **A job that REPLACES the whole publish branch without carrying the open
 *   PRs' `STAGING/` previews across.** Bean `plj1`.
 *
 * @module scripts/check-workflows
 * @covers none — .github/workflows/ is not a declared graph kind
 */
import { readdirSync, readFileSync } from "node:fs";
import { parse, parseDocument } from "yaml";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { repoRootFor } from "../schemas/cat-harness.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(repoRootFor(ROOT), ".github", "workflows");

/**
 * Expressions an attacker can choose the value of.
 *
 * Deliberately a list of the dangerous ones rather than an allow-list of safe
 * ones: a blanket rule over every `${{ }}` would flag `github.workspace` and
 * `matrix.*`, produce a wall of false findings, and get switched off — which is
 * how a check stops being a check.
 */
const ATTACKER_CONTROLLED = [
  /github\.event\.pull_request\.head\.ref/,
  /github\.event\.pull_request\.title/,
  /github\.event\.pull_request\.body/,
  /github\.event\.issue\.title/,
  /github\.event\.issue\.body/,
  /github\.event\.comment\.body/,
  /github\.event\.pull_request\.labels/,
  /github\.head_ref/,
];

export interface WorkflowFinding {
  file: string;
  line: number;
  kind:
    | "duplicate-key"
    | "unparseable"
    | "interpolated-untrusted"
    | "gh-pages-ungrouped"
    | "gh-pages-wipes-staging";
  detail: string;
}

/**
 * Duplicate keys, from a real YAML parser.
 *
 * Hand-rolled scope tracking got this wrong **twice** — first reporting
 * `types:` under `pull_request:` as a duplicate of `types:` under
 * `pull_request_target:`, then reporting `run:` in one step as a duplicate of
 * `run:` in the step before it. Both times the checker would have produced a
 * wall of false findings in a repository with no duplicates at all, which is
 * the failure its own doc comment warns about.
 *
 * Two wrong attempts is evidence, not bad luck: YAML scoping is a parser's job.
 * `yaml`'s `parseDocument` reports duplicates as errors with line/column, which
 * is exactly the question being asked, and it is the same class of parser
 * GitHub uses.
 */
function duplicateKeys(text: string, file: string): WorkflowFinding[] {
  const doc = parseDocument(text, { uniqueKeys: true, keepSourceTokens: false });
  return doc.errors
    .filter((e) => /duplicate/i.test(e.message))
    .map((e) => ({
      file,
      line: e.linePos?.[0]?.line ?? 0,
      kind: "duplicate-key" as const,
      detail: `${e.message} — loaders take the LAST silently; GitHub refuses the file.`,
    }));
}

/**
 * Anything else the parser refuses.
 *
 * A workflow GitHub cannot parse produces a run named by its FILE PATH rather
 * than by its `name:`, because there is no `name:` to read — which is why this
 * class of failure reads as an ordinary red rather than as "the file is
 * broken". Reported separately from duplicates so the message says which.
 */
function unparseable(text: string, file: string): WorkflowFinding[] {
  const doc = parseDocument(text, { uniqueKeys: true });
  return doc.errors
    .filter((e) => !/duplicate/i.test(e.message))
    .map((e) => ({
      file,
      line: e.linePos?.[0]?.line ?? 0,
      kind: "unparseable" as const,
      detail: e.message,
    }));
}

/** `${{ attacker-controlled }}` inside a `run:` body. */
function interpolatedUntrusted(text: string, file: string): WorkflowFinding[] {
  const out: WorkflowFinding[] = [];
  const lines = text.split("\n");
  let inRun = false;
  let runIndent = 0;

  lines.forEach((line, i) => {
    const m = /^(\s*)run:\s*\|?/.exec(line);
    if (m !== null) {
      inRun = true;
      runIndent = m[1].length;
      return;
    }
    if (!inRun) return;
    if (line.trim() !== "" && line.length - line.trimStart().length <= runIndent) {
      inRun = false;
      return;
    }
    for (const pat of ATTACKER_CONTROLLED) {
      if (pat.test(line) && line.includes("${{")) {
        out.push({
          file,
          line: i + 1,
          kind: "interpolated-untrusted",
          detail: `attacker-controlled expression in a run body — bind it to \`env:\` and read the variable`,
        });
        break;
      }
    }
  });
  return out;
}

/** The one group name every `gh-pages`-pushing job must share. */
export const GH_PAGES_GROUP = "gh-pages-push";

/**
 * A job that writes `gh-pages` must be protected against the race — **somehow**.
 *
 * ## The rule is "queue OR retry", and the first version got that wrong
 *
 * This check originally demanded the shared group, full stop. That is too
 * narrow, and #300 shipped a regression because of it: it put
 * `discoverability-docs`' three jobs into the group, and those three run **in
 * parallel with no `needs:`**.
 *
 * GitHub cancels a PENDING job when a newer one queues for the same group. All
 * three enter at once, so one runs, one pends, and the third cancels the
 * pending one — **a lost publish every run**, which is worse than the race it
 * replaces, because a cancelled job reads as intentional while a rejected push
 * is at least red. #300's own commit message stated that cancellation rule
 * about a different case and then did not apply it here; a sibling session
 * raised it on the PR before it landed (bean `pdxk`) and it was merged unseen.
 *
 * So the invariant is protection, not membership:
 *
 * - **queue** — `concurrency.group: gh-pages-push`. Correct when the contending
 *   jobs arrive at different times, which is the cross-workflow case.
 * - **retry** — push with `continue-on-error`, then push again on failure.
 *   Correct when they arrive together, AND only when a re-clone loses nothing:
 *   `discoverability-docs`' three write to different directories under one
 *   root with `keep_files: true`, so whichever loses simply adds its tile
 *   beside the winner's. That is **not** true in general.
 *
 * A job may have both. `feature-staging`'s `stage` does.
 *
 * ## What counts as pushing, and as retrying
 *
 * Pushing: the `peaceiris/actions-gh-pages` action, or a bare
 * `git push … gh-pages` in a `run:` body — every job in `feature-staging`
 * uses the latter and contends for the same ref. That became true of `stage`
 * in PR #552 and this comment still named it as the action example, which is
 * the failure mode of a doc comment about which file does what: nothing reads
 * it, so nothing catches it.
 *
 * Retrying comes in two shapes here, and both are detected STRUCTURALLY
 * rather than by a marker comment, so a retry cannot be claimed without being
 * implemented:
 *
 * - **Two `uses:` push steps plus `continue-on-error: true`** — the action
 *   form, used by `discoverability-docs`. `feature-staging`'s `stage` used it
 *   too until PR #552 (bean `bm6d`, 2026-09-20), when it moved to the loop
 *   form so the preview and its render-log entry could be ONE commit.
 * - **A shell loop around `git push`, with a rebase inside it** —
 *   `feature-staging`'s `cleanup` does three attempts with
 *   `git pull --rebase` between them, and `stage` now does the same.
 *   Missing this shape is not hypothetical:
 *   the first version of this check flagged `cleanup` as unprotected while it
 *   was sitting next to a working retry loop, which is how a correct check
 *   teaches somebody to delete a correct fix.
 */
function ghPagesUngrouped(text: string, file: string): WorkflowFinding[] {
  const lines = text.split("\n");
  type Job = {
    name: string;
    line: number;
    group?: string;
    pushes: number;
    /** `continue-on-error` on a push, so a later step can try again. */
    tolerant: boolean;
    /** A shell retry loop — `for attempt in …`. */
    loops: boolean;
    /** A rebase or fetch, so the retry pushes onto what landed. */
    rebases: boolean;
  };
  const jobs: Job[] = [];
  let cur: Job | undefined;

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const job = /^ {2}([A-Za-z0-9_-]+):\s*$/.exec(l);
    if (job !== null) {
      cur = { name: job[1], line: i + 1, pushes: 0, tolerant: false, loops: false, rebases: false };
      jobs.push(cur);
      continue;
    }
    if (cur === undefined) continue;
    const g = /^ {6}group:\s*(\S+)/.exec(l);
    if (g !== null && !g[1].startsWith("${{")) cur.group = g[1];
    const bare = l.trimStart().startsWith("#");
    if (bare) continue;
    if (/peaceiris\/actions-gh-pages@/.test(l)) cur.pushes++;
    if (/git push\b[^\n]*\bgh-pages\b/.test(l)) cur.pushes++;
    if (/continue-on-error:\s*true/.test(l)) cur.tolerant = true;
    if (/\b(for|until|while)\b[^\n]*\battempt\b/.test(l)) cur.loops = true;
    if (/git\s+(pull\s+--rebase|rebase|fetch)\b/.test(l)) cur.rebases = true;
  }

  return jobs
    .filter((j) => {
      if (j.pushes === 0) return false;
      if (j.group === GH_PAGES_GROUP) return false;
      const actionRetry = j.pushes >= 2 && j.tolerant;
      const shellRetry = j.loops && j.rebases;
      return !actionRetry && !shellRetry;
    })
    .map((j) => ({
      file,
      line: j.line,
      kind: "gh-pages-ungrouped" as const,
      detail:
        `job \`${j.name}\` pushes gh-pages with no protection against the race: its concurrency group is ` +
        `${j.group === undefined ? "absent" : `\`${j.group}\``}, not \`${GH_PAGES_GROUP}\`, and it has no retry. ` +
        "Give it the shared group, or a retry (a second push guarded by the first's failure) where the jobs " +
        "contend simultaneously and a re-clone loses nothing.",
    }));
}

/** The directory on the publish branch that holds the per-PR review previews. */
const STAGING_PREFIX = "STAGING";

/** The script that carries them across a full replace. */
const RESTORE_SCRIPT = "scripts/restore-staging.ts";

/**
 * A full-replace publish that would delete every open PR's review preview.
 *
 * ## The defect — bean `plj1`
 *
 * `peaceiris/actions-gh-pages` with `keep_files` unset and no
 * `destination_dir` clones the publish branch, runs
 * `git rm -r --ignore-unmatch '*'` over ALL of it and copies `publish_dir` in.
 * `docs-site.yml` was the only one of this repository's six `gh-pages`
 * publishers in that shape, and it is the one that fires on every push to
 * `main` — so the most frequently run publisher was the only one that wiped,
 * and what it wiped was `STAGING/`.
 *
 * Measured on the real branch, 2026-09-19: three `docs(gh-pages)` commits in a
 * 25-minute window, carrying 1, 3 and 1 previews on their respective parents
 * and **zero** after.
 *
 * ## Why this is checked structurally rather than left to a comment
 *
 * Because the failure is invisible to everything else. The staging push
 * succeeds, the bot comments the URL on the PR, the check run is green, and
 * the artefact is removed minutes later by an unrelated merge — so no red run,
 * no annotation and no test would ever have reported it. The same reasoning as
 * the retry detection above: a restore cannot be CLAIMED without being
 * implemented, so what is looked for is the step that does it.
 *
 * ## What is exempt, and why each exemption is safe
 *
 * - **`keep_files: true`** — additive; it removes nothing, so there is nothing
 *   to carry. (It is also why it is not the fix for `docs-site`: it would stop
 *   the main site's own deleted pages from ever disappearing.)
 * - **a non-empty `destination_dir`** — the replace is scoped to a
 *   subdirectory, so the previews beside it are untouched. `feature-staging`
 *   writes `STAGING/<slug>` this way.
 * - **a publish branch other than the one the previews live on** — a different
 *   branch is a different site.
 */
export function ghPagesWipesStaging(text: string, file: string): WorkflowFinding[] {
  let doc: unknown;
  try {
    doc = parse(text);
  } catch {
    // `unparseable` already reports this; a second finding for one cause is noise.
    return [];
  }
  const jobs = (doc as { jobs?: Record<string, unknown> } | null)?.jobs;
  if (jobs === undefined || jobs === null || typeof jobs !== "object") return [];

  const out: WorkflowFinding[] = [];
  for (const [jobName, rawJob] of Object.entries(jobs)) {
    const steps = (rawJob as { steps?: unknown })?.steps;
    if (!Array.isArray(steps)) continue;

    let restored = false;
    for (const rawStep of steps) {
      const step = rawStep as { uses?: unknown; with?: Record<string, unknown>; run?: unknown };
      if (typeof step.run === "string" && step.run.includes(RESTORE_SCRIPT) && !step.run.includes("--verify")) {
        restored = true;
      }
      if (typeof step.uses !== "string" || !step.uses.startsWith("peaceiris/actions-gh-pages@")) continue;

      const w = step.with ?? {};
      const branch = String(w.publish_branch ?? "gh-pages");
      if (branch !== "gh-pages") continue;
      if (String(w.keep_files ?? "false") === "true") continue;
      if (String(w.destination_dir ?? "").trim() !== "") continue;
      if (restored) continue;

      out.push({
        file,
        line: text.split("\n").findIndex((l) => l.includes("peaceiris/actions-gh-pages@")) + 1,
        kind: "gh-pages-wipes-staging" as const,
        detail:
          `job \`${jobName}\` replaces the whole of \`${branch}\` (no \`keep_files\`, no \`destination_dir\`) ` +
          `without first restoring \`${STAGING_PREFIX}/\`, so every open PR's review preview is deleted by this ` +
          `deploy — silently, because the push succeeds. Run \`${RESTORE_SCRIPT}\` into the publish directory ` +
          "immediately before the push, or scope the replace with `destination_dir`.",
      });
    }
  }
  return out;
}

export function checkWorkflows(): WorkflowFinding[] {
  const out: WorkflowFinding[] = [];
  for (const f of readdirSync(DIR)) {
    if (!f.endsWith(".yml") && !f.endsWith(".yaml")) continue;
    const text = readFileSync(join(DIR, f), "utf-8");
    out.push(
      ...duplicateKeys(text, f),
      ...unparseable(text, f),
      ...interpolatedUntrusted(text, f),
      ...ghPagesUngrouped(text, f),
      ...ghPagesWipesStaging(text, f),
    );
  }
  return out;
}

if (import.meta.main) {
  const findings = checkWorkflows();
  const files = readdirSync(DIR).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));
  console.log(`Workflows: ${files.length}\n`);
  if (findings.length === 0) {
    console.log(
      "✓ all parse; no duplicate keys; no attacker-controlled expression in a run body; " +
        `every gh-pages push is protected by the \`${GH_PAGES_GROUP}\` queue or a retry; ` +
        `no full-replace publish drops the open PRs' \`${STAGING_PREFIX}/\` previews`,
    );
  } else {
    for (const f of findings) console.error(`  ✗ ${f.file}:${f.line}  [${f.kind}] ${f.detail}`);
    process.exit(1);
  }
}
