#!/usr/bin/env bun
/**
 * readme-links.ts — verify the links a README already carries.
 *
 * ## Why an audit and not a sixth generated section
 *
 * `readme-sections.ts` made the *generated* parts of a folio README verify
 * their own targets. Everything else in the file is authored Markdown, and
 * nothing checked it at all — which is how qou's Published Artefacts table
 * came to list `blueprint/` and `docs/`, neither of which has ever existed on
 * `gh-pages` (the Lean documentation is published at `lean/docs/`). Both rows
 * were dead in both columns, in a table nobody could regenerate.
 *
 * Generating that table instead would mean inventing its labels — "Folio
 * landing page", "Blueprint (interactive graph)", the Project Structure
 * descriptions — which are prose worth keeping. The defect was never the
 * layout going stale; it was targets that do not resolve. So this verifies
 * what the author wrote and never rewrites a byte of it.
 *
 * ## What "checked" means, and the third state
 *
 * A link is only reported dead when this could actually look. A relative path
 * is resolved against the working tree; a link naming one of the repo's own
 * refs is resolved against a real `git ls-tree` of that ref; a GitHub Pages
 * URL under the folio's configured `pagesBaseUrl` is resolved against the
 * publish ref, because that is the branch the site is served from.
 *
 * Everything else — an external host, a bare `#anchor`, a `mailto:` — is
 * **unchecked**, and so is any repo ref this checkout cannot read. Unchecked
 * is reported separately and never counted as dead, the same rule the contents
 * table follows for an unreadable publish ref: not-looked-at must not read as
 * nothing-found.
 *
 * @module content/pipeline/readme-links
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";

import { loadReadmeConfig, detectRepoUrl, publishedPaths } from "./readme-toc";
import { findContentRepoRoot } from "./repo-root";

// ── Findings ────────────────────────────────────────────────────────────────

export interface LinkRef {
  /** 1-based line in the source file. */
  line: number;
  /** The link text, for identifying the row a reader must fix. */
  text: string;
  /** The raw target as written. */
  target: string;
}

export interface DeadLink extends LinkRef {
  /** What was looked for and where. */
  reason: string;
}

export interface AuditResult {
  checked: number;
  ok: number;
  dead: DeadLink[];
  /** Why links were not checked, and how many of each. */
  unchecked: Record<string, number>;
}

// ── Parsing ─────────────────────────────────────────────────────────────────

/**
 * Blank out fenced code blocks, preserving line count.
 *
 * A README's shell examples are full of brackets and parentheses, and a
 * command is not a link. Blanking rather than deleting keeps every reported
 * line number pointing at the line a reader will actually open.
 */
function stripFences(src: string): string[] {
  const lines = src.split("\n");
  let inFence = false;
  return lines.map((line) => {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      return "";
    }
    return inFence ? "" : line;
  });
}

/**
 * Every Markdown link in the file: inline `[text](target)` and reference
 * definitions `[id]: target`.
 *
 * Images (`![alt](src)`) count too — a broken image is a broken link, and the
 * one thing a reader cannot miss.
 */
export function parseLinks(src: string): LinkRef[] {
  const out: LinkRef[] = [];
  const lines = stripFences(src);

  lines.forEach((line, i) => {
    // Inline: [text](target) or [text](target "title"). The target stops at
    // whitespace so a title does not become part of the path.
    for (const m of line.matchAll(/!?\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+"[^"]*")?\s*\)/g)) {
      out.push({ line: i + 1, text: m[1], target: m[2] });
    }
    // Reference definition: [id]: target
    const def = line.match(/^\s{0,3}\[([^\]]+)\]:\s*(\S+)/);
    if (def) out.push({ line: i + 1, text: def[1], target: def[2] });
  });
  return out;
}

// ── Resolution ──────────────────────────────────────────────────────────────

/** Strip the fragment and query, and percent-decode, leaving a repo path. */
function toPath(target: string): string {
  const bare = target.split("#")[0].split("?")[0];
  try {
    return decodeURIComponent(bare);
  } catch {
    return bare;
  }
}

/** `owner/repo` from a repo web URL. */
function ownerRepo(repoUrl: string): string | undefined {
  return repoUrl.replace(/\/$/, "").match(/[^/]+\/[^/]+$/)?.[0];
}

/**
 * Whether `path` names a file or a directory in a flat listing.
 *
 * `git ls-tree -r` lists files only, so a directory exists exactly when
 * something sits under it — which is what a `tree/` link points at.
 */
function inListing(listing: Set<string>, path: string): boolean {
  const clean = path.replace(/^\/+|\/+$/g, "");
  if (clean === "") return true; // the root of the ref
  if (listing.has(clean)) return true;
  if (listing.has(`${clean}/index.html`)) return true;
  const prefix = `${clean}/`;
  for (const entry of listing) if (entry.startsWith(prefix)) return true;
  return false;
}

interface Classified {
  kind: "worktree" | "ref" | "unchecked";
  path?: string;
  ref?: string;
  reason?: string;
}

/**
 * Decide what, if anything, a target can be checked against.
 *
 * Exported because the classification *is* the interesting logic — a test
 * that a Pages URL resolves against the publish ref is worth more than one
 * asserting the reporter's wording.
 */
export function classify(
  target: string,
  opts: { repoUrl?: string; pagesBaseUrl?: string; publishRef: string },
): Classified {
  if (target.startsWith("#")) return { kind: "unchecked", reason: "in-page anchor" };
  if (/^[a-z][a-z0-9+.-]*:/i.test(target) && !/^https?:/i.test(target)) {
    return { kind: "unchecked", reason: "non-http scheme" };
  }

  if (/^https?:/i.test(target)) {
    const repo = opts.repoUrl?.replace(/\/$/, "");
    if (repo) {
      // github.com/<owner>/<repo>/blob|tree|raw/<ref>/<path>
      const esc = repo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const m = target.match(new RegExp(`^${esc}/(?:blob|tree|raw)/([^/]+)/(.*)$`));
      if (m) return { kind: "ref", ref: decodeURIComponent(m[1]), path: toPath(m[2]) };

      const slug = ownerRepo(repo);
      if (slug) {
        const rawM = target.match(
          new RegExp(`^https?://raw\\.githubusercontent\\.com/${slug}/([^/]+)/(.*)$`),
        );
        if (rawM) return { kind: "ref", ref: decodeURIComponent(rawM[1]), path: toPath(rawM[2]) };
      }
    }

    const pages = opts.pagesBaseUrl?.replace(/\/$/, "");
    if (pages && target.startsWith(pages)) {
      // The Pages site is served from the publish ref, so that listing is the
      // authority on whether the URL resolves.
      return { kind: "ref", ref: opts.publishRef, path: toPath(target.slice(pages.length)) };
    }

    return { kind: "unchecked", reason: "external URL (not fetched)" };
  }

  return { kind: "worktree", path: toPath(target) };
}

// ── The audit ───────────────────────────────────────────────────────────────

export function auditLinks(
  root: string,
  src: string,
  opts: { repoUrl?: string; pagesBaseUrl?: string; publishRef: string; fetch?: boolean },
): AuditResult {
  const dead: DeadLink[] = [];
  const unchecked: Record<string, number> = {};
  let ok = 0;
  let checked = 0;

  // One listing per ref, computed on first use: `git ls-tree` over a published
  // site is expensive enough that doing it per link would dominate the run.
  const listings = new Map<string, Set<string> | undefined>();
  const listingFor = (ref: string): Set<string> | undefined => {
    if (!listings.has(ref)) listings.set(ref, publishedPaths(root, ref, opts.fetch ?? false));
    return listings.get(ref);
  };

  const note = (reason: string) => {
    unchecked[reason] = (unchecked[reason] ?? 0) + 1;
  };

  for (const link of parseLinks(src)) {
    const c = classify(link.target, opts);

    if (c.kind === "unchecked") {
      note(c.reason ?? "unchecked");
      continue;
    }

    if (c.kind === "worktree") {
      checked++;
      if (existsSync(join(root, c.path!))) ok++;
      else dead.push({ ...link, reason: `no such path in the working tree: ${c.path}` });
      continue;
    }

    const listing = listingFor(c.ref!);
    if (!listing) {
      // The ref is not readable here — a shallow clone that never fetched
      // `gh-pages`, most often. Reporting these as dead would turn a clone
      // detail into a wall of false findings.
      note(`ref '${c.ref}' not readable in this checkout`);
      continue;
    }
    checked++;
    if (inListing(listing, c.path!)) ok++;
    else dead.push({ ...link, reason: `not published at ${c.ref}: ${c.path}` });
  }

  return { checked, ok, dead, unchecked };
}

/** Shared by the CLI and the `readme_audit` MCP tool. */
export function runReadmeAudit(opts: {
  root?: string;
  file?: string;
  fetch?: boolean;
}): { text: string; exitCode: number } {
  const root = opts.root ?? findContentRepoRoot();
  const cfg = loadReadmeConfig(root);
  const file = opts.file ?? join(root, "README.md");
  if (!existsSync(file)) return { text: `No file at ${file}.`, exitCode: 2 };

  const result = auditLinks(root, readFileSync(file, "utf-8"), {
    repoUrl: cfg.repoUrl ?? detectRepoUrl(root),
    pagesBaseUrl: cfg.pagesBaseUrl,
    publishRef: cfg.publishRef,
    fetch: opts.fetch,
  });

  const lines: string[] = [];
  for (const d of result.dead) {
    lines.push(`${file}:${d.line}  [${d.text}](${d.target})`);
    lines.push(`    ${d.reason}`);
  }
  const uncheckedTotal = Object.values(result.unchecked).reduce((a, b) => a + b, 0);
  const summary =
    `${result.checked} link(s) checked, ${result.ok} resolved, ${result.dead.length} dead; ` +
    `${uncheckedTotal} not checked`;
  lines.push(result.dead.length ? `\n${summary}` : summary);
  for (const [reason, count] of Object.entries(result.unchecked).sort()) {
    lines.push(`    ${count} × ${reason}`);
  }

  return { text: lines.join("\n"), exitCode: result.dead.length > 0 ? 1 : 0 };
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const flag = (name: string): string | undefined => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  try {
    const result = runReadmeAudit({ file: flag("file"), fetch: argv.includes("--fetch") });
    (result.exitCode === 0 ? console.log : console.error)(result.text);
    process.exit(result.exitCode);
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(2);
  }
}
