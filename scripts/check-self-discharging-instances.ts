#!/usr/bin/env bun
/**
 * check-self-discharging-instances — find class hypotheses that are free.
 *
 * ## The defect
 *
 * A `class` that carries a **propositional field** is a claim: downstream code
 * takes `[C X]` as a hypothesis and the reader understands the theorem to be
 * conditional on it. An **unconditional `instance`** of such a class destroys
 * that: typeclass resolution supplies it everywhere, every downstream theorem
 * becomes unconditional, and the hypothesis asserts nothing.
 *
 * The shape is easy to introduce and nearly invisible in review, because the
 * instance is usually honest about being trivial — in its docstring, where no
 * gate reads it. Four occurrences in `qou` inside one week:
 *
 *   hasDqSquaredNonvanishing_of_fact            produced the class from a
 *                                               `Fact` of its own conclusion
 *   hasCategoricalIrreducibility_of_subsingleton  same shape
 *   SpectralSequence.canonical (+6 more)        `PUnit` model, and the file
 *                                               said "vacuously discharges"
 *
 * The first two were removed by hand; the third was found by reading. This
 * checker exists so the fourth is found by running something.
 *
 * ## What counts as a finding
 *
 * An `instance` is reported when **both** hold:
 *
 *   1. its result class is declared (anywhere in the package) with at least one
 *      field whose type looks propositional — an equation, an inequality, a
 *      quantifier, `Prop`, or the class is `... : Prop`; and
 *   2. it is **unconditional**: every argument is a type, a universe, or an
 *      instance binder `[…]`. No explicit hypothesis for the caller to supply.
 *
 * Condition 2 is the load-bearing one. `instance foo (h : P) : C X` is fine —
 * the caller still has to produce `h`. `instance foo (R : Type) : C R` is not.
 *
 * ## What it deliberately does not flag
 *
 * Classes with no propositional field: `Inhabited`, `Repr`, coercions, plain
 * data bundles. Making those unconditional is the normal and correct use of
 * the instance mechanism, and flagging them would bury the signal.
 *
 * ## Fixing a finding
 *
 * Demote `instance` to `def`. The model stays available and must be supplied by
 * name, so a reader of a downstream theorem can see whether the hypothesis was
 * discharged by real content or by a placeholder. That is what
 * `QOU/Mathlib/SpectralSequence.lean` now does, and what
 * `TauFunctorTargetSpec.interface_alone_is_trivially_inhabitable` documents as
 * the house pattern.
 *
 * Usage:
 *   bun run scripts/check-self-discharging-instances.ts --package qou
 *   … --baseline N   growth-only ratchet (exit 3 when the count exceeds N)
 *   … --warn-only    always exit 0
 *   … --json         machine-readable
 */

import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative, resolve } from "path";

import { LEAN_PACKAGES, type LeanPackage } from "../schemas/lean-packages.ts";
import { findContentRepoRoot } from "../content/pipeline/repo-root";

/** A `class` declaration and whether it carries a claim. */
interface ClassInfo {
  name: string;
  file: string;
  line: number;
  /** Field types that read as propositional. */
  propFields: string[];
}

/** An `instance` declaration. */
interface InstanceInfo {
  name: string;
  className: string;
  file: string;
  line: number;
  /** Binder text between the name and the `:` that gives the result type. */
  binders: string;
  /** `field := proof` pairs from the instance body. */
  discharges: string[];
}

export interface Finding {
  instance: string;
  className: string;
  file: string;
  line: number;
  propFields: string[];
  /** How the claim fields are discharged, and therefore how bad this is. */
  severity: "trivial" | "substantive";
  /** The `field := proof` terms found in the instance body, for the report. */
  discharges: string[];
}

/**
 * Proof terms that discharge a proposition without establishing anything about
 * the model — the instance is true *by construction*, so the class field
 * asserts nothing of it.
 *
 * `hf.out` and friends are the `Fact`-of-the-conclusion shape that
 * `hasDqSquaredNonvanishing_of_fact` had.
 */
export function isTrivialDischarge(proof: string): boolean {
  const t = proof.trim().replace(/^by\s+/, "");
  return /^(rfl|trivial|default|True\.intro|\.intro|Subsingleton\.elim.*|PUnit\.unit|⟨⟩|fun\s+_+\s*=>\s*rfl|fun\s+_+\s*=>\s*trivial|[A-Za-z_][A-Za-z0-9_']*\.out|inferInstance)$/.test(t)
    || /^fun\b.*=>\s*(rfl|trivial|default)$/.test(t);
}

/**
 * Does this field type read as a proposition?
 *
 * Deliberately generous — a false positive costs a reader ten seconds, while a
 * false negative is the whole defect. `Type`/`Sort`-valued fields are excluded
 * explicitly so data bundles do not trip it.
 */
export function looksPropositional(ty: string, propNames?: Set<string>): boolean {
  const t = ty.trim();
  if (/^Type\b|^Sort\b|^Prop$/.test(t)) return false;
  if (
    /(^|[^:!<>=])=([^=]|$)/.test(t) ||
    /≠|≤|≥|<|>|∀|∃|¬|↔|→\s*False|\bProp\b|\bSubsingleton\b|\bIsIso\b|\bEpi\b|\bMono\b|\bNonempty\b|\bFact\b/.test(t)
  ) return true;
  // A field whose type is a NAMED predicate — `CollapsesAtE2 ss`,
  // `MarkovAxiomHolds …`. Missing this was a real bug: the checker returned
  // zero on `GBFiltrationCollapsesAtE2`, the very defect it was written for,
  // because `collapses : CollapsesAtE2 ss` contains no inline proposition.
  // Caught by testing the checker against the pre-fix file rather than
  // trusting its clean run.
  if (propNames) {
    const head = /^([A-Za-z_][A-Za-z0-9_'.!?]*)/.exec(t)?.[1];
    if (head && propNames.has(head)) return true;
    if (head && propNames.has(head.split(".").pop()!)) return true;
  }
  return false;
}

/** `def`/`abbrev`/`class`/`structure` declarations whose result is `Prop`. */
const PROP_DECL =
  /^\s*(?:noncomputable\s+)?(?:def|abbrev|class|structure)\s+([A-Za-z_][A-Za-z0-9_'.!?]*).*:\s*Prop\b/;

/** Collect the names of `Prop`-valued declarations in one file. */
export function propDeclNames(text: string): string[] {
  const out: string[] = [];
  for (const line of text.split("\n")) {
    const m = PROP_DECL.exec(line);
    if (m) out.push(m[1], m[1].split(".").pop()!);
  }
  return out;
}

/**
 * Is every binder a type, universe, or instance argument?
 *
 * `(R : Type u)`, `{α : Type*}`, `[CommRing R]` → unconditional.
 * `(h : P)`, `(hq : q ≠ 1)` → conditional, and therefore fine.
 */
export function isUnconditional(binders: string, propNames?: Set<string>): boolean {
  // Walk top-level bracket groups. A regex cannot do this either:
  // `(h : CollapsesAtE2 (bar R))` nests, and `[^()]*` cannot span the inner
  // parens — so the binder was skipped and a conditional instance was reported
  // as unconditional. Fourth bug of this family; all four were the same
  // mistake, using a regex where the grammar is bracketed.
  let i = 0;
  while (i < binders.length) {
    const open = binders[i];
    if (open !== "(" && open !== "[" && open !== "{") { i++; continue; }
    let depth = 0;
    let j = i;
    for (; j < binders.length; j++) {
      const c = binders[j];
      if (c === "(" || c === "[" || c === "{") depth++;
      else if (c === ")" || c === "]" || c === "}") {
        depth--;
        if (depth === 0) break;
      }
    }
    const inner = binders.slice(i + 1, j);
    i = j + 1;
    if (open === "[") continue; // instance binder — resolved, not supplied
    // find the depth-0 colon inside this binder
    let d = 0, colon = -1;
    for (let k = 0; k < inner.length; k++) {
      const c = inner[k];
      if (c === "(" || c === "[" || c === "{") d++;
      else if (c === ")" || c === "]" || c === "}") d--;
      else if (c === ":" && d === 0) { colon = k; break; }
    }
    if (colon < 0) continue;
    const ty = inner.slice(colon + 1).trim();
    // Only a PROOF OBLIGATION makes an instance conditional. A data parameter
    // such as `(n : ℕ)` does not: resolution fills it from the goal, so the
    // instance is still supplied for free at every `n`. Requiring `Type`
    // here was too strict and hid three of the seven known cases.
    if (looksPropositional(ty, propNames)) return false;
  }
  return true;
}

function* walkLean(dir: string): Generator<string> {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const e of entries) {
    if (e === ".lake" || e === "build") continue;
    const p = join(dir, e);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) yield* walkLean(p);
    else if (e.endsWith(".lean")) yield p;
  }
}

const CLASS_HEAD = /^\s*class\s+([A-Za-z_][A-Za-z0-9_'.!?]*)/;
const INSTANCE_START = /^\s*(?:noncomputable\s+)?instance\b\s*(.*)$/;

/**
 * Split `<name?> <binders> : <resultType>` at the colon that is **not** inside
 * a binder.
 *
 * A plain `[^:]*` regex cannot do this: `instance canonical (R : Type u) : C R`
 * has a colon inside `(R : Type u)`, so the regex stopped early and the result
 * class came out wrong. That is why the first version of this checker reported
 * **zero** findings on the exact file it was written for — caught by testing it
 * against the pre-fix source rather than trusting a clean run.
 */
export function splitInstanceHead(
  rest: string,
): { name: string; binders: string; className: string } | null {
  let depth = 0;
  for (let i = 0; i < rest.length; i++) {
    const ch = rest[i];
    if (ch === "(" || ch === "[" || ch === "{") depth++;
    else if (ch === ")" || ch === "]" || ch === "}") depth--;
    else if (ch === ":" && depth === 0) {
      const left = rest.slice(0, i).trim();
      const right = rest.slice(i + 1).trim();
      const cm = /^([A-Za-z_][A-Za-z0-9_'.!?]*)/.exec(right);
      if (!cm) return null;
      const nm = /^([A-Za-z_][A-Za-z0-9_'.!?]*)/.exec(left);
      const name = nm && !left.startsWith("(") && !left.startsWith("{") &&
        !left.startsWith("[") ? nm[1] : "«anonymous»";
      const binders = name === "«anonymous»" ? left : left.slice(nm![1].length);
      return { name, binders, className: cm[1] };
    }
  }
  return null;
}
const FIELD = /^\s{2,}([A-Za-z_][A-Za-z0-9_'!?]*)\s*:\s*(.+)$/;

/** Parse one file for class declarations (with their fields) and instances. */
export function parseLean(
  text: string,
  file: string,
  propNames?: Set<string>,
): { classes: ClassInfo[]; instances: InstanceInfo[] } {
  const classes: ClassInfo[] = [];
  const instances: InstanceInfo[] = [];
  const lines = text.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const cm = CLASS_HEAD.exec(line);
    if (cm) {
      const propFields: string[] = [];
      // Fields are the indented `name : type` lines until dedent.
      for (let j = i + 1; j < lines.length; j++) {
        const l = lines[j];
        if (l.trim() === "" || l.trimStart().startsWith("/-") ||
            l.trimStart().startsWith("--")) continue;
        if (!/^\s{2,}/.test(l)) break;
        const fm = FIELD.exec(l);
        if (fm && looksPropositional(fm[2], propNames)) propFields.push(fm[1]);
      }
      classes.push({ name: cm[1], file, line: i + 1, propFields });
      continue;
    }

    const istart = INSTANCE_START.exec(line);
    // Instance heads wrap. `instance conditional (R : Type u) (h : P) :\n
    //     TheClass R where` puts the class name on the NEXT line, and a
    // single-line parse silently misses it — a third bug of the same family,
    // caught by a test rather than by reading. Join continuation lines until
    // the head can be split or the body starts.
    let headText = istart ? istart[1] : "";
    let consumed = 0;
    let im = istart ? splitInstanceHead(headText) : null;
    while (istart && im === null && consumed < 6 && i + consumed + 1 < lines.length) {
      const nxt = lines[i + consumed + 1];
      if (nxt.trim() === "" || /^\S/.test(nxt)) break;
      headText += " " + nxt.trim();
      consumed++;
      im = splitInstanceHead(headText);
    }
    if (im) {
      // Collect `field := proof` from the instance body (indented `where` block).
      const discharges: string[] = [];
      for (let j = i + consumed + 1; j < lines.length; j++) {
        const l = lines[j];
        if (l.trim() === "") continue;
        if (!/^\s{2,}/.test(l)) break;
        const dm = /^\s{2,}([A-Za-z_][A-Za-z0-9_'!?]*)\s*:=\s*(.+)$/.exec(l);
        if (dm) discharges.push(`${dm[1]} := ${dm[2].trim()}`);
      }
      instances.push({
        name: im.name,
        binders: im.binders,
        className: im.className,
        file,
        line: i + 1,
        discharges,
      });
    }
  }
  return { classes, instances };
}

function scanPackage(repoRoot: string, pkg: LeanPackage): Finding[] {
  const classes = new Map<string, ClassInfo>();
  const instances: InstanceInfo[] = [];

  // Pass 1 — every `Prop`-valued name in the package, so a field typed by a
  // NAMED predicate is recognised as a claim.
  const files = [...walkLean(resolve(repoRoot, pkg.lakeRoot))];
  const propNames = new Set<string>();
  const texts = new Map<string, string>();
  for (const f of files) {
    const t = readFileSync(f, "utf8");
    texts.set(f, t);
    for (const n of propDeclNames(t)) propNames.add(n);
  }

  // Pass 2 — classes and instances, now able to see named predicates.
  for (const f of files) {
    const parsed = parseLean(texts.get(f)!, relative(repoRoot, f), propNames);
    for (const c of parsed.classes) classes.set(c.name, c);
    instances.push(...parsed.instances);
  }

  const findings: Finding[] = [];
  for (const inst of instances) {
    const cls = classes.get(inst.className);
    if (!cls || cls.propFields.length === 0) continue;
    if (!isUnconditional(inst.binders, propNames)) continue;
    // Only the discharges of CLAIM fields matter; data fields may be anything.
    const claimDischarges = inst.discharges.filter((d) =>
      cls.propFields.some((f) => d.startsWith(`${f} :=`)));
    const trivial = claimDischarges.length > 0 &&
      claimDischarges.every((d) => isTrivialDischarge(d.split(":=").slice(1).join(":=")));
    findings.push({
      instance: inst.name,
      className: inst.className,
      file: inst.file,
      line: inst.line,
      propFields: cls.propFields,
      severity: trivial ? "trivial" : "substantive",
      discharges: claimDischarges,
    });
  }
  findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
  return findings;
}

function main(): void {
  const argv = process.argv.slice(2);
  let packageName: string | null = null;
  let baseline: number | null = null;
  let warnOnly = false;
  let json = false;

  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case "--package": packageName = argv[++i]; break;
      case "--baseline": baseline = Number(argv[++i]); break;
      case "--warn-only": warnOnly = true; break;
      case "--json": json = true; break;
    }
  }

  const repoRoot = findContentRepoRoot();
  const pkgs = packageName
    ? LEAN_PACKAGES.filter((p) => p.name === packageName)
    : LEAN_PACKAGES;

  const findings: Finding[] = [];
  for (const pkg of pkgs) findings.push(...scanPackage(repoRoot, pkg));

  if (json) {
    console.log(JSON.stringify({
      totals: {
        findings: findings.length,
        trivial: findings.filter((f) => f.severity === "trivial").length,
      },
      findings,
    }, null, 2));
  } else {
    console.log(
      `self-discharging-instances — packages: ${pkgs.map((p) => p.name).join(", ")}`,
    );
    for (const f of findings) {
      const tag = f.severity === "trivial" ? "TRIVIAL-DISCHARGE" : "unconditional";
      console.log(`${tag}  ${f.instance} : ${f.className}`);
      console.log(`    ${f.file}:${f.line}`);
      console.log(`    claim fields: ${f.propFields.join(", ")}`);
      for (const d of f.discharges) console.log(`      ${d}`);
    }
    const triv = findings.filter((f) => f.severity === "trivial").length;
    console.log(`  unconditional instances of claim-carrying classes: ${findings.length}`);
    console.log(`    of which discharge every claim field TRIVIALLY: ${triv}`);
    console.log(`    the remainder prove their claims and are usually legitimate;`);
    console.log(`    the trivial ones are the qou-fngs shape.`);
    if (findings.length > 0) {
      console.log(
        "  fix: demote `instance` to `def` — the model stays available and must",
      );
      console.log(
        "       be named, so a reader can see what discharged the hypothesis.",
      );
    }
  }

  if (warnOnly) process.exit(0);
  if (baseline !== null && findings.length > baseline) {
    console.error(
      `\nGROWTH: ${findings.length} exceeds baseline ${baseline}.`,
    );
    process.exit(3);
  }
  process.exit(0);
}

if (import.meta.main) main();
