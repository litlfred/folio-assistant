/**
 * Where a catalogue bitstream's bytes are.
 *
 * @module who-iris/scripts/lib/bytes
 *
 * **This was the `yl5w` workaround, and `yl5w` is settled.** Every `localPath`
 * on an ORIGINAL bitstream pointed at `who-iris/uploads/…` while the bytes sat
 * in `cat-harness/uploads/` — #477 moved `library/` and left the sources
 * behind — so this module resolved the declared path first and fell back to
 * the real location. Two consumers needed it: the page generator, to emit a
 * link that works, and the cover renderer, to have something to render.
 *
 * 2026-09-21 the owner ruled that a folio's sources live in the folio. The
 * three PDFs were `git mv`-ed to `who-iris/uploads/<slug>/`, beside each item's
 * own `intake.json` and IRIS capture, and `check:catalogue` now verifies every
 * `localPath`. **So the fallback is gone rather than left in place**, and that
 * is what the old note promised: the declared path was already tried first, so
 * settling the bean was a deletion rather than a rewrite.
 *
 * What survives is the resolver itself, because the two consumers still need
 * one answer rather than two — and because `undefined` is a real outcome. A
 * node may name no `localPath` at all, and **that is not the same as naming one
 * that is missing**: the first is a bitstream this repository does not hold,
 * the second is a claim that failed, and `check:catalogue` is what reports the
 * second. A generator that conflated them would print "no asset" over a defect.
 */
import { existsSync } from "fs";
import { join, resolve } from "path";

const INSTANCE = resolve(import.meta.dir, "..", "..");
const REPO = resolve(INSTANCE, "..");

/**
 * The declared path, resolved — and nothing else is tried.
 *
 * Instance-relative, per `MaterializationSchema.localPath`: *"where the bytes
 * landed, instance-relative"*. Searching elsewhere is what the removed
 * fallback did, and it is precisely what made the contract unenforceable —
 * a resolver that finds the file one instance over reports a false claim as
 * true, which is the defect `yl5w` was opened for.
 *
 * `name` is no longer read. It stays in the signature because both callers
 * pass it and it is what a future fixity check would compare against; drop it
 * only alongside them.
 */
export function bytesFor(localPath: string | undefined, _name: string): string | undefined {
  if (localPath === undefined) return undefined;
  const p = join(INSTANCE, localPath);
  return existsSync(p) ? p : undefined;
}

/** A resolved path, made repository-relative — what a raw or CDN URL is built from. */
export function repoRelative(abs: string): string {
  return abs.slice(REPO.length + 1);
}

export { INSTANCE, REPO };
