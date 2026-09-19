#!/usr/bin/env bun
/**
 * Is a `library/<bib-slug>/` entry complete as L1 source content?
 *
 * Bean `pn6j`. **L1 source to L1 KG is not complete while a required derived
 * artefact is missing** — and without a gate, every derivation step is optional
 * in practice: the document lands in `library/`, reads as ingested, and the gap
 * is found by whoever next needs the missing artefact, long after the context
 * that would have made it cheap is gone.
 *
 * ## Three states, never two
 *
 * Each requirement is `met`, `unmet`, or **`not-derivable`** — and the third is
 * the reason this can ship now. `pn6j` asks for archive contents, technical
 * metadata, image descriptions, audio transcripts, tabular records and a
 * provenance stamp per narrative. Those are nine sibling beans in the INGEST
 * epic and **none of them is built**. A check that cannot run must not be
 * rendered as a pass, and must not be silently dropped either: it is reported
 * as its own state, naming the bean that would make it runnable.
 *
 * That is the same rule the rest of this repository keeps, and the reason bean
 * `dh4f` exists: a consumer that scans nothing and reports a clean run is worse
 * than one that says it could not look.
 *
 * ## What it does NOT do yet
 *
 * `pn6j`'s "Done when" also asks that a failure **open a bean and hold the
 * document in `uploads/`**. This reports; it does not act. Opening a bean
 * automatically would mint one per run against a store whose non-idempotent
 * `beans create` produced 14,688 duplicates once already, and moving somebody's
 * upload is a deletion-shaped act — `deletion-requires-confirmation` says an
 * agent reports what would move and waits. Both are deliberate gaps, recorded
 * on the bean rather than half-built.
 *
 * Usage:
 *   bun run check:l1-complete                 # every entry in library/
 *   bun run check:l1-complete library/<slug>  # one
 *   bun run check:l1-complete -- --json
 *   bun run check:l1-complete -- --write   # commit the verdict as a sidecar
 *
 * Exit: 0 complete (or nothing to check), 1 a requirement unmet, 2 could not check.
 *
 * @module scripts/check-l1-complete
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { directoryForGraph } from "../schemas/cat-harness.ts";
import { buildQaResult, writeQaResult } from "./qa-results.ts";

export type State = "met" | "unmet" | "not-derivable";

export interface Requirement {
  name: string;
  state: State;
  detail: string;
}

export interface EntryReport {
  slug: string;
  requirements: Requirement[];
}

/**
 * Requirements the four existing rungs can actually satisfy today. Anything
 * else belongs in the not-derivable list below, with the bean that would move
 * it here.
 */
function derivableRequirements(dir: string): Requirement[] {
  const out: Requirement[] = [];
  const has = (p: string) => existsSync(join(dir, p));

  const structPath = join(dir, "structure.json");
  if (!has("structure.json")) {
    out.push({ name: "structure", state: "unmet", detail: "no structure.json" });
  } else {
    let s: Record<string, unknown> | null = null;
    try {
      s = JSON.parse(readFileSync(structPath, "utf-8")) as Record<string, unknown>;
    } catch (e) {
      out.push({
        name: "structure",
        state: "unmet",
        detail: `structure.json will not parse: ${e instanceof Error ? e.message : e}`,
      });
    }
    if (s) {
      const secs = Array.isArray(s.sections) ? s.sections.length : 0;
      out.push({
        name: "structure",
        state: secs > 0 ? "met" : "unmet",
        detail: `${s._schema ?? "no $schema"}, toc_source=${s.toc_source}, ${secs} sections`,
      });
      // `structure_note` is where a rung says what it did NOT claim -- notably
      // that no chapter tree was inferred (bean 6xaz). Its absence is not a
      // failure; an empty structure with no note is, because nothing records
      // whether the emptiness was determined.
      if (secs === 0 && !s.structure_note) {
        out.push({
          name: "structure-note",
          state: "unmet",
          detail: "no sections and no structure_note — nothing says whether that was determined",
        });
      }
    }
  }

  for (const [name, rel] of [
    ["sections", "sections"],
    ["blocks", "blocks"],
  ] as const) {
    const n = has(rel) && statSync(join(dir, rel)).isDirectory() ? readdirSync(join(dir, rel)).length : -1;
    out.push({
      name,
      state: n > 0 ? "met" : "unmet",
      detail: n < 0 ? `no ${rel}/ directory` : `${n} files`,
    });
  }

  if (!has("manifest.jsonld")) {
    out.push({ name: "manifest", state: "unmet", detail: "no manifest.jsonld" });
  } else {
    try {
      const m = JSON.parse(readFileSync(join(dir, "manifest.jsonld"), "utf-8")) as Record<string, unknown>;
      const missing = ["@id", "@type", "contains"].filter((k) => !(k in m));
      out.push({
        name: "manifest",
        state: missing.length ? "unmet" : "met",
        detail: missing.length ? `missing ${missing.join(", ")}` : `${(m.contains as unknown[]).length} entries`,
      });
      out.push({
        name: "provenance",
        state: "provenance" in m ? "met" : "unmet",
        detail: "provenance" in m ? "recorded on the manifest" : "no `provenance` on the manifest",
      });
    } catch (e) {
      out.push({
        name: "manifest",
        state: "unmet",
        detail: `manifest.jsonld will not parse: ${e instanceof Error ? e.message : e}`,
      });
    }
  }
  return out;
}

/**
 * What `pn6j` asks for that nothing can produce yet. Each names the bean that
 * would move it into {@link derivableRequirements}, so this list shrinks by
 * work rather than by editing.
 */
export const NOT_DERIVABLE: ReadonlyArray<readonly [string, string]> = [
  ["archive-contents", "twqe"],
  ["technical-metadata", "nso8"],
  ["image-descriptions", "d5f1"],
  ["audio-transcripts", "1r0p"],
  ["tabular-records", "p67i"],
  ["narrative-provenance", "iqim"],
];

export function checkEntry(dir: string): EntryReport {
  return {
    slug: dir.split("/").filter(Boolean).pop() ?? dir,
    requirements: [
      ...derivableRequirements(dir),
      ...NOT_DERIVABLE.map(([name, bean]) => ({
        name,
        state: "not-derivable" as const,
        detail: `no arm builds this yet — bean ${bean}`,
      })),
    ],
  };
}

export function checkAll(root: string): EntryReport[] {
  // Declared, not composed — see `libraryRoot` in `ingest-document.ts` for why.
  // Absent declaration is "nothing to check", never "complete".
  const lib = directoryForGraph(root, "library");
  if (!lib || !existsSync(lib)) return [];
  return readdirSync(lib)
    .filter((d) => statSync(join(lib, d)).isDirectory())
    .sort()
    .map((d) => checkEntry(join(lib, d)));
}

/**
 * The verdict as a committed sidecar, so it outlives the console.
 *
 * Bean `pn6j` asks that "the verdict is recorded on the document". This is the
 * half of that which does not need a decision nobody has made yet: a
 * `qa-results/v1` document under the declared `qa` tree, whose **subject is the
 * asset** and whose **producer records the tool** — `script` plus
 * `script_hash`, so a verdict written by an older checker is visibly that.
 *
 * No sixth schema family. `qa-results/v1` already carries
 * `subject: { kind, id }` with an OPEN vocabulary, so an ingested document is a
 * new `kind`, not a new shape. The tool was never a separate subject: it is
 * provenance, and it was already on every one of these.
 *
 * ## `total` is deliberately never zero, and that is the honest reading
 *
 * It is tempting to count only `unmet` so a good entry reads `total: 0`. That
 * would be a lie: six requirements are **not derivable by any arm that
 * exists**, so no entry in `library/` is fully verified today, and a sidecar
 * claiming otherwise is exactly the "unknown rendered as a pass" this
 * repository keeps paying for. The two families are separate so a reader can
 * tell a DEFECT from a GAP at a glance, and neither is hidden.
 *
 * Path mirrors the subject (`library-qa/<slug>`) rather than flattening: the
 * `kg-qa` tree learned that the hard way, where four basenames already
 * collided across packages.
 */
export function sidecarDocument(report: EntryReport, now?: Date) {
  const unmet = report.requirements.filter((q) => q.state === "unmet");
  const nd = report.requirements.filter((q) => q.state === "not-derivable");
  const result = buildQaResult({
    script: "scripts/check-l1-complete.ts",
    scriptAbsPath: join(import.meta.dir, "check-l1-complete.ts"),
    subject: { kind: "library-document", id: `library/${report.slug}` },
    families: {
      unmet: {
        summary:
          "L1 requirements this entry does not satisfy. A DEFECT in the entry, " +
          "fixable by re-running the ingest rung that produces the artefact.",
        entries: unmet.map((q) => ({ requirement: q.name, detail: q.detail })),
      },
      notDerivable: {
        summary:
          "L1 requirements NO ingest arm can produce yet. Not a defect in this " +
          "entry and not a pass either — nothing has checked them, so this " +
          "entry is not fully verified. Each names the bean that would make it " +
          "checkable.",
        entries: nd.map((q) => ({ requirement: q.name, detail: q.detail })),
      },
    },
    now,
  });
  return result;
}

/** {@link sidecarDocument}, written under the declared `qa` tree. */
export function sidecarFor(root: string, report: EntryReport, now?: Date): string {
  return writeQaResult(root, join("library-qa", report.slug), sidecarDocument(report, now));
}

/**
 * Is the committed sidecar what this checker would write now?
 *
 * A committed verdict that nobody re-writes is worse than none: it reads as a
 * current answer while describing an older corpus, which is the defect
 * `kg-audit` grew its `source_hash` for. Compared on everything EXCEPT
 * `updated_at`, which churns on every run and would make each verdict look
 * stale forever.
 *
 * Returns the stems that are missing or stale, so CI names them rather than
 * saying "something drifted".
 */
export function staleSidecars(root: string, reports: EntryReport[]): string[] {
  const out: string[] = [];
  for (const r of reports) {
    const path = join(root, "test", "results", "library-qa", `${r.slug}.qa-results.json`);
    if (!existsSync(path)) {
      out.push(`${r.slug}: no sidecar`);
      continue;
    }
    const fresh = JSON.parse(JSON.stringify(sidecarDocument(r)));
    let committed: Record<string, unknown>;
    try {
      committed = JSON.parse(readFileSync(path, "utf-8")) as Record<string, unknown>;
    } catch {
      out.push(`${r.slug}: sidecar will not parse`);
      continue;
    }
    delete (fresh as Record<string, unknown>).updated_at;
    delete committed.updated_at;
    if (JSON.stringify(fresh) !== JSON.stringify(committed)) out.push(`${r.slug}: stale`);
  }
  return out;
}

function format(reports: EntryReport[]): string {
  if (reports.length === 0) return "L1 completeness\n  · no library/ entries — nothing to check";
  const mark = { met: "✓", unmet: "✗", "not-derivable": "·" } as const;
  const out: string[] = [];
  for (const r of reports) {
    const unmet = r.requirements.filter((q) => q.state === "unmet");
    out.push(`${unmet.length ? "✗" : "✓"} library/${r.slug}/`);
    for (const q of r.requirements) {
      if (q.state === "not-derivable") continue;
      out.push(`    ${mark[q.state]} ${q.name.padEnd(16)} ${q.detail}`);
    }
    for (const q of unmet) void q;
  }
  const nd = reports[0]?.requirements.filter((q) => q.state === "not-derivable") ?? [];
  if (nd.length) {
    out.push("");
    out.push(`  · ${nd.length} requirement(s) NOT DERIVABLE by any arm yet, so not checked:`);
    out.push(`    ${nd.map((q) => q.name).join(", ")}`);
    out.push("    These are not passes. Beans: " + NOT_DERIVABLE.map(([, b]) => b).join(", "));
  }
  return out.join("\n");
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const target = argv.find((a) => !a.startsWith("--"));
  let reports: EntryReport[];
  try {
    reports = target ? [checkEntry(target)] : checkAll(resolve("."));
  } catch (e) {
    console.error(`Could not check L1 completeness: ${e instanceof Error ? e.message : e}`);
    console.error("This is NOT a pass. Treat it as unknown.");
    process.exit(2);
  }
  if (argv.includes("--check")) {
    const stale = staleSidecars(resolve("."), reports);
    if (stale.length) {
      console.error("Committed L1 verdicts are out of date:");
      for (const x of stale) console.error(`  ✗ ${x}`);
      console.error("\nRun: bun run check:l1-complete -- --write");
      process.exit(1);
    }
    console.log(`✓ ${reports.length} committed L1 verdict(s) current`);
  }
  if (argv.includes("--write")) {
    for (const r of reports) console.log(`wrote ${sidecarFor(resolve("."), r)}`);
  }
  console.log(argv.includes("--json") ? JSON.stringify(reports, null, 2) : format(reports));
  process.exit(reports.some((r) => r.requirements.some((q) => q.state === "unmet")) ? 1 : 0);
}
