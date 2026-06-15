#!/usr/bin/env bun
/**
 * Per-block q-usage audit — detect how a block treats the substrate
 * parameter `q` and cross-check the detected regime vector against the
 * block's containing chapter's narrative expectation.
 *
 * Background. The QOU paper mixes several `q`-regimes:
 *
 *   - **symbolic / formal q** — `H_n(q)` Hecke generators, polynomial
 *     identities in `R[q, q⁻¹]`, no value pin, no archimedean predicate.
 *   - **generic-R / categorical** — `q : R` for `{R : Type*} [CommRing R]`,
 *     stated over a type variable rather than `ℝ`.
 *   - **real-positive / archimedean** — `0 < q`, `q > 1`, `Real.sqrt`,
 *     `Real.cos`, `linarith` — archimedean specialisation.
 *   - **modulus inequalities** — `|q| > 1` (formal-power-series Taylor
 *     convergence away from 0) vs `|q| < 1` (convergence at 0). Often
 *     conflated with the real inequalities, especially in shuffle /
 *     Macdonald / Hall-Littlewood contexts.
 *   - **root-of-unity** — `q = e^{2πi/N}` (Kashiwara modular crystals,
 *     Lusztig integral form, fusion categories, divided-power algebras).
 *   - **fixed q_0** — pinned to the substrate value `q ≈ 1.1097…`,
 *     used for numerical observables (MeV, ppb targets, CODATA compares).
 *
 * Each chapter has a narrative expectation of which regimes belong there:
 * categorical/structural chapters expect symbolic / generic-R only;
 * archimedean chapters expect real-positive + fixed q_0; the q-geometric
 * Langlands chapter additionally expects root-of-unity. A block whose
 * detected regime vector doesn't intersect its chapter's expected set is
 * a candidate for being moved or being explicitly tagged as a
 * specialisation. See `q-usage-watcher.md` for the full policy.
 *
 * Authoritative reference: CLAUDE.md §7c (base-ring convention) and
 * `notation/notation-collisions.md` (q regime conventions per chapter).
 *
 * @module content/pipeline/qa-checkers-q-usage
 */

import { existsSync, readFileSync } from "fs";
import { dirname, basename, sep } from "path";

export interface QUsageHit {
  file: string;
  line: number;
  text: string;
}

export interface QUsageResult {
  result: "pass" | "fail" | "warn" | "n/a";
  hits: QUsageHit[];
  /** Optional detected-regime tags (for `q-usage-regime-detected` only). */
  regimes?: QRegime[];
  /** Chapter directory the block lives under (when resolvable). */
  chapter?: string;
}

/**
 * The eleven q-regime tags. A block's detected-regime vector is a
 * subset of these; the `na` tag means "block doesn't mention q"
 * (#1640-Copilot @ qa-checkers-q-usage.ts:60 — earlier comment said
 * "seven", which under-counted the regime taxonomy).
 */
export type QRegime =
  | "na"
  | "symbolic"
  | "generic-R"
  | "real-positive"
  | "real-gt-1"
  | "real-lt-1"
  | "mod-gt-1"
  | "mod-lt-1"
  | "unit-circle"
  | "root-of-unity"
  | "fixed-q0";

// ── Chapter → expected-regime profile ───────────────────────────
//
// Each chapter's value is the SET of regimes whose presence in a
// block under that chapter is unsurprising. A block whose detected
// regime vector is disjoint from this set is flagged by the
// `q-usage-narrative-chapter-mismatch` criterion.
//
// Bias: when in doubt, include the regime in the expected set.
// The audit is meant to surface clear-cut mismatches (e.g. a
// fixed-q0 numerical pin in `braids-and-knots`), not to flag every
// borderline chapter.

const CHAPTER_EXPECTED_REGIMES: Record<string, ReadonlySet<QRegime>> = {
  // ── Front matter ───────────────────────────────────────────────
  introduction: new Set<QRegime>([
    "na", "symbolic", "generic-R", "real-positive", "real-gt-1",
    "mod-gt-1", "mod-lt-1", "root-of-unity", "fixed-q0",
  ]),
  notation: new Set<QRegime>([
    "na", "symbolic", "generic-R", "real-positive", "real-gt-1",
    "real-lt-1", "mod-gt-1", "mod-lt-1", "unit-circle",
    "root-of-unity", "fixed-q0",
  ]),

  // ── Part I — categorical foundations ──────────────────────────
  // Symbolic / generic-R primary. fixed-q0 only in a specialisation
  // block that explicitly carries an archimedean banner.
  "quantum-universes": new Set<QRegime>([
    "na", "symbolic", "generic-R",
  ]),
  "quantum-observable-universes": new Set<QRegime>([
    "na", "symbolic", "generic-R", "real-positive",
  ]),
  "models-of-qous": new Set<QRegime>([
    "na", "symbolic", "generic-R", "real-positive", "real-gt-1",
    "mod-gt-1", "mod-lt-1", "fixed-q0",
  ]),
  "lifting-and-descent": new Set<QRegime>([
    "na", "symbolic", "generic-R",
  ]),

  // ── Part II — structural mechanics ───────────────────────────
  "braids-and-knots": new Set<QRegime>([
    "na", "symbolic", "generic-R", "real-positive", "mod-gt-1",
    "mod-lt-1",
  ]),
  "brings-surface": new Set<QRegime>([
    "na", "symbolic", "generic-R", "real-positive", "real-gt-1",
    "fixed-q0",
  ]),
  "fluid-dynamics": new Set<QRegime>([
    "na", "real-positive", "real-gt-1", "fixed-q0",
  ]),
  "stochastic-mechanics": new Set<QRegime>([
    "na", "symbolic", "generic-R", "real-positive", "real-gt-1",
    "real-lt-1", "mod-lt-1", "fixed-q0",
  ]),
  "information-theory": new Set<QRegime>([
    "na", "symbolic", "generic-R", "real-positive", "fixed-q0",
  ]),
  "mass-theory": new Set<QRegime>([
    "na", "real-positive", "real-gt-1", "fixed-q0",
  ]),
  "mass-endomorphism": new Set<QRegime>([
    "na", "symbolic", "generic-R", "real-positive", "real-gt-1",
    "fixed-q0",
  ]),
  "particle-interactions": new Set<QRegime>([
    "na", "real-positive", "real-gt-1", "fixed-q0",
  ]),
  "gravity-spacetime": new Set<QRegime>([
    "na", "real-positive", "real-gt-1", "fixed-q0",
  ]),

  // ── Part III — Descartes universe + observations ─────────────
  "climax-volume-mass": new Set<QRegime>([
    "na", "real-positive", "real-gt-1", "fixed-q0",
  ]),
  observations: new Set<QRegime>([
    "na", "real-positive", "real-gt-1", "fixed-q0",
  ]),
  "predicted-spectra": new Set<QRegime>([
    "na", "real-positive", "real-gt-1", "fixed-q0",
  ]),
  "measurement-observation": new Set<QRegime>([
    "na", "real-positive", "real-gt-1", "fixed-q0",
  ]),
  "molecular-construction": new Set<QRegime>([
    "na", "real-positive", "real-gt-1", "fixed-q0",
  ]),
  "organic-chemistry": new Set<QRegime>([
    "na", "real-positive", "real-gt-1", "fixed-q0",
  ]),

  // ── Ch 11 — q-geometric Langlands (root-of-unity territory) ──
  "q-geometric-langlands": new Set<QRegime>([
    "na", "symbolic", "generic-R", "root-of-unity", "unit-circle",
    "mod-lt-1", "mod-gt-1",
  ]),

  // ── Appendices ────────────────────────────────────────────────
  "appendix-qvalues": new Set<QRegime>([
    "na", "real-positive", "real-gt-1", "fixed-q0",
  ]),
  "appendix-atomic-mass-calculations": new Set<QRegime>([
    "na", "real-positive", "real-gt-1", "fixed-q0",
  ]),
  "appendix-knot-operations": new Set<QRegime>([
    "na", "symbolic", "generic-R", "mod-lt-1", "mod-gt-1",
  ]),
  "appendix-knot-periodic-table": new Set<QRegime>([
    "na", "symbolic", "generic-R", "real-positive", "fixed-q0",
  ]),
  "appendix-nf-witnesses": new Set<QRegime>([
    "na", "symbolic", "generic-R", "fixed-q0",
  ]),
  "appendix-surreals": new Set<QRegime>([
    "na", "symbolic", "generic-R",
  ]),
  "appendix-transfer-matrices": new Set<QRegime>([
    "na", "symbolic", "generic-R", "real-positive", "fixed-q0",
  ]),

  // Glossary and notation entries are register tables — allow any.
  glossary: new Set<QRegime>([
    "na", "symbolic", "generic-R", "real-positive", "real-gt-1",
    "real-lt-1", "mod-gt-1", "mod-lt-1", "unit-circle",
    "root-of-unity", "fixed-q0",
  ]),
  "index-of-definitions": new Set<QRegime>([
    "na", "symbolic", "generic-R", "real-positive", "real-gt-1",
    "real-lt-1", "mod-gt-1", "mod-lt-1", "unit-circle",
    "root-of-unity", "fixed-q0",
  ]),
};

/** Chapters whose narrative-expected profile is "categorical only". */
const CATEGORICAL_CHAPTERS: ReadonlySet<string> = new Set([
  "quantum-universes",
  "lifting-and-descent",
  "braids-and-knots",
  "appendix-knot-operations",
  "appendix-surreals",
]);

/** Chapters whose narrative-expected profile is "archimedean / fixed q_0". */
const ARCHIMEDEAN_CHAPTERS: ReadonlySet<string> = new Set([
  "mass-theory",
  "particle-interactions",
  "gravity-spacetime",
  "climax-volume-mass",
  "observations",
  "predicted-spectra",
  "measurement-observation",
  "molecular-construction",
  "organic-chemistry",
  "fluid-dynamics",
  "appendix-qvalues",
  "appendix-atomic-mass-calculations",
]);

// ── Regime detectors ────────────────────────────────────────────

function readMaybe(path: string | undefined): string {
  if (!path || !existsSync(path)) return "";
  try {
    return readFileSync(path, "utf-8");
  } catch {
    return "";
  }
}

/**
 * Strip blockquotes, fenced code, and explicit author-note callouts so
 * historical "framing" prose doesn't fire the heuristics.
 *
 * Banner blockquotes (> ...) describe what was decided/done, NOT the
 * block's current claim — and they routinely contain phrases like
 * "q_0 ≈ 1.1097" inside narrative-history.
 */
function stripFraming(md: string): string {
  let out = md;
  // Strip fenced code (text inside ``` ... ```)
  out = out.replace(/```[\s\S]*?```/g, "");
  // Strip blockquote lines (start with `>` after optional spaces)
  out = out
    .split(/\r?\n/)
    .filter((l) => !/^\s*>/.test(l))
    .join("\n");
  return out;
}

const FIXED_Q0_RE =
  /q[_\\]?_?0?\s*[≈=~]\s*1\.10|q\s*≈\s*1\.1[0-9]|substrate.{0,40}1\.10|substrate value\b/i;

const REAL_FN_RE =
  /Real\.(sqrt|cos|sin|exp|log|rpow|tan|cosh|sinh|atan|asin|acos)\b/;

const POSITIVE_PRED_RE = /(\b0\s*<\s*q\b|\bq\s*>\s*0\b|\bq\s*>\s*1\b|\b0\s*<\s*q\s*<\s*1\b|\bq\s*<\s*1\b)/;

const POSITIVE_PRED_RE_MD =
  /(\$0\s*<\s*q|\$q\s*>\s*0|\$q\s*>\s*1|\$0\s*<\s*q\s*<\s*1|\$q\s*<\s*1)\b/;

const MOD_PRED_RE =
  /(\\\|q\\\||\\lvert\s*q\s*\\rvert|\|q\|)\s*[<>]\s*1/;

const ROOT_OF_UNITY_RE =
  /(root of unity|primitive\s+\w*\s*root|N-th root|fusion\s+categor|Lusztig.{0,40}root|divided[-\s]power|modular crystal|e\^\{?2\\?pi i|e\^\{2\\\\pi i)/i;

const SYMBOLIC_HECKE_RE =
  /(H_n\(q\)|\\mathbb\{Z\}\[q|\\mathbb\{Q\}\(q\)|\bIwahori\b|\bHecke\b|formal\s+power\s+series|R\[q\s*,\s*q\^?\{?-1\}?\]|R\[q\\?\^?[\^]?\{?\\pm)/;

const GENERIC_R_LEAN_RE =
  /\{\s*R\s*:\s*Type\b|\[\s*CommRing\s+R\s*\]|\(\s*q\s*:\s*R\s*\)|\bGroupWithZero R\b|\bField R\b/;

const ARCHIMEDEAN_LEAN_RE =
  /\(\s*q\s*:\s*ℝ\s*\)|\(\s*q\s*:\s*Real\s*\)|\bnoncomputable def\b.{0,80}\bRealℝ|\blinarith\b|\bpositivity\b|\bnorm_num\b/;

const MEV_RE = /\b(MeV|GeV|keV|CODATA|PDG|ppb|ppm|ppq)\b/;

/** Q-related word boundary — picks up `$q$`, `q ∈`, `q :`. */
const MENTIONS_Q_RE = /\$q\b|\bq\s*[:∈]|\bq\^|\$q\^|q_0/;

/** Lift the chapter directory name from a file path under `content/<paper>/<chapter>/<file>`. */
export function chapterFromPath(path: string | undefined): string | undefined {
  if (!path) return undefined;
  const parts = path.split(sep);
  const idx = parts.indexOf("content");
  if (idx < 0 || idx + 2 >= parts.length) return undefined;
  // content / <paper-dir> / <chapter-dir> / <file>
  return parts[idx + 2];
}

/** Detect the q-regime vector of a block given its sources. */
export function detectRegimes(
  mdPath: string | undefined,
  tsPath: string | undefined,
  leanPath: string | undefined,
): { regimes: Set<QRegime>; chapter?: string } {
  const md = readMaybe(mdPath);
  const ts = readMaybe(tsPath);
  const lean = readMaybe(leanPath);
  const mdClean = stripFraming(md);
  const allText = `${mdClean}\n${ts}\n${lean}`;

  const regimes = new Set<QRegime>();

  if (!MENTIONS_Q_RE.test(allText) && !/\bq\b/.test(allText)) {
    regimes.add("na");
    return { regimes, chapter: chapterFromPath(mdPath ?? tsPath ?? leanPath) };
  }

  // Symbolic / Hecke / formal-power-series
  if (SYMBOLIC_HECKE_RE.test(allText)) regimes.add("symbolic");

  // Generic-R (Lean)
  if (GENERIC_R_LEAN_RE.test(lean)) regimes.add("generic-R");

  // Archimedean / Real.*
  if (REAL_FN_RE.test(lean) || ARCHIMEDEAN_LEAN_RE.test(lean)) {
    regimes.add("real-positive");
  }

  // Fixed q_0 numerical pin
  if (FIXED_Q0_RE.test(mdClean) || FIXED_Q0_RE.test(lean)) {
    regimes.add("fixed-q0");
  }
  // MeV / CODATA implies fixed q_0 specialisation
  if (MEV_RE.test(mdClean) && /\bq\b/.test(mdClean)) {
    regimes.add("fixed-q0");
  }

  // Explicit positivity / modulus predicates
  const realPos = POSITIVE_PRED_RE.test(`${mdClean}\n${lean}`) ||
    POSITIVE_PRED_RE_MD.test(mdClean);
  if (realPos) regimes.add("real-positive");

  // q > 1 / q < 1 specifically
  if (/(?:\$|\b)q\s*>\s*1\b/.test(mdClean) || /\bq\s*>\s*1\b/.test(lean)) {
    regimes.add("real-gt-1");
  }
  if (/(?:\$|\b)0\s*<\s*q\s*<\s*1\b/.test(mdClean) ||
      /(?:\$|\b)q\s*<\s*1\b/.test(mdClean) ||
      /\bq\s*<\s*1\b/.test(lean)) {
    regimes.add("real-lt-1");
  }

  // |q| > 1 / |q| < 1
  const modPred = MOD_PRED_RE.exec(`${mdClean}\n${lean}`);
  if (modPred) {
    if (/[<]/.test(modPred[0])) regimes.add("mod-lt-1");
    if (/[>]/.test(modPred[0])) regimes.add("mod-gt-1");
  }

  // Unit circle
  if (/\|q\|\s*=\s*1\b/.test(`${mdClean}\n${lean}`)) regimes.add("unit-circle");

  // Root of unity
  if (ROOT_OF_UNITY_RE.test(`${mdClean}\n${lean}`)) regimes.add("root-of-unity");

  // If nothing matched but we did mention q → default to symbolic (most
  // conservative classification; better than reporting an empty vector
  // which would mis-trigger every chapter-mismatch).
  if (regimes.size === 0) regimes.add("symbolic");

  return { regimes, chapter: chapterFromPath(mdPath ?? tsPath ?? leanPath) };
}

// ── Helpers for line:N evidence in hits ─────────────────────────

function* matchLines(
  text: string,
  re: RegExp,
): Generator<{ line: number; text: string }> {
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (re.test(lines[i])) {
      yield { line: i + 1, text: lines[i].trim() };
    }
  }
}

// ── Criterion checkers ─────────────────────────────────────────

/**
 * `q-usage-regime-detected` — record the block's detected regime vector
 * in the sidecar. Always returns `pass`; the regime tags are surfaced
 * via the `regimes` field so the CLI report can summarise them.
 */
export function checkQUsageRegimeDetected(
  mdPath: string | undefined,
  tsPath: string | undefined,
  leanPath: string | undefined,
): QUsageResult {
  const { regimes, chapter } = detectRegimes(mdPath, tsPath, leanPath);
  return { result: "pass", hits: [], regimes: [...regimes].sort(), chapter };
}

/**
 * `q-usage-fixed-q0-leak` — block in a categorical/symbolic chapter
 * (per `CATEGORICAL_CHAPTERS`) has a fixed q_0 numerical pin.
 *
 * Pass:  block is not in a categorical chapter, OR no fixed-q0 pin
 *        detected, OR the block's `.ts` carries an explicit
 *        `archimedean-specialisation` / `archimedean: true` tag.
 * Fail:  numerical pin in a categorical chapter without the marker.
 */
export function checkQUsageFixedQ0Leak(
  mdPath: string | undefined,
  tsPath: string | undefined,
  leanPath: string | undefined,
): QUsageResult {
  const chapter = chapterFromPath(mdPath ?? tsPath ?? leanPath);
  if (!chapter || !CATEGORICAL_CHAPTERS.has(chapter)) {
    return { result: "n/a", hits: [], chapter };
  }
  const md = readMaybe(mdPath);
  const lean = readMaybe(leanPath);
  const mdClean = stripFraming(md);

  // Detector reports raw findings only. Author dispensations live in
  // the sidecar as a `kind: "human"` reviewer entry with `result: "pass"`
  // + `notes:` rationale — the qa-sweep "most-recent matching-hash entry
  // wins" rule lets a human entry override the script's fail. See
  // q-usage-watcher.md §Dispensations for the pattern.

  const hits: QUsageHit[] = [];
  for (const m of matchLines(mdClean, FIXED_Q0_RE)) {
    hits.push({ file: mdPath!, line: m.line, text: m.text });
  }
  for (const m of matchLines(lean, FIXED_Q0_RE)) {
    hits.push({ file: leanPath!, line: m.line, text: m.text });
  }
  return {
    result: hits.length > 0 ? "fail" : "pass",
    hits,
    chapter,
  };
}

/**
 * `q-usage-archimedean-in-categorical-chapter` — categorical chapter
 * block uses `Real.*` / `linarith` / `MeV` / numerical-anchor constructs.
 *
 * Severity major (not critical) because legitimate uses exist (e.g. a
 * dedicated `archimedean-specialisation` block in a categorical chapter,
 * properly banner-ed).
 */
export function checkQUsageArchimedeanInCategoricalChapter(
  mdPath: string | undefined,
  tsPath: string | undefined,
  leanPath: string | undefined,
): QUsageResult {
  const chapter = chapterFromPath(mdPath ?? tsPath ?? leanPath);
  if (!chapter || !CATEGORICAL_CHAPTERS.has(chapter)) {
    return { result: "n/a", hits: [], chapter };
  }

  // No .ts tag-read — dispensations live in the sidecar as a human
  // reviewer entry. See q-usage-watcher.md §Dispensations.

  const lean = readMaybe(leanPath);
  const md = readMaybe(mdPath);
  const mdClean = stripFraming(md);
  const hits: QUsageHit[] = [];

  // Real.* applied to q (or to a context that mentions q) is a strong signal.
  // Plain integer/Nat norm_num is not archimedean — only fire on tactics
  // when the file ALSO contains an archimedean-type marker.
  const fileHasReal =
    /\b(ℝ|Real\.|q\s*:\s*ℝ|q\s*:\s*Real\b|noncomputable def)/.test(lean);
  for (const m of matchLines(lean, REAL_FN_RE)) {
    hits.push({
      file: leanPath!,
      line: m.line,
      text: `archimedean Real.* in categorical chapter — ${m.text}`,
    });
  }
  if (fileHasReal) {
    for (const m of matchLines(lean, /\b(linarith|positivity)\b/)) {
      // Skip if line is just a comment.
      if (/^\s*--/.test(m.text)) continue;
      hits.push({
        file: leanPath!,
        line: m.line,
        text: `archimedean tactic in categorical chapter — ${m.text}`,
      });
    }
  }
  // MeV / CODATA only fires when the block prose actively mentions a
  // numerical comparison (not e.g. a citation in a remark about
  // experimental input). Heuristic: same line must contain a digit
  // adjacent to MeV/CODATA, OR a clear ratio/comparison verb.
  for (const m of matchLines(
    mdClean,
    /(\d[\d.,]*\s*(MeV|GeV|keV)|CODATA|PDG|\bppm\b|\bppb\b|\bppq\b)/,
  )) {
    // Skip lines that are only citations (`\cite{...}` references).
    if (/^\s*See \[|^\s*\\cite/i.test(m.text)) continue;
    hits.push({
      file: mdPath!,
      line: m.line,
      text: `MeV/CODATA reference in categorical chapter — ${m.text}`,
    });
  }
  return {
    result: hits.length > 0 ? "fail" : "pass",
    hits,
    chapter,
  };
}

/**
 * `q-usage-positivity-implicit` — block uses positivity-dependent
 * constructs (`Real.sqrt`, `>`, `<`) on `q` without an explicit
 * positivity hypothesis (`0 < q`, `0 < q ∧ q < 1`, etc.).
 *
 * Heuristic: if Lean file uses `Real.sqrt(q...)` or similar AND the
 * file lacks an `hq : 0 < q` / `hq : 1 < q` / `hq_pos` hypothesis,
 * flag.
 *
 * Severity minor — many such uses are correct (Mathlib's `Real.sqrt`
 * returns 0 on negative inputs, so the proof may still compile).
 * The point is to mark the implicit assumption for review.
 */
export function checkQUsagePositivityImplicit(
  _mdPath: string | undefined,
  _tsPath: string | undefined,
  leanPath: string | undefined,
): QUsageResult {
  const lean = readMaybe(leanPath);
  if (!lean) return { result: "n/a", hits: [] };
  // Quick gate — only fire if the file uses real-archimedean predicates on q.
  // Shared with the line-matching loop below so the gate and the hits
  // can never disagree (Gemini #1640-552).
  const POS_DEP_RE =
    /Real\.(sqrt|log|rpow)\s*[\(\s][^)]*\bq\b|\bRealRpow\b.{0,20}\bq\b|\bRealSqrt\b.{0,20}\bq\b/;
  if (!POS_DEP_RE.test(lean)) return { result: "pass", hits: [] };

  // Has an explicit positivity hypothesis?
  const hasHypothesis =
    /\bhq[a-zA-Z_]*\s*:\s*0\s*<\s*q\b/.test(lean) ||
    /\bhq[a-zA-Z_]*\s*:\s*1\s*<\s*q\b/.test(lean) ||
    /\bhq[a-zA-Z_]*\s*:\s*q\s*>\s*0\b/.test(lean) ||
    /\bhq[a-zA-Z_]*\s*:\s*q\s*>\s*1\b/.test(lean) ||
    /\(.*?hq[a-zA-Z_]*\s*:\s*0\s*<\s*q.*?\)/.test(lean) ||
    /\(.*?h_pos\s*:\s*0\s*<\s*q.*?\)/.test(lean) ||
    /\bpos_of_/.test(lean);
  if (hasHypothesis) return { result: "pass", hits: [] };

  const hits: QUsageHit[] = [];
  for (const m of matchLines(lean, POS_DEP_RE)) {
    hits.push({
      file: leanPath!,
      line: m.line,
      text: `positivity-dependent Real.* on q without explicit hypothesis — ${m.text}`,
    });
  }
  return {
    result: hits.length > 0 ? "warn" : "pass",
    hits,
  };
}

/**
 * `q-usage-modulus-vs-real-mismatch` — formal-power-series / shuffle /
 * Macdonald / Hall-Littlewood context uses `q > 1` or `q < 1` instead
 * of `|q| > 1` or `|q| < 1`.
 *
 * Heuristic: when the block's prose references "formal power series",
 * "convergence", "Taylor expansion in q", "shuffle algebra",
 * "Macdonald", "Hall-Littlewood", "Habiro element", and a `q > 1` /
 * `q < 1` literal appears in the same .md, flag the inequality.
 *
 * Severity minor — sometimes the real-line inequality is the intended
 * statement (archimedean specialisation), but the convention should
 * be explicit.
 */
export function checkQUsageModulusVsRealMismatch(
  mdPath: string | undefined,
  _tsPath: string | undefined,
  _leanPath: string | undefined,
): QUsageResult {
  const md = readMaybe(mdPath);
  if (!md) return { result: "n/a", hits: [] };
  const mdClean = stripFraming(md);

  const formalCtx =
    /\bformal[-\s]power[-\s]series\b|Taylor expansion.{0,30}\bq\b|shuffle algebra|Macdonald|Hall[-\s]?Littlewood|Habiro\s+(element|ring)/i.test(
      mdClean,
    );
  if (!formalCtx) return { result: "n/a", hits: [] };

  // Already uses |q| properly?
  const hasMod = MOD_PRED_RE.test(mdClean);

  const hits: QUsageHit[] = [];
  // Simple word-boundary match — `\bq\s*[<>]\s*1\b` does not match
  // modulus expressions `|q| < 1` (the `|` between `q` and the boundary
  // breaks the `\b`), so we don't need an explicit "not after $" anchor.
  // Per Gemini #1640-618.
  for (const m of matchLines(mdClean, /\bq\s*[<>]\s*1\b/)) {
    // Skip if line already uses |q| pattern
    if (MOD_PRED_RE.test(m.text)) continue;
    hits.push({
      file: mdPath!,
      line: m.line,
      text: `formal-power-series context uses 'q < 1' or 'q > 1' rather than '|q| < 1' / '|q| > 1' — ${m.text}`,
    });
  }
  if (hasMod && hits.length === 0) return { result: "pass", hits: [] };
  return {
    result: hits.length > 0 ? "warn" : "pass",
    hits,
  };
}

/**
 * `q-usage-root-of-unity-undeclared` — block uses constructions that
 * require q to be a root of unity (Kashiwara modular crystal, Lusztig
 * integral form, fusion category, divided-power algebra, primitive
 * N-th root) without an explicit declaration of the root-of-unity
 * regime.
 *
 * Pass:  prose explicitly names the root-of-unity regime (`q = e^{2πi/N}`,
 *        "q is a primitive N-th root of unity", "Lusztig's integral form
 *        at q = root of unity"), OR the chapter's expected profile
 *        already includes `root-of-unity` (`q-geometric-langlands`).
 * Warn:  construction present, no declaration.
 */
export function checkQUsageRootOfUnityUndeclared(
  mdPath: string | undefined,
  _tsPath: string | undefined,
  leanPath: string | undefined,
): QUsageResult {
  const chapter = chapterFromPath(mdPath ?? leanPath);
  if (chapter === "q-geometric-langlands" || chapter === "notation") {
    return { result: "n/a", hits: [], chapter };
  }
  const md = readMaybe(mdPath);
  const lean = readMaybe(leanPath);
  const mdClean = stripFraming(md);
  const allText = `${mdClean}\n${lean}`;

  const usesRootConstruct =
    /fusion\s+categor|Lusztig.{0,40}(integral form|divided.power)|divided[-\s]power algebra|Kashiwara.{0,30}modular|modular crystal|quantum group at\s+\w*root|finite[-\s]dimensional quantum group/i.test(
      allText,
    );
  if (!usesRootConstruct) return { result: "pass", hits: [] };

  const declared =
    /q\s*=\s*e\^\{?\\?-?\s*2[\\\\]?pi\s*i|primitive\s+\w*\s*root of unity|q\s+is\s+a\s+root of unity|root[-\s]of[-\s]unity\s+regime/i.test(
      allText,
    );
  if (declared) return { result: "pass", hits: [] };

  const hits: QUsageHit[] = [];
  for (const m of matchLines(
    mdClean,
    /fusion\s+categor|Lusztig.{0,40}(integral form|divided.power)|divided[-\s]power algebra|Kashiwara.{0,30}modular|modular crystal/i,
  )) {
    hits.push({
      file: mdPath!,
      line: m.line,
      text: `root-of-unity construction used without explicit regime declaration — ${m.text}`,
    });
  }
  return {
    result: hits.length > 0 ? "warn" : "pass",
    hits,
    chapter,
  };
}

/**
 * `q-usage-narrative-chapter-mismatch` — the block's detected regime
 * vector is disjoint from its chapter's expected-regime profile (i.e.
 * no detected regime is in the expected set).
 *
 * Note: this is intentionally a weak condition — single-regime
 * mismatches (block has `fixed-q0` AND chapter doesn't expect it but
 * DOES expect `real-positive`) do NOT fire; only when ALL detected
 * regimes are outside the expected set. The stronger per-regime
 * checks live in `q-usage-fixed-q0-leak` and
 * `q-usage-archimedean-in-categorical-chapter`.
 */
export function checkQUsageNarrativeChapterMismatch(
  mdPath: string | undefined,
  tsPath: string | undefined,
  leanPath: string | undefined,
): QUsageResult {
  const { regimes, chapter } = detectRegimes(mdPath, tsPath, leanPath);
  if (!chapter) return { result: "n/a", hits: [] };
  if (regimes.has("na")) return { result: "pass", hits: [], chapter };
  const expected = CHAPTER_EXPECTED_REGIMES[chapter];
  if (!expected) return { result: "n/a", hits: [], chapter };

  // Any detected regime is in the expected set → pass.
  let anyExpected = false;
  for (const r of regimes) if (expected.has(r)) { anyExpected = true; break; }
  if (anyExpected) {
    return {
      result: "pass",
      hits: [],
      regimes: [...regimes].sort(),
      chapter,
    };
  }

  const detectedList = [...regimes].sort().join(", ");
  const expectedList = [...expected].sort().join(", ");
  return {
    result: "warn",
    hits: [
      {
        file: mdPath ?? tsPath ?? leanPath ?? "(unknown)",
        line: 1,
        text:
          `detected regime [${detectedList}] is disjoint from chapter ` +
          `'${chapter}' expected [${expectedList}]`,
      },
    ],
    regimes: [...regimes].sort(),
    chapter,
  };
}

// ── Dispatch ────────────────────────────────────────────────────

/**
 * Maps criterion id → checker function. Imported by
 * `qa-checkers-extended.ts` and merged into `EXTENDED_AUTOMATED_CHECKERS`.
 */
export const Q_USAGE_AUTOMATED_CHECKERS: Record<
  string,
  (paths: { md?: string; ts?: string; lean?: string }) => QUsageResult
> = {
  "q-usage-regime-detected": (p) =>
    checkQUsageRegimeDetected(p.md, p.ts, p.lean),
  "q-usage-fixed-q0-leak": (p) =>
    checkQUsageFixedQ0Leak(p.md, p.ts, p.lean),
  "q-usage-archimedean-in-categorical-chapter": (p) =>
    checkQUsageArchimedeanInCategoricalChapter(p.md, p.ts, p.lean),
  "q-usage-positivity-implicit": (p) =>
    checkQUsagePositivityImplicit(p.md, p.ts, p.lean),
  "q-usage-modulus-vs-real-mismatch": (p) =>
    checkQUsageModulusVsRealMismatch(p.md, p.ts, p.lean),
  "q-usage-root-of-unity-undeclared": (p) =>
    checkQUsageRootOfUnityUndeclared(p.md, p.ts, p.lean),
  "q-usage-narrative-chapter-mismatch": (p) =>
    checkQUsageNarrativeChapterMismatch(p.md, p.ts, p.lean),
};

export const Q_USAGE_CRITERION_IDS: string[] = Object.keys(
  Q_USAGE_AUTOMATED_CHECKERS,
);

// Re-export the chapter profile for the CLI report and the skill.
export { CHAPTER_EXPECTED_REGIMES, CATEGORICAL_CHAPTERS, ARCHIMEDEAN_CHAPTERS };
