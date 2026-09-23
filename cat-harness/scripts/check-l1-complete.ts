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
import { join, relative, resolve } from "node:path";

import {
  ARCHIVE_CONTENTS_SCHEMA_ID,
  ArchiveContentsSchema,
  isArchiveMimetype,
} from "../schemas/archive-contents.ts";
import { LIBRARY_BLOCK_ORIGIN, ProvenanceSchema, isIngested } from "../schemas/attribution.ts";
import { NarrativeSchema } from "../schemas/narrative.ts";
import {
  TABULAR_RECORDS_SCHEMA_ID,
  TabularRecordsSchema,
  isTabularMimetype,
} from "../schemas/tabular-records.ts";
import { DESCRIBABLE_ROLES, ImagesSidecarSchema } from "../schemas/document-image.ts";
import { NARRATIVE_BEARING, narrativesIn } from "./narratives.ts";
import { directoriesForGraph } from "../schemas/cat-harness.ts";
import { buildQaResult, writeQaResult } from "./qa-results.ts";

export type State = "met" | "unmet" | "not-derivable";

export interface Requirement {
  name: string;
  state: State;
  detail: string;
}

export interface EntryReport {
  slug: string;
  /**
   * The library this entry is in, repo-relative — present only when there is
   * more than one, so a single-library instance's output is unchanged.
   *
   * A slug alone stopped locating an entry when `library` gained a second home
   * (bean `frs5`): the report printed `library/milnorlink/` and
   * `library/who-pub-tps-931/` identically while they sat in different
   * instances. Same reasoning as the per-directory root names in
   * `graph-index.ts` and the MCP server's GRAPH_ROOTS — a line that says where
   * something came from is useless the moment two sources share a name.
   */
  library?: string;
  requirements: Requirement[];
}

/**
 * Requirements the four existing rungs can actually satisfy today. Anything
 * else belongs in the not-derivable list below, with the bean that would move
 * it here.
 */
/**
 * What SHAPE of document is this entry? — measured 2026-09-20.
 *
 * ## The regression this exists to undo
 *
 * `derivableRequirements` applied every requirement to every entry. Two of
 * them — `tabular-records` and `archive-contents` — already ask the entry
 * what it is and answer *"not tabular (application/pdf)"*. The reverse was
 * never done, so a CSV was asked for `structure.json`, `sections/`, `blocks/`
 * and an `images.json`, with `image-descriptions` advising a reader to *"run
 * scripts/pdf-images.py"* on a spreadsheet.
 *
 * That was a wrong report until `pn6j` gated promotion on it. Then it became
 * a PERMANENT BLOCKER: a CSV cannot have a chapter tree, so it could never be
 * promoted, and the gate I had just added made every non-paged document
 * un-ingestable. Found by running a real CSV through the live pipeline rather
 * than by reading the code.
 *
 * ## Why the sidecar and not the mimetype
 *
 * The obvious route is `source.mimetype_sniffed`, which the other two
 * requirements use. It cannot work here: a CSV has **no magic bytes**, so its
 * source block honestly records `mimetype_sniffed: null` and
 * `mimetype_source: "unrecognised"` — `p67i` established that routing a CSV
 * cannot be a sniff and must not become an extension guess.
 *
 * What an entry DOES carry is the sidecar its rung wrote. That is a fact
 * about the entry rather than a claim about the file, which is the same
 * argument `nso8` makes for sniffing over extensions, one level up.
 */
export type EntryKind = "paged" | "tabular" | "archive" | "undetermined";

/** Which sidecar identifies which shape. One place, so a fourth rung adds one line. */
export const KIND_SIDECAR: ReadonlyArray<readonly [EntryKind, string]> = [
  ["paged", "structure.json"],
  ["tabular", "tabular.jsonld"],
  ["archive", "contents.jsonld"],
];

/**
 * The entry's shape, or `undetermined`.
 *
 * Third state, and it is NOT "assume paged". An entry with no sidecar at all
 * is one no rung has run on, and asking it for a chapter tree would report a
 * defect where the fact is that nothing has been derived yet.
 */
/**
 * Distinct figure labels the document's own text DECLARES, as a lower bound.
 *
 * ## Why this exists — bean `m4xy`
 *
 * `pdf-images.py` recovers the RASTER layer. WHO's conceptual figures —
 * frameworks, maturity models, taxonomies, process flows — are drawn in
 * VECTOR, so they are never extracted, and `image-descriptions` went on
 * reporting `met` over documents whose every figure was missing. Measured
 * 2026-09-22 across `smart-base/library/`:
 *
 *   9789240120747-eng   declares 6 captioned figures, places ZERO images,
 *                       and reported "0 image(s), 0 describable and all
 *                       described" — a DETERMINED empty that is true about
 *                       raster and misleading about figures.
 *   9789240010567-eng   declares 42, places 17, and the 17 are logos, a
 *                       photograph and a barcode. On page 92 the five
 *                       component logos were extracted and Fig. 5.6.2, the
 *                       diagram they sit INSIDE, was not.
 *
 * ## What this does NOT do
 *
 * **It does not compare counts.** Declared figures and placed images are not
 * commensurable and a ratio between them asserts a coverage this cannot
 * establish: the MAPS Toolkit declares 4 figures and places 162 images, of
 * which 63 are blank fragments of one title page. `placed >= declared` would
 * read as "covered" there and be wrong in both directions.
 *
 * So the number is reported and never graded, which is the same rule the
 * repository applies to every count it prints.
 *
 * ## Lower bound, and the matching is stated rather than assumed
 *
 * A caption is matched only at the START of a line, because a cross-reference
 * ("see Fig. 3.1") runs mid-sentence. That misses a caption typeset inline and
 * counts one that begins a line for another reason, so the figure is a LOWER
 * BOUND on what the document declares — said here rather than left for a
 * reader to infer from a bare integer.
 */
export function declaredFigureLabels(sectionsDir: string): Set<string> {
  return new Set(declaredFigureCaptions(sectionsDir).keys());
}

/**
 * Every figure the text declares, with its CAPTION TEXT where it has one.
 *
 * ## Why this is the primitive and `declaredFigureLabels` is derived from it
 *
 * Two scanners over one corpus is the defect #1001 just took out of the
 * navbar: they agree by maintenance, and the agreement has to be re-bought on
 * every change. The label count and the caption text are two questions about
 * the same lines, so they are answered by ONE regex here and
 * `declaredFigureLabels` is `keys()`. Its semantics are unchanged — any
 * line-start mention, the lower bound its own docstring describes.
 *
 * ## A caption is `Fig. N.` + text. A cross-reference is `Fig. N` + a sentence
 *
 * Measured on `9789240120747-eng`, 2026-09-23: NINE line-start matches for SIX
 * declared figures. Three of the nine are cross-references that wrapped onto a
 * new line —
 *
 * ```
 * Fig. 1).                      the tail of "(see Fig. 1)."
 * Fig. 5 illustrates the M&E    a cross-reference
 * Fig. 6 further illustrates    a cross-reference
 * Fig. 3. DIIG digital health   an actual caption
 * ```
 *
 * — and only the `Set` dedupe hid them, because their labels happened to
 * coincide with real captions. On a document where they did not, the count
 * would be wrong and nothing would say so.
 *
 * So the period after the number is the discriminator, and it is a fact about
 * the typesetting rather than a threshold somebody chose. That distinction is
 * why this change needs no number: `m4xy` refuses to pick a coverage
 * threshold, having found the distribution continuous across three orders of
 * magnitude.
 *
 * ## `null` is a third state, not an empty caption
 *
 * A label maps to `null` when the line is a mention without a caption — a
 * cross-reference, or a caption this lower bound could not read. It does NOT
 * mean "declared with an empty caption". A consumer deciding whether the
 * captions can stand in for the images must be able to tell "this figure has
 * no caption text here" from "this figure has a caption and it is blank", and
 * collapsing them is how a gate passes over content it never saw.
 *
 * A label seen BOTH ways keeps the caption: one real caption and three
 * cross-references is a captioned figure, which is what `Fig. 5` is above.
 */
export function declaredFigureCaptions(sectionsDir: string): Map<string, string | null> {
  const figures = new Map<string, string | null>();
  let files: string[];
  try {
    files = readdirSync(sectionsDir).filter((f) => f.endsWith(".md"));
  } catch {
    // No sections directory is "could not determine", not "declares none" —
    // the same third state the rest of this file keeps.
    return figures;
  }
  // ONE pattern, two captures. `(\.[ \t]+(\S.*))?` is the caption and is
  // optional, which is what makes a mention and a caption the same match with
  // different groups rather than two regexes that must be kept in step.
  const FIGURE = /^[ \t]*(?:Fig\.|Figure)[ \t]*(\d+(?:\.\d+)*)(?:\.[ \t]+(\S.*))?/gm;
  for (const f of files.sort()) {
    let body: string;
    try {
      body = readFileSync(join(sectionsDir, f), "utf-8");
    } catch {
      continue;
    }
    for (const m of body.matchAll(FIGURE)) {
      const label = m[1]!;
      const caption = m[2]?.trim();
      // A caption never loses to a later bare mention -- see the docstring.
      if (caption) figures.set(label, caption);
      else if (!figures.has(label)) figures.set(label, null);
    }
  }
  return figures;
}

export function entryKind(has: (file: string) => boolean): EntryKind {
  for (const [kind, file] of KIND_SIDECAR) if (has(file)) return kind;
  return "undetermined";
}

/** Requirements that only make sense for a PAGED document. */
export const PAGED_ONLY: readonly string[] = [
  "structure",
  "structure-note",
  "sections",
  "blocks",
  "narrative-provenance",
  "image-descriptions",
];

/**
 * Does this requirement apply to an entry of this shape?
 *
 * `undetermined` keeps EVERYTHING, deliberately. An entry nothing has run on
 * must not quietly satisfy the gate by having no applicable requirements —
 * that is the vacuity this repository keeps paying for, and it would let an
 * empty directory promote.
 */
export function appliesTo(requirement: string, kind: EntryKind): boolean {
  if (kind === "paged" || kind === "undetermined") return true;
  return !PAGED_ONLY.includes(requirement);
}

/**
 * The `source` block, from whichever sidecar this entry actually has.
 *
 * ONE definition, deliberately. This logic existed THREE times —
 * `tabular-records`, `archive-contents` and `technical-metadata` each rolled
 * their own, all reading `structure.json` only. Teaching the first to look
 * beyond it left the other two reporting `no source block — re-run the ingest
 * rung` for a CSV whose `tabular.jsonld` carries a complete one: advice that
 * was wrong, and that re-running would not have fixed.
 *
 * One rule in three places is three rules, and this file has already paid for
 * that once today — `narrative-review` restated the review queue's bearing
 * list and went stale at the same moment the queue's copy did (bean `04vl`).
 */
export function sourceBlockOf(dir: string): Record<string, unknown> | undefined {
  for (const [, file] of KIND_SIDECAR) {
    const f = join(dir, file);
    if (!existsSync(f)) continue;
    try {
      const d = JSON.parse(readFileSync(f, "utf-8")) as Record<string, unknown>;
      if (d.source) return d.source as Record<string, unknown>;
    } catch {
      continue; // the owning requirement reports an unparseable sidecar
    }
  }
  return undefined;
}

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

  // Narrative review state (bean `ju0u`).
  //
  // Every narrative-bearing file in the entry must hold a VALID narrative
  // record. The schema carries the rules that matter — text and state agree,
  // anything written names its drafter, only a human confirms, a rejection
  // keeps its reason — so this gate does not restate them and cannot drift
  // from them.
  //
  // A `draft` is reported but is NOT a failure: it is work waiting on a
  // person, and `bun run narratives` is where they see it. Calling it unmet
  // would make an unreviewed queue indistinguishable from a broken arm.
  {
    // The list and the shape both come from `scripts/narratives.ts`, which is
    // the review queue itself. They were RESTATED here — the same three files,
    // and the same `doc.narrative` single-narrative read — and went stale in
    // exactly the same way, at the same time, for the same reason: `d5f1` put
    // 24 draft narratives into `library/<slug>/images.json`, which holds MANY
    // at `images[i].narrative` and has no top-level `narrative` at all. So
    // this gate reported "no narrative-bearing file in this entry" over four
    // entries holding 24 drafts, while the queue reported zero awaiting review
    // (bean `04vl`).
    //
    // One rule in two places is two rules. Importing the queue's own
    // definition means a third bearing file cannot be added to one and missed
    // by the other.
    const bad: string[] = [];
    const counts: Record<string, number> = {};
    let looked = 0;
    for (const name of NARRATIVE_BEARING) {
      if (!has(name)) continue;
      let doc: Record<string, unknown>;
      try {
        doc = JSON.parse(readFileSync(join(dir, name), "utf-8")) as Record<string, unknown>;
      } catch {
        continue; // the owning requirement reports an unparseable file
      }
      for (const { narrative } of narrativesIn(doc)) {
        looked++;
        counts[narrative.state] = (counts[narrative.state] ?? 0) + 1;
      }
      // A `narrative` key that `narrativesIn` could not parse is a DEFECT,
      // not an absence — reported rather than skipped, which is what the
      // old `safeParse` branch was for and must not be lost in the move.
      if ("narrative" in doc && !NarrativeSchema.safeParse(doc.narrative).success) {
        bad.push(`${name}: narrative will not parse`);
      }
    }
    const tally = Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(", ");
    out.push({
      name: "narrative-review",
      state: bad.length ? "unmet" : "met",
      detail: bad.length
        ? bad.slice(0, 2).join("; ")
        : looked === 0
          // Precise about WHICH zero: `who-pub-tps-931` has an images.json
          // with 121 page scans and no narrative in any of them, which is not
          // the same fact as having no bearing file at all.
          ? "no narrative in any bearing file"
          : tally,
    });
  }

  // Tabular records (bean `p67i`).
  //
  // Scoped the same way as `archive-contents`, and for the same reason: the
  // entry's OWN `source.mimetype_sniffed` says whether it came from a
  // workbook, so this is derived rather than judged. That field carries the
  // refined answer — an `.xlsx` reads as the spreadsheet type, not as
  // `application/zip` — because the router and the recorder ask one function.
  //
  // A CSV is the case the mimetype cannot cover: it has no magic bytes and is
  // honestly `unrecognised`, so an entry with a `tabular.jsonld` is checked on
  // its merits whatever its mimetype, and one without is only REQUIRED to have
  // it when the mimetype declares a workbook. Requiring it of every
  // unrecognised entry would demand a dataset of every text file.
  {
    // From whichever sidecar this entry actually has. Reading `structure.json`
    // alone reported `no source block — re-run the ingest rung` for a CSV,
    // whose `tabular.jsonld` carries a complete one; the advice was wrong and
    // re-running would not have helped.
    const src = sourceBlockOf(dir);
    const mime = src?.mimetype_sniffed;
    if (!has("tabular.jsonld")) {
      out.push(
        isTabularMimetype(mime)
          ? {
              name: "tabular-records",
              state: "unmet",
              detail: `declares ${mime} but no tabular.jsonld — run scripts/tabular-records.py`,
            }
          : {
              name: "tabular-records",
              state: "met",
              detail: `not tabular (${typeof mime === "string" && mime ? mime : "no sniffed mimetype"})`,
            },
      );
    } else {
      let parsed: unknown;
      try {
        parsed = JSON.parse(readFileSync(join(dir, "tabular.jsonld"), "utf-8"));
      } catch (e) {
        parsed = undefined;
        out.push({ name: "tabular-records", state: "unmet", detail: `tabular.jsonld unparseable: ${String(e)}` });
      }
      if (parsed !== undefined) {
        const r = TabularRecordsSchema.safeParse(parsed);
        out.push({
          name: "tabular-records",
          state: r.success ? "met" : "unmet",
          detail: r.success
            ? `${r.data.n_sheets} sheet(s), ${r.data.header_vocabulary.length} header(s), narrative ${r.data.narrative.state}`
            : `tabular.jsonld is not ${TABULAR_RECORDS_SCHEMA_ID}: ${r.error.issues[0]?.message ?? "invalid"}`,
        });
      }
    }
  }

  // Archive contents (bean `twqe`).
  //
  // WHICH entries this applies to is DERIVED, not guessed: `nso8` already
  // records `source.mimetype_sniffed`, so "this entry came from a zip" is a
  // fact on the entry rather than a judgement about its name. An entry whose
  // source sniffed as an archive must carry `contents.jsonld`, validated
  // against `ArchiveContentsSchema` so the gate and the writer cannot drift.
  //
  // The corpus holds FOUR PDFs and no archives, so this reports a determined
  // zero — `not an archive (application/pdf)`. That is the point of saying it
  // rather than staying silent: "nothing to check here" and "the check never
  // ran" are different facts, and only one of them is a pass. The requirement
  // is proved to fire by fixtures in `scripts/tests/archive-contents.test.ts`.
  {
    const src = sourceBlockOf(dir);
    const mime = src?.mimetype_sniffed;
    if (!isArchiveMimetype(mime)) {
      out.push({
        name: "archive-contents",
        state: "met",
        // An EMPTY string is an absence, not a mimetype: rendering it gave
        // `not an archive ()`, which tells a reader nothing about whether
        // anything looked. `_tech_meta.py` writes `null` for unrecognised
        // bytes, and both spellings of "there isn't one" say so here.
        detail: `not an archive (${typeof mime === "string" && mime ? mime : "no sniffed mimetype"})`,
      });
    } else if (!has("contents.jsonld")) {
      out.push({
        name: "archive-contents",
        state: "unmet",
        detail: `sniffed ${mime} but no contents.jsonld — run scripts/archive-contents.py`,
      });
    } else {
      let parsed: unknown;
      try {
        parsed = JSON.parse(readFileSync(join(dir, "contents.jsonld"), "utf-8"));
      } catch (e) {
        parsed = undefined;
        out.push({ name: "archive-contents", state: "unmet", detail: `contents.jsonld unparseable: ${String(e)}` });
      }
      if (parsed !== undefined) {
        const r = ArchiveContentsSchema.safeParse(parsed);
        out.push({
          name: "archive-contents",
          state: r.success ? "met" : "unmet",
          detail: r.success
            ? `${r.data.n_files} file(s), ${r.data.n_directories} dir(s), ${r.data.format}`
            : `contents.jsonld is not ${ARCHIVE_CONTENTS_SCHEMA_ID}: ${r.error.issues[0]?.message ?? "invalid"}`,
        });
      }
    }
  }

  // Narrative provenance (bean `iqim`).
  //
  // Every block declares how its text came to be: the literal `"ingested"` for
  // verbatim source text, which has no author, or an `Attribution` naming the
  // human, agent (with its model) or script that wrote it.
  //
  // TWO failures are checked, and the second is the one that matters.
  //
  //   1. A `provenance` that is neither — an open string, a malformed
  //      attribution, an `agent` with no `model`. `ProvenanceSchema` decides,
  //      so the gate and the type cannot drift apart.
  //   2. A block of an AUTHORED kind carrying `"ingested"`. That is a false
  //      statement about verbatim extraction, and it is what stops a narrative
  //      arm landing descriptions with no attribution: closing the union means
  //      a new arm has to choose rather than omit.
  //
  // The narrative COUNT is reported either way, including a determined zero.
  // "No narrative blocks here" and "the classifier never ran" are different
  // facts, and a gate that renders them the same way is the failure this
  // repository keeps paying for. Today every one of the 424 blocks is
  // extracted prose, so the count is a real zero — and the authored branch is
  // proved to fire by a fixture in `scripts/tests/attribution.test.ts`, not by
  // the corpus.
  {
    const bdir = join(dir, "blocks");
    const files = has("blocks") && statSync(bdir).isDirectory()
      ? readdirSync(bdir).filter((f) => f.endsWith(".jsonld"))
      : [];
    if (files.length === 0) {
      out.push({
        name: "narrative-provenance",
        state: "unmet",
        detail: "no blocks to attribute — see the `blocks` requirement",
      });
    } else {
      const bad: string[] = [];
      let narrative = 0;
      let unclassified = 0;
      for (const f of files) {
        let b: Record<string, unknown>;
        try {
          b = JSON.parse(readFileSync(join(bdir, f), "utf-8")) as Record<string, unknown>;
        } catch {
          bad.push(`${f}: unparseable`);
          continue;
        }
        const kind = typeof b.kind === "string" ? b.kind : "";
        const origin = LIBRARY_BLOCK_ORIGIN[kind];
        if (origin === undefined) {
          unclassified++;
          bad.push(`${f}: kind \`${kind || "(absent)"}\` is not classified in LIBRARY_BLOCK_ORIGIN`);
          continue;
        }
        if (!ProvenanceSchema.safeParse(b.provenance).success) {
          bad.push(`${f}: \`provenance\` is neither "ingested" nor a well-formed attribution`);
          continue;
        }
        if (origin === "authored") {
          narrative++;
          if (isIngested(b.provenance)) {
            bad.push(`${f}: kind \`${kind}\` is authored, but claims "ingested" — nobody is credited`);
          }
        }
      }
      const tally = `${files.length} block(s), ${narrative} narrative, ${unclassified} unclassified kind(s)`;
      out.push({
        name: "narrative-provenance",
        state: bad.length ? "unmet" : "met",
        detail: bad.length ? `${bad.length} of ${files.length}: ${bad.slice(0, 3).join("; ")}` : tally,
      });
    }
  }

  // Technical metadata (bean `nso8`) — moved out of NOT-DERIVABLE once both
  // ingest rungs began writing it. `sha256` is the load-bearing field: an
  // asset with one can be re-fetched and compared, an asset without one is an
  // assertion.
  //
  // `mimetype_sniffed: null` is NOT a failure. The sniffer reads magic bytes
  // and refuses to fall back to the extension, so an unrecognised format is
  // honestly unrecognised — `mimetype_source: "unrecognised"` records that the
  // file WAS looked at, which absence alone would not say. What fails is the
  // field being absent entirely, i.e. an older ingest that never sniffed.
  {
    const src = sourceBlockOf(dir);
    if (!src) {
      out.push({
        name: "technical-metadata",
        state: "unmet",
        detail: "no `source` block — re-run the ingest rung",
      });
    } else {
      const want = ["file", "sha256", "bytes", "mtime", "mimetype_source"];
      const missing = want.filter((k) => !(k in src));
      out.push({
        name: "technical-metadata",
        state: missing.length ? "unmet" : "met",
        detail: missing.length
          ? `\`source\` missing ${missing.join(", ")}`
          : `sha256 ${String(src.sha256).slice(0, 12)}…, ${src.bytes} bytes, ${src.mimetype_source}`,
      });
    }
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

  // ── image-descriptions — moved OUT of NOT_DERIVABLE 2026-09-20 ──────────
  //
  // `d5f1` shipped: `pdf-images.py` classifies every placed image by geometry,
  // `apply-image-verdicts.ts` records an inspection basis naming who looked,
  // and a describable role carries a narrative. All four entries have one.
  // The gate went on reporting this as "no arm builds this yet" until the
  // probe in NOT_DERIVABLE was added — see there for why that is the failure
  // rather than the oversight.
  {
    const f = join(dir, "images.json");
    if (!existsSync(f)) {
      out.push({
        name: "image-descriptions",
        state: "unmet",
        detail: "no images.json — run scripts/pdf-images.py",
      });
    } else {
      try {
        const parsed = ImagesSidecarSchema.parse(JSON.parse(readFileSync(f, "utf-8")));
        if (parsed.images === null) {
          // The sidecar's OWN could-not-determine, carried through rather than
          // flattened. No backend could place the images and the reason is
          // recorded; calling that `unmet` asks somebody to fix a document
          // that is not broken.
          out.push({
            name: "image-descriptions",
            state: "not-derivable",
            detail: `images could not be determined — ${parsed.undetermined_reason ?? "no reason recorded"}`,
          });
        } else {
          const describable = parsed.images.filter((i) => DESCRIBABLE_ROLES.includes(i.role));
          const undescribed = describable.filter(
            (i) => (i.narrative?.state ?? "not-authored") === "not-authored",
          );
          // An `undetermined` ROLE is the third state one level down: nobody
          // has judged what this image is, so whether it needs describing is
          // unknown. Counting it as described would be the pass-by-default
          // this gate exists against.
          const unjudged = parsed.images.filter((i) => i.role === "undetermined");
          // What the TEXT declares, against what the raster arm placed — bean
          // `m4xy`. Never compared as a ratio; see `declaredFigureLabels`.
          const declared = declaredFigureLabels(join(dir, "sections"));
          const declaredNote =
            declared.size > 0
              ? ` The text declares at least ${declared.size} captioned figure(s); ` +
                `which of them correspond to placed images is NOT established.`
              : "";
          if (undescribed.length || unjudged.length) {
            out.push({
              name: "image-descriptions",
              state: "unmet",
              detail:
                `${undescribed.length} describable image(s) with no narrative, ` +
                `${unjudged.length} with an undetermined role.${declaredNote}`,
            });
          } else if (parsed.images.length === 0 && declared.size > 0) {
            // ZERO IMAGES PLACED, AND THE TEXT DECLARES FIGURES — `m4xy`.
            //
            // The owner ruled 2026-09-23, over building a vector arm: **the
            // CAPTION is the handle, and the arm is a later bean.** So the
            // question here stopped being "did an arm read them" and became
            // "does each declared figure carry text a reader can read instead".
            //
            // WHY THE CAPTION NEEDS NO NUMBER, which is most of why it won.
            // The vector arm needs a coverage threshold to tell a figure from
            // furniture, and `m4xy` refuses to propose one: pooled over 296
            // figures the distribution runs continuously across three orders
            // of magnitude, and "a threshold chosen after seeing this corpus
            // is a number chosen to fit the answer". A caption either has text
            // after `Fig. N.` or it does not.
            //
            // IT IS PER-FIGURE, and that is load-bearing rather than tidy.
            // `m4xy` exists because an entry could be "L1-complete,
            // gate-green, and missing every figure it declares, with nothing
            // anywhere signalling a gap". Flipping this to `met` on a COUNT
            // would rebuild that exactly. Measured 2026-09-23:
            // `9789240093362-eng` declares 18 and only THREE are captions —
            // the other fifteen are cross-references the lower bound counted.
            // A blanket `met` there would pass over fifteen figures nothing
            // describes.
            const figures = declaredFigureCaptions(join(dir, "sections"));
            const bare = [...figures].filter(([, c]) => c === null).map(([l]) => l);
            if (bare.length === 0) {
              out.push({
                name: "image-descriptions",
                state: "met",
                detail:
                  `no raster image was placed — the figures are drawn in vector — but ` +
                  `all ${figures.size} declared figure(s) carry caption text, which is ` +
                  `the reader's handle (owner ruling 2026-09-23, bean m4xy). ` +
                  `Captions: ${[...figures].map(([l, c]) => `Fig. ${l} "${c}"`).join("; ")}`,
              });
            } else {
              // `not-derivable` rather than `unmet`: the document is not
              // broken and no amount of describing would satisfy it. It is
              // reported and does not block promotion, which is what makes it
              // safe to be honest rather than a new permanent blocker — the
              // `pn6j` failure. The BARE LABELS are named, so a reader sees
              // which figures are uncovered rather than a bare shortfall.
              out.push({
                name: "image-descriptions",
                state: "not-derivable",
                detail:
                  `no raster image was placed, and ${bare.length} of ${figures.size} ` +
                  `declared figure(s) carry no caption text either — Fig. ` +
                  `${bare.join(", ")}. They are drawn in vector, no arm reads them, ` +
                  `and the caption handle does not reach them (bean m4xy)`,
              });
            }
          } else {
            out.push({
              name: "image-descriptions",
              state: "met",
              detail:
                `${parsed.images.length} image(s), ${describable.length} describable ` +
                `and all described.${declaredNote}`,
            });
          }
        }
      } catch (e) {
        out.push({
          name: "image-descriptions",
          state: "unmet",
          detail: `images.json will not parse: ${e instanceof Error ? e.message : e}`,
        });
      }
    }
  }

  // Applied LAST, over the whole list, so a requirement cannot be silently
  // skipped at its own call site and later look like it passed.
  const kind = entryKind(has);
  return out.filter((r) => appliesTo(r.name, kind));
}

/**
 * What `pn6j` asks for that nothing can produce yet.
 *
 * ## The third state has to EXPIRE, and this one did not
 *
 * The entry above used to read *"this list shrinks by work rather than by
 * editing"*. It does not. Nothing forced the edit, so when `d5f1` shipped —
 * `pdf-images.py`, the inspection pass, 164 classified images across all four
 * library entries — the gate went on reporting `image-descriptions` as *"no
 * arm builds this yet"*. Measured 2026-09-20: four entries, four `images.json`
 * files, 2 / 20 / 121 / 21 images, every one with a role and a basis, and the
 * gate checking none of it.
 *
 * A not-derivable entry is a declared exception, and this repository has now
 * paid for the same shape three times in one session: a reason living in a
 * YAML comment that nothing compared and had become false (`ot9a`), a drift
 * backlog that exempted a whole page so it could drift further in silence
 * (`07p7`), and this. Each outlived its premise because nothing re-derived it.
 *
 * So each entry carries a `probe`: the artefact whose EXISTENCE means the arm
 * now runs. {@link expiredExceptions} fails the gate when one is found, and
 * the fix is to move the requirement into {@link derivableRequirements} rather
 * than to edit the reason.
 *
 * **The probe is the corpus, not the bean's status.** `d5f1` is still
 * `in-progress` while its output is committed and complete, so a status field
 * would have reported this as correctly not-derivable. A human-maintained flag
 * is the weak signal; the artefact on disk is the strong one.
 */
export interface NotDerivable {
  name: string;
  /** The bean that would move this into the checked set. */
  bean: string;
  /** Filename within a library entry whose presence means the arm now runs. */
  probe: string;
}

export const NOT_DERIVABLE: readonly NotDerivable[] = [
  // `transcript`, NOT `transcript.json`. `1r0p`'s own Done-when says
  // `library/<slug>/transcript/` holds the source-language transcript and
  // each translation — a DIRECTORY. The first probe here guessed a filename
  // and would therefore never have fired, which is a gate that cannot fail:
  // the precise class of defect this probe was added to prevent, reproduced
  // two PRs later by the person who added it. Read from the bean, not from
  // the shape a sidecar usually takes.
  { name: "audio-transcripts", bean: "1r0p", probe: "transcript" },
];

/**
 * Not-derivable claims the corpus has outgrown.
 *
 * Never empty-by-accident: {@link checkAll} reports `undefined` rather than
 * `[]` when it cannot read the library, and this is only consulted on a real
 * list of entries.
 */
export function expiredExceptions(
  entries: readonly string[],
  has: (dir: string, file: string) => boolean,
): { name: string; bean: string; found: string }[] {
  const out: { name: string; bean: string; found: string }[] = [];
  for (const nd of NOT_DERIVABLE) {
    const found = entries.find((d) => has(d, nd.probe));
    if (found) out.push({ name: nd.name, bean: nd.bean, found });
  }
  return out;
}

export function checkEntry(dir: string): EntryReport {
  return {
    slug: dir.split("/").filter(Boolean).pop() ?? dir,
    requirements: [
      ...derivableRequirements(dir),
      ...NOT_DERIVABLE.map((nd) => ({
        name: nd.name,
        state: "not-derivable" as const,
        detail: `no arm builds this yet — bean ${nd.bean}`,
      })),
    ],
  };
}

/**
 * The instance root, which is NOT the current working directory.
 *
 * This resolved the library from `resolve(".")` alone. The instance moved
 * under `cat-harness/` (bean `wggr`), npm scripts run from the REPOSITORY
 * root, and so `bun run check:l1-complete` — a CI gate — found no declaration,
 * reported "no library/ entries — nothing to check" and **exited 0**. Measured
 * 2026-09-20: four entries present, zero checked, gate green.
 *
 * That is `xom7` one level in: a check that cannot fail is indistinguishable
 * from a check that passes. Tries the working directory first, so a downstream
 * folio invoking this from its own root still resolves its own library, and
 * falls back to the directory this module lives in.
 */
export function instanceRootFor(cwd: string): string | undefined {
  // `.length > 0`, not `[0]`. The question here is PRESENCE — does this root
  // declare a library at all — and asking it by indexing reads as though the
  // first one mattered. It never did here, and after bean `a02m` a root may
  // declare several.
  if (directoriesForGraph(cwd, "library").length > 0) return cwd;
  const own = resolve(import.meta.dir, "..");
  return directoriesForGraph(own, "library").length > 0 ? own : undefined;
}

/**
 * Entries to check, or `undefined` when no `library` is declared ANYWHERE.
 *
 * Three states, and the middle one is the point. `[]` means "a library is
 * declared and holds nothing" — a determined finding. `undefined` means
 * "no declaration was found", which is not the same and must never be
 * rendered as a clean run.
 */
export function checkAll(root: string): EntryReport[] | undefined {
  // Declared, not composed — see `libraryRoot` in `ingest-document.ts` for why.
  //
  // EVERY declared library. This is the L1 COMPLETENESS gate, and the one
  // failure it must never have is reporting a complete pass over part of the
  // corpus — which is exactly what it did when it ran from the repository
  // root and checked nothing (the comment on `instanceRootFor` above). Half
  // is the same bug as none, with better camouflage: none at least yields the
  // `undefined` third state. `directoriesForGraph(...)[0]` until bean `a02m`.
  const libs = directoriesForGraph(root, "library");
  if (libs.length === 0) return undefined;
  const out: EntryReport[] = [];
  // A slug in two libraries is REFUSED, not merged. The committed sidecar is
  // `library-qa/<slug>.qa-results.json` — keyed on the slug alone — so two
  // entries sharing one would write over each other's verdict and the second
  // run would look idempotent. `gen-library-jsonld` refuses the same collision
  // for the same reason, and this does not delegate to it: a gate that relies
  // on a DIFFERENT tool having run is a gate with a hole in it.
  const seen = new Map<string, string>();
  for (const lib of libs) {
    if (!existsSync(lib)) continue;
    for (const d of readdirSync(lib).sort()) {
      if (!statSync(join(lib, d)).isDirectory()) continue;
      const prior = seen.get(d);
      if (prior !== undefined) {
        throw new Error(
          `slug "${d}" appears in two libraries — ${prior} and ${join(lib, d)}. ` +
            `The committed verdict is keyed on the slug alone, so one would silently ` +
            `overwrite the other. Rename one.`,
        );
      }
      seen.set(d, join(lib, d));
      out.push({
        ...checkEntry(join(lib, d)),
        library: libs.length > 1 ? relative(root, lib) : undefined,
      });
    }
  }
  return out;
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
    // `<library>/<slug>/` when several libraries are in play, `library/<slug>/`
    // when there is only one — an instance with a single library reads exactly
    // as it always did.
    out.push(`${unmet.length ? "✗" : "✓"} ${r.library ?? "library"}/${r.slug}/`);
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
    out.push("    These are not passes. Beans: " + NOT_DERIVABLE.map((nd) => nd.bean).join(", "));
  }
  return out.join("\n");
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const target = argv.find((a) => !a.startsWith("--"));
  let reports: EntryReport[];
  try {
    if (target) {
      reports = [checkEntry(target)];
    } else {
      const root = instanceRootFor(resolve("."));
      if (root === undefined) {
        console.error("Could not find a declared `library` directory from " + resolve("."));
        console.error("This is NOT a pass. Treat it as unknown.");
        process.exit(2);
      }
      const all = checkAll(root);
      if (all === undefined) {
        console.error(`No \`library\` graph is declared under ${root}.`);
        console.error("This is NOT a pass. Treat it as unknown.");
        process.exit(2);
      }
      reports = all;
    }
  } catch (e) {
    console.error(`Could not check L1 completeness: ${e instanceof Error ? e.message : e}`);
    console.error("This is NOT a pass. Treat it as unknown.");
    process.exit(2);
  }
  // An EXPIRED exception is a gate lying about its own coverage, so it is
  // checked before anything else and on every run, not only under `--check`.
  // `image-descriptions` sat in NOT_DERIVABLE naming `d5f1` for as long as it
  // took somebody to notice, while all four entries carried a complete
  // `images.json`.
  if (!target) {
    const libRoot = instanceRootFor(resolve("."));
    // Across EVERY declared library: an exception that has expired in the
    // second one is a gate lying about its coverage just as much as one that
    // expired in the first. Bean `a02m`.
    const libs = libRoot ? directoriesForGraph(libRoot, "library").filter((d) => existsSync(d)) : [];
    if (libs.length > 0) {
      const dirs = libs.flatMap((lib) =>
        readdirSync(lib)
          .map((d) => join(lib, d))
          .filter((d) => statSync(d).isDirectory()),
      );
      const expired = expiredExceptions(dirs, (d, f) => existsSync(join(d, f)));
      if (expired.length) {
        console.error("A `not-derivable` claim has EXPIRED — the arm now runs:");
        for (const x of expired) {
          console.error(`  ✗ ${x.name} (bean ${x.bean}) — ${x.found} has ${x.name === "audio-transcripts" ? "transcript.json" : "its artefact"}`);
        }
        console.error("\nMove it into `derivableRequirements` and check it. A third state");
        console.error("that never expires is an exemption, not a measurement.");
        process.exit(1);
      }
    }
  }

  if (argv.includes("--check")) {
    const stale = staleSidecars(instanceRootFor(resolve(".")) ?? resolve("."), reports);
    if (stale.length) {
      console.error("Committed L1 verdicts are out of date:");
      for (const x of stale) console.error(`  ✗ ${x}`);
      console.error("\nRun: bun run check:l1-complete -- --write");
      process.exit(1);
    }
    console.log(`✓ ${reports.length} committed L1 verdict(s) current`);
  }
  if (argv.includes("--write")) {
    // The SAME root the reports came from. `resolve(".")` wrote the sidecars
    // beside the working directory, so running the documented command from
    // the repository root put them in a `test/` tree of their own while the
    // committed ones sat under the instance — two sets, neither checking the
    // other. Measured 2026-09-20.
    const writeRoot = instanceRootFor(resolve(".")) ?? resolve(".");
    for (const r of reports) console.log(`wrote ${sidecarFor(writeRoot, r)}`);
  }
  console.log(argv.includes("--json") ? JSON.stringify(reports, null, 2) : format(reports));
  process.exit(reports.some((r) => r.requirements.some((q) => q.state === "unmet")) ? 1 : 0);
}
