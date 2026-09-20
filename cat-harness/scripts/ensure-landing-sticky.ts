#!/usr/bin/env bun
/**
 * Give an instance a folio and a landing sticky — the last act of initiation.
 *
 * @module scripts/ensure-landing-sticky
 *
 * The owner's ask, 2026-09-20: *"the sticky note is created dynamically on
 * initailzation by cat-harness bootstrap (as last thing). it creates an empty
 * folio (if none exists) and attaches to the folio a sticky note."* And on who
 * runs it: *"cat-harness initaton craetes the folio/ (called by bootstrap)."*
 *
 * ## Why this is not `init-folio`
 *
 * The obvious candidate, and the wrong one. Two things sound the same:
 *
 * | | what it is |
 * |---|---|
 * | **`content/`** | what `scripts/init-folio.ts` scaffolds, in a SEPARATE content repository |
 * | **`folio/`** | a declared graph DIRECTORY of kind `folio` — the one renderable kind |
 *
 * `init-folio` writes a content repo's `content/`, `uploads/`, `library/`, a
 * `harness.config.json` and a builder shim. Reaching for it here would scaffold
 * a folio *repository* where the ruling asks for a folio *graph*.
 *
 * ## Why it stays out of `bootstrap/`
 *
 * The owner: *"i want the grumpy cat moved out of bootstrap and into cat
 * harness."* Bootstrap's last activity `A_Install` is the **hand-off** to the
 * chosen harness, and `bootstrap/harness.json` declares an instance that may
 * not import from the layer composed on top of it. A bare bootstrap instance
 * gets no folio and no cat; this script is cat-harness's, and runs after the
 * hand-off.
 *
 * Measured 2026-09-20, so nobody hunts for a file to move: there is no grumpy
 * cat in `bootstrap/` today — `grep -rin "grumpy\|cat-mark\|landing" bootstrap/`
 * returns one false positive. The ruling is a constraint on new work, not a
 * relocation.
 *
 * ## Idempotency is the whole engineering problem
 *
 * Initiation runs again: a re-initialisation, a sibling session, a resumed
 * container. Every step here has to be safe to repeat, and two of them are not
 * naturally so:
 *
 * 1. **The sticky's `createdAt`.** Written from the clock, the file changes on
 *    every run and a `--check` gate can never say *nothing changed*. So an
 *    existing sticky's `createdAt` is **read back and reused**; the clock is
 *    consulted only when there is nothing there.
 * 2. **The declaration.** `harness.json` is committed **ASCII-escaped** —
 *    `json.dumps(…, ensure_ascii=True)` round-trips it byte-for-byte and
 *    `ensure_ascii=False` does not. `JSON.stringify` emits literal UTF-8, so
 *    re-serialising the declaration would rewrite every em dash in it: a
 *    115-line diff for a one-entry addition. Worse, the `description` carries a
 *    deliberate NO-BREAK SPACE before `c@t-harness`, and a reformat is exactly
 *    the kind of change that silently normalises one.
 *
 *    So {@link insertDirectoryEntry} is a **surgical text edit** — it splices one
 *    entry into the `directories` array and leaves every other byte alone, which
 *    `ensure-landing-sticky.test.ts` asserts directly.
 *
 * Exit codes: 0 up to date or written · 1 stale/absent under `--check`.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { instanceRootFor, readDeclaration, type ContentDirectory } from "../schemas/cat-harness.js";
// REQUIRED, and not merely tidy: `folio` is registered by CORE as a load-time
// side effect (`schemas/folio-graph-kind.ts`, "a layer that cannot render must
// not own the renderable kind"), so the harness alone does not know the kind
// exists. Without this import `readDeclaration` throws
// `unknown graph kind "folio"` on the very declaration this script just wrote —
// which is what it did on the first re-run, because nothing in this repository
// had ever DECLARED a folio graph before and so nothing had ever needed the
// registration to have happened.
import "../schemas/folio-graph-kind.js";
import {
  LandingStickySchema,
  landingStickies,
  type LandingSticky,
} from "../schemas/landing-sticky.js";

/** The graph kind, and the conventional directory an instance keeps it in. */
export const FOLIO_GRAPH_KIND = "folio";
export const FOLIO_DIR_ID = "folio";
// declared-path-literal: the convention for a directory that does not exist yet.
// This script's whole job is to CREATE the folio graph and then declare it, so
// there is no declaration to read at the only moment this value is used — the
// same write-target case `adapters/document/paths.ts` and `src/workflow/gate.ts`
// mark, and for the same reason: `directoryForGraph` returns undefined for a
// directory that is not there, which would make the first run impossible rather
// than merely empty. Once declared, every later run reads `folioDirPath` off the
// declaration and never reaches this.
export const FOLIO_DIR_PATH = "folio/";

/**
 * A sticky's file within the folio graph.
 *
 * Named from the sticky's own id, so the set of files IS the set of stickies.
 * A hand-kept list beside them would be the shape `BLOCK_KINDS` exists to
 * prevent — an enumeration maintained in two places, one of which is short.
 */
export function stickyFile(id: string): string {
  return `${id}.json`;
}

/**
 * The declaration entry a folio graph gets.
 *
 * `path` carries its trailing slash because every sibling entry does —
 * `tools/`, `schemas/`, `beans/`. Matching the neighbours is not cosmetic here:
 * `check:harness-dirs` and `check:declared-paths` both read these, and a lone
 * entry spelled differently is the kind of thing that resolves fine and then
 * fails to match a comparison somewhere.
 */
export const FOLIO_DIRECTORY_ENTRY: ContentDirectory = {
  id: FOLIO_DIR_ID,
  path: FOLIO_DIR_PATH,
  graphs: [FOLIO_GRAPH_KIND],
  description:
    "Authored content of this instance itself, rendered to a website. Holds the landing sticky — the instance's own description and its onboarding links, as a page-global note rather than text composited into the backdrop.",
};

/** Does this declaration already know about a folio graph? */
export function declaresFolio(decl: { directories?: readonly ContentDirectory[] } | undefined): boolean {
  // Matched on the GRAPH KIND rather than on `id` or `path`. An instance may
  // keep its folio anywhere and call the entry what it likes — `harness.json`'s
  // own comment records that overrides match on id, not path, precisely because
  // a relocation must not mint a second graph. What makes an entry "the folio"
  // is the kind it declares.
  return (decl?.directories ?? []).some((d) => d.graphs.includes(FOLIO_GRAPH_KIND));
}

/** The declared folio directory's path, or the convention when none is declared. */
export function folioDirPath(
  decl: { directories?: readonly ContentDirectory[] } | undefined,
): string {
  return (
    (decl?.directories ?? []).find((d) => d.graphs.includes(FOLIO_GRAPH_KIND))?.path ??
    FOLIO_DIR_PATH
  );
}

/**
 * JSON with every non-ASCII character escaped, matching the committed file.
 *
 * `JSON.stringify` emits literal UTF-8. The declaration is committed escaped, so
 * an em dash written raw would be a real difference in a file the rest of this
 * function is at pains not to touch.
 */
export function toAsciiJson(value: unknown, indent: number): string {
  return JSON.stringify(value, null, indent).replace(/[\u0080-￿]/g, (c) => {
    return `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`;
  });
}

/**
 * Splice one entry into a declaration's `directories` array, byte-preserving.
 *
 * **A text edit, not a re-serialise**, for the reasons in the module docs. The
 * array's bounds are found by bracket matching rather than by a regex, because a
 * regex over nested JSON either stops at the first `]` — there are nested arrays
 * inside these entries, `graphs` among them — or is unreadable.
 *
 * Returns the input unchanged when a folio is already declared, so calling this
 * twice is the same as calling it once.
 */
export function insertDirectoryEntry(raw: string, entry: ContentDirectory): string {
  const decl = JSON.parse(raw) as { directories?: ContentDirectory[] };
  if (declaresFolio(decl)) return raw;

  const key = '"directories"';
  const keyAt = raw.indexOf(key);
  if (keyAt < 0) throw new Error("no `directories` key in the declaration");
  const open = raw.indexOf("[", keyAt);
  if (open < 0) throw new Error("`directories` is not an array");

  // Bracket match, honouring strings so a `[` inside a `description` does not
  // shift the count. The `_comment` fields here are long English prose and one
  // of them will eventually contain a bracket.
  let depth = 0;
  let close = -1;
  let inStr = false;
  for (let i = open; i < raw.length; i += 1) {
    const c = raw[i]!;
    if (inStr) {
      if (c === "\\") i += 1;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "[") depth += 1;
    else if (c === "]") {
      depth -= 1;
      if (depth === 0) {
        close = i;
        break;
      }
    }
  }
  if (close < 0) throw new Error("unterminated `directories` array");

  const body = raw.slice(open + 1, close);
  // The indent of an existing entry, so the insertion matches the file rather
  // than a constant that is right until somebody reformats.
  const indentMatch = body.match(/\n(\s+)\{/);
  const itemIndent = indentMatch?.[1] ?? "    ";
  const closeIndent = itemIndent.slice(0, Math.max(0, itemIndent.length - 2));

  const entryText = toAsciiJson(entry, 2)
    .split("\n")
    .map((l, i) => (i === 0 ? l : `${itemIndent}${l}`))
    .join("\n");

  const trimmed = body.replace(/\s*$/, "");
  const sep = trimmed.endsWith("}") ? "," : "";
  return `${raw.slice(0, open + 1)}${trimmed}${sep}\n${itemIndent}${entryText}\n${closeIndent}${raw.slice(close)}`;
}

/** What one sticky's file needed. */
export interface StickyReport {
  id: string;
  path: string;
  state: "already" | "written" | "updated";
}

/** Everything a run did or found, so the caller reports rather than guesses. */
export interface EnsureReport {
  declaredFolio: "already" | "added";
  folioDir: string;
  createdDir: boolean;
  /** One per sticky, in render order. */
  stickies: StickyReport[];
}

/**
 * Read the sticky already on disk, if there is a valid one.
 *
 * A malformed file returns `undefined` rather than throwing: initiation must be
 * able to repair a half-written sticky, and refusing to run because the thing
 * this function exists to write is broken would be the one failure mode with no
 * recovery. The malformed content is overwritten, which is the same call
 * `--check` reports as stale.
 */
export function readExistingSticky(path: string): LandingSticky | undefined {
  if (!existsSync(path)) return undefined;
  try {
    return LandingStickySchema.parse(JSON.parse(readFileSync(path, "utf8")));
  } catch {
    return undefined;
  }
}

/**
 * The stickies this instance should have, each reusing its own `createdAt`.
 *
 * **Per-sticky reuse, not one timestamp for the set.** Reading the first
 * sticky's `createdAt` and applying it to all of them would rewrite the second
 * every time a new one was added, which is the no-op property this exists to
 * protect. Each file answers for itself.
 */
export function stickiesFor(root: string, dir: string, now: string): LandingSticky[] {
  const decl = readDeclaration(root);
  return landingStickies({
    // An instance with no description still gets a sticky: its `name` is what
    // `displayTitle` already falls back to, and a landing page with no words is
    // worse than one naming the instance.
    description: decl?.description ?? decl?.name ?? "",
    createdAt: now,
  }).map((wanted) => {
    const existing = readExistingSticky(join(dir, stickyFile(wanted.id)));
    return existing ? { ...wanted, createdAt: existing.createdAt } : wanted;
  });
}

export function ensureLandingSticky(
  root: string,
  now: string,
  opts: { check?: boolean } = {},
): EnsureReport {
  const raw = readFileSync(join(root, "harness.json"), "utf8");
  const decl = JSON.parse(raw) as { directories?: ContentDirectory[] };
  const already = declaresFolio(decl);
  const folioDir = folioDirPath(decl);
  const absDir = join(root, folioDir);

  const wanted = stickiesFor(root, absDir, now);
  const planned = wanted.map((w) => {
    const abs = join(absDir, stickyFile(w.id));
    const wantedText = `${JSON.stringify(w, null, 2)}\n`;
    const currentText = existsSync(abs) ? readFileSync(abs, "utf8") : undefined;
    const state: StickyReport["state"] =
      currentText === wantedText ? "already" : currentText === undefined ? "written" : "updated";
    return { abs, wantedText, currentText, report: { id: w.id, path: join(folioDir, stickyFile(w.id)), state } };
  });

  const report: EnsureReport = {
    declaredFolio: already ? "already" : "added",
    folioDir,
    createdDir: !existsSync(absDir),
    stickies: planned.map((p) => p.report),
  };
  if (opts.check) return report;

  if (!already) writeFileSync(join(root, "harness.json"), insertDirectoryEntry(raw, FOLIO_DIRECTORY_ENTRY));
  mkdirSync(absDir, { recursive: true });
  for (const p of planned) if (p.currentText !== p.wantedText) writeFileSync(p.abs, p.wantedText);
  return report;
}

if (import.meta.main) {
  const check = process.argv.includes("--check");
  // `instanceRootFor` rather than cwd: the instance root and the repository root
  // stopped being the same directory in bean `wggr`, and a gate invoked from the
  // repository root would look for `harness.json` one level up from where it is.
  const root = instanceRootFor(import.meta.dir);
  const report = ensureLandingSticky(root, new Date().toISOString(), { check });

  if (check) {
    const problems = [
      report.declaredFolio === "added" ? "no folio graph is declared" : undefined,
      report.createdDir ? `${report.folioDir} does not exist` : undefined,
      ...report.stickies
        .filter((st) => st.state !== "already")
        .map((st) => `${st.path} is ${st.state === "written" ? "missing" : "stale"}`),
    ].filter((p): p is string => p !== undefined);
    if (problems.length === 0) {
      console.log(`✓ folio declared at ${report.folioDir}, ${report.stickies.length} sticky/ies up to date`);
      process.exit(0);
    }
    console.error(`landing sticky is not in order:\n${problems.map((p) => `  · ${p}`).join("\n")}`);
    console.error(`run \`bun run landing:sticky\` and commit`);
    process.exit(1);
  }

  console.log(
    `folio graph ${report.declaredFolio === "added" ? "DECLARED" : "already declared"} at ${report.folioDir}; ` +
      report.stickies.map((st) => `${st.id} ${st.state}`).join(", "),
  );
}
