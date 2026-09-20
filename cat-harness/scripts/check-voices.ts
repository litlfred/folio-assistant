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
import { explainFailure, resolveLibraryRef } from "../../folio-assistant-core/schemas/library-ref.js";
import { join, resolve } from "node:path";

import { loadVoices, unionRules, voicesPresent } from "../schemas/voices";

const ROOT = resolve(import.meta.dir, "..");
/** The checkout, one level out: a cross-instance citation is resolved against sibling instances. */
const REPO_ROOT = resolve(ROOT, "..");

// No `LIBRARY` constant any more, and that is the change rather than a tidy-up.
// This module composed `join(LIBRARY, libraryId, "sections", …)` against the
// VOICE'S OWN instance root, which made a cross-instance citation
// unrepresentable — the blocker on moving the three WHO voices out (beans
// `z7ev`, `w095`), predicted by bean `r1lz` the day before the move was
// decided. `resolveLibraryRef` reads the target instance's own declaration, so
// where a corpus lives is answered once, by the instance that owns it.
const MIN_QUOTE = 24;

/**
 * Resolve a citation, in this instance or another.
 *
 * Delegates to `folio-assist-core`'s `resolveLibraryRef` rather than composing
 * a path. Composing one is what this file did until 2026-09-20 — `join(LIBRARY,
 * …)` against the VOICE'S OWN instance root — which made a cross-instance
 * citation unrepresentable and was the blocker on moving the three WHO voices
 * out (beans `z7ev`, `w095`). Bean `r1lz` predicted it the day before the move
 * was decided.
 *
 * The resolver's four failure kinds are reported as they come back, unmerged:
 * "that instance is not in this checkout", "that instance holds no corpus",
 * "that document was never ingested" and "that section is missing" need four
 * different fixes, and collapsing them sends a reader to the wrong one.
 */
function resolveCitation(
  src: { instance?: string; libraryId: string; sectionId?: string },
): { ok: true; path: string } | { ok: false; why: string } {
  const r = resolveLibraryRef(src, ROOT, REPO_ROOT);
  return r.ok ? { ok: true, path: r.path } : { ok: false, why: explainFailure(r.failure) };
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

  /**
   * Which instance holds each declared source, from the VOICE that declares
   * it — so a rule citing that source need not repeat the answer.
   *
   * A voice's `sources[]` is where it says what it was derived from. A rule's
   * `source` says which of those, and where in it. Making every rule restate
   * the instance would put one fact in two places and let them disagree: a
   * voice pointing at `who-iris` with a rule pointing at `folio-assist-sci` is
   * representable, meaningless, and nothing would catch it.
   *
   * This became load-bearing with bean `frs5`, which moved the corpus out of
   * the platform. Before it every citation resolved locally and the instance
   * was never written down at all; after it, the four voices in `cat-harness/`
   * cite documents in two other instances across dozens of rules.
   *
   * Keyed per VOICE, not globally: two voices may legitimately derive
   * same-named documents from different instances, and a global map would
   * silently pick one.
   */
  const instanceOfSource = new Map<string, Map<string, string>>();
  for (const v of voices) {
    const m = new Map<string, string>();
    for (const srcDecl of v.sources) {
      if (srcDecl.libraryId && srcDecl.instance) m.set(srcDecl.libraryId, srcDecl.instance);
    }
    instanceOfSource.set(v.id, m);
  }

  for (const { voice, rule } of rules) {
    const src = rule.source;
    const where = `${voice}/${rule.id}`;
    // An explicit `instance` on the rule always wins: inheritance is a default,
    // not an override, so a rule citing a document its voice does not declare
    // can still say where it is.
    const citedInstance =
      src.instance ??
      (src.libraryId ? instanceOfSource.get(voice)?.get(src.libraryId) : undefined);
    if (src.quote.trim().length < MIN_QUOTE) {
      problems.push(`${where}: quote is ${src.quote.trim().length} chars — a citation that short cannot be checked`);
    }
    if (src.libraryId && src.sectionId) {
      // The resolver's own explanation is used verbatim: it distinguishes four
      // failures this check cannot, and restating them here would make a fifth
      // wording of the same facts, free to drift from the four.
      const res = resolveCitation({
        instance: citedInstance,
        libraryId: src.libraryId,
        sectionId: src.sectionId,
      });
      if (!res.ok) {
        const from = citedInstance ? `${citedInstance}:` : "";
        problems.push(`${where}: cites ${from}${src.libraryId}/${src.sectionId} — ${res.why}`);
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
      if (s.libraryId) {
        // Document-level: no sectionId, so the resolver checks `structure.json`
        // — "was this ingested at all", which is a different question from
        // "does this section exist" and gets its own finding.
        const res = resolveCitation({ instance: s.instance, libraryId: s.libraryId });
        if (!res.ok) problems.push(`${v.id}: names source ${s.libraryId} — ${res.why}`);
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
