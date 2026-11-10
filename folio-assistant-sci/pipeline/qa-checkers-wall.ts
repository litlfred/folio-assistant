/**
 * The archimedean-wall and canonical-framework QA checkers —
 * `framework-canonical`, `wall-side-correct`, `wall-base-ring-minimal`.
 *
 * Moved from cat-harness-tools' `pipeline/qa-checkers-voice.ts` (bean saqd,
 * row 9), unchanged. They read one folio's mathematics: its canonical
 * notation, and its §7c substrate-to-archimedean wall in the block's
 * `.lean`. The voice checkers they sat beside are generic prose checks and
 * stay there; the registry entries for these three say
 * `checker_contributed`, and this instance contributes them through
 * `qa-checkers/<criterion>.json`, which names WALL_AUTOMATED_CHECKERS.
 *
 * `ARCHIMEDEAN_TYPE_RE` stays in cat-harness-tools, because its
 * `check-mirror-drift.ts` applies it to field types; it is imported from
 * there, down, rather than copied.
 *
 * @module folio-assistant-sci/pipeline/qa-checkers-wall
 */

import { existsSync, readFileSync } from "fs";
import type { CheckerPaths, CheckerHit, CheckerResult } from "../../cat-harness-tools/schemas/sdlc/block-qa.ts";
import { ARCHIMEDEAN_TYPE_RE } from "../../cat-harness-tools/pipeline/qa-checkers-voice.ts";

export { ARCHIMEDEAN_TYPE_RE };

function readLines(path: string): string[] {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf-8").split("\n");
}

// ── framework-canonical ─────────────────────────────────────────

/**
 * Deprecated notation patterns. Each pattern is a regex that must
 * NOT match outside fenced code blocks. We exempt explicit
 * "deprecated:" callouts so the paper can DISCUSS the old form.
 *
 * Patterns kept conservative — the goal is "flag for review", not
 * "auto-rewrite". The watcher's discharge band escalates to author
 * for any framework hit.
 */
const DEPRECATED_PATTERNS: Array<{ re: RegExp; what: string }> = [
  // 5-tuple — only flag literal "(M, Θ, G, P, E)" or close variants.
  {
    re: /\(M,\s*\\?varTheta,\s*G,\s*P,\s*E\)|\(M,\s*\\?Theta,\s*G,\s*P,\s*E\)/,
    what: "deprecated 5-tuple (M,Θ,G,P,E) — canonical is (𝐂, Θ, G, 𝒮)",
  },
  // ω for fibre functor — canonical is τ.
  {
    re: /\\omega\s*\\colon\s*\\mathbf\{C\}\s*\\to/,
    what: "deprecated $\\omega$ as fibre functor — canonical is $\\tau$",
  },
  // 𝒞 (calligraphic C) for category — canonical is 𝐂 (bold).
  {
    re: /\\mathcal\{C\}(?!_)/, // allow \mathcal{C}_q-style decorated forms
    what: "deprecated $\\mathcal{C}$ for category — canonical is $\\mathbf{C}$",
  },
  // Bare $H_q$ — three distinct objects share H_q; must be disambiguated.
  {
    re: /\$H_q\$/,
    what: "ambiguous $H_q$ — disambiguate as $\\mathcal{H}_q$, $\\hat{H}_q$, or $H_n(q)$",
  },
];

export function checkFrameworkCanonical(mdPath: string): CheckerResult {
  const lines = readLines(mdPath);
  let inFence = false;
  const hits: CheckerHit[] = [];
  lines.forEach((l, i) => {
    if (/^```/.test(l.trim())) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;
    // Skip lines that explicitly call out the deprecated form
    // (e.g. "deprecated:", "old form", "use ... instead").
    if (/\b(deprecated|legacy|use .* instead|never write)\b/i.test(l)) return;
    for (const { re, what } of DEPRECATED_PATTERNS) {
      if (re.test(l)) {
        hits.push({
          file: mdPath,
          line: i + 1,
          text: `${l.trim().slice(0, 160)}  [${what}]`,
        });
      }
    }
  });
  return { result: hits.length > 0 ? "fail" : "pass", hits };
}

// ── wall-side-correct ───────────────────────────────────────────

/**
 * Heuristic archimedean-marker detection in Lean. A block whose
 * `.lean` mentions any of these is on the archimedean side.
 * Cross-checked against the `.md` to flag mixed claims.
 */
const ARCHIMEDEAN_LEAN_RE =
  /\b(Real\.sqrt|Real\.rpow|Real\.log|Real\.exp|Real\.cos|Real\.sin|Real\.pi|linarith|positivity|norm_num|nlinarith|\(ℝ\)|: ℝ\b|: Real\b|LinearOrderedField)\b/;

const ALGEBRAIC_LEAN_RE = /\b(CommRing|Field|GroupWithZero|\{R : Type\*\}|\(R := |variable \{R\b)/;

/** Acknowledgement of an archimedean specialisation (§7c), matched against
 *  the `.md` narrative + the `.ts` `authorNotes`. Case-insensitive so
 *  `\mathbb{R}` (uppercase R) still matches. Shared by the mixed-signal
 *  ack-escape and the acknowledgement branch below. */
const WALL_ACK_RE =
  /archimedean|over\s+\$?\\?mathbb\{R\}|over\s+ℝ|specialise|specialize|numerical evaluation|codata|experimental|§7c|base.?ring/i;

/**
 * Block is wall-correct iff:
 *   - it has no .lean, OR
 *   - .lean is purely algebraic (no archimedean markers), OR
 *   - .lean is purely archimedean (no generic-R markers in same file),
 *     and the .md does not contradict the placement.
 *
 * Mixed signals (both archimedean AND generic-R markers, or
 * archimedean markers without the .md acknowledging archimedean
 * specialisation) get flagged.
 */
/**
 * Extract the text of a block's `authorNotes` array literal from its
 * `.ts` manifest (best-effort, bracket-depth aware). Per CLAUDE.md §4d,
 * §7c archimedean-specialisation acknowledgements migrate OUT of prose
 * INTO `authorNotes`, so the wall-side acknowledgement check must read
 * them too — otherwise a correctly-migrated note reads as a false fail.
 */
function readAuthorNotesText(tsPath: string | undefined): string {
  if (!tsPath || !existsSync(tsPath)) return "";
  const src = readFileSync(tsPath, "utf-8");
  const m = src.match(/\bauthorNotes\s*:\s*\[/);
  if (!m || m.index === undefined) return "";
  let depth = 0;
  let out = "";
  // Active string delimiter ('"' | "'" | "`") or null when outside a string.
  // Bracket depth is only tracked OUTSIDE string literals, so a `]` inside a
  // note body (markdown links `[t](u)`, footnotes `[1]`, refterms) does not
  // prematurely terminate the array extraction.
  let quote: string | null = null;
  for (let i = m.index + m[0].length - 1; i < src.length; i++) {
    const ch = src[i];
    out += ch;
    if (quote) {
      if (ch === quote && src[i - 1] !== "\\") quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
    } else if (ch === "[") {
      depth++;
    } else if (ch === "]") {
      depth--;
      if (depth === 0) break;
    }
  }
  return out;
}

export function checkWallSide(
  mdPath: string | undefined,
  leanPath: string | undefined,
  tsPath?: string | undefined,
): CheckerResult {
  if (!leanPath || !existsSync(leanPath)) {
    return { result: "pass", hits: [] };
  }
  const leanSrc = readFileSync(leanPath, "utf-8");
  // Strip Lean block comments (/- ... -/) AND line comments (-- ...)
  // to reduce false positives when archimedean markers appear inside
  // narrative comments of an otherwise-algebraic file.
  // Strip Lean block comments (/- ... -/), line comments (-- ...),
  // AND `import ...` lines so that an archimedean/algebraic marker
  // appearing only inside a Mathlib import path (e.g.
  // `Mathlib.Topology.Algebra.Order.Field`) does not falsely flag
  // the file as a mixed substrate-archimedean placement.  Imports
  // declare a dependency; they say nothing about how the body of
  // the file uses ℝ vs a generic ring.
  const stripped = leanSrc
    .replace(/\/-[\s\S]*?-\/|--.*$/gm, "")
    .replace(/^\s*import\s+[^\n]*$/gm, "");
  // Narrow (tactic-inclusive) archimedean signal vs the broadened real-field
  // TYPE signal. Both feed the acknowledgement requirement so that a
  // spaced-`(x : ℝ)` / `→ ℝ` specialisation cannot slip through unacknowledged
  // just because its ℝ is not in a `Real.*` / tactic form.
  const hasRealType = ARCHIMEDEAN_TYPE_RE.test(stripped);
  const isAlgebraic = ALGEBRAIC_LEAN_RE.test(stripped);
  const hits: CheckerHit[] = [];

  // Acknowledgement of an archimedean specialisation — in the `.md` narrative
  // OR the `.ts` `authorNotes` (§4d: §7c banners migrate out of prose into
  // authorNotes). Computed LAZILY (memoised) so the `.md`/`.ts` reads happen
  // only when a mixed-signal or archimedean-ack check actually needs them;
  // a purely-algebraic block pays no acknowledgement IO.
  const mdReadable = !!(mdPath && existsSync(mdPath));
  const tsReadable = !!(tsPath && existsSync(tsPath));
  let ackCache: boolean | undefined;
  const acknowledged = (): boolean => {
    if (ackCache === undefined) {
      const md = mdReadable ? readFileSync(mdPath!, "utf-8") : "";
      ackCache = WALL_ACK_RE.test(md + "\n" + readAuthorNotesText(tsPath));
    }
    return ackCache;
  };

  // Mixed-signal split: a genuine ℝ / Real TYPE (in any form) coexisting with
  // generic-R markers is a "split this file per §7c" placement — UNLESS the
  // block acknowledges the specialisation (§7c), in which case a legitimate
  // generic construction + its ℝ realisation may coexist (an `R → ℝ`
  // realisation map, or a conjecture whose real claim carries generic
  // support), which cannot be cleanly separated. Arithmetic tactics do NOT
  // trigger the split (the bring-residue-resolvent false-positive).
  if (hasRealType && isAlgebraic && !acknowledged()) {
    hits.push({
      file: leanPath,
      line: 1,
      text:
        "Lean file mixes a real-field type (ℝ / Real.* / LinearOrderedField) " +
        "with generic-R (CommRing / {R : Type*}) markers — split into two " +
        "files per CLAUDE.md §7c, OR acknowledge the specialisation (a §7c " +
        "note in authorNotes/.md) if the ℝ realisation legitimately consumes " +
        "the generic construction.",
    });
  }

  // Archimedean-without-acknowledgement. Keyed on the real-field TYPE signal
  // `hasRealType` (`ℝ` / `Real.*` / `LinearOrderedField`), NOT the
  // tactic-inclusive `isArchimedean`. Rationale: `hasRealType`'s `\bReal\b`
  // already subsumes every genuine archimedean construct — the `Real.sqrt` /
  // `Real.exp` / `Real.pi` real-analysis functions all contain `Real` — while
  // deliberately EXCLUDING the bare arithmetic tactics `norm_num` / `linarith`
  // / `positivity` / `nlinarith`, which discharge goals over ℕ/ℤ/ℚ or any
  // ordered ring and are NOT evidence of an ℝ specialisation. Keying on
  // `isArchimedean` (as the prior narrow form did) false-flagged purely
  // algebraic blocks whose only "archimedean" marker was a `norm_num` closing
  // an integer identity (e.g. a partition-function count) — a §7c note there
  // would mislabel generic-ring algebra as archimedean. The broadening from
  // the narrow `\(ℝ\)` / `: ℝ\b` tokens to the bare-`ℝ` `hasRealType` newly
  // requires acknowledgement on every spaced `(x : ℝ)` / `→ ℝ` block; those
  // pre-existing ℝ-specialised blocks are §7c-noted in the same mechanical
  // sweep as this change (the deferred backlog from folio #42/#48 is drained
  // here, minus the tactic-only false positives which now correctly pass).
  if (hasRealType && (mdReadable || tsReadable) && !acknowledged()) {
    hits.push({
      file: leanPath,
      line: 1,
      text:
        "Lean file uses archimedean constructs but neither the .md " +
        "narrative nor the .ts authorNotes acknowledge archimedean " +
        "specialisation. Add a §7c-style note (in authorNotes, per §4d) " +
        "or move the archimedean evaluation to a sibling block.",
    });
  }

  return { result: hits.length > 0 ? "fail" : "pass", hits };
}

// ── wall-base-ring-minimal ──────────────────────────────────────

/**
 * Field markers signalling a construction stated over a FIELD where a
 * division-free restatement over the minimal base ring ℤ[q,q⁻¹]
 * (`LaurentPolynomial ℤ`) / a generic `CommRing` may be possible
 * (CLAUDE.md §7c base-ring convention; the `R[h]` multiplicative-relation
 * pattern — e.g. Borromean `IsBorromeanMarkovTrace h t := (h²+4)·t = num`,
 * or α_EM as `α·[9]_q·[10]_q = q⁻¹` rather than `q⁻¹/([9]_q·[10]_q)`).
 *
 * `⁻¹` and `/` are intentionally EXCLUDED: a `Units` inverse `↑q⁻¹` over a
 * `CommRing` is the *target* division-free pattern, not a violation.
 */
const FIELD_MARKER_RE = /\b(?:Field|DivisionRing|field_simp)\b|ℚ/;
/** Ring-element inverse `q⁻¹` (needs `Inv`/`Field`). A `Units` coercion
 *  `↑q⁻¹` over a `CommRing` is the *target* division-free pattern and is
 *  excluded by the `↑`/`Rˣ`/`Units` guard at the call site. */
const RING_INV_RE = /⁻¹/;

/**
 * `wall-base-ring-minimal` — advisory (warn). Flags ALGEBRAIC-side Lean
 * (no archimedean ℝ markers) carrying field structure (`Field`, `ℚ`,
 * `DivisionRing`, `field_simp`) that may be restatable division-free over
 * ℤ[q,q⁻¹] / `CommRing`. Archimedean-side blocks PASS (a field / ℝ is
 * legitimate post-τ). The reviewer adjudicates whether a field is essential
 * (an inverse not realizable as a unit, archimedean evaluation) or whether
 * the statement is a Laurent identity that should move to the base ring.
 */
export function checkBaseRingMinimal(
  leanPath: string | undefined,
): CheckerResult {
  if (!leanPath || !existsSync(leanPath)) {
    return { result: "pass", hits: [] };
  }
  const leanSrc = readFileSync(leanPath, "utf-8");
  const stripped = leanSrc
    .replace(/\/-[\s\S]*?-\/|--.*$/gm, "")
    .replace(/^\s*import\s+[^\n]*$/gm, "");
  // Archimedean side: a field / ℝ / division is legitimate there.
  //
  // The skip is the UNION of the two archimedean signals, because neither
  // alone covers it. `ARCHIMEDEAN_LEAN_RE` carries the arithmetic tactics
  // (`linarith`/`norm_num`/`positivity`) but its `\(ℝ\)` / `: ℝ\b` tokens
  // cannot fire on spaced Lean forms, since `\b` next to the non-word `ℝ`
  // never matches; `ARCHIMEDEAN_TYPE_RE` catches `ℝ` in any position but
  // deliberately omits those tactics (they discharge goals over any ordered
  // field, so they are not evidence of an ℝ specialisation -- correct for
  // `checkWallSide`'s mixed-signal split, which is where it is used).
  //
  // Swapping the narrow regex for the broad one -- the fix as originally
  // proposed -- therefore trades one blind spot for another and scores
  // WORSE: measured over `content/quantum-observable-universe`, 321 hits
  // -> 445, because every generic file closing a literal with `norm_num`
  // starts being scored. The union gives 137. See qou#4886 / qou#4901.
  if (
    ARCHIMEDEAN_LEAN_RE.test(stripped) ||
    ARCHIMEDEAN_TYPE_RE.test(stripped)
  ) {
    return { result: "pass", hits: [] };
  }
  // A bare `⁻¹` is only a RING inverse if the file has ring structure at
  // all; in a file with none it is an `Inv` on a group / `Equiv.Perm`, and
  // asking for a "division-free restatement" there is meaningless.
  const isAlgebraic = ALGEBRAIC_LEAN_RE.test(stripped);
  const hits: CheckerHit[] = [];
  // Blank out block comments (preserving line numbers) so docstring math
  // such as `α_EM = q⁻¹/(...)` does not false-flag.
  const codeOnly = leanSrc.replace(/\/-[\s\S]*?-\//g, (m) =>
    m.replace(/[^\n]/g, " "),
  );
  codeOnly.split("\n").forEach((line, i) => {
    if (/^\s*import\s/.test(line)) return;
    const code = line.replace(/--.*$/, "");
    const fieldHit = FIELD_MARKER_RE.test(code);
    // ring-element inverse `q⁻¹` (needs Inv/Field), but NOT a Units
    // coercion `↑q⁻¹` over a CommRing — that is the target pattern.
    const ringInvHit =
      isAlgebraic && RING_INV_RE.test(code) && !/↑|Rˣ|Units/.test(code);
    if (fieldHit || ringInvHit) {
      hits.push({
        file: leanPath,
        line: i + 1,
        text:
          "Algebraic-side field/inverse marker (`Field`/`ℚ`/`DivisionRing`/" +
          "`field_simp`/ring-`⁻¹`) — candidate for a division-free " +
          "restatement over ℤ[q,q⁻¹] (`LaurentPolynomial ℤ`) / `CommRing` per " +
          "§7c + the R[h] pattern. Adjudicate: is a field essential, or is " +
          "this a Laurent identity?",
      });
    }
  });
  return { result: hits.length > 0 ? "warn" : "pass", hits };
}

// ── Dispatch table ──────────────────────────────────────────────

/** This module's checkers, keyed by the criterion each answers. */
export const WALL_AUTOMATED_CHECKERS: Record<
  string,
  (paths: CheckerPaths) => CheckerResult
> = {
  "framework-canonical": (p) =>
    p.md ? checkFrameworkCanonical(p.md) : { result: "pass", hits: [] },
  "wall-side-correct": (p) => checkWallSide(p.md, p.lean, p.ts),
  "wall-base-ring-minimal": (p) => checkBaseRingMinimal(p.lean),
};
