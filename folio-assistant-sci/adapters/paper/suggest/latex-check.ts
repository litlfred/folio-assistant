/**
 * LaTeX checks for the ✍ suggest editor, paper profile (bean `4dx7`).
 *
 * ## What this is
 *
 * The ✍ suggest action lives in the shared edit-links runtime
 * (`cat-harness-tools/src/core/edit-links.ts`). It checks the syntax of what
 * it knows — variables, directives, one-argument commands — and nothing about
 * LaTeX beyond that. This module is the paper profile's part: the checks a
 * suggestion to a LaTeX-bearing block needs, as pure functions over the
 * block's Markdown, so the runtime can call them through a checker hook and a
 * test can call them without a browser.
 *
 * ## The owner rule it keeps
 *
 * Owner, 2026-10-14: *"I only want that the syntax is valid"*. A reader may
 * change, add or delete any macro, reference or environment; nothing here
 * forbids a change. So:
 *
 * - **error** — the LaTeX is not well formed: an unbalanced brace, an
 *   `\end` that closes nothing or the wrong thing, an environment never
 *   closed, a macro short of the arguments its definition takes, an unclosed
 *   `$$`.
 * - **warning** — well formed, but a `\ref`/`\eqref`/`\cref`/`\uses` label or
 *   a `\cite` key names nothing in the KG. A missing target is never an error.
 *
 * `checkSuggestion` reports only what the edit INTRODUCES: an ingested
 * block's own defects (OCR, a quoted example's dangling labels) are not the
 * reader's, and an untouched block reports nothing.
 *
 * ## What it does not do
 *
 * It is not a TeX parser. It does not expand macros, does not know catcodes
 * beyond `\`, `{`, `}`, `$`, `%`, and checks arity only for macros whose
 * definition it has: the paper's `manifest.macros`, the paper preamble's
 * `\newcommand`s, and a short built-in list. An unknown macro is not checked —
 * not knowing a macro is not evidence that it is wrong.
 *
 * @module folio-assistant-sci/adapters/paper/suggest/latex-check
 */

export type Severity = "error" | "warning";

export type FindingCode =
  | "unmatched-close-brace"
  | "unclosed-brace"
  | "unmatched-end"
  | "mismatched-end"
  | "unclosed-environment"
  | "missing-argument"
  | "unclosed-display-math"
  | "unknown-label"
  | "unknown-cite";

export interface Finding {
  severity: Severity;
  code: FindingCode;
  /** What the finding is about — an environment, macro, label or key. Compared across before/after. */
  subject: string;
  message: string;
  /** 0-based character offset into the checked text. */
  offset: number;
  /** 1-based. */
  line: number;
  /** 1-based. */
  column: number;
}

/** A macro's call shape: required arguments, and whether a `[…]` optional one comes first. */
export interface MacroSpec {
  args: number;
  optional: boolean;
}

/** Keyed by the macro name WITHOUT its backslash. */
export type MacroTable = Record<string, MacroSpec>;

/**
 * Standard LaTeX/KaTeX macros whose arity a suggestion most often gets wrong.
 * Short on purpose: a macro absent here is simply not arity-checked.
 */
export const BUILTIN_MACROS: MacroTable = Object.fromEntries([
  ...["frac", "dfrac", "tfrac", "cfrac", "binom", "dbinom", "tbinom", "overset", "underset", "stackrel"].map((n) => [n, { args: 2, optional: false }]),
  ...["sqrt", "cite", "citep", "citet"].map((n) => [n, { args: 1, optional: true }]),
  ...[
    "text", "textbf", "textit", "texttt", "emph", "mathrm", "mathbf", "mathit", "mathsf", "mathtt",
    "mathbb", "mathcal", "mathfrak", "mathscr", "boldsymbol", "operatorname", "overline", "underline",
    "widehat", "widetilde", "hat", "bar", "tilde", "vec", "dot", "ddot", "label", "ref", "eqref",
    "cref", "Cref", "autoref", "pageref",
  ].map((n) => [n, { args: 1, optional: false }]),
]);

/** Commands whose argument is a comma-separated list of block labels. */
const LABEL_REFS = new Set(["ref", "eqref", "cref", "Cref", "autoref", "pageref", "uses", "proves"]);
/** Commands whose argument is a comma-separated list of bibliography keys. */
const CITE_REFS = new Set(["cite", "citep", "citet", "citealp", "citeauthor", "citeyear"]);

/** Highest `#n` in a macro body: its argument count. Same rule as `blueprint-layout.ts`'s `macroArity`. */
export function macroArity(tex: string): number {
  let n = 0;
  for (const m of tex.matchAll(/#([1-9])/g)) n = Math.max(n, Number(m[1]));
  return n;
}

/**
 * Every `\newcommand`-family definition in a preamble, as a call shape.
 * `\newcommand{\x}[3][d]{…}` takes one optional and two required arguments.
 * `\DeclareMathOperator{\x}{…}` takes none.
 */
export function parseNewcommands(tex: string): MacroTable {
  const out: MacroTable = {};
  const def = /\\(?:newcommand|renewcommand|providecommand|DeclareRobustCommand)\*?\s*\{?\\([A-Za-z@]+)\}?\s*(?:\[(\d)\])?\s*(\[)?/g;
  for (const m of tex.matchAll(def)) {
    const total = m[2] ? Number(m[2]) : 0;
    const optional = total > 0 && m[3] === "[";
    out[m[1]!] = { args: total - (optional ? 1 : 0), optional };
  }
  for (const m of tex.matchAll(/\\DeclareMathOperator\*?\s*\{\\([A-Za-z]+)\}/g)) out[m[1]!] = { args: 0, optional: false };
  return out;
}

/**
 * The macro table a paper's suggestions are checked against: built-ins, then
 * the paper preamble's definitions, then the paper's own `manifest.macros`
 * (the same table `katexMacros` in folio-assistant-core's
 * `build-document-site.ts` hands KaTeX), later entries winning.
 */
export function macroTable(paperMacros?: Record<string, { tex: string }>, preambleTex?: string): MacroTable {
  const t: MacroTable = { ...BUILTIN_MACROS, ...(preambleTex ? parseNewcommands(preambleTex) : {}) };
  for (const [name, def] of Object.entries(paperMacros ?? {})) t[name] = { args: macroArity(def.tex), optional: false };
  return t;
}

/**
 * The macro table from a page's KaTeX macros (`{"\\LM": "\\mathrm{LM}"}`, the
 * table `katexMacros` in folio-assistant-core's `build-document-site.ts`
 * publishes with the page): built-ins, then each macro's arity from its body.
 * The ✍ suggest runtime has the page's KaTeX table and nothing else, so this
 * is the profile's `macros` role in `editor-checkers/paper-latex.json`.
 */
export function macroTableFromKatex(katexMacros: Record<string, string> = {}): MacroTable {
  const t: MacroTable = { ...BUILTIN_MACROS };
  for (const [name, tex] of Object.entries(katexMacros)) {
    const bare = name.replace(/^\\/, "");
    if (/^[A-Za-z@]+$/.test(bare) && typeof tex === "string") t[bare] = { args: macroArity(tex), optional: false };
  }
  return t;
}

/** What the KG knows that references can name. Leave a field undefined to skip that check. */
export interface KgReferences {
  /** Block labels, as `gen-block-jsonld` writes them into each block node's `label`. */
  labels?: Iterable<string>;
  /** Bibliography keys. */
  citeKeys?: Iterable<string>;
}

/** The `label` of every block node that has one. */
export function labelsFromBlockNodes(nodes: Iterable<{ label?: unknown }>): Set<string> {
  const s = new Set<string>();
  for (const n of nodes) if (typeof n.label === "string" && n.label) s.add(n.label);
  return s;
}

/**
 * The bibliography keys among a set of KG nodes. A reference node is one
 * whose `@id` is `references/<key>`, the IRI cat-harness `resolveReferenceKey`
 * gives a cited key, absolute or relative. A CSL-JSON entry (`{ id }` with no
 * `@id`, as in a folio's `references.ts`) counts by its `id`.
 */
export function citeKeysFromReferenceNodes(nodes: Iterable<{ "@id"?: unknown; id?: unknown }>): Set<string> {
  const s = new Set<string>();
  for (const n of nodes) {
    const iri = n["@id"];
    if (typeof iri === "string") {
      const m = /(?:^|\/)references\/([^/#?]+)$/.exec(iri);
      if (m) s.add(decodeURIComponent(m[1]!));
    } else if (typeof n.id === "string" && n.id) s.add(n.id);
  }
  return s;
}

export interface CheckOptions {
  macros?: MacroTable;
  kg?: KgReferences;
}

// ── Scanning ─────────────────────────────────────────────────────────────────

/** [start, end) ranges of fenced code blocks and inline code spans: never LaTeX. */
export function codeRanges(md: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  const fence = /^( {0,3})(`{3,}|~{3,})[^\n]*\n[\s\S]*?(?:^\1?\2[`~]*[ \t]*$|(?![\s\S]))/gm;
  for (const m of md.matchAll(fence)) ranges.push([m.index!, m.index! + m[0].length]);
  const inFence = (i: number) => ranges.some(([a, b]) => i >= a && i < b);
  const fenced = ranges.length;
  for (const m of md.matchAll(/(`+)(?!`)[\s\S]*?[^`]\1(?!`)/g)) {
    if (!inFence(m.index!)) ranges.push([m.index!, m.index! + m[0].length]);
  }
  if (ranges.length > fenced) ranges.sort((a, b) => a[0] - b[0]);
  return ranges;
}

interface Scan {
  findings: Finding[];
  /** Outermost `\begin…\end` spans and argument-taking commands outside math: what the editor must keep verbatim. */
  spans: Array<[number, number]>;
  labels: Array<{ name: string; offset: number }>;
  cites: Array<{ name: string; offset: number }>;
  defined: Set<string>;
}

const BLANK_LINE = /[ \t]*(?:\n|$)/y;

/** Offset -> 1-based line and column. */
function locator(md: string): (offset: number) => { line: number; column: number } {
  const starts = [0];
  for (let i = 0; i < md.length; i++) if (md[i] === "\n") starts.push(i + 1);
  return (offset) => {
    let lo = 0, hi = starts.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid]! <= offset) lo = mid; else hi = mid - 1; }
    return { line: lo + 1, column: offset - starts[lo]! + 1 };
  };
}

const isLetter = (c: string | undefined) => !!c && /[A-Za-z@]/.test(c);

/** End (exclusive) of the balanced `{…}` starting at `i`, or -1. Honours `\{`/`\}`. */
function matchBrace(md: string, i: number): number {
  let d = 0;
  for (let k = i; k < md.length; k++) {
    const c = md[k];
    if (c === "\\") { k++; continue; }
    if (c === "{") d++;
    else if (c === "}" && --d === 0) return k + 1;
  }
  return -1;
}

/** Skip spaces, tabs and at most one newline — a blank line ends a TeX argument search. */
function skipSpace(md: string, k: number): number {
  let nl = false;
  while (k < md.length) {
    const c = md[k];
    if (c === " " || c === "\t") k++;
    else if (c === "\n" && !nl) { nl = true; k++; }
    else break;
  }
  return k;
}

/**
 * How many of `spec.args` required arguments follow `k`, and where they end.
 * An argument is a `{…}` group, a control sequence, or one character — TeX's
 * own rule, so `\frac12` counts as two.
 */
function readArgs(md: string, k: number, spec: MacroSpec): { found: number; end: number } {
  if (spec.optional) {
    const o = skipSpace(md, k);
    if (md[o] === "[") {
      let d = 0;
      for (let j = o + 1; j < md.length; j++) {
        if (md[j] === "\\") { j++; continue; }
        if (md[j] === "{") d++;
        else if (md[j] === "}") d--;
        else if (md[j] === "]" && d === 0) { k = j + 1; break; }
      }
    }
  }
  let found = 0;
  while (found < spec.args) {
    const j = skipSpace(md, k);
    const c = md[j];
    if (c === undefined || c === "}" || c === "$" || c === "&" || c === "\n") break;
    if (c === "{") {
      // An unclosed group is still an argument; the brace check reports it.
      const e = matchBrace(md, j);
      k = e < 0 ? md.length : e;
    } else if (c === "\\") {
      let e = j + 1;
      if (isLetter(md[e])) while (isLetter(md[e])) e++;
      else e++;
      k = e;
    } else k = j + 1;
    found++;
  }
  return { found, end: k };
}

function scan(md: string, macros: MacroTable): Scan {
  const out: Scan = { findings: [], spans: [], labels: [], cites: [], defined: new Set() };
  const at = locator(md);
  const err = (severity: Severity, code: FindingCode, subject: string, message: string, offset: number) =>
    out.findings.push({ severity, code, subject, message, offset, ...at(offset) });

  const code = codeRanges(md);
  let ci = 0;
  const braces: number[] = [];
  const envs: Array<{ name: string; offset: number }> = [];
  let math: { delim: "$" | "$$"; offset: number } | null = null;

  const closeMath = () => {
    while (braces.length && braces[braces.length - 1]! > math!.offset) {
      const o = braces.pop()!;
      err("error", "unclosed-brace", "{", "`{` opened in math is not closed before the math ends.", o);
    }
    math = null;
  };

  for (let i = 0; i < md.length; i++) {
    while (ci < code.length && code[ci]![1] <= i) ci++;
    if (ci < code.length && code[ci]![0] <= i) { i = code[ci]![1] - 1; continue; }
    const c = md[i]!;

    if (c === "\n") {
      // Inline `$…$` cannot cross a blank line: an unclosed `$` was a literal dollar.
      BLANK_LINE.lastIndex = i + 1;
      if (math?.delim === "$" && BLANK_LINE.test(md)) {
        while (braces.length && braces[braces.length - 1]! > math.offset) braces.pop();
        math = null;
      }
      continue;
    }

    if (c === "%") {
      // A comment only where a LaTeX author puts one — at the start of a line. In prose `%` is a percent sign.
      const ls = md.lastIndexOf("\n", i - 1) + 1;
      if (/^[ \t]*$/.test(md.slice(ls, i))) {
        const nl = md.indexOf("\n", i);
        i = (nl < 0 ? md.length : nl) - 1;
      }
      continue;
    }

    if (c === "$") {
      const delim = md[i + 1] === "$" ? "$$" : "$";
      if (!math) math = { delim, offset: i };
      else if (math.delim === delim) closeMath();
      if (delim === "$$") i++;
      continue;
    }

    if (c === "{") { braces.push(i); continue; }
    if (c === "}") {
      if (!braces.length || (math && braces[braces.length - 1]! < math.offset)) {
        err("error", "unmatched-close-brace", "}", "`}` closes nothing.", i);
      } else braces.pop();
      continue;
    }

    if (c !== "\\") continue;
    if (!isLetter(md[i + 1])) { i++; continue; } // control symbol: \{ \} \$ \% \\ …
    let e = i + 1;
    while (isLetter(md[e])) e++;
    const name = md.slice(i + 1, e);

    if (name === "begin" || name === "end") {
      const j = skipSpace(md, e);
      const close = md[j] === "{" ? md.indexOf("}", j) : -1;
      if (close < 0) {
        err("error", "missing-argument", name, `\`\\${name}\` needs an environment name in braces.`, i);
        i = e - 1;
        continue;
      }
      const env = md.slice(j + 1, close).trim();
      if (name === "begin") envs.push({ name: env, offset: i });
      else {
        const k = envs.map((x) => x.name).lastIndexOf(env);
        if (k < 0) err("error", "unmatched-end", env, `\`\\end{${env}}\` closes no \`\\begin{${env}}\`.`, i);
        else {
          for (const open of envs.splice(k + 1).reverse()) {
            err("error", "mismatched-end", open.name, `\`\\end{${env}}\` comes before \`\\end{${open.name}}\` for the \`\\begin{${open.name}}\` inside it.`, open.offset);
          }
          const open = envs.pop()!;
          if (!envs.length && !math) out.spans.push([open.offset, close + 1]);
        }
      }
      i = close;
      continue;
    }

    const spec = macros[name];
    let argEnd = e;
    if (spec && (spec.args > 0 || spec.optional)) {
      const r = readArgs(md, e, spec);
      argEnd = r.end;
      if (r.found < spec.args) {
        err("error", "missing-argument", name,
          `\`\\${name}\` takes ${spec.args} argument${spec.args === 1 ? "" : "s"}; ${r.found === 0 ? "none follows" : `only ${r.found} follow${r.found === 1 ? "s" : ""}`}.`, i);
      }
    }

    if (LABEL_REFS.has(name) || CITE_REFS.has(name) || name === "label") {
      let j = skipSpace(md, e);
      if (md[j] === "[") { const rb = md.indexOf("]", j); if (rb > 0) j = skipSpace(md, rb + 1); }
      if (md[j] === "{") {
        const rb = matchBrace(md, j);
        if (rb > 0) {
          const items = md.slice(j + 1, rb - 1).split(",").map((s) => s.trim()).filter(Boolean);
          for (const it of items) {
            if (name === "label") out.defined.add(it);
            else (CITE_REFS.has(name) ? out.cites : out.labels).push({ name: it, offset: i });
          }
          argEnd = Math.max(argEnd, rb);
        }
      }
    }

    // A macro with no known shape keeps the brace groups written straight after it.
    if (!spec) for (let g = argEnd; md[g] === "{"; ) { const rb = matchBrace(md, g); if (rb < 0) break; argEnd = g = rb; }

    // An argument-taking command outside math and outside any environment: keep verbatim.
    if (argEnd > e && !math && !envs.length) out.spans.push([i, argEnd]);
    i = e - 1;
  }

  if (math?.delim === "$$") {
    err("error", "unclosed-display-math", "$$", "`$$` opens display math that is never closed.", math.offset);
  }
  if (math?.delim === "$") while (braces.length && braces[braces.length - 1]! > math.offset) braces.pop();
  for (const o of braces) err("error", "unclosed-brace", "{", "`{` is never closed.", o);
  for (const open of envs) err("error", "unclosed-environment", open.name, `\`\\begin{${open.name}}\` is never closed by \`\\end{${open.name}}\`.`, open.offset);
  out.findings.sort((a, b) => a.offset - b.offset);
  return out;
}

function referenceFindings(s: Scan, kg: KgReferences | undefined, md: string): Finding[] {
  if (!kg) return [];
  const at = locator(md);
  const f: Finding[] = [];
  if (kg.labels) {
    const known = new Set([...kg.labels, ...s.defined]);
    for (const r of s.labels) if (!known.has(r.name)) {
      f.push({ severity: "warning", code: "unknown-label", subject: r.name, message: `No block in the KG has the label \`${r.name}\`.`, offset: r.offset, ...at(r.offset) });
    }
  }
  if (kg.citeKeys) {
    const known = new Set(kg.citeKeys);
    for (const r of s.cites) if (!known.has(r.name)) {
      f.push({ severity: "warning", code: "unknown-cite", subject: r.name, message: `The bibliography has no key \`${r.name}\`.`, offset: r.offset, ...at(r.offset) });
    }
  }
  return f;
}

/** Every finding in `md`: syntax errors, then (if `kg` is given) reference warnings, in text order. */
export function checkLatex(md: string, opts: CheckOptions = {}): Finding[] {
  const s = scan(md, opts.macros ?? BUILTIN_MACROS);
  return [...s.findings, ...referenceFindings(s, opts.kg, md)].sort((a, b) => a.offset - b.offset);
}

/**
 * The findings a suggestion INTRODUCES: those in `after` beyond what `before`
 * already had, compared by (code, subject) count. An untouched block reports
 * nothing; a defect the source already carried is not the reader's.
 */
export function checkSuggestion(before: string, after: string, opts: CheckOptions = {}): Finding[] {
  if (before === after) return [];
  const key = (f: Finding) => `${f.code}\u0000${f.subject}`;
  const had = new Map<string, number>();
  for (const f of checkLatex(before, opts)) had.set(key(f), (had.get(key(f)) ?? 0) + 1);
  return checkLatex(after, opts).filter((f) => {
    const n = had.get(key(f)) ?? 0;
    if (n > 0) { had.set(key(f), n - 1); return false; }
    return true;
  });
}

// ── Keeping LaTeX verbatim through the editor ────────────────────────────────

const OPEN = "⟦";
const CLOSE = "⟧";

/**
 * The `[start, end)` spans of `md` the editor must keep verbatim: outermost
 * `\begin…\end` environments and argument-taking commands outside math. Math
 * itself is Crepe's latex node's to keep.
 */
export function latexSpans(md: string, macros: MacroTable = BUILTIN_MACROS): Array<[number, number]> {
  return scan(md, macros).spans.sort((a, b) => a[0] - b[0]);
}

/**
 * Wrap each verbatim span in ⟦ ⟧, the edit-links runtime's convention for
 * embedded syntax Markdown escaping must not touch. Returns `md` unchanged if
 * it already contains ⟦ or ⟧ — then unwrapping could not tell ours from the
 * author's.
 */
export function protectLatex(md: string, macros: MacroTable = BUILTIN_MACROS): string {
  if (md.includes(OPEN) || md.includes(CLOSE)) return md;
  let out = "";
  let last = 0;
  for (const [a, b] of latexSpans(md, macros)) {
    if (a < last) continue;
    out += md.slice(last, a) + OPEN + md.slice(a, b) + CLOSE;
    last = b;
  }
  return out + md.slice(last);
}

/** Inverse of `protectLatex`: drop the ⟦ ⟧ wrappers. Only for its output — it drops every ⟦ ⟧. */
export function restoreLatex(md: string): string {
  return md.split(OPEN).join("").split(CLOSE).join("");
}
