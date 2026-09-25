#!/usr/bin/env bun
/**
 * Every harness above the floor gets a board, and it shows everything.
 *
 * @module scripts/gen-default-boards
 * @covers boards
 *
 * The owner, 2026-09-21:
 *
 * > Any harness above bootsteap has a board filled with all contents.
 *
 * and, in `yj32`, what that board is FOR: *"a harness instance's default
 * rendering is LHS + docs/ + a themed folio board"*. So a board is not
 * something a folio opts into — it is part of what an instantiated harness
 * renders, and this writes the one every such harness owes.
 *
 * ## "Filled with all contents" is the ABSENT filter, and that is a convergence
 *
 * `schemas/board.ts` already decided this, from a different question: a board
 * with no `filter` shows the whole folio, chosen because a stored selection
 * needs a staleness check and a query has nothing to fall behind. So the
 * default board is the MINIMAL one — id, title, nothing else — and "filled
 * with all contents" and "declares no selection" turn out to be the same
 * document. Bean `8hg7` expected to scaffold "an empty board"; the empty board
 * IS the full one.
 *
 * ## "Above bootstrap" is read from the DECLARATION, not from a name
 *
 * `bootstrap` is exempt: its own `renderExemption` says why in its own
 * words — *"bootstrap IS the navbar footer… it produces nothing a human
 * browses"* — and a layer that renders nothing has nothing to put on a board.
 * So the test is {@link isExemptFrom}`(decl, "visualiser")`, the same rule the
 * navbar tiles sort by, rather than a check for the string `bootstrap`.
 * A checker that names one instance states a rule true only for the instance
 * somebody remembered (bean `hfkl`).
 *
 * ## INSTANTIATED, not merely present
 *
 * Owner, the same day: *"only the instiatiated harnesses (not all dependent
 * ones)… so repo root has `<harness>.config.json`"*. A dependency that happens
 * to sit in this checkout is not a harness this repository renders, so it is
 * not owed a board either. One signal, used by the navbar and by this.
 *
 * Usage:  bun run cat-harness/scripts/gen-default-boards.ts [--check]
 *
 * `--check` writes nothing and exits 1 when a board is missing or stale.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { BOARD_SCHEMA_TAG, wholeFolioBoard } from "../schemas/board.js";
import { isExemptFrom, readDeclaration } from "../schemas/cat-harness.js";
import { instanceConfigFilename } from "../schemas/harness-config.js";
import { TODO_GRAPH_FILE, parseTodoGraph } from "../schemas/todo-graph.js";
import { TODO_ROOT } from "./todos.js";

const ROOT = resolve(import.meta.dir, "..");
const REPO_ROOT = resolve(ROOT, "..");
const check = process.argv.includes("--check");

/**
 * Where the boards live — READ, at both levels, never written here.
 *
 * The todo graph's own root comes from `scripts/todos.ts`, which resolves it
 * through `directoryForGraph` against the declaration; the boards directory
 * inside it comes from `todos.json`. Two lookups because they are two
 * declarations, and `check:declared-paths` is what stops either becoming a
 * literal — it caught this function composing `todos/` by hand.
 */
export function boardsDir(_repoRoot: string, todoRoot: string = TODO_ROOT()): string {
  const graph = parseTodoGraph(JSON.parse(readFileSync(join(todoRoot, TODO_GRAPH_FILE), "utf8")));
  const entry = graph.directories.find((d) => (d.graphKinds ?? []).includes("boards"));
  if (entry === undefined) {
    throw new Error(
      `${todoRoot}/${TODO_GRAPH_FILE} declares no directory holding a \`boards\` graph. ` +
        `The default boards have nowhere to go; declare one rather than assuming a path here.`,
    );
  }
  return join(todoRoot, entry.path);
}

/**
 * The harnesses that owe a board: instantiated here, and above the floor.
 *
 * Returned sorted, so the set is a function of the declarations rather than of
 * the directory walk — the same reason `readTodoFiles` sorts.
 */
export function harnessesOwedABoard(repoRoot: string, names: readonly string[]): string[] {
  const out: string[] = [];
  for (const name of [".", ...names]) {
    const dir = name === "." ? repoRoot : join(repoRoot, name);
    const decl = readDeclaration(dir);
    if (decl === undefined || decl === null) continue;
    if (!existsSync(join(repoRoot, instanceConfigFilename(decl.name)))) continue;
    if (isExemptFrom(decl, "visualiser")) continue;
    out.push(decl.name);
  }
  return [...new Set(out)].sort();
}

/** The document a harness's default board is — minimal, which is to say total. */
export function defaultBoard(name: string, title: string): string {
  return JSON.stringify(wholeFolioBoard(name, title), null, 2) + "\n";
}

if (import.meta.main) {
  const dir = boardsDir(REPO_ROOT);
  const names = readdirSync(REPO_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith(".") && d.name !== "node_modules")
    .map((d) => d.name)
    .sort();
  const owed = harnessesOwedABoard(REPO_ROOT, names);

  let stale = 0;
  let wrote = 0;
  for (const name of owed) {
    const decl = readDeclaration(name === readDeclaration(REPO_ROOT)?.name ? REPO_ROOT : join(REPO_ROOT, name));
    const title = decl?.title ?? name;
    const path = join(dir, `${name}.json`);
    const next = defaultBoard(name, title);
    const current = existsSync(path) ? readFileSync(path, "utf8") : "";
    if (current === next) continue;
    if (check) {
      console.error(`  ✗ ${relative(REPO_ROOT, path)} ${current === "" ? "is missing" : "is stale"}`);
      stale++;
      continue;
    }
    mkdirSync(dir, { recursive: true });
    writeFileSync(path, next);
    wrote++;
    console.log(`  ✓ ${relative(REPO_ROOT, path)}`);
  }

  // A board for a harness that is NOT owed one is reported rather than
  // removed: `deletion-requires-confirmation` applies to a board like any
  // other durable artefact, and a file here may be a board somebody authored
  // deliberately for a harness this checkout no longer instantiates.
  const extra = existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => f.endsWith(".json") && !owed.includes(f.replace(/\.json$/, "")))
        .sort()
    : [];
  for (const f of extra) {
    console.log(`  · ${f} — not a harness this checkout owes a board; left alone`);
  }

  if (check) {
    if (stale > 0) {
      console.error(
        `\n${stale} default board(s) missing or stale. Every instantiated harness above the ` +
          `floor owes one — run \`bun run boards:default\` and commit the result.`,
      );
      process.exit(1);
    }
    console.log(`default boards are up to date — ${owed.length} harness(es): ${owed.join(", ")}`);
  } else {
    console.log(
      `${owed.length} harness(es) owe a board: ${owed.join(", ")}. ` +
        `${wrote} written, ${owed.length - wrote} already current. ` +
        `Each shows the WHOLE folio — a board with no filter is the total one (${BOARD_SCHEMA_TAG}).`,
    );
  }
}
