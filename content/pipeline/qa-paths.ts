#!/usr/bin/env bun
/**
 * Where a BLOCK's QA verdict lives — one answer, for every writer and reader.
 *
 * ## The convention this replaces, and what it cost to replace
 *
 * A block is a family of companion files sharing one path prefix: `block.root`
 * is the `.ts` manifest minus its extension, and `${root}.md`, `${root}.lean`
 * and `${root}.qa.json` are its siblings. The verdict was simply one member of
 * that family, which is why nine sites across this pipeline each composed its
 * path by hand rather than calling anything — it was not a lookup, it was a
 * convention every reader already knew.
 *
 * Moving it is the owner's decision (2026-09-19): an artefact generated
 * primarily as a QA reviewer belongs under `test/results/` as part of a QA
 * process, and placement follows provenance. This module is what makes that
 * survivable — nine hand-composed paths become one function, so the family is
 * broken in exactly one place instead of nine.
 *
 * ## The tree MIRRORS the block's directory
 *
 * `content/docs/evidence/overview.qa.json` becomes
 * `test/results/block-qa/content/docs/evidence/overview.qa.json`.
 *
 * Flat would collide: block stems repeat freely across chapters, far more than
 * the four collisions measured in the KG corpus. Mirroring also keeps the
 * chapter legible in the path, which is what a reader opening a verdict needs.
 *
 * ## Reading falls back; writing never does
 *
 * {@link blockQaReadPaths} returns the results-tree location FIRST and the
 * legacy sibling SECOND. That asymmetry is the whole compatibility story:
 *
 * - A downstream folio has its verdicts committed beside its blocks. If this
 *   platform only looked in the results tree, every one of those folios would
 *   report every block as unaudited the day it upgraded — a false pass at
 *   corpus scale, which is the failure direction this repository guards
 *   against everywhere else.
 * - Writing to the legacy location as well would create two verdicts for one
 *   block that can disagree, and nothing would say which is current.
 *
 * So: read both, prefer the new, write only the new. A folio migrates by
 * running its sweep once.
 *
 * @module content/pipeline/qa-paths
 */
import { join, relative } from "node:path";
import { existsSync } from "node:fs";

/** Where block verdicts live now, relative to the instance root. */
export const BLOCK_QA_RESULTS_DIR = join("test", "results", "block-qa");

/** The sidecar suffix. One spelling, so a scan and a compose cannot disagree. */
export const BLOCK_QA_SUFFIX = ".qa.json";

/**
 * The canonical write location for a block's verdict.
 *
 * @param repoRoot  absolute instance root
 * @param blockRoot absolute block path prefix — the `.ts` manifest without its
 *                  extension, i.e. `block.root`
 */
export function blockQaPath(repoRoot: string, blockRoot: string): string {
  // `relative` rather than string surgery, so two spellings of one directory
  // cannot land on two different results paths.
  return join(repoRoot, BLOCK_QA_RESULTS_DIR, relative(repoRoot, blockRoot) + BLOCK_QA_SUFFIX);
}

/** The legacy location: the verdict as a companion of the block. */
export function legacyBlockQaPath(blockRoot: string): string {
  return blockRoot + BLOCK_QA_SUFFIX;
}

/**
 * Every place a block's verdict might be, newest convention first.
 *
 * Callers that want "the one that counts" take the first entry that exists;
 * callers auditing for duplicates want the whole list.
 */
export function blockQaReadPaths(repoRoot: string, blockRoot: string): string[] {
  return [blockQaPath(repoRoot, blockRoot), legacyBlockQaPath(blockRoot)];
}

/**
 * The verdict to READ for a block, or `undefined` when it has none.
 *
 * `undefined` means genuinely unaudited. It is never returned because the
 * caller looked in the wrong place — that is the point of the fallback.
 */
export function existingBlockQaPath(repoRoot: string, blockRoot: string): string | undefined {
  return blockQaReadPaths(repoRoot, blockRoot).find((p) => existsSync(p));
}

/**
 * The block manifest a results-tree verdict belongs to.
 *
 * The inverse of {@link blockQaPath}, and it exists for one caller:
 * `no-orphan-sidecar` in `validate.ts`. That check asks whether a verdict's
 * `.ts` still exists, and it used to answer by looking in the same directory —
 * pure adjacency, which the move removes.
 *
 * **Keeping that check working is not optional.** It catches a block moving
 * between chapters and leaving a verdict behind, computed against content that
 * has since changed; measured in `qou`, 18 orphans, 5 of them from moves. A
 * relocation that quietly dropped it would trade a real safety property for a
 * tidier layout.
 *
 * Returns `undefined` for a path that is not under the results tree, so a
 * caller cannot accidentally map a legacy sibling onto itself.
 */
export function blockOfQaPath(repoRoot: string, qaPath: string): string | undefined {
  const base = join(repoRoot, BLOCK_QA_RESULTS_DIR);
  const rel = relative(base, qaPath);
  if (rel.startsWith("..") || !rel.endsWith(BLOCK_QA_SUFFIX)) return undefined;
  return join(repoRoot, rel.slice(0, -BLOCK_QA_SUFFIX.length) + ".ts");
}
