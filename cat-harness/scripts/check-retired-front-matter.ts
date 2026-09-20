/**
 * A front-matter key that was RETIRED must not come back.
 *
 * ## Why this check and not a schema
 *
 * The keys below were not wrong in shape — they parsed fine, validated fine,
 * and were consumed by nothing. That is the defect class this repository
 * keeps paying for: **declared but read by nothing**. A schema cannot catch
 * it, because a schema's job is to say what a valid value looks like and
 * every one of these carried valid values. `roles:` carried 325 of them.
 *
 * Nor can the removal defend itself. 140 files lost `roles:` on 2026-09-20,
 * and the corpus that taught every agent here to write it is the corpus in
 * front of them: copy an adjacent skill's front matter and the field is back.
 * That is how it reached 140 files in the first place — six arrived in the
 * qou migration and the rest is copy-paste, never a decision.
 *
 * ## What the registry buys over a grep
 *
 * The error names the **record**, not the rule. Somebody re-adding `roles:`
 * is usually right that a skill should say who performs it; they are wrong
 * about the field. Pointing them at `fsh-guts/retired/…` hands them the
 * census, the archaeology and the two questions the removal deliberately did
 * not answer, which is the difference between "don't" and "here is what was
 * tried".
 *
 * Adding the next retirement is one entry, and the entry is refused without
 * a record to point at — see {@link RETIRED}.
 *
 * @module scripts/check-retired-front-matter
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, relative, join } from "node:path";

import { Glob } from "bun";

import { parseFrontMatter } from "../schemas/front-matter.ts";
import { directoryForGraph, repoRootFor } from "../schemas/cat-harness.ts";
import { kgRoots } from "./known-skills.ts";

const INSTANCE = resolve(import.meta.dir, "..");
const REPO = repoRootFor(INSTANCE);

interface Retired {
  /** The front-matter key that must not reappear. */
  key: string;
  /** Where the files carrying it lived, for the message. */
  scope: string;
  /**
   * `$schema` tags this retirement does NOT apply to.
   *
   * A key is retired **for a graph kind**, not for the word. `roles:` was
   * inert in skill markdown and is a LIVE axis in `folio-memory/v1` entries,
   * where `memoryForRoles` filters on `tags.roles` — the same seven letters,
   * a different field, a real reader.
   *
   * This exemption is not a caveat added for tidiness. The first pass of
   * `qif9` excised the key from all 140 files carrying it, the 26 memory
   * entries included, and `agent-memory.test.ts` caught it: the CI lane
   * stopped seeing more entries than another lane, because every entry had
   * become untagged and therefore visible to everyone. Sharing a key name
   * across graph kinds is not sharing a field.
   */
  exceptSchemas?: string[];
  /**
   * The fsh-guts record holding the full inventory, relative to the
   * `fsh-guts` directory the instance DECLARES.
   *
   * Relative rather than repo-relative because `fsh-guts/` is declared, not
   * conventional: `directoryForGraph(…, "fsh-guts")` is what resolves it,
   * and writing the prefix here would be a second answer to where the
   * trashcan is — free to disagree with the declaration the moment it moves.
   *
   * REQUIRED, and checked to exist on every run. A retirement whose record
   * has gone is a rule with no reasons — exactly the state that makes the
   * next agent re-add the field, since all they can see is a refusal.
   */
  record: string;
  /** One line on why, so the message stands without opening the record. */
  because: string;
}

/** Every retired key. One entry per retirement; none may be added without a record. */
export const RETIRED: Retired[] = [
  {
    key: "roles",
    scope: "skill and memory markdown",
    record: "retired/skill-roles-front-matter.md",
    exceptSchemas: ["folio-memory/v1"],
    because:
      "325 annotations across 140 files, read by nothing (0 of 180 Skill nodes in the " +
      "exported graph carried it) and dangling from its first commit — it pointed at " +
      "actor ids `reader`/`collaborator`/`owner` that have never existed in any commit. " +
      "If a skill should declare who performs it, that is bean `y1w9`, and the field it " +
      "needs has to be declared before it is written. NOTE the exemption: in a " +
      "`folio-memory/v1` entry `roles:` is a live axis, not this field.",
  },
];

/**
 * Where to sweep — READ from the declaration, never listed here.
 *
 * A hand-kept list is the failure `known-skills.ts` was extracted to remove:
 * its own header calls such a list "a copy that happens to match today", and
 * the copy it replaced had already stopped matching — two skill packages
 * were invisible to the stakeholder map for exactly that reason. A sweep
 * blind to a directory reports a clean run over files it never opened,
 * which is worse here than not running at all.
 *
 * **The graph ROOTS, not `skillMdDirs`.** `skillMdDirs` enumerates skill
 * PACKAGES, and `skills/memory/` is not one — the first version of this
 * function used it and never opened the 26 memory entries, which is the one
 * directory the `roles` exemption exists for. Sweeping the roots recursively
 * covers every package and everything else the graph holds.
 *
 * `.claude/skills/` is looked for under the instance AND the repository
 * root. It is a local convention rather than a declared graph, and since
 * #437 it lives beside the instance rather than inside it — checking one
 * place would silently skip it, which is how `language-trap-agent-audit.md`
 * would have gone unswept.
 *
 * Absolute paths, because the declared graph directories are not all under
 * the instance: `fsh-guts/` and `beans/` are `scope: "repository"`.
 */
function sweepRoots(instance: string, repo: string): string[] {
  const dirs = [...kgRoots(instance)];
  for (const graph of ["beans", "fsh-guts"] as const) {
    const d = directoryForGraph(instance, graph);
    if (d) dirs.push(d);
  }
  for (const base of new Set([instance, repo])) dirs.push(join(base, ".claude", "skills"));
  return [...new Set(dirs)].filter((d) => existsSync(d));
}

/** A finding: one file carrying one retired key. */
export interface Finding {
  file: string;
  entry: Retired;
}

export function scan(
  instance = INSTANCE,
  repo = repoRootFor(instance),
): { findings: Finding[]; scanned: number; missingRecords: Retired[]; roots: string[] } {
  const guts = directoryForGraph(instance, "fsh-guts");
  // No declared trashcan means the records are UNREACHABLE, not absent. Both
  // report here, because a rule whose reasons cannot be located is in the
  // same state either way from the reader's side.
  const missingRecords = RETIRED.filter(
    (r) => guts === undefined || !existsSync(join(guts, r.record)),
  );
  const findings: Finding[] = [];
  const roots = sweepRoots(instance, repo);
  let scanned = 0;
  for (const dir of roots) {
    for (const rel of new Glob("**/*.md").scanSync(dir)) {
      const abs = resolve(dir, rel);
      // The fsh-guts record QUOTES the field it retires, in prose and in a
      // code fence. Reading only the parsed front matter is what keeps the
      // record from tripping the check it exists to explain.
      const { fm } = parseFrontMatter(readFileSync(abs, "utf-8"));
      scanned += 1;
      const declaredAs = typeof fm.$schema === "string" ? fm.$schema : undefined;
      for (const entry of RETIRED) {
        if (!Object.hasOwn(fm, entry.key)) continue;
        // A file DECLARES what it is; the exemption is matched on that and
        // never on its directory. Location is a coincidence of the current
        // layout — the declaration is the contract (#263).
        if (declaredAs !== undefined && entry.exceptSchemas?.includes(declaredAs)) continue;
        findings.push({ file: relative(repo, abs), entry });
      }
    }
  }
  return { findings, scanned, missingRecords, roots };
}

function main(): void {
  const { findings, scanned, missingRecords, roots } = scan();

  // A vacuity guard. `scanned === 0` means the declaration resolved to
  // nothing readable, and reporting "no retired keys" over an empty sweep is
  // the could-not-determine-rendered-as-clean failure this repository names
  // as its own.
  if (scanned === 0) {
    console.error(`✗ scanned 0 markdown files across ${roots.length} declared root(s).`);
    console.error("  This is NOT a pass: nothing was checked.");
    process.exit(1);
  }

  for (const r of missingRecords) {
    console.error(`✗ retired key \`${r.key}\` names a record that is not there: ${r.record}`);
    console.error("  A retirement with no record is a refusal with no reasons.");
  }

  for (const f of findings) {
    console.error(`✗ ${f.file}`);
    console.error(`    carries \`${f.entry.key}:\`, retired from ${f.entry.scope}.`);
    console.error(`    ${f.entry.because}`);
    console.error(
      `    The full record, with every value it ever held: ` +
        `${relative(REPO, join(directoryForGraph(INSTANCE, "fsh-guts") ?? "", f.entry.record))}`,
    );
  }

  if (findings.length > 0 || missingRecords.length > 0) process.exit(1);
  console.log(
    `✓ ${scanned} markdown file(s) across ${roots.length} declared root(s); none carries a ` +
      `retired front-matter key (${RETIRED.map((r) => `\`${r.key}\``).join(", ")}).`,
  );
}

if (import.meta.main) main();
