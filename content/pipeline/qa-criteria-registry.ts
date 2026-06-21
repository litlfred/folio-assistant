/**
 * Registry of QA criteria the per-block sweep recognises.
 *
 * Each criterion is one independently-trackable audit dimension.
 * The sweep walker iterates the registry and, per block, decides
 * whether to run the automated checker or queue an agent / human
 * adjudication request.
 *
 * Domain buckets (current):
 *
 * - `voice` — scholarly voice + status-leak greps (extends
 *   `.claude/skills/local/one-voice-audit.md` with four new
 *   axes: scholarly-default, ai-slop, fit-section-chapter,
 *   framework-canonical, wall-side-correct).
 * - `fit` — does the block belong in its declared sub-section /
 *   section / chapter.
 * - `framework` — uses current canonical math (not deprecated
 *   notation, e.g. old 5-tuple, $\omega$ for fibre functor).
 * - `wall` — archimedean vs algebraic placement, per CLAUDE.md
 *   §7c base-ring convention.
 *
 * Future watchers (proof, canonical, compute, detangler) extend
 * the registry with their own criteria.
 *
 * ── Chapter-scoped criteria (NOT per-block) ──────────────────────
 *
 * Some audit dimensions live on the chapter manifest, not on a block,
 * so they are NOT entries in `QA_CRITERIA_REGISTRY` (the per-block
 * sweep + agent-drain-queue would mis-scope and balloon them). They
 * are run by dedicated standalone scripts instead:
 *
 * - `voice-section-title-coherence` — section/subsection/chapter
 *   titles must be short, concise, and coherent read against their
 *   responsible parent (paper owns chapter titles, chapter owns
 *   section titles, section owns subsection titles). Mechanical
 *   defects (auto-split ` : <tag>` artifacts, trailing colons,
 *   over-long / compound titles) are flagged automatically; the
 *   story-coherence judgement is an agent pass over the emitted
 *   worklist. Script: `content/pipeline/qa-section-title-audit.ts`.
 *
 * @module content/pipeline/qa-criteria-registry
 */

import type { QaCriterionDefinition } from "../../schemas/block-qa";

// ── Domain: voice ───────────────────────────────────────────────

const VOICE: QaCriterionDefinition[] = [
  {
    id: "voice-status-leak",
    domain: "voice",
    description:
      "No status markers in body prose (✅ Done, (TODO), (TBD), **Pending.**). " +
      "Work-tracker speech belongs in todos/, not in the paper.",
    default_severity: "critical",
    depends_on: ["md"],
    automated: true,
  },
  {
    id: "voice-emoji-content",
    domain: "voice",
    description:
      "No emoji used as content (✅, ❌, ⚠, 🔧, 🚧) outside tables. In " +
      "tables, only compact comparison markers (✓ matches / ✗ diverges).",
    default_severity: "major",
    depends_on: ["md"],
    automated: true,
  },
  {
    id: "voice-first-person-work",
    domain: "voice",
    description:
      "No first-person work tone: 'we'll add X', 'let me', 'needs more " +
      "work', 'I'll fix this'. These signal draft state, not paper authority.",
    default_severity: "major",
    depends_on: ["md"],
    automated: true,
  },
  {
    id: "voice-time-stamped-notes",
    domain: "voice",
    description:
      "No time-stamped notes ('as of 2026-…', 'after the recent push', " +
      "'in the current draft'). The paper does not narrate its own draft history.",
    default_severity: "major",
    depends_on: ["md"],
    automated: true,
  },
  {
    id: "voice-unicode-crash",
    domain: "voice",
    description:
      "No Unicode characters that crash pdflatex (↦, ⁻, √, ─, ✅, ·, ²) " +
      "outside preamble-mapped sets. Use LaTeX equivalents in math.",
    default_severity: "critical",
    depends_on: ["md"],
    automated: true,
  },
  {
    id: "voice-editorializing",
    domain: "voice",
    description:
      "No editorialising phrases ('surprisingly', 'remarkably', " +
      "'interestingly', 'it is worth noting that', 'a beautiful result'). " +
      "Results speak for themselves.",
    default_severity: "minor",
    depends_on: ["md"],
    automated: true,
  },
  {
    id: "voice-scholarly-default",
    domain: "voice",
    description:
      "Block uses scholarly third-person voice by default. Applies to " +
      "both narrative .md AND proof bodies (Lean docstrings, expository " +
      "comments inside .lean). Exceptions require explicit author markers. " +
      "Heuristic-automated: second-person address, lecturer-cadence openers, " +
      "paper-past-tense narration. Borderline cases are confirmed / overruled " +
      "by an agent reviewer entry on the same sidecar.",
    default_severity: "major",
    // Applies to narrative prose independently of proofs; relaxed
    // to `["md"]` so prose-only blocks (no `.lean` sibling) still
    // run through the scholarly check.  Lean-docstring scanning is
    // dispatched per-block when the `.lean` is present (see the
    // dispatcher in `qa-checkers-voice.ts`).
    depends_on: ["md"],
    automated: true,
  },
  {
    id: "voice-title-scholarly",
    domain: "voice",
    description:
      "Content block `title:` field is a scholarly noun-phrase (e.g. " +
      "\"Borromean baryon\", \"Quantum-deformed Reeb flow\"), NOT a " +
      "question (\"Why is this important?\"), an imperative " +
      "(\"Compute the Markov trace\"), a first-person aside " +
      "(\"We derive…\"), or a casual marker (\"Quick note on …\"). " +
      "Scanned by extracting the `title:` value from the block's `.ts` " +
      "manifest and applying scholarly-form patterns.",
    default_severity: "minor",
    depends_on: ["ts"],
    automated: true,
  },
  {
    id: "voice-statement-no-interpretation",
    domain: "voice",
    description:
      "Provable block (theorem/proposition/lemma/corollary) STATEMENT is " +
      "the bare claim — interpretation/motivation/physical meaning belongs " +
      "in a SEPARATE `remark` linked via `interprets:`. FAIL (minor) only " +
      "if SUBSTANTIVE interpretive prose (physical meaning, 'why this " +
      "matters', motivation, downstream consequences) follows the " +
      "statement in the SAME block AND no companion `interprets:` remark " +
      "exists to hold it — i.e. the interpretation is genuinely " +
      "mislocated. WARN if an `## Interpretation`/`## Discussion`/" +
      "`## Motivation`/`## Significance` heading is present but its " +
      "content is borderline. PASS if the block is statement+proof only, " +
      "or its interpretation already lives in a linked remark. A short " +
      "clarifying note on scope/applicability is NOT interpretation — " +
      "pass it. A high pass rate is expected.",
    default_severity: "minor",
    depends_on: ["md"],
    automated: false,
    applies_to: ["theorem", "lemma", "proposition", "corollary"],
  },
  {
    id: "voice-ai-slop",
    domain: "voice",
    description:
      "No AI / status-update tells: 'Let me think about this', 'Here's " +
      "what I did', 'I'll go ahead and', 'Note that we should', 'Great " +
      "question', repeated First/Second/Third bullet cadence, over-use of " +
      "'essentially' / 'comprehensive' / 'leverage' / 'streamline' / 'robust'. " +
      "Heuristic-automated: direct LLM tells (zero false-positives in practice), " +
      "≥ 3 distinct hedge tokens in one .md (concentration signal), and " +
      "First/Second/Third comma-anchored sentence cadence. Borderline cases " +
      "are confirmed / overruled by an agent reviewer entry.",
    default_severity: "critical",
    depends_on: ["md"],
    automated: true,
  },
  {
    id: "voice-author-notes-pollution",
    domain: "voice",
    description:
      "No author-tracking content in scholarly .md prose (per CLAUDE.md §4d). " +
      "P1: status banners (> **Status:…**), P2: PR/commit refs (PR #NNN, " +
      "commit abc1234), P3: agent names (Claude, Copilot, Gemini), " +
      "P4: ISO dates (2026-05-NN), P5: deprecation markers. " +
      "These belong in the .ts `authorNotes` field, not in prose.",
    default_severity: "major",
    depends_on: ["md"],
    automated: true,
  },
  {
    id: "voice-status-section",
    domain: "voice",
    description:
      "No work-tracking SECTION HEADERS in scholarly .md prose: " +
      "`## Status`, `### Status (2026-…)`, `## Formalization status`, " +
      "`## TODO`, `## Pending`, `## Roadmap`, `## Next steps`, " +
      "`## Work remaining`. Status / roadmap content migrates to the .ts " +
      "`authorNotes` field (CLAUDE.md §4d); todos move to `.beans/` " +
      "(owner directive 2026-06-13). Complements voice-status-leak " +
      "(inline markers) and voice-author-notes-pollution (banners / PR# / " +
      "dates). Legitimate scholarly sections (Open problems, Discussion, " +
      "Limitations, Outlook) are not flagged. Skips fenced code blocks.",
    default_severity: "major",
    depends_on: ["md"],
    automated: true,
  },
];

// ── Domain: fit ─────────────────────────────────────────────────

const FIT: QaCriterionDefinition[] = [
  {
    id: "fit-section-chapter",
    domain: "fit",
    description:
      "Discriminating placement test — read the block's section/chapter " +
      "scope, then judge against concrete triggers. FAIL (major) if: " +
      "(a) the block's PRIMARY subject is absent from this section's " +
      "stated scope AND squarely belongs to a DIFFERENT chapter's scope " +
      "(genuinely misfiled); OR (b) it restates the substantive claim of " +
      "a same-section sibling without adding a distinct result (true " +
      "redundancy — not a deliberate recap or worked example); OR (c) the " +
      "kind contradicts the content — a `prose`/`remark` asserting a NEW " +
      "provable claim WITH a proof (should be a proposition), or a " +
      "`definition` that names no new construction (should be a remark/" +
      "glossary). WARN (minor) if a different EXISTING section is a " +
      "strictly better home, or the block partially overlaps a sibling. " +
      "PASS once the topic appears in the section/chapter scope and no " +
      "sibling already carries the same claim. A high pass rate is " +
      "expected and correct for mature, already-reviewed chapters — pass " +
      "legitimately; do NOT manufacture fails on well-placed content.",
    default_severity: "major",
    depends_on: ["md", "ts"],
    automated: false,
  },
];

// ── Domain: framework ───────────────────────────────────────────

const FRAMEWORK: QaCriterionDefinition[] = [
  {
    id: "framework-canonical",
    domain: "framework",
    description:
      "Uses current canonical math framework, not deprecated notation. " +
      "Examples of deprecated forms: 5-tuple (M, Θ, G, P, E) instead of " +
      "(C, Θ, G, S); $\\omega$ for fibre functor (canonical: $\\tau$); " +
      "$\\mathcal{C}$ for category (canonical: $\\mathbf{C}$); $E$ alone for " +
      "exceptional divisor or state bundle; bare $H_q$ (now $\\mathcal{H}_q$, " +
      "$\\hat{H}_q$, or $H_n(q)$ depending on meaning).",
    default_severity: "major",
    // The automated checker only scans the .md body for deprecated
    // notation. The .ts manifest carries metadata, not prose; including
    // it here would over-stale on label-only edits.
    depends_on: ["md"],
    automated: true,
  },
];

// ── Domain: wall ────────────────────────────────────────────────

const WALL: QaCriterionDefinition[] = [
  {
    id: "wall-side-correct",
    domain: "wall",
    description:
      "Block (`.lean` body) is on the correct side of the substrate-to-" +
      "archimedean wall (CLAUDE.md §7c). Algebraic Lean code must NOT " +
      "mention `ℝ`, `Real.sqrt`, `Real.rpow`, `Real.log`, `Real.exp`, " +
      "`linarith`, `0 < q`, or other archimedean-specific constructs. " +
      "Archimedean Lean code must declare `ℝ` (or LinearOrderedField) " +
      "explicitly. Each block belongs in either the algebraic substrate " +
      "or the archimedean specialisation, never both.",
    default_severity: "critical",
    // The automated checker scans .lean imports and the .md narrative
    // for an archimedean acknowledgement banner. The .ts manifest is
    // not read — kept out of depends_on to avoid spurious staleness.
    depends_on: ["md", "lean"],
    automated: true,
  },
  {
    id: "wall-base-ring-minimal",
    domain: "wall",
    description:
      "Advisory (§7c base-ring minimality). Flags **algebraic-side** Lean " +
      "(no archimedean ℝ markers) carrying FIELD structure — `[Field R]`, " +
      "`ℚ`, `DivisionRing`, `field_simp` — where the construction is a " +
      "q-deformed / Laurent object that could be restated DIVISION-FREE over " +
      "`ℤ[q, q⁻¹]` (`LaurentPolynomial ℤ`) or a generic `CommRing`, per the " +
      "`R[h]` multiplicative-relation pattern (Borromean " +
      "`IsBorromeanMarkovTrace h t := (h²+4)·t = num`; α_EM as " +
      "`α·[9]_q·[10]_q = q⁻¹` rather than `q⁻¹/([9]_q·[10]_q)`). A `Units` " +
      "inverse `↑q⁻¹` over a `CommRing` is the *target* pattern (not flagged). " +
      "WARN when an algebraic block's `.lean` carries field markers; the " +
      "reviewer adjudicates whether a field is essential (an inverse not " +
      "realizable as a unit, or archimedean evaluation) or whether the " +
      "statement is Laurent-rewritable. PASS if already over a CommRing / " +
      "Laurent ring, archimedean, or the field is essential.",
    default_severity: "minor",
    depends_on: ["lean"],
    automated: true,
  },
  {
    id: "wall-side-statement",
    domain: "wall",
    description:
      "Discriminating wall test on the narrative **Statement**. First " +
      "fix the block's chapter regime: generic-ring/substrate chapters " +
      "(braids-and-knots, quantum-observable-universes, models-of-qous, " +
      "lifting-and-descent, q-geometric-langlands, brings-surface) vs " +
      "explicitly-archimedean ones (observations, descartes-universe, " +
      "*-archimedean appendices, numeric predicted-spectra blocks). FAIL " +
      "(major) if a generic/substrate-chapter statement hard-codes an " +
      "archimedean construct — `Real.sqrt/rpow/log/exp/cos`, a numeric " +
      "`q ≈ <value>`, MeV/physical units, or an order hypothesis " +
      "(`0 < q`, `q < 1`) provable only over ℝ — WITHOUT a `wall:` field " +
      "or a §7c conditional banner; OR if an archimedean-chapter " +
      "statement is a purely algebraic identity that belongs upstream. " +
      "WARN if the statement mixes both regimes without flagging which " +
      "side it is evaluated on. PASS if the statement is generic-ring, " +
      "correctly archimedean-with-banner, or matches its chapter regime. " +
      "(The `q-usage-archimedean-in-categorical-chapter` script pre-flags " +
      "the token signatures; here you adjudicate whether a flagged token " +
      "is a real wall-violation or legitimately banner'd. A high pass " +
      "rate is expected — do not invent fails.)",
    default_severity: "major",
    depends_on: ["md"],
    automated: false,
    applies_to: [
      "theorem",
      "lemma",
      "proposition",
      "corollary",
      "definition",
    ],
  },
  {
    id: "wall-side-proof",
    domain: "wall",
    description:
      "Discriminating wall test on the narrative `**Proof.**` body. FAIL " +
      "(major) if an ALGEBRAIC statement (generic-ring) is proved by " +
      "archimedean-only machinery — `linarith`, IVT / intermediate-value, " +
      "continuity / limit arguments, `Real.*` lemmas, or numeric " +
      "evaluation at `q ≈ <value>` — with no specialisation step " +
      "declared; OR if an ARCHIMEDEAN statement's proof silently assumes " +
      "the algebraic identity without citing the substrate result it " +
      "specialises. WARN if the proof is correct but mixes regimes " +
      "without naming the specialisation point. PASS if the proof method " +
      "matches the statement's side of the wall. (The script flags " +
      "candidate phrasings `linarith`/`IVT`/`continuity`/`Real.`; you " +
      "adjudicate whether they are wall-violations or a properly-declared " +
      "archimedean specialisation. A high pass rate is expected.)",
    default_severity: "major",
    depends_on: ["md"],
    automated: false,
    applies_to: ["theorem", "lemma", "proposition", "corollary"],
  },
];

// ── Domain: q-usage ─────────────────────────────────────────────
//
// Owned by `q-usage-watcher`. Detects how a block treats the substrate
// parameter `q` (symbolic, generic-R, real-positive, root-of-unity,
// fixed-q0, …) and cross-checks the detected regime vector against
// the chapter's narrative-expected profile. See
// `qa-checkers-q-usage.ts` for the regime detector and the
// chapter → expected-regime registry.

const Q_USAGE: QaCriterionDefinition[] = [
  {
    id: "q-usage-regime-detected",
    domain: "q-usage",
    description:
      "Infrastructure criterion — records the block's detected " +
      "q-regime vector (symbolic / generic-R / real-positive / " +
      "real-gt-1 / real-lt-1 / mod-gt-1 / mod-lt-1 / unit-circle / " +
      "root-of-unity / fixed-q0 / na) in the sidecar so downstream " +
      "sweeps + agents can query the classification without re-running " +
      "the detector. Always result `pass`; the regime tags surface " +
      "via the `notes` field on the entry.",
    default_severity: "minor",
    // Only `md` is required — the detector reads md+ts+lean opportunistically
    // and tolerates missing files (#1640-Copilot @ qa-criteria-registry.ts:300).
    depends_on: ["md"],
    automated: true,
    source_file: "content/pipeline/qa-checkers-q-usage.ts",
  },
  {
    id: "q-usage-fixed-q0-leak",
    domain: "q-usage",
    description:
      "Block in a categorical/symbolic chapter (braids-and-knots, " +
      "lifting-and-descent, quantum-universes, appendix-knot-operations, " +
      "appendix-surreals) has a fixed q_0 numerical pin (e.g. " +
      "`q ≈ 1.1097…`, `substrate value`). Categorical blocks should " +
      "state identities for general q; numerical specialisation belongs " +
      "in an archimedean chapter (or in a block explicitly carrying " +
      "an `archimedean-specialisation` tag in its `.ts` manifest). " +
      "Mirrors CLAUDE.md §7c base-ring convention.",
    default_severity: "major",
    // Pin lives in narrative md (q_0 ≈ 1.1097…) — md is the load-bearing
    // file (#1640-Copilot @ qa-criteria-registry.ts:317).
    depends_on: ["md"],
    automated: true,
    source_file: "content/pipeline/qa-checkers-q-usage.ts",
  },
  {
    id: "q-usage-archimedean-in-categorical-chapter",
    domain: "q-usage",
    description:
      "Block in a categorical/symbolic chapter uses archimedean " +
      "Real.* functions (`Real.sqrt`, `Real.cos`, `Real.log`, …), " +
      "archimedean tactics (`linarith`, `positivity`, `norm_num`), " +
      "or numerical observable references (MeV, CODATA, PDG) without " +
      "an explicit `archimedean-specialisation` marker on the `.ts`. " +
      "Categorical chapters should keep statements over generic `R`; " +
      "see CLAUDE.md §7c.",
    default_severity: "major",
    // MeV/CODATA leak appears in md; Real.* leak appears in lean. md is
    // present on nearly every block so anchoring on md catches the
    // common case without forcing n/a on lean-less blocks
    // (#1640-Copilot @ qa-criteria-registry.ts:333).
    depends_on: ["md"],
    automated: true,
    source_file: "content/pipeline/qa-checkers-q-usage.ts",
  },
  {
    id: "q-usage-positivity-implicit",
    domain: "q-usage",
    description:
      "Lean file uses positivity-dependent constructs (`Real.sqrt`, " +
      "`Real.log`, `Real.rpow`) on `q` without an explicit positivity " +
      "hypothesis (`hq : 0 < q`, `hq : 1 < q`, `hq_pos`). Mathlib's " +
      "`Real.sqrt` returns 0 on negative inputs so the proof may still " +
      "compile, but the implicit regime assumption should be made " +
      "explicit. Severity `minor` because it's a code-discipline flag, " +
      "not a correctness bug.",
    default_severity: "minor",
    depends_on: ["lean"],
    automated: true,
    source_file: "content/pipeline/qa-checkers-q-usage.ts",
  },
  {
    id: "q-usage-modulus-vs-real-mismatch",
    domain: "q-usage",
    description:
      "Formal-power-series / shuffle / Macdonald / Hall-Littlewood / " +
      "Habiro-ring context uses a real-line inequality `q > 1` / `q < 1` " +
      "in prose where the convergence regime is naturally `|q| > 1` / " +
      "`|q| < 1`. Heuristic — sometimes the real-line form is the " +
      "intended archimedean specialisation, but the convention should be " +
      "explicit (modulus inequality in the formal context, real-line " +
      "inequality only after specialisation).",
    default_severity: "minor",
    depends_on: ["md"],
    automated: true,
    source_file: "content/pipeline/qa-checkers-q-usage.ts",
  },
  {
    id: "q-usage-root-of-unity-undeclared",
    domain: "q-usage",
    description:
      "Block uses constructions that require `q` to be a root of unity " +
      "(Kashiwara modular crystal, Lusztig integral form, fusion " +
      "category, divided-power algebra, finite-dimensional quantum " +
      "group) without declaring the regime. The chapter " +
      "`q-geometric-langlands` is exempt (root-of-unity is its default " +
      "context); elsewhere the block should state `q = e^{2πi/N}` " +
      "or `q is a primitive N-th root of unity` in prose.",
    default_severity: "minor",
    // Most root-of-unity prose lives in the narrative md
    // (#1640-Copilot @ qa-criteria-registry.ts:381).
    depends_on: ["md"],
    automated: true,
    source_file: "content/pipeline/qa-checkers-q-usage.ts",
  },
  {
    id: "q-usage-narrative-chapter-mismatch",
    domain: "q-usage",
    description:
      "Block's detected regime vector is disjoint from its chapter's " +
      "expected-regime profile — i.e. every detected regime is outside " +
      "the chapter's expected set. Weak condition (single-regime " +
      "mismatches do not fire); meant to catch wholesale mis-placements " +
      "(e.g. a numerical observation block in a categorical chapter). " +
      "The stronger per-regime checks live in `q-usage-fixed-q0-leak` " +
      "and `q-usage-archimedean-in-categorical-chapter`.",
    default_severity: "minor",
    // Regime detector tolerates missing md/lean — only require md
    // (#1640-Copilot @ qa-criteria-registry.ts:397).
    depends_on: ["md"],
    automated: true,
    source_file: "content/pipeline/qa-checkers-q-usage.ts",
  },
];

// ── Domain: proof ───────────────────────────────────────────────
//
// Owned by `proof-integration-watcher`. Each criterion maps to one
// existing Lean / proof skill — the orchestration table lives in
// `.claude/skills/local/proof-integration-watcher.md §Dispatch`.

const PROOF: QaCriterionDefinition[] = [
  {
    id: "proof-no-bare-sorries",
    domain: "proof",
    description:
      "Every `sorry` in the block's `.lean` carries a `-- Ref: [key] <url>` " +
      "citation per CLAUDE.md §1 (proof-status-tracking). Bare `sorry` " +
      "without a reference is always a review failure.",
    default_severity: "critical",
    depends_on: ["lean"],
    automated: true,
    applies_to: [
      "theorem",
      "lemma",
      "proposition",
      "corollary",
      "definition",
      "conjecture",
    ],
  },
  {
    id: "proof-no-axiom-growth",
    domain: "proof",
    description:
      "Block's `#print axioms` set is a subset of the same block's axiom " +
      "set on `origin/main`. Verified against the doc-gen4 axiom-report. " +
      "Routes to `lean-witness-audit` on failure.",
    default_severity: "critical",
    depends_on: ["lean"],
    automated: true,
    applies_to: ["theorem", "lemma", "proposition", "corollary"],
  },
  {
    id: "proof-build-green",
    domain: "proof",
    description:
      "Block's Lake package builds clean. On failure routes to " +
      "`lean-build-fix`. Result is read from the `proof-objects.json` " +
      "manifest emitted by `lean_ci.yml`.",
    default_severity: "critical",
    depends_on: ["lean"],
    automated: true,
    applies_to: [
      "theorem",
      "lemma",
      "proposition",
      "corollary",
      "definition",
    ],
  },
  {
    id: "proof-narrative-lean-equiv",
    domain: "proof",
    description:
      "The .md statement and the .lean signature express the SAME claim. " +
      "Compare element-by-element: quantifiers (∀/∃ and their domains), " +
      "hypotheses (every Lean `[Class]`/`(h : …)` ↔ a narrative " +
      "'assume/where' clause), and the conclusion. FAIL (major) if they " +
      "diverge in a theorem-changing way: the narrative claims `∀` but " +
      "Lean proves a single instance; a hypothesis present in Lean is " +
      "absent from the narrative (or vice-versa); the conclusions differ; " +
      "or the Lean is a `sorry`-stub / `True`-placeholder while the " +
      "narrative asserts a real result. WARN if they agree up to a " +
      "notational gap (renamed variable, implicit-vs-explicit binder) a " +
      "reader could reconcile. PASS only after confirming quantifiers + " +
      "hypotheses + conclusion match. A faithful Lean encoding of a " +
      "correct narrative is the expected case — pass it.",
    default_severity: "major",
    depends_on: ["md", "lean"],
    automated: false,
    applies_to: ["theorem", "lemma", "proposition", "corollary"],
  },
  {
    id: "proof-substantive",
    domain: "proof",
    description:
      "Block's Lean does NOT use the abstract `holds : Prop` placeholder " +
      "without a matching `[Instance]` hypothesis on the downstream " +
      "consumer (CLAUDE.md §3b-cond). Routes to `lean-substantive-pass`.",
    default_severity: "major",
    depends_on: ["lean"],
    automated: true,
    applies_to: ["theorem", "lemma", "proposition", "corollary"],
  },
  {
    id: "proof-no-conj-propagation-violation",
    domain: "proof",
    description:
      "Provable block (theorem/proposition/lemma/corollary) whose " +
      "transitive `uses[]` cone touches a `conj:` label is either " +
      "demoted to `conjecture` OR satisfies the §3b-cond exception " +
      "(class-axiomatised conjecture + [Instance] hypothesis + " +
      "narrative banner). Reads cached witness " +
      "`docs/audits/2026-05-01-p3-1-conjectural-propagation.witness.json`.",
    default_severity: "critical",
    depends_on: ["ts"],
    automated: true,
    applies_to: ["theorem", "lemma", "proposition", "corollary"],
  },
  {
    id: "proof-no-trivial-skeleton",
    domain: "proof",
    description:
      "Block's `.lean` does not contain a trivial-skeleton pattern " +
      "(`def f := 0`, `:= PUnit`, `:= True`, `:= id`, `:= trivial`, " +
      "`:= rfl`, etc.) that encodes none of the conjectural content. " +
      "Reads cached witness " +
      "`docs/audits/2026-05-08-trivial-skeleton-audit.json` (keyed " +
      "by `.lean` path).",
    default_severity: "major",
    depends_on: ["lean"],
    automated: true,
  },
  {
    id: "proof-conditional-class-banner",
    domain: "proof",
    description:
      "Block classified as conditional-on-class by the conjectural- " +
      "propagation audit has both (a) a Lean class-hypothesis `[Inst : " +
      "C ...]` in its `.lean`, AND (b) a narrative banner `**Theorem " +
      "(conditional on …).**` in its `.md` (CLAUDE.md §3b-cond rules " +
      "2-4). Reads cached witness " +
      "`docs/audits/2026-05-09-conditional-class-banner.witness.json`.",
    default_severity: "major",
    depends_on: ["md", "lean"],
    automated: true,
    applies_to: ["theorem", "lemma", "proposition", "corollary"],
  },
  {
    id: "proof-lean-compiles",
    domain: "proof",
    description:
      "Block's `.lean` file compiles without errors. Uses the lean-lsp " +
      "MCP server (`lean_diagnostic_messages`) to get real compiler " +
      "diagnostics rather than relying on CI artefacts. Reads cached " +
      "diagnostics from `docs/audits/lean-compile-diagnostics.json` " +
      "(populated by `content/pipeline/lean-compile-audit.ts` or by " +
      "agent invocation of lean-lsp tools). Returns `n/a` when no " +
      "cache exists. Routes to `lean-build-fix` on failure.",
    default_severity: "critical",
    depends_on: ["lean"],
    automated: true,
    applies_to: [
      "theorem",
      "lemma",
      "proposition",
      "corollary",
      "definition",
      "conjecture",
    ],
  },
  // ── Rater rubric (AlphaProof-Nexus adoption 2026-06-07) ──────────
  //    Agent-SCORED quality criteria (not pass/fail): populate
  //    QaCriterionEntry.score (value 0–1, max 1). Owned by
  //    proof-integration-watcher (rate) + integration-backlog (improve).
  {
    id: "proof-rater-strategy-clarity",
    domain: "proof-rater",
    description:
      "QUALITY SCORE (0–1, write to QaCriterionEntry.score, max 1) — NOT a " +
      "pass/fail gate. Is the proof STRATEGY explicit and legible: would a " +
      "competent reader know the plan before reading the steps? 1.0 = plan " +
      "stated up front (cited lemmas / named case split); 0.5 = recoverable " +
      "but implicit; 0.0 = opaque step-dump. Low score routes to " +
      "`proof-simplifier` / `proof-conciseness`. From the AlphaProof-Nexus " +
      "rater rubric (arXiv 2605.22763).",
    default_severity: "minor",
    depends_on: ["md", "lean"],
    automated: false,
    applies_to: ["theorem", "lemma", "proposition", "corollary"],
  },
  {
    id: "proof-rater-goal-plausibility",
    domain: "proof-rater",
    description:
      "QUALITY SCORE (0–1, write to score, max 1) — NOT pass/fail. For any " +
      "remaining `sorry`/gap, how plausible is closing it? Cross-reference " +
      "the gap-criticality tag (`proof-gap-audit` §Gap criticality): " +
      "`routine` ⇒ ~0.9, `core` ⇒ ~0.3, `restates-target` ⇒ 0.0 (the gap " +
      "IS the goal). A sorry-free proof ⇒ 1.0. Routes to `proof-triage` / " +
      "`lean-build-fix`. From the AlphaProof-Nexus rater rubric (plausibility " +
      "of remaining goals).",
    default_severity: "minor",
    depends_on: ["lean"],
    automated: false,
    applies_to: ["theorem", "lemma", "proposition", "corollary", "conjecture"],
  },
  {
    id: "proof-rater-novelty",
    domain: "proof-rater",
    description:
      "QUALITY SCORE (0–1, write to score, max 1) — NOT pass/fail. Does the " +
      "proof/approach add something non-redundant vs the corpus, or is it a " +
      "near-duplicate of a sibling proof? 1.0 = novel argument; 0.5 = " +
      "standard but not duplicated; 0.0 = redundant (candidate for " +
      "`proposition-consolidation-audit`). From the AlphaProof-Nexus rater " +
      "rubric (novelty).",
    default_severity: "minor",
    depends_on: ["md", "lean"],
    automated: false,
    applies_to: ["theorem", "lemma", "proposition", "corollary"],
  },
  // ── SafeVerify / verify_integrity (AlphaProof-Nexus adoption) ────
  {
    id: "proof-statement-integrity",
    domain: "proof",
    description:
      "Guards against 'passing' a proof by weakening the statement or " +
      "injecting an axiom. The provable-kind signature (name / binders / " +
      "hypotheses / conclusion) is UNCHANGED vs the prior commit unless an " +
      "author-approved restatement is reflected in .md + .ts in the same " +
      "diff; AND `lean_verify` shows no `sorryAx` / unexpected axioms on a " +
      "decl claimed proved. Agent-checked (git diff + lean-lsp). Routes to " +
      "`lean-proof-review` (Review Type 4). From AlphaProof-Nexus " +
      "SafeVerify / verify_integrity (arXiv 2605.22763).",
    default_severity: "critical",
    depends_on: ["lean"],
    automated: false,
    applies_to: ["theorem", "lemma", "proposition", "corollary"],
  },
  // ── Vacuous-proof family (lean-proof-vacuity-audit) ──────────────
  //
  // Semantic anti-patterns that PASS `proof-statement-integrity`
  // (signature unchanged + no sorryAx) yet carry no mathematical
  // content. Agent-checked; see
  // `.claude/skills/local/lean-proof-vacuity-audit.md`.
  {
    id: "proof-no-self-assuming-projection",
    domain: "proof",
    description:
      "The proof is NOT a verbatim projection of a structure/class field " +
      "whose type IS the declaration's own conclusion. Anti-pattern: " +
      "`structure D where claim : C  …  theorem foo (d : D) : C := d.claim` " +
      "(or `:= ⟨d.claim_a, d.claim_b⟩`, `:= ctx.claim_foo`) — the goal is " +
      "assumed as a field and handed back (P ⊢ P), with sibling hypothesis " +
      "fields unused. LEGITIMATE: the proof COMPOSES fields / derives via " +
      "lemmas (`Iff.intro h.fwd h.bwd`; `obtain ⟨…⟩ := upstream; <derivation>`) " +
      "per §3b-cond. Agent-checked (Lean AST + field-type unification). " +
      "Routes to `lean-proof-review`. Evaluate the decl the `lean.ref` RESOLVES to (sibling first, then library decl-path): a trivial `: True` sibling that shadows a real library decl is a DELETION target (see CLAUDE.md §0a no-shadowing-stubs), and a genuine placeholder stub (no library decl) is FLAGGED as unformalised — neither is silently blessed.",
    default_severity: "critical",
    depends_on: ["lean"],
    automated: false,
    applies_to: ["theorem", "lemma", "proposition", "corollary"],
  },
  {
    id: "proof-no-trivial-true",
    domain: "proof",
    description:
      "The stated goal is NOT a tautology that any proof discharges " +
      "vacuously: the conclusion is not `True`, not a syntactic `x = x` / " +
      "`0 = 0`, and not a `holds : Prop` field instantiated as `True`; AND " +
      "a proof that ignores all hypotheses to close `True`/`rfl` is flagged. " +
      "LEGITIMATE: genuine reflexivity results where `rfl` IS the content " +
      "(definitional unfolding establishing a named equation). Agent-checked. " +
      "Routes to `lean-proof-review`. Evaluate the decl the `lean.ref` RESOLVES to (sibling first, then library decl-path): a trivial `: True` sibling that shadows a real library decl is a DELETION target (see CLAUDE.md §0a no-shadowing-stubs), and a genuine placeholder stub (no library decl) is FLAGGED as unformalised — neither is silently blessed.",
    default_severity: "critical",
    depends_on: ["lean"],
    automated: false,
    applies_to: ["theorem", "lemma", "proposition", "corollary"],
  },
  {
    id: "proof-no-false-premise",
    domain: "proof",
    description:
      "The theorem does not rely on a false or contradictory premise (e.g., " +
      "`h : False`, `h : 0 = 1`, or an uninhabited type) that makes the " +
      "implication trivially true via `False.elim`. Agent-checked. " +
      "Routes to `lean-proof-review`.",
    default_severity: "critical",
    depends_on: ["lean"],
    automated: false,
    applies_to: ["theorem", "lemma", "proposition", "corollary"],
  },
  {
    id: "proof-no-unused-hypotheses",
    domain: "proof",
    description:
      "The proof utilizes all stated hypotheses. Unused hypotheses " +
      "often indicate that the proven statement is weaker than intended, " +
      "or that the hypotheses were added to satisfy an interface without " +
      "genuine mathematical dependence. Agent-checked (Lean unused vars lint). " +
      "Routes to `lean-proof-review`.",
    default_severity: "major",
    depends_on: ["lean"],
    automated: false,
    applies_to: ["theorem", "lemma", "proposition", "corollary"],
  },
  {
    id: "proof-no-decide-masking",
    domain: "proof",
    description:
      "The proof does not use `decide` or `trivial` to mask an incomplete " +
      "or vacuous goal state where a substantive structural proof is " +
      "expected. Computational reflection (`decide`) must be justified. " +
      "Agent-checked. Routes to `lean-proof-review`.",
    default_severity: "critical",
    depends_on: ["lean"],
    automated: false,
    applies_to: ["theorem", "lemma", "proposition", "corollary"],
  },
];

// ── Domain: canonical ───────────────────────────────────────────
//
// Owned by `canonical-watcher`. Enforces the three-calibration
// discipline (`prop:three-calibration-discipline`) and bans
// numerology / fits.

const CANONICAL: QaCriterionDefinition[] = [
  {
    id: "canonical-calibration-count",
    domain: "canonical",
    description:
      "Block declares at most 3 calibration anchors (CODATA m_e + α + " +
      "G_Planck normalisation, per the three-calibration discipline). " +
      "Counted by scanning the .md / .ts for `calibration:` / " +
      "`anchor:` markers. Routes to a manual `canonical-watcher` review " +
      "on fail (cannot auto-resolve a 4th calibration).",
    default_severity: "critical",
    depends_on: ["md", "ts"],
    automated: true,
  },
  {
    id: "canonical-no-numerology",
    domain: "canonical",
    description:
      "Block does not claim numerical coincidence without a categorical " +
      "derivation chain. Scans .md for signal phrases: `miraculous`, " +
      "`surprising agreement`, `numerical coincidence`, `remarkably " +
      "close`, `happens to equal`, `empirically matches`. Provable " +
      "blocks (thm/prop/lem/cor) fail on any hit; remarks/conjectures " +
      "get severity=minor (numerology in context is expected there).",
    default_severity: "critical",
    depends_on: ["md"],
    automated: true,
    applies_to: ["theorem", "lemma", "proposition", "corollary",
      "conjecture", "remark"],
  },
  {
    id: "canonical-witness-pinned",
    domain: "canonical",
    description:
      "Every `:val[…]` directive in the .md references an existing " +
      "witness JSON under `folio-assistant/computations/*.witness.json`, " +
      "and the block's `computation:` field matches (or is absent and " +
      "the implicit dep is declared). Routes to `witnessed-values` skill.",
    default_severity: "major",
    depends_on: ["md", "ts"],
    automated: true,
  },
  {
    id: "canonical-script-not-deprecated",
    domain: "canonical",
    description:
      "The block's `computation.script` does not reference a deprecated " +
      "or SUPERSEDED module. Checks the script file (if it exists) for " +
      "`SUPERSEDED`, `DEPRECATED`, or imports of known retired modules " +
      "(`mass_endomorphism`, `LAMBDA_PROTON_DOC`, `LAMBDA_NEUTRON_DOC`). " +
      "Routes to compute-audit for migration.",
    default_severity: "major",
    depends_on: ["ts"],
    automated: true,
  },
  {
    id: "canonical-dilogarithm-context",
    domain: "canonical",
    description:
      "Φ_q (Faddeev) appears only in mass-anchor blocks; Li_2^q " +
      "(Rogers) appears only in binding-context blocks. Mixing the " +
      "two q-dilogarithms violates bar-symmetry discipline (cheat-" +
      "sheet §4). Scans .md for `Phi_q` / `\\Phi_q` / `faddeev` in " +
      "binding-tagged blocks and `Li_2\\^q` / `rogers` / `li2q` in " +
      "mass-anchor-tagged blocks.",
    default_severity: "major",
    depends_on: ["md", "ts"],
    automated: true,
  },
  {
    id: "canonical-no-hardcoded-observable",
    domain: "canonical",
    description:
      "Block .md does not use exact-equality (`=`) with hardcoded " +
      "MeV/keV/eV values for derived observables. Derived values " +
      "must use `≈` / `\\approx` / `\\simeq` or carry an explicit " +
      "error term (CLAUDE.md §7ab). Catches CODATA literals used as " +
      "production inputs.",
    default_severity: "major",
    depends_on: ["md"],
    automated: true,
  },
  {
    id: "canonical-cal4-acknowledged",
    domain: "canonical",
    description:
      "Blocks whose .ts or .md contains a CAL-4 caveat comment " +
      "(`CAL-4`, `4th calibration`, `demoted prop → conj`) must be " +
      "kind=conjecture OR carry an explicit acknowledgment banner " +
      "in the .md (`CAL-4 caveat`, `q-source open`). Provable blocks " +
      "with unacknowledged CAL-4 caveats are discipline violations.",
    default_severity: "critical",
    depends_on: ["md", "ts"],
    automated: true,
    applies_to: ["theorem", "lemma", "proposition", "corollary",
      "conjecture"],
  },
  {
    id: "canonical-ck-tiered-not-binary",
    domain: "canonical",
    description:
      "Complement to `canonical-no-negative-result-in-paper` (#1574, " +
      "which catches falsified/superseded probe-block leakage via tags " +
      "/ Status banners). This criterion catches the prose-framing " +
      "mode: precision-ladder blocks (Q_β c_k, α_EM Habiro factor, any " +
      "convergent truncation-order series) must report coefficient " +
      "provenance TIERED (proved / near-match / fitted), never as a " +
      "binary negative result. Scans .md for flip-flop signal phrases " +
      "(`un-wire`, `drop c_k`, `just a fit`, `fails to beat`, " +
      "`should be reverted`, `negative result`) in ladder context " +
      "(tags `precision-ladder`/`1ppb-roadmap`/`habiro` or prose " +
      "mentioning `precision ladder`/`truncation order`/`c_k`/`Habiro " +
      "element`). Passes if the block carries tiered vocabulary " +
      "(`near-match`/`tier`) or cites " +
      "`2026-05-31-qbeta-ck-truncation-order-canonical-framing.md` " +
      "(Rule 4). Prevents the four-session wire/un-wire flip-flop from " +
      "re-entering the paper as flat negative-result prose.",
    default_severity: "major",
    depends_on: ["md", "ts"],
    automated: true,
    applies_to: ["theorem", "lemma", "proposition", "corollary",
      "conjecture", "remark"],
  },
  {
    id: "canonical-no-negative-result-in-paper",
    domain: "canonical",
    description:
      "Paper block whose primary content is a negative empirical " +
      "finding (tag 'negative-result' / 'falsified' / 'superseded' / " +
      "'scaffolding'; or .md opening with `## Status: ... falsified` " +
      "or `## Status: open R&D — no known` or `**Hypothesis falsified**` " +
      "or an `Errata banner ... superseded`) should be in `docs/audits/`, " +
      "not the paper. Routes to a manual `canonical-watcher` review on " +
      "fail; the fix is to move the content to a dated audit doc and " +
      "cite it from a one-line forward reference. `kind: conjecture` " +
      "blocks are exempt (open conjectures legitimately document " +
      "open / partially-falsified directions). Authoring discipline " +
      "established by `docs/audits/2026-05-31-ck-exploratory-probes-" +
      "removed.md` after the c_k/d_k flip-flop saga.",
    default_severity: "major",
    depends_on: ["md", "ts"],
    automated: true,
    applies_to: ["definition", "theorem", "lemma", "proposition",
      "corollary", "remark", "prose", "equation", "diagram"],
  },
];

// ── Domain: compute ─────────────────────────────────────────────
//
// Owned by `compute-integration-watcher`. Implements the 13-pattern
// I1-I13 audit + LP-dual-witness validator (CLAUDE.md "LP / SDP
// duals — first-class infra").

const COMPUTE: QaCriterionDefinition[] = [
  {
    id: "compute-prop-has-probe",
    domain: "compute",
    description:
      "Every `prop:`/`theorem:` block has a corresponding probe witness " +
      "under `folio-assistant/computations/`, OR a sorry-free Lean proof " +
      "(which is a stronger guarantee). The probe is the I1 of the " +
      "13-pattern audit: a numerical check that the proposition's claim " +
      "holds at a representative parameter point.",
    default_severity: "major",
    depends_on: ["ts"],
    automated: true,
    applies_to: ["theorem", "lemma", "proposition", "corollary"],
  },
  {
    id: "compute-prop-has-consumer",
    domain: "compute",
    description:
      "Every `prop:` is consumed by at least one production script (I2- " +
      "I13 of the 13-pattern audit). A prop with a probe but no consumer " +
      "is a NOT-WIRED prop. Routes to `compute-integration-watcher §B`.",
    default_severity: "major",
    depends_on: ["ts"],
    automated: true,
    applies_to: ["theorem", "lemma", "proposition", "corollary"],
  },
  {
    id: "compute-witness-exists",
    domain: "compute",
    description:
      "If the block's `.ts` declares `computation: { witness: '…' }`, " +
      "the referenced witness JSON exists on disk and is non-empty. " +
      "Routes to the `compute-audit` skill on fail.",
    default_severity: "critical",
    depends_on: ["ts"],
    automated: true,
  },
  {
    id: "compute-lp-dual-present",
    domain: "compute",
    description:
      "For LP/SDP/operator-selection witnesses (matched per CLAUDE.md " +
      "`lp_dual_witness_validator.py` hint list), the witness JSON " +
      "includes `y0_star`, `y_star`, `active_set` (or alias), " +
      "`primal_obj`, `dual_obj`, `duality_gap`. Mirrors the standalone " +
      "validator.",
    default_severity: "critical",
    depends_on: ["ts"],
    automated: true,
  },
];

// ── Domain: detangler ───────────────────────────────────────────
//
// Owned by `detangler-integration-watcher`. Enforces the structural
// rules H1-H7 (no forward refs), R1-R3 (section band 3-18 blocks),
// and the cross-chapter forward-edge ban.

const DETANGLER: QaCriterionDefinition[] = [
  {
    id: "detangler-no-forward-ref",
    domain: "detangler",
    description:
      "Block's same-chapter `uses:` targets do not appear later in the " +
      "chapter's ordered `sections[].blocks[]`. Forward refs force the " +
      "reader to skip ahead. Deterministic: `checkDetanglerNoForwardRef` " +
      "builds the block-position map from the chapter manifests and " +
      "fails (major) listing each offending target + its position. " +
      "Cross-chapter forward refs are the separate " +
      "`detangler-no-xchapter-fwd` criterion; reorder-invariant cycles " +
      "are `detangler-no-dependency-cycle`.",
    default_severity: "major",
    depends_on: ["ts"],
    automated: true,
  },
  {
    id: "detangler-section-band",
    domain: "detangler",
    description:
      "Each `## Section` in the chapter contains between 3 and 18 " +
      "NON-PROSE blocks (R1-R3). Block kinds are resolved per slug so " +
      "narrative prose is excluded from the count; the sparse (<3) check " +
      "additionally skips intro/overview sections (H4). Out-of-band " +
      "sections invite either skim-and-skip (>18) or trivial-aside " +
      "dilution (<3).",
    default_severity: "minor",
    depends_on: ["ts"],
    automated: true,
  },
  {
    id: "detangler-no-xchapter-fwd",
    domain: "detangler",
    description:
      "Block's cross-chapter `uses:` references do not point at a chapter " +
      "later in `paper.ts` ordering. Cross-chapter forward edges break the " +
      "linear reading promise of a folio.",
    default_severity: "major",
    depends_on: ["ts"],
    automated: true,
  },
  {
    id: "detangler-archimedean-wall",
    domain: "detangler",
    description:
      "Chapter-level archimedean wall placement: blocks whose .lean is " +
      "purely archimedean live in `archimedean-universe/` / `observations/` / " +
      "`fluid-dynamics/`. Generic-R blocks live in `braids-and-knots/` / " +
      "`quantum-observable-universes/` / `quantum-universes/`. " +
      "Companion to `wall-side-correct` (per-block) — this one is " +
      "per-chapter placement.",
    default_severity: "major",
    depends_on: ["ts", "lean"],
    automated: true,
  },
  {
    id: "detangler-block-tanglement",
    domain: "detangler",
    description:
      "Per-block tanglement score (cross-chapter forward-ref count) plus " +
      "a descriptive graph-metrics payload: out_degree / in_degree / " +
      "cone_size (transitive blast radius) / fwd_received / edge_span / " +
      "depth (longest dependency chain, a proof-depth proxy) / pagerank " +
      "(weighted centrality refining in-degree). High tanglement or deep/" +
      "central placement signals a block that may warrant a split, " +
      "relocation, or dependency-edge pruning.",
    default_severity: "major",
    depends_on: ["ts"],
    automated: true,
  },
  {
    id: "detangler-graph-energy",
    domain: "detangler",
    description:
      "Per-block contribution to the chapter's graph energy: the sum, " +
      "over same-SECTION `uses:` edges that point forward in the " +
      "manifest order, of the manifest-position distance to each " +
      "target. Cross-section forward edges reflect the chapter's " +
      "intentional face ordering (Algebraic→Geometric→…), not a " +
      "reorderable local tangle, and are excluded. Weights forward " +
      "refs by reach (a definition used 30 " +
      "blocks later is a deeper tangle than one used 2 blocks later) — " +
      "the magnitude that the binary `detangler-no-forward-ref` count " +
      "misses. `pass` at energy 0, `warn` for any forward edge, `fail` " +
      "(major) at energy ≥ 100 (far above the ~18 corpus median nonzero " +
      "energy — gates only pathological tangles). Emits `graph_energy`, " +
      "`fwd_edge_count`, " +
      "`worst_span` in the entry's `metrics`. Mirrors the " +
      "`chapter-complexity-review` energy metric per block.",
    default_severity: "major",
    depends_on: ["ts"],
    automated: true,
  },
  {
    id: "detangler-topic-coherence",
    domain: "detangler",
    description:
      "Keyword-based topic-fit heuristic (ported from " +
      "`block-density-audit.py`): a block whose prose scores more " +
      "chapter-keyword hits for some OTHER chapter than for its own " +
      "home chapter is a relocation/split candidate. Soft (`warn`, " +
      "minor) since keyword overlap is noisy; the `metrics` payload " +
      "records `home_chapter`, `home_score`, `top_other_chapter`, " +
      "`top_other_score` for reviewer adjudication. Only audits " +
      "substantive blocks (> 20 non-blank .md lines); `n/a` otherwise.",
    default_severity: "minor",
    depends_on: ["md"],
    automated: true,
  },
  {
    id: "detangler-no-dependency-cycle",
    domain: "detangler",
    description:
      "No `uses[]` dependency CYCLE through this block. Distinct from " +
      "`detangler-no-forward-ref` (a position check that a reorder can " +
      "satisfy): a cycle is reorder-invariant — when two blocks each " +
      "`uses:` the other (e.g. `prop:A` ↔ `prop:B`), or a longer loop " +
      "closes, NO chapter ordering removes the forward edge. A cycle " +
      "signals a genuine structural tangle: prune one dependency edge, " +
      "merge the mutually-defining blocks, or factor the shared content " +
      "into a third block both depend on. Fails (major) with the cycle " +
      "path as evidence.",
    default_severity: "major",
    depends_on: ["ts"],
    automated: true,
  },
];

// ── Domain: bibliography ────────────────────────────────────────
//
// Block-level bibliography QA. Per-reference QA lives in the
// separate `content/pipeline/bib-qa.ts` (writes `bib-qa.json`); this
// domain projects the relevant per-reference findings DOWN to each
// content block that cites the reference, so a block's `.qa.json`
// surfaces its bibliography-readiness alongside its voice / proof /
// canonical / compute / detangler axes.

const BIBLIOGRAPHY: QaCriterionDefinition[] = [
  {
    id: "bib-cite-resolves",
    domain: "bibliography",
    description:
      "Every `\\cite{key}` and `-- Ref: [key]` in the block resolves to a " +
      "registered entry in `content/schema/references.ts`. Mirrors the " +
      "`validate-bib` skill's resolution check at block granularity.",
    default_severity: "critical",
    depends_on: ["md", "lean"],
    automated: true,
  },
  {
    id: "bib-cited-ref-has-url",
    domain: "bibliography",
    description:
      "Every reference the block cites has a URL or DOI (resolves to one) " +
      "per `bib-qa.ts` tag `has_url`. A block citing an URL-less reference " +
      "fails — the reader has no way to consult the source.",
    default_severity: "major",
    depends_on: ["md", "lean"],
    automated: true,
  },
  {
    id: "bib-cited-ref-metadata-ok",
    domain: "bibliography",
    description:
      "Every reference the block cites has complete metadata (title, " +
      "author/editor, year) per `bib-qa.ts` tag `metadata_ok`.",
    default_severity: "major",
    depends_on: ["md", "lean"],
    automated: true,
  },
  {
    id: "bib-cited-ref-has-screenshot",
    domain: "bibliography",
    description:
      "Every reference the block cites has a screenshot under " +
      "`content/bib-qa-images/<id>.*` per `bib-qa.ts` tag " +
      "`has_screenshot`. Provides provenance for the citation.",
    default_severity: "minor",
    depends_on: ["md", "lean"],
    automated: true,
  },
];

// ── Domain: script-quality ──────────────────────────────────────
//
// Audits **script files** (not content blocks). Sidecar is
// per-script `.script-qa.json`, schema in
// `folio-assistant/schemas/script-qa.ts`. Driven by
// `content/pipeline/script-sweep.ts`.
//
// Planned criteria (one PR per checker):
//   - does_not_default_to_float   (implemented, this PR)
//   - respects_archimedean_wall   (TODO — CLAUDE.md §7c)
//   - code_is_commented           (TODO)
//   - variables_typed             (TODO)
//   - has_references_to_paper     (TODO)
//   - connected_to_ci_pipeline    (TODO)
//   - deprecated                  (TODO — also cross-axis to blocks)
//   - uses_library_framework_appropriately (TODO — `_precision`,
//                                  no hardcoded numerics, reads
//                                  from witness JSONs)

const SCRIPT_QUALITY: QaCriterionDefinition[] = [
  {
    id: "does_not_default_to_float",
    domain: "script-quality",
    description:
      "Python script source contains no bare float literals (`1.0`, " +
      "`0.5`, `3.14e-10`, `1_000.5`, …) or unchecked `float(...)` " +
      "casts. Use `mpmath.mpf(\"...\")`, `Decimal(\"...\")`, or pin " +
      "the value via a witness JSON. Allow-listed sentinels (case- " +
      "insensitive, optional trailing comma): `float(\"inf\")`, " +
      "`float(\"-inf\")`, `float(\"nan\")`, `float(\"infinity\")`, " +
      "`float(\"-infinity\")`. Heuristic whole-source regex scan; " +
      "string literals and `#` comments are stripped before matching " +
      "to avoid false positives. Multiline casts and one level of " +
      "nested parens (`float(int(x))`) are handled; deeper nesting, " +
      "PEP 515 underscore validation, and bare floats inside f-string " +
      "expression regions (`f'{1.0}'`) are documented heuristic " +
      "limitations. Format-spec contexts (`{x:.2f}`, `{x:0.4f}`) are " +
      "correctly exempted from false positives via a `:` lookbehind. " +
      "Remaining false positives are addressed with a `human` reviewer " +
      "override on the script's sidecar.",
    default_severity: "major",
    // `"ts"` is the conventional primary-source-file key in
    // `QaFieldHash` across every QA axis (extension-agnostic — the
    // script-quality axis hashes `.py` / `.rs` files under it). With
    // an empty `depends_on` the staleness logic could never detect
    // a script-source change.
    depends_on: ["ts"],
    automated: true,
    source_file: "content/pipeline/qa-checkers-python.ts",
  },
  {
    id: "compute_no_mpf_to_float_cast",
    domain: "script-quality",
    description:
      "Python script does NOT cast mpmath / sympy precision-bearing " +
      "values to float64. Flags ONLY guaranteed-destroyer patterns: " +
      "`float(<x>.evalf(...))`, `float(mp.<x>)`, `float(mpmath.<x>)`, " +
      "`numpy.float64(<x>)`, `np.float64(<x>)`. These are unambiguous " +
      "precision-loss sites — once a 50-dps value passes through " +
      "float64, the L1 1-ppQ goal becomes unreachable for that compute " +
      "path. Critical severity (vs `does_not_default_to_float` which is " +
      "major and broader). String literals and `#` comments are masked " +
      "before scanning to avoid documentation false positives. Author " +
      "directive (2026-06-09): 'float64 is EVIL'.",
    default_severity: "critical",
    depends_on: ["ts"],
    automated: true,
    source_file: "content/pipeline/qa-checkers-python.ts",
  },
  {
    id: "respects_archimedean_wall",
    domain: "script-quality",
    description:
      "Python script does not call archimedean-realization " +
      "functions (`math.sqrt`, `math.log`, `math.exp`, `math.cos`, " +
      "`numpy.float64`, …) for substrate-precision values. Per " +
      "CLAUDE.md §7c, archimedean constructs belong in " +
      "`archimedean-universe/` / `observations/` specialised modules; " +
      "the generic algebraic / categorical layer should use the " +
      "mpmath equivalents (`mp.sqrt`, `mp.log`, `mp.exp`, …) which " +
      "preserve the 50-digit working precision. Heuristic scan of " +
      "function names; strings and comments are stripped before " +
      "matching so narrative references do not produce false " +
      "positives. Authors of legitimate archimedean modules " +
      "override with a `human` reviewer `result: \"n/a\"` entry.",
    default_severity: "major",
    depends_on: ["ts"],
    automated: true,
    source_file: "content/pipeline/qa-checkers-python.ts",
  },
  {
    id: "code_is_commented",
    domain: "script-quality",
    description:
      "Python script has either a module-top docstring " +
      "(`\"\"\"…\"\"\"` immediately after any `from __future__` " +
      "imports) or comment-line density ≥ 10% of non-blank lines. " +
      "A bare script with no docstring and no inline commentary " +
      "becomes opaque to future readers; this criterion encodes " +
      "the minimum-documentation contract. Severity is `minor` — " +
      "an undocumented script is still functionally correct.",
    default_severity: "minor",
    depends_on: ["ts"],
    automated: true,
    source_file: "content/pipeline/qa-checkers-python.ts",
  },
  {
    id: "variables_typed",
    domain: "script-quality",
    description:
      "Python function definitions carry type annotations on " +
      "every parameter (excluding `self`, `cls`, `*args`, " +
      "`**kwargs`, `_`). Untyped parameters are flagged with the " +
      "function name + offending parameter list. Heuristic — " +
      "regex-based scan of `def NAME(args)` patterns; multi-line " +
      "signatures with line breaks inside the parameter list are " +
      "a known false-negative case. Authors add `: Any` where the " +
      "type genuinely is untyped.",
    default_severity: "minor",
    depends_on: ["ts"],
    automated: true,
    source_file: "content/pipeline/qa-checkers-python.ts",
  },
  {
    id: "has_references_to_paper",
    domain: "script-quality",
    description:
      "Python script contains at least one `# Ref: [key] …` " +
      "comment citing a bibliography entry (matching the Lean " +
      "convention from CLAUDE.md §1 — every `sorry` requires a " +
      "bibliographic citation; the same discipline applies to " +
      "compute scripts that derive content from the paper). The " +
      "citation lets a reviewer trace the script back to the " +
      "proposition / theorem it computes. Pure-infrastructure " +
      "scripts (no paper-derived content) override with a `human` " +
      "reviewer `result: \"n/a\"` entry.",
    default_severity: "minor",
    depends_on: ["ts"],
    automated: true,
    source_file: "content/pipeline/qa-checkers-python.ts",
  },
  {
    id: "connected_to_ci_pipeline",
    domain: "script-quality",
    description:
      "Python script is exercised by CI — its basename appears in " +
      "at least one `.github/workflows/*.yml` file, OR it is " +
      "imported (as a library / helper module) by a sibling script. " +
      "Scripts not connected to CI accumulate silent regressions; " +
      "this criterion flags them as candidates for either CI " +
      "wiring or `_deprecated/`. `__init__.py`, `conftest.py`, and " +
      "scripts under `_deprecated/` get an `n/a` result. Note: " +
      "this checker reads workflow files outside the audited " +
      "script — cached per sweep run for performance.",
    default_severity: "minor",
    depends_on: ["ts"],
    automated: true,
    source_file: "content/pipeline/qa-checkers-python.ts",
  },
  {
    id: "deprecated",
    domain: "script-quality",
    description:
      "Python script is flagged as deprecated when ANY of: path " +
      "contains `/_deprecated/`, file contains a `# DEPRECATED` " +
      "comment line, or the module docstring contains the word " +
      "\"DEPRECATED\" verbatim. Severity `minor` — deprecation is " +
      "a status flag, not a correctness bug. A `human` reviewer " +
      "entry can move an intentionally-retained deprecated script " +
      "to `pass`. Cross-axis to content blocks: a sibling " +
      "criterion in the block-QA axis flags deprecated `.md` / " +
      "`.ts` content the same way.",
    default_severity: "minor",
    depends_on: ["ts"],
    automated: true,
    source_file: "content/pipeline/qa-checkers-python.ts",
  },
  {
    id: "uses_library_framework_appropriately",
    domain: "script-quality",
    description:
      "Python script consumes the standard library framework " +
      "appropriately: (1) scripts that write `.witness.json` " +
      "must import `WitnessBuilder` from `witness_base` so the " +
      "payload is stamped with provenance + script-hash metadata; " +
      "(2) no hardcoded math constants (`pi = 3.14…`, `e = 2.71…`) " +
      "— use `mpmath.mp.pi` / `mpmath.mp.e` for 50-digit substrate " +
      "precision. Strings and `#` comments are stripped before " +
      "scanning to avoid false positives on narrative references.",
    default_severity: "major",
    depends_on: ["ts"],
    automated: true,
    source_file: "content/pipeline/qa-checkers-python.ts",
  },
];

// ── Domain: devils-advocate ─────────────────────────────────────
//
// Owned by `local/devils-advocate-watcher` (adversarial review).
// All criteria are agent-only (automated: false).

const DEVILS_ADVOCATE: QaCriterionDefinition[] = [
  { id: "da-false-claim", domain: "devils-advocate", description: "Stated proposition is mathematically false (counterexample / quantifier slip / failing special case).", default_severity: "critical", depends_on: ["md", "ts", "lean"], automated: false },
  { id: "da-vacuous", domain: "devils-advocate", description: "True but content-free: ': True := trivial', self-assuming projection, tautology, or trivializing hypothesis.", default_severity: "major", depends_on: ["md", "ts", "lean"], automated: false },
  { id: "da-circular", domain: "devils-advocate", description: "Derivation assumes its conclusion: back-fitted target, smuggled calibration, self-referential justification.", default_severity: "critical", depends_on: ["md", "ts", "lean"], automated: false },
  { id: "da-overclaim", domain: "devils-advocate", description: "Conclusion stronger than the argument supports: scope-limited negative as structural, fitted-as-derived, conditional-as-proved, approximate-as-absolute.", default_severity: "major", depends_on: ["md", "ts", "lean"], automated: false },
  { id: "da-hidden-dof", domain: "devils-advocate", description: "Undisclosed free parameter: 4th calibration, off-menu coefficient, constant with no canonical-chain origin.", default_severity: "major", depends_on: ["md", "ts", "lean"], automated: false },
  { id: "da-non-sequitur", domain: "devils-advocate", description: "Logical gap: step B does not follow from step A; 'therefore' with a missing lemma.", default_severity: "major", depends_on: ["md", "ts", "lean"], automated: false },
  { id: "da-lean-narrative-divergence", domain: "devils-advocate", description: "Lean proves something weaker/different/vacuously-implied vs the .md claim (proof-statement-integrity).", default_severity: "major", depends_on: ["md", "ts", "lean"], automated: false },
  { id: "da-citation-misuse", domain: "devils-advocate", description: "Cited reference (cites[] or -- Ref:) does not contain / is mis-attributed for the invoked result.", default_severity: "minor", depends_on: ["md", "ts", "lean"], automated: false },
  { id: "da-definitional-ambiguity", domain: "devils-advocate", description: "Key term undefined / multiple incompatible readings / 'the unique X' without uniqueness / implicit regime or base ring.", default_severity: "minor", depends_on: ["md", "ts", "lean"], automated: false },
  { id: "da-empirical-fragility", domain: "devils-advocate", description: "Numerical match inside fit noise / cherry-picked precision / hidden cross-anchor swing / stale vs current q0 pin.", default_severity: "major", depends_on: ["md", "ts", "lean"], automated: false },
  { id: "da-physical-implausibility", domain: "devils-advocate", description: "Physics claim a domain expert rejects: wrong units, broken conservation, contradiction with a measurement.", default_severity: "major", depends_on: ["md", "ts", "lean"], automated: false },
  { id: "da-reproducibility", domain: "devils-advocate", description: "Backing compute/witness irreproducible / stale (scriptHash or scriptCommitSha drift) / value contradicts prose approximate.", default_severity: "major", depends_on: ["md", "ts", "lean"], automated: false },
  { id: "da-referee-verdict", domain: "devils-advocate", description: "Block-level rollup; carries the 'verdict' field + the strongest objection in 'referee_argument'.", default_severity: "major", depends_on: ["md", "ts", "lean"], automated: false }
];

// ── Exported registry ───────────────────────────────────────────

export const QA_CRITERIA_REGISTRY: QaCriterionDefinition[] = [
  ...VOICE,
  ...FIT,
  ...FRAMEWORK,
  ...WALL,
  ...Q_USAGE,
  ...PROOF,
  ...CANONICAL,
  ...COMPUTE,
  ...DETANGLER,
  ...BIBLIOGRAPHY,
  ...SCRIPT_QUALITY,
  ...DEVILS_ADVOCATE,
];

export const SCRIPT_QUALITY_CRITERIA: string[] = SCRIPT_QUALITY.map(
  (c) => c.id,
);

export const QA_CRITERIA_BY_ID: Record<string, QaCriterionDefinition> =
  Object.fromEntries(QA_CRITERIA_REGISTRY.map((c) => [c.id, c]));

export const QA_CRITERIA_BY_DOMAIN: Record<string, QaCriterionDefinition[]> =
  QA_CRITERIA_REGISTRY.reduce(
    (acc, c) => {
      (acc[c.domain] ??= []).push(c);
      return acc;
    },
    {} as Record<string, QaCriterionDefinition[]>,
  );

// Per-watcher criterion subsets. Each integration watcher reads
// its own subset to compute backlog + dispatch agent reviews.

/**
 * The set of criteria the `one-voice-integration-watcher` is
 * responsible for. Mirrors the historical voice + fit + framework +
 * wall buckets.
 */
export const ONE_VOICE_WATCHER_CRITERIA: string[] = [
  ...VOICE.map((c) => c.id),
  ...FIT.map((c) => c.id),
  ...FRAMEWORK.map((c) => c.id),
  ...WALL.map((c) => c.id),
];

export const PROOF_WATCHER_CRITERIA: string[] = PROOF.map((c) => c.id);
export const CANONICAL_WATCHER_CRITERIA: string[] = CANONICAL.map((c) => c.id);
export const COMPUTE_WATCHER_CRITERIA: string[] = COMPUTE.map((c) => c.id);
export const DETANGLER_WATCHER_CRITERIA: string[] = DETANGLER.map(
  (c) => c.id,
);
export const BIBLIOGRAPHY_WATCHER_CRITERIA: string[] = BIBLIOGRAPHY.map(
  (c) => c.id,
);
export const Q_USAGE_WATCHER_CRITERIA: string[] = Q_USAGE.map((c) => c.id);

/**
 * All 7 watcher buckets, keyed by watcher short name (matches the
 * `/integration-watch` / `/integration-backlog` axis arguments).
 */
export const WATCHER_CRITERIA_BY_AXIS: Record<string, string[]> = {
  "one-voice": ONE_VOICE_WATCHER_CRITERIA,
  proof: PROOF_WATCHER_CRITERIA,
  canonical: CANONICAL_WATCHER_CRITERIA,
  compute: COMPUTE_WATCHER_CRITERIA,
  detangler: DETANGLER_WATCHER_CRITERIA,
  bibliography: BIBLIOGRAPHY_WATCHER_CRITERIA,
  "q-usage": Q_USAGE_WATCHER_CRITERIA,
};

// ── Source-file + extra-input declaration (script staleness) ────

/**
 * Path (repo-relative) to the source file containing each automated
 * checker function. Used by qa-sweep to compute the entry's
 * `script_hash` and write per-criterion script sidecars.
 *
 * `qa-checkers-voice.ts` hosts the original voice / framework /
 * wall checkers (10 criteria); `qa-checkers-extended.ts` hosts
 * everything else (proof, canonical, compute, detangler,
 * bibliography, voice-title-scholarly).
 */
export const VOICE_CHECKER_FILE =
  "content/pipeline/qa-checkers-voice.ts";
export const EXTENDED_CHECKER_FILE =
  "content/pipeline/qa-checkers-extended.ts";

const VOICE_FILE_IDS = new Set<string>([
  "voice-status-leak",
  "voice-emoji-content",
  "voice-first-person-work",
  "voice-time-stamped-notes",
  "voice-unicode-crash",
  "voice-editorializing",
  "voice-ai-slop",
  "voice-scholarly-default",
  "framework-canonical",
  "wall-side-correct",
]);

/**
 * Resolve a criterion's source file. Honours the explicit
 * `source_file` field on the registry entry; otherwise applies
 * the dispatch-table heuristic above.
 */
export function getCriterionSourceFile(criterionId: string): string {
  const def = QA_CRITERIA_BY_ID[criterionId];
  if (def?.source_file) return def.source_file;
  if (VOICE_FILE_IDS.has(criterionId)) return VOICE_CHECKER_FILE;
  return EXTENDED_CHECKER_FILE;
}

/**
 * Extra-input files some criteria consult beyond the block under
 * audit. Paths are repo-relative. Listed inputs are concatenated
 * + hashed into the entry's `deps_hash`.
 *
 * Criteria absent from this map have no extra inputs and write no
 * `deps_hash`.
 */
export const CRITERION_EXTRA_INPUTS: Record<string, string[]> = {
  "proof-no-conj-propagation-violation": [
    "docs/audits/2026-05-01-p3-1-conjectural-propagation.witness.json",
  ],
  "proof-no-trivial-skeleton": [
    "docs/audits/2026-05-08-trivial-skeleton-audit.json",
  ],
  "proof-conditional-class-banner": [
    "docs/audits/2026-05-09-conditional-class-banner.witness.json",
  ],
  "proof-lean-compiles": [
    "docs/audits/lean-compile-diagnostics.json",
  ],
  "bib-cite-resolves": ["content/schema/references.ts"],
  "bib-cited-ref-has-url": ["content/schema/references.ts"],
  "bib-cited-ref-metadata-ok": ["content/schema/references.ts"],
  "bib-cited-ref-has-screenshot": ["content/schema/references.ts"],
};

/** Resolve a criterion's extra-input list (`[]` if none). */
export function getCriterionExtraInputs(criterionId: string): string[] {
  const def = QA_CRITERIA_BY_ID[criterionId];
  if (def?.extra_inputs) return def.extra_inputs;
  return CRITERION_EXTRA_INPUTS[criterionId] ?? [];
}
