#!/usr/bin/env bun
/**
 * Where will this folio be published, and is it there yet?
 *
 * The last thing `processes/getting-started.bpmn` does is hand the author
 * a link, because a folio that has just been scaffolded is worth very little to
 * its author until they can see it. This derives the address, reports whether
 * anything is set up to publish to it, and — with `--wait` — probes until the
 * site answers.
 *
 * ## Three states, and the third is load-bearing
 *
 * `live` is a success response. `not-yet` is a **measured** 404: the server
 * answered and said there is nothing there, which is the ordinary state for the
 * first minutes after a scaffold. `unknown` is the absence of a measurement —
 * no URL could be derived, nothing was probed, or the request failed.
 *
 * Collapsing `unknown` into `not-yet` would mean telling an author their site
 * is "still building" when in fact nothing was ever checked. That is the defect
 * this repository has already paid for twice in other guises — the README
 * contents table rendering an unreadable publish ref as an empty table, and the
 * simulators section rendering an absent directory as "no simulators". Both
 * replaced a correct answer with a confident wrong one.
 *
 * `decisions/pages-live-gate.dmn` holds the same three states as a decision
 * table, and `--json` emits exactly the facts that table reads.
 *
 * ## It does not deploy
 *
 * Publishing is a GitHub Actions workflow's job. This reports whether such a
 * workflow exists and what it is called; it never pushes, dispatches or
 * configures Pages. An author who has no publish workflow is told so, which is
 * more useful than a script that silently invents one.
 *
 * Usage:
 *   bun run cat-harness/scripts/pages-bootstrap.ts               # derive + report, no probe
 *   bun run cat-harness/scripts/pages-bootstrap.ts --wait        # probe until live, bounded
 *   bun run cat-harness/scripts/pages-bootstrap.ts --wait --timeout 300
 *   bun run cat-harness/scripts/pages-bootstrap.ts --json        # facts for the DMN gate
 *
 * Exit codes: 0 live, 0 not-yet (it is not an error to be early), 2 unknown.
 *
 * @module scripts/pages-bootstrap
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";


import { repoRootFor } from "../schemas/cat-harness.js";
import { resolveHarnessConfigPath } from "../schemas/harness-config.js";

export type Probe = "ok" | "not-found" | "error" | "unchecked";
export type PagesOutcome = "live" | "not-yet" | "unknown";

export interface PagesFacts {
  /** The two facts `decisions/pages-live-gate.dmn` reads. */
  pagesUrlKnown: boolean;
  probe: Probe;
}

export interface PagesReport extends PagesFacts {
  url?: string;
  /** How the URL was arrived at, so a wrong one can be traced. */
  urlSource?: string;
  owner?: string;
  repo?: string;
  /** Workflow files that look like they publish a site. */
  publishWorkflows: string[];
  /** HTTP status, when a probe actually completed. */
  status?: number;
  /** Why the probe could not be made, when it could not. */
  probeError?: string;
  /** Seconds spent waiting, when `--wait` was used. */
  waitedSeconds?: number;
  outcome: PagesOutcome;
}

/**
 * The decision in `pages-live-gate.dmn`, in code, so the script and the table
 * cannot drift apart. The table is the version an editor can change; this is
 * the version that runs when no workflow instance is open.
 */
export function outcomeFor(f: PagesFacts): PagesOutcome {
  if (!f.pagesUrlKnown) return "unknown";
  if (f.probe === "ok") return "live";
  if (f.probe === "not-found") return "not-yet";
  return "unknown";
}

/** Parse `owner/repo` out of any of the shapes a GitHub remote comes in. */
export function parseRemote(remote: string): { owner: string; repo: string } | undefined {
  const m =
    /^git@[^:]+:([^/]+)\/(.+?)(?:\.git)?$/.exec(remote) ??
    /^(?:https?|ssh|git):\/\/[^/]+\/([^/]+)\/(.+?)(?:\.git)?$/.exec(remote);
  if (!m) return undefined;
  return { owner: m[1]!, repo: m[2]! };
}

function gitRemote(root: string): string | undefined {
  const r = spawnSync("git", ["-C", root, "remote", "get-url", "origin"], { encoding: "utf-8" });
  if (r.status !== 0) return undefined;
  const url = r.stdout.trim();
  return url || undefined;
}

/**
 * Where the site lives. The instance's config (`<name>.config.json`) wins
 * when it says, because an
 * author with a custom domain has said something the remote cannot tell us.
 */
export function derivePagesUrl(root: string): Pick<PagesReport, "url" | "urlSource" | "owner" | "repo"> {
  const found = resolveHarnessConfigPath(root);
  if (found) {
    const cfgPath = found.path;
    try {
      const cfg = JSON.parse(readFileSync(cfgPath, "utf-8")) as {
        readme?: { pagesBaseUrl?: string };
        pagesBaseUrl?: string;
      };
      const base = cfg.readme?.pagesBaseUrl ?? cfg.pagesBaseUrl;
      if (typeof base === "string" && base.startsWith("http")) {
        return { url: base.replace(/\/+$/, "") + "/", urlSource: basename(cfgPath) };
      }
    } catch {
      // Unparseable config is not a reason to guess. Fall through to the remote,
      // and if that fails too the outcome is `unknown` — which is correct.
    }
  }

  const remote = gitRemote(root);
  if (!remote) return {};
  const parsed = parseRemote(remote);
  if (!parsed) return {};
  const { owner, repo } = parsed;
  return {
    url: `https://${owner.toLowerCase()}.github.io/${repo}/`,
    urlSource: "git remote",
    owner,
    repo,
  };
}

/**
 * Workflows that look like they publish a site. Matched on what the file
 * *does* — a `deploy-pages` or `upload-pages-artifact` step, or a push to a
 * publish branch — rather than on its name, because "docs.yml" and
 * "gh-pages.yml" are both common and neither is required.
 */
export function findPublishWorkflows(root: string): string[] {
  const dir = join(repoRootFor(root), ".github", "workflows");
  if (!existsSync(dir)) return [];
  const hits: string[] = [];
  for (const f of readdirSync(dir)) {
    if (!/\.ya?ml$/.test(f)) continue;
    let text: string;
    try {
      text = readFileSync(join(dir, f), "utf-8");
    } catch {
      continue;
    }
    if (
      /actions\/deploy-pages|actions\/upload-pages-artifact|peaceiris\/actions-gh-pages|JamesIves\/github-pages-deploy-action|gh-pages/i.test(
        text,
      )
    ) {
      hits.push(f);
    }
  }
  return hits.sort();
}

async function probeOnce(url: string, timeoutMs: number): Promise<{ probe: Probe; status?: number; error?: string }> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    // GET rather than HEAD: GitHub Pages answers HEAD inconsistently while a
    // first deployment is in flight, and a wrong answer here is worse than the
    // few extra kilobytes.
    const res = await fetch(url, { signal: ctl.signal, redirect: "follow" });
    if (res.ok) return { probe: "ok", status: res.status };
    if (res.status === 404) return { probe: "not-found", status: res.status };
    // Anything else — 403, 500, a proxy's 407 — is not evidence that the site
    // is absent, so it is not `not-found`.
    return { probe: "error", status: res.status, error: `HTTP ${res.status}` };
  } catch (e) {
    return { probe: "error", error: e instanceof Error ? e.message : String(e) };
  } finally {
    clearTimeout(t);
  }
}

export interface BootstrapOptions {
  root?: string;
  /** Probe at all. Without it the outcome is `unknown`, reported as such. */
  probe?: boolean;
  /** Keep probing until live or this many seconds have passed. */
  waitSeconds?: number;
  /** Per-request timeout. */
  requestTimeoutMs?: number;
  onTick?: (elapsed: number, probe: Probe) => void;
}

export async function pagesBootstrap(opts: BootstrapOptions = {}): Promise<PagesReport> {
  const root = resolve(opts.root ?? ".");
  const derived = derivePagesUrl(root);
  const publishWorkflows = findPublishWorkflows(root);

  const base: PagesReport = {
    ...derived,
    pagesUrlKnown: Boolean(derived.url),
    probe: "unchecked",
    publishWorkflows,
    outcome: "unknown",
  };

  if (!derived.url || !opts.probe) {
    base.outcome = outcomeFor(base);
    return base;
  }

  const deadline = Date.now() + (opts.waitSeconds ?? 0) * 1000;
  const started = Date.now();
  const requestTimeoutMs = opts.requestTimeoutMs ?? 10_000;

  for (;;) {
    const r = await probeOnce(derived.url, requestTimeoutMs);
    base.probe = r.probe;
    base.status = r.status;
    base.probeError = r.error;
    base.waitedSeconds = Math.round((Date.now() - started) / 1000);
    opts.onTick?.(base.waitedSeconds, r.probe);

    if (r.probe === "ok") break;
    if (Date.now() >= deadline) break;
    await new Promise((res) => setTimeout(res, Math.min(10_000, Math.max(2_000, deadline - Date.now()))));
  }

  base.outcome = outcomeFor(base);
  return base;
}

export function formatReport(r: PagesReport): string {
  const out: string[] = [];

  if (r.url) {
    out.push(`Site address: ${r.url}`);
    out.push(`  derived from: ${r.urlSource}`);
  } else {
    out.push("Site address: COULD NOT DETERMINE");
    out.push(
      "  No `readme.pagesBaseUrl` in this instance's config (`<name>.config.json`) and no\n" +
        "  parseable `origin` remote.\n" +
       +
        "  Not guessed from the directory name — a wrong URL is worse than none, because\n" +
        "  it is what the author will paste to somebody else.",
    );
  }
  out.push("");

  if (r.publishWorkflows.length) {
    out.push(`Publish workflow: ${r.publishWorkflows.join(", ")}`);
  } else {
    out.push("Publish workflow: none found in .github/workflows/");
    out.push("  Nothing here will publish the site. Add one before promising a link.");
  }
  out.push("");

  switch (r.outcome) {
    case "live":
      out.push(`LIVE — the site answered${r.status ? ` (HTTP ${r.status})` : ""}.`);
      out.push(`  ${r.url}`);
      break;
    case "not-yet":
      out.push("NOT YET — the server answered 404. That is a measurement, not a failure:");
      out.push("  a first Pages build usually lands within a few minutes of the push.");
      out.push(`  It will be at: ${r.url}`);
      break;
    case "unknown":
      out.push("COULD NOT CHECK — this is NOT the same as 'not yet'.");
      if (!r.pagesUrlKnown) out.push("  Reason: no URL to check.");
      else if (r.probe === "unchecked") out.push("  Reason: no probe was attempted (pass --wait).");
      else out.push(`  Reason: the request failed — ${r.probeError ?? "unknown error"}.`);
      out.push("  Do not report the site as live or as pending on this result.");
      break;
  }

  if (r.waitedSeconds !== undefined && r.waitedSeconds > 0) {
    out.push("");
    out.push(`Waited ${r.waitedSeconds}s.`);
  }
  return out.join("\n");
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const json = args.includes("--json");
  const wait = args.includes("--wait");
  const tIdx = args.indexOf("--timeout");
  const waitSeconds = wait ? Number(tIdx >= 0 ? args[tIdx + 1] : 240) : 0;
  const root = args.find((a) => !a.startsWith("--") && a !== args[tIdx + 1]) ?? ".";

  const report = await pagesBootstrap({
    root,
    probe: wait,
    waitSeconds: Number.isFinite(waitSeconds) ? waitSeconds : 240,
    onTick: (elapsed, probe) => {
      if (!json && probe !== "ok") console.error(`  … ${probe} at ${elapsed}s`);
    },
  });

  console.log(json ? JSON.stringify(report, null, 2) : formatReport(report));
  process.exit(report.outcome === "unknown" ? 2 : 0);
}
