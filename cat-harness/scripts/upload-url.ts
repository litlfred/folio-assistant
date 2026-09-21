#!/usr/bin/env bun
/**
 * The URL a person can drop a file at, composed from the declaration.
 *
 * @module scripts/upload-url
 *
 * ## The 404 this exists to stop
 *
 * The owner, 2026-09-20, pointing at
 * `github.com/litlfred/folio-assistant/upload/main/uploads`:
 *
 * > were it to exist, but it doesmt on main!!!!!
 *
 * Measured, and they are right. `git ls-tree origin/main` has **no root-level
 * `uploads/`**; what exists is `cat-harness/uploads/`. So that URL 404s, and a
 * person sent to it has been sent nowhere.
 *
 * ## Why the obvious composition produces exactly that broken URL
 *
 * `harness.json` declares `{ id: "uploads", path: "uploads/" }` with no
 * `scope`, and absent scope means **instance**. So the declared path resolves
 * against the INSTANCE root — `cat-harness/` since the move — while a GitHub
 * URL needs the path relative to the **repository** root. Pasting the declared
 * `path` straight into `/upload/<branch>/` drops the `cat-harness/` segment and
 * mints the 404.
 *
 * That is bean `wggr` again: the instance root and the repository root were the
 * same directory until the move, so every declared path answered both questions
 * at once, and afterwards four directories and both assets resolved one level
 * too deep. `rootForScope` exists for this, and this module is one more caller.
 *
 * **So the path is never written down.** A literal here would be correct today
 * and wrong at the next relocation, which is the whole of bean `blv9`.
 *
 * ## Every failure is NAMED, never a broken link
 *
 * A URL is believed. An agent that guesses one when it cannot resolve the
 * pieces sends a person somewhere that does not exist, and they have no way to
 * tell a wrong link from an empty directory. Each of the four resolution steps
 * reports what it could not determine instead.
 */
import { existsSync } from "node:fs";
import { relative, resolve } from "node:path";

import {
  instanceRootFor,
  readDeclaration,
  repoRootFor,
  rootForScope,
  type ContentDirectory,
} from "../schemas/cat-harness.js";
// `folio` is registered by core on import and this instance declares a folio
// graph; without it `readDeclaration` throws on a valid declaration.
import "../schemas/folio-graph-kind.js";
import { detectRepoUrl } from "../content/pipeline/readme-toc.js";

/** The graph kind an acquisition queue declares. */
export const UPLOADS_GRAPH_KIND = "uploads";

/** Resolved, or the reason it could not be — never a guessed URL. */
export type UploadTarget =
  | { ok: true; url: string; repoRelative: string; branch: string }
  | { ok: false; reason: string; remedy: string };

/**
 * Where an instance's acquisition queue is, relative to the REPOSITORY root.
 *
 * The one piece of arithmetic this module exists for. Exported so a test can
 * assert it against the real declaration rather than against a literal.
 */
export function queueRepoRelative(root: string): string | undefined {
  const decl = readDeclaration(root);
  const entry = (decl?.directories ?? []).find((d: ContentDirectory) =>
    d.graphKinds.includes(UPLOADS_GRAPH_KIND),
  );
  if (!entry) return undefined;
  const abs = resolve(rootForScope(root, entry.scope), entry.path);
  // POSIX separators: this becomes a URL, and a Windows checkout would
  // otherwise emit backslashes into it.
  return relative(repoRootFor(root), abs).split("\\").join("/");
}

/**
 * The upload URL for this instance's queue, or a named failure.
 *
 * `branch` defaults to `main` because that is what a forge's web upload form
 * targets when nobody says otherwise; pass the working branch to send somebody
 * at a PR's head instead.
 */
export function uploadUrl(root: string, branch = "main"): UploadTarget {
  const decl = readDeclaration(root);
  if (!decl) {
    return {
      ok: false,
      reason: `no harness declaration at ${root}`,
      remedy: "run this from inside an initialized instance",
    };
  }
  const rel = queueRepoRelative(root);
  if (rel === undefined) {
    return {
      ok: false,
      reason: `${decl.name} declares no \`${UPLOADS_GRAPH_KIND}\` graph`,
      remedy:
        "declare one in the instance's <name>.json, or acquire the resource through another channel — see the content-acquisition skill",
    };
  }
  if (!existsSync(resolve(repoRootFor(root), rel))) {
    // A declared-but-absent directory is the `dh4f` defect, and a forge will
    // 404 on it exactly as it did for the owner.
    return {
      ok: false,
      reason: `the declared queue \`${rel}\` does not exist on disk`,
      remedy: "create it (a directory needs a keep-marker file to survive a clone)",
    };
  }
  const repoUrl = detectRepoUrl(root);
  if (!repoUrl) {
    return {
      ok: false,
      reason: "could not read a git remote named `origin`",
      remedy: "paste the resource into the conversation instead — chat is the other acquisition channel",
    };
  }
  if (!/^https:\/\/github\.com\//.test(repoUrl)) {
    // The `/upload/<branch>/<path>` form is GitHub's. Emitting it for another
    // forge would be a guess wearing a URL's clothes.
    return {
      ok: false,
      reason: `\`${repoUrl}\` is not a github.com remote, and the web upload path is GitHub's`,
      remedy: `have them commit the file to \`${rel}\` on \`${branch}\`, or paste it into the conversation`,
    };
  }
  return {
    ok: true,
    url: `${repoUrl.replace(/\.git$/, "").replace(/\/$/, "")}/upload/${branch}/${rel}`,
    repoRelative: rel,
    branch,
  };
}

if (import.meta.main) {
  const branch = process.argv[2] ?? "main";
  const target = uploadUrl(instanceRootFor(import.meta.dir), branch);
  if (target.ok) {
    console.log(target.url);
    process.exit(0);
  }
  console.error(`cannot compose an upload URL: ${target.reason}`);
  console.error(`  ${target.remedy}`);
  process.exit(1);
}
