#!/usr/bin/env bun
/**
 * No library section carries a soft hyphen (U+00AD). Bean `3spu`.
 *
 * @covers library
 *
 * A soft hyphen is a line-break hint the PDF text layer kept, and in section
 * text it splits one word into two fragments for every reader: a corpus grep
 * for "recommendations" missed the WHO guideline Handbook's 742 of them, and
 * the LSI index counted "recommenda" and "tions" as terms. Both PDF rungs now
 * join them at ingestion (`scripts/_pdf_text.py`); this is the gate that says
 * none came back — from a new rung, a re-ingest by an old checkout, or a hand
 * edit.
 *
 * ## What it deliberately does not scan
 *
 * `vector-labels.json`. There a soft hyphen ends a POSITIONED label — the
 * word's other half is a separate label with its own box — so joining needs the
 * figure's geometry, not a text rule. Three such labels exist (smart-base),
 * and they are the vector arm's business, not this gate's.
 *
 *   bun run check:soft-hyphens
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { declaredGraphs, instanceRootsIn } from "../schemas/cat-harness";

const REPO = resolve(import.meta.dir, "../..");

export function sectionsWithSoftHyphens(): Array<{ file: string; count: number }> {
  const seen = new Set<string>();
  const out: Array<{ file: string; count: number }> = [];
  for (const root of instanceRootsIn(REPO)) {
    for (const g of declaredGraphs(root)) {
      if (!g.absPath || !g.graphKinds.includes("library") || seen.has(g.absPath) || !existsSync(g.absPath)) continue;
      seen.add(g.absPath);
      for (const doc of readdirSync(g.absPath, { withFileTypes: true })) {
        const sec = join(g.absPath, doc.name, "sections");
        if (!doc.isDirectory() || !existsSync(sec)) continue;
        for (const f of readdirSync(sec)) {
          if (!f.endsWith(".md")) continue;
          const p = join(sec, f);
          const count = (readFileSync(p, "utf8").match(/­/g) ?? []).length;
          if (count) out.push({ file: relative(REPO, p), count });
        }
      }
    }
  }
  return out.sort((a, b) => a.file.localeCompare(b.file));
}

if (import.meta.main) {
  const hits = sectionsWithSoftHyphens();
  if (hits.length === 0) {
    console.log("✓ no library section carries a soft hyphen (U+00AD)");
    process.exit(0);
  }
  const total = hits.reduce((n, h) => n + h.count, 0);
  for (const h of hits.slice(0, 20)) console.log(`  ✗ ${h.file}  ${h.count}`);
  if (hits.length > 20) console.log(`  … and ${hits.length - 20} more`);
  console.log(
    `\n${total} soft hyphen(s) in ${hits.length} section(s). Re-ingest with the current rungs (they join them), ` +
      "or apply scripts/_pdf_text.py's join_soft_hyphens to the section text and update structure.json's n_chars/n_words.",
  );
  process.exit(1);
}
