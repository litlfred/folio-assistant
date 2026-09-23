#!/usr/bin/env bun
/**
 * Every INSTANTIATED harness has an avatar of its own — the instance axis.
 *
 * @module scripts/check-avatar-instances
 *
 * ## Why this exists, and what it cost not to
 *
 * `harness-tiles.ts` carries this in its header:
 *
 * > An instance with no avatar of its own takes `GENERIC`, which is **reported
 * > as a finding** rather than rendered as a blank.
 *
 * **Nothing reported it.** `genericAvatar` is computed on every tile and read
 * by no one — measured 2026-09-22, two references in the whole corpus, both
 * the field's own declaration and its assignment. So a harness with no avatar
 * rendered a question mark and said nothing, and the defect surfaced the only
 * way left: the owner looked at the site and said *"folio assistant icon is
 * messed up still."*
 *
 * `schemas/avatars.ts` names the gap too — *"`harness-tiles` calls
 * `avatarFor(decl.name)` — an INSTANCE's declared name … nothing currently
 * checks"* — and points at bean `4kj4` for it. `4kj4` turned out to be about
 * the per-KIND fan, so that pointer was stale as well; this is the check both
 * comments describe.
 *
 * ## The kind axis is `check-avatar-coverage`, and they are different questions
 *
 * That one asks whether every declared graph KIND has art. This asks whether
 * every INSTANTIATED harness does. The table serves both key spaces, which is
 * exactly why one check over it cannot answer both.
 *
 * ## Instantiated, not merely declared
 *
 * The subject is a `<name>.config.json` at the repository root — the same
 * fact the navbar's harness tiles filter on, and the one `harness-tiles.ts`
 * calls `instantiated`. A dependency that is present but not instantiated
 * renders no tile, so it owes no mark.
 *
 * ## EXEMPT carries a reason, and a stale entry is itself a finding
 *
 * A content library's mark is its own. `who-iris` and `smart-trust` replicate
 * someone else's identity, and choosing a glyph for them here would be this
 * repository inventing a mark for an organisation that has one. They are
 * exempt WITH THAT REASON, printed on every clean run so the hand-maintained
 * part is visible when it passes rather than only when it fails — the shape
 * `check-invocation-parity` already uses. An exemption naming an instance
 * that no longer exists, or one that has since declared an avatar, fails.
 *
 * Exit codes: 0 clean · 1 an instantiated harness has no avatar, or an
 * exemption is stale.
 */
import { readdirSync } from "node:fs";
import { resolve } from "node:path";

import { hasAvatar } from "../schemas/avatars.js";
import { repoRootFor } from "../schemas/cat-harness.js";

/**
 * The repository root, from THIS FILE rather than from `process.cwd()`.
 *
 * `repoRootFor(process.cwd())` was the first attempt and it walks up from
 * wherever it is handed: run from the repository root it returned the
 * PARENT, found no `*.config.json`, and reported 0 instantiated harnesses.
 * Resolving from `import.meta.dir` — `cat-harness/scripts` — gives the same
 * answer wherever the command is run from, which is what every sibling check
 * here does.
 *
 * It surfaced as the exemptions reading stale, not as a silent pass: with no
 * instances found, `who-iris` and `smart-trust` were "gone", which is a
 * finding. The guard caught the check's own misconfiguration before the
 * check could report a clean run over nothing — `dh4f`, avoided rather than
 * repeated.
 */
const REPO = repoRootFor(resolve(import.meta.dir, ".."));

/**
 * Why an instantiated harness may carry no mark of its own.
 *
 * `who-iris` LEFT THIS LIST on 2026-09-23, and the exemption's own rule is
 * what removed it: an entry naming an instance that has since declared an
 * avatar fails, and this check reported exactly that before anyone noticed.
 *
 * The reason it carried — *"its mark is not this repository's to choose"* —
 * was about the LOGO, and the owner has now separated the two: *"no logo on
 * who-iris icon (for now). just WHO blue"*. Using an organisation's published
 * colour with a neutral glyph is not inventing its identity, which is what the
 * exemption existed to prevent. `smart-trust` still carries art of its own and
 * is unaffected either way.
 */
export const EXEMPT: Readonly<Record<string, string>> = {
  "smart-trust": "a content library replicating WHO's identity — its mark is not this repository's to choose",
};

/** Every instantiated harness: a `<name>.config.json` at the repository root. */
export function instantiatedNames(root: string): string[] {
  return readdirSync(root)
    .filter((f) => f.endsWith(".config.json"))
    .map((f) => f.slice(0, -".config.json".length))
    .sort();
}

export interface Report {
  missing: string[];
  exemptUsed: string[];
  /** An exemption for an instance that is gone, or that now declares art. */
  staleExemptions: string[];
}

export function report(names: string[]): Report {
  const missing: string[] = [];
  const exemptUsed: string[] = [];
  for (const n of names) {
    if (hasAvatar(n)) continue;
    if (n in EXEMPT) exemptUsed.push(n);
    else missing.push(n);
  }
  // A STALE EXEMPTION IS A FINDING, not a tidy-up: it means somebody declared
  // art and the note saying they had not is still being printed as fact.
  const staleExemptions = Object.keys(EXEMPT)
    .filter((n) => !names.includes(n) || hasAvatar(n))
    .sort();
  return { missing, exemptUsed: exemptUsed.sort(), staleExemptions };
}

export function format(r: Report, total: number): string {
  const lines: string[] = [`Instance avatars (${total} instantiated harness(es))`];
  for (const n of r.exemptUsed) lines.push(`  · exempt  ${n} — ${EXEMPT[n]}`);
  for (const n of r.missing) {
    lines.push(`  ✗ ${n}: no avatar of its own — renders the GENERIC question mark`);
  }
  for (const n of r.staleExemptions) {
    lines.push(`  ✗ EXEMPT names ${n}, which is gone or now declares an avatar — the note is no longer true`);
  }
  if (!r.missing.length && !r.staleExemptions.length) {
    lines.push("  ✓ every instantiated harness has a mark, or an exemption that still holds");
  }
  return lines.join("\n");
}

if (import.meta.main) {
  const names = instantiatedNames(REPO);
  const r = report(names);
  console.log(format(r, names.length));
  if (r.missing.length || r.staleExemptions.length) process.exit(1);
}
