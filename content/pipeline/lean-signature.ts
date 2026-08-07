#!/usr/bin/env bun
/**
 * Statement-level hashing for `.lean` files.
 *
 * ## Why
 *
 * A QA sidecar entry goes stale when a file it depends on changes. For
 * `.lean` that was always the whole file, so **rewriting a proof body
 * invalidated criteria that only look at the statement** —
 * `proof-narrative-lean-equiv` (does the narrative match the signature?)
 * and `proof-statement-integrity` (did the signature change?). Both are
 * `automated: false`, so each spurious invalidation re-queued an agent
 * adjudication whose answer could not have changed.
 *
 * This extracts just the declaration signatures — everything before each
 * declaration's `:=` or `where` — and hashes those.
 *
 * ## Approximate, and deliberately fail-safe
 *
 * The split is lexical: no elaboration, no scope tracking. So it can be
 * wrong. The design makes the wrong direction the safe one:
 *
 * - Cannot lex the file into declarations ⇒ return `undefined`, and the
 *   caller falls back to the whole-file hash. Over-invalidates.
 * - Unsure where a signature ends ⇒ take MORE text, not less. A proof
 *   fragment leaking into the "signature" causes a spurious
 *   invalidation (wasted work); a signature fragment leaking into the
 *   "proof" would cause a MISSED one — a stale verdict presented as
 *   fresh. Only the first is acceptable.
 *
 * @module content/pipeline/lean-signature
 */

import { createHash } from "crypto";
import { existsSync, readFileSync } from "fs";
import { splitDeclarations, stripLeanComments } from "./lean-atlas-ingest";

/** Same 12-char SHA-256 prefix convention as `qa-utils.hashFile`. */
function sha12(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex").slice(0, 12);
}

/**
 * Concatenated declaration signatures, in source order.
 *
 * Exported for testing and for callers that want to diff signatures
 * rather than compare hashes.
 *
 * Returns `undefined` when the source yields no recognisable
 * declarations — a `.lean` of pure `notation`/`macro`/`open`, an empty
 * stub, or anything the lexer does not understand. That is the
 * fail-safe path, not an error.
 */
export function leanSignatures(src: string): string | undefined {
  const decls = splitDeclarations(stripLeanComments(src));
  if (decls.length === 0) return undefined;
  // Name is included: renaming a declaration is a statement change even
  // when the type is untouched.
  return decls.map((d) => `${d.name}\n${d.signature.trim()}`).join("\n---\n");
}

/**
 * Statement-level hash of a `.lean` file.
 *
 * `undefined` when the file is absent or has no lexable declarations —
 * callers must then fall back to the whole-file hash.
 */
export function leanStatementHash(path: string | undefined): string | undefined {
  if (!path || !existsSync(path)) return undefined;
  let src: string;
  try {
    src = readFileSync(path, "utf-8");
  } catch {
    return undefined;
  }
  const sigs = leanSignatures(src);
  return sigs === undefined ? undefined : sha12(sigs);
}

// ── CLI ─────────────────────────────────────────────────────────────

if (import.meta.main) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log(`Statement-level hashing for .lean files.

  bun run content/pipeline/lean-signature.ts <file.lean> [--show]

  --show   print the extracted signatures instead of the hash

Used by the QA staleness layer so a proof-body edit does not invalidate
criteria that only depend on the statement.`);
    process.exit(2);
  }
  const show = args.includes("--show");
  const file = args.find((a) => !a.startsWith("--"))!;
  if (!existsSync(file)) {
    console.error(`no such file: ${file}`);
    process.exit(2);
  }
  const src = readFileSync(file, "utf-8");
  const sigs = leanSignatures(src);
  if (sigs === undefined) {
    console.log("(no lexable declarations — staleness falls back to the whole-file hash)");
    process.exit(1);
  }
  console.log(show ? sigs : leanStatementHash(file));
}
