#!/usr/bin/env bun
/**
 * Render-integrity checkers — mechanical detection of authoring patterns
 * that abort the pdflatex build.
 *
 * These exist because the LaTeX compile is the *last* place such a defect
 * surfaces: an author lands a block, CI is billing-gated (AGENTS.md §"CI
 * billing failures"), and the break is found only when someone builds the
 * full 1000-page paper and reads the log. Every criterion here is a
 * deterministic source-level test an authoring agent can run on one block
 * before committing.
 *
 * Scope discipline: a criterion belongs here only if it maps to a
 * *fatal* pdflatex error class that a corpus scan shows is recurring.
 * Cosmetic issues (overfull boxes, underfull boxes) do not qualify —
 * they never abort a build and drown the signal.
 *
 * @module content/pipeline/qa-checkers-render
 */

import { existsSync, readFileSync } from "node:fs";

export interface RenderHit {
  file: string;
  line: number;
  text: string;
}

export interface RenderResult {
  result: "pass" | "fail" | "warn" | "n/a";
  hits: RenderHit[];
}

function readMaybe(p: string | undefined): string | undefined {
  if (!p || !existsSync(p)) return undefined;
  return readFileSync(p, "utf8");
}

// ── render-math-mode-envelope ───────────────────────────────────
//
// LaTeX splits its math environments into two kinds:
//
//   - OUTER ("display") environments, which *enter* math mode:
//     equation, align, alignat, gather, multline, flalign, displaymath,
//     eqnarray, and the `$$…$$` / `\[…\]` delimiters.
//   - INNER environments, which may only appear *inside* math mode
//     because they typeset a sub-box: aligned, gathered, split, cases,
//     matrix and its delimiter variants, array, subarray, smallmatrix.
//
// A ```tex fence is raw passthrough — whatever it contains is emitted
// into the chapter verbatim. So a fence that opens directly with an
// inner environment lands in horizontal mode and amsmath aborts with
//
//     ! Package amsmath Error: \begin{aligned} allowed only in math mode.
//     ! Missing $ inserted.   (x2, one per delimiter it tries to insert)
//
// i.e. three errors from one authoring slip. The same applies to a bare
// `\begin{aligned}` written directly in `.md` prose outside any fence.
//
// This is a recurring class, not a one-off: commit afdf60d667
// ("wrap Summary derivation-chain in align* (bare aligned → math-mode
// error)") fixed it before, and it returned in two further blocks.
//
// NOTE ON THE OUTER-ENV REGEX. `\begin{align` is a PREFIX of
// `\begin{aligned}`, so a naive "is there an outer env?" guard matches
// the very thing it is meant to guard against and the check silently
// passes on every real defect. The alternation below therefore anchors
// each outer name with `\}` (allowing a `*` variant). A first pass at
// this scan reported 0 corpus hits for exactly that reason, against a
// true count of 2.

const INNER_MATH_ENVS = [
  "aligned",
  "gathered",
  "split",
  "cases",
  "dcases",
  "rcases",
  "matrix",
  "pmatrix",
  "bmatrix",
  "Bmatrix",
  "vmatrix",
  "Vmatrix",
  "smallmatrix",
  "array",
  "subarray",
];

const INNER_RE = new RegExp(
  String.raw`\\begin\{(?:${INNER_MATH_ENVS.join("|")})\}`,
);

/** Outer environments + delimiters that legitimately open math mode. */
const OUTER_RE =
  /\$\$|\\\[|\\begin\{(?:equation|align|alignat|gather|multline|flalign|displaymath|eqnarray|math)\*?\}/;

/**
 * `render-math-mode-envelope` — an inner-only math environment
 * (`aligned`, `cases`, `pmatrix`, …) appears without an enclosing outer
 * math context, so pdflatex aborts with "allowed only in math mode".
 *
 * Checked in two places:
 *   1. inside each ```tex fence (raw LaTeX passthrough), and
 *   2. in `.md` prose outside every fence.
 *
 * Pass: no `.md`, or every inner env sits inside an outer math context.
 * Fail: at least one unenveloped inner env.
 */
export function checkRenderMathModeEnvelope(
  mdPath: string | undefined,
): RenderResult {
  const md = readMaybe(mdPath);
  if (md === undefined) return { result: "n/a", hits: [] };

  const hits: RenderHit[] = [];
  const lines = md.split("\n");

  // Walk fences explicitly so we know both the fence body and its
  // starting line number (for an actionable report).
  let inFence = false;
  let fenceLang = "";
  let fenceStart = 0;
  let fenceBody: string[] = [];
  const proseLines: { line: number; text: string }[] = [];

  const flushFence = () => {
    if (fenceLang !== "tex") return;
    const body = fenceBody.join("\n");
    if (INNER_RE.test(body) && !OUTER_RE.test(body)) {
      const off = fenceBody.findIndex((l) => INNER_RE.test(l));
      hits.push({
        file: mdPath!,
        line: fenceStart + (off < 0 ? 1 : off + 1),
        text: (off < 0 ? fenceBody[0] : fenceBody[off]!).trim().slice(0, 200),
      });
    }
  };

  lines.forEach((l, i) => {
    const fenceOpen = /^\s*```(\w*)/.exec(l);
    if (fenceOpen) {
      if (!inFence) {
        inFence = true;
        fenceLang = fenceOpen[1] ?? "";
        fenceStart = i + 1;
        fenceBody = [];
      } else {
        flushFence();
        inFence = false;
        fenceLang = "";
        fenceBody = [];
      }
      return;
    }
    if (inFence) fenceBody.push(l);
    else proseLines.push({ line: i + 1, text: l });
  });
  // Unterminated fence — still worth testing what we collected.
  if (inFence) flushFence();

  // Prose outside fences: strip math regions first, then any surviving
  // inner env is unenveloped.
  //
  // Inline `$…$` MAY span newlines — the repo documents multi-line
  // inline math as valid (AGENTS.md §"TeX authoring patterns" item 2),
  // and it is the normal way a long `\bigl(\begin{smallmatrix}…` is
  // written. A line-bounded `\$[^$\n]*\$` therefore mis-reports every
  // such block; that cost two false positives out of 3551 on the first
  // corpus run, against two true positives. The span is still stopped
  // at a blank line so an unbalanced `$` cannot swallow the rest of
  // the file and mask a real defect below it.
  const prose = proseLines.map((p) => p.text).join("\n");
  const proseStripped = prose
    .replace(/\$\$[\s\S]*?\$\$/g, "")
    .replace(/\\\[[\s\S]*?\\\]/g, "")
    .replace(/\$(?:[^$\n]|\n(?!\s*\n))*?\$/g, "");
  if (INNER_RE.test(proseStripped)) {
    const p = proseLines.find((x) => INNER_RE.test(x.text));
    if (p) hits.push({ file: mdPath!, line: p.line, text: p.text.trim().slice(0, 200) });
  }

  return { result: hits.length > 0 ? "fail" : "pass", hits };
}

export const RENDER_AUTOMATED_CHECKERS: Record<
  string,
  (paths: { md?: string; ts?: string; lean?: string }) => RenderResult
> = {
  "render-math-mode-envelope": (p) => checkRenderMathModeEnvelope(p.md),
};

export const RENDER_CRITERION_IDS: string[] = Object.keys(
  RENDER_AUTOMATED_CHECKERS,
);
