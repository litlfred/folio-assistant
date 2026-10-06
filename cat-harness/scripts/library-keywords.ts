/**
 * library-keywords — keywords for every section and every document of every
 * declared library, from the LSI term weights. Issue #2302.
 *
 * Owner, 2026-10-06: *"is there keyword extraction for sections, document?
 * that should be part of process... maybe use lsi skills?"* There was none,
 * though the LSI index already weighted every term of every library section
 * (log-entropy: frequent here, rare across the corpus) and then discarded the
 * per-section view. This keeps it.
 *
 * Per library root, the units are exactly the LSI tool's (`unitsOf` in
 * `scripts/lsi.ts`: one per `sections/*.md`, specimen pages excluded), and the
 * matrix is `buildTermMatrix` — one vocabulary, one weighting, shared with
 * the index. Per entry it writes `library/<slug>/keywords.json`
 * (`folio-keywords/v1`):
 *
 * - `document` — up to 12, pooled over the entry's sections;
 * - `sections.<id>` — up to 8 per section (none for a section under the LSI
 *   tool's minimum length, which the index does not take either);
 * - `evidence` on each keyword: `heading` when every word of it appears in a
 *   heading the extraction found — the section's own title for a section
 *   keyword, any TOC title or figure caption for a document keyword. A
 *   keyword a heading also names is the document saying it of itself.
 *
 * Derived and deterministic: re-running on an unchanged library writes
 * nothing. `--check` reports a missing or stale file and exits 1.
 *
 * Usage: bun run library:keywords [--check]
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { buildTermMatrix, keywordsOf, tokenize, type Keyword } from "../content/pipeline/lsi.ts";
import { readLibraryGraph } from "./library-graph.ts";
import { unitsOf } from "./lsi.ts";

const ROOT = resolve(import.meta.dir, "../..");
export const DOC_TOP = 12;
export const SECTION_TOP = 8;

export interface ScoredKeyword extends Keyword {
  evidence: string[];
}

export interface KeywordsFile {
  $schema: "folio-keywords/v1";
  entry: string;
  corpus: { library: string; sections: number; terms: number; weighting: string };
  document: ScoredKeyword[];
  sections: Record<string, ScoredKeyword[]>;
}

/** Does every word of `term` appear among the tokens of `text`? */
export function namedBy(term: string, text: string): boolean {
  const toks = new Set(tokenize(text));
  return term.split(" ").every((w) => toks.has(w));
}

function withEvidence(ks: Keyword[], headings: string[]): ScoredKeyword[] {
  return ks.map((k) => ({ ...k, evidence: headings.some((h) => namedBy(k.term, h)) ? ["heading"] : [] }));
}

/** keywords.json for every entry under one library root. */
export function libraryKeywords(libRoot: string, repoRoot = ROOT): Map<string, KeywordsFile> {
  const units = unitsOf(libRoot, ["library"]);
  const out = new Map<string, KeywordsFile>();
  if (units.length < 3) return out;
  const m = buildTermMatrix(units);
  const libRel = relative(repoRoot, libRoot);
  // Column indices per entry, and per section id.
  const bySlug = new Map<string, { cols: number[]; sections: Map<string, number> }>();
  units.forEach((u, j) => {
    const rel = relative(libRel, u.id).split("/");      // <slug>/sections/<id>.md
    const slug = rel[0];
    const sid = rel[rel.length - 1].replace(/\.md$/, "");
    const e = bySlug.get(slug) ?? { cols: [] as number[], sections: new Map<string, number>() };
    e.cols.push(j);
    e.sections.set(sid, j);
    bySlug.set(slug, e);
  });
  for (const [slug, e] of bySlug) {
    const structure = (() => {
      try {
        return JSON.parse(readFileSync(join(libRoot, slug, "structure.json"), "utf8"));
      } catch {
        return undefined;
      }
    })();
    const titleOf = new Map<string, string>(
      (structure?.sections ?? []).map((s: { id: string; title: string }) => [s.id, s.title]),
    );
    const docHeadings: string[] = [
      ...(structure?.toc ?? []).map((t: { title: string }) => t.title),
      ...(structure?.figures ?? []).map((f: { title: string }) => f.title),
    ];
    const sections: Record<string, ScoredKeyword[]> = {};
    for (const [sid, j] of [...e.sections].sort(([a], [b]) => a.localeCompare(b))) {
      const own = titleOf.has(sid) ? [titleOf.get(sid)!] : [];
      const ks = keywordsOf(m, [j], [units[j].text], SECTION_TOP, own);
      sections[sid] = withEvidence(ks, own);
    }
    const docKs = keywordsOf(m, e.cols, e.cols.map((j) => units[j].text), DOC_TOP);
    out.set(slug, {
      $schema: "folio-keywords/v1",
      entry: slug,
      corpus: { library: libRel, sections: units.length, terms: m.terms.length, weighting: m.weighting },
      document: withEvidence(docKs, docHeadings),
      sections,
    });
  }
  return out;
}

if (import.meta.main) {
  const check = process.argv.includes("--check");
  // Discovery starts from the cat-harness declaration, as gen-library-viz does.
  const g = readLibraryGraph([join(ROOT, "cat-harness"), ROOT], ROOT);
  const roots = new Set((g?.entries ?? []).map((e) => dirname(join(ROOT, e.dir))));
  let stale = 0;
  let written = 0;
  let entries = 0;
  for (const root of [...roots].sort()) {
    for (const [slug, kf] of libraryKeywords(root)) {
      entries++;
      const path = join(root, slug, "keywords.json");
      const text = JSON.stringify(kf, null, 2) + "\n";
      const same = existsSync(path) && readFileSync(path, "utf8") === text;
      if (same) continue;
      if (check) {
        console.error(`  ✗ ${relative(ROOT, path)} ${existsSync(path) ? "is stale" : "is missing"}`);
        stale++;
      } else {
        writeFileSync(path, text);
        written++;
      }
    }
  }
  if (check) {
    console.log(stale ? `${stale} keywords.json file(s) stale — run \`bun run library:keywords\`` : `${entries} keywords.json file(s) current`);
    process.exit(stale ? 1 : 0);
  }
  console.log(`${entries} entr(ies) over ${roots.size} librar(ies); wrote ${written}.`);
}
