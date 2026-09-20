#!/usr/bin/env bun
/**
 * Vacuity-by-construction axis — two AST checks over a block's `.lean`.
 *
 * ## The defect
 *
 * A class carries data fields and a propositional field relating them. An
 * instance then chooses the data so that the proposition becomes `rfl`:
 *
 *     class ConfinementGradingCorrespondence ... where
 *       confLevel        : NormalForm → ℕ
 *       klrTopDegree     : NormalForm → ℕ
 *       filtrations_agree : ∀ T, confLevel T = klrTopDegree T   -- the conjecture
 *
 *     instance canonical ... where
 *       confLevel    _ := 0
 *       klrTopDegree _ := 0
 *       filtrations_agree _ := rfl                              -- 0 = 0
 *
 * The conjecture is not proved. It is *avoided*, by making both filtrations
 * identically zero. And because this was an unconditional `instance`, typeclass
 * resolution supplied it for every `R` and `q`, so every downstream theorem
 * taking the class as a hypothesis became unconditional and vacuous.
 *
 * ## Why this is a different check from the ones already here
 *
 * `check-self-discharging-instances.ts` looks at the **proof**: it flags a
 * propositional field discharged by `rfl`. That is the wrong half. Plenty of
 * legitimate instances discharge a field by `rfl` because the fact genuinely is
 * reflexivity — which is why that checker reports 125 instances and cannot rank
 * the 17 it calls trivial.
 *
 * The tell is the **data**. The proposition became `rfl` *because* the data
 * fields were chosen constant. Requiring both halves — degenerate data AND a
 * reflexivity discharge — is far more specific, and it does not fire on an
 * instance that computes something.
 *
 * `proof-no-trivial-true` in the registry covers the neighbouring case where
 * the *stated goal* is a tautology. It is `automated: false`, agent-checked.
 * This axis is `automated: true`, which is the point: the conjunction above is
 * syntactic, so it costs no agent turns.
 *
 * ## Scope, honestly
 *
 * Syntactic. It catches data that is *written* as a constant. It does not catch
 * data that is constant for a non-obvious reason — `confLevel T := T.length * 0`,
 * or a value that happens not to vary. That residue needs a reading pass or
 * Lean-level `whnf` introspection, and this file does not pretend to cover it.
 *
 * The durable fix is neither check: give the class a non-degeneracy field
 * (`nondegenerate : ∃ T, confLevel T ≠ 0`) so a zero model cannot be written at
 * all. Detection is the fallback for classes that already exist.
 */

import { readFileSync, existsSync } from "fs";
import type { CheckerResult, CheckerHit } from "./qa-checkers-voice";

/** A field assignment inside a structure-instance body. */
interface FieldAssign {
  name: string;
  value: string;
  line: number;
  /**
   * Whatever stood between the field name and `:=`.
   *
   * For `poleIndicator rho := decide (rho ≤ -1)` this is `rho` — the binders
   * the author wrote on the left. For `d : ∀ c, … := 0` it is a type
   * ascription and starts with `:`. `checkNoDefinitionalLaundering` uses it to
   * recover binder names when the field was written point-full rather than as
   * a lambda; every other reader ignores it.
   */
  binders: string;
}

/**
 * Values that make a data field carry no information.
 *
 * `default` and `Classical.arbitrary` are included because they are the
 * idiomatic way to say "some element, I do not care which" — which is exactly
 * the intent this axis exists to surface.
 */
const DEGENERATE_VALUE =
  /^(?:0|1|⊥|⊤|∅|PUnit\.unit|Unit\.unit|\(\)|default|True|trivial|Nat\.zero|List\.nil|\[\]|Finset\.empty|Classical\.arbitrary\b.*)$/;

/** Discharges that prove nothing on their own. */
const TRIVIAL_DISCHARGE =
  /^(?:rfl|trivial|True\.intro|\.intro|by\s+(?:rfl|trivial|simp|norm_num|decide|omega|constructor)\s*$|fun\s+_+\s*=>\s*rfl|fun\s+_+\s*=>\s*trivial|Or\.inl\s+rfl|⟨⟩)$/;

/**
 * A field whose name reads as a claim rather than as data.
 *
 * Lean has no marker distinguishing a `Prop` field from a data field in the
 * instance body — the body is just `name := value` — so the field's *name* is
 * the available signal, and Mathlib-style naming makes it a good one. Kept
 * deliberately broad: a false positive here costs one line of review, while a
 * miss is the defect shipping.
 */
const CLAIM_FIELD_NAME =
  /(?:_eq$|_eq_|_agree|agree$|_le$|_lt$|_ne$|_iff|_zero|_one|_comm|_assoc|_spec$|holds$|valid|sound|complete|nondegenerate|nonzero|nontrivial|_mem$|_subset|_pos$|_bound|collapses|converges|exact$|vanish)/;

/** Names that read as data rather than as a claim. */
function isClaimField(name: string): boolean {
  return CLAIM_FIELD_NAME.test(name);
}

/**
 * Split a declaration body into `field := value` assignments.
 *
 * Handles the `where` form (`instance foo : C where` then indented fields) and
 * the anonymous-constructor form (`⟨a, b⟩` is NOT handled — positional
 * constructors carry no field names, so there is nothing to key on and the
 * declaration is skipped rather than guessed at).
 */
export function parseFieldAssigns(body: string, startLine: number): FieldAssign[] {
  const out: FieldAssign[] = [];
  const lines = body.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.replace(/--.*$/, "").trimEnd();
    if (!line.trim()) continue;
    // `name := value` or `name arg _ := value`; the head is the field name.
    const m = line.match(/^\s+([A-Za-z_][A-Za-z0-9_'!?]*)\s*((?:[^:=]|:(?!=))*?):=\s*(.*)$/);
    if (!m) continue;
    const name = m[1];
    let value = m[3].trim();
    // A value continued on following lines: absorb deeper-indented lines.
    const indent = raw.length - raw.trimStart().length;
    let j = i + 1;
    while (j < lines.length) {
      const nxt = lines[j];
      if (!nxt.trim()) { j++; continue; }
      const nIndent = nxt.length - nxt.trimStart().length;
      if (nIndent <= indent) break;
      value += " " + nxt.trim();
      j++;
    }
    out.push({ name, value: value.trim(), line: startLine + i, binders: m[2].trim() });
  }
  return out;
}

/** Declarations that inhabit a structure: `instance`/`def` … `where`. */
interface Decl {
  kind: "instance" | "def" | "theorem" | "abbrev";
  name: string;
  header: string;
  body: string;
  line: number;
  docstring: string;
}

/** Split a Lean file into top-level declarations, with preceding docstrings. */
export function parseDecls(src: string): Decl[] {
  const lines = src.split("\n");
  const out: Decl[] = [];
  let doc = "";
  let inDoc = false;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^\s*\/--/.test(l)) { inDoc = true; doc = l; if (/-\/\s*$/.test(l)) inDoc = false; continue; }
    if (inDoc) { doc += "\n" + l; if (/-\/\s*$/.test(l)) inDoc = false; continue; }
    const m = l.match(
      /^(?:@\[[^\]]*\]\s*)?(?:noncomputable\s+|private\s+|protected\s+|scoped\s+)*(instance|def|theorem|abbrev)\s+([A-Za-z_][A-Za-z0-9_'.!?]*)/,
    );
    if (!m) { if (l.trim()) doc = ""; continue; }
    // Body: everything until the next top-level declaration or `end`.
    let j = i + 1;
    const bodyLines: string[] = [];
    while (j < lines.length) {
      const nxt = lines[j];
      if (/^(?:@\[|\/--|noncomputable\s|private\s|protected\s|instance\s|def\s|theorem\s|abbrev\s|structure\s|class\s|end\s|namespace\s|section\s)/.test(nxt)) break;
      bodyLines.push(nxt);
      j++;
    }
    out.push({
      kind: m[1] as Decl["kind"],
      name: m[2],
      header: l,
      body: bodyLines.join("\n"),
      line: i + 1,
      docstring: doc,
    });
    doc = "";
    i = j - 1;
  }
  return out;
}

/**
 * `lean-no-vacuous-instance-data` — degenerate data **and** a reflexivity
 * discharge, in the same declaration.
 *
 * Both halves are required. Degenerate data alone is often fine (a genuinely
 * zero object); a `rfl` discharge alone is often fine (a real reflexivity).
 * Together they mean the claim was arranged away rather than proved.
 *
 * And a third condition, added 2026-08-24: the declaration must do no
 * substantive proof work anywhere. Without it the conjunction fires on a
 * declaration that supplies ONE degenerate-looking datum beside genuinely
 * non-constant data — see `doesSubstantiveWork`.
 */
/**
 * The sibling criterion's conjunction, as a predicate on one declaration.
 *
 * Factored out because `lean-no-definitional-laundering` needs to know whether
 * this check already fires on a decl: the two criteria are meant to partition
 * the defect, not to double-report it. Behaviour is unchanged — this is the
 * body of the loop below, lifted.
 */
function vacuousDataConjunction(
  d: Decl,
): { degenerateData: FieldAssign[]; trivialClaims: FieldAssign[] } | null {
  if (d.kind !== "instance" && d.kind !== "def") return null;
  // `where` is tested against the whole declaration, not just its first
  // line: a real instance signature wraps, and the motivating case put
  // `where` three lines down after the instance binders. Requiring it in the
  // header alone missed every multi-line declaration — which is most of them.
  if (!/\bwhere\b/.test(d.header + "\n" + d.body)) return null;
  const fields = parseFieldAssigns(d.body, d.line);
  if (fields.length < 2) return null;

  const degenerateData = fields.filter(
    (f) => !isClaimField(f.name) && DEGENERATE_VALUE.test(f.value),
  );
  const claimFields = fields.filter((f) => isClaimField(f.name));
  const trivialClaims = claimFields.filter((f) => TRIVIAL_DISCHARGE.test(f.value));
  if (degenerateData.length === 0 || trivialClaims.length === 0) return null;
  if (fields.some((f) => !isClaimField(f.name) && isArgumentDependent(f))) return null;
  return { degenerateData, trivialClaims };
}

/**
 * A data field whose value genuinely depends on an argument it binds.
 *
 * The veto this serves: **a declaration that computes from its arguments is not
 * dodging an obligation.** Constant data is the entire mechanism of the defect
 * this criterion looks for — `carrier := PUnit`, `frobWeight _ := 1`,
 * `hecke_relation := True`. A field that reads its own binder cannot be part of
 * that mechanism, and its presence means the degenerate-looking siblings are a
 * corner of a working model.
 *
 * `sl3DemazureLevelOne` (`QOU/Machinery/KashiwaraCrystalBasic.lean`) is the
 * corpus case that forced this. It is the three-vertex crystal written
 * *specifically* to give `DemazureSubcrystal.demazure_closure` teeth — a proper
 * sub-crystal `{0,1}` whose closure is checked by exhaustion — and the
 * conjunction fired on it because `highest := 0` matched `DEGENERATE_VALUE`
 * (there it is a vertex index, not a degenerate value) and `highest_mem := by
 * decide` matched `TRIVIAL_DISCHARGE` (there it evaluates `0 ≠ 2`). Its sibling
 * `member := fun v => v ≠ 2` reads `v`, and nothing about the declaration is
 * arranged away. Firing on the declaration written to *fix* the defect is the
 * worst failure mode this criterion has: it reads as evidence the fix did not
 * take.
 *
 * **Why not the sibling criterion's `doesRealWork` veto** ("some field carries a
 * tactic proof, or some claim is non-trivially discharged"). Measured on the qou
 * corpus it takes this criterion from 26 hits to 6, and the 20 it removes are
 * overwhelmingly true positives: `triv_hecke` survives it on
 * `carrier_addCommGroup := by infer_instance`, and
 * `witnessR5Full_deuterium_placeholder` on a `by simp` carrying an inline
 * comment — neither of which is work. `isSubstantiveDischarge` is calibrated for
 * a population whose fields are already known non-constant; here it is a
 * `by`-detector. Argument-dependence removes exactly one hit, the false
 * positive.
 *
 * Wildcard binders do not count: `mul _ _ := PUnit.unit` and `centralIdem _ :=
 * 𝟙 _` discard their arguments, which is what constant data looks like when the
 * field has a function type.
 */
function isArgumentDependent(f: FieldAssign): boolean {
  const lam = splitLambda(f.value);
  const binders = lam
    ? lam.binders
    : f.binders.startsWith(":")
      ? []
      : f.binders.split(/\s+/).filter(Boolean);
  const body = lam ? lam.body : f.value;
  return binders
    .filter((b) => !b.startsWith("_"))
    .some((b) =>
      new RegExp(`(?<![A-Za-z0-9_'!?₀-₉])${escapeRe(b)}(?![A-Za-z0-9_'!?₀-₉])`).test(body),
    );
}

export function checkNoVacuousInstanceData(leanPath?: string): CheckerResult {
  if (!leanPath || !existsSync(leanPath)) return { result: "n/a", hits: [] };
  let src: string;
  try { src = readFileSync(leanPath, "utf8"); } catch { return { result: "n/a", hits: [] }; }

  const hits: CheckerHit[] = [];
  for (const d of parseDecls(src)) {
    const conj = vacuousDataConjunction(d);
    if (!conj) continue;
    const { degenerateData, trivialClaims } = conj;

    // An unconditional `instance` is the severe form: typeclass resolution
    // supplies it everywhere, so downstream hypotheses stop being hypotheses.
    //
    // But only if the carrier is a VARIABLE. An instance at a concrete object —
    // `instance foo : R5FullWitness LightNucleus.helium3`, binding nothing — is
    // resolved for that one object and nothing else, so its degenerate fields
    // are a claim about helium-3 rather than about every carrier. Both survivors
    // of the 2026-08-24 demotion sweep were this shape, and both had already
    // been cleared by hand. Detected by the absence of binder groups before the
    // `:` in the header, which is what universal quantification looks like here.
    const bindsCarrier = /^[^:]*[({\[]/.test(d.header.replace(/^(?:@\[[^\]]*\]\s*)?(?:noncomputable\s+|private\s+|protected\s+|scoped\s+)*(?:instance|def)\s+[A-Za-z_][A-Za-z0-9_'.!?]*/, ""));
    const severity = d.kind === "instance" && bindsCarrier ? "instance" : "def";
    for (const c of trivialClaims) {
      hits.push({
        file: leanPath,
        line: c.line,
        text:
          `${severity} \`${d.name}\`: claim field \`${c.name} := ${c.value}\` is ` +
          `discharged by reflexivity, and the data it constrains is degenerate ` +
          `(${degenerateData.map((f) => `${f.name} := ${f.value}`).join(", ")}). ` +
          `The claim is arranged away, not proved.` +
          (d.kind === "instance" && bindsCarrier
            ? " As an `instance` over a variable carrier it is resolved everywhere, so downstream theorems taking this class are unconditional."
            : d.kind === "instance"
              ? " Resolved only at this concrete carrier, so the claim is about that object rather than every carrier — lower severity."
              : ""),
      });
    }
  }
  return { result: hits.length ? "fail" : "pass", hits };
}

/** Docstring words that assert the term is honestly incomplete. */
const HONESTY_CLAIM =
  /\b(?:carries?\s+(?:the\s+)?\w*\s*(?:conjecture|obstruction|claim)?\s*as\s+a\s+sorry|as\s+a\s+`?sorry`?|with\s+a\s+`?sorry`?|sorry\s*=\s*the|axiomatis|axiomatiz|research-grade\s+conjecture)\b/i;

/**
 * A docstring that explicitly denies carrying a `sorry`.
 *
 * Needed because the remedy for this criterion is usually to rewrite the
 * docstring and say what really discharges the term — which normally means
 * quoting the false claim being corrected.
 */
const NEGATED_HONESTY_CLAIM =
  /\b(?:no\s+`?sorry`?|not\s+a\s+`?sorry`?|without\s+(?:a\s+)?`?sorry`?|there\s+is\s+no\s+`?sorry`?|contains?\s+(?:no|neither)\b|sorry-free|rather\s+than\s+(?:as\s+)?a\s+`?sorry`?|not\s+by\s+a\s+`?sorry`?)/i;

/**
 * A *past-tense* mention: the term used to carry a `sorry` and no longer does.
 *
 * Recording that history is good practice in this corpus — "carried here as a
 * `sorry` until 2026-08-17 (bean `qou-gjg6`); it is not provable by this route,
 * and it was deleted" is a docstring doing its job. Reading it as a present
 * claim inverts the criterion, flagging the note precisely because it is
 * thorough.
 */
const PAST_TENSE_SORRY =
  /\b(?:was|were|had\s+been|used\s+to\s+be|until\s+\d{4}-\d{2}-\d{2}|formerly|previously|no\s+longer|since\s+deleted|has\s+been\s+(?:removed|deleted|discharged|replaced))\b/i;

/**
 * `lean-docstring-honesty` — a docstring that claims the term carries a
 * `sorry` (or is axiomatised) when the body contains neither.
 *
 * Cheap and high-signal. `ConfinementGradingCorrespondence.canonical` said
 * *"Faithful instance. Carries the explicit research-grade conjecture as a
 * sorry"* and contained no `sorry` at all — it discharged the conjecture by
 * setting both filtrations to zero. That is strictly worse than a `sorry`,
 * because a `sorry` is visible to `#print axioms` and this was not: the
 * docstring was the only place the incompleteness was recorded, and it was
 * wrong.
 */
export function checkDocstringHonesty(leanPath?: string): CheckerResult {
  if (!leanPath || !existsSync(leanPath)) return { result: "n/a", hits: [] };
  let src: string;
  try { src = readFileSync(leanPath, "utf8"); } catch { return { result: "n/a", hits: [] }; }

  const hits: CheckerHit[] = [];
  for (const d of parseDecls(src)) {
    if (!d.docstring || !HONESTY_CLAIM.test(d.docstring)) continue;
    // A docstring that explicitly records the ABSENCE of a sorry is doing the
    // right thing, and often has to quote the phrase it is correcting. Firing
    // on it punishes exactly the fix this criterion asks for — it flagged the
    // repaired `ConfinementGradingCorrespondence.canonical`, whose new
    // docstring quotes the old false claim in order to explain it.
    if (NEGATED_HONESTY_CLAIM.test(d.docstring)) continue;
    if (PAST_TENSE_SORRY.test(d.docstring)) continue;
    const whole = d.header + "\n" + d.body;
    // Strip comments before looking for `sorry`, so a docstring or an inline
    // note *about* sorries does not count as one.
    const code = whole.replace(/--.*$/gm, "").replace(/\/-[\s\S]*?-\//g, "");
    if (/\bsorry\b/.test(code)) continue;
    if (/^\s*axiom\s/m.test(code)) continue;
    hits.push({
      file: leanPath,
      line: d.line,
      text:
        `\`${d.name}\`: the docstring says it carries a sorry or is axiomatised, ` +
        `but the body contains neither. If the claim is genuinely open, use a ` +
        `\`sorry\` so \`#print axioms\` can see it; if it is discharged, say how.`,
    });
  }
  return { result: hits.length ? "fail" : "pass", hits };
}

/* ------------------------------------------------------------------ *
 * `lean-no-definitional-laundering`
 *
 * The sibling criterion above models vacuity as CONSTANT data. That model is
 * exact and it is narrow. A hand pass over the qou corpus on 2026-08-24 found
 * eight laundering sites and the detector found twenty-five — with a zero
 * overlap. Both lists are real; they are different defects.
 *
 * What the constant model cannot see is data that is not constant and is still
 * *chosen so the claim becomes `rfl`*:
 *
 *     class SubstrateWidthRule where
 *       w        : ℕ → ℕ
 *       is_color : ∀ A, w A = cableWidthColor     -- the claim
 *
 *     instance colorRule : SubstrateWidthRule where
 *       w        := fun _ => cableWidthColor      -- …defined to BE the claim's RHS
 *       is_color := fun _ => rfl
 *
 * `cableWidthColor` is not a degenerate token, the field is not `_ := 0`, and
 * `DEGENERATE_VALUE` — anchored `^…$` — cannot see through the lambda either.
 * Three separate reasons the old check passes it.
 *
 * This criterion adds three detections, all syntactic, all conjunctive:
 *
 *   1. CONSTANT-`Prop` DEFINITION. `def F (args…) : Prop := True` (or `False`),
 *      possibly after `let`-bindings whose results are discarded. Every claim
 *      stated in terms of `F` is free, and no instance is needed to launder it.
 *      Requires ≥ 1 parameter: an argument-free `def X : Prop := True` is a
 *      named tautology, which is `proof-no-trivial-true`'s `def-disguised-true`
 *      pattern, not this one. Reporting it here would duplicate that criterion
 *      without adding signal.
 *
 *   2. LAMBDA-WRAPPED CONSTANT FIELD. `member := fun _ => True` beside a
 *      reflexivity discharge — the sibling criterion's exact conjunction, with
 *      the constant hidden behind one lambda so its anchored regex misses it.
 *      Every binder must be a wildcard; `fun n => 0` is a constant function
 *      someone may have meant.
 *
 *   3. DEFINITIONAL IDENTITY (the `poleIndicator` shape). The class declares
 *      `claim : ∀ …, data args = RHS`; the instance assigns `data := fun … =>
 *      RHS` with the SAME RHS, and discharges `claim` by reflexivity. This one
 *      needs the `class … where` block, so it is bounded to classes declared in
 *      the same file — no import following.
 *
 * ## Detection 3 is a reading, not a verdict
 *
 * A definitional identity is sometimes exactly the content: pinning a field to
 * a formula and observing that the law then holds by `rfl` is a legitimate way
 * to exhibit a model. Whether the class field was a CONSTRAINT the instance was
 * supposed to meet or a DEFINITION the instance was entitled to make is not a
 * syntactic question — it is about what the class was for. So detection 3 hits
 * are reported as `warn` (the schema's "borderline; reviewer flags but does not
 * block"), never as an assertion of defect, and when the author's docstring
 * disputes the reading the hit says so. `BorromeanQuark.canonical` is the
 * worked example: its docstring argues the mass-calibration identity IS the
 * content. It is still worth surfacing — but as a question.
 *
 * ## What is deliberately NOT here
 *
 * - **One-hop constant resolution** (`q0 := q_zero` where `def q_zero := …`).
 *   Both corpus sites that motivated it (`ArchimedeanRealizationFunctor`,
 *   `SubstrateWidthRule`) turn out to be detection-3 shapes — the named
 *   constant is the class field's RHS — so following the name buys nothing
 *   they do not already report, and following it in general would fire on
 *   every instance that uses a named constant correctly.
 * - **Semantic constancy.** `w A := 3 * A * 0` is constant and unreachable
 *   from here. That needs `whnf`, i.e. the elaborator. See the note on the
 *   sibling criterion; this file does not pretend to cover it.
 * - **Cross-file classes.** Detection 3 needs the `class` block. Resolving an
 *   imported class means resolving imports, and a wrong resolution produces a
 *   confident false positive about a decl the checker never read.
 *
 * ## Tightened against
 *
 * The first corpus sweep returned 26. Every one was read, and five vetoes came
 * out of the ones that were wrong — recorded here because the next person to
 * loosen this check should know what each veto is holding back:
 *
 * - A discharge lambda that NAMES its binders is a proof, not a reflexivity
 *   (`ti_eq := fun w => by simp [Equiv.punitProd]`) — see `REFL_DISCHARGE`.
 * - A decl in which some law needed real tactic work is a model doing work —
 *   see `isSubstantiveDischarge`.
 * - Not every field a NAME calls a claim need be trivially discharged; one real
 *   proof among them means the constants are a corner, not the whole model.
 * - A declared inhabitation witness is the prescribed remedy, not the defect —
 *   see `INHABITATION_WITNESS`.
 * - A `theorem` exhibiting a record proves an existential; that is not this
 *   criterion's business.
 * ------------------------------------------------------------------ */

/** Strip Lean block comments (docstrings included) and line comments. */
function stripLeanComments(src: string): string {
  return src.replace(/\/-[\s\S]*?-\//g, "").replace(/--.*$/gm, "");
}

/** Collapse whitespace so two spellings of one expression compare equal. */
function normExpr(s: string): string {
  let t = s.replace(/\s+/g, " ").trim();
  // Peel parentheses that wrap the whole expression: `(f x)` vs `f x`.
  while (t.startsWith("(") && t.endsWith(")")) {
    let depth = 0;
    let wraps = true;
    for (let i = 0; i < t.length; i++) {
      if (t[i] === "(") depth++;
      else if (t[i] === ")") {
        depth--;
        if (depth === 0 && i < t.length - 1) { wraps = false; break; }
      }
    }
    if (!wraps) break;
    t = t.slice(1, -1).trim();
  }
  return t;
}

const OPENERS = "([{⟨⦃";
const CLOSERS = ")]}⟩⦄";

/** Index of the first `,` at bracket depth 0, or -1. */
function topLevelComma(s: string, from: number): number {
  let depth = 0;
  for (let i = from; i < s.length; i++) {
    const c = s[i];
    if (OPENERS.includes(c)) depth++;
    else if (CLOSERS.includes(c)) depth--;
    else if (c === "," && depth === 0) return i;
  }
  return -1;
}

/** Split on `→` / `->` at bracket depth 0. */
function splitArrows(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (OPENERS.includes(c)) depth++;
    else if (CLOSERS.includes(c)) depth--;
    else if (depth === 0 && (c === "→" || (c === "-" && s[i + 1] === ">"))) {
      out.push(s.slice(start, i));
      i += c === "→" ? 0 : 1;
      start = i + 1;
    }
  }
  out.push(s.slice(start));
  return out.map((x) => x.trim()).filter((x) => x.length > 0);
}

/** Drop leading `∀ …,` / `Π …,` binder groups to expose the conclusion. */
function stripBinders(s: string): string {
  let t = s.trim();
  for (let guard = 0; guard < 16; guard++) {
    if (!/^[∀Π]/.test(t)) return t;
    const idx = topLevelComma(t, 1);
    if (idx < 0) return t;
    t = t.slice(idx + 1).trim();
  }
  return t;
}

/**
 * The conclusion of a field's type: what it asserts once every binder and
 * hypothesis is discharged.
 *
 * Alternating `stripBinders` / `splitArrows` to a fixed point, because binders
 * and hypotheses interleave: `∀ i, i < level → ∀ v w, member v = f w` puts a
 * second `∀` AFTER a hypothesis arrow, and stripping only the outer one leaves
 * the conclusion unreached.
 */
function conclusionOf(type: string): string {
  let t = type.trim();
  for (let guard = 0; guard < 8; guard++) {
    const pieces = splitArrows(stripBinders(t));
    const last = pieces[pieces.length - 1] ?? "";
    if (last === t) return t;
    t = last;
  }
  return t;
}

/** A field declared inside a `class`/`structure` body. */
export interface StructField {
  name: string;
  type: string;
}

/** A `class`/`structure` declaration and the fields it declares. */
export interface StructDecl {
  kind: "class" | "structure";
  name: string;
  line: number;
  fields: StructField[];
}

const STRUCT_HEAD =
  /^(?:@\[[^\]]*\]\s*)?(?:noncomputable\s+|private\s+|protected\s+|scoped\s+)*(class|structure)\s+([A-Za-z_][A-Za-z0-9_'.!?]*)/;

/**
 * Split a Lean file into its `class` / `structure` declarations.
 *
 * Separate from `parseDecls`, which treats a `class` line as a body terminator
 * and never looks inside one. Detection 3 needs what the class DECLARES — an
 * instance body alone cannot say which of its fields is the claim.
 */
export function parseStructureDecls(src: string): StructDecl[] {
  const lines = src.split("\n");
  const out: StructDecl[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(STRUCT_HEAD);
    if (!m) continue;
    const declLines = [lines[i]];
    let j = i + 1;
    while (j < lines.length) {
      if (
        /^(?:@\[|\/-|noncomputable\s|private\s|protected\s|instance\s|def\s|theorem\s|abbrev\s|structure\s|class\s|opaque\s|axiom\s|inductive\s|example\s|end\s|namespace\s|section\s)/.test(
          lines[j],
        )
      ) break;
      declLines.push(lines[j]);
      j++;
    }
    i = j - 1;
    const text = stripLeanComments(declLines.join("\n"));
    const w = text.match(/\bwhere\b/);
    if (!w || w.index === undefined) continue;
    const bodyText = text.slice(w.index + w[0].length);
    out.push({
      kind: m[1] as StructDecl["kind"],
      name: m[2],
      line: i + 1,
      fields: parseStructFields(bodyText),
    });
  }
  return out;
}

/** `name : type` entries in a class body, absorbing wrapped types. */
function parseStructFields(body: string): StructField[] {
  const fields: StructField[] = [];
  const lines = body.split("\n");
  for (let k = 0; k < lines.length; k++) {
    const raw = lines[k];
    if (!raw.trim()) continue;
    const fm = raw.match(/^(\s+)([A-Za-z_][A-Za-z0-9_'!?]*)\s*:(?!=)\s*(.*)$/);
    if (!fm) continue;
    const indent = fm[1].length;
    let type = fm[3].trim();
    let k2 = k + 1;
    while (k2 < lines.length) {
      const nxt = lines[k2];
      if (!nxt.trim()) { k2++; continue; }
      if (nxt.length - nxt.trimStart().length <= indent) break;
      type += " " + nxt.trim();
      k2++;
    }
    fields.push({ name: fm[2], type: type.trim() });
    k = k2 - 1;
  }
  return fields;
}

/**
 * A class field whose type says "this other field equals THIS expression".
 *
 * `is_color : ∀ A, w A = cableWidthColor` yields
 * `{ claim: "is_color", data: "w", args: ["A"], rhs: "cableWidthColor" }`.
 */
interface DefinitionalClaim {
  claim: string;
  data: string;
  args: string[];
  rhs: string;
}

/**
 * The equation must be the field's CONCLUSION, not any `=` anywhere in its
 * type. `demazure_closure : ∀ i, i < level → ∀ v w, member v → G.f i v = some
 * w → member w` contains an `=`, and reading it as the field's claim would
 * invent an RHS the author never wrote. Binders are stripped and the type is
 * split on top-level `→` so only the final conclusion is matched.
 */
const EQ_CONCLUSION =
  /^([A-Za-z_][A-Za-z0-9_'!?₀-₉]*)\s*([^=]*?)(?<![<>!:≤≥≠~])=(?![=>])\s*(.+)$/;

/** Args must be plain binder names for the alpha-rename below to be sound. */
const SIMPLE_ARGS = /^[A-Za-z0-9_'!?₀-₉\s]*$/;

function definitionalClaims(cls: StructDecl): DefinitionalClaim[] {
  const names = new Set(cls.fields.map((f) => f.name));
  const out: DefinitionalClaim[] = [];
  for (const f of cls.fields) {
    const concl = conclusionOf(f.type);
    if (!concl) continue;
    const m = concl.match(EQ_CONCLUSION);
    if (!m) continue;
    const data = m[1];
    if (data === f.name || !names.has(data)) continue;
    if (!SIMPLE_ARGS.test(m[2])) continue;
    out.push({
      claim: f.name,
      data,
      args: m[2].trim().split(/\s+/).filter(Boolean),
      rhs: normExpr(m[3]),
    });
  }
  return out;
}

/** `fun a b => body` / `λ a b ↦ body` → binders + body. */
function splitLambda(value: string): { binders: string[]; body: string } | null {
  const m = value.match(/^(?:fun|λ)\s+([^=↦]*?)\s*(?:=>|↦)\s*([\s\S]*)$/);
  if (!m) return null;
  const binders = m[1].trim().split(/\s+/).filter(Boolean);
  if (!binders.every((b) => /^[A-Za-z_][A-Za-z0-9_'!?₀-₉]*$/.test(b))) return null;
  return { binders, body: m[2].trim() };
}

/**
 * Rename the instance's binders to the class's argument names, positionally.
 *
 * `poleIndicator := fun x => decide (x ≤ -1)` must compare equal to the class's
 * `poleIndicator rho = decide (rho ≤ -1)`. Two phases so a rename cannot
 * capture a name a later rename is about to introduce.
 */
function alphaRename(body: string, from: string[], to: string[]): string {
  if (from.length !== to.length || from.length === 0) return body;
  // NUL-delimited, and written as an escape rather than typed as a raw byte:
  // a PRINTABLE placeholder collides with the source. Routing `y → x` through
  // `" 0 "` would rewrite `g 0 y` to `g x x`, manufacturing a match out of a
  // numeral the author wrote.
  const hole = (i: number) => `\u0000${i}\u0000`;
  let t = body;
  for (let i = 0; i < from.length; i++) {
    if (from[i] === "_") continue;
    t = t.replace(new RegExp(`(?<![A-Za-z0-9_'])${escapeRe(from[i])}(?![A-Za-z0-9_'])`, "g"), hole(i));
  }
  for (let i = 0; i < to.length; i++) t = t.split(hole(i)).join(to[i]);
  return t;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Reflexivity discharges, including multi-binder lambdas.
 *
 * Wider than `TRIVIAL_DISCHARGE` above on purpose, and kept separate on
 * purpose: `volume_calibrates_mass := fun _ _ => rfl` has TWO wildcard binders
 * and the sibling criterion's `fun\s+_+\s*=>` matches only one. Widening the
 * shared constant would loosen a check whose precision is the reason it has
 * near-zero false positives.
 *
 * The binders must be WILDCARDS. `ti_eq := fun w => by simp [Equiv.punitProd]`
 * names its argument and rewrites with a named lemma; reading that as a
 * reflexivity discharge produced four of the first sweep's false positives
 * (`HeckeCommutingCellReduction`, `HeckeDihedralBraidReduction`). A discharge
 * that IGNORES its arguments is the signal; one that uses them is a proof.
 */
const REFL_DISCHARGE =
  /^(?:(?:fun|λ)\s+(?:_[A-Za-z0-9_'!?]*\s+)*(?:=>|↦)\s*)?(?:rfl|Iff\.rfl|Eq\.refl\b.*|trivial|True\.intro|\.intro|⟨⟩|by\s+(?:rfl|trivial|simp\s*\[[^\]]*\]|simp|norm_num|decide|positivity|constructor|exact\s+rfl|exact\s+Iff\.rfl))\s*$/;

/**
 * A field discharged by real work rather than by reflexivity.
 *
 * Used as a whole-declaration veto for detection 2. A decl in which SOME law
 * needed a genuine tactic proof is a small model doing work, not a laundering:
 * the constant fields are the model's degenerate corner, and the class is being
 * shown satisfiable. `verlindeData_two` (`D_sq := by rw […]; rw […]; norm_num`),
 * `spectralData_zero` (`rank`, `decomp`) and `localization_two`
 * (`globalDim_ne`) are all this shape and all were false positives.
 *
 * Purely structural — no docstring involved, so it cannot be talked around.
 */
function isSubstantiveDischarge(value: string): boolean {
  const v = value.trim();
  if (REFL_DISCHARGE.test(v)) return false;
  return /(?:^|\s)by\b/.test(v);
}

/**
 * A docstring declaring the decl to be an inhabitation / non-vacuity witness.
 *
 * This IS a gameable escape hatch, and it is here for the same reason
 * `NEGATED_HONESTY_CLAIM` is: the registry's own remedy for
 * `lean-no-vacuous-instance-data` tells authors to write exactly this
 * declaration — "one instance at the trivial datum showing the hypothesis is
 * satisfiable" — so firing on it punishes the prescribed fix. `rtData_two` is
 * the corpus case the structural vetoes above do not reach: every one of its
 * fields is a one-liner, so nothing marks it as doing work, and the only thing
 * separating it from a laundering is the stated intent.
 *
 * Kept narrow on purpose. "genuine" is NOT a trigger — `instSl2DemazureSubcrystal`
 * calls itself "a genuine `DemazureSubcrystal`" and is a real finding.
 */
const INHABITATION_WITNESS =
  /\b(?:non-?vacuity|not\s+vacuous|is\s+inhabited|inhabitation|satisfiab|not\s+conditional-on-`?False)/i;

/** `fun _ _ => <constant>` — every binder a wildcard. */
const WILDCARD_LAMBDA =
  /^(?:fun|λ)\s+((?:_[A-Za-z0-9_'!?]*\s+)+)(?:=>|↦)\s*([\s\S]+)$/;

/** Heads `parseFieldAssigns` picks up from tactic blocks that are not fields. */
const NOT_A_FIELD = new Set([
  "let", "have", "set", "show", "suffices", "obtain", "calc", "fun", "match",
  "by", "exact", "refine", "apply", "use", "intro", "intros", "simp", "rw",
  "case", "next", "with", "do", "if", "then", "else", "try", "all_goals",
]);

/** Trim a decl body at the first line that opens an unrelated declaration. */
const FOREIGN_DECL = /^(?:opaque|axiom|inductive|example)\s/;

function declText(d: Decl): string {
  const kept: string[] = [];
  for (const l of d.body.split("\n")) {
    if (FOREIGN_DECL.test(l)) break;
    kept.push(l);
  }
  return d.header + "\n" + kept.join("\n");
}

/**
 * `lean-no-definitional-laundering` — data chosen so the claim is `rfl`, in the
 * three shapes the constant model cannot see. See the block comment above.
 */
export function checkNoDefinitionalLaundering(leanPath?: string): CheckerResult {
  if (!leanPath || !existsSync(leanPath)) return { result: "n/a", hits: [] };
  let src: string;
  try { src = readFileSync(leanPath, "utf8"); } catch { return { result: "n/a", hits: [] }; }

  const hits: CheckerHit[] = [];
  const metrics = { constant_prop_defs: 0, lambda_constant_fields: 0, definitional_identities: 0 };
  const classes = parseStructureDecls(src);
  const claimIndex = classes.map((c) => ({ cls: c, claims: definitionalClaims(c) }));

  for (const d of parseDecls(src)) {
    // Report only what the sibling criterion cannot see. The two lists were
    // measured disjoint on the qou corpus and that is the point of splitting
    // them; a decl already flagged there does not need a second, weaker
    // description of the same defect.
    if (vacuousDataConjunction(d)) continue;
    const whole = declText(d);

    // ── 1. `def F (args…) : Prop := True` ────────────────────────────
    if (d.kind === "def" || d.kind === "abbrev") {
      const constProp = constantPropBody(whole, d.name);
      if (constProp) {
        metrics.constant_prop_defs++;
        hits.push({
          file: leanPath,
          line: d.line,
          text:
            `\`${d.name}\` takes ${constProp.arity} argument group${constProp.arity === 1 ? "" : "s"} ` +
            `and its body is the constant \`${constProp.value}\`. It is a name reserved for a claim, ` +
            `not the claim: it is equal to every other tautology, so anything stated in terms of it — ` +
            `an iff, a hypothesis, a downstream theorem — is discharged by \`${constProp.value === "True" ? "Iff.rfl` / `trivial" : "not_false"}\` ` +
            `and constrains nothing. Seal the body (\`opaque\`) or state the real proposition with a ` +
            `\`sorry\` so \`#print axioms\` can see the gap.`,
        });
      }
    }

    // Detections 2 and 3 read a structure-instance body. A `theorem` that
    // builds a record inside its proof — `⟨{ traceValue := ∏ …, factorization
    // := rfl }, rfl, rfl, rfl⟩` in `markov_trace_product` — is exhibiting a
    // witness for an existential, which is how one proves `∃`. Theorem-shaped
    // vacuity belongs to `proof-no-self-assuming-projection` /
    // `proof-no-trivial-true`.
    if (d.kind === "theorem") continue;

    const fields = parseFieldAssigns(d.body, d.line).filter((f) => !NOT_A_FIELD.has(f.name));
    if (fields.length < 2) continue;
    const byName = new Map(fields.map((f) => [f.name, f]));

    // ── 2. `data := fun _ => <degenerate>` + a reflexivity discharge ──
    //
    // Three vetoes, all learned from the first corpus sweep: the decl must do
    // no substantive proof work anywhere, EVERY field its name marks as a
    // claim must be trivially discharged (one real proof among them means the
    // constants are a corner of a working model), and it must not declare
    // itself an inhabitation witness.
    const lambdaConst = fields.filter((f) => {
      if (isClaimField(f.name)) return false;
      const m = f.value.match(WILDCARD_LAMBDA);
      return !!m && DEGENERATE_VALUE.test(m[2].trim());
    });
    const claimFields = fields.filter((f) => isClaimField(f.name));
    const trivialClaims = claimFields.filter((f) => REFL_DISCHARGE.test(f.value));
    const doesRealWork =
      fields.some((f) => isSubstantiveDischarge(f.value)) ||
      trivialClaims.length !== claimFields.length ||
      INHABITATION_WITNESS.test(d.docstring);
    if (lambdaConst.length && trivialClaims.length && !doesRealWork) {
      metrics.lambda_constant_fields += lambdaConst.length;
      for (const c of trivialClaims) {
        hits.push({
          file: leanPath,
          line: c.line,
          text:
            `REVIEW (not a verdict) — ${d.kind} \`${d.name}\`: claim field \`${c.name} := ${c.value}\` ` +
            `is discharged by reflexivity, and the data it constrains is a constant behind a lambda ` +
            `(${lambdaConst.map((f) => `${f.name} := ${f.value}`).join(", ")}). Same shape as ` +
            `\`lean-no-vacuous-instance-data\`, one \`fun _ =>\` deeper than its anchored ` +
            `degenerate-value match can reach. What this establishes is that the claim fields ` +
            `carry no force — not that the constant is wrong. It may be the value the mathematics ` +
            `forces: \`instSl2DemazureSubcrystal\` has \`member := fun _ => True\` because the ` +
            `level-1 Demazure sub-crystal of \`B(Λ₁)\` really is the whole two-vertex crystal. ` +
            `Decide which, and record the decision in the docstring.`,
        });
      }
    }

    // ── 3. data defined to BE the claim's right-hand side ─────────────
    for (const { cls, claims } of claimIndex) {
      for (const dc of claims) {
        const dataField = byName.get(dc.data);
        const claimField = byName.get(dc.claim);
        if (!dataField || !claimField) continue;
        if (!REFL_DISCHARGE.test(claimField.value)) continue;
        const lam = splitLambda(dataField.value);
        const binders = lam ? lam.binders : dataField.binders.startsWith(":") ? [] : dataField.binders.split(/\s+/).filter(Boolean);
        const rawBody = lam ? lam.body : dataField.value;
        if (normExpr(alphaRename(rawBody, binders, dc.args)) !== dc.rhs) continue;
        metrics.definitional_identities++;
        const disputed = DISPUTED_DEFINITIONAL.test(d.docstring);
        hits.push({
          file: leanPath,
          line: dataField.line,
          text:
            `REVIEW (not a verdict) — ${d.kind} \`${d.name}\` assigns \`${dc.data} := ${dataField.value}\`, ` +
            `which is exactly the right-hand side of \`${cls.name}.${dc.claim}\` ` +
            `(\`${dc.data}${dc.args.length ? " " + dc.args.join(" ") : ""} = ${dc.rhs}\`), and then discharges ` +
            `that field by \`${claimField.value}\`. The claim holds by definition because the data was defined ` +
            `to make it hold. Whether that is laundering or content depends on what the class field was FOR — ` +
            `a constraint the instance had to meet, or a definition it was entitled to make — and that is not ` +
            `a syntactic question. Decide, and record the decision.` +
            (disputed
              ? ` The docstring disputes this reading; treat it as answered unless the class field was meant as a constraint.`
              : ""),
        });
      }
    }
  }

  // Only detection 1 is a verdict. `def F (args…) : Prop := True` is a
  // tautology whatever the author meant by it — the proposition is wrong, not
  // just unexercised, and no reading of the surrounding mathematics rescues it.
  //
  // Detections 2 and 3 both turn on the same non-syntactic question: was the
  // constant the value the mathematics forces, or a way of arranging the claim
  // away? Detection 3 has always said so in its evidence and graded `warn`;
  // detection 2 shipped as `fail` and was immediately wrong about
  // `instSl2DemazureSubcrystal` (2026-08-24), whose `member := fun _ => True`
  // is correct — `sl₂` has one simple root, so the level-1 Demazure
  // sub-crystal of `B(Λ₁)` is the whole crystal. Its docstring concedes the
  // exact vacuity this reports and there is nothing left to fix, so a `fail`
  // there is a red that no correct edit can clear. A critical criterion that
  // cannot be satisfied by correct content gets switched off, not obeyed.
  const hard = metrics.constant_prop_defs;
  return {
    result: hits.length === 0 ? "pass" : hard > 0 ? "fail" : "warn",
    hits,
    metrics,
  };
}

/**
 * Docstring phrasing that argues the definitional identity is the content.
 *
 * Mirrors `NEGATED_HONESTY_CLAIM`'s role for `lean-docstring-honesty`: the
 * checker still reports, but it must not assert a defect over the author's
 * stated reasoning.
 */
const DISPUTED_DEFINITIONAL =
  /\b(?:genuine\s+(?:content|instance|input)|non-?vacuous|not\s+(?:a\s+)?vacuous|holds?\s+definitionally|definitional(?:ly)?\s+(?:identity|content)|not\s+chosen(?:\s+to)?|\*derived\*)\b/i;

/**
 * `def F (args…) : Prop := True | False`, allowing discarded `let`/`have`.
 *
 * The remainder after the `let`s must be EXACTLY `True` or `False`. Anything
 * else is a real proposition and the check declines to guess — a body it
 * cannot read in full is a body it must not report on.
 */
function constantPropBody(
  whole: string,
  declName: string,
): { value: "True" | "False"; arity: number } | null {
  const text = stripLeanComments(whole);
  const at = text.search(/:\s*Prop\s*:=/);
  if (at < 0) return null;
  const sig = text.slice(0, at).replace(
    new RegExp(`^[\\s\\S]*?\\b(?:def|abbrev)\\s+${escapeRe(declName)}`),
    "",
  );
  // Top-level groups only. A binder whose TYPE has parentheses —
  // `(f : (ℕ → ℕ))` — is one argument group, not two, and the count is quoted
  // back to the reader.
  let arity = 0;
  let depth = 0;
  for (const c of sig) {
    if (OPENERS.includes(c)) { if (depth === 0) arity++; depth++; }
    else if (CLOSERS.includes(c)) depth--;
  }
  if (arity === 0) return null;
  const after = text.slice(at).replace(/^:\s*Prop\s*:=/, "");
  const rest = after
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !/^(?:let|have|set)\b/.test(l))
    .join(" ")
    .trim();
  if (rest === "True" || rest === "False") return { value: rest, arity };
  return null;
}

export const VACUITY_AUTOMATED_CHECKERS: Record<
  string,
  (paths: { md?: string; ts?: string; lean?: string }) => CheckerResult
> = {
  "lean-no-vacuous-instance-data": (p) => checkNoVacuousInstanceData(p.lean),
  "lean-no-definitional-laundering": (p) => checkNoDefinitionalLaundering(p.lean),
  "lean-docstring-honesty": (p) => checkDocstringHonesty(p.lean),
};
