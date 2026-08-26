/**
 * Report whether each workflow is actually passing on the default branch.
 *
 * ```sh
 * bun run check:ci-health            # human-readable, exit 1 if anything is red
 * bun run check:ci-health --markdown # the block the session-start sweep prints
 * bun run check:ci-health --warn     # report only, never fail
 * ```
 *
 * One API call. `GET /actions/runs?branch=<default>&per_page=100` returns the
 * recent history across every workflow at once, so this does not fan out to
 * one request per workflow — which would exhaust the unauthenticated rate
 * limit (60/hr) and make it unusable at session start.
 *
 * `GITHUB_TOKEN` or `GH_TOKEN` is used when present. Without one the call still
 * works for a public repo; for a private repo it fails, and this says so rather
 * than reporting green.
 *
 * Why this exists: `docs-site.yml` failed 30 consecutive runs over two months
 * and nothing surfaced it. See bean `xom7`.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { assess, render, type RunSummary } from "../src/workflow/ci-health.js";

const argv = process.argv.slice(2);
const markdown = argv.includes("--markdown");
const warn = argv.includes("--warn");

function git(args: string[]): string {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

/** owner/repo from the origin remote — https or ssh. */
function originSlug(): string | undefined {
  let url: string;
  try {
    url = git(["remote", "get-url", "origin"]);
  } catch {
    return undefined;
  }
  const m = /github\.com[/:]([^/]+)\/(.+?)(?:\.git)?$/.exec(url);
  return m ? `${m[1]}/${m[2]}` : undefined;
}

function defaultBranch(): string {
  try {
    // stdio: origin/HEAD is often unset in a fresh clone, and git's complaint
    // about it is noise the reader should not have to triage.
    return execFileSync("git", ["symbolic-ref", "--short", "refs/remotes/origin/HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .trim()
      .replace(/^origin\//, "");
  } catch {
    return "main";
  }
}

const slug = originSlug();
const branch = defaultBranch();

async function fetchRuns(): Promise<{ runs?: RunSummary[]; unreachable?: string }> {
  if (!slug) return { unreachable: "no GitHub `origin` remote to ask about." };
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const url =
    `https://api.github.com/repos/${slug}/actions/runs` +
    `?branch=${encodeURIComponent(branch)}&per_page=100`;
  try {
    const res = await fetch(url, {
      headers: {
        accept: "application/vnd.github+json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      return {
        unreachable:
          `GitHub API returned ${res.status} for ${slug}` +
          (res.status === 404 && !token
            ? " — a private repo needs GITHUB_TOKEN or GH_TOKEN."
            : res.status === 403
              ? " — rate limited; set GITHUB_TOKEN to raise the limit."
              : "."),
      };
    }
    const body = (await res.json()) as { workflow_runs?: RunSummary[] };
    return { runs: body.workflow_runs ?? [] };
  } catch (e) {
    return { unreachable: `could not reach the GitHub API: ${String(e).slice(0, 120)}` };
  }
}

const { runs, unreachable } = await fetchRuns();
const repoRoot = (() => {
  try {
    return git(["rev-parse", "--show-toplevel"]);
  } catch {
    return process.cwd();
  }
})();

const health = runs
  ? assess(runs, { workflowExists: (p) => existsSync(resolve(repoRoot, p)) })
  : [];

if (markdown) {
  console.log(render(health, { unreachable, branch }));
} else if (unreachable) {
  console.error(`CI health: NOT CHECKED — ${unreachable}`);
  console.error("Treat this as unknown, not as green.");
} else {
  console.log(`CI health on \`${branch}\` (${runs!.length} recent runs)\n`);
  for (const h of health) {
    const mark = h.health === "red" ? "✗" : h.health === "running" ? "…" : "✓";
    const detail =
      h.health === "red"
        ? `${h.consecutiveFailures} consecutive failure(s), ` +
          (h.daysSinceSuccess === undefined
            ? "no success in window"
            : `last green ${h.daysSinceSuccess}d ago`)
        : h.health;
    console.log(`  ${mark} ${h.workflow.padEnd(32)} ${detail}`);
  }
}

const red = health.filter((h) => h.health === "red");
if (warn || markdown) process.exit(0);
// Unreachable is a failure of the check, not a pass. Exiting 0 here would make
// "could not look" indistinguishable from "looked and it was fine".
if (unreachable) process.exit(2);
if (red.length > 0) {
  console.error(`\n${red.length} workflow(s) failing on \`${branch}\`.`);
  process.exit(1);
}
