#!/usr/bin/env bun
/**
 * The claims `AGENTS.md` makes ABOUT CODE are checked against the code.
 *
 * @module scripts/check-agents-claims
 * @covers code — its subject is the CODE a prose claim asserts about — the symbols and paths it
 *   names. `AGENTS.md` itself sits at the repository root and is a node of no declared graph
 *
 * Bean `77ex`. Two checks already cover `AGENTS.md` and neither covers this:
 * `check:agents-xref` verifies citations INTO it, `check:agent-entry-links`
 * verifies links OUT of it. Neither reads what the prose ASSERTS.
 *
 * ## Two claim shapes, and the second is the one that cost something
 *
 * **LOCATION** — `` `symbol` in `module.ts` ``. Catches a symbol renamed or
 * removed while the prose kept its old name.
 *
 * **ABSENCE** — `` `symbol` `` … "has no caller", "nothing calls it", "is not
 * reachable". This is the expensive one, and `AGENTS.md` says why in its own
 * voice: *"a stale gap notice is worse than none, because an agent that
 * believes it either avoids the feature or rebuilds it."*
 *
 * ## The bean's own design would not have caught its own example
 *
 * `77ex` proposed the LOCATION check and asked, as its third done-when, to
 * falsify it against the two real claims from git history. Doing that first
 * is what found the problem. At `08f43c55b2` the file said:
 *
 * > `resolveSkillDirs` in `schemas/folio-config.ts` computes the
 * > cross-instance skill overlay and has **no caller**
 *
 * `schemas/folio-config.ts` existed at that commit and did declare
 * `resolveSkillDirs` — verified with `git show`. The LOCATION claim was
 * **true**. What was false was "no caller", which a location check never
 * looks at. So the ABSENCE check is not an extension here; it is the half
 * that catches the motivating case.
 *
 * The bean's second example — *"declares `schemas/` and `skills/` only"* — is
 * a claim about a config file's CONTENTS and is caught by neither. That is
 * stated in the report rather than quietly dropped.
 *
 * ## Why it does not grep English
 *
 * The bean is explicit that a checker over prose will cry wolf and be
 * switched off, and this repository has already paid for one such proxy. So
 * every claim must carry a BACKTICKED symbol and a recognised shape; anything
 * else is counted as **not parsed** and reported as its own state. A sentence
 * the checker did not understand is not a sentence it verified.
 *
 * Usage:  bun run check:agents-claims
 * Exit:   0 clean · 1 a claim is false · 2 nothing could be parsed
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { repoRootFor } from "../schemas/cat-harness.js";

const HERE = resolve(import.meta.dir, "..");
const REPO = repoRootFor(HERE);

/** Roots a cited module path may be written relative to. */
const BASES = ["", "cat-harness", "cat-harness/src"];

export interface Claim {
  kind: "location" | "absence";
  symbol: string;
  /** The module, for a location claim. */
  module?: string;
  /** The sentence, trimmed, so a report names what it read. */
  sentence: string;
}

/**
 * Flatten the document so a claim can span lines.
 *
 * Blockquote markers and list bullets are stripped FIRST: the claims that went
 * stale were inside `>` blocks, and a continuation line carrying `>` is what
 * stopped a naive whitespace match from bridging them.
 */
export function normalise(md: string): string {
  let s = md.replace(/```[\s\S]*?```/g, " "); // fenced code is not prose
  s = s.replace(/^[ \t]*(?:>[ \t]*)+/gm, " ");
  s = s.replace(/^[ \t]*[-*+][ \t]+/gm, " ");
  return s.replace(/\s+/g, " ");
}

/**
 * Claims of the form `` `A` `` (and `` `B` ``)* in `` `module` ``.
 *
 * Coordination is accepted only WITHOUT a comma. `` `A` and `B` in `M` `` is
 * one claim about two symbols; `` …`A`, and `B` in `M` `` is a clause
 * boundary, and treating it as a list produced a real false positive —
 * `DocumentContentAdapter` attributed to `schemas/block-kinds.ts`, which it
 * has nothing to do with. A checker that cries wolf is one somebody switches
 * off, so the comma is respected.
 */
export function locationClaims(norm: string): Claim[] {
  const pat =
    /(`[A-Za-z_$][\w$.]*`(?:\s+(?:and|or)\s+`[A-Za-z_$][\w$.]*`)*)\s+in\s+`([^`]+\.(?:ts|tsx|js|json))`/g;
  const out: Claim[] = [];
  for (const m of norm.matchAll(pat)) {
    for (const sym of [...m[1]!.matchAll(/`([^`]+)`/g)].map((x) => x[1]!)) {
      out.push({ kind: "location", symbol: sym, module: m[2]!, sentence: m[0]! });
    }
  }
  return out;
}

/** Phrases that assert a symbol is unused or unreachable. */
const ABSENCE = /\b(?:has\s+)?no\s+caller|nothing\s+(?:calls|reads|uses)\s+it|not\s+yet\s+reachable|is\s+never\s+called/i;

/**
 * Claims that a symbol has no caller.
 *
 * Scoped to one sentence, and the sentence must carry exactly one backticked
 * identifier — with two, which of them the phrase is about is a guess, and a
 * guess here is a false finding on the file every agent reads first.
 */
export function absenceClaims(norm: string): Claim[] {
  const out: Claim[] = [];
  for (const sentence of norm.split(/(?<=[.!?])\s+/)) {
    if (!ABSENCE.test(sentence)) continue;
    const syms = [...sentence.matchAll(/`([A-Za-z_$][\w$]*)`/g)].map((m) => m[1]!);
    if (syms.length !== 1) continue;
    out.push({ kind: "absence", symbol: syms[0]!, sentence: sentence.trim() });
  }
  return out;
}

/** Resolve a cited module path against the roots it might be written from. */
export function resolveModule(repo: string, cited: string): string | undefined {
  for (const b of BASES) {
    const p = join(repo, b, cited);
    if (existsSync(p)) return p;
  }
  return undefined;
}

/** Does `module` declare `symbol`? `A.B` asks for a member of `A`. */
export function declares(src: string, symbol: string): boolean {
  const [head, member] = symbol.split(".");
  const decl = new RegExp(
    `\\b(?:export\\s+)?(?:const|let|var|function|class|interface|type|enum)\\s+${head!.replace(/\$/g, "\\$")}\\b`,
  );
  if (!decl.test(src)) return false;
  if (member === undefined) return true;
  // A member is asked for by name anywhere in the file. Parsing the interface
  // body properly would need a TypeScript AST; the cheap test is enough to
  // catch a field renamed away, and it never reports a member that is there.
  return new RegExp(`\\b${member.replace(/\$/g, "\\$")}\\b`).test(src);
}

/** Every `.ts` file under the repo, skipping vendored and generated trees. */
function sourceFiles(repo: string): string[] {
  const SKIP = new Set(["node_modules", ".git", "_site", "dist", "build", ".lake", "docs", "translations"]);
  const out: string[] = [];
  const walk = (d: string): void => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name.startsWith(".") || SKIP.has(e.name)) continue;
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(ts|tsx)$/.test(e.name) && statSync(p).size < 2_000_000) out.push(p);
    }
  };
  walk(repo);
  return out;
}

/**
 * Files that reference `symbol` other than the one declaring it.
 *
 * Comments are stripped first. This repository has already paid for a check
 * that grepped source TEXT and went red on a documentation comment — the
 * repair was `codeWithoutComments`, and the same trap is live here: `AGENTS.md`
 * quotes these symbol names, and so do the modules' own docstrings.
 */
export function callersOf(repo: string, symbol: string): string[] {
  const re = new RegExp(`\\b${symbol.replace(/\$/g, "\\$")}\\b`);
  const out: string[] = [];
  for (const f of sourceFiles(repo)) {
    const code = readFileSync(f, "utf-8")
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/\/\/.*$/gm, " ");
    if (re.test(code)) out.push(relative(repo, f));
  }
  return out;
}

export interface Finding {
  claim: Claim;
  reason: string;
}

export function checkClaims(repo: string, md: string): { claims: Claim[]; findings: Finding[] } {
  const norm = normalise(md);
  const claims = [...locationClaims(norm), ...absenceClaims(norm)];
  const findings: Finding[] = [];

  for (const c of claims) {
    if (c.kind === "location") {
      const file = resolveModule(repo, c.module!);
      if (file === undefined) {
        findings.push({ claim: c, reason: `no such module: ${c.module}` });
        continue;
      }
      if (!declares(readFileSync(file, "utf-8"), c.symbol)) {
        findings.push({
          claim: c,
          reason: `${relative(repo, file)} declares no \`${c.symbol}\``,
        });
      }
      continue;
    }
    // ABSENCE — the costly class. The claim is FALSE when a caller exists
    // SOMEWHERE ELSE, which needs two exclusions that a first draft missed:
    //
    //   - the DECLARING file. A symbol referenced only where it is defined
    //     has no caller, and reporting its own declaration as one would turn
    //     a true gap notice into a finding.
    //   - TESTS. A function exercised only by its own unit test is precisely
    //     what "not yet wired in" means; counting that as a caller would
    //     contradict the claim while agreeing with it.
    //
    // Both were visible in the historical case: of four files referencing
    // `resolveSkillDirs`, one was its declaration and one its test. The claim
    // was false because of the third, `src/tools/skill-fetch.ts`.
    const all = callersOf(repo, c.symbol);
    const declaring = all.filter((f) => declares(readFileSync(join(repo, f), "utf-8"), c.symbol));
    const rest = all.filter((f) => !declaring.includes(f));
    const tests = rest.filter((f) => /\.(test|spec)\.[cm]?tsx?$|(^|\/)tests?\//.test(f));
    const real = rest.filter((f) => !tests.includes(f));
    if (real.length > 0) {
      findings.push({
        claim: c,
        reason:
          `claims \`${c.symbol}\` has no caller, but ${real.length} file(s) call it: ` +
          `${real.slice(0, 3).join(", ")}${real.length > 3 ? ", …" : ""}` +
          (tests.length > 0 ? ` (plus ${tests.length} test file(s), which would not by itself refute it)` : ""),
      });
    }
  }
  return { claims, findings };
}

if (import.meta.main) {
  const file = join(REPO, "AGENTS.md");
  if (!existsSync(file)) {
    console.error(`✗ no AGENTS.md at ${REPO}`);
    process.exit(2);
  }
  const { claims, findings } = checkClaims(REPO, readFileSync(file, "utf-8"));
  const loc = claims.filter((c) => c.kind === "location").length;
  const abs = claims.filter((c) => c.kind === "absence").length;

  console.log(`AGENTS.md claims about code — ${loc} location, ${abs} absence\n`);

  // A green run over zero parsed claims is not a green run. The file is
  // thousands of words of prose about this codebase; parsing none of it means
  // the shapes changed, not that the prose became true.
  if (claims.length === 0) {
    console.error(
      "✗ NOT ONE claim could be parsed. That is a broken checker, not a clean file — " +
        "a sentence this tool did not understand is not a sentence it verified.",
    );
    process.exit(2);
  }

  for (const c of claims) {
    const bad = findings.find((f) => f.claim === c);
    const where = c.kind === "location" ? `in ${c.module}` : "(no caller)";
    console.log(`  ${bad ? "✗" : "✓"} ${c.symbol.padEnd(26)} ${where}`);
  }

  if (findings.length > 0) {
    console.error(`\n✗ ${findings.length} claim(s) are FALSE:\n`);
    for (const f of findings) {
      console.error(`  \`${f.claim.symbol}\` — ${f.reason}`);
      console.error(`      “${f.claim.sentence.slice(0, 150)}”`);
    }
    console.error(
      "\nAGENTS.md's own banner: a stale gap notice is worse than none, because an\n" +
        "agent that believes it either avoids the feature or rebuilds it.",
    );
    process.exit(1);
  }

  console.log(`\nEvery parsed claim holds.`);
  console.log(
    `NOT checked: prose naming no backticked symbol, and claims about a config\n` +
      `file's contents — bean \`77ex\`'s second example is of that shape.`,
  );
  process.exit(0);
}
