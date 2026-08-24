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
    out.push({ name, value: value.trim(), line: startLine + i });
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
 */
export function checkNoVacuousInstanceData(leanPath?: string): CheckerResult {
  if (!leanPath || !existsSync(leanPath)) return { result: "n/a", hits: [] };
  let src: string;
  try { src = readFileSync(leanPath, "utf8"); } catch { return { result: "n/a", hits: [] }; }

  const hits: CheckerHit[] = [];
  for (const d of parseDecls(src)) {
    if (d.kind !== "instance" && d.kind !== "def") continue;
    // `where` is tested against the whole declaration, not just its first
    // line: a real instance signature wraps, and the motivating case put
    // `where` three lines down after the instance binders. Requiring it in the
    // header alone missed every multi-line declaration — which is most of them.
    if (!/\bwhere\b/.test(d.header + "\n" + d.body)) continue;
    const fields = parseFieldAssigns(d.body, d.line);
    if (fields.length < 2) continue;

    const degenerateData = fields.filter(
      (f) => !isClaimField(f.name) && DEGENERATE_VALUE.test(f.value),
    );
    const trivialClaims = fields.filter(
      (f) => isClaimField(f.name) && TRIVIAL_DISCHARGE.test(f.value),
    );
    if (degenerateData.length === 0 || trivialClaims.length === 0) continue;

    // An unconditional `instance` is the severe form: typeclass resolution
    // supplies it everywhere, so downstream hypotheses stop being hypotheses.
    const severity = d.kind === "instance" ? "instance" : "def";
    for (const c of trivialClaims) {
      hits.push({
        file: leanPath,
        line: c.line,
        text:
          `${severity} \`${d.name}\`: claim field \`${c.name} := ${c.value}\` is ` +
          `discharged by reflexivity, and the data it constrains is degenerate ` +
          `(${degenerateData.map((f) => `${f.name} := ${f.value}`).join(", ")}). ` +
          `The claim is arranged away, not proved.` +
          (d.kind === "instance"
            ? " As an `instance` it is resolved everywhere, so downstream theorems taking this class are unconditional."
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
  /\b(?:no\s+`?sorry`?|not\s+a\s+`?sorry`?|without\s+(?:a\s+)?`?sorry`?|there\s+is\s+no\s+`?sorry`?|contains?\s+(?:no|neither)\b)/i;

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

export const VACUITY_AUTOMATED_CHECKERS: Record<
  string,
  (paths: { md?: string; ts?: string; lean?: string }) => CheckerResult
> = {
  "lean-no-vacuous-instance-data": (p) => checkNoVacuousInstanceData(p.lean),
  "lean-docstring-honesty": (p) => checkDocstringHonesty(p.lean),
};
