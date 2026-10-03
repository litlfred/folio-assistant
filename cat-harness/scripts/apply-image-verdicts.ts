#!/usr/bin/env bun
/**
 * Apply an agent's INSPECTION of the extracted images to their sidecars.
 *
 * Bean `d5f1`. `pdf-images.py` classifies by geometry, which gives exactly one
 * bit — is this image the whole page, or something on it. That is not enough:
 * of the 24 images it called `figure` across this corpus, 2 were real figures,
 * 12 were organisation logos, 8 were photographs (7 of them the same picture
 * at seven sizes) and 2 were unreplaced template text. No measurement of a
 * placed rectangle can tell a WHO emblem from a chart.
 *
 * So the finer roles come from LOOKING, and this writes that down as what it
 * is: an `inspection` basis naming who looked, when, and what they saw. The
 * schema refuses `logo` or `decorative` on a geometry basis precisely so the
 * two can never be confused (`schemas/document-image.ts`).
 *
 * ## The verdicts are DATA, not code
 *
 * `library/image-verdicts.json` holds one agent's judgement, reviewable line
 * by line. This script applies it mechanically and adds nothing of its own. A
 * verdict written inline here would be a judgement disguised as a program.
 *
 * ## Every narrative lands as a DRAFT
 *
 * An agent may write a description; only a human may accept one. That rule is
 * in `schemas/narrative.ts` and it is the whole reason the state machine
 * exists — an uncited narrative is indistinguishable from a transcription of
 * the source, and the two have very different standing. This script therefore
 * cannot produce a `confirmed` narrative even if asked; `scripts/narratives.ts`
 * is where a person does that, and it refuses to run non-interactively.
 *
 * ## Applying to a STAGED entry — bean `8suc`
 *
 * Until 2026-09-23 this resolved every target through
 * `directoriesForGraph(root, "library")`, and so did `scripts/narratives.ts`.
 * Those are the ONLY two writers of a narrative into an `images.json`, and
 * `ingest --promote` refuses to file an entry whose `image-descriptions`
 * requirement is unmet. So a document with describable images could not be
 * promoted until it had descriptions, and could not be given descriptions
 * until it was promoted. A cycle, not a sequence.
 *
 * It went unnoticed because every entry carrying applied verdicts today was
 * in its library BEFORE that gate existed, so this always found it. The path
 * that fails is the one nothing had walked — the `1xhc` shape.
 *
 * `--staging <entry-dir> --library <lib-dir>` breaks it. The judgement keeps
 * ONE home: the verdicts are still read from `<lib-dir>/image-verdicts.json`,
 * keyed by the doc id, which is the same id before and after promotion. Only
 * the write target moves.
 *
 * **`--library` is required with `--staging`, and is not guessed.** A staging
 * directory does not say which library the document is being promoted into —
 * the same rule `ingest` enforces for its own `--library`, and the one bean
 * `v1hw` measured: a queue does not determine a library.
 *
 * ## In staging mode an absent verdict is NORMAL
 *
 * The whole-corpus mode below exits 1 when it finds no verdict file anywhere,
 * because there it means a completed pass over no work. In staging mode the
 * opposite holds: the FIRST ingest necessarily runs before anybody has looked
 * at the images, so "no verdicts for this document yet" is the expected state
 * and exits 0. The `image-descriptions` requirement is what refuses the
 * promotion — this script never needs to.
 *
 * An ORPHANED verdict still fails, in either mode. A verdict naming an image
 * the sidecar does not have is a wrong verdict file, not a missing judgement.
 *
 * ## Vector figures are judged HERE too — bean `ay3x`
 *
 * `pdf-vector-figures.py` renders the drawn figures `pdf-images.py` cannot
 * see, and assigns them NO role: whether a render is a figure or furniture is
 * the call `m4xy` refuses to make with a threshold. So the call is made by
 * looking, and it arrives through this file, keyed `vfig-pNNN` in the same
 * `image-verdicts.json`, as the same `inspection` basis — one judgement path
 * for both kinds of image, so they cannot come to be judged by different rules.
 *
 * A vector verdict may also carry `shows`: the declared figure numbers the
 * render holds. The page's caption candidates include cross-references, so
 * only the inspector can say which figure is on it, and `image-descriptions`
 * counts a figure as reached by this arm only through `shows`.
 *
 * **A render nobody has judged is REPORTED, never a failure** — in either
 * mode. The arm writes one per caption page, ~100 across the WHO corpus on its
 * first run, and failing the whole-corpus pass until all were inspected would
 * make this script unusable for the raster work it already does. The gate that
 * says what is still uncovered is `image-descriptions`, which names them.
 *
 *   bun run cat-harness/scripts/apply-image-verdicts.ts            # apply
 *   bun run cat-harness/scripts/apply-image-verdicts.ts --check    # report only
 *   bun run cat-harness/scripts/apply-image-verdicts.ts \
 *     --staging ingest-staging/<doc-id> --library ../agent-skills/library
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";

import { AttributionSchema } from "../schemas/attribution.ts";
import {
  DESCRIBABLE_ROLES,
  ImagesSidecarSchema,
  SETTLED_BY_COMPUTATION,
  requiresInspection,
  type ImageRole,
} from "../schemas/document-image.ts";
import { corpusDirectoriesForGraph } from "../schemas/harness-config.js";
import {
  VECTOR_FIGURES_FILE,
  VectorFiguresSidecarSchema,
  isVectorFigureId,
} from "../schemas/vector-figure.ts";

const ROOT = resolve(import.meta.dir, "..");

/**
 * The library directory as the instance DECLARES it, not as convention
 * assumes it. `harness.json` is the list; hardcoding the path is how a
 * consumer comes to scan a directory that is not there after a relocation —
 * which this repository has already done once, moving the whole instance
 * under `cat-harness/`.
 */
// EVERY declared library, not the first — a verdict names a document, and
// looking for it in one of several libraries would report "no such document"
// about one that is right there. `directoriesForGraph(...)[0]` until `a02m`.
//
// declared-path-literal: the convention fallback, at the call site so the
// choice is visible. An absent directory is reported below, not assumed empty.
const LIBRARIES: string[] = (() => {
  const declared = corpusDirectoriesForGraph(ROOT, "library");
  return declared.length > 0 ? declared : [join(ROOT, "library")];
})();

interface Verdict {
  role: ImageRole;
  saw: string;
  draft: string;
  /** Vector figures only: the declared figure numbers this render shows. */
  shows?: string[];
  /**
   * Who looked at THIS image, when that was not the document's inspector —
   * bean `ay3x`. The per-document `attribution` was enough while one session
   * judged a document's images; `9789240101197-eng` has raster verdicts from
   * one session and vector verdicts from another, and a per-document entry
   * would re-attribute one set to the other. Most specific wins.
   */
  inspected_by?: unknown;
  inspected_at?: string;
}
interface VerdictFile {
  inspected_by: unknown;
  inspected_at: string;
  /**
   * Who looked at ONE document's images, when that was not `inspected_by`.
   *
   * The file-wide pair was the only attribution until bean `scfh`, so every
   * document added to a library's verdicts inherited the first inspector and
   * the first date: appending a deck inspected on 2026-09-30 would have
   * recorded it as inspected on 2026-09-22 by someone else. An attribution
   * that is wrong is worse than none, because it is the part a reader trusts.
   */
  attribution?: Record<string, { inspected_by: unknown; inspected_at: string }>;
  verdicts: Record<string, Record<string, Verdict>>;
}

/** The attribution for one document: its own, else the file's. */
export function attributionFor(vf: VerdictFile, docId: string): { by: unknown; at: string } {
  const own = vf.attribution?.[docId];
  return own ? { by: own.inspected_by, at: own.inspected_at } : { by: vf.inspected_by, at: vf.inspected_at };
}

export interface ApplyResult {
  docId: string;
  applied: number;
  /** Images in the sidecar with no verdict. Never silently skipped. */
  unjudged: string[];
  /** Verdicts naming an image the sidecar does not have. */
  orphaned: string[];
}

/**
 * Rewrite one sidecar from the verdicts. Pure: returns the new body and the
 * counts, so `--check` and the real run cannot diverge.
 */
export function applyTo(
  sidecarText: string,
  docVerdicts: Record<string, Verdict>,
  by: unknown,
  at: string,
): { text: string; result: Omit<ApplyResult, "docId"> } {
  const parsed = ImagesSidecarSchema.parse(JSON.parse(sidecarText));
  const images = parsed.images ?? [];
  const unjudged: string[] = [];
  const seen = new Set<string>();

  const next = images.map((img) => {
    const v = docVerdicts[img.id];
    if (!v) {
      // A page scan needs no inspection — geometry settles it — and neither
      // does `chrome`, which the capture's own producer settles. Anything else
      // without a verdict is REPORTED, because an image nobody looked at is
      // not the same as one judged unremarkable.
      //
      // Asked as "is this role already settled" rather than "is it a page
      // scan": the literal was right while geometry was the only computable
      // basis, and adding `chrome` to the enum without changing it here would
      // have reported 104 navigation icons as awaiting inspection.
      if (!SETTLED_BY_COMPUTATION.includes(img.role)) unjudged.push(img.id);
      return img;
    }
    seen.add(img.id);
    const page = img.basis?.page;
    if (page === undefined) {
      // No page means no geometry ran; an inspection basis still needs one,
      // and inventing it would be the fabrication this module exists against.
      unjudged.push(img.id);
      return img;
    }
    const who = AttributionSchema.parse(v.inspected_by ?? by);
    const when = v.inspected_at ?? at;
    const narrative = DESCRIBABLE_ROLES.includes(v.role)
      ? {
          text: v.draft,
          state: "draft" as const,
          drafted_by: who,
          drafted_at: when,
        }
      : undefined;
    return {
      ...img,
      role: v.role,
      basis: { method: "inspection" as const, by: who, at: when, saw: v.saw, page },
      ...(narrative ? { narrative } : {}),
    };
  });

  // A `vfig-` verdict belongs to the vector sidecar, which {@link applyToVector}
  // writes; it is not an orphan of this one.
  const orphaned = Object.keys(docVerdicts).filter((id) => !seen.has(id) && !isVectorFigureId(id));
  const out = { ...parsed, images: next };
  // Validated on the way OUT as well as in: the refinements are the point of
  // the exercise, and a writer that skips them can emit what a reader refuses.
  ImagesSidecarSchema.parse(out);
  return {
    text: JSON.stringify(out, null, 2) + "\n",
    result: { applied: seen.size, unjudged, orphaned },
  };
}

/**
 * Rewrite one VECTOR sidecar from the `vfig-` verdicts — bean `ay3x`.
 *
 * Same contract as {@link applyTo}: pure, validated in and out, and the
 * judgement arrives as an `inspection` basis naming who looked. `unjudged`
 * lists the renders with no verdict; the caller REPORTS them and does not
 * fail on them (see the header).
 */
export function applyToVector(
  sidecarText: string,
  docVerdicts: Record<string, Verdict>,
  by: unknown,
  at: string,
): { text: string; result: Omit<ApplyResult, "docId"> } {
  const parsed = VectorFiguresSidecarSchema.parse(JSON.parse(sidecarText));
  const figures = parsed.figures ?? [];
  const unjudged: string[] = [];
  const seen = new Set<string>();
  const next = figures.map((f) => {
    const v = docVerdicts[f.id];
    if (!v) {
      if (f.file !== null) unjudged.push(f.id);
      return f;
    }
    seen.add(f.id);
    const { shows: _shows, narrative: _narrative, ...rest } = f;
    const who = AttributionSchema.parse(v.inspected_by ?? by);
    const when = v.inspected_at ?? at;
    return {
      ...rest,
      role: v.role,
      basis: { method: "inspection" as const, by: who, at: when, saw: v.saw, page: f.page },
      ...(v.shows && v.shows.length > 0 ? { shows: v.shows } : {}),
      ...(DESCRIBABLE_ROLES.includes(v.role)
        ? {
            narrative: {
              text: v.draft,
              state: "draft" as const,
              drafted_by: who,
              drafted_at: when,
            },
          }
        : {}),
    };
  });
  const orphaned = Object.keys(docVerdicts).filter((id) => isVectorFigureId(id) && !seen.has(id));
  const out = { ...parsed, figures: next };
  VectorFiguresSidecarSchema.parse(out);
  return {
    text: JSON.stringify(out, null, 2) + "\n",
    result: { applied: seen.size, unjudged, orphaned },
  };
}

/**
 * Apply the `vfig-` verdicts to the vector sidecar in `entryDir`, if any.
 * Returns the result, or undefined when the entry has no vector sidecar AND no
 * vector verdicts. A vector verdict with no sidecar to land in is orphaned.
 */
function applyVectorIn(
  entryDir: string,
  docVerdicts: Record<string, Verdict>,
  by: unknown,
  at: string,
  check: boolean,
): Omit<ApplyResult, "docId"> | undefined {
  const path = join(entryDir, VECTOR_FIGURES_FILE);
  const vectorIds = Object.keys(docVerdicts).filter(isVectorFigureId);
  if (!existsSync(path)) {
    return vectorIds.length ? { applied: 0, unjudged: [], orphaned: vectorIds } : undefined;
  }
  const { text, result } = applyToVector(readFileSync(path, "utf-8"), docVerdicts, by, at);
  if (!check) writeFileSync(path, text, "utf-8");
  return result;
}

/** The value after `--flag`, or `undefined`. */
function flag(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

/**
 * Apply one document's verdicts to its STAGED sidecar — bean `8suc`.
 *
 * Deliberately NOT a special case inside {@link run}: that one walks every
 * declared library and every document in each, and its "no verdicts anywhere"
 * and "unjudged image" rules are both wrong here (see the header). Two callers
 * with opposite error semantics sharing one body is how one of them ends up
 * with the other's exit code.
 *
 * The transformation itself is {@link applyTo}, unchanged and shared, so a
 * staged sidecar and a promoted one cannot be written differently.
 */
export function runStaging(entryDir: string, libDir: string, check: boolean): number {
  const docId = basename(entryDir);
  const sidecar = join(entryDir, "images.json");
  if (!existsSync(sidecar)) {
    // Not the absent-verdicts case: the sidecar is written by `pdf-images.py`
    // before this ever runs, so its absence means an arm did not run at all.
    console.error(`✗ ${docId}: no images.json at ${sidecar} — run scripts/pdf-images.py first`);
    return 1;
  }
  const vf = join(libDir, "image-verdicts.json");
  if (!existsSync(vf)) {
    console.log(`· no image-verdicts.json in ${libDir} yet — nothing to apply for ${docId}`);
    return 0;
  }
  const verdicts = JSON.parse(readFileSync(vf, "utf-8")) as VerdictFile;
  const docVerdicts = verdicts.verdicts[docId];
  if (!docVerdicts) {
    console.log(`· no verdicts for ${docId} yet — nothing to apply`);
    return 0;
  }
  const who = attributionFor(verdicts, docId);
  const { text, result } = applyTo(readFileSync(sidecar, "utf-8"), docVerdicts, who.by, who.at);
  // Computed in check mode first so an orphan in EITHER sidecar refuses before
  // anything is written — a half-applied judgement is worse than none.
  const vector = applyVectorIn(entryDir, docVerdicts, who.by, who.at, true);
  const orphans = [...result.orphaned, ...(vector?.orphaned ?? [])];
  if (orphans.length > 0) {
    console.error(`✗ ${docId}: ${orphans.length} verdict(s) name an image the sidecars do not have:`);
    for (const id of orphans) console.error(`      ${id}`);
    return 1;
  }
  if (!check) {
    writeFileSync(sidecar, text, "utf-8");
    applyVectorIn(entryDir, docVerdicts, who.by, who.at, false);
  }
  if (vector) {
    console.log(
      `  ${vector.applied} vector verdict(s) applied` +
        (vector.unjudged.length ? `, ${vector.unjudged.length} render(s) awaiting inspection` : ""),
    );
  }
  const rest = result.unjudged.length
    ? `, ${result.unjudged.length} image(s) still unjudged`
    : "";
  console.log(`  ${result.applied} verdict(s) applied to ${relative(process.cwd(), sidecar)}${rest}`);
  // Unjudged is NOT an error here — `image-descriptions` is the gate, and it
  // reports them with the detail a promotion refusal needs.
  return 0;
}

function run(): number {
  const check = process.argv.includes("--check");
  const staging = flag("--staging");
  if (staging !== undefined) {
    const lib = flag("--library");
    if (lib === undefined) {
      console.error("✗ --staging requires --library: a staging directory does not say which");
      console.error("  library the document is being promoted into, and guessing one would read");
      console.error("  a judgement that belongs to a different corpus (bean `v1hw`).");
      return 1;
    }
    return runStaging(staging, lib, check);
  }
  // The verdict file sits BESIDE the documents, so with several libraries
  // there may be several — each judging its own. Every one is applied; a
  // missing one in a library that has no verdicts yet is not an error, but
  // finding NONE anywhere is, because then there is nothing to apply and
  // exiting 0 would report a completed pass over no work.
  const verdictFiles = LIBRARIES.map((d) => join(d, "image-verdicts.json")).filter((f) => existsSync(f));
  if (verdictFiles.length === 0) {
    console.error(
      `✗ no image-verdicts.json in any declared library (${LIBRARIES.join(", ")}) — nothing to apply`,
    );
    return 1;
  }
  // Every inspection-only role in the file must really need inspection; a
  // verdict assigning `figure` adds nothing geometry did not already say, and
  // silently accepting one would let this file overwrite a measurement.
  let bad = 0;
  // Accumulated across the verdict FILES rather than read back off one of them
  // afterwards: with several libraries there is no single `verdicts` left in
  // scope at the end, and picking the last one would report a count for one
  // library beside a total for all of them.
  let inspected = 0;
  const results: ApplyResult[] = [];
  const awaiting: string[] = [];
  for (const vf of verdictFiles) {
    const libDir = dirname(vf);
    const verdicts = JSON.parse(readFileSync(vf, "utf-8")) as VerdictFile;
    inspected += Object.values(verdicts.verdicts)
      .flatMap((d) => Object.values(d))
      .filter((v) => requiresInspection(v.role)).length;
    for (const [docId, docVerdicts] of Object.entries(verdicts.verdicts)) {
      // Resolved against the library the verdict file is IN, not searched
      // across all of them: a verdict belongs to its own library, and looking
      // elsewhere would let one library's judgement rewrite another's sidecar.
      const path = join(libDir, docId, "images.json");
      if (!existsSync(path)) {
        console.error(`✗ ${docId}: no images.json — run scripts/pdf-images.py first`);
        bad++;
        continue;
      }
      const who = attributionFor(verdicts, docId);
      const { text, result } = applyTo(readFileSync(path, "utf-8"), docVerdicts, who.by, who.at);
      const vector = applyVectorIn(join(libDir, docId), docVerdicts, who.by, who.at, true);
      if (!check) writeFileSync(path, text, "utf-8");
      if (!check && !vector?.orphaned.length) applyVectorIn(join(libDir, docId), docVerdicts, who.by, who.at, false);
      results.push({ docId, ...result, applied: result.applied + (vector?.applied ?? 0), orphaned: [...result.orphaned, ...(vector?.orphaned ?? [])] });
      // Reported, not counted toward the failure — see "Vector figures are
      // judged HERE too" in the header.
      if (vector?.unjudged.length) awaiting.push(`${docId}: ${vector.unjudged.length}`);
    }
  }

  let unjudged = 0;
  let orphaned = 0;
  for (const r of results) {
    const roles = r.unjudged.length ? `  ${r.unjudged.length} unjudged` : "";
    const orph = r.orphaned.length ? `  ${r.orphaned.length} orphaned` : "";
    console.log(`  ${r.docId.padEnd(24)} ${String(r.applied).padStart(3)} applied${roles}${orph}`);
    for (const id of r.unjudged) console.log(`      unjudged: ${id}`);
    for (const id of r.orphaned) console.log(`      orphaned verdict: ${id} (no such image)`);
    unjudged += r.unjudged.length;
    orphaned += r.orphaned.length;
  }

  const total = results.reduce((n, r) => n + r.applied, 0);
  if (awaiting.length) console.log(`  · vector renders awaiting inspection — ${awaiting.join("; ")}`);
  console.log();
  console.log(`  ${total} verdict(s) applied, ${inspected} of them inspection-only roles`);
  if (unjudged || orphaned) {
    console.error(`✗ ${unjudged} image(s) with no verdict, ${orphaned} verdict(s) with no image`);
    return 1;
  }
  if (bad) return 1;
  console.log(check ? "✓ every image is judged and every verdict lands" : "✓ written");
  return 0;
}

if (import.meta.main) process.exit(run());
