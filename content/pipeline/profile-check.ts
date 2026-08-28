/**
 * Check a folio's blocks against the content profile it declares.
 *
 * ## What this catches that schema validation cannot
 *
 * `content_validate` checks each block against its own Zod schema and the
 * constraint table. Both are profile-blind by construction: a `theorem` is a
 * valid `theorem` whatever kind of folio it sits in, and `constraints.ts`
 * has no way to know that this repo's `folio.config.json` says `document`.
 *
 * So a document folio can accumulate math blocks — most easily by an agent
 * reaching for `theorem` out of habit, or by a paper folio being re-declared
 * as a document — and nothing says a word until publication, when the render
 * needs a `.lean` file and a TeX installation the folio was set up without.
 * This is the check that turns that into an error at authoring time.
 *
 * Two rules, both from `schemas/block-kinds.ts`:
 *
 * 1. every block's kind is in the declared profile
 *    ({@link kindsOutsideProfile}); and
 * 2. in the `document` profile, no block carries a `lean` field at all
 *    ({@link DOCUMENT_FORBIDS_LEAN}) — several document kinds *declare* one
 *    as optional, so rule 1 alone would let a `remark` smuggle in a
 *    formalization the folio has no toolchain to check.
 *
 * @module content/pipeline/profile-check
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";

import {
  DOCUMENT_FORBIDS_LEAN,
  profileAcceptsKind,
  profileForContentType,
  type ContentProfile,
} from "../../schemas/block-kinds";
import { walkBlocks } from "./qa-utils";

export interface ProfileViolation {
  label: string;
  kind: string;
  /** Absolute path to the offending `.ts` manifest. */
  ts: string;
  reason: "kind-outside-profile" | "lean-in-document";
  detail: string;
}

export interface ProfileCheckResult {
  /** The profile the folio declares. */
  profile: ContentProfile;
  /** Where that came from, for a report that can be acted on. */
  declaredBy: string;
  blocksChecked: number;
  violations: ProfileViolation[];
}

/**
 * Read the profile a folio declares.
 *
 * A folio with no `folio.config.json` reads as `paper` — see
 * {@link profileForContentType} for why the wider profile is the safe
 * default. `declaredBy` records which it was, so a report never leaves the
 * reader guessing whether the profile was chosen or inherited.
 */
export function readFolioProfile(repoRoot: string): { profile: ContentProfile; declaredBy: string } {
  const configPath = join(repoRoot, "folio.config.json");
  if (!existsSync(configPath)) {
    return { profile: "paper", declaredBy: "default (no folio.config.json)" };
  }
  try {
    const config = JSON.parse(readFileSync(configPath, "utf-8")) as { contentType?: string };
    if (!config.contentType) {
      return { profile: "paper", declaredBy: "default (folio.config.json declares no contentType)" };
    }
    return {
      profile: profileForContentType(config.contentType),
      declaredBy: `folio.config.json contentType: "${config.contentType}"`,
    };
  } catch (e) {
    // A config that will not parse is reported, not silently defaulted: the
    // folio's whole configuration is unread in that state and every other
    // tool reading it is equally in the dark.
    return {
      profile: "paper",
      declaredBy: `default (folio.config.json unreadable: ${e instanceof Error ? e.message : String(e)})`,
    };
  }
}

/**
 * Does this block manifest populate a `lean` field?
 *
 * Read textually rather than by importing the module, matching how
 * `walkBlocks` identifies blocks in the first place: importing runs the file,
 * and the whole point of this check is that it is cheap enough to run on
 * every block on every validate.
 *
 * A sibling `.lean` file counts too. A block can carry formalization by
 * convention (`<root>.lean` beside `<root>.ts`) without naming it in the
 * manifest, and a document folio should not hold one of those either.
 */
function declaresLean(tsPath: string, root: string): string | undefined {
  if (existsSync(`${root}.lean`)) return `sibling ${root.split("/").pop()}.lean exists`;
  const src = readFileSync(tsPath, "utf-8");
  // `lean:` as an object key — the manifests are object literals, so a
  // property assignment is the only way the field gets populated.
  return /^\s*lean\s*:/m.test(src) ? "manifest declares a `lean` field" : undefined;
}

/**
 * Check every block under `contentRoot` against `repoRoot`'s declared profile.
 *
 * @param repoRoot - Folio repo root, holding `folio.config.json`.
 * @param contentRoot - Directory to walk. Defaults to `<repoRoot>/content`.
 */
export function checkFolioProfile(repoRoot: string, contentRoot?: string): ProfileCheckResult {
  const { profile, declaredBy } = readFolioProfile(repoRoot);
  const root = contentRoot ?? join(repoRoot, "content");
  const violations: ProfileViolation[] = [];
  let blocksChecked = 0;

  if (!existsSync(root)) {
    return { profile, declaredBy, blocksChecked: 0, violations: [] };
  }

  for (const block of walkBlocks(root, { includeUnlabelled: true })) {
    blocksChecked++;

    if (!profileAcceptsKind(profile, block.kind)) {
      violations.push({
        label: block.label,
        kind: block.kind,
        ts: block.ts,
        reason: "kind-outside-profile",
        detail:
          `kind \`${block.kind}\` is not in the \`${profile}\` profile. ` +
          (profile === "document"
            ? "A document folio holds no blocks whose assertion is a formal mathematical claim — " +
              "declare `contentType: \"paper\"` if this folio needs them."
            : `No profile admits \`${block.kind}\`; it may belong to another adapter.`),
      });
      continue;
    }

    if (profile === "document" && DOCUMENT_FORBIDS_LEAN) {
      const how = declaresLean(block.ts, block.root);
      if (how) {
        violations.push({
          label: block.label,
          kind: block.kind,
          ts: block.ts,
          reason: "lean-in-document",
          detail:
            `${how}, but a document folio has no Lean toolchain to check it. ` +
            "Either drop the formalization or declare `contentType: \"paper\"`.",
        });
      }
    }
  }

  return { profile, declaredBy, blocksChecked, violations };
}

/** Render a result as the report a human or an agent reads. */
export function formatProfileCheck(result: ProfileCheckResult): string {
  const head =
    `Profile: ${result.profile} (${result.declaredBy})\n` +
    `Blocks checked: ${result.blocksChecked}`;
  if (result.violations.length === 0) {
    return `${head}\n✓ Every block is within the declared profile.`;
  }
  const lines = [head, `✗ ${result.violations.length} block(s) outside the profile:`, ""];
  for (const v of result.violations) {
    lines.push(`  ${v.label} (${v.kind})`);
    lines.push(`    ${v.detail}`);
    lines.push(`    ${v.ts}`);
  }
  return lines.join("\n");
}
