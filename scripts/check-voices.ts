#!/usr/bin/env bun
/**
 * Validate the voice graph — and, above all, that every rule cites something.
 *
 * `loadVoices` already refuses a malformed profile, so this adds the checks a
 * Zod schema cannot make: that a cited `library/` section EXISTS on disk, that a
 * cited KG node exists, and that the quote is long enough to be a quote.
 *
 * The defect it exists to make impossible is PR #210's: three WHO voice profiles
 * with ten plausible rules each and `source: null`. Plausible is not right — its
 * first rule asserted `-ise/-isation` as WHO's spelling baseline, and the WHO
 * Editorial Style Manual says "`-ize` … is preferred" on page 14. Nothing in a
 * type system catches a confident invention; a resolvable citation does.
 *
 *     bun run check:voices
 *
 * @module scripts/check-voices
 */

import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

import { loadVoices, unionRules, voicesPresent } from "../schemas/voices";

const ROOT = resolve(import.meta.dir, "..");
const MIN_QUOTE = 24;

function sectionPath(libraryId: string, sectionId: string): string {
  return join(ROOT, "library", libraryId, "sections", `${sectionId}.md`);
}

function main(): number {
  if (!voicesPresent(ROOT)) {
    // Third state. A folio with no voice graph is legitimate; saying "0 problems"
    // over a directory that is not there would be a clean run across nothing.
    console.log("check:voices — this instance ships no voices/ directory. Nothing checked.");
    return 0;
  }

  const voices = loadVoices(ROOT);
  const rules = unionRules(voices);
  const problems: string[] = [];

  for (const { voice, rule } of rules) {
    const src = rule.source;
    const where = `${voice}/${rule.id}`;
    if (src.quote.trim().length < MIN_QUOTE) {
      problems.push(`${where}: quote is ${src.quote.trim().length} chars — a citation that short cannot be checked`);
    }
    if (src.libraryId && src.sectionId) {
      const p = sectionPath(src.libraryId, src.sectionId);
      if (!existsSync(p)) {
        problems.push(
          `${where}: cites library/${src.libraryId}/sections/${src.sectionId}.md, which does not exist. ` +
            `Every KG reference to a source resolves THROUGH library/ (library-is-l1.md).`,
        );
      }
    } else if (src.kgRef) {
      // A `#anchor` is a section within the file; check the file.
      const file = src.kgRef.split("#")[0]!;
      if (!existsSync(join(ROOT, file))) {
        problems.push(`${where}: cites kgRef ${file}, which does not exist in this instance`);
      }
    }
  }

  // Every declared source document must itself be ingested. A voice naming a
  // library id nobody ingested is the `source: null` defect wearing an id.
  for (const v of voices) {
    for (const s of v.sources) {
      if (s.libraryId && !existsSync(join(ROOT, "library", s.libraryId, "structure.json"))) {
        problems.push(`${v.id}: names source library/${s.libraryId}, which is not ingested`);
      }
      if (s.kgRef && !existsSync(join(ROOT, s.kgRef.split("#")[0]!))) {
        problems.push(`${v.id}: names source ${s.kgRef}, which does not exist`);
      }
    }
  }

  console.log(`Voice graph  (${voices.length} voices, ${rules.length} rules)\n`);
  for (const v of voices) {
    const mech = v.rules.filter((r) => r.patterns || r.terminology).length;
    const judged = v.rules.filter((r) => r.judgementOnly).length;
    console.log(
      `  ${v.id.padEnd(26)} ${String(v.rules.length).padStart(2)} rules  ` +
        `${String(mech).padStart(2)} with a mechanical half  ${String(judged).padStart(2)} judgement-only`,
    );
  }
  console.log();

  if (problems.length > 0) {
    console.error(`${problems.length} problem(s):`);
    for (const p of problems) console.error(`  ✗ ${p}`);
    return 1;
  }
  console.log("✓ every rule cites a source that resolves, with a quote long enough to check");
  return 0;
}

process.exit(main());
