/**
 * Render pipeline: content objects → LaTeX.
 *
 * Flow:
 *   1. Load .ts manifest (Block metadata)
 *   2. Load sibling .md file (narrative content)
 *   3. Convert markdown → LaTeX body
 *   4. Wrap in appropriate LaTeX environment
 *   5. Validate rendered LaTeX via unified-latex AST parse
 *
 * @module content/pipeline/render-latex
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname, basename, extname } from "path";
import { parse } from "@unified-latex/unified-latex-util-parse";
import { remark } from "remark";
import remarkMath from "remark-math";
import remarkDirective from "remark-directive";
// Selective GFM: exclude gfm-autolink-literal which causes OOM on
// dotted Lean identifiers (e.g. "QOU.Archimedean.Foo.bar").
// Tables and strikethrough are loaded individually from the transitive
// deps of remark-gfm.
import { gfmTable } from "micromark-extension-gfm-table";
import {
  gfmTableFromMarkdown,
  gfmTableToMarkdown,
} from "mdast-util-gfm-table";
import { gfmStrikethrough } from "micromark-extension-gfm-strikethrough";
import {
  gfmStrikethroughFromMarkdown,
  gfmStrikethroughToMarkdown,
} from "mdast-util-gfm-strikethrough";
import type { Block, Chapter, Section, RenderOptions } from "../../schemas/types";
import { isCrossPaperRef } from "../../schemas/types";
import { parseLeanRef } from "../../folio-assistant/schemas/lean-packages";
import { extractCitations } from "./citations";
import {
  renderValue,
  parseValAttrs,
  substituteValuesInMath,
} from "./render-value";

// ── LaTeX character escaping ─────────────────────────────────────

/**
 * Escape special LaTeX characters in a plain-text segment.
 *
 * Applied only to text *outside* math mode — see `escapeLatex` which
 * splits on `$...$` boundaries first.
 */
function escapeLatexSegment(text: string): string {
  return text
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

/**
 * Transliterate Unicode that lacks a T1-font glyph into ASCII for use
 * inside `\begin{verbatim}` blocks.
 *
 * `\newunicodechar` mappings (defined in main.tex) are DISABLED inside
 * `verbatim` (its catcode regime makes every char "other"), so a raw
 * Greek letter / math operator / arrow there has no glyph and aborts
 * pdflatex with `Unicode character … not set up for use with LaTeX`.
 * Fenced code blocks in the content are often ASCII-art pipeline
 * diagrams that mix in such symbols; transliterating them keeps the
 * diagram renderable. Latin-1 accented letters and `§` are NOT mapped
 * — T1 has glyphs for them, so they render fine in verbatim.
 */
const VERBATIM_TRANSLIT: Record<string, string> = {
  // Greek lowercase
  "α": "alpha", "β": "beta", "γ": "gamma", "δ": "delta", "ε": "eps",
  "ζ": "zeta", "η": "eta", "θ": "theta", "ι": "iota", "κ": "kappa",
  "λ": "lambda", "μ": "mu", "ν": "nu", "ξ": "xi", "ο": "o", "π": "pi",
  "ρ": "rho", "σ": "sigma", "ς": "sigma", "τ": "tau", "υ": "upsilon",
  "φ": "phi", "ϕ": "phi", "χ": "chi", "ψ": "psi", "ω": "omega", "ϱ": "rho",
  // Greek uppercase
  "Γ": "Gamma", "Δ": "Delta", "Θ": "Theta", "Λ": "Lambda", "Ξ": "Xi",
  "Π": "Pi", "Σ": "Sum", "Φ": "Phi", "Ψ": "Psi", "Ω": "Omega",
  // arrows
  "→": "->", "←": "<-", "↔": "<->", "↦": "|->", "⟶": "-->", "⟵": "<--",
  "⟹": "==>", "⇒": "=>", "⇐": "<=", "⇔": "<=>", "↓": "v", "↑": "^",
  "↘": "\\", "↙": "/",
  // operators / relations
  "⊗": "(x)", "⊕": "(+)", "⊙": "(.)", "≅": "~=", "≃": "~=", "≈": "~=",
  "∼": "~", "≡": "==", "≠": "!=", "≤": "<=", "≥": ">=", "≺": "<", "≻": ">",
  "∈": "in", "∉": "not-in", "∋": "owns", "⊂": "subset", "⊆": "subseteq",
  "⊢": "|-", "⊨": "|=", "×": "x", "·": ".", "∘": "o", "√": "sqrt",
  "∫": "int", "∂": "d", "∇": "grad", "∞": "inf", "±": "+/-", "∓": "-/+",
  "∧": "and", "∨": "or", "¬": "not", "∀": "forall", "∃": "exists",
  "∅": "{}", "∪": "union", "∩": "intersect", "⊥": "perp", "∥": "||",
  "⌊": "|_", "⌋": "_|", "⌈": "|^", "⌉": "^|", "⟨": "<", "⟩": ">",
  // blackboard / script (math alphabets — no T1 glyph)
  "ℚ": "Q", "ℝ": "R", "ℤ": "Z", "ℂ": "C", "ℕ": "N", "ℍ": "H", "ℙ": "P",
  "𝓑": "B", "𝐍": "N", "𝐨": "o", "𝟙": "1", "𝟘": "0",
  // sub/superscripts
  "⁻": "^-", "⁺": "^+", "⁰": "^0", "¹": "^1", "²": "^2", "³": "^3",
  "⁴": "^4", "⁵": "^5", "⁶": "^6", "ⁿ": "^n",
  "₀": "_0", "₁": "_1", "₂": "_2", "₃": "_3", "₄": "_4", "ₙ": "_n",
  "ᵢ": "_i", "ⱼ": "_j", "ₖ": "_k",
  // misc symbols lacking T1 glyphs
  "■": "[#]", "□": "[]", "●": "(*)", "○": "( )", "★": "*", "•": "*",
  "†": "+", "‡": "++", "≪": "<<", "≫": ">>", "↯": "lightning",
  "ᘁ": "", "‾": "-", "−": "-", "⁄": "/",
  // more subscripts/superscripts
  "₅": "_5", "₆": "_6", "₇": "_7", "₈": "_8", "₉": "_9",
  "⁷": "^7", "⁸": "^8", "⁹": "^9",
  // script/blackboard letters + big operators
  "ℏ": "hbar", "ℓ": "l", "℘": "P", "∏": "prod", "∑": "Sum", "∐": "coprod",
  // dashes / ellipsis (T1 may render, but ASCII is always safe in code)
  "–": "--", "—": "---", "…": "...", "‖": "||",
  // box-drawing + triangles (ASCII-art frames)
  "─": "-", "│": "|", "┌": "+", "┐": "+", "└": "+", "┘": "+",
  "├": "+", "┤": "+", "┬": "+", "┴": "+", "┼": "+",
  "═": "=", "║": "|", "╔": "+", "╗": "+", "╚": "+", "╝": "+",
  "▲": "^", "►": ">", "▼": "v", "◄": "<", "△": "^", "▽": "v",
  "◁": "<", "▷": ">", "➤": ">",
};

function transliterateForVerbatim(text: string): string {
  let out = "";
  for (const ch of text) {
    out += VERBATIM_TRANSLIT[ch] ?? ch;
  }
  return out;
}


/**
 * Escape special LaTeX characters in titles, captions, etc.,
 * while preserving inline math (`$...$`) segments verbatim.
 *
 * Titles may contain inline math like `$\mathrm{SU}(2)$` which
 * must not be escaped. This function splits on `$` boundaries,
 * escapes only the non-math segments, and reassembles.
 */
export function escapeLatex(text: string): string {
  // Split on $ delimiters, preserving them
  const parts = text.split(/(\$[^$]*\$)/);
  return parts
    .map((part, i) => {
      // Odd-indexed parts matched the $...$ pattern — pass through
      if (part.startsWith("$") && part.endsWith("$") && part.length > 1) {
        return part;
      }
      return escapeLatexSegment(part);
    })
    .join("");
}

// ── Markdown → LaTeX conversion (AST-based) ─────────────────────

/** Shared remark parser instance with math + selective GFM (no autolink).
 *  The full remarkGfm bundle includes gfm-autolink-literal which causes
 *  OOM on dotted Lean identifiers. We load only tables + strikethrough. */
const mdParser = remark()
  .data("micromarkExtensions", [gfmTable(), gfmStrikethrough()])
  .data("fromMarkdownExtensions", [
    gfmTableFromMarkdown(),
    gfmStrikethroughFromMarkdown(),
  ])
  .use(remarkDirective)
  .use(remarkMath);

/**
 * Protect bare `|` inside inline `$...$` math from the GFM table parser.
 *
 * micromark's gfm-table is a *flow* construct: it splits table rows on `|`
 * before remark-math tokenises inline math, so a cell like
 * `$|\mathrm{tr}_M(\rho(\beta))|$` or `$\langle a|b\rangle$` spills into
 * extra columns ("Extra alignment tab has been changed to \cr" — a fatal
 * pdflatex error) and the orphaned `$` get escaped to literal text.
 *
 * Replace each bare `|` inside an inline math span with `\vert ` — which is
 * output-identical in math mode — so the table parser sees no spurious
 * delimiters. Real cell separators (`|` outside math) and fenced code
 * blocks are left untouched.
 */
export function protectPipesInInlineMath(md: string): string {
  const lines = md.split("\n");
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*(```|~~~)/.test(lines[i])) { inFence = !inFence; continue; }
    if (inFence) continue;
    lines[i] = lines[i].replace(/\$[^$\n]+\$/g, (seg) =>
      seg.replace(/(?<!\\)\|/g, "\\vert "),
    );
  }
  return lines.join("\n");
}

/**
 * Parse markdown content via remark, caching the resulting AST.
 * Multiple render functions (markdownToLatex, extractMathContent)
 * may be called on the same content within a single build — this
 * avoids redundant parses.  Bounded to 512 entries to cap memory.
 */
const MD_AST_CACHE_LIMIT = 512;
const _mdAstCache = new Map<string, any>();
export function parseMdCached(md: string): any {
  let tree = _mdAstCache.get(md);
  if (!tree) {
    tree = mdParser.parse(protectPipesInInlineMath(md));
    if (_mdAstCache.size >= MD_AST_CACHE_LIMIT) {
      // Evict oldest entry (first inserted key)
      const firstKey = _mdAstCache.keys().next().value;
      if (firstKey !== undefined) _mdAstCache.delete(firstKey);
    }
    _mdAstCache.set(md, tree);
  }
  return tree;
}

/** Clear the markdown AST cache (e.g. between builds in watch mode). */
export function clearMdAstCache(): void {
  _mdAstCache.clear();
}

/**
 * Convert markdown content to LaTeX body text via remark AST.
 *
 * Walks the parsed AST instead of line-by-line regex matching.
 * Node type mapping:
 *
 *   | mdast node    | LaTeX output                         |
 *   |---------------|--------------------------------------|
 *   | text          | passthrough                          |
 *   | strong        | \textbf{children}                    |
 *   | emphasis      | \emph{children}                      |
 *   | inlineMath    | $value$                              |
 *   | math          | \[value\]                            |
 *   | code(tex)     | raw passthrough                      |
 *   | code(other)   | \begin{verbatim}...\end{verbatim}    |
 *   | link(#ref)    | \hyperref[ref]{children}             |
 *   | link(url)     | \href{url}{children}                 |
 *   | list(ordered) | \begin{enumerate} \item ...\end{...} |
 *   | list(unord.)  | \begin{itemize} \item ...\end{...}   |
 *   | table         | \begin{tabular}...\end{tabular}      |
 *   | paragraph     | children + blank line                |
 */
export function markdownToLatex(md: string): string {
  const tree = parseMdCached(md);
  return renderMdastNode(tree).trim();
}

/**
 * Extract raw TeX content from markdown for equation blocks.
 * Walks the AST but only emits math and fenced-tex nodes —
 * lists, prose, and formatting are skipped.
 */
export function extractMathContent(md: string): string {
  const tree = parseMdCached(md);
  const parts: string[] = [];

  for (const child of (tree as any).children ?? []) {
    if (child.type === "math") {
      // Display math: extract inner TeX (substituting :val[…] references).
      parts.push(substituteValuesInMath(child.value));
    } else if (child.type === "code" && child.lang === "tex") {
      // Fenced TeX: raw passthrough with witness substitution.
      parts.push(substituteValuesInMath(child.value));
    } else if (child.type === "paragraph") {
      // Check for inline math in paragraphs (rare in equation blocks)
      for (const inline of child.children ?? []) {
        if (inline.type === "inlineMath") {
          parts.push(substituteValuesInMath(inline.value));
        } else if (inline.type === "text") {
          // Plain text in an equation .md — treat as raw TeX
          const trimmed = inline.value.trim();
          if (trimmed) parts.push(trimmed);
        }
      }
    }
    // Lists, code blocks, etc. are silently skipped
  }

  return parts.join("\n").trim();
}

// ── HTML table → LaTeX conversion ────────────────────────────────

/**
 * Convert an HTML `<table>` to LaTeX `\begin{tabular}`.
 *
 * Handles `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`.
 * Inline math (`$...$`) inside cells is preserved.
 * The `align` attribute on `<td>`/`<th>` is respected.
 */
function htmlTableToLatex(html: string): string {
  const rowMatches = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
  if (!rowMatches || rowMatches.length === 0) return "";

  const rows: string[][] = [];
  const isHeaderRow: boolean[] = [];
  const cellAligns: (string | null)[][] = [];

  for (const rowHtml of rowMatches) {
    const cellMatches = rowHtml.match(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi);
    if (!cellMatches) { rows.push([]); isHeaderRow.push(false); cellAligns.push([]); continue; }

    const cells: string[] = [];
    const aligns: (string | null)[] = [];
    let hasHeader = false;
    for (const cellHtml of cellMatches) {
      if (/^<th/i.test(cellHtml)) hasHeader = true;
      // Extract align attribute (avoid matching valign)
      const alignMatch = cellHtml.match(/(?:^|\s)align\s*=\s*"?(\w+)"?/i);
      aligns.push(alignMatch ? alignMatch[1].toLowerCase() : null);
      // Extract cell content
      const content = cellHtml
        .replace(/<t[hd][^>]*>/i, "")
        .replace(/<\/t[hd]>/i, "")
        .trim();
      // First extract formatting markers, then strip remaining tags,
      // then escape for LaTeX, then apply LaTeX formatting commands.
      // This order ensures escaping doesn't corrupt LaTeX commands.
      const withMarkers = content
        .replace(/<strong>([\s\S]*?)<\/strong>/gi, "\x01BOLD\x02$1\x01/BOLD\x02")
        .replace(/<em>([\s\S]*?)<\/em>/gi, "\x01EM\x02$1\x01/EM\x02")
        .replace(/<code>([\s\S]*?)<\/code>/gi, "\x01TT\x02$1\x01/TT\x02")
        .replace(/<[^>]*>/g, "");
      const escaped = escapeLatex(withMarkers)
        .replace(/\x01BOLD\x02/g, "\\textbf{").replace(/\x01\/BOLD\x02/g, "}")
        .replace(/\x01EM\x02/g, "\\emph{").replace(/\x01\/EM\x02/g, "}")
        .replace(/\x01TT\x02/g, "\\texttt{").replace(/\x01\/TT\x02/g, "}");
      cells.push(escaped);
    }
    rows.push(cells);
    isHeaderRow.push(hasHeader);
    cellAligns.push(aligns);
  }

  if (rows.length === 0) return "";

  const colCount = Math.max(...rows.map(r => r.length));

  // Determine column alignment from first row's align attributes
  const colSpec = Array.from({ length: colCount }, (_, i) => {
    const align = cellAligns[0]?.[i];
    if (align === "center") return "c";
    if (align === "right") return "r";
    return "l";
  }).join(" ");

  const lines: string[] = [];
  lines.push(`\\begin{tabular}{${colSpec}}`);
  lines.push("\\toprule");
  for (let r = 0; r < rows.length; r++) {
    const padded = rows[r].concat(
      Array(Math.max(0, colCount - rows[r].length)).fill("")
    );
    lines.push(`${padded.join(" & ")} \\\\`);
    if (isHeaderRow[r]) lines.push("\\midrule");
  }
  lines.push("\\bottomrule");
  lines.push("\\end{tabular}");
  return lines.join("\n");
}

// ── AST node → LaTeX rendering ──────────────────────────────────

/** Render a single mdast node to LaTeX. */
function renderMdastNode(node: any): string {
  switch (node.type) {
    case "root":
      return renderChildren(node).join("\n\n");

    case "paragraph":
      return renderChildren(node).join("");

    case "text": {
      // Preserve \cite{...} commands (LaTeX citations) while escaping other text.
      // \cite may have an optional [...] argument: \cite[Thm.~1.7]{key}
      // Limitation: nested brackets in the optional argument are not supported
      // (e.g. \cite[Thm.~1.7 [p.~5]]{key}).
      const textVal: string = node.value;
      const citePat = /(\\cite(?:\[[^\]]*\])?\{[^}]+\})/g;
      const textParts = textVal.split(citePat);
      return textParts
        .map((part: string) => (/^\\cite/.test(part) ? part : escapeLatex(part)))
        .join("");
    }

    case "strong":
      return `\\textbf{${renderChildren(node).join("")}}`;

    case "emphasis":
      return `\\emph{${renderChildren(node).join("")}}`;

    case "inlineMath":
      return `$${substituteValuesInMath(node.value)}$`;

    case "math":
      return `\\[\n${substituteValuesInMath(node.value)}\n\\]`;

    case "inlineCode":
      // Inline code: `text` → \texttt{escaped text}
      return `\\texttt{${escapeLatexSegment(node.value)}}`;

    case "code":
      if (node.lang === "tex") {
        // Raw LaTeX passthrough
        return node.value;
      }
      // Other code blocks → verbatim. Transliterate Unicode that has no
      // T1 glyph (Greek / math / arrows): \newunicodechar is disabled
      // inside verbatim, so such chars would abort pdflatex.
      return `\\begin{verbatim}\n${transliterateForVerbatim(node.value)}\n\\end{verbatim}`;

    case "link": {
      const text = renderChildren(node).join("");
      const url: string = node.url ?? "";
      if (url.startsWith("#")) {
        const label = url.slice(1);
        // Cross-paper references (e.g. "unital-groebner-bases:def:foo")
        // cannot resolve in a single-paper PDF — render as plain text.
        if (isCrossPaperRef(label)) {
          return `${text}`;
        }
        // Internal cross-ref: [text](#label) → \hyperref[label]{text}
        return `\\hyperref[${label}]{${text}}`;
      }
      // External URL
      return `\\href{${url}}{${text}}`;
    }

    case "list": {
      const env = node.ordered ? "enumerate" : "itemize";
      const items = (node.children ?? [])
        .map((item: any) => `  \\item ${renderListItem(item)}`)
        .join("\n");
      return `\\begin{${env}}\n${items}\n\\end{${env}}`;
    }

    case "listItem":
      return renderListItem(node);

    case "blockquote": {
      const inner = renderChildren(node).join("\n");
      return `\\begin{quote}\n${inner}\n\\end{quote}`;
    }

    case "heading": {
      const depth = node.depth ?? 1;
      const text = renderChildren(node).join("");
      // Block bodies render inside a \chapter + \section context that
      // renderChapter / renderSection already emitted, so `#`-style
      // markdown headings inside a block must NOT introduce new TOC
      // entries — otherwise generic block-body labels ("Statement",
      // "Proof", "Witnesses", "References") flood the chapter outline
      // and obscure the section structure. Map every markdown heading
      // depth to a non-structural LaTeX command:
      //   depth 1-2 (`#`, `##`) → \paragraph (bold inline label)
      //   depth ≥ 3 (`###`+)    → \subparagraph (indented inline)
      // Both commands are unnumbered and excluded from the TOC by
      // LaTeX's default `\setcounter{secnumdepth}{...}` for book/report
      // classes, which is exactly what within-block labels should be.
      const cmds = ["\\paragraph", "\\paragraph", "\\subparagraph"];
      const cmd = cmds[Math.min(depth - 1, cmds.length - 1)];
      return `${cmd}{${text}}`;
    }

    case "thematicBreak":
      return "\\medskip\\noindent\\rule{\\textwidth}{0.4pt}\\medskip";

    case "break":
      return "\\\\";

    case "image": {
      // Markdown image: ![alt](url) → \includegraphics
      // pdflatex cannot consume SVG natively; the convention is to
      // commit a .pdf companion alongside any .svg asset (generated
      // via cairosvg at authoring time) and rewrite the URL here so
      // both the markdown viewer (SVG) and the LaTeX renderer (PDF)
      // pick up the right format from the same source citation.
      const rawUrl: string = node.url ?? "";
      const url = rawUrl.endsWith(".svg")
        ? rawUrl.slice(0, -4) + ".pdf"
        : rawUrl;
      const alt: string = node.alt ?? "";
      const lines: string[] = [];
      lines.push("\\begin{figure}[htbp]");
      lines.push("  \\centering");
      lines.push(`  \\includegraphics[width=\\textwidth]{${url}}`);
      if (alt) {
        lines.push(`  \\caption{${escapeLatex(alt)}}`);
      }
      lines.push("\\end{figure}");
      return lines.join("\n");
    }

    case "table": {
      return renderTable(node);
    }

    case "tableRow":
    case "tableCell":
      // Handled by renderTable; should not be reached directly
      return renderChildren(node).join("");

    case "html": {
      // Raw HTML in markdown — handle <table> elements for LaTeX
      const html: string = node.value ?? "";
      if (html.includes("<table") || html.includes("<tr")) {
        const table = htmlTableToLatex(html);
        if (table) return table;
      }
      // Non-table HTML: strip tags, escape for LaTeX
      return escapeLatex(html.replace(/<[^>]*>/g, ""));
    }

    case "textDirective": {
      // remark-directive inline node: :name[label]{#slug} or :val[name]{key=value}.
      // We recognise:
      //   - :defterm[X] / :refterm[X] → \defterm{slug}{label} / \refterm{slug}{label}
      //   - :val[name]{precision=N format=… units=…} → rendered numeral
      // Unknown directives fall through to children rendering.
      const name: string = node.name ?? "";
      if (name === "val") {
        // :val[<registry-name>]{key=value ...}
        const valName = renderChildren(node).join("").trim();
        const attrs = parseValAttrs(node.attributes);
        return renderValue(valName, attrs, "text");
      }
      if (name === "defterm" || name === "refterm") {
        const label = renderChildren(node).join("").trim();
        const slug = (node.attributes && (node.attributes.id || node.attributes["#"])) || label;
        const slugStr = String(slug).trim();
        const macro = name === "defterm" ? "defterm" : "refterm";
        if (!slugStr) return label;
        if (label && label !== slugStr) {
          return `\\${macro}{${slugStr}}{${label}}`;
        }
        return `\\${macro}{${slugStr}}`;
      }
      // Other text directives: render children only (don't drop content)
      return renderChildren(node).join("");
    }

    case "leafDirective":
    case "containerDirective":
      // Non-inline directives are not currently used; render children if any.
      return renderChildren(node).join("");

    default:
      // Unknown node — render children if any, otherwise empty
      if (node.children) {
        return renderChildren(node).join("");
      }
      return node.value ?? "";
  }
}

/**
 * Render a GFM table node to a LaTeX tabular environment.
 *
 * Reads alignment from `node.align` (array of "left"|"right"|"center"|null)
 * and renders rows with `&` separators and `\\` terminators.
 */
function renderTable(node: any): string {
  const rows: any[] = node.children ?? [];
  if (rows.length === 0) return "";

  // Determine column count and alignment from the first row
  const firstRow = rows[0];
  const ncols = (firstRow.children ?? []).length;
  const aligns: string[] = (node.align ?? []).map((a: string | null) => {
    if (a === "right") return "r";
    if (a === "center") return "c";
    return "l";
  });
  // Pad if align array is shorter than column count
  while (aligns.length < ncols) aligns.push("l");

  const colspec = aligns.join(" ");
  const lines: string[] = [];
  lines.push(`\\begin{tabular}{${colspec}}`);
  lines.push("\\toprule");

  for (let i = 0; i < rows.length; i++) {
    const cells = (rows[i].children ?? []).map((cell: any) =>
      renderChildren(cell).join("")
    );
    lines.push(cells.join(" & ") + " \\\\");
    // Add midrule after header row
    if (i === 0) lines.push("\\midrule");
  }

  lines.push("\\bottomrule");
  lines.push("\\end{tabular}");
  return lines.join("\n");
}

/** Render all children of a node. */
function renderChildren(node: any): string[] {
  return (node.children ?? []).map((child: any) => renderMdastNode(child));
}

/** Render a list item's content (unwrap single-paragraph items). */
function renderListItem(item: any): string {
  const children = item.children ?? [];
  // Single-paragraph list items: render inline (no extra \par)
  if (children.length === 1 && children[0].type === "paragraph") {
    return renderChildren(children[0]).join("");
  }
  // Multi-block list items: render each block
  return children.map((c: any) => renderMdastNode(c)).join("\n");
}

// ── Block → LaTeX rendering ──────────────────────────────────────

/** LaTeX environment names for each block kind. */
const ENV_NAMES: Record<string, string> = {
  definition: "definition",
  theorem: "theorem",
  lemma: "lemma",
  proposition: "proposition",
  corollary: "corollary",
  // `algorithmblock` (not `algorithm`) to avoid colliding with the
  // LaTeX `algorithm` float package used for pseudocode floats in
  // e.g. atom-knot-mass-derivation.md.
  algorithm: "algorithmblock",
  conjecture: "conjecture",
  example: "example",
  remark: "remark",
  proof: "proof",
  simulator: "remark",  // simulators render as remarks in LaTeX with snapshot
};

/**
 * Render a single block to LaTeX.
 *
 * @param block - The typed block manifest
 * @param mdContent - Markdown content from the sibling .md file
 * @param sourceDir - Directory containing the block source files (relative to repo root)
 * @returns LaTeX string
 */
export function renderBlock(
  block: Block,
  mdContent: string,
  sourceDir?: string,
  rootName?: string,
): string {
  const lines: string[] = [];

  // Build the `\sourcebase`-relative path for the .md GitHub link.  The
  // `\sourcebase` macro points at `content/`, so we strip a leading
  // `content/` from `sourceDir` if present and append `<rootName>.md`.
  const mdRelPath = (sourceDir && rootName)
    ? `${sourceDir.replace(/^content\//, "")}/${rootName}.md`
    : "";

  switch (block.kind) {
    case "prose": {
      lines.push(markdownToLatex(mdContent));
      break;
    }

    case "equation": {
      // Use extractMathContent (not markdownToLatex) to avoid list
      // environments inside math mode.
      const tex = block.tex || extractMathContent(mdContent);
      if (block.label) {
        lines.push("\\begin{equation}");
        lines.push(`  \\label{${block.label}}`);
        lines.push(`  ${tex}`);
        lines.push("\\end{equation}");
      } else {
        lines.push("\\[");
        lines.push(`  ${tex}`);
        lines.push("\\]");
      }
      break;
    }

    case "diagram": {
      const figFile = block.meta?.file as string | undefined;
      if (figFile) {
        // Image-based figure: meta.file points to an image asset.
        // Resolve to a path that will exist when latexmk runs from the
        // repo root.  Two conventions are supported:
        //   (a) chapter-local figures at `content/<sourceDir>/<figFile>`
        //       (e.g. bach2013-double-slit/.../figures/foo.png)
        //   (b) repo-root figures at `<figFile>` itself
        //       (e.g. quantum-observable-universe figures live at
        //        the top-level `figures/` directory per the PR #1075
        //        workplan and the witness JSON svg_path/pdf_path)
        // Prefer (a) when it exists on disk; otherwise fall back to
        // (b) when that file exists; otherwise emit the chapter-local
        // path so the missing-file error points at the conventional
        // location.  The cwd at build time may be either the repo root
        // or `content/`, so probe both layouts when checking existence.
        let figPath: string;
        if (sourceDir) {
          const chapterLocal = join("content", sourceDir, figFile);
          const cwd = process.cwd();
          const chapterLocalExists =
            existsSync(chapterLocal) ||
            existsSync(join(cwd, chapterLocal)) ||
            existsSync(join(cwd, "..", chapterLocal)) ||
            existsSync(join(cwd, sourceDir, figFile));
          const repoRootExists =
            existsSync(figFile) ||
            existsSync(join(cwd, figFile)) ||
            existsSync(join(cwd, "..", figFile));
          if (chapterLocalExists) {
            figPath = chapterLocal;
          } else if (repoRootExists) {
            figPath = figFile;
          } else {
            figPath = chapterLocal;
          }
        } else {
          figPath = figFile;
        }
        lines.push("\\begin{figure}[htbp]");
        lines.push("  \\centering");
        lines.push(`  \\includegraphics[width=\\textwidth]{${figPath}}`);
        if (block.label) lines.push(`  \\label{${block.label}}`);
        // Caption from block.caption or block title (extra field from builders)
        const caption = block.caption || (block as any).title || "";
        if (caption) lines.push(`  \\caption{${escapeLatex(caption)}}`);
        lines.push("\\end{figure}");
      } else {
        // TeX-based diagram (tikzcd, etc.)
        // Use markdownToLatex (not extractMathContent) so that prose
        // paragraphs surrounding the tikzcd block render correctly —
        // in particular, inline math keeps its $...$ delimiters.
        const tex = block.tex || markdownToLatex(mdContent);
        if (block.label) lines.push(`% diagram: ${block.label}`);
        lines.push(tex);
        if (block.caption) lines.push(`% caption: ${escapeLatex(block.caption)}`);
      }
      break;
    }

    case "simulator": {
      // Simulators render as remarks in LaTeX with a reference to
      // the interactive version. The .md content describes the
      // simulator and its default view.
      const titleArg = block.title ? `[{${escapeLatex(block.title)}}]` : "[{Interactive Simulation}]";
      lines.push(`\\begin{remark}${titleArg}`);
      if (block.label) {
        lines.push(`  \\label{${block.label}}`);
        lines.push(`  \\blockannot{${block.label}}{}{${mdRelPath}}`);
      }
      if (block.uses?.length) {
        lines.push(`  \\uses{${block.uses.join(", ")}}`);
      }
      // Render snapshot if available
      if (block.rendered?.length) {
        const snap = block.rendered[0];
        lines.push(`  \\begin{center}`);
        lines.push(`    \\includegraphics[width=0.8\\textwidth]{${snap.url}}`);
        lines.push(`  \\end{center}`);
      }
      lines.push(markdownToLatex(mdContent));
      lines.push(`\\end{remark}`);
      break;
    }

    case "table": {
      // Standalone table block.  Rendered as a LaTeX table float
      // (unless content uses longtable, which cannot be nested in a float).
      // The .md content may contain a markdown table (pipe-delimited) or raw TeX.
      if (block.label) lines.push(`% table: ${block.label}`);
      const caption = block.caption || ("title" in block && block.title) || "";
      // Use block.tex if provided, otherwise render from .md
      const tex = block.tex || markdownToLatex(mdContent);
      const isLongtable = tex.includes("\\begin{longtable");
      if (caption && !isLongtable) {
        lines.push("\\begin{table}[htbp]");
        lines.push("  \\centering");
        lines.push(`  \\caption{${escapeLatex(String(caption))}}`);
        if (block.label) lines.push(`  \\label{${block.label}}`);
      }
      lines.push(tex);
      if (caption && isLongtable) {
        // For longtable, caption and label go outside the float
        if (block.label) lines.push(`\\label{${block.label}}`);
      }
      if (caption && !isLongtable) {
        lines.push("\\end{table}");
      }
      break;
    }

    default: {
      // Environment blocks (definition, theorem, etc.)
      const envName = ENV_NAMES[block.kind];
      if (!envName) throw new Error(`Unknown block kind: ${block.kind}`);

      const titleArg = "title" in block && block.title ? `[{${escapeLatex(block.title)}}]` : "";
      lines.push(`\\begin{${envName}}${titleArg}`);

      // Label + margin annotation (4-icon strip in the right margin:
      //   ∀ → Lean docs page (if any)
      //   ∇ → .md source on GitHub
      //   # → GitHub issues filtered by label
      //   + → "add comment" pre-filled with block label
      // The annotation strip is emitted as a single \blockannot /
      // \blockannotok macro call so adjacent block annotations don't
      // collide in the margin.  See latex/preamble.tex for the macro
      // definitions.
      if ("label" in block && block.label) {
        lines.push(`  \\label{${block.label}}`);

        // Resolve the Lean declaration (without the `<package>:` URI prefix).
        let leanDecl = "";
        if ("lean" in block && block.lean?.ref) {
          try {
            leanDecl = parseLeanRef(block.lean.ref).decl;
          } catch {
            leanDecl = block.lean.ref;
          }
        }

        const sorryFree = "lean" in block && block.lean?.sorryFree === true;
        const macro = sorryFree ? "blockannotok" : "blockannot";
        lines.push(`  \\${macro}{${block.label}}{${leanDecl}}{${mdRelPath}}`);
      }

      // Uses
      if ("uses" in block && block.uses?.length) {
        lines.push(`  \\uses{${block.uses.join(", ")}}`);
      }

      // Body content
      const body = markdownToLatex(mdContent);
      lines.push(body);

      lines.push(`\\end{${envName}}`);
      break;
    }
  }

  // Author notes (kind: "status" | "caveat" | "note" | "refined-framing"
  // | "deprecated") are skipped from the default render and only emitted
  // when the WITH_AUTHOR_NOTES environment variable is set. This is the
  // post-migration replacement for `> **Status: …**` / `> **Caveat …**`
  // blockquote-banner-in-prose patterns (one-voice-audit Category H).
  // See BlockBase.authorNotes in folio-assistant/schemas/types.ts.
  //
  // `block.authorNotes` is typed on BlockBase, so direct access (no
  // `any` cast) is type-safe. The `?? []` defends against the
  // narrow case where TypeScript narrows the discriminated union
  // to a member that doesn't widen authorNotes back to the BlockBase
  // optional.
  if (process.env.WITH_AUTHOR_NOTES === "1"
      && "authorNotes" in block
      && block.authorNotes?.length) {
    const notes = block.authorNotes;
    lines.push("");
    lines.push("\\begin{quote}\\small\\textit{Author notes (working draft):}");
    for (const n of notes) {
      const dateStr = n.date ? ` (${escapeLatex(n.date)})` : "";
      // For `see`: if it looks like an internal block label
      // (matches `^(def|prop|thm|lem|cor|rem|conj|ex|sim|fig|tbl):`),
      // render as a hyperref cross-reference; otherwise treat as a
      // URL (or external link) via \url{}. Internal refs render
      // clickably in the PDF.
      const isInternalRef = (s: string) =>
        /^(def|prop|thm|lem|cor|rem|conj|ex|sim|fig|tbl):/.test(s);
      const seeRendered = n.see
        ? (isInternalRef(n.see)
            ? ` \\textit{See:} \\hyperref[${n.see}]{\\nameref{${n.see}}}.`
            : ` \\textit{See:} \\url{${n.see}}.`)
        : "";
      lines.push("");
      lines.push(
        `\\textbf{${escapeLatex(n.kind)}${dateStr}.} ${markdownToLatex(n.body)}${seeRendered}`,
      );
    }
    lines.push("\\end{quote}");
  }

  return lines.join("\n");
}

// ── Print-mode block filtering ───────────────────────────────────

/** Block kinds that are excluded in compact mode unless referenced. */
const COMPACT_OPTIONAL_KINDS = new Set(["example", "remark"]);

/**
 * Collect labels of examples/remarks referenced by blocks in a section.
 *
 * Scans all blocks in the section for `examples[]` fields (on definitions,
 * theorems, lemmas, propositions, corollaries) and returns the set of
 * referenced labels.
 */
function collectReferencedLabels(
  rootNames: string[],
  blocks: Map<string, { block: Block; mdContent: string; sourceDir?: string }>,
): Set<string> {
  const refs = new Set<string>();
  for (const rootName of rootNames) {
    const entry = blocks.get(rootName);
    if (!entry) continue;
    const block = entry.block;
    // Guard against non-object entries (a block with falsy / primitive
    // `.block` would throw on `"examples" in block` — observed with some
    // stub manifests; CI caught this on PR #383 / pre-existing on main).
    if (!block || typeof block !== "object") continue;
    if ("examples" in block && Array.isArray(block.examples)) {
      for (const label of block.examples) refs.add(label);
    }
  }
  return refs;
}

/**
 * Determine whether a block should be included in the current render.
 *
 * - In formal mode: all blocks included.
 * - In compact mode: example/remark blocks are excluded UNLESS they
 *   are directly referenced via `examples[]` by another block in the
 *   same section (and `compactInlineRefs` is true).
 */
function shouldIncludeBlock(
  block: Block,
  referencedLabels: Set<string>,
  opts: RenderOptions,
): boolean {
  const mode = opts.printMode ?? "compact";
  if (mode === "formal") return true;

  // Defensive: some block loaders may hand us a malformed entry
  // (observed during concurrent PR work — PR #383 CI).  Exclude from
  // compact render rather than throw.
  if (!block || typeof block !== "object" || !("kind" in block)) {
    return false;
  }

  // Compact mode — check if this is an optional kind
  if (!COMPACT_OPTIONAL_KINDS.has(block.kind)) return true;

  // compactInlineRefs defaults to true
  const inlineRefs = opts.compactInlineRefs ?? true;
  if (!inlineRefs) return false;

  // Include if this block's label is referenced by another block
  const label = "label" in block ? block.label : undefined;
  return label != null && referencedLabels.has(label);
}

// ── Chapter rendering ────────────────────────────────────────────

/**
 * Load a block's .ts manifest and .md content, render to LaTeX.
 *
 * @param rootName - Block root name (e.g. "quantum-universe")
 * @param objectsDir - Directory containing object files
 */
export function loadAndRenderBlock(rootName: string, objectsDir: string): {
  latex: string;
  block: Block;
  mdContent: string;
} {
  const tsPath = join(objectsDir, `${rootName}.ts`);
  const mdPath = join(objectsDir, `${rootName}.md`);

  if (!existsSync(tsPath)) {
    throw new Error(`Block manifest not found: ${tsPath}`);
  }

  // Dynamic import of .ts manifest (works with bun)
  // Note: actual import is async — see renderChapter for the async version
  const mdContent = existsSync(mdPath) ? readFileSync(mdPath, "utf-8") : "";

  // Placeholder — actual block loading happens in async pipeline
  return { latex: "", block: { kind: "prose" } as Block, mdContent };
}

/**
 * Render a full section to LaTeX.
 *
 * @param section - Section manifest
 * @param blocks - All loaded blocks (keyed by root name)
 * @param opts - Print mode options (controls block filtering)
 * @param chapterReferencedLabels - Optional chapter-wide set of labels
 *   referenced via `examples[]` on any block in the chapter. When provided,
 *   supplements the section-local set so that cross-section example
 *   references are honoured in compact mode.
 */
export function renderSection(
  section: Section,
  blocks: Map<string, { block: Block; mdContent: string; sourceDir?: string }>,
  opts: RenderOptions = {},
  chapterReferencedLabels?: Set<string>,
): string {
  const lines: string[] = [];
  const sectionLabel = section.label ? `\\label{${section.label}}` : "";
  // Section heading + margin annotation (tracker + comment-stub for the
  // whole section).  Only emit \sectionannot when the section carries a
  // label — anonymous sections have nothing to filter the tracker by.
  lines.push(`\\section{${escapeLatex(section.title)}}`);
  if (section.label) {
    lines.push(sectionLabel);
    lines.push(`\\sectionannot{${section.label}}`);
  }

  // Subsections (one structural level deeper → \subsection). Their
  // blocks share the section's compact-mode reference set.
  const subsections: Section[] = Array.isArray(section.subsections)
    ? section.subsections.filter((s): s is Section => "blocks" in s)
    : [];

  // Collect referenced example/remark labels for compact-mode filtering
  // Merge section-local refs with chapter-wide refs when available
  const sectionRefs = collectReferencedLabels(
    [...section.blocks, ...subsections.flatMap((s) => s.blocks)],
    blocks,
  );
  const referencedLabels = chapterReferencedLabels
    ? new Set([...sectionRefs, ...chapterReferencedLabels])
    : sectionRefs;

  const renderBlockList = (blockNames: string[]) => {
    for (const rootName of blockNames) {
      const entry = blocks.get(rootName);
      if (!entry) {
        lines.push(`% ERROR: block "${rootName}" not found`);
        continue;
      }
      if (!shouldIncludeBlock(entry.block, referencedLabels, opts)) {
        // Emit a phantom label so \hyperref[label]{...} references from
        // other blocks resolve without "Hyper reference undefined" warnings.
        const label = (entry.block && typeof entry.block === "object"
            && "label" in entry.block)
          ? (entry.block as { label?: string }).label
          : undefined;
        if (label) {
          lines.push(`\\phantomsection\\label{${label}}% compact-mode: block excluded`);
        }
        continue;
      }
      lines.push(renderBlock(entry.block, entry.mdContent, entry.sourceDir, rootName));
      lines.push(""); // blank line between blocks
    }
  };

  renderBlockList(section.blocks);

  for (const sub of subsections) {
    lines.push(`\\subsection{${escapeLatex(sub.title)}}`);
    if (sub.label) {
      lines.push(`\\label{${sub.label}}`);
      lines.push(`\\sectionannot{${sub.label}}`);
    }
    renderBlockList(sub.blocks);
  }

  return lines.join("\n");
}

/**
 * Render a full chapter to LaTeX, including chapter-end bibliography.
 *
 * @param chapter - Chapter manifest
 * @param blocks - All loaded blocks (keyed by root name)
 * @param opts - Print mode options (controls block filtering and affiliations)
 */
export function renderChapter(
  chapter: Chapter,
  blocks: Map<string, { block: Block; mdContent: string; sourceDir?: string }>,
  opts: RenderOptions = {},
  chapterDir?: string,
  paperSlug?: string,
): string {
  const lines: string[] = [];
  // Each chapter starts on a new page
  lines.push("\\clearpage");
  const labelLine = chapter.label ? `\\label{${chapter.label}}\n` : "";
  // Chapters with tabLabel are unnumbered (\chapter*); all others are auto-numbered by LaTeX.
  const star = chapter.tabLabel != null ? "*" : "";
  lines.push(`\\chapter${star}{${escapeLatex(chapter.title)}}\n${labelLine}`);
  // Chapter-level margin annotation: link to the chapter directory + tracker.
  // We use the chapter's own label as the tracker filter; if the chapter
  // has no label, fall back to filtering by the chapter dir name so
  // GitHub issues referencing the dir still surface.
  if (chapterDir && paperSlug) {
    const trackerLabel = chapter.label ?? chapterDir;
    lines.push(`\\chapterannot{${paperSlug}/${chapterDir}}{${trackerLabel}}`);
  }

  // Collect all citation keys used in this chapter
  const chapterCites = new Set<string>();

  // Collect chapter-wide referenced labels (from examples[] on ALL blocks
  // in this chapter) so compact-mode filtering works across sections.
  // Every block in the chapter, including subsection blocks (one level
  // deeper), so compact-mode filtering + citation collection see the
  // whole tree.
  const sectionAllBlocks = (sec: Section): string[] => [
    ...sec.blocks,
    ...(Array.isArray(sec.subsections)
      ? sec.subsections.flatMap((s) => ("blocks" in s ? (s as Section).blocks : []))
      : []),
  ];
  const allChapterBlockNames: string[] = [];
  for (const section of chapter.sections) {
    if (!("blocks" in section)) continue;
    allChapterBlockNames.push(...sectionAllBlocks(section as Section));
  }
  const chapterReferencedLabels = collectReferencedLabels(allChapterBlockNames, blocks);

  for (const section of chapter.sections) {
    if (!("blocks" in section)) continue;
    const sec = section as Section;
    for (const rootName of sectionAllBlocks(sec)) {
      const entry = blocks.get(rootName);
      if (!entry) continue;
      for (const key of extractCitations(entry.mdContent)) {
        chapterCites.add(key);
      }
      if (entry.block && typeof entry.block === "object" &&
          "cites" in entry.block && (entry.block as any).cites) {
        for (const key of (entry.block as any).cites as string[]) {
          chapterCites.add(key);
        }
      }
    }
    lines.push(renderSection(sec, blocks, opts, chapterReferencedLabels));
  }

  // Per-chapter bibliography removed — all references are collected in
  // Appendix B at the end of the paper (see generate-main-tex.ts).

  return lines.join("\n");
}

// ── AST validation ───────────────────────────────────────────────

export interface AstValidationResult {
  valid: boolean;
  /** Parsing errors from unified-latex. */
  errors: string[];
  /** Number of AST nodes produced. */
  nodeCount: number;
}

/**
 * Validate rendered LaTeX by parsing it through unified-latex.
 *
 * This catches:
 *   - Unbalanced braces
 *   - Malformed environments (\begin without \end)
 *   - Invalid macro syntax
 *
 * Use in build tests to ensure rendered output is valid LaTeX.
 */
export function validateLatexAst(latex: string): AstValidationResult {
  const errors: string[] = [];
  let nodeCount = 0;

  try {
    const ast = parse(latex);
    nodeCount = countNodes(ast);

    // Check for unmatched environments
    checkEnvironmentBalance(ast.content, errors);

    // Check for bare `#` outside macro definitions. A bare `#` token
    // (catcode 6, "macro parameter character") in rendered output
    // causes pdflatex to abort with "You can't use `macro parameter
    // character #' in restricted horizontal mode" when the surrounding
    // context is a table cell, \mbox{}, \text{}, etc. Authoring should
    // always use \# (which produces the # glyph) or a literal #
    // inside verbatim. Parameter slots #1…#9 inside \newcommand /
    // \def / \DeclareRobustCommand argument bodies are legitimate
    // and are filtered out by the walker below.
    checkBareHash(ast.content, errors, /* inMacroDef */ false);
  } catch (e) {
    errors.push(`Parse error: ${e instanceof Error ? e.message : String(e)}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    nodeCount,
  };
}

function countNodes(node: any): number {
  let count = 1;
  if (node.content && Array.isArray(node.content)) {
    for (const child of node.content) {
      count += countNodes(child);
    }
  }
  if (node.args && Array.isArray(node.args)) {
    for (const arg of node.args) {
      count += countNodes(arg);
    }
  }
  return count;
}

function checkEnvironmentBalance(nodes: any[], errors: string[]): void {
  for (const node of nodes) {
    if (node.type === "environment" && !node.env) {
      errors.push("Environment node with missing env name");
    }
    if (node.content && Array.isArray(node.content)) {
      checkEnvironmentBalance(node.content, errors);
    }
  }
}

/** Macros whose argument bodies legitimately contain #1…#9 parameter
 *  slots. The walker enters `inMacroDef=true` for their content args. */
const MACRO_DEF_NAMES = new Set([
  "newcommand", "renewcommand", "providecommand",
  "DeclareRobustCommand", "DeclarePairedDelimiter",
  "def", "edef", "gdef", "xdef",
  "newenvironment", "renewenvironment",
  "NewDocumentCommand", "DeclareDocumentCommand",
  "RenewDocumentCommand", "ProvideDocumentCommand",
]);

/** Environments whose body is a verbatim block — `#` is literal there. */
const VERBATIM_ENVS = new Set([
  "verbatim", "verbatim*", "lstlisting", "minted",
  "alltt", "BVerbatim", "Verbatim",
]);

/** Macros that read their first argument as a URL — `#` is the legal
 *  URL fragment delimiter and hyperref re-catcodes it internally. */
const URL_MACROS = new Set(["href", "url", "nolinkurl", "hyperref", "hyperlink", "hypertarget"]);

function checkBareHash(
  nodes: any[],
  errors: string[],
  inMacroDef: boolean,
): void {
  for (const node of nodes) {
    // Verbatim environments: # is literal, skip entirely.
    if (node.type === "environment" && VERBATIM_ENVS.has(node.env)) {
      continue;
    }
    // unified-latex tokenises bare `#` as a "parameter" node (or
    // "string"/"macro" in some configurations). Flag it unless we're
    // inside a macro-definition body.
    if (
      !inMacroDef &&
      (node.type === "parameter" ||
        (node.type === "string" && typeof node.content === "string" && /^#\d?$/.test(node.content)))
    ) {
      errors.push(
        `Bare # outside macro definition (use \\# to typeset the # character)`,
      );
    }
    // Recurse. Enter macro-def mode for the *argument bodies* of
    // command-defining macros so #1…#9 inside `\newcommand{\foo}[1]{#1}`
    // is accepted.
    const enterMacroDef = inMacroDef ||
      (node.type === "macro" && MACRO_DEF_NAMES.has(node.content));
    if (node.content && Array.isArray(node.content)) {
      checkBareHash(node.content, errors, enterMacroDef);
    }
    if (node.args && Array.isArray(node.args)) {
      // URL macros (href, url, hyperref, …) read URL / label arguments
      // where `#` is the legitimate URL-fragment delimiter. hyperref
      // re-catcodes them internally so they don't reach the # check.
      // Skip every argument of those macros — accepting that we won't
      // catch `#` in the visible text, which is rare and caught by
      // the math-link detector for the common case.
      const isUrlMacro = node.type === "macro" && URL_MACROS.has(node.content);
      if (isUrlMacro) continue;
      for (const arg of node.args) {
        if (arg && arg.content && Array.isArray(arg.content)) {
          checkBareHash(arg.content, errors, enterMacroDef);
        }
      }
    }
  }
}
