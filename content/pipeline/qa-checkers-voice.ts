/**
 * Automated checkers for `voice-*` / `framework-*` / `wall-*` QA
 * criteria. Each checker returns `result: "pass" | "fail"` plus
 * (on fail) evidence in the form `file:line: <quote>`.
 *
 * Coverage:
 *
 * - Eight voice criteria are now fully automated: status-leak,
 *   emoji-content, first-person-work, time-stamped-notes,
 *   unicode-crash, editorializing, **ai-slop** (heuristic LLM-tell
 *   detection), and **scholarly-default** (second-person address +
 *   lecturer cadence + past-tense narration).
 * - `framework-canonical` and `wall-side-correct` complete the
 *   automated set.
 * - Only `fit-section-chapter` remains agent-only — it requires
 *   semantic block-vs-section reasoning that no lexical heuristic
 *   captures faithfully.
 *
 * The automated checkers are conservative — they prefer
 * false-positive `fail` over false-negative `pass`. Agent entries
 * appended later via `qa-merge-findings.ts` overrule the script
 * entries when the script is being overzealous.
 *
 * @module content/pipeline/qa-checkers-voice
 */

import { readFileSync, existsSync } from "fs";
import { EXTENDED_AUTOMATED_CHECKERS } from "./qa-checkers-extended";

export interface CheckerHit {
  file: string;
  line: number;
  text: string;
}

export interface CheckerResult {
  result: "pass" | "fail" | "warn" | "n/a";
  hits: CheckerHit[];
  /**
   * Optional human-readable context threaded into the sidecar entry's
   * `notes` field (e.g. a cache-staleness reason). Kept structurally
   * identical to the `CheckerResult` in `qa-checkers-extended.ts` so
   * the merged `AUTOMATED_CHECKERS` registry stays type-compatible.
   */
  notes?: string;
  /**
   * Optional structured numeric/heuristic measures persisted into the
   * sidecar entry's `metrics` field. Kept structurally identical to the
   * `CheckerResult` in `qa-checkers-extended.ts` so the merged
   * `AUTOMATED_CHECKERS` registry stays type-compatible; the detangler
   * checkers populate it.
   */
  metrics?: Record<string, number | string>;
}

function readLines(path: string): string[] {
  return readSource(path).lines;
}

/**
 * Read a file once and return both the whole-file string and the
 * line array. Centralised so every checker uses the same access
 * pattern (avoids duplicate `readFileSync` calls + ambiguous
 * "line vs source" handling). Returns empty when the file is
 * absent so callers can treat missing input as a pass.
 */
function readSource(path: string): { src: string; lines: string[] } {
  if (!existsSync(path)) return { src: "", lines: [] };
  const src = readFileSync(path, "utf-8");
  return { src, lines: src.split("\n") };
}

function scan(
  path: string,
  re: RegExp,
  filter?: (line: string, idx: number, lines: string[]) => boolean,
): CheckerHit[] {
  const lines = readLines(path);
  const hits: CheckerHit[] = [];
  lines.forEach((l, i) => {
    if (re.test(l)) {
      if (filter && !filter(l, i, lines)) return;
      hits.push({ file: path, line: i + 1, text: l.trim().slice(0, 200) });
    }
  });
  return hits;
}

// ── voice-status-leak ───────────────────────────────────────────

const STATUS_LEAK_RE =
  /(\*\*Done\*\*|\*\*Completed\*\*|\*\*Pending\*?\*?|\*\*Blocked\*?\*?|\*\*Deferred\*?\*?|\*\*In progress\*?\*?|\*\*Punted\*?\*?|\(TODO\)|\(TBD\)|\(TBA\)|\(WIP\)|\(stub\)|\(placeholder\)|\bTODO:|\bFIXME:|\bXXX:|\bHACK:|\bWIP\b|\bTO-DO\b|\bTBD\b|\bplaceholder\b|\b(?:stub(?:bed)?|punt(?:ed|ing)?)\s+(?:for\s+now|until|pending)|\bneeds\s+(?:work|fixing|attention|review|filling\s+in)|\bkick\s+the\s+can|\bnot\s+yet\s+(?:implemented|written|filled\s+in))/i;

export function checkStatusLeak(mdPath: string): CheckerResult {
  // Skip fenced code blocks (```...```) AND inline backtick spans —
  // status-marker keywords like "placeholder" inside Lean code blocks
  // (e.g. `True  -- placeholder`) are legitimate code, not prose
  // status-leak.
  const hits = scan(mdPath, STATUS_LEAK_RE, (l, i, lines) => {
    // Detect whether this line is inside a fenced block by counting
    // fence transitions up to this line. (Cheaper than threading
    // state through scan().)
    let inFence = false;
    for (let j = 0; j < i; j++) {
      if (/^```/.test(lines[j].trim())) inFence = !inFence;
    }
    if (inFence) return false;
    // Strip inline backticks before re-testing.
    const stripped = l.replace(/`[^`]+`/g, "");
    return STATUS_LEAK_RE.test(stripped);
  });
  return { result: hits.length > 0 ? "fail" : "pass", hits };
}

// ── voice-emoji-content ─────────────────────────────────────────

// Status-marker emoji that don't belong in scholarly prose. The `u`
// flag is **required**: without it, the character class compiles as
// raw UTF-16 code units, so e.g. `[🔧]` becomes `[🔧]` —
// which matches the leading surrogate \uD83D of EVERY emoji in the
// U+1F000+ plane (e.g. 🟢 🟡 🟠 ⚪), causing surprise false-
// positives. With `u` the engine treats each emoji as a single
// code-point literal and only the listed glyphs match.
const EMOJI_RE = /[✅❌⚠⏳🔧🚧☑☒✓✗★🎯🚀🔥🟢🟡🟠⚪🔴🔵🟣🟤⬛⬜]/u;

export function checkEmojiContent(mdPath: string): CheckerResult {
  // ✓ and ✗ are allowed inside table rows for compact comparison
  // markers. Any OTHER emoji in a table row (or any emoji at all in
  // body prose) is a hit.
  const hits = scan(mdPath, EMOJI_RE, (l) => {
    if (l.trim().startsWith("|")) {
      // In a table row, flag iff at least one non-✓/✗ emoji is present.
      return /[✅❌⚠⏳🔧🚧☑☒★🎯🚀🔥🟢🟡🟠⚪🔴🔵🟣🟤⬛⬜]/u.test(l);
    }
    // Body prose: every EMOJI_RE match is a hit.
    return true;
  });
  return { result: hits.length > 0 ? "fail" : "pass", hits };
}

// ── voice-first-person-work ─────────────────────────────────────

const FIRST_PERSON_WORK_RE =
  /\b(we'?ll (?:add|fix|update|do|write|put in|need to|have to)|I'?ll (?:add|fix|update|do|write|put in|now|first|need to|have to)|let me\b|let'?s\s+(?:add|fix|update|write|punt|defer|move|skip|drop)|needs more work|note to self|we should (?:fix|add|do|write|punt|defer)|TODO for me|gonna\b|going to (?:add|fix|update|write)|here'?s what (?:I|we) (?:did|will|are\s+doing)|(?:I|we) went ahead and|(?:I|we) (?:just|already) (?:added|fixed|updated|wrote)|(?:I|we) decided to)/i;

export function checkFirstPersonWork(mdPath: string): CheckerResult {
  const hits = scan(mdPath, FIRST_PERSON_WORK_RE);
  return { result: hits.length > 0 ? "fail" : "pass", hits };
}

// ── voice-time-stamped-notes ────────────────────────────────────

const TIME_STAMPED_RE =
  /\b(as of (?:20\d{2}[- ]\d{2}|today|yesterday|now)|after the (?:recent|last|previous) (?:push|merge|fix|rebase|commit|PR|review)|in the current (?:draft|state|version|implementation)|as currently (?:written|implemented|configured|stated)|prior to (?:the )?(?:recent |last |previous )?(?:fix|push|merge|commit|PR|review|rebase)|(?:yesterday|today|tomorrow|last week|this week|recently)(?:'s| )(?:fix|push|merge|update|review|commit|change|edit)|in (?:PR\s*#\s*\d+|commit\s+[a-f0-9]{7,}|the\s+(?:latest|recent)\s+(?:PR|commit))|(?:earlier|later) (?:today|this (?:week|session))|since (?:the )?(?:last|recent|previous) (?:fix|push|merge|commit|PR|rebase))\b/i;

export function checkTimeStampedNotes(mdPath: string): CheckerResult {
  const hits = scan(mdPath, TIME_STAMPED_RE);
  return { result: hits.length > 0 ? "fail" : "pass", hits };
}

// ── voice-unicode-crash ─────────────────────────────────────────

// Source of truth: `.claude/skills/local/one-voice-audit.md` §1
// item 5 + §Workflow grep. Each of these characters crashes pdflatex
// unless explicitly mapped in the preamble.
// Expanded to catch every Unicode glyph that either (a) crashes
// pdflatex when emitted as prose or (b) reliably renders wrong
// without the correct LaTeX wrapper. Includes:
//   - arrows: ↦ ↔ ⇒ ⇔ → ←
//   - super/sub digits: ⁰-⁹ ₀-₉ ⁺ ⁻
//   - operators: ·  × ÷ ± ∓ √
//   - relations: ≤ ≥ ≠ ≈ ≡ ≃ ≅
//   - logical: ¬ ∧ ∨ ∀ ∃ ∈ ∉ ⊂ ⊃ ⊆ ⊇ ∪ ∩
//   - greek-as-prose (sub-set; mostly fine inside $…$): catch in
//     prose with `\b` semantic by including a small set commonly
//     used incorrectly outside math (α, β, γ, δ at start-of-block)
//   - big-operator: ∑ ∏ ∫ ∬ ∮
//   - separator: ─ ━ ┃ │ ┄
//   - misc: ∞ ′ ″ … ™ ®
//
// `✓` / `✗` are EXEMPT inside table rows (table-cell-OK markers per
// existing convention); checkEmojiContent handles that path. This
// regex applies to body prose only — fenced code (```...```) and
// inline backtick spans (`...`) are stripped before testing.
const UNICODE_CRASH_RE =
  /[↦↔⇒⇔→←⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻₀₁₂₃₄₅₆₇₈₉·×÷±∓√≤≥≠≈≡≃≅¬∧∨∀∃∈∉⊂⊃⊆⊇∪∩∑∏∫∬∮─━┃┄∞′″…™®─✅❌⚠]/;

export function checkUnicodeCrash(mdPath: string): CheckerResult {
  // Skip inside fenced code blocks (```...```) AND inside backtick
  // inline code spans — neither goes through pdflatex as prose.
  // The mdast pipeline emits them as \texttt{} or verbatim macros
  // that escape the offending characters; only crash-hazard chars
  // appearing in raw prose (or math) genuinely break the build.
  const lines = readLines(mdPath);
  let inFence = false;
  const hits: CheckerHit[] = [];
  lines.forEach((l, i) => {
    if (/^```/.test(l.trim())) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;
    let cleanedLine = stripInlineCode(l);
    // Strip inline math ($...$) and display math ($$...$$) — Unicode
    // inside math mode is handled by the pipeline's LaTeX wrapper.
    cleanedLine = cleanedLine.replace(/\$\$[^$]*\$\$/g, "");
    cleanedLine = cleanedLine.replace(/\$[^$]*\$/g, "");
    if (UNICODE_CRASH_RE.test(cleanedLine)) {
      hits.push({ file: mdPath, line: i + 1, text: l.trim().slice(0, 200) });
    }
  });
  return { result: hits.length > 0 ? "fail" : "pass", hits };
}

// ── voice-editorializing ────────────────────────────────────────

const EDITORIALIZING_RE =
  /\b(surprisingly|remarkably|interestingly|notably|amazingly|fortunately|unfortunately|of course\b|clearly|obviously|trivially|naturally|simply|merely|just\s+(?:a|the)|easily|effortlessly|seamlessly|elegantly|beautifully|perhaps the most (?:surprising|important|significant|interesting|elegant)|it is (?:worth|important|interesting|notable|easy|clear|obvious) (?:to (?:note|see|observe|point\s+out)|noting|that)|the reader (?:will|may|can) (?:appreciate|note|see|enjoy|find)|it turns out that|one might (?:expect|hope|wonder|think|imagine|suspect)|a beautiful (?:result|theorem|proof|fact|observation)|an elegant (?:proof|argument|construction|formulation)|(?:a|the) (?:truly|particularly|especially)\s+(?:beautiful|elegant|striking|surprising|remarkable)|nicely|cleanly|crisply|tidily)\b/i;

// Math-idiom exemption: a flagged adverb that modifies a math object
// is canonical mathematical language, not editorializing. Several
// patterns count:
//   (a) "naturally an algebra", "trivially zero", "just a formal map"
//       — adverb + article + math noun
//   (b) "decomposes naturally as a tensor", "factor trivially"
//       — math verb + adverb
//   (c) "naturally $\mathfrak{g}$" — adverb + math-mode region
//   (d) "non-simply-laced", "tri-cleanly", etc. — adverb as part of
//       a hyphenated compound math term
//   (e) "contribute trivially" — verb + adverb at end of clause
const MATH_IDIOM_EXEMPT =
  /(?:naturally|trivially|easily|cleanly|simply|nicely|just)\s+(?:an?|the)\s+\S+|(?:decomposes|attaches|factors|contributes?|contribute|extends|embeds|maps|acts|commutes|generates|bar-classify|generate)\s+(?:naturally|trivially|easily|cleanly|nicely|simply)\b|(?:naturally|trivially|easily|cleanly|nicely|simply)\s+\$|(?:non|un|tri|semi|quasi|bi|sub|super|hyper|inter|intra|pre|post)-(?:simply|naturally|trivially|easily|cleanly|nicely)|(?:simply|naturally|trivially|easily|cleanly|nicely)-(?:laced|connected|graded|ordered)/i;

export function checkEditorializing(mdPath: string): CheckerResult {
  // Skip lines that are clearly in fenced code (Lean / TeX snippets).
  const lines = readLines(mdPath);
  let inFence = false;
  const hits: CheckerHit[] = [];
  lines.forEach((l, i) => {
    if (/^```/.test(l.trim())) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;
    if (!EDITORIALIZING_RE.test(l)) return;
    // Math-idiom exemption: if the editorial adverb is in a math
    // construction (e.g. "naturally an algebra", "non-simply-laced",
    // "contribute trivially"), it's canonical math language.
    if (MATH_IDIOM_EXEMPT.test(l)) return;
    hits.push({ file: mdPath, line: i + 1, text: l.trim().slice(0, 200) });
  });
  return { result: hits.length > 0 ? "fail" : "pass", hits };
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

/**
 * Extract the text of a block's `authorNotes` array from its `.ts`
 * manifest source. The §7c→authorNotes migration (2026-05-24) moves
 * archimedean-specialisation banners out of the `.md` prose and into
 * `authorNotes: [{ kind, body }]`, so the wall-side acknowledgement
 * `checkWallSide` looks for may now live here rather than in the `.md`.
 *
 * We scope to the `authorNotes` array (via bracket matching, honouring
 * string/template literals) rather than scanning the whole `.ts`, so an
 * acknowledgement keyword appearing elsewhere in the manifest — e.g. the
 * `lean.ref` URI `qou:QOU.Archimedean.foo` — does NOT spuriously count
 * as an acknowledgement.
 */
export function extractAuthorNotesText(tsPath: string | undefined): string {
  if (!tsPath || !existsSync(tsPath)) return "";
  const src = readFileSync(tsPath, "utf-8");
  const key = src.indexOf("authorNotes");
  if (key === -1) return "";
  const open = src.indexOf("[", key);
  if (open === -1) return "";
  let depth = 0;
  let quote: string | null = null;
  for (let i = open; i < src.length; i++) {
    const ch = src[i];
    if (quote) {
      if (ch === "\\") {
        i++; // skip escaped char
        continue;
      }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }
    if (ch === "[") depth++;
    else if (ch === "]") {
      depth--;
      if (depth === 0) return src.slice(open, i + 1);
    }
  }
  // Unbalanced (malformed manifest) — return the tail so a present
  // acknowledgement is still detected rather than silently dropped.
  return src.slice(open);
}

/** Archimedean-specialisation acknowledgement, in the `.md` narrative
 *  or (post §7c→authorNotes migration) the block's `authorNotes`. */
const WALL_ACK_RE =
  /archimedean|over\s+\\?mathbb\{R\}|over\s+ℝ|specialise|specialize|numerical evaluation|codata|experimental/;

/**
 * Block is wall-correct iff:
 *   - it has no .lean, OR
 *   - .lean is purely algebraic (no archimedean markers), OR
 *   - .lean is purely archimedean (no generic-R markers in same file),
 *     and the .md / authorNotes do not contradict the placement.
 *
 * Mixed signals (both archimedean AND generic-R markers, or
 * archimedean markers without the .md OR `authorNotes` acknowledging
 * archimedean specialisation) get flagged.
 */
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
  const isArchimedean = ARCHIMEDEAN_LEAN_RE.test(stripped);
  const isAlgebraic = ALGEBRAIC_LEAN_RE.test(stripped);
  const hits: CheckerHit[] = [];

  if (isArchimedean && isAlgebraic) {
    hits.push({
      file: leanPath,
      line: 1,
      text:
        "Lean file contains both archimedean (ℝ / Real.* / linarith) AND " +
        "generic-R (CommRing / {R : Type*}) markers — split into two files " +
        "per CLAUDE.md §7c.",
    });
  }

  if (isArchimedean && mdPath && existsSync(mdPath)) {
    const md = readFileSync(mdPath, "utf-8");
    // Archimedean is fine if the specialisation is acknowledged in the
    // .md narrative OR (post §7c→authorNotes migration, 2026-05-24) the
    // block's `authorNotes`. Without acknowledgement we flag for review.
    const acknowledged =
      WALL_ACK_RE.test(md.toLowerCase()) ||
      WALL_ACK_RE.test(extractAuthorNotesText(tsPath).toLowerCase());
    if (!acknowledged) {
      hits.push({
        file: leanPath,
        line: 1,
        text:
          "Lean file uses archimedean constructs but neither the .md " +
          "narrative nor the .ts authorNotes acknowledge archimedean " +
          "specialisation. Add a §7c-style banner (authorNotes) or move " +
          "the archimedean evaluation to a sibling block.",
      });
    }
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
  if (ARCHIMEDEAN_LEAN_RE.test(stripped)) {
    return { result: "pass", hits: [] };
  }
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
    const ringInvHit = RING_INV_RE.test(code) && !/↑|Rˣ|Units/.test(code);
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

// ── voice-ai-slop ───────────────────────────────────────────────

/**
 * Strip backtick-delimited inline code spans from a markdown line.
 * Used by the line-by-line ai-slop / scholarly-default scans so
 * technical variable names or `you`-named identifiers inside code
 * spans don't trigger false positives.
 *
 * Does not handle escaped backticks. Markdown's strict rules
 * (matching backtick-run lengths) are not enforced — for our
 * scanner the simpler regex is good enough; the only goal is to
 * suppress obvious inline-code matches.
 */
function stripInlineCode(line: string): string {
  return line.replace(/`[^`]+`/g, "");
}

/**
 * Direct LLM tells — phrases that should NEVER appear in published
 * scholarly prose. These produce few false-positives in practice;
 * any hit is a likely ai-slop violation.
 *
 * Note: the "it's important/worth to note that" pattern was removed
 * after Gemini PR #823 review — those phrases are standard in
 * scholarly technical writing and were producing false positives on
 * legitimate prose at the critical-severity level. The remaining
 * patterns are LLM-specific (lecturer phrases, status updates,
 * conversational fillers).
 */
const AI_SLOP_DIRECT_RE =
  /\b(let me (?:think|clarify|explain|address|now|first|see|walk|break|elaborate|verify|check|confirm)|here'?s what (?:I|we)(?: did| will| have| are doing| think| found| see| observed)?|I'?ll (?:go ahead|now|first|address|explain|verify|check|confirm|do that|take a look|elaborate)|great (?:question|point|catch|observation|note)|happy to (?:help|clarify|elaborate|verify)|(?:sure|of course|absolutely|certainly),?\s*(?:I|let'?s|we)|let'?s (?:explore|dive (?:in|into)|unpack|examine|break (?:this|it) down|see what|think about|consider|walk through)|note that we should|delve (?:into|in)|in (?:a )?nutshell|(?:that's|that is) (?:a )?(?:good|great|excellent|interesting) (?:point|question|catch|observation)|(?:as|just) (?:noted|mentioned|established|discussed|stated)\s+(?:above|earlier)|(?:to|let'?s) (?:break|summarize|recap)|(?:I|we) (?:can|will|should) (?:see|note|observe|verify|check|confirm) that|here you go|there you have it|hope (?:this|that) helps|feel free to|please (?:let me know|don'?t hesitate)|by all means)\b/i;

/**
 * Hedging / softener language frequently inserted by LLMs but
 * inappropriate in a precise mathematical paper. Conservative —
 * single-word hits should be a hint, not necessarily a violation.
 * We treat *combinations* (≥ 3 distinct tokens in the same block)
 * as the actual signal — the threshold balances catching real
 * LLM-output concentrations against the false-positive rate on
 * legitimate technical writing that uses one or two of these words
 * naturally.
 */
const AI_SLOP_HEDGE_TOKENS = [
  /\bessentially\b/i,
  /\bcomprehensive(ly)?\b/i,
  /\bleverag(e|ing|es|ed)\b/i,
  /\bstreamlin(e|ing|es|ed)\b/i,
  /\brobust(ly|ness)?\b/i,
  /\boverall(?:,|\s+then)?\b/i,
  /\bin (?:summary|conclusion),/i,
  /\bcrucial(ly)?\b/i,
  /\bvital(ly)?\b/i,
  /\bfundamental(ly)?\b/i,
  /\bsignificant(ly)?\b/i,
  /\bnotabl[ye]\b/i,
  /\bimportantly\b/i,
  /\bcritical(ly)?\b/i,
  /\bnuance[ds]?\b/i,
  /\bholistic(ally)?\b/i,
  /\bseamless(ly)?\b/i,
  /\bsynerg(y|ies|istic)\b/i,
  /\bcutting[- ]edge\b/i,
  /\bstate[- ]of[- ]the[- ]art\b/i,
  /\binnovativ(e|ely)\b/i,
  /\bgame[- ]chang(er|ing)\b/i,
  /\bdive (?:deep|deeper)\b/i,
  /\bdeep dive\b/i,
  /\btapestry\b/i,
  /\brealm of\b/i,
  /\bjourney\b/i,
  /\blandscape\b/i,
];

/**
 * Lecturer "First, ... Second, ... Third, ..." cadence used as a
 * structural crutch. Strictly: the same prose block must contain
 * "First," and "Second," (as sentence openers) AND "Third," or
 * "Finally,". Real scholarly use of these words in math context
 * (e.g. "First-order term...") will NOT match the comma-anchored
 * pattern.
 */
const AI_SLOP_FIRST_SECOND_THIRD_RE =
  /\bFirst,\s.*?\bSecond,\s.*?\b(?:Third|Finally),\s/is;

export function checkAiSlop(mdPath: string): CheckerResult {
  const { src, lines } = readSource(mdPath);
  if (!src) return { result: "pass", hits: [] };

  const hits: CheckerHit[] = [];

  // Pass 1 — direct LLM tells (line-by-line so we can cite line).
  // Both fenced code blocks (skipped via inFence) and inline
  // backtick spans (stripped per-line) are excluded from the scan.
  let inFence = false;
  const proseLineIndices: number[] = []; // for fence-aware Pass-3 idx
  lines.forEach((l, i) => {
    if (/^```/.test(l.trim())) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;
    proseLineIndices.push(i);
    const cleanedLine = stripInlineCode(l);
    if (AI_SLOP_DIRECT_RE.test(cleanedLine)) {
      hits.push({ file: mdPath, line: i + 1, text: l.trim().slice(0, 200) });
    }
  });

  // Pass 2 — hedge-token concentration. Strip BOTH fenced code
  // blocks AND inline backtick spans, then count distinct hedge
  // tokens in the remaining prose. ≥ 3 distinct hedge tokens in
  // one .md file is the signal.
  const proseOnly = src
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "");
  const distinctHedges = AI_SLOP_HEDGE_TOKENS.filter((re) =>
    re.test(proseOnly),
  );
  if (distinctHedges.length >= 3) {
    hits.push({
      file: mdPath,
      line: 1,
      text: `hedge-token concentration: ${distinctHedges.length} distinct AI-slop softener tokens present (essentially / comprehensive / leverage / streamline / robust / crucial / etc.)`,
    });
  }

  // Pass 3 — First/Second/Third cadence (whole-file scan).
  // Fence-aware idx: find the first "First," that lives on a prose
  // line (not inside a fenced block). Without this, a code snippet
  // containing "First," earlier in the file would mislocate the
  // evidence pointer.
  if (AI_SLOP_FIRST_SECOND_THIRD_RE.test(proseOnly)) {
    const firstProseIdx = proseLineIndices.find((i) =>
      /\bFirst,\s/.test(stripInlineCode(lines[i])),
    );
    hits.push({
      file: mdPath,
      line: firstProseIdx !== undefined ? firstProseIdx + 1 : 1,
      text: "First/Second/Third bullet cadence — characteristic LLM structural crutch",
    });
  }

  return { result: hits.length > 0 ? "fail" : "pass", hits };
}

// ── voice-scholarly-default ─────────────────────────────────────

/**
 * Second-person address — the paper addresses the mathematics, not
 * the reader. "you can see", "the reader will note", etc. are
 * non-scholarly.
 */
const SECOND_PERSON_RE =
  /\b(you (?:can|will|note|see|may|might|should|need|have|are|now|find|get|want|know|notice|observe|understand|imagine|think|try|recall|remember)|your (?:reader|attention|intuition|favourite|favorite)|the reader (?:will|can|may|might|should|finds?|knows?|notices?|observes?|imagines?|recalls?))\b/i;

/**
 * Lecturer cadence — informal sentence openers more at home in a
 * lecture than a paper.
 */
const LECTURER_OPENER_RE =
  /^\s*(?:So (?:what (?:we|I)(?:'re)?(?: going to)?(?: do)?|let'?s|now|first|why|here|the)|Now (?:we (?:want|need|will|are|have|move|turn|introduce|consider)|let'?s|that|here|first|comes?)|OK,?\b|Okay,?\b|Alright,?\b|Well,|Right,?\b|Anyway,|Anyhow,|Basically,|Briefly,|Long story short|Recap:|In short,|To recap,|At this point,?\s+(?:we|let'?s)|First (?:off|things first)|Before (?:we|getting|moving|diving)|Without further ado)/i;

/**
 * Past-tense narration of the paper's own derivation. Paper voice
 * is present-tense for definitions and theorems; past-tense reads
 * as draft narration. Pattern: "we constructed", "we defined",
 * "we showed", "we proved" — limited to first-person plural since
 * generic past tense is fine in proofs ("Hilbert proved ...").
 */
const PAPER_PAST_TENSE_RE =
  /\b(we (?:constructed|defined|showed|proved|established|derived|computed|verified|developed|introduced|formulated|presented|gave|wrote|stated|sketched|argued|claimed|noted|observed|demonstrated|argued|exhibited|obtained))\s+(?:above|earlier|before|previously|in the (?:previous|preceding|earlier)|just\s+now|just\s+above|in (?:a|the) (?:prior|preceding|earlier) (?:section|paragraph|chapter|lemma|theorem|proposition)|several (?:lines|paragraphs|sections) (?:above|back|ago)|further\s+up|up\s+the\s+page)/i;

export function checkScholarlyDefault(
  mdPath: string | undefined,
  leanPath: string | undefined,
): CheckerResult {
  const { lines } = mdPath ? readSource(mdPath) : { src: "", lines: [] };
  if (lines.length === 0 && !leanPath) return { result: "pass", hits: [] };

  const hits: CheckerHit[] = [];

  // Scan .md. Fenced code blocks (```) are skipped via `inFence`;
  // inline backtick spans are stripped per-line so technical terms
  // / identifiers in code don't trigger false positives. HTML-style
  // `<!-- ... -->` comments are intentionally NOT stripped — they
  // render as visible text in the markdown pipeline.
  if (mdPath) {
    let inFence = false;
    lines.forEach((l, i) => {
      if (/^```/.test(l.trim())) {
        inFence = !inFence;
        return;
      }
      if (inFence) return;
      const cleanedLine = stripInlineCode(l);
      if (SECOND_PERSON_RE.test(cleanedLine)) {
        hits.push({ file: mdPath, line: i + 1, text: l.trim().slice(0, 200) });
      }
      if (LECTURER_OPENER_RE.test(cleanedLine)) {
        hits.push({ file: mdPath, line: i + 1, text: l.trim().slice(0, 200) });
      }
      if (PAPER_PAST_TENSE_RE.test(cleanedLine)) {
        hits.push({ file: mdPath, line: i + 1, text: l.trim().slice(0, 200) });
      }
    });
  }

  // Also scan Lean docstrings — proof bodies share the scholarly
  // standard. Extract /-! ... -/ module docs and /-- ... -/ decl
  // docstrings as line-tracked spans so we can cite the actual
  // offending line + quote (not just `line: 1`).
  if (leanPath) {
    const { src: leanSrc } = readSource(leanPath);
    if (leanSrc) {
      for (const span of extractLeanDocstrings(leanSrc)) {
        // span.startLine is 1-based; span.body has the raw text.
        // Iterate INTERNAL docstring lines so we cite the exact
        // offender. The three RE's use the same matchers as the
        // .md scan above (incl. PAPER_PAST_TENSE_RE — missing
        // from the previous version).
        span.body.split("\n").forEach((dl, j) => {
          const cleanedLine = stripInlineCode(dl);
          const lineNo = span.startLine + j;
          // SECOND_PERSON_RE is case-insensitive, not anchored — fine.
          if (SECOND_PERSON_RE.test(cleanedLine)) {
            hits.push({
              file: leanPath,
              line: lineNo,
              text: dl.trim().slice(0, 200) || "(empty)",
            });
          }
          // LECTURER_OPENER_RE uses `^` so it must match line-start.
          // Per-line iteration applies the anchor naturally; the prior
          // whole-doc-string scan needed the `m` flag.
          if (LECTURER_OPENER_RE.test(cleanedLine)) {
            hits.push({
              file: leanPath,
              line: lineNo,
              text: dl.trim().slice(0, 200) || "(empty)",
            });
          }
          if (PAPER_PAST_TENSE_RE.test(cleanedLine)) {
            hits.push({
              file: leanPath,
              line: lineNo,
              text: dl.trim().slice(0, 200) || "(empty)",
            });
          }
        });
      }
    }
  }

  return { result: hits.length > 0 ? "fail" : "pass", hits };
}

/**
 * Extract Lean docstring spans (/-! ... -/ and /-- ... -/) with
 * line-number tracking. Returns `{ startLine, body }` per span,
 * where `startLine` is the 1-based line of the opening delimiter's
 * line in the source, and `body` is the inner text (NOT including
 * the `/-! ` or trailing ` -/`).
 *
 * Handles **nested** block comments — Lean permits `/- /- … -/ -/`
 * — by tracking nesting depth. Without this, a docstring containing
 * a nested `-/` would terminate the span prematurely.
 */
function extractLeanDocstrings(
  src: string,
): Array<{ startLine: number; body: string }> {
  const out: Array<{ startLine: number; body: string }> = [];
  // Find all docstring openers. `/-!` or `/--` followed by anything
  // except `-/`. We do a manual nested scan rather than a regex.
  let i = 0;
  const n = src.length;
  let lineNum = 1;
  // Pre-compute newline positions so startLine is O(1) per opener.
  const newlineAt: number[] = [];
  for (let k = 0; k < n; k++) {
    if (src.charCodeAt(k) === 10 /* \n */) newlineAt.push(k);
  }
  const lineOf = (pos: number): number => {
    // Lower bound on newlineAt for pos.
    let lo = 0;
    let hi = newlineAt.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (newlineAt[mid] < pos) lo = mid + 1;
      else hi = mid;
    }
    return lo + 1;
  };
  void lineNum; // suppress unused

  while (i < n - 2) {
    const isDocOpener =
      src[i] === "/" &&
      src[i + 1] === "-" &&
      (src[i + 2] === "!" || src[i + 2] === "-");
    if (!isDocOpener) {
      i++;
      continue;
    }
    const startLine = lineOf(i);
    // Skip the opening `/-!` or `/--`.
    let j = i + 3;
    let depth = 1;
    while (j < n - 1 && depth > 0) {
      if (src[j] === "/" && src[j + 1] === "-") {
        depth++;
        j += 2;
      } else if (src[j] === "-" && src[j + 1] === "/") {
        depth--;
        j += 2;
      } else if (src[j] === '"') {
        // Skip past Lean string literal so a `"-/"` inside the
        // string does not terminate the docstring prematurely.
        // Handles standard backslash escapes.
        j++;
        while (j < n && src[j] !== '"') {
          if (src[j] === "\\" && j + 1 < n) j += 2;
          else j++;
        }
        if (j < n) j++; // skip closing quote
      } else {
        j++;
      }
    }
    // body = inside the docstring, between opener+3 and the closing -/.
    const bodyEnd = depth === 0 ? j - 2 : j;
    const body = src.slice(i + 3, bodyEnd);
    out.push({ startLine, body });
    i = j;
  }
  return out;
}

// ── voice-author-notes-pollution ──────────────────────────────────
// Detects author-tracking content that belongs in .ts authorNotes
// (per CLAUDE.md §4d), not in scholarly .md prose.
// P1: Status banners  P2: PR/commit refs  P3: Agent names
// P4: ISO dates  P5: Deprecation markers

const AUTHOR_NOTES_STATUS_RE =
  /^>\s*\*\*(?:Status|Caveat|Note|Refined-framing|DEPRECATED|Honest status|Phase \d)/im;
const AUTHOR_NOTES_PR_REF_RE =
  /(?:PR\s*#\s*\d{3,}|commit\s+[a-f0-9]{7,40}|merged\s+(?:to|into|on)\s+main|cherry-pick(?:ed)?|rebas(?:e|ed|ing)\s+(?:onto|clean))/i;
const AUTHOR_NOTES_AGENT_RE =
  /\b(?:Claude|Copilot|Gemini|GPT-4|claude-opus|claude-sonnet|claude-haiku)\b/;
const AUTHOR_NOTES_DATE_RE =
  /\b20(?:25|26)-(?:0[1-9]|1[0-2])-(?:[0-2]\d|3[01])\b/;

export function checkAuthorNotesPollution(mdPath: string): CheckerResult {
  const { lines } = readSource(mdPath);
  const hits: CheckerHit[] = [];
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^```/.test(l.trim())) { inFence = !inFence; continue; }
    if (inFence) continue;
    const stripped = l.replace(/`[^`]+`/g, "");
    if (AUTHOR_NOTES_STATUS_RE.test(stripped))
      hits.push({ file: mdPath, line: i + 1, text: `P1:status-banner: ${l.trim().slice(0, 200)}` });
    if (AUTHOR_NOTES_PR_REF_RE.test(stripped) && !/^--\s*Ref:/.test(stripped))
      hits.push({ file: mdPath, line: i + 1, text: `P2:pr-commit-ref: ${l.trim().slice(0, 200)}` });
    if (AUTHOR_NOTES_AGENT_RE.test(stripped))
      hits.push({ file: mdPath, line: i + 1, text: `P3:agent-name: ${l.trim().slice(0, 200)}` });
    // P4 date check: a date inside a markdown-link target
    // `](…/2026-05-28-foo.md)` or inside a dated filename is part of a
    // path, not prose pollution — stripping it would break the link.
    // Mask link targets + dated filenames before testing so genuine
    // prose dates ("as of 2026-05-28 …") still fail but filename dates
    // (audit-doc cross-references) do not.
    const dateProbe = stripped
      .replace(/\]\([^)]*\)/g, "]")
      .replace(/[\w./-]*\d{4}-\d{2}-\d{2}[\w./-]*\.(?:md|json|py|tex|lean|txt|svg|png)\b/g, "");
    if (AUTHOR_NOTES_DATE_RE.test(dateProbe) && !/^\$/.test(dateProbe) && !/Ref:/.test(dateProbe))
      hits.push({ file: mdPath, line: i + 1, text: `P4:date-ref: ${l.trim().slice(0, 200)}` });
  }
  return { result: hits.length > 0 ? "fail" : "pass", hits };
}

// ── voice-status-section ──────────────────────────────────────────
// Work-tracking SECTION HEADERS do not belong in scholarly .md prose.
// Flags markdown headers whose text carries a status / todo / roadmap
// keyword: `## Status`, `### Status (2026-…)`, `## Formalization status`,
// `## TODO`, `## Pending`, `## Roadmap`, `## Next steps`, `## Work
// remaining`. Status / roadmap content migrates to the `.ts` `authorNotes`
// field (CLAUDE.md §4d); todos move to `.beans/` (owner directive
// 2026-06-13) — never the paper. Complements voice-status-leak (inline
// markers) and voice-author-notes-pollution (banners / PR# / dates).
// Legitimate scholarly sections ("Open problems", "Discussion",
// "Limitations", "Outlook") are NOT flagged. Skips fenced code blocks.
const STATUS_SECTION_HEADER_RE =
  /^#{1,6}\s+(?=.*\b(?:status|todo|to-?do|pending|roadmap|punch\s*list|next\s+steps?|(?:work\s+remaining|remaining\s+work|outstanding\s+work)|implementation\s+plan)\b).*/i;

export function checkStatusSectionHeader(mdPath: string): CheckerResult {
  const { lines } = readSource(mdPath);
  const hits: CheckerHit[] = [];
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^```/.test(l.trim())) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (STATUS_SECTION_HEADER_RE.test(l))
      hits.push({
        file: mdPath,
        line: i + 1,
        text: `status-section-header: ${l.trim().slice(0, 200)}`,
      });
  }
  return { result: hits.length > 0 ? "fail" : "pass", hits };
}

// ── Dispatch table ──────────────────────────────────────────────

export const AUTOMATED_CHECKERS: Record<
  string,
  (paths: { md?: string; ts?: string; lean?: string }) => CheckerResult
> = {
  "voice-status-leak": (p) =>
    p.md ? checkStatusLeak(p.md) : { result: "pass", hits: [] },
  "voice-emoji-content": (p) =>
    p.md ? checkEmojiContent(p.md) : { result: "pass", hits: [] },
  "voice-first-person-work": (p) =>
    p.md ? checkFirstPersonWork(p.md) : { result: "pass", hits: [] },
  "voice-time-stamped-notes": (p) =>
    p.md ? checkTimeStampedNotes(p.md) : { result: "pass", hits: [] },
  "voice-unicode-crash": (p) =>
    p.md ? checkUnicodeCrash(p.md) : { result: "pass", hits: [] },
  "voice-editorializing": (p) =>
    p.md ? checkEditorializing(p.md) : { result: "pass", hits: [] },
  "voice-author-notes-pollution": (p) =>
    p.md ? checkAuthorNotesPollution(p.md) : { result: "pass", hits: [] },
  "voice-status-section": (p) =>
    p.md ? checkStatusSectionHeader(p.md) : { result: "pass", hits: [] },
  "voice-ai-slop": (p) =>
    p.md ? checkAiSlop(p.md) : { result: "pass", hits: [] },
  "voice-scholarly-default": (p) =>
    p.md || p.lean
      ? checkScholarlyDefault(p.md, p.lean)
      : { result: "pass", hits: [] },
  "framework-canonical": (p) =>
    p.md ? checkFrameworkCanonical(p.md) : { result: "pass", hits: [] },
  "wall-side-correct": (p) => checkWallSide(p.md, p.lean, p.ts),
  "wall-base-ring-minimal": (p) => checkBaseRingMinimal(p.lean),
  // Extended checkers for the non-voice integration axes
  // (proof, canonical, compute, detangler, bibliography). The
  // bodies live in `qa-checkers-extended.ts`; the spread below
  // pulls them in as a single source of truth.
  ...EXTENDED_AUTOMATED_CHECKERS,
};
