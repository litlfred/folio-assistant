#!/usr/bin/env bun
/**
 * paper-render-qa — the RENDERING axis of a paper folio's integrated QA page:
 * what a reader of the generated LaTeX/PDF would trip on.
 *
 *   bun run folio-assistant-sci/scripts/paper-render-qa.ts <out-dir> [--out FILE]
 *       [--root DIR] [--lean-packages MODULE] [--max-def-words N]
 *
 * `<out-dir>` is a LaTeX build's output: `chapters/*.tex`, `main.tex` and
 * `main.log`. The record goes to `--out`, else `$QA_HOME/rendering/<name>.render-qa.json`
 * where `QA_HOME` is the instance's qa home (`layer-qa-publish.yml` exports
 * it), so a publish puts it on the rendering axis by path and by `$schema`
 * (`schemas/sdlc/qa-axis.ts` in the tools layer). Declared in an instance's
 * `<instance>.json` as `qa.writers[]` with `axis: "rendering"`.
 *
 * Ported from a folio's own `scripts/lib/paper-render-qa.py` (owner,
 * 2026-11-19; consumed by nothing until the integrated QA page, 2026-11-24),
 * with two changes that make it the platform's rather than one folio's:
 *
 * - The Lean namespaces it looks for are the folio's own, read from its
 *   `LEAN_PACKAGES` (`lib` of each package; the module `--lean-packages`,
 *   default `<root>/schemas/lean-packages.ts`), plus `Mathlib` and
 *   `CategoryTheory`. No folio's library name is written here.
 * - It reports `counts` in the shared vocabulary — one check each, `fail` for
 *   a placeholder link (a defect in every copy of the PDF), `warn` for a check
 *   with hits, `pass` for one with none — and `na` for every check when there
 *   is no rendered paper to read, rather than an empty "clean" record.
 *
 * Exit 1 only on a placeholder link, as the original; everything else is
 * reported, not blocking.
 *
 * Checks:
 *   placeholder-link   github.com/OWNER/REPO or similar left in the PDF.
 *   lean-in-narrative  Lean identifiers or block labels set as code in prose.
 *                      Exempt: the glossary chapters, and any block whose source
 *                      carries `<!-- lean-terms: context -->`.
 *   definition-length  definitions whose prose (math removed) exceeds N words.
 *   multiply-defined   labels LaTeX reported as defined twice.
 *   broken-hyphen      "quantum- universe": a hyphen and a space inside a word.
 *
 * @module scripts/paper-render-qa
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";

export const RENDER_QA_SCHEMA = "folio-paper-render-qa/v1";
const CHECKS = ["placeholder-link", "lean-in-narrative", "definition-length", "multiply-defined", "broken-hyphen"] as const;

const LABEL = /^(def|prop|thm|lem|cor|conj|rem|ex|sec|eq|alg|prf|prose|sim|app|chap):[\w.:-]+$/;
const TACTICS = /^(sorry|rfl|simp|ring|decide|native_decide|norm_num|linarith|by)$/;
const CAMEL = /^[A-Z][a-z]+(?:[A-Z][a-z0-9]*)+$/;
const ANNOT = /\\blockannot(?:ok)?(?:\[[^\]]*\])?\{([^}]*)\}\{[^}]*\}\{([^}]*)\}/g;
const TT = /\\texttt\{((?:[^{}]|\{[^{}]*\})*)\}/g;
const MATH = /\$\$[\s\S]*?\$\$|\$[^$]*\$|\\\[[\s\S]*?\\\]|\\begin\{(equation|align|gather|multline|tikzcd)\*?\}[\s\S]*?\\end\{\1\*?\}/g;
const PH = /https?:\/\/(?:github\.com\/OWNER\/REPO|OWNER\.github\.io\/REPO)[^\s}]*/g;

export interface RenderQaReport {
  $schema: typeof RENDER_QA_SCHEMA;
  subject: { kind: "paper-render"; id: string };
  maxDefinitionWords: number;
  leanNamespaces: string[];
  checks: Record<(typeof CHECKS)[number], "pass" | "warn" | "fail" | "n/a">;
  counts: { pass?: number; warn?: number; fail?: number; na?: number };
  placeholderLinks: string[];
  leanInNarrative: { block: string; source: string; text: string }[];
  longDefinitions: { block: string; words: number }[];
  multiplyDefined: string[];
  brokenHyphens: { block: string; text: string }[];
  reason?: string;
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** A token is Lean when it is qualified under a known namespace, CamelCase, or a tactic. */
export function leanMatcher(namespaces: readonly string[]): (tok: string) => boolean {
  const qualified = namespaces.length ? new RegExp(`^(?:${namespaces.map(esc).join("|")})\\.[\\w.'₀-₉]+$`) : undefined;
  return (tok) => (qualified?.test(tok) ?? false) || CAMEL.test(tok) || TACTICS.test(tok);
}

function plain(tt: string): string {
  return tt.replace(/\\allowbreak\{\}|\\_|\\-/g, (m) => (m === "\\_" ? "_" : "")).trim();
}

/** Block `.md` sources under `<root>/folio/` that opt out of lean-in-narrative. */
function exemptSources(root: string): Set<string> {
  const out = new Set<string>();
  const folio = join(root, "folio");
  if (!existsSync(folio)) return out;
  for (const f of readdirSync(folio, { recursive: true }) as string[]) {
    if (!f.endsWith(".md") || f.split("/").length !== 3) continue;
    if (readFileSync(join(folio, f), "utf8").includes("lean-terms: context")) out.add(f);
  }
  return out;
}

/** The report over one LaTeX build's output. Pure over the files it reads. */
export function renderQa(outDir: string, opts: { root?: string; namespaces: readonly string[]; maxWords?: number; id?: string }): RenderQaReport {
  const maxWords = opts.maxWords ?? 120;
  const namespaces = [...new Set([...opts.namespaces, "Mathlib", "CategoryTheory"])];
  const base: RenderQaReport = {
    $schema: RENDER_QA_SCHEMA,
    subject: { kind: "paper-render", id: opts.id ?? basename(resolve(outDir)) },
    maxDefinitionWords: maxWords,
    leanNamespaces: namespaces,
    checks: Object.fromEntries(CHECKS.map((c) => [c, "n/a"])) as RenderQaReport["checks"],
    counts: {},
    placeholderLinks: [],
    leanInNarrative: [],
    longDefinitions: [],
    multiplyDefined: [],
    brokenHyphens: [],
  };
  const chapters = join(outDir, "chapters");
  const texs = existsSync(chapters) ? readdirSync(chapters).filter((f) => f.endsWith(".tex")).sort() : [];
  if (texs.length === 0) {
    return { ...base, counts: { na: CHECKS.length }, reason: `no rendered paper under ${outDir} (no chapters/*.tex), so nothing was read: not applicable, not clean` };
  }
  const isLean = leanMatcher(namespaces);
  const exempt = exemptSources(opts.root ?? dirname(resolve(outDir)));
  const texts = texs.map((f) => ({ stem: f.replace(/\.tex$/, ""), text: readFileSync(join(chapters, f), "utf8") }));
  for (const { stem, text } of texts) {
    if (stem === "glossary" || stem === "definition-glossary") continue;
    const marks = [...text.matchAll(ANNOT)].map((m) => ({ at: m.index!, label: m[1]!, src: m[2]! }));
    marks.forEach((m, i) => {
      const body = text.slice(m.at, i + 1 < marks.length ? marks[i + 1]!.at : text.length);
      if (!exempt.has(m.src)) {
        for (const t of body.matchAll(TT)) {
          const tok = plain(t[1]!);
          if (LABEL.test(tok) || isLean(tok)) base.leanInNarrative.push({ block: m.label, source: m.src, text: tok });
        }
      }
      for (const h of body.replace(MATH, " ").matchAll(/\b([a-z]{3,})- (?!and\b|or\b|to\b|nor\b)([a-z]{3,})\b/g)) {
        base.brokenHyphens.push({ block: m.label, text: h[0] });
      }
    });
    for (const d of text.matchAll(/\\begin\{definition\}([\s\S]*?)\\end\{definition\}/g)) {
      const body = d[1]!;
      const label = /\\label\{([^}]+)\}/.exec(body)?.[1] ?? "?";
      const prose = body
        .replace(MATH, " ")
        .replace(/\\(blockannot|blockannotok|uses|label)(\[[^\]]*\])?(\{[^}]*\})+/g, " ")
        .replace(/\\[A-Za-z]+\*?|[{}[\]]/g, " ");
      const n = (prose.match(/[A-Za-z][A-Za-z'-]*/g) ?? []).length;
      if (n > maxWords) base.longDefinitions.push({ block: label, words: n });
    }
  }
  const placeholders = new Set(texts.flatMap((t) => t.text.match(PH) ?? []));
  const mainTex = existsSync(join(outDir, "main.tex")) ? readFileSync(join(outDir, "main.tex"), "utf8") : "";
  for (const macro of ["foliorepobase", "foliopagesbase"]) {
    const m = new RegExp(`\\\\(?:newcommand|providecommand)\\{\\\\${macro}\\}\\{([^}]*)\\}`).exec(mainTex);
    if (m && new RegExp(`^${PH.source}`).test(m[1]!)) placeholders.add(m[1]!);
  }
  base.placeholderLinks = [...placeholders].sort();
  const log = existsSync(join(outDir, "main.log")) ? readFileSync(join(outDir, "main.log"), "utf8") : "";
  base.multiplyDefined = [...new Set([...log.matchAll(/Label `([^']+)' multiply defined/g)].map((m) => m[1]!))].sort();
  base.longDefinitions.sort((a, b) => b.words - a.words);

  const hits: Record<(typeof CHECKS)[number], number> = {
    "placeholder-link": base.placeholderLinks.length,
    "lean-in-narrative": base.leanInNarrative.length,
    "definition-length": base.longDefinitions.length,
    "multiply-defined": base.multiplyDefined.length,
    "broken-hyphen": base.brokenHyphens.length,
  };
  for (const c of CHECKS) {
    // `multiply-defined` reads the LaTeX log; with no log it was not checked.
    const v = c === "multiply-defined" && !log ? "n/a" : hits[c] === 0 ? "pass" : c === "placeholder-link" ? "fail" : "warn";
    base.checks[c] = v;
    const k = v === "n/a" ? "na" : v;
    base.counts[k] = (base.counts[k] ?? 0) + 1;
  }
  return base;
}

/** The folio's Lean library names, from the module exporting its `LEAN_PACKAGES`. Empty when there is none. */
async function leanLibs(root: string, module?: string): Promise<string[]> {
  const p = resolve(root, module ?? join("schemas", "lean-packages.ts"));
  if (!existsSync(p)) return [];
  const m = (await import(p)) as { LEAN_PACKAGES?: { lib?: string }[]; default?: { lib?: string }[] };
  const pkgs = m.LEAN_PACKAGES ?? m.default ?? [];
  return pkgs.map((x) => x.lib).filter((x): x is string => typeof x === "string" && x.length > 0);
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const arg = (k: string) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : undefined);
  const outDir = argv.find((a, i) => !a.startsWith("--") && !(i > 0 && argv[i - 1]!.startsWith("--")));
  if (!outDir) {
    console.error("usage: paper-render-qa.ts <out-dir> [--out FILE] [--root DIR] [--lean-packages MODULE] [--max-def-words N]");
    process.exit(2);
  }
  const root = resolve(arg("--root") ?? process.cwd());
  const namespaces = await leanLibs(root, arg("--lean-packages"));
  const id = basename(resolve(outDir));
  const report = renderQa(outDir, { root, namespaces, maxWords: arg("--max-def-words") ? Number(arg("--max-def-words")) : undefined, id });
  const home = process.env.QA_HOME;
  const out = arg("--out") ?? (home ? join(home, "rendering", `${id}.render-qa.json`) : join(outDir, "render-qa.json"));
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(report, null, 2) + "\n");
  const blocks = new Set(report.leanInNarrative.map((h) => h.block)).size;
  console.log(
    report.reason
      ? `==> render QA: ${report.reason} -> ${relative(process.cwd(), out)}`
      : `==> render QA: placeholder-links=${report.placeholderLinks.length} lean-in-narrative=${report.leanInNarrative.length} (in ${blocks} blocks)` +
          ` long-definitions=${report.longDefinitions.length} (>${report.maxDefinitionWords} words) multiply-defined=${report.multiplyDefined.length}` +
          ` broken-hyphens=${report.brokenHyphens.length} -> ${relative(process.cwd(), out)}`,
  );
  process.exit(report.placeholderLinks.length ? 1 : 0);
}
