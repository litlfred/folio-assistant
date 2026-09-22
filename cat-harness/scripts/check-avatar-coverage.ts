#!/usr/bin/env bun
/**
 * Every declared kind has an avatar — and every gap is a finding.
 *
 * @module scripts/check-avatar-coverage
 *
 * Owner, 2026-09-19: *"QA sidescares if avatar thems not fully done."*
 *
 * ## Why this is a QA result and not an assertion
 *
 * The kind vocabulary is OPEN — `BASE_GRAPH_KINDS` is an open registry and
 * an `fsh-guts` node's `kind` is deliberately a free string. So a missing
 * avatar is not a build error: it is a fact about how far the art has got,
 * and it must read as MISSING rather than as a blank the viewer silently
 * tolerates. That is the third-state rule applied to pictures.
 *
 * A written result rather than a printed one, for the reason
 * `check-workflow-refs` paid for: a console report's previous answer is
 * gone, which makes "this kind has never had art" and "this kind lost its
 * art in the commit under review" indistinguishable.
 *
 * ## What it checks, and what it deliberately does NOT
 *
 * The trash state is DERIVED from the base glyph (see `schemas/avatars.ts`),
 * so trash coverage cannot be missing and checking it would be a criterion
 * that can never fail — which reads as coverage while measuring nothing.
 * This asserts the derivation is in place ONCE, and spends its per-kind
 * attention on the cell that can actually be empty.
 *
 * Exit codes: 0 clean · 1 a declared kind has no avatar (under `--check`).
 */
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { AVATARS, GENERIC, hasAvatar } from "../schemas/avatars.js";
import {
  BASE_GRAPH_KINDS,
  defaultGraphKinds,
  isPublishedGraphKind,
  readDeclaration,
} from "../schemas/cat-harness.js";
import { avatarsCssPath } from "./gen-avatars-css.js";
import { buildQaResult, writeQaResult } from "./qa-results.js";

const ROOT = resolve(import.meta.dir, "..");

export interface CoverageGap {
  kind: string;
  where: string;
  note: string;
}

export interface Coverage {
  /** Kinds that must have art, from the registry and the instance. */
  required: string[];
  /** Those with none — each falls back to the question mark. */
  missing: CoverageGap[];
  /** Avatars declared for a kind nothing declares. Not a defect, but drift. */
  orphaned: string[];
  /** Kinds this instance itself declares, before inheritance. */
  declared: string[];
}

/**
 * Which kinds need art.
 *
 * The registry's kinds PLUS whatever this instance declares, because the two
 * differ: an instance may declare a kind the base registry never heard of,
 * and that is exactly the case an open vocabulary exists to allow.
 *
 * `fsh-guts` is included even though it is stripped from published graphs —
 * the VIEWER shows it, which is the whole of bean `7vhe`, and a kind whose
 * art is missing there is missing where a reader looks.
 */
export function requiredKinds(root: string = ROOT): { required: string[]; declared: string[] } {
  // THREE sources, unioned, and the first two are not the same thing.
  //
  // `defaultGraphKinds` is a LIVE registry that modules write into on import,
  // so reading it alone makes this check's answer depend on what the calling
  // process happened to load. Measured: run from the CLI it saw 16 kinds and
  // reported full coverage; run inside the test suite it saw 17, and the
  // seventeenth was `folio` — the one renderable kind, with no avatar. A
  // check whose result changes with the importer is not a check.
  const registry = [...new Set([...Object.keys(BASE_GRAPH_KINDS), ...defaultGraphKinds.names()])];
  let declared: string[] = [];
  try {
    const d = readDeclaration(root);
    declared = [...new Set((d?.directories ?? []).flatMap((x) => x.graphKinds ?? []))];
  } catch {
    // An unreadable declaration is the instance's problem to fix, not this
    // check's to guess around; the registry half still reports.
  }
  return { required: [...new Set([...registry, ...declared])].sort(), declared: declared.sort() };
}

export function coverage(root: string = ROOT): Coverage {
  const { required, declared } = requiredKinds(root);
  const missing: CoverageGap[] = [];
  for (const kind of required) {
    if (hasAvatar(kind)) continue;
    missing.push({
      kind,
      where: "schemas/avatars.ts",
      note:
        `no avatar is declared, so this kind renders as the generic question mark` +
        (isPublishedGraphKind(kind) ? "" : " (an unpublished kind — still shown in the viewer)"),
    });
  }
  const orphaned = Object.keys(AVATARS)
    .filter((k) => !required.includes(k))
    .sort();
  return { required, missing, orphaned, declared };
}

/** Is the trash state actually derived, rather than silently absent? */
export function trashDerivationPresent(root: string = ROOT): boolean {
  const path = join(root, avatarsCssPath(root));
  if (!existsSync(path)) return false;
  const css = readFileSync(path, "utf8");
  return css.includes('[data-fa-trash="true"]') && css.includes("--fa-avatar-glyph");
}

if (import.meta.main) {
  const check = process.argv.includes("--check");
  const c = coverage(ROOT);
  const derived = trashDerivationPresent(ROOT);

  writeQaResult(
    ROOT,
    "avatar-coverage",
    buildQaResult({
      script: "scripts/check-avatar-coverage.ts",
      scriptAbsPath: join(ROOT, "scripts/check-avatar-coverage.ts"),
      subject: { kind: "avatars", id: "avatar-coverage" },
      families: {
        "kind-has-avatar": {
          summary:
            `Every declared kind has an avatar of its own. A kind with none renders as ` +
            `the generic question mark — deliberately a gap rather than a neutral mark, ` +
            `because a reader must be able to tell "no art yet" from "this is what it looks like".`,
          entries: c.missing,
        },
        "avatar-has-kind": {
          summary:
            `An avatar for a kind nothing declares. Not a defect — the vocabulary is open and ` +
            `a folio may declare it — but it is how a registry drifts away from the instances ` +
            `that use it, so it is reported rather than pruned.`,
          entries: c.orphaned.map((kind) => ({ kind, note: "declared by no directory in this instance" })),
        },
        "trash-state-derived": {
          summary:
            `The trash state is composed from the base glyph rather than drawn per kind, so ` +
            `its coverage cannot lag. Asserted ONCE: a per-kind criterion here could never ` +
            `fail, which would read as coverage while measuring nothing.`,
          entries: derived
            ? []
            : [{ note: "avatars.css carries no [data-fa-trash] rule — run `bun run avatars:css`" }],
        },
      },
    }),
  );

  console.log(`Avatar coverage  (${c.required.length} kinds required, ${Object.keys(AVATARS).length} declared)`);
  console.log(`  ✓ ${c.required.length - c.missing.length} covered`);
  if (c.missing.length) {
    console.log(`  ✗ ${c.missing.length} with no avatar — each falls back to "${GENERIC.reads}":`);
    for (const m of c.missing) console.log(`      · ${m.kind}`);
  }
  if (c.orphaned.length) {
    console.log(`  · ${c.orphaned.length} avatar(s) for a kind this instance does not declare:`);
    for (const o of c.orphaned) console.log(`      · ${o}`);
  }
  console.log(derived ? "  ✓ the trash state is derived" : "  ✗ the trash state is NOT derived");

  if (check && (c.missing.length > 0 || !derived)) process.exit(1);
}
