#!/usr/bin/env bun
/**
 * Every bean's front matter parses as YAML — the check `beans` cannot provide.
 *
 * Bean `t7ao`, found 2026-09-21 by breaking it.
 *
 * ## The failure, measured
 *
 * `224e0beac8` committed a bean whose line 8 was a literal `\1` — an
 * unsubstituted sed backreference where `updated_at:` belonged.
 * `bun run gates --all` was run on that tree: **92 gates, all green.** It was
 * pushed.
 *
 * The next `beans list` in a fresh shell:
 *
 * ```
 * Error: loading beans: loading .../folio-assistant-sqtq--*.md:
 * parsing front matter: yaml: line 8: could not find expected ':'
 * ```
 *
 * Not "that one bean is unreadable" — **no beans at all**. The CLI loads the
 * store as a unit, so `list`, `roadmap` and `prime` all fail together.
 *
 * ## Why that is worse than an ordinary broken file
 *
 * `beans prime` is the FIRST command in this repository's cold start, named in
 * the first line of `AGENTS.md`. One malformed bean means every agent starting
 * after it gets no work plan, from the one command whose whole job is to hand
 * them one. The failure is total, immediate, and attributable to a file whose
 * author has already moved on.
 *
 * ## Why `check-bean-bodies` does not already catch it
 *
 * It reads titles, bodies, checklists and blockers, and it does examine front
 * matter — `isFoldedTitle` is a front-matter SHAPE defect. So the gap is not
 * that front matter went unexamined. It is that it was examined **by regex**,
 * and a regex over a broken document does not notice the document is broken.
 *
 * That is `xom7`: a check that cannot fail is indistinguishable from one that
 * passes. The store was unreadable and the report said 92/92.
 *
 * ## Why this parses when `bean-store-read` deliberately does not
 *
 * `bean-store-read.ts` keeps front matter VERBATIM on purpose — a YAML loader
 * resolves the very folds `isFoldedTitle` exists to see. Both are right,
 * because they ask different questions. That module asks *what does this
 * front matter say*; this one asks *is it front matter at all*. So this reads
 * the same raw block that module already hands out, and parses a COPY of it.
 *
 * ## TWO conditions, and conflating them would be wrong
 *
 * The `yaml` package rejects a duplicate map key; the Go loader inside `beans`
 * accepts it and takes one of the values. So "this file is bad" splits into
 * two findings with different consequences, and the discriminator is whether
 * a TOLERANT parse (`uniqueKeys: false`) still refuses it:
 *
 * | condition | tolerant parse | what it costs |
 * |---|---|---|
 * | `unparseable` | refuses | the whole store, for every reader, now |
 * | `duplicate-key` | accepts | the file says two things and the winner is the reader's parser |
 *
 * Only the first is the emergency this bean was filed for. The second is a
 * real defect — `1hvo` carries two different `title:` values, so what the bean
 * is CALLED depends on who loads it — but the store is up, and gating the
 * repository on somebody else's botched conflict resolution would stop work
 * that has nothing to do with it.
 *
 * ## No sidecar, and a baseline only for the second
 *
 * No sidecar: a `qa-results/v1` file records history for a backlog somebody is
 * working down, and `unparseable` must never last long enough to have any.
 *
 * `unparseable` is NEVER baselined, for the same reason — a baseline for it
 * would be a way to ship a store nobody can load.
 *
 * `duplicate-key` IS baselined, at the two the store already carries, so a NEW
 * one fails while the existing two are listed rather than demanded. That is
 * `check-bean-bodies`'s pattern and its stated reason: *"Outstanding defects
 * are repaired by the bean's OWNER, not by this check and not by whoever ran
 * it."* Both belong to other sessions, and one of them (`7u3g`) is `scrapped`,
 * where changing anything risks reading as resolving a sibling's bean.
 *
 * Exit: 0 every bean parses (or no store), 1 one does not, 2 could not check.
 *
 * @module folio-assistant/scripts/check-bean-front-matter
 */

import { join, resolve } from "node:path";

import { parse as parseYaml } from "yaml";

import { repoRootFor } from "../schemas/cat-harness.js";
import {
  beanDefsDir,
  readBeanStore,
  type BeanStore,
  type SkippedFile,
} from "./bean-store-read.ts";

/**
 * The two beans whose front matter carries a duplicate key today.
 *
 * Both are botched conflict resolutions by earlier sessions: `1hvo` has two
 * `title:` lines (a merge whose own message says it "kept both halves"), and
 * `7u3g` has two `updated_at:` lines — which its own body confesses to,
 * having fixed the duplicated BLOCK and left the duplicated key.
 *
 * Listed rather than repaired here, and listed rather than demanded: each is
 * its owner's to fix, and repairing one means CHOOSING which value was meant,
 * which is a judgement about their work. Remove an id from this set when its
 * bean is repaired — the check says so when an entry no longer matches, so a
 * stale baseline cannot quietly excuse a fresh defect under the same id.
 */
const DUPLICATE_KEY_BASELINE = new Set(["folio-assistant-1hvo", "folio-assistant-7u3g"]);

/** What a loader objected to, and how much it costs. */
export type DefectKind =
  /** Even a tolerant parse refuses it: the store is down for everybody. */
  | "unparseable"
  /** Parses under `beans`' own loader, but a key is given twice. */
  | "duplicate-key"
  /**
   * No parseable `---` fences at all, so no reader here ever sees it.
   *
   * Bean `t6s7`, and the QUIET sibling of `unparseable`. That one takes the
   * store down and announces itself; this one is silent in both directions —
   * every check skips the file, while `beans` loads it as a ghost row with the
   * id taken from the FILENAME, status `?` and no title. Measured: one planted
   * file moved `beans list` 626 -> 627 and left this gate's count at 629, `no
   * NEW defect`, exit 0.
   */
  | "unfenced";

/** One bean whose front matter a YAML loader objected to. */
export interface FrontMatterDefect {
  readonly kind: DefectKind;
  /** The bean's id, as its `# <id>` line gives it. */
  readonly id: string;
  /** Basename, which is what `beans` itself names in its error. */
  readonly file: string;
  /**
   * 1-based line IN THE FILE, not in the front-matter block.
   *
   * The parser counts from the first line of the block it was handed, and the
   * block starts one line after the opening `---`. Verified against the real
   * `sqtq` failure: the parser said line 7, `beans` said line 8, and line 8 of
   * the file is where the `\1` was. Reporting the parser's number would send a
   * reader to the wrong line of the file they are about to open.
   */
  readonly line: number | null;
  /** The loader's own first line of complaint. */
  readonly message: string;
  /** True for a `duplicate-key` already in {@link DUPLICATE_KEY_BASELINE}. */
  readonly baselined: boolean;
}

export interface FrontMatterReport {
  /** `null` when there is no store at all — not the same as an empty one. */
  readonly beans: number | null;
  readonly defects: FrontMatterDefect[];
  /** Baseline ids that matched nothing — repaired, so the entry should go. */
  readonly staleBaseline: string[];
  /**
   * WHICH absence, when {@link beans} is `null`.
   *
   * `absent` is an instance that legitimately has no bean store and is a pass;
   * `declared-but-absent` is one whose declaration names a directory that is
   * not there, which is `dh4f` and is not. Both were `null` until `t6s7`, and
   * both printed *"no store in this repository, nothing to check"*, exit 0.
   */
  readonly storeState: BeanStore["state"];
  /**
   * Every `.md` the reader could not fence, INCLUDING the expected ones.
   *
   * Carried rather than filtered so the reconciliation below can account for
   * each file exactly once. A `README.md` is `expected` and not a defect; it
   * still has to be somewhere in the arithmetic.
   */
  readonly skipped: SkippedFile[];
  /** Every `.md` in the directory — `beans + skipped` must equal it. */
  readonly filesSeen: number;
}

/**
 * Does every `.md` in the directory appear exactly once in the report?
 *
 * Returns `null` when it does, and the complaint when it does not. A FUNCTION
 * rather than an inline comparison because the read path cannot currently
 * produce a mismatch — every file goes into `beans` or `skipped` — so the only
 * way to feed this guard the condition it exists for is to hand it the numbers
 * directly. A guard whose failing branch has never been executed is the thing
 * bean `t6s7` is about.
 *
 * What it actually protects: a future `continue` in `readBeanStore`'s loop
 * that forgets to record what it dropped. `filesSeen` is counted by a separate
 * traversal, so such an edit makes the two disagree instead of silently
 * undercounting — which is precisely how a bean went missing from every check
 * while the total held steady.
 */
export function reconcile(beans: number, skipped: number, filesSeen: number): string | null {
  const accounted = beans + skipped;
  if (accounted === filesSeen) return null;
  return (
    `${filesSeen} .md file(s) in the store, but ${beans} bean(s) + ${skipped} skipped = ` +
    `${accounted}. A file is unaccounted for, so every count in this report is unreliable`
  );
}

/** `linePos` is the `yaml` package's; every field is optional in its types. */
function lineOf(err: unknown): number | null {
  const pos = (err as { linePos?: { line?: number }[] } | null)?.linePos;
  const line = Array.isArray(pos) ? pos[0]?.line : undefined;
  // +1 for the opening `---`, which is not part of the parsed block.
  return typeof line === "number" ? line + 1 : null;
}

function firstLine(err: unknown): string {
  return (err instanceof Error ? err.message : String(err)).split("\n")[0]!;
}

export function checkBeanFrontMatter(root: string): FrontMatterReport {
  const store = readBeanStore(root);
  if (store.state !== "read") {
    return {
      beans: null,
      defects: [],
      staleBaseline: [],
      storeState: store.state,
      skipped: [],
      filesSeen: 0,
    };
  }
  const files = store.beans;

  const defects: FrontMatterDefect[] = [];
  // FIRST, because a file the reader could not fence never reaches the loop
  // below — that is the defect, not an ordering preference. `id` is the
  // filename stem, which is exactly what `beans` falls back to when the front
  // matter yields nothing, so the gate names the row a person will see.
  for (const sk of store.skipped) {
    if (sk.expected) continue;
    defects.push({
      kind: "unfenced",
      id: sk.file.replace(/\.md$/, ""),
      file: sk.archived ? join("archive", sk.file) : sk.file,
      line: null,
      message:
        "no parseable `---` front-matter fences, so every check here skips the " +
        "file while `beans` loads it as a titleless ghost row",
      baselined: false,
    });
  }
  const seen = new Set<string>();
  for (const b of files) {
    try {
      parseYaml(b.frontMatter);
      continue;
    } catch (strict) {
      // The discriminator: would the loader `beans` itself uses accept this?
      // `uniqueKeys: false` is that loader's tolerance for a repeated key, and
      // nothing else — genuinely broken YAML still throws.
      try {
        parseYaml(b.frontMatter, { uniqueKeys: false });
        seen.add(b.id);
        defects.push({
          kind: "duplicate-key",
          id: b.id,
          file: b.file,
          line: lineOf(strict),
          message: firstLine(strict),
          baselined: DUPLICATE_KEY_BASELINE.has(b.id),
        });
      } catch (tolerant) {
        defects.push({
          kind: "unparseable",
          id: b.id,
          file: b.file,
          line: lineOf(tolerant),
          message: firstLine(tolerant),
          baselined: false,
        });
      }
    }
  }

  const staleBaseline = [...DUPLICATE_KEY_BASELINE].filter((id) => !seen.has(id)).sort();
  return {
    beans: files.length,
    defects,
    staleBaseline,
    storeState: store.state,
    skipped: store.skipped,
    filesSeen: store.filesSeen,
  };
}

function main(): void {
  // ANCHORED ON THIS MODULE, never on the CWD — `check-bean-bodies` does the
  // same and the reason is `a6kl`. Written as `repoRootFor(process.cwd())`
  // first, it answered `/home/user`, found no store, and exited 0 with "no
  // store in this repository" over a repository holding 198 beans. A gate
  // that reports clean because it looked in the wrong place is the `dh4f`
  // defect, and this one would have shipped wearing its own fix's clothes.
  const root = repoRootFor(resolve(import.meta.dir, ".."));
  let report: FrontMatterReport;
  try {
    report = checkBeanFrontMatter(root);
  } catch (err) {
    // COULD NOT CHECK is its own exit, never a pass. An unreadable store is
    // exactly the condition this gate exists for, so reporting it as clean
    // would be the defect wearing the fix's clothes.
    console.error(`::error::check-bean-front-matter: could not read the store — ${String(err)}`);
    process.exit(2);
  }

  // TWO ABSENCES, TWO EXITS. Bean `t6s7`: these were one branch, and the
  // fallback in `resolveBeanDefs` hands back a plausible `beans/defs` for a
  // repository that never mentioned one — so a folio whose store had been
  // moved or deleted reported exactly like a folio that never had one, as
  // `nothing to check`, exit 0.
  if (report.storeState === "declared-but-absent") {
    console.error(
      `::error::check-bean-front-matter: the bean graph declares ${beanDefsDir(root) ?? "(unresolved)"} ` +
        "and it is not there. NOT a pass — nothing scanned it, so nothing here was checked",
    );
    process.exit(2);
  }
  if (report.beans === null) {
    console.log("Bean front matter — no store in this repository, nothing to check");
    process.exit(0);
  }

  // ZERO BEANS IS A FINDING. A store that exists and yields nothing makes the
  // count below vacuous, and a vacuous pass reads exactly like a real one
  // (`6tkl`). `readBeanFiles` skips a file with no front matter, so an empty
  // result over a non-empty directory means every file failed to look like a
  // bean — which is worse than one that fails to parse.
  if (report.beans === 0) {
    console.error(
      `::error::check-bean-front-matter: the store at ${beanDefsDir(root) ?? "(unresolved)"} ` +
        "yielded no beans — every count here would be vacuous",
    );
    process.exit(1);
  }

  console.log(`Bean front matter (${report.beans} bean(s), including the archive)`);

  // RECONCILE, rather than print. Every `.md` in the directory is a bean or a
  // skipped file, and if that arithmetic does not close then a file went
  // somewhere this report cannot see — which is `t6s7`'s defect returning by
  // another route. Checked rather than assumed, because the whole finding was
  // that a count can stay perfectly steady while a file disappears.
  const mismatch = reconcile(report.beans, report.skipped.length, report.filesSeen);
  if (mismatch !== null) {
    console.error(`::error::check-bean-front-matter: ${mismatch}`);
    process.exit(2);
  }

  const unfenced = report.defects.filter((d) => d.kind === "unfenced");
  const expected = report.skipped.filter((sk) => sk.expected);
  const unparseable = report.defects.filter((d) => d.kind === "unparseable");
  const newDuplicates = report.defects.filter((d) => d.kind === "duplicate-key" && !d.baselined);
  const outstanding = report.defects.filter((d) => d.kind === "duplicate-key" && d.baselined);

  const at = (d: FrontMatterDefect): string => (d.line === null ? "" : `:${d.line}`);

  if (unparseable.length === 0 && newDuplicates.length === 0 && unfenced.length === 0) {
    console.log(
      "  ✓ no NEW defect — every bean's front matter loads, so `beans list`, `roadmap` " +
        "and `prime` can read the store",
    );
  }

  for (const d of unfenced) {
    console.error(`  ✗ ${d.file} [${d.id}] UNFENCED: ${d.message}`);
  }
  for (const sk of expected) {
    console.log(`  · ${sk.file} is not a bean and is not expected to be (NOT_BEANS)`);
  }
  for (const d of unparseable) {
    console.error(`  ✗ ${d.file}${at(d)} [${d.id}] UNPARSEABLE: ${d.message}`);
  }
  for (const d of newDuplicates) {
    console.error(`  ✗ ${d.file}${at(d)} [${d.id}] duplicate key: ${d.message}`);
  }
  for (const d of outstanding) {
    console.log(`  · outstanding ${d.id} [duplicate-key]: ${d.message} — ${d.file}${at(d)}`);
  }
  for (const id of report.staleBaseline) {
    console.log(
      `  · baseline entry ${id} no longer matches — repaired; remove it from ` +
        "DUPLICATE_KEY_BASELINE in this file",
    );
  }

  if (unfenced.length > 0) {
    console.error(
      `\n${unfenced.length} file(s) in the bean directory carry no parseable \`---\` fences. ` +
        "This is the QUIET half of `t7ao`: the store still loads, so nothing announces it, " +
        "and every check here skips the file — while `beans` loads it as a row with the id " +
        "taken from the FILENAME, status `?` and NO TITLE. Restore the fences, or add the " +
        "name to NOT_BEANS in bean-store-read.ts if it is genuinely not a bean.",
    );
  }
  if (unparseable.length > 0) {
    console.error(
      `\n${unparseable.length} bean(s) NO loader will read. \`beans\` loads the store as a ` +
        "unit, so until this is fixed `list`, `roadmap` and `prime` return NOTHING for " +
        "every reader — including the cold start named in the first line of AGENTS.md.",
    );
  }
  if (newDuplicates.length > 0) {
    console.error(
      `\n${newDuplicates.length} bean(s) give a key twice. The store still loads, but the ` +
        "file says two things and which one wins is the reader's parser. Fix the file, or " +
        "add its id to DUPLICATE_KEY_BASELINE with the reason.",
    );
  }
  if (outstanding.length > 0) {
    console.log(
      "\n  Outstanding duplicates are repaired by the bean's OWNER, not by this check and " +
        "not by whoever ran it — repairing one means choosing which value was meant.",
    );
  }

  process.exit(unparseable.length > 0 || newDuplicates.length > 0 || unfenced.length > 0 ? 1 : 0);
}

if (import.meta.main) main();
