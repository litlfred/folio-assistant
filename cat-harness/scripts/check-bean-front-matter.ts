#!/usr/bin/env bun
/**
 * Every bean's front matter parses as YAML — the check `beans` cannot provide.
 *
 * Bean `t7ao`. Found by breaking it, not hypothetically.
 *
 * ## What happens without this
 *
 * `224e0beac8` committed a bean whose line 8 was a literal `\1` — an
 * unsubstituted sed backreference where `updated_at:` belonged. `bun run gates
 * --all` was run on that tree: **92 gates, all green.** It was pushed.
 *
 * The next `beans list` in a fresh shell:
 *
 * ```
 * Error: loading beans: loading .../folio-assistant-sqtq--*.md:
 * parsing front matter: yaml: line 8: could not find expected ':'
 * ```
 *
 * Not "that one bean is unreadable" — **no beans at all**. `list`, `roadmap`
 * and `prime` all fail identically, because the CLI loads the store as a unit.
 * `beans prime` is the first command in this repo's cold start and the first
 * line of `AGENTS.md`, so one malformed file means every agent starting after
 * it gets no work plan, from the one command whose whole job is to hand them
 * one.
 *
 * Reproduced 2026-09-21 before writing this: one planted bean with a literal
 * `\1` on line 7 took `beans list` down entirely, while `check:bean-bodies`
 * exited 0 with "✓ no NEW defect".
 *
 * ## Why the existing gate does not catch it
 *
 * `check-bean-bodies` reads titles, bodies, checklists and blockers, and it
 * does inspect front matter — `isFoldedTitle` is a front-matter SHAPE defect.
 * So the gap is not that front matter goes unexamined. It is that it is
 * examined BY REGEX, and a regex over a broken document does not notice the
 * document is broken: `scalar()` simply finds no match and returns empty,
 * which is indistinguishable from an absent optional key.
 *
 * That is `xom7` — a check that cannot fail is indistinguishable from one that
 * passes. The store was unreadable and the report said 92/92.
 *
 * ## The second gap, found while writing this
 *
 * `readBeanFiles` splits the `---` fences with a regex and, on no match,
 * `continue`s: *"A file with no front matter is not a bean; `beans check` owns
 * that."* That is right for a stray README and wrong for a bean whose fence was
 * mangled — the file vanishes from every consumer rather than being reported.
 * So this checks the FENCES too, and a `.md` in the bean directory that carries
 * no parseable front matter is a finding rather than a skip. The one exception
 * is spelled out in {@link IGNORED}: a file the store itself documents as not
 * being a bean.
 *
 * ## Three states, and the third fails
 *
 * `parses`, `does not parse`, and `could not be read`. The third exits 2 and
 * says it is not a pass, because "could not determine" is never rendered as
 * clean here — the whole defect above is one shape of that error.
 *
 *     bun run cat-harness/scripts/check-bean-front-matter.ts
 *
 * @module scripts/check-bean-front-matter
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { parseDocument } from "yaml";

import { repoRootFor } from "../schemas/cat-harness.js";
import { beanDefsDir } from "./bean-store-read.ts";

/**
 * Names in the bean directory that are deliberately not beans.
 *
 * Kept as an explicit list rather than a pattern: a pattern would quietly
 * absorb the next malformed file that happened to match it, which is the
 * failure this whole module exists for.
 */
const IGNORED = new Set(["README.md"]);

/** What one file turned out to be. `reason` is present unless it parsed. */
export interface FrontMatterResult {
  /** Path relative to the repository root, for a report a person can act on. */
  file: string;
  state: "parses" | "does-not-parse" | "duplicate-keys" | "could-not-read";
  /** Why, when it did not parse — carrying the parser's line where it has one. */
  reason?: string;
}

/**
 * Check every `.md` under `dir` (and its `archive/`, which the store reader
 * also walks).
 *
 * Takes a DIRECTORY rather than resolving one, so a test can point it at a
 * fixture holding a deliberately broken bean. A gate for this defect that has
 * never seen the defect is the defect.
 */
export function checkFrontMatter(dir: string): FrontMatterResult[] {
  const out: FrontMatterResult[] = [];
  const sources = [dir];
  const archive = join(dir, "archive");
  if (existsSync(archive)) sources.push(archive);

  for (const src of sources) {
    let names: string[];
    try {
      names = readdirSync(src).sort();
    } catch (e) {
      out.push({
        file: src,
        state: "could-not-read",
        reason: `could not list the directory: ${e instanceof Error ? e.message : e}`,
      });
      continue;
    }
    for (const name of names) {
      if (!name.endsWith(".md") || IGNORED.has(name)) continue;
      const full = join(src, name);
      let text: string;
      try {
        text = readFileSync(full, "utf-8");
      } catch (e) {
        out.push({
          file: full,
          state: "could-not-read",
          reason: e instanceof Error ? e.message : String(e),
        });
        continue;
      }

      // The same fence split `readBeanFiles` uses — deliberately, so this
      // gate's verdict is about the file THAT READER will see. A different
      // split here could pass a file the store then chokes on.
      const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text);
      if (!m) {
        out.push({
          file: full,
          state: "does-not-parse",
          reason:
            "no `---` front-matter fences. `readBeanFiles` SKIPS such a file " +
            "as 'not a bean', so it disappears from every consumer rather " +
            "than being reported",
        });
        continue;
      }

      // TWO PARSES, because there are two different defects and only one of
      // them takes the store down.
      //
      // Permissive first: this is the question `beans` asks, and its answer is
      // the fatal one. Measured 2026-09-21 — `beans list` loads this store
      // happily while two of its beans carry duplicate keys, so a gate that
      // failed on duplicates would be STRICTER THAN THE THING IT GUARDS and
      // would have gone red on day one over beans belonging to other people.
      // `uniqueKeys: false` EXPLICITLY. The library's default is `true`, so
      // omitting it reports duplicates as errors — the first attempt here did
      // exactly that and called two loadable beans unparseable.
      const doc = parseDocument(m[1]!, { uniqueKeys: false });
      if (doc.errors.length > 0) {
        const e = doc.errors[0]!;
        // `linePos` is 1-based within the FRONT MATTER, so +1 for the opening
        // fence puts it on the line a person opens the file to.
        const line = e.linePos?.[0]?.line;
        const where = line === undefined ? "" : ` (line ${line + 1})`;
        out.push({ file: full, state: "does-not-parse", reason: `${e.message}${where}` });
        continue;
      }

      // Then strictly, for a defect that is real but not fatal. A duplicate
      // key means the two readers of this store DISAGREE: `scalar()` in
      // `bean-store-read.ts` regexes out the FIRST match, YAML takes the LAST.
      // Measured on `1hvo`, whose two `title:` lines differ in their text — so
      // `check-bean-bodies` and `beans` show different titles for one bean.
      // Reported, never failed: these are pre-existing and belong to their
      // beans' owners, the same rule `check-bean-bodies` states for its own
      // outstanding findings.
      const strict = parseDocument(m[1]!, { uniqueKeys: true });
      if (strict.errors.length > 0) {
        const e = strict.errors[0]!;
        const line = e.linePos?.[0]?.line;
        const where = line === undefined ? "" : ` (line ${line + 1})`;
        out.push({
          file: full,
          state: "duplicate-keys",
          reason: `${e.message.split("\n")[0]}${where}`,
        });
        continue;
      }
      out.push({ file: full, state: "parses" });
    }
  }
  return out;
}

function main(): number {
  // From the SCRIPT's location, not the cwd. `repoRootFor(process.cwd())`
  // answered `/home/user` when this was run from the repository root, so
  // `beanDefsDir` resolved to `/home/user/beans/defs`, which does not exist —
  // and the first draft of this file reported "nothing checked" and exited 0
  // over a store holding a deliberately planted broken bean. The gate had the
  // exact defect it exists to detect. `check-bean-bodies` already resolves it
  // this way; copying that was the fix.
  const root = repoRootFor(resolve(import.meta.dir, ".."));
  const dir = beanDefsDir(root);

  if (dir === null) {
    // NOT DECLARED is a determined answer: an instance may legitimately carry
    // no bean store, and there is nothing here to check.
    console.log("  · no bean-defs directory is declared here — nothing to check");
    return 0;
  }
  if (!existsSync(dir)) {
    // DECLARED BUT ABSENT is the `dh4f` defect and a different answer
    // entirely: a consumer scans nothing and reports a clean run over it.
    // Collapsing this into the branch above is what the first draft did.
    console.error(`\n✗ the bean-defs directory is declared at ${relative(root, dir)} and is not there`);
    console.error("  This is NOT a pass. A declared-but-absent directory is scanned by nothing.");
    return 2;
  }

  const results = checkFrontMatter(dir);
  const bad = results.filter((r) => r.state === "does-not-parse");
  const dupes = results.filter((r) => r.state === "duplicate-keys");
  const unknown = results.filter((r) => r.state === "could-not-read");
  const ok = results.length - bad.length - unknown.length;

  if (unknown.length > 0) {
    console.error(`\n✗ ${unknown.length} file(s) could not be read:`);
    for (const r of unknown) console.error(`    ${relative(root, r.file)} — ${r.reason}`);
    console.error("\n  This is NOT a pass. Treat it as unknown.");
    return 2;
  }

  if (bad.length > 0) {
    console.error(`\n✗ ${bad.length} bean(s) whose front matter does not parse:`);
    for (const r of bad) console.error(`    ${relative(root, r.file)}\n      ${r.reason}`);
    console.error(
      "\n  ONE of these takes the WHOLE store down: `beans list`, `roadmap` and\n" +
        "  `prime` all load it as a unit, so every agent starting after this is\n" +
        "  committed gets no work plan. Bean `t7ao`.",
    );
    return 1;
  }

  if (dupes.length > 0) {
    // Counted, not failed — and SAID, because a duplicate key makes the two
    // readers of this store disagree about a bean's value.
    console.log(`  ~ ${dupes.length} bean(s) carry a DUPLICATE KEY — counted, not failed:`);
    for (const r of dupes) console.log(`      ${relative(root, r.file)} — ${r.reason}`);
    console.log(
      "    The store still loads, so this is not `t7ao`'s defect. But `scalar()`\n" +
        "    takes the FIRST such key and YAML takes the LAST, so the regex reader\n" +
        "    and `beans` can show different values for one bean. Repaired by their\n" +
        "    owners, as `check-bean-bodies` says of its own outstanding findings.",
    );
  }
  console.log(`  ✓ ${ok} bean(s): every front matter parses as YAML`);
  return 0;
}

if (import.meta.main) {
  try {
    process.exit(main());
  } catch (e) {
    console.error(`Could not check bean front matter: ${e instanceof Error ? e.message : e}`);
    console.error("This is NOT a pass. Treat it as unknown.");
    process.exit(2);
  }
}
