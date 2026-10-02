#!/usr/bin/env bun
/**
 * WHERE the per-PR review previews are stored, and where (if anywhere) they are
 * served. The ONE place that says so — issue #1868.
 *
 * @module scripts/preview-target
 *
 * ## Why this exists
 *
 * Until 2026-10 the previews were written to `STAGING/<slug>/` on `gh-pages`,
 * the branch GitHub Pages deploys as-is. Pages refuses an artifact over 10 GB,
 * and on 2026-10-01 `STAGING/` alone was ~27 GB of it (open PRs' previews
 * ~11.8 GB, the main site ~0.3 GB) — so the LIVE site froze, because a
 * review surface had grown past the limit of the thing it reviews against.
 *
 * The interim design (owner default, #1868): previews go to a separate branch,
 * `gh-pages-staging`, in the same `STAGING/<slug>/` layout. Nothing serves
 * that branch, so **a preview is stored, not browsable**, until the hosting
 * decision lands. `gh-pages` then holds only the main site.
 *
 * ## The one-place change this is built for
 *
 * The decision #1868 leaves open is a separate repository with its own Pages
 * (e.g. `litlfred/folio-assistant-previews`). Moving there is an edit to
 * {@link PREVIEW_TARGET} below — `repo`, `branch` and `publicUrl` — plus a
 * `PREVIEW_PUSH_TOKEN` secret able to push to that repository (the default
 * `GITHUB_TOKEN` cannot reach another repository). Every consumer reads it from
 * here: `feature-staging.yml` through `env` below, the health sweep through
 * {@link previewRemote}. Nothing else spells the branch.
 *
 * ## Commands
 *
 * ```sh
 * bun run cat-harness/scripts/preview-target.ts env >> "$GITHUB_ENV"
 * bun run cat-harness/scripts/preview-target.ts checkout --dir pages
 * ```
 *
 * `env` prints `KEY=value` lines (see {@link previewEnv}). `checkout` clones the
 * preview branch shallowly into `--dir`, or — when the branch positively does
 * not exist yet (`ls-remote` exit 2) — starts it as an orphan holding only a
 * README and `.nojekyll`, which the job's first push creates. "Could not ask"
 * is a failure, never "absent": an orphan pushed over an unreadable branch
 * would be refused as a non-fast-forward at best.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export interface PreviewTarget {
  /** `owner/name` of the repository holding the preview branch; `null` means THIS repository. */
  repo: string | null;
  /** The branch the previews are written to, under `STAGING/<slug>/`. */
  branch: string;
  /**
   * The public URL at which {@link branch} is served, without a trailing slash;
   * `null` while nothing serves it. A preview's URL is `<publicUrl>/STAGING/<slug>/`.
   */
  publicUrl: string | null;
}

/** THE configuration. Change it here and nowhere else. */
export const PREVIEW_TARGET: PreviewTarget = {
  repo: null,
  branch: "gh-pages-staging",
  publicUrl: null,
};

/** The repository the previews live in, resolved against the running one. */
export function previewRepo(t: PreviewTarget = PREVIEW_TARGET, current = process.env.GITHUB_REPOSITORY ?? ""): string {
  return t.repo ?? current;
}

/**
 * The git remote to read the preview branch from: the caller's own remote when
 * the previews live in this repository, else the other repository's URL.
 */
export function previewRemote(defaultRemote: string, t: PreviewTarget = PREVIEW_TARGET): string {
  return t.repo === null ? defaultRemote : `https://github.com/${t.repo}.git`;
}

/**
 * The address a preview build is laid out for — Jekyll's `baseurl`, the KG
 * export's `@id` base. The public URL when there is one; otherwise where that
 * repository's project Pages WOULD serve it, so the links stay internally
 * consistent and are never this repository's MAIN site claiming to be a preview.
 */
export function previewSiteUrl(t: PreviewTarget = PREVIEW_TARGET, current = process.env.GITHUB_REPOSITORY ?? ""): string {
  if (t.publicUrl !== null) return t.publicUrl.replace(/\/+$/, "");
  const [owner = "", name = ""] = previewRepo(t, current).split("/");
  // A `<owner>.github.io` repository is a USER site, served at the root.
  return name.toLowerCase() === `${owner.toLowerCase()}.github.io`
    ? `https://${owner}.github.io`
    : `https://${owner}.github.io/${name}`;
}

/** The URL path of {@link previewSiteUrl}: `""` for a root-served site, else `/<name>`. */
export function previewSitePath(t: PreviewTarget = PREVIEW_TARGET, current = process.env.GITHUB_REPOSITORY ?? ""): string {
  return new URL(`${previewSiteUrl(t, current)}/`).pathname.replace(/\/+$/, "");
}

/** The environment a workflow reads, as `KEY=value` lines for `$GITHUB_ENV`. */
export function previewEnv(t: PreviewTarget = PREVIEW_TARGET, current = process.env.GITHUB_REPOSITORY ?? ""): string {
  const lines = [
    `PREVIEW_REPO=${previewRepo(t, current)}`,
    `PREVIEW_BRANCH=${t.branch}`,
    `PREVIEW_SERVED=${t.publicUrl === null ? "false" : "true"}`,
    `PREVIEW_PUBLIC_URL=${t.publicUrl === null ? "" : t.publicUrl.replace(/\/+$/, "")}`,
    `PREVIEW_SITE_URL=${previewSiteUrl(t, current)}`,
    `PREVIEW_SITE_PATH=${previewSitePath(t, current)}`,
  ];
  return `${lines.join("\n")}\n`;
}

function git(cwd: string, args: string[]): { code: number; out: string; err: string } {
  const r = spawnSync("git", args, { cwd, encoding: "utf-8" });
  if (r.error !== undefined || r.status === null) return { code: -1, out: "", err: String(r.error ?? "git did not run") };
  return { code: r.status, out: r.stdout ?? "", err: r.stderr ?? "" };
}

const ORPHAN_README = `# Review previews — not served

Per-PR review previews from \`feature-staging.yml\`, one per pull request under
\`STAGING/<slug>/\`. This branch is **not deployed by GitHub Pages**: the
previews moved off \`gh-pages\` because they pushed that branch past Pages'
10 GB artifact limit and froze the live site (issue #1868). Where they are
served, if anywhere, is configured in \`cat-harness/scripts/preview-target.ts\`.
`;

/**
 * Check the preview branch out into `dir`, or start it as an orphan when it
 * positively does not exist. Returns an exit code: 0 checked out or started,
 * 2 could not determine.
 */
export function checkoutPreview(dir: string, remoteUrl: string, branch: string, token: string | undefined): 0 | 2 {
  mkdirSync(dir, { recursive: true });
  const steps: string[][] = [["init", "-q"], ["remote", "add", "origin", remoteUrl]];
  if (token !== undefined && token !== "") {
    // The same header `actions/checkout` writes, so `push`/`pull` below
    // authenticate without the token ever appearing in a URL or a log line.
    const basic = Buffer.from(`x-access-token:${token}`).toString("base64");
    steps.push(["config", "--local", "http.https://github.com/.extraheader", `AUTHORIZATION: basic ${basic}`]);
  }
  for (const s of steps) {
    const r = git(dir, s);
    if (r.code !== 0) {
      console.error(`✗ git ${s[0]} exited ${r.code}: ${r.err.trim()}`);
      return 2;
    }
  }
  const ls = git(dir, ["ls-remote", "--exit-code", "--heads", "origin", branch]);
  if (ls.code === 2) {
    const o = git(dir, ["checkout", "-q", "--orphan", branch]);
    if (o.code !== 0) {
      console.error(`✗ git checkout --orphan ${branch} exited ${o.code}: ${o.err.trim()}`);
      return 2;
    }
    writeFileSync(join(dir, "README.md"), ORPHAN_README);
    if (!existsSync(join(dir, ".nojekyll"))) writeFileSync(join(dir, ".nojekyll"), "");
    console.log(`${branch} does not exist on ${remoteUrl} yet — started it as an orphan; the first push creates it`);
    return 0;
  }
  if (ls.code !== 0 || ls.out.trim() === "") {
    console.error(`✗ COULD NOT DETERMINE whether ${branch} exists on ${remoteUrl}: ls-remote exited ${ls.code}: ${ls.err.trim()}`);
    return 2;
  }
  const f = git(dir, ["fetch", "-q", "--depth=1", "--no-tags", "origin", `+refs/heads/${branch}:refs/remotes/origin/${branch}`]);
  if (f.code !== 0) {
    console.error(`✗ git fetch ${branch} exited ${f.code}: ${f.err.trim()}`);
    return 2;
  }
  const c = git(dir, ["checkout", "-q", "-B", branch, `origin/${branch}`]);
  if (c.code !== 0) {
    console.error(`✗ git checkout ${branch} exited ${c.code}: ${c.err.trim()}`);
    return 2;
  }
  console.log(`checked out ${branch} from ${remoteUrl} into ${dir}`);
  return 0;
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

if (import.meta.main) {
  const cmd = process.argv[2];
  if (cmd === "env") {
    process.stdout.write(previewEnv());
    process.exit(0);
  }
  if (cmd === "checkout") {
    const dir = arg("dir");
    const repo = previewRepo();
    if (dir === undefined || repo === "") {
      console.error("usage: preview-target.ts checkout --dir DIR   (needs GITHUB_REPOSITORY when the target repo is this one)");
      process.exit(2);
    }
    const server = process.env.GITHUB_SERVER_URL ?? "https://github.com";
    process.exit(checkoutPreview(dir, `${server}/${repo}.git`, PREVIEW_TARGET.branch, process.env.PREVIEW_PUSH_TOKEN));
  }
  console.error("usage: preview-target.ts env | checkout --dir DIR");
  process.exit(2);
}
