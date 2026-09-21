/**
 * Where a catalogue bitstream's bytes actually are, as opposed to where the
 * catalogue says they are.
 *
 * @module who-iris/scripts/lib/bytes
 *
 * **This is the `yl5w` workaround, stated ONCE.** Every `localPath` on an
 * ORIGINAL bitstream in this catalogue points at `who-iris/uploads/…`, and all
 * of them are missing: #477 moved `library/` and left `uploads/` behind, so the
 * bytes are under `cat-harness/uploads/`. `check:catalogue` validates
 * `metadataRef`, `libraryId` and `parents` and does not look at `localPath` at
 * all, which is how three `materialized` claims resolved to nothing while the
 * gate printed "clean".
 *
 * Two consumers need the real location — the page generator, to emit a link
 * that works, and the cover renderer, to have something to render. It lived in
 * the page generator and was about to be copied into the second, which is the
 * point at which a workaround becomes folklore: the copy that is not fixed
 * when `yl5w` is fixed outlives it silently.
 *
 * When `yl5w` is settled — either the uploads move under `who-iris/`, or
 * `localPath` becomes repository-relative — this module is the one edit, and
 * the `DECLARED_FIRST` order below is what makes that edit a deletion rather
 * than a rewrite: the declared path is already tried first, so the fallback
 * simply stops being reached.
 */
import { existsSync } from "fs";
import { join, resolve } from "path";

const INSTANCE = resolve(import.meta.dir, "..", "..");
const REPO = resolve(INSTANCE, "..");

/**
 * Candidate locations, **declared path first**.
 *
 * Order is the contract. A resolver that preferred the fallback would keep
 * working after the declaration is fixed and would keep reading the old copy
 * if both existed — a silently stale answer, which is worse than the missing
 * file it was written to work around.
 */
export function bytesFor(localPath: string | undefined, name: string): string | undefined {
  const candidates = [
    // The declaration, honoured first. Instance-relative, per
    // `MaterializationSchema.localPath`.
    localPath ? join(INSTANCE, localPath) : undefined,
    // The fallback, and the reason this module exists.
    join(REPO, "cat-harness", "uploads", name),
  ].filter((p): p is string => p !== undefined);
  return candidates.find((p) => existsSync(p));
}

/** A resolved path, made repository-relative — what a raw or CDN URL is built from. */
export function repoRelative(abs: string): string {
  return abs.slice(REPO.length + 1);
}

export { INSTANCE, REPO };
