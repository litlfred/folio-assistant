#!/usr/bin/env bun
/**
 * Every link out of the files an agent reads FIRST still resolves.
 *
 * @module scripts/check-agent-entry-links
 *
 * Bean `v8gh`. `AGENTS.md` is the file every agent opens before anything
 * else, and nothing checked the links OUT of it. Measured 2026-09-19: it
 * carried **seven dead links**, five broken by one directory move — including
 * `docs/guides/agent-onboarding.md`, which its own banner calls the place to
 * start. A cold agent following the banner hit a 404.
 *
 * The two neighbouring checks each miss it by design:
 *
 * | check | covers |
 * |---|---|
 * | `readme:audit` | `README.md` only |
 * | `check:agents-xref` | section citations **into** `AGENTS.md` |
 * | *this* | links **out of** every agent entry file |
 *
 * ## It reuses the generic auditor rather than growing a second one
 *
 * `src/core/markdown-links.ts` already does relative-path-against-working-tree,
 * ref-aware and Pages-aware checking, and already reports a third state for
 * what it could not check. The bean guessed it would generalise and said to
 * confirm rather than assume — confirmed: it ran clean over `AGENTS.md`
 * unmodified.
 *
 * That auditor was inside `content/pipeline/readme-links.ts` when this check
 * was written, which made this file import core from harness and forced it to
 * be CLASSIFIED core — honest about shipping, dishonest about subject, since
 * `AGENTS.md` is harness through and through. Bean `cp3l` lifted the generic
 * half out, so this now sits where its subject says it belongs.
 *
 * ## Discovery, not a list
 *
 * A hardcoded list of entry files would go stale exactly the way the links
 * did — `bootstrap/AGENTS.md` exists today and was not obvious. So the files
 * are FOUND: the three agent-generic names, at the repository root and at any
 * instance root, skipping vendored and published trees.
 */
import { existsSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { auditMarkdownFile } from "../src/core/markdown-links.js";
import { publishTargets } from "../src/core/git-refs.js";
import { repoRootFor } from "../schemas/cat-harness.js";

/**
 * The agent-generic entry files.
 *
 * `AGENTS.md` is read natively by Claude Code, Gemini CLI, Antigravity,
 * Cursor and Copilot; the other two are thin stubs pointing at it. All three
 * are checked, because a stub whose pointer is broken is worse than no stub —
 * it looks like guidance and leads nowhere.
 */
export const ENTRY_NAMES = ["AGENTS.md", "CLAUDE.md", "GEMINI.md"] as const;

/** Directories never worth walking into for this. */
const SKIP = new Set(["node_modules", ".git", "_site", "dist", "build", ".lake", "docs"]);

/**
 * Entry files at the repository root and one level down.
 *
 * One level, because an instance root is a direct child (`bootstrap/`,
 * `cat-harness/`). Deeper is a folio's own content, which is not this
 * repository's to gate.
 */
export function findEntryFiles(repo: string): string[] {
  const out: string[] = [];
  for (const n of ENTRY_NAMES) if (existsSync(join(repo, n))) out.push(join(repo, n));
  for (const e of readdirSync(repo, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name.startsWith(".") || SKIP.has(e.name)) continue;
    for (const n of ENTRY_NAMES) {
      const p = join(repo, e.name, n);
      if (existsSync(p)) out.push(p);
    }
  }
  return out.sort();
}

if (import.meta.main) {
  const repo = repoRootFor(resolve(import.meta.dir, ".."));
  const files = findEntryFiles(repo);

  // A green run over zero files is not coverage — the same guard the workflow
  // and skill sweeps carry. If the names ever change, this fails loudly rather
  // than reporting a clean sweep over nothing.
  if (files.length === 0) {
    console.error(
      `✗ no agent entry file found under ${repo}. Expected at least one of ` +
        `${ENTRY_NAMES.join(", ")}; a clean run over zero files is not a clean run.`,
    );
    process.exit(2);
  }

  // Asked once, not per file: the publish targets are a property of the
  // repository, and resolving a Pages URL needs them. Without them every
  // `github.io` link in `AGENTS.md` would come back UNCHECKED — which is the
  // clean-looking blindness bean `v8gh` existed to remove, not a pass.
  const targets = publishTargets(repo);

  console.log(`Agent entry links — ${files.length} file(s)\n`);
  let dead = 0;
  let unreadable = 0;
  for (const f of files) {
    const rel = relative(repo, f);
    const r = auditMarkdownFile({ root: repo, file: f, ...targets });
    // exit 2 from the auditor is "could not read it", which is neither a pass
    // nor a dead link and must not be folded into either.
    if (r.exitCode === 2) {
      unreadable += 1;
      console.error(`  ? ${rel.padEnd(24)} COULD NOT DETERMINE — ${r.text.trim()}`);
      continue;
    }
    // The SUMMARY line, not the last line: the auditor prints its
    // not-checked breakdown AFTER the summary, so `pop()` showed
    // "1 × in-page anchor" where `AGENTS.md`'s 43/43 belonged.
    const summary =
      r.text.split("\n").find((l) => l.includes("link(s) checked"))?.trim() ?? r.text.trim();
    console.log(`  ${r.exitCode === 0 ? "✓" : "✗"} ${rel.padEnd(24)} ${summary}`);
    if (r.exitCode !== 0) {
      dead += 1;
      for (const line of r.text.split("\n")) if (line.trim()) console.error(`      ${line}`);
    }
  }

  if (unreadable > 0) {
    console.error(
      `\n✗ ${unreadable} entry file(s) could not be read. That is not the same as ` +
        `having no dead links, and it outranks one: a sweep blind on one file has ` +
        `not cleared the others.`,
    );
    process.exit(2);
  }
  if (dead > 0) {
    console.error(`\n✗ ${dead} entry file(s) carry a dead link.`);
    process.exit(1);
  }
  console.log(`\nEvery link out of every agent entry file resolves.`);
  process.exit(0);
}
