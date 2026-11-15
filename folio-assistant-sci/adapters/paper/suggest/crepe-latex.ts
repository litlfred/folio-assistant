/**
 * The paper profile's settings for Crepe's math editor (bean `4dx7`), and the
 * two repairs a paper needs on Crepe 7.22.2. Each was found by running Crepe
 * headless over this library (`crepe-latex.test.ts`).
 *
 * ## 1. Inline math ignores the paper's macros
 *
 * Crepe's `latex` feature takes `katexOptions`, but only its `$$…$$` preview
 * reads them. The inline `math_inline` node renders with
 * `katex.render(value, dom, { throwOnError: false })`, so `$\LM(x)$` shows a
 * KaTeX error even when `\LM` is in `katexOptions.macros`.
 * `inlineMathNodeView` renders the same node with the macros. Register it as
 * the `math_inline` node view.
 *
 * ## 2. Crepe's serialiser corrupts LaTeX outside math
 *
 * Markdown escaping writes `[` as `\[` and `~` as `\~`. In prose that is
 * harmless. In LaTeX it changes the meaning: `\begin{theorem}[Fermat]` comes
 * back as `\begin{theorem}\[Fermat]`, and `\cite[p.~3]{k}` as
 * `\cite\[p.\~3]{k}`. Wrapping the text in ⟦ ⟧ does not help, because the
 * text inside is still escaped.
 *
 * `latexAtoms` is a remark transformer. It turns each span `latexSpans`
 * finds (outermost environments, argument-taking commands outside math) into
 * an mdast `html` node holding the source slice verbatim. Milkdown's
 * commonmark `html` node is an atom and serialises its value raw, so the
 * LaTeX comes back byte for byte. An environment is then edited as a whole,
 * in the raw-LaTeX pane: the owner's decision of 2026-10-14 ("both").
 *
 * Nothing here imports Milkdown or KaTeX. The runtime passes in its own
 * KaTeX, so the module stays loadable wherever the runtime loads it.
 *
 * @module folio-assistant-sci/adapters/paper/suggest/crepe-latex
 */

import { BUILTIN_MACROS, latexSpans, type MacroTable } from "./latex-check";

/** `\name` -> TeX, the shape KaTeX's `macros` option takes (folio-assistant-core `katexMacros`). */
export type KatexMacros = Record<string, string>;

/** Crepe's `featureConfigs[Crepe.Feature.Latex]` for a paper: macros for the `$$…$$` preview. */
export function crepeLatexConfig(macros: KatexMacros): { katexOptions: { macros: KatexMacros; throwOnError: false } } {
  return { katexOptions: { macros: { ...macros }, throwOnError: false } };
}

/**
 * Crepe's `featureConfigs` for a paper, keyed by Crepe's own feature names
 * (the runtime hands in `Crepe.Feature`, so it names no feature itself): the
 * math feature's settings from {@link crepeLatexConfig}.
 */
export function crepeFeatureConfigs(feature: { Latex: string }, macros: KatexMacros): Record<string, ReturnType<typeof crepeLatexConfig>> {
  return { [feature.Latex]: crepeLatexConfig(macros) };
}

/** The part of KaTeX the node view calls. */
export interface KatexLike {
  render(tex: string, el: HTMLElement, opts: { throwOnError?: boolean; displayMode?: boolean; macros?: KatexMacros }): void;
}

interface PmNode {
  type: unknown;
  attrs: Record<string, unknown>;
}

/**
 * A ProseMirror node view for Crepe's `math_inline` that renders with the
 * paper's macros. The DOM matches Crepe's own: `span[data-type=math_inline]`
 * with `data-value`, so Crepe's parseDOM and its inline tooltip still find it.
 */
export function inlineMathNodeView(katex: KatexLike, macros: KatexMacros) {
  return (node: PmNode) => {
    const dom = document.createElement("span");
    const draw = (n: PmNode) => {
      const value = String(n.attrs.value ?? "");
      dom.dataset.type = "math_inline";
      dom.dataset.value = value;
      dom.textContent = "";
      // A copy each time: KaTeX writes `\gdef`s into the table it is given.
      katex.render(value, dom, { throwOnError: false, macros: { ...macros } });
    };
    draw(node);
    return {
      dom,
      update(n: PmNode) {
        if (n.type !== node.type) return false;
        node = n;
        draw(n);
        return true;
      },
      ignoreMutation: () => true,
    };
  };
}

// ── latexAtoms ───────────────────────────────────────────────────────────────

interface Point { offset?: number }
interface MdNode {
  type: string;
  value?: string;
  children?: MdNode[];
  position?: { start: Point; end: Point };
}

/** A new node keeps a position, so a span placed after it can still find its way. */
const at = (n: MdNode, a: number, b: number): MdNode => ({ ...n, position: { start: { offset: a }, end: { offset: b } } });
const start = (n: MdNode) => n.position?.start.offset;
const end = (n: MdNode) => n.position?.end.offset;

/**
 * Replace children `i..j` of `parent` that the span `[a, b)` covers with an
 * `html` node holding `src.slice(a, b)`. A text child cut by the span is split,
 * but only where its value IS its source. A text node whose source carries
 * Markdown escapes cannot be cut by offset, so the span is left alone.
 */
function atomizeInline(parent: MdNode, src: string, a: number, b: number): boolean {
  const kids = parent.children!;
  const i = kids.findIndex((k) => (end(k) ?? -1) > a);
  let j = -1;
  for (let k = kids.length - 1; k >= 0; k--) if ((start(kids[k]!) ?? Infinity) < b) { j = k; break; }
  if (i < 0 || j < i) return false;
  const first = kids[i]!, last = kids[j]!;
  if (start(first)! > a || end(last)! < b) return false;
  const cut = (n: MdNode) => n.type === "text" && n.value === src.slice(start(n)!, end(n)!);
  // A line break beside an inline atom is serialised as a space: carry it inside the atom.
  if (src[a - 1] === "\n" && a - 1 > start(first)! && cut(first)) a--;
  if (src[b] === "\n" && b < end(last)! - 1 && cut(last)) b++;
  if ((start(first)! < a && !cut(first)) || (end(last)! > b && !cut(last))) return false;
  const out: MdNode[] = [];
  if (start(first)! < a) out.push(at({ type: "text", value: src.slice(start(first)!, a) }, start(first)!, a));
  out.push(at({ type: "html", value: src.slice(a, b) }, a, b));
  if (end(last)! > b) out.push(at({ type: "text", value: src.slice(b, end(last)!) }, b, end(last)!));
  kids.splice(i, j - i + 1, ...out);
  return true;
}

/** A span that is exactly blocks `i..j` of a container: one paragraph holding one `html` atom. */
function atomizeBlocks(parent: MdNode, src: string, a: number, b: number): boolean {
  const kids = parent.children!;
  const i = kids.findIndex((k) => start(k) === a);
  const j = kids.findIndex((k) => end(k) === b);
  if (i < 0 || j < i) return false;
  kids.splice(i, j - i + 1, at({ type: "paragraph", children: [at({ type: "html", value: src.slice(a, b) }, a, b)] }, a, b));
  return true;
}

const INLINE_PARENTS = new Set(["paragraph", "heading", "tableCell", "emphasis", "strong", "link"]);

function place(node: MdNode, src: string, a: number, b: number): boolean {
  if (!node.children) return false;
  if ((start(node) ?? 0) > a || (end(node) ?? src.length) < b) return false;
  if (INLINE_PARENTS.has(node.type)) return atomizeInline(node, src, a, b);
  for (const k of node.children) if (place(k, src, a, b)) return true;
  return atomizeBlocks(node, src, a, b);
}

/**
 * A remark plugin that keeps a paper's LaTeX
 * outside math verbatim through the editor. A span it cannot place cleanly is
 * left as it was. The span is never altered or dropped.
 *
 * It must run FIRST among the editor's remark transformers. It reads source
 * offsets, and Milkdown's own transformers split text nodes without keeping
 * them. `useLatexAtoms` registers it that way.
 */
export function latexAtoms(macros: MacroTable = BUILTIN_MACROS) {
  return () => (tree: MdNode, file: { value?: unknown }) => {
    const src = typeof file?.value === "string" ? file.value : String(file?.value ?? "");
    // Last span first: an earlier span's offsets survive a later span's splice.
    for (const [a, b] of latexSpans(src, macros).reverse()) place(tree, src, a, b);
  };
}

/** A remark plugin entry as Milkdown's `remarkPluginsCtx` holds them. */
export interface RemarkPluginEntry { plugin: unknown; options: unknown }

/** Prepend `latexAtoms` to a Milkdown `remarkPluginsCtx` list: `ctx.update(remarkPluginsCtx, useLatexAtoms(macros))`. */
export function useLatexAtoms(macros: MacroTable = BUILTIN_MACROS) {
  const entry: RemarkPluginEntry = { plugin: latexAtoms(macros), options: undefined };
  return (plugins: RemarkPluginEntry[]) => [entry, ...plugins.filter((p) => p !== entry)];
}
