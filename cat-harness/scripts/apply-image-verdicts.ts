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
 *   bun run cat-harness/scripts/apply-image-verdicts.ts            # apply
 *   bun run cat-harness/scripts/apply-image-verdicts.ts --check    # report only
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { AttributionSchema } from "../schemas/attribution.ts";
import { directoriesForGraph } from "../schemas/cat-harness.js";
import {
  DESCRIBABLE_ROLES,
  ImagesSidecarSchema,
  SETTLED_BY_COMPUTATION,
  requiresInspection,
  type ImageRole,
} from "../schemas/document-image.ts";

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
  const declared = directoriesForGraph(ROOT, "library");
  return declared.length > 0 ? declared : [join(ROOT, "library")];
})();

interface Verdict {
  role: ImageRole;
  saw: string;
  draft: string;
}
interface VerdictFile {
  inspected_by: unknown;
  inspected_at: string;
  verdicts: Record<string, Record<string, Verdict>>;
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
    const narrative = DESCRIBABLE_ROLES.includes(v.role)
      ? {
          text: v.draft,
          state: "draft" as const,
          drafted_by: AttributionSchema.parse(by),
          drafted_at: at,
        }
      : undefined;
    return {
      ...img,
      role: v.role,
      basis: { method: "inspection" as const, by: AttributionSchema.parse(by), at, saw: v.saw, page },
      ...(narrative ? { narrative } : {}),
    };
  });

  const orphaned = Object.keys(docVerdicts).filter((id) => !seen.has(id));
  const out = { ...parsed, images: next };
  // Validated on the way OUT as well as in: the refinements are the point of
  // the exercise, and a writer that skips them can emit what a reader refuses.
  ImagesSidecarSchema.parse(out);
  return {
    text: JSON.stringify(out, null, 2) + "\n",
    result: { applied: seen.size, unjudged, orphaned },
  };
}

function run(): number {
  const check = process.argv.includes("--check");
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
      const { text, result } = applyTo(
        readFileSync(path, "utf-8"),
        docVerdicts,
        verdicts.inspected_by,
        verdicts.inspected_at,
      );
      if (!check) writeFileSync(path, text, "utf-8");
      results.push({ docId, ...result });
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
